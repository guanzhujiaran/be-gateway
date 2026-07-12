const express = require("express");
const router = express.Router();
const { utils } = require("@/ExpressServerEnd/BiliPPTR/utils/utils");
const {
  createProxyMiddleware,
  fixRequestBody,
} = require("http-proxy-middleware");
const {
  userInfoPreFetchMiddleware
} = require("@/ExpressServerEnd/MiddleWare/PrefetchUserInfo");
const {
  createGuard,
} = require("@/ExpressServerEnd/Service/user_permission_module/user_permission_service");
const { jwtAuthOptional } = require("@/ExpressServerEnd/Service/user_permission_module/JwtModule");

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

function proxyErrorHandler(err, req, res) {
  // 将代理错误传递给 Express 的错误处理中间件
  console.error(`代理错误 (${req.path}):`, err);
  // 响应已开始（流式/分块传输）时无法再设置状态码，只能断开连接
  if (res.headersSent || res.writableEnded) {
    return res.destroy();
  }
  const status = mapProxyErrorToStatus(err);
  return res.status(status).json({
    code: status,
    data: null,
    msg: `代理请求上游失败：${err.message || err.code || "未知错误"}`,
    ttl: 1,
  });
}

/**
 * 清空用户传入的不可信头信息并设置用户信息到代理请求头
 * @param {Object} proxyReq - Proxy request object
 * @param {Object} req - Original request object
 */
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
    "x-bili-vip-type"
  ];

  headersToRemove.forEach(header => {
    proxyReq.removeHeader(header);
  });

  const userInfo = req.userInfoForHeader || {};

  // 设置可信的用户信息头
  proxyReq.setHeader("x-bili-user-name", encodeURIComponent(userInfo.user_name || ""));
  proxyReq.setHeader("x-bili-level", userInfo.level || "");
  proxyReq.setHeader("x-bili-role", userInfo.role || "");
  proxyReq.setHeader("x-bili-mid", userInfo.mid || "");
  proxyReq.setHeader("x-bili-uname", encodeURIComponent(userInfo.uname || ""));
  proxyReq.setHeader("x-bili-sign", encodeURIComponent(userInfo.sign || ""));
  proxyReq.setHeader("x-bili-sex", encodeURIComponent(userInfo.sex || ""));
  proxyReq.setHeader("x-bili-email", encodeURIComponent(userInfo.email || "")); // 添加邮箱字段
  proxyReq.setHeader("x-bili-vip-status", userInfo.vip_status || "");
  proxyReq.setHeader("x-bili-vip-type", userInfo.vip_type || "");
}
router.use( // fastapi 的数据库反向代理
  "/api/v1/lottery_database/bili/",
  jwtAuthOptional, // 可登录也可不登陆
  userInfoPreFetchMiddleware(), // 预查询用户信息
  createProxyMiddleware({
    target: utils.MYAPI.base_url,
    proxyTimeout: 30000,
    pathRewrite: { "^/": "/api/v1/lottery_database/bili/" },
    on: {
      proxyReq: (proxyReq, req, res) => {
        // 以同步方式设置用户信息到 header
        setUserHeaders(proxyReq, req);
        fixRequestBody(proxyReq, req);
      },
      error: proxyErrorHandler
    },
  })
);
router.use(
  "/api/v1/samsClub/graphql",
  createProxyMiddleware({
    target: utils.MYAPI.base_url,
    proxyTimeout: 30000,
    pathRewrite: { "/": "/api/v1/samsClub/graphql" },
    on: {
      proxyReq: (proxyReq, req, res) => {
        fixRequestBody(proxyReq, req); // 这一行不能删，不然无法代理请求。
      },
      error: proxyErrorHandler
    },
  })
);
router.use(
  "/api/v1/rpa",
  createGuard(),
  userInfoPreFetchMiddleware(), // 预查询用户信息
  createProxyMiddleware({
    target: utils.RPA.base_url,
    proxyTimeout: 180000,
    pathRewrite: { "^/": "/api/v1/rpa/" },
    on: {
      proxyReq: (proxyReq, req, res) => {
        req.clearTimeout();
        req.setTimeout(180000);
        // 以同步方式设置用户信息到 header
        setUserHeaders(proxyReq, req);
        fixRequestBody(proxyReq, req);
      },
      error: proxyErrorHandler
    },
    changeOrigin: true,
    ws: true,
  }),
);
router.use('/api/v1/casdoor/backend', // 配置在前端的.env 文件里面  
  createProxyMiddleware({
    target: process.env.CASDOOR_ENDPOINT,
    proxyTimeout: 30000,
    pathRewrite: { "/": "/api/v1/casdoor/backend" },
    on: {
      proxyReq: (proxyReq, req, res) => {
        fixRequestBody(proxyReq, req); // 这一行不能删，不然无法代理请求。
      },
      error: proxyErrorHandler
    },
  })
);

router.use( // notify-service 反向代理（前端 / 其它微服务统一经此转发到 NotifyService）
  "/api/v1/notify",
  jwtAuthOptional, // 可登录也可不登陆，解析 JWT 以识别用户
  userInfoPreFetchMiddleware(), // 预查询用户信息，供 setUserHeaders 注入 x-bili-* 头
  createProxyMiddleware({
    target: utils.NOTIFY.base_url,
    changeOrigin: true,
    proxyTimeout: 30000,
    on: {
      proxyReq: (proxyReq, req, res) => {
        // 把触发推送的用户信息以 x-bili-* 头透传给 notify-service
        setUserHeaders(proxyReq, req);
        fixRequestBody(proxyReq, req);
      },
      error: proxyErrorHandler
    },
  })
);
router.use( // message-service 反向代理（前端经 hey-api 生成的 SDK 调用 /api/v1/message 前缀）
  "/api/v1/message",
  jwtAuthOptional, // 可登录也可不登陆，解析 JWT 以识别用户
  userInfoPreFetchMiddleware(), // 预查询用户信息，供 setUserHeaders 注入 x-bili-* 头
  createProxyMiddleware({
    target: utils.MESSAGE.base_url,
    changeOrigin: true,
    proxyTimeout: 30000,
    on: {
      proxyReq: (proxyReq, req, res) => {
        // 把触发推送的用户信息以 x-bili-* 头透传给 message-service
        setUserHeaders(proxyReq, req);
        fixRequestBody(proxyReq, req);
      },
      error: proxyErrorHandler
    },
  })
);

module.exports = router;
