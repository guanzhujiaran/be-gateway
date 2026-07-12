/*
 * @Description: 网关启动时对反向代理的上游服务进行连通性健康检查
 *   与 ExpressServerEnd/routes/proxy.js 中配置的代理目标保持一致
 */

const axios = require("axios");
const { utils } = require("@/ExpressServerEnd/BiliPPTR/utils/utils");

/**
 * 获取 gateway 反向代理的上游服务列表
 * 目标地址来源与 routes/proxy.js 中 createProxyMiddleware 的 target 保持一致
 * @returns {{name:string, route:string, target:(string|undefined)}[]}
 */
function getUpstreamTargets() {
  return [
    {
      name: "be-bilibili-crawler (fastapi)",
      route: "/api/v1/lottery_database/bili、/api/v1/samsClub/graphql",
      target: utils.MYAPI.base_url,
    },
    {
      name: "rpa-browser (rpa)",
      route: "/api/v1/rpa",
      target: utils.RPA.base_url,
    },
    {
      name: "casdoor",
      route: "/api/v1/casdoor/backend",
      target: process.env.CASDOOR_ENDPOINT,
    },
    {
      name: "be-message-service (notify)",
      route: "/api/v1/notify",
      target: utils.NOTIFY.base_url,
    },
  ];
}

/**
 * 检测单个上游服务是否可达
 * 只要上游返回任意 HTTP 响应（包括 4xx/5xx）即视为服务已启动；
 * 仅连接层面失败（拒绝连接 / DNS 解析失败 / 超时等）才视为不可用
 * @param {{name:string, route:string, target:(string|undefined)}} item
 * @param {number} timeout 单次探测超时时间（毫秒）
 * @returns {Promise<Object>}
 */
async function checkOne(item, timeout) {
  if (!item.target) {
    return {
      ...item,
      ok: false,
      status: null,
      cost: 0,
      reason: "未配置代理目标地址（对应环境变量缺失）",
    };
  }
  const start = Date.now();
  try {
    const resp = await axios.request({
      url: item.target,
      method: "GET",
      timeout,
      validateStatus: () => true, // 只要上游有 HTTP 响应即视为存活
      proxy: false, // 避免受 HTTP_PROXY 等环境变量干扰
      maxRedirects: 0,
    });
    return {
      ...item,
      ok: true,
      status: resp.status,
      cost: Date.now() - start,
    };
  } catch (e) {
    // 收到重定向等非 2xx 时 maxRedirects:0 也会带 response，视为存活
    if (e.response) {
      return {
        ...item,
        ok: true,
        status: e.response.status,
        cost: Date.now() - start,
      };
    }
    return {
      ...item,
      ok: false,
      status: null,
      cost: Date.now() - start,
      reason: e.code || e.message || "未知错误",
    };
  }
}

/**
 * 对所有上游代理服务进行健康检查，并打印检查结果
 * @param {{timeout?:number}} [options]
 * @returns {Promise<Object[]>} 每个上游服务的检查结果
 */
async function checkUpstreamHealth({ timeout = 5000 } = {}) {
  const targets = getUpstreamTargets();
  console.log("========== 网关上游代理服务健康检查开始 ==========");
  const results = await Promise.all(targets.map((t) => checkOne(t, timeout)));
  for (const r of results) {
    if (r.ok) {
      console.log(
        `[✓] ${r.name} 正常 -> ${r.target} (HTTP ${r.status}, ${r.cost}ms) 路由: ${r.route}`
      );
    } else {
      console.error(
        `[✗] ${r.name} 不可用 -> ${r.target || "(未配置)"} 原因: ${r.reason} 路由: ${r.route}`
      );
    }
  }
  const downCount = results.filter((r) => !r.ok).length;
  if (downCount === 0) {
    console.log("========== 上游代理服务全部连接正常 ==========");
  } else {
    console.warn(
      `========== 上游代理服务健康检查完成：${downCount}/${results.length} 个服务不可用 ==========`
    );
  }
  return results;
}

module.exports = { checkUpstreamHealth, getUpstreamTargets };
