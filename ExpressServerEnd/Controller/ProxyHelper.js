/**
 * 反向代理公共工具：错误映射 / 报错推送 / 可信用户头注入。
 *
 * 原先这些函数私有于 ProxyEndPort.js，随着 /api/v1/user 也改为转发 be-message，
 * 抽取到本模块共享，避免多份实现漂移（尤其是 x-bili-* 头的清洗与注入逻辑，
 * 一旦不一致会造成上游鉴权口径不同）。
 */
const axios = require("axios");
const { utils } = require("@/ExpressServerEnd/BiliPPTR/utils/utils");

/**
 * 代理请求错误 -> HTTP 状态码
 * - 超时（proxyTimeout 触发）返回 504 Gateway Timeout
 * - 上游不可达 / 响应无效等请求错误返回 502 Bad Gateway
 * @param {Error} err
 * @returns {number}
 */
function mapProxyErrorToStatus(err) {
  switch (err && err.code) {
    case "ETIMEDOUT":
    case "ESOCKETTIMEDOUT":
      return 504; // 网关等待上游超时
    case "ECONNREFUSED":
    case "ECONNRESET":
    case "ENOTFOUND":
    case "EAI_AGAIN":
    case "EHOSTUNREACH":
    case "ENETUNREACH":
    case "EPIPE":
    case "ECONNABORTED":
    case "EPROTO":
    case "HPE_INVALID_RESPONSE":
    case "HPE_HEADER_OVERFLOW":
      return 502; // 上游不可达 / 响应无效
    default:
      return 502; // 代理请求失败默认 502 Bad Gateway
  }
}

/**
 * 转发路由（代理）报错时发送系统级推送通知（best-effort，失败不影响原错误响应）。
 * 复用 utils.my_send_notify 中配置的系统推送 key（pushme / push_plus）。
 * @param {Error} err
 * @param {Object} req
 */
async function sendProxyErrorPush(err, req) {
  const sysKey =
    (utils && utils.my_send_notify && utils.my_send_notify.__push_key) || {};
  const title = `[转发路由报错] ${req.method || ""} ${req.path || ""}`;
  const msg =
    `来源 Host: ${req.headers && req.headers.host ? req.headers.host : "未知"}\n` +
    `请求路径: ${req.originalUrl || req.path || "未知"}\n` +
    `错误码: ${err && err.code ? err.code : "未知"}\n` +
    `错误信息: ${err && err.message ? err.message : String(err)}\n` +
    `时间: ${new Date().toLocaleString("zh-CN")}`;

  // pushme 优先，失败兜底 push_plus，均为 best-effort
  try {
    await axios.post("https://push.i-i.me", {
      push_key: sysKey.pushme,
      title,
      content: msg,
    });
  } catch (e) {
    console.warn(
      "转发路由报错推送(pushme)失败：",
      e && e.message ? e.message : e,
    );
    try {
      await axios.post("http://www.pushplus.plus/send", {
        token: sysKey.push_plus,
        title,
        content: msg,
        template: "txt",
      });
    } catch (e2) {
      console.warn(
        "转发路由报错推送(push_plus)兜底失败：",
        e2 && e2.message ? e2.message : e2,
      );
    }
  }
}

/**
 * 代理错误处理：记录日志 + 推送告警 + 返回 502/504。
 * @param {Error} err
 * @param {Object} req
 * @param {Object} res
 */
async function proxyErrorHandler(err, req, res) {
  console.error(`代理错误 (${req.host}${req.path}):`, err);
  // 转发路由报错时发送系统级推送通知（await 确保推送完成后再返回响应）
  await sendProxyErrorPush(err, req);
  // 响应已开始（流式/分块传输）时无法再设置状态码，只能断开连接
  if (res.headersSent || res.writableEnded) {
    return res.destroy();
  }
  const status = mapProxyErrorToStatus(err);
  return res.status(status).json({
    code: status,
    data: null,
    msg: `代理请求上游失败`,
    ttl: 1,
  });
}

/**
 * 清空用户传入的不可信头信息并设置用户信息到代理请求头。
 * 依赖 userInfoPreFetchMiddleware 预先挂载的 req.userInfoForHeader。
 * @param {Object} proxyReq - Proxy request object
 * @param {Object} req - Original request object
 */
/**
 * 解析客户端真实 IP（供上游展示「谁在看」）。
 *
 * 客户端真实地址由**前置 nginx**写入 `X-Real-IP` 或 `X-Forwarded-For`
 * （nginx 的 proxy_set_header 会覆盖 / 追加，客户端自带的值在代理层即被替换，
 * 因此这两个头可信）。
 *
 * 取值优先级：
 *   1. `X-Real-IP` —— nginx 常见配置，单个地址，最干净；
 *   2. `X-Forwarded-For` 的**最左值** —— 标准链路中它代表原始客户端；
 *   3. socket 地址 —— 无代理部署时即真实客户端；有代理时是代理自身。
 *
 * ⚠️ 前提是网关不直接暴露公网。若绕过 nginx 直连网关，前两个头可被伪造，
 * 此时应改为只信任 socket 地址。
 *
 * @param {Object} req
 * @returns {string} 客户端 IP，解析失败返回空串
 */
function resolveClientIp(req) {
  const headers = req.headers || {};
  const pick = (value) => {
    const v = Array.isArray(value) ? value[0] : value;
    return typeof v === "string" && v.trim() ? v.trim() : "";
  };

  const realIp = pick(headers["x-real-ip"]);
  if (realIp) return realIp;

  // XFF 形如 "客户端, 代理1, 代理2"：最左为原始客户端
  const forwarded = pick(headers["x-forwarded-for"]);
  if (forwarded) {
    const first = forwarded.split(",")[0].trim();
    if (first) return first;
  }

  return pick(req.socket && req.socket.remoteAddress);
}

function setUserHeaders(proxyReq, req) {
  // 先清空用户可能传入的不可信头信息
  const headersToRemove = [
    "x-bili-user-name",
    "x-bili-level",
    "x-bili-role",
    "x-bili-mid",
    "x-bili-uname",
    "x-bili-sign",
    "x-bili-sex",
    "x-bili-email",
    "x-bili-vip-status",
    "x-bili-vip-type",
    // 客户端 IP 属可信头：必须清掉客户端伪造值，否则观看者列表会显示假 IP
    "x-bili-client-ip",
  ];

  headersToRemove.forEach((header) => {
    proxyReq.removeHeader(header);
  });

  const userInfo = req.userInfoForHeader || {};

  // 设置可信的用户信息头
  proxyReq.setHeader(
    "x-bili-user-name",
    encodeURIComponent(userInfo.user_name || ""),
  );
  proxyReq.setHeader("x-bili-level", userInfo.level || "");
  proxyReq.setHeader("x-bili-role", userInfo.role || "");
  proxyReq.setHeader("x-bili-mid", userInfo.mid || "");
  proxyReq.setHeader("x-bili-uname", encodeURIComponent(userInfo.uname || ""));
  proxyReq.setHeader("x-bili-sign", encodeURIComponent(userInfo.sign || ""));
  proxyReq.setHeader("x-bili-sex", encodeURIComponent(userInfo.sex || ""));
  proxyReq.setHeader("x-bili-email", encodeURIComponent(userInfo.email || ""));
  proxyReq.setHeader("x-bili-vip-status", userInfo.vip_status || "");
  proxyReq.setHeader("x-bili-vip-type", userInfo.vip_type || "");

  // 客户端真实 IP：上游（RPA）看到的连接来源是网关自己，拿不到真实地址，
  // 必须由网关从 nginx 的 X-Real-IP / X-Forwarded-For 解析后注入，
  // 供「观看者列表」展示是谁在看（见 docs/rpa-多观看者并发直播计划书.md §2.7）。
  proxyReq.setHeader("x-bili-client-ip", resolveClientIp(req));
}

module.exports = {
  mapProxyErrorToStatus,
  sendProxyErrorPush,
  proxyErrorHandler,
  setUserHeaders,
  resolveClientIp,
};
