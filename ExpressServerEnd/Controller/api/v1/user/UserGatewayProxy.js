/**
 * 用户网关反向代理：所有 /api/v1/user/* 接口原样转发到 be-message。
 *
 * 身份透传：
 *  - 复用 userInfoPreFetchMiddleware + setUserHeaders 组合，注入可信 x-bili-* 头；
 *  - 额外通过 x-bili-jwt 头将原始 JWT 透传给上游，供 be-message 侧做 JWT 续期判断。
 *
 * 注意上游返回的是 StandardResponse（{code,msg,data}），已不再是 pptr 旧的
 * {code,data,msg,ttl} 格式，前端需同步改造。
 *
 * 本模块不再处理 /nav 的 JWT 续期逻辑，该逻辑已整体下沉到 be-message。
 */
const express = require("express");
const router = express.Router();
const { utils } = require("@/ExpressServerEnd/BiliPPTR/utils/utils");
const {
  createProxyMiddleware,
  fixRequestBody,
} = require("http-proxy-middleware");
const {
  userInfoPreFetchMiddleware,
} = require("@/ExpressServerEnd/MiddleWare/PrefetchUserInfo");
const {
  setUserHeaders,
  proxyErrorHandler,
} = require("@/ExpressServerEnd/Controller/ProxyHelper");

// ==================== 统一代理：所有路径走 be-message ====================

router.use(
  userInfoPreFetchMiddleware(),
  createProxyMiddleware({
    target: utils.MESSAGE.base_url,
    // 子路由内 req.url 已剥离 /api/v1/user 前缀，这里补回上游的完整路径
    pathRewrite: { "^/": "/api/v1/user/" },
    changeOrigin: true,
    proxyTimeout: 30000,
    on: {
      proxyReq: (proxyReq, req, res) => {
        // 注入可信用户身份头
        setUserHeaders(proxyReq, req);

        // 透传原始 JWT 给 be-message（供 JWT 续期判断）
        // 优先从 HttpOnly Cookie 读取（前端不再使用 localStorage），兼容 Authorization 头
        let rawToken = req.headers.authorization;
        if (!rawToken || !rawToken.startsWith("Bearer ")) {
          const cookieHeader = req.headers.cookie;
          if (cookieHeader) {
            const m = cookieHeader.match(/(?:^|;\s*)bili_jwt=([^;]+)/);
            if (m) rawToken = `Bearer ${decodeURIComponent(m[1])}`;
          }
        }
        if (rawToken && rawToken.startsWith("Bearer ")) {
          proxyReq.setHeader("x-bili-jwt", rawToken.substring(7));
        }

        fixRequestBody(proxyReq, req);
      },
      error: proxyErrorHandler,
    },
  })
);

module.exports = { UserGatewayProxy: router };