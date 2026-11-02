/**
 * 错误聚合上报器。
 *
 * 设计约束（优先级从高到低）：
 *  1. collect() 零阻塞：只写内存 Map，无网络 / 无文件 / 无 await；
 *  2. 所有出网动作只发生在 flush 定时器里，与请求生命周期彻底解耦；
 *  3. 任何环节失败只打 console.warn，绝不向上抛、绝不影响业务响应。
 *
 * 推送走哪条路：
 *  主通道 = be-message 的 RPC `message.push.rpc.send_push_now`（统一推送执行体，
 *  渠道配置 / 降级顺序 / 模板都由 be-message 管理）；
 *  兜底 = 直连 pushme / pushplus。之所以不是二选一：be-message 挂掉的时刻
 *  恰恰是最需要告警的时刻，主通道不能是唯一通道。
 *
 * 为什么不复用 pptr_op.my_send_notify.push_me：
 *  该方法已被短路为 `return console.log(...)`（见 BiliPPTR/utils/utils.js 的 push_me），
 *  实际不会发出任何请求。因此兜底通道只复用它的 __push_key token，发送自行实现。
 *
 * 注意 token 的挂载位置：`my_send_notify` 属于 utils.js 导出的 `pptr_op`，
 * 不在 `utils` 上。取错会静默拿到空对象 → 永不推送（曾经踩过）。
 *
 * 为什么用进程内 Map 而不是 Redis：
 *  当前网关是单进程 app.listen（无 cluster），进程内聚合已经足够；
 *  多实例部署时每个实例各自推送，告警里带 upstream/path 也能区分来源。
 */
const axios = require("axios");
const {
  utils,
  pptr_op,
} = require("@/ExpressServerEnd/BiliPPTR/utils/utils");
const rpcClient = require("@/ExpressServerEnd/Service/mq/rpc_client");

/** 聚合窗口（毫秒） */
const FLUSH_INTERVAL_MS = 10 * 1000;
/** 桶数量上限，超出后丢弃新桶以保护内存 */
const MAX_BUCKETS = 500;
/** 单次推送最多展示的错误类型数（按次数降序） */
const DETAIL_LIMIT = 20;
/** 单次推送超时（毫秒），直连通道用 */
const PUSH_TIMEOUT_MS = 5000;
/** be-message RPC 推送超时（毫秒）：告警是旁路，不能占着 timer 太久 */
const RPC_PUSH_TIMEOUT_MS = 3000;
/** 未达阈值的桶最长保留时间，超时清空，避免「每次都差一点」永远不告警 */
const SERIES_TTL_MS = 60 * 1000;

const PUSHME_URL = "https://push.i-i.me";
const PUSH_PLUS_URL = "http://www.pushplus.plus/send";

/**
 * 各类型告警阈值：窗口内累计达到该次数才推送。
 *  - proxy_error：连接层故障（上游不可达 / 超时），低频且严重，立即推送；
 *  - upstream_5xx：业务 5xx 存在正常抖动，需要聚合到一定量级；
 *  - gateway_5xx：网关自身异常，容忍度更低。
 * @type {Record<string, number>}
 */
const KIND_THRESHOLD = {
  proxy_error: 1,
  upstream_5xx: 5,
  gateway_5xx: 3,
};

/**
 * @typedef {Object} AlertItem
 * @property {string} kind 错误类型：upstream_5xx / proxy_error / gateway_5xx
 * @property {number} status HTTP 状态码，无响应时为 0
 * @property {string} method 请求方法
 * @property {string} path 原始请求路径（含 query，内部会归一化并脱敏）
 * @property {string} upstream 上游服务短名：crawler / rpa / casdoor / message / gateway
 * @property {string} mid 用户 mid（无登录态时为空串）
 * @property {string} code 错误码（如 ECONNREFUSED），无则为空串
 */

/** @type {Map<string, Object>} */
const buckets = new Map();
/** @type {NodeJS.Timeout|null} */
let timer = null;

/**
 * 路径归一化。
 *
 * 目的有两个：
 *  1. 丢弃 query / hash —— 既防止动态参数撑爆桶，也避免 token 等敏感参数进入推送内容；
 *  2. 把路径中的数字段与长哈希收敛为占位符，让 /user/1 与 /user/2 归入同一类。
 * @param {string} rawPath
 * @returns {string}
 */
function normalizePath(rawPath) {
  const raw = String(rawPath || "").split("?")[0].split("#")[0] || "/";
  const normalized = raw
    .replace(/\/\d+/g, "/:id")
    .replace(/[0-9a-f]{16,}/gi, ":hash")
    .slice(0, 120);
  return normalized || "/";
}

/**
 * 记录一次错误。同步、无 IO、绝不抛异常。
 * @param {AlertItem} item
 * @returns {void}
 */
function collect(item) {
  try {
    if (!item || !item.kind) return;
    const path = normalizePath(item.path);
    const status = Number(item.status) || 0;
    const upstream = item.upstream || "-";
    const code = item.code || "";
    const key = [item.kind, status, upstream, path, code].join("|");
    const now = Date.now();

    const hit = buckets.get(key);
    if (hit) {
      hit.count += 1;
      hit.lastAt = now;
      return;
    }
    // 桶数量已达上限：丢弃新桶，已有桶继续正常累计（保护内存优先）
    if (buckets.size >= MAX_BUCKETS) return;

    buckets.set(key, {
      kind: item.kind,
      status,
      method: item.method || "",
      path,
      upstream,
      mid: item.mid || "",
      code,
      count: 1,
      firstAt: now,
      lastAt: now,
    });
  } catch (e) {
    console.warn("错误采集失败：", e && e.message);
  }
}

/**
 * 主通道：走 be-message 统一推送执行体（RPC `message.push.rpc.send_push_now`）。
 *
 * 为什么走 RPC 而不是 HTTP `/api/v1/message/push/test`：
 *  - RPC 契约（bili_common.rpc.push）明确把 be-gateway 列为调用方，面向服务端系统；
 *  - HTTP 接口依赖 `x-bili-*` 请求头里的用户身份，网关内部调用要伪造身份头，不干净；
 *  - 同步返回 `{success, sent_channels}`，能确认这次到底通没通。
 *
 * 渠道配置、降级顺序、模板、限流全部由 be-message 统一管理，
 * 网关不再关心具体是 pushme 还是 pushplus。
 * @param {string} title
 * @param {string} content
 * @returns {Promise<{ok: boolean, reason?: string}>}
 */
async function pushViaMessageService(title, content) {
  const resp = await rpcClient.callRpc(
    "send_push_now",
    {
      title,
      content,
      push_type: "text",
      // 不指定 per-user 渠道配置：回落到 message-service 的全局配置（服主自己的推送设置）
      config: null,
      user_label: "网关告警",
      // mid 为空：告警不是发给某个终端用户，不做用户级总开关 / 免打扰拦截
      mid: null,
    },
    { prefix: rpcClient.PUSH_ROUTING_PREFIX, timeoutMs: RPC_PUSH_TIMEOUT_MS },
  );

  const data = resp && resp.data;
  if (resp && resp.code === 0 && data && data.success === true) {
    return { ok: true };
  }
  return {
    ok: false,
    reason:
      (resp && resp.msg) ||
      (data && data.message) ||
      `未返回 success: ${JSON.stringify(resp)}`,
  };
}

/**
 * 兜底通道：直连 pushme → pushplus。
 *
 * 为什么必须保留：be-message / RabbitMQ 挂掉的时刻恰恰是最需要告警的时刻
 * （网关全站 502 的原因就是它挂了）。主通道失败时这里仍要能发出去，
 * 代价是渠道配置散在 Node 侧，因此只在降级时使用，并在标题标注来源。
 * @param {string} title
 * @param {string} content
 * @returns {Promise<void>}
 */
async function pushDirect(title, content) {
  const sysKey =
    (pptr_op && pptr_op.my_send_notify && pptr_op.my_send_notify.__push_key) ||
    (utils && utils.my_send_notify && utils.my_send_notify.__push_key) ||
    {};
  const post = (url, body) =>
    axios.post(url, body, { timeout: PUSH_TIMEOUT_MS });

  if (sysKey.pushme) {
    try {
      const resp = await post(PUSHME_URL, {
        push_key: sysKey.pushme,
        title,
        content,
      });
      // pushme 成功时返回**纯文本** "success"（resp.data 是字符串），
      // 兼容个别版本返回 { data: "success" } 的结构。
      const body = resp && resp.data;
      const ok =
        body === "success" || (body && body.data === "success") || body?.code === 200;
      if (ok) return;
      console.warn("pushme 推送未返回 success：", body);
    } catch (e) {
      console.warn("pushme 推送失败：", e && e.message);
    }
  }

  if (!sysKey.push_plus) return;
  try {
    const resp = await post(PUSH_PLUS_URL, {
      token: sysKey.push_plus,
      title,
      content,
      template: "txt",
    });
    const body = resp && resp.data;
    if (!body || body.code !== 200) {
      console.warn("push_plus 兜底推送未成功：", body);
    }
  } catch (e) {
    console.warn("push_plus 兜底推送失败：", e && e.message);
  }
}

/**
 * 推送文本消息：be-message 主通道 → 直连 pushme / pushplus 兜底。
 *
 * 两条都失败时仅打日志，不重试（下一个窗口会自然再发）。
 * 降级时标题加 `[降级直连]` 前缀：这条推送本身就是「统一推送链路故障」的信号。
 * @param {string} title
 * @param {string} content
 * @returns {Promise<void>}
 */
async function pushText(title, content) {
  try {
    const result = await pushViaMessageService(title, content);
    if (result.ok) return;
    console.warn("be-message 统一推送未成功，降级直连：", result.reason);
  } catch (e) {
    console.warn("be-message 统一推送调用失败，降级直连：", e && e.message);
  }
  await pushDirect(`[降级直连] ${title}`, content);
}

/**
 * 汇总当前窗口的桶并推送。
 * 达到阈值的桶推送后删除（下次从 0 重新累计，保证 count 语义为「自上次告警以来」）；
 * 未达阈值但存活超时的桶直接丢弃。
 * @returns {Promise<void>}
 */
async function flush() {
  if (buckets.size === 0) return;

  const now = Date.now();
  const ready = [];
  const expired = [];

  for (const [key, bucket] of buckets) {
    const threshold = KIND_THRESHOLD[bucket.kind] || 1;
    if (bucket.count >= threshold) {
      ready.push({ key, bucket });
    } else if (now - bucket.firstAt >= SERIES_TTL_MS) {
      expired.push(key);
    }
  }

  ready.forEach(({ key }) => buckets.delete(key));
  expired.forEach((key) => buckets.delete(key));

  if (ready.length === 0) return;

  ready.sort((a, b) => b.bucket.count - a.bucket.count);
  const total = ready.reduce((sum, r) => sum + r.bucket.count, 0);

  const lines = ready.slice(0, DETAIL_LIMIT).map(({ bucket }) => {
    const statusText = bucket.status
      ? `HTTP ${bucket.status}`
      : bucket.code || "无状态码";
    return (
      `[${bucket.kind}] ${statusText} x${bucket.count}\n` +
      `  ${bucket.method} ${bucket.path}\n` +
      `  上游: ${bucket.upstream}  mid: ${bucket.mid || "-"}`
    );
  });

  const title = `[网关错误聚合] ${FLUSH_INTERVAL_MS / 1000}s 内 ${total} 次 / ${
    ready.length
  } 类`;
  const content =
    `时间: ${new Date(now).toLocaleString("zh-CN")}\n` +
    `合计: ${total} 次，${ready.length} 类（仅列前 ${DETAIL_LIMIT} 类）\n\n` +
    lines.join("\n\n");

  await pushText(title, content);
}

/**
 * 启动聚合定时器。重复调用无副作用。
 * @returns {void}
 */
function start() {
  if (timer) return;
  timer = setInterval(() => {
    flush().catch((e) => console.warn("错误告警 flush 异常：", e && e.message));
  }, FLUSH_INTERVAL_MS);
  // 不阻止进程退出：网关收到 SIGTERM 后应能立即结束
  if (typeof timer.unref === "function") timer.unref();
}

/**
 * 停止聚合定时器（测试与优雅退出用）。
 * @returns {void}
 */
function stop() {
  if (!timer) return;
  clearInterval(timer);
  timer = null;
}

module.exports = { collect, flush, start, stop, normalizePath, KIND_THRESHOLD };
