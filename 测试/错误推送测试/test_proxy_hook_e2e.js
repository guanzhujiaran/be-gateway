/**
 * 代理链路 → 采集 → 推送 的端到端验证（临时）。
 *
 * 起一个假的「上游」服务（固定返回 500），用真实 http-proxy-middleware +
 * buildProxyHooks 构建网关代理，打 3 次请求后 flush，验证：
 *  1. proxyRes 钩子确实被触发（上游 5xx 不是盲区）；
 *  2. 客户端拿到的仍是上游原始 500（采集不影响转发）；
 *  3. 3 次错误聚合成 1 条推送，count=3；
 *  4. 推送走 be-message RPC 主通道（RPC 打桩，不真发）；
 *  5. 路径 query 已被脱敏。
 *
 * 运行：node 测试/错误推送测试/test_proxy_hook_e2e.js
 */
require("module-alias/register");
const express = require("express");
const axios = require("axios");
const {
  createProxyMiddleware,
  fixRequestBody,
} = require("http-proxy-middleware");
const errorReporter = require("@/ExpressServerEnd/MiddleWare/ErrorReporter");
const rpcClient = require("@/ExpressServerEnd/Service/mq/rpc_client");
const { buildProxyHooks } = require("@/ExpressServerEnd/Controller/ProxyHelper");

const UPSTREAM_PORT = 18999;
const GATEWAY_PORT = 18998;

// 记录推送内容：主通道 RPC 打桩（避免测试刷屏），直连通道拦截 axios
const pushed = [];
rpcClient.callRpc = async (method, params, options) => {
  pushed.push({ via: `rpc:${options && options.prefix}.${method}`, ...params });
  return { code: 0, data: { success: true } };
};
const origPost = axios.post;
axios.post = async (url, body, cfg) => {
  const resp = await origPost(url, body, cfg);
  pushed.push({ via: `direct:${url}`, ...body });
  return resp;
};

function assert(cond, msg) {
  if (!cond) throw new Error(`断言失败: ${msg}`);
  console.log(`  [PASS] ${msg}`);
}

function listen(app, port) {
  return new Promise((resolve) => {
    const server = app.listen(port, "127.0.0.1", () => resolve(server));
  });
}

async function main() {
  // 降低阈值，避免测试时刷屏（KIND_THRESHOLD 是导出对象，可直接改）
  errorReporter.KIND_THRESHOLD.upstream_5xx = 1;

  const upstream = express();
  upstream.all("/*splat", (req, res) => {
    res.status(500).json({ code: 500, msg: "mock upstream boom" });
  });
  const upstreamServer = await listen(upstream, UPSTREAM_PORT);

  const gateway = express();
  gateway.use(
    "/api/v1/mock",
    createProxyMiddleware({
      target: `http://127.0.0.1:${UPSTREAM_PORT}`,
      pathRewrite: { "^/": "/" },
      on: {
        proxyReq: (proxyReq, req) => fixRequestBody(proxyReq, req),
        ...buildProxyHooks("message"),
      },
    }),
  );
  const gatewayServer = await listen(gateway, GATEWAY_PORT);

  console.log("=== 端到端：3 次上游 500 ===");
  for (let i = 0; i < 3; i += 1) {
    const resp = await axios.get(
      `http://127.0.0.1:${GATEWAY_PORT}/api/v1/mock/boom?mid=123&token=secret`,
      { validateStatus: () => true },
    );
    assert(resp.status === 500, `第 ${i + 1} 次客户端仍拿到上游 500（采集未影响转发）`);
  }

  const before = pushed.length;
  await errorReporter.flush();
  assert(pushed.length === before + 1, "3 次错误聚合成 1 条推送");
  const alert = pushed[pushed.length - 1];
  console.log(`  推送通道: ${alert.via}\n  标题: ${alert.title}\n${alert.content.split("\n").map((l) => `      ${l}`).join("\n")}`);
  assert(alert.via === "rpc:message.push.rpc.send_push_now", "走 be-message RPC 主通道");
  assert(alert.content.includes("x3"), "推送内容计数为 x3");
  assert(alert.content.includes("上游: message"), "推送内容含上游短名");
  assert(!alert.content.includes("secret"), "query 已脱敏，不含 token");
  assert(alert.content.includes("GET /api/v1/mock/boom"), "路径已归一化");

  console.log("\n端到端用例全部通过");
  await new Promise((r) => gatewayServer.close(r));
  await new Promise((r) => upstreamServer.close(r));
  errorReporter.stop();
}

main().catch((e) => {
  console.error("测试失败：", e);
  process.exit(1);
});
