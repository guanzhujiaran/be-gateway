/**
 * 网关错误推送链路验证脚本。
 *
 * 覆盖：
 *  1. normalizePath 归一化 / 脱敏；
 *  2. 主通道：真实走 be-message RPC `message.push.rpc.send_push_now`（需 be-message + RabbitMQ 在跑）；
 *  3. 兜底：RPC 抛错 / 返回 success=false 时降级直连 pushme，标题带 [降级直连]；
 *  4. 节奏：首次出现即推（x1）；冷却期内同类错误只累计不推送；冷却结束后汇总推送（x4）；
 *  5. notifyExit 同步 curl 真实推送。
 *
 * 运行：node 测试/错误推送测试/test_error_push.js
 */
require("module-alias/register");
const axios = require("axios");
const errorReporter = require("@/ExpressServerEnd/MiddleWare/ErrorReporter");
const rpcClient = require("@/ExpressServerEnd/Service/mq/rpc_client");
const { notifyExit } = require("@/ExpressServerEnd/MiddleWare/ExitNotifier");

const sent = [];
const rpcCalls = [];

// 拦截真实出网，只记录不改变行为
const origPost = axios.post;
axios.post = async (url, body, cfg) => {
  const resp = await origPost(url, body, cfg);
  sent.push({ url, body });
  console.log(
    `  >>> 直连出网 ${url}\n      标题: ${body.title}\n      响应: ${JSON.stringify(resp.data)}`,
  );
  return resp;
};

const origCallRpc = rpcClient.callRpc;
let rpcOverride = null; // null=真实调用；函数=测试桩

rpcClient.callRpc = async (method, params, options) => {
  rpcCalls.push({ method, params, options });
  if (rpcOverride) return rpcOverride(method, params, options);
  const resp = await origCallRpc(method, params, options);
  console.log(
    `  >>> RPC ${options && options.prefix}.${method}\n      标题: ${params.title}\n      响应: ${JSON.stringify(resp)}`,
  );
  return resp;
};

function assert(cond, msg) {
  if (!cond) throw new Error(`断言失败: ${msg}`);
  console.log(`  [PASS] ${msg}`);
}

/**
 * 采集一条 proxy_error。
 * @param {string} suffix 路径后缀（不同后缀 = 不同系列，互不影响冷却期）
 */
function collectProxyError(suffix) {
  errorReporter.collect({
    kind: "proxy_error",
    status: 0,
    method: "GET",
    path: `/api/v1/rpa/task/${suffix}?secret=zzz`,
    upstream: "rpa",
    mid: "10001",
    code: "ECONNREFUSED",
  });
}

async function main() {
  console.log("=== 1. normalizePath ===");
  assert(errorReporter.normalizePath("/api/v1/user/123?token=abc#x") === "/api/v1/user/:id", "数字段归一化 + 丢弃 query/hash");
  assert(
    errorReporter.normalizePath("/api/v1/x/abcdef0123456789abcdef") === "/api/v1/x/:hash",
    "长哈希归一化为 :hash",
  );
  assert(errorReporter.normalizePath("") === "/", "空路径兜底为 /");

  console.log("\n=== 2. 主通道：真实 be-message RPC send_push_now ===");
  collectProxyError("123");
  const beforeRpc = rpcCalls.length;
  const beforeDirect = sent.length;
  await errorReporter.flush();
  assert(rpcCalls.length === beforeRpc + 1, "优先走 be-message RPC");
  assert(rpcCalls[0].method === "send_push_now", "调用 send_push_now（同步可拿结果）");
  assert(
    rpcCalls[0].options && rpcCalls[0].options.prefix === "message.push.rpc",
    "路由前缀为 message.push.rpc",
  );
  assert(sent.length === beforeDirect, "主通道成功时不走直连");

  console.log("\n=== 3. 兜底：RPC 抛错 / 返回 success=false ===");
  rpcOverride = () => {
    throw new Error("模拟 RabbitMQ 不可用");
  };
  collectProxyError("124");
  const before3 = sent.length;
  await errorReporter.flush();
  assert(sent.length === before3 + 1, "RPC 异常时降级直连推送");
  assert(sent[sent.length - 1].body.title.startsWith("[降级直连]"), "降级推送标题带 [降级直连]");

  rpcOverride = () => ({ code: 0, data: { success: false, message: "无可用渠道" } });
  collectProxyError("125");
  const before3b = sent.length;
  await errorReporter.flush();
  assert(sent.length === before3b + 1, "RPC 返回 success=false 时同样降级直连");

  console.log("\n=== 4. 推送节奏：首次即推 + 冷却期 ===");
  rpcOverride = (method, params) => ({ code: 0, data: { success: true }, _title: params.title });
  const collectUpstream5xx = (times) => {
    for (let i = 0; i < times; i += 1) {
      errorReporter.collect({
        kind: "upstream_5xx",
        status: 500,
        method: "POST",
        path: "/api/v1/user/:id",
        upstream: "message",
        mid: "10002",
        code: "",
      });
    }
  };

  // 首次出现即推：单次 5xx 就要告警（不再等累计阈值）
  collectUpstream5xx(1);
  const before4 = rpcCalls.length;
  await errorReporter.flush();
  assert(rpcCalls.length === before4 + 1, "首次出现即推送 1 次");
  assert(rpcCalls[rpcCalls.length - 1].params.content.includes("x1"), "首推计数为 x1");

  // 冷却期内：同类错误只累计，不推送
  collectUpstream5xx(4);
  const before5 = rpcCalls.length;
  await errorReporter.flush();
  assert(rpcCalls.length === before5, "冷却期内同类错误不推送");

  // 冷却结束：汇总冷却期内累计的次数推一条
  const realNow = Date.now;
  const offset = errorReporter.SERIES_COOLDOWN_MS + 1;
  Date.now = () => realNow() + offset;
  try {
    const before6 = rpcCalls.length;
    await errorReporter.flush();
    assert(rpcCalls.length === before6 + 1, "冷却结束后汇总推送一次");
  } finally {
    Date.now = realNow;
  }
  const lastRpc = rpcCalls[rpcCalls.length - 1];
  assert(lastRpc.params.content.includes("x4"), "推送内容计数为冷却期内累计的 x4");
  assert(lastRpc.params.user_label === "网关告警", "来源标签为「网关告警」");
  assert(lastRpc.params.mid === null, "不传 mid，避免被用户级免打扰拦截");

  console.log("\n=== 5. notifyExit（同步 curl） ===");
  rpcOverride = null;
  notifyExit("推送链路测试", "由 test_error_push.js 触发，可忽略");
  console.log("  [DONE] notifyExit 已执行（无异常即视为成功）");

  console.log(`\n全部用例通过：RPC ${rpcCalls.length} 次，直连兜底 ${sent.length} 次`);
  errorReporter.stop();
  rpcClient.callRpc = origCallRpc;
}

main().catch((e) => {
  console.error("测试失败：", e);
  errorReporter.stop();
  rpcClient.callRpc = origCallRpc;
  process.exit(1);
});
