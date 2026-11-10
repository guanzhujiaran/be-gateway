/*
 * @Description: 网关启动时对反向代理的上游服务进行连通性健康检查
 *   与 ExpressServerEnd/routes/proxy.js 中配置的代理目标保持一致
 */

const axios = require("axios");
const { utils } = require("@/ExpressServerEnd/BiliPPTR/utils/utils");

/**
 * 获取 gateway 反向代理的上游服务列表
 * 目标地址来源与 routes/proxy.js 中 createProxyMiddleware 的 target 保持一致
 *
 * probe_path：探活路径。FastAPI 侧没有根路由，探根路径会每次打一条
 * `404 Not Found [GET /]` 的 WARNING + 访问日志，纯属噪音，
 * 因此 crawler 的两个角色统一改探轻量的 `/health`（不查库、不连 MQ）。
 * 未配置 probe_path 的上游仍探根路径（行为不变）。
 * @returns {{name:string, route:string, target:(string|undefined), probe_path?:string}[]}
 */
function getUpstreamTargets() {
  return [
    {
      name: "be-bilibili-crawler (fastapi, 写入/控制面)",
      route: "/api/v1/lottery_database/bili/Add*、/api/v1/samsClub/graphql",
      target: utils.MYAPI.base_url,
      probe_path: "/health",
    },
    {
      name: "be-bilibili-crawler-query (fastapi, 只读查询)",
      route: "/api/v1/lottery_database/bili（除 Add* 系列）",
      target: utils.MYAPI.query_base_url,
      probe_path: "/health",
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
      name: "be-message-service (message)",
      route: "/api/v1/message",
      target: utils.MESSAGE.base_url,
    },
  ];
}

/**
 * 拼出探活 URL：上游配了 probe_path 就带上（去掉 target 末尾多余的 /）
 * @param {{target:(string|undefined), probe_path?:string}} item
 * @returns {string}
 */
function buildProbeUrl(item) {
  const base = String(item.target || "");
  if (!item.probe_path) {
    return base;
  }
  return `${base.replace(/\/+$/, "")}${item.probe_path}`;
}

/**
 * 检测单个上游服务是否可达
 * 只要上游返回任意 HTTP 响应（包括 4xx/5xx）即视为服务已启动；
 * 仅连接层面失败（拒绝连接 / DNS 解析失败 / 超时等）才视为不可用
 * @param {{name:string, route:string, target:(string|undefined), probe_path?:string}} item
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
      url: buildProbeUrl(item),
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
        `[✓] ${r.name} 正常 -> ${buildProbeUrl(r)} (HTTP ${r.status}, ${r.cost}ms) 路由: ${r.route}`
      );
    } else {
      console.error(
        `[✗] ${r.name} 不可用 -> ${r.target ? buildProbeUrl(r) : "(未配置)"} 原因: ${r.reason} 路由: ${r.route}`
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
