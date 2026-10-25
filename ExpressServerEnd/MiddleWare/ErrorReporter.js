/**
 * 错误聚合上报器。
 *
 * 设计约束（优先级从高到低）：
 *  1. collect() 零阻塞：只写内存 Map，无网络 / 无文件 / 无 await；
 *  2. 所有出网动作只发生在 flush 定时器里，与请求生命周期彻底解耦；
 *  3. 任何环节失败只打 console.warn，绝不向上抛、绝不影响业务响应。
 *
 * 为什么不复用 utils.my_send_notify.push_me：
 *  该方法已被短路为 `return console.log(...)`（见 BiliPPTR/utils/utils.js 的 push_me），
 *  实际不会发出任何请求。因此这里只复用它的 __push_key token，推送逻辑自行实现。
 *
 * 为什么用进程内 Map 而不是 Redis：
 *  当前网关是单进程 app.listen（无 cluster），进程内聚合已经足够；
 *  多实例部署时每个实例各自推送，告警里带 upstream/path 也能区分来源。
 */
const axios = require("axios");
const { utils } = require("@/ExpressServerEnd/BiliPPTR/utils/utils");

/** 聚合窗口（毫秒） */
const FLUSH_INTERVAL_MS = 10 * 1000;
/** 桶数量上限，超出后丢弃新桶以保护内存 */
const MAX_BUCKETS = 500;
/** 单次推送最多展示的错误类型数（按次数降序） */
const DETAIL_LIMIT = 20;
/** 单次推送超时（毫秒） */
const PUSH_TIMEOUT_MS = 5000;
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
 * 推送文本消息：pushme 优先，失败兜底 push_plus。
 * 两条通道都失败时仅打日志，不重试（下一个窗口会自然再发）。
 * @param {string} title
 * @param {string} content
 * @returns {Promise<void>}
 */
async function pushText(title, content) {
  const sysKey =
    (utils && utils.my_send_notify && utils.my_send_notify.__push_key) || {};
  const post = (url, body) =>
    axios.post(url, body, { timeout: PUSH_TIMEOUT_MS });

  if (sysKey.pushme) {
    try {
      const resp = await post(PUSHME_URL, {
        push_key: sysKey.pushme,
        title,
        content,
      });
      const ok = resp && resp.data && resp.data.data === "success";
      if (ok) return;
      console.warn("pushme 推送未返回 success：", resp && resp.data);
    } catch (e) {
      console.warn("pushme 推送失败：", e && e.message);
    }
  }

  if (!sysKey.push_plus) return;
  try {
    await post(PUSH_PLUS_URL, {
      token: sysKey.push_plus,
      title,
      content,
      template: "txt",
    });
  } catch (e) {
    console.warn("push_plus 兜底推送失败：", e && e.message);
  }
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
