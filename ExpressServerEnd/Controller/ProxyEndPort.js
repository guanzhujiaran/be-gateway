const express = require("express");
const router = express.Router();
const { utils } = require("@/ExpressServerEnd/BiliPPTR/utils/utils");
const {
  createProxyMiddleware,
  fixRequestBody,
} = require("http-proxy-middleware");

const {
  createGuard,
} = require("@/ExpressServerEnd/Service/user_permission_module/user_permission_service");

router.use(
  "/api/v1/samsClub/graphql",
  createProxyMiddleware({
    target: utils.MYAPI.base_url,
    pathRewrite: { "/": "/api/v1/samsClub/graphql" },
    on: {
      proxyReq: (proxyReq, req, res) => {
        fixRequestBody(proxyReq, req); // 这一行不能删，不然无法代理请求。
      },
    },
  })
);
router.use(
  "/api/v1/rpa",
  createGuard(),
  createProxyMiddleware({
    target: utils.RPA.base_url,
    pathRewrite: { "/": "/api/v1/rpa/" },
    on: {
      proxyReq: (proxyReq, req, res) => {
        proxyReq.setHeader("x-bili-mid", req.auth.uid);
        proxyReq.setHeader("x-bili-level", req.auth.level);
        fixRequestBody(proxyReq, req);
      },
    },
    changeOrigin: true,
    ws: true,
  })
);
router.use('/api/v1/casdoor/backend', // 配置在前端的.env文件里面  
  createProxyMiddleware({
    target: process.env.CASDOOR_ENDPOINT,
    pathRewrite: { "/": "/api/v1/casdoor/backend" },
    on: {
      proxyReq: (proxyReq, req, res) => {
        fixRequestBody(proxyReq, req); // 这一行不能删，不然无法代理请求。
      },
    },
  })
)
module.exports = router;
