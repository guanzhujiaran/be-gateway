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

function proxyErrorHandler(err, req, res) {
  // 将代理错误传递给 Express 的错误处理中间件
  console.error(`代理错误 (${req.path}):`, err);
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
    pathRewrite: { "/": "/api/v1/casdoor/backend" },
    on: {
      proxyReq: (proxyReq, req, res) => {
        fixRequestBody(proxyReq, req); // 这一行不能删，不然无法代理请求。
      },
      error: proxyErrorHandler
    },
  })
);

module.exports = router;
