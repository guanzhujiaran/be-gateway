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
  createGuard,
} = require("@/ExpressServerEnd/Service/user_permission_module/user_permission_service");
const {
  jwtAuthOptional,
} = require("@/ExpressServerEnd/Service/user_permission_module/JwtModule");
// 代理公共工具（错误处理 / 可信用户头注入）已抽取到 ProxyHelper，
// 与 /api/v1/user 的网关代理共用同一份实现，避免鉴权口径漂移。
const {
  setUserHeaders,
  proxyErrorHandler,
} = require("@/ExpressServerEnd/Controller/ProxyHelper");

router.use(
  // fastapi 的数据库反向代理
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
      error: proxyErrorHandler,
    },
  }),
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
      error: proxyErrorHandler,
    },
  }),
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
      error: proxyErrorHandler,
    },
    changeOrigin: true,
    ws: true,
  }),
);
router.use(
  "/api/v1/casdoor/backend", // 配置在前端的.env 文件里面
  createProxyMiddleware({
    target: process.env.CASDOOR_ENDPOINT,
    proxyTimeout: 30000,
    pathRewrite: { "/": "/api/v1/casdoor/backend" },
    on: {
      proxyReq: (proxyReq, req, res) => {
        fixRequestBody(proxyReq, req); // 这一行不能删，不然无法代理请求。
      },
      error: proxyErrorHandler,
    },
  }),
);

// Casdoor OAuth2 回调（已迁移到 be-message，由 pptr 代理转发）
// 注意：router.use("/api/v1/casdoor/callback", ...) 会剥离该前缀，
// req.url 变为 /?code=xxx&state=xxx，因此 pathRewrite 应以 ^/ 匹配。
router.use(
  "/api/v1/casdoor/callback",
  createProxyMiddleware({
    target: utils.MESSAGE.base_url,
    proxyTimeout: 30000,
    pathRewrite: {
      "^/": "/api/v1/user/casdoor/callback",
    },
    changeOrigin: true,
    on: {
      proxyReq: (proxyReq, req, res) => {
        fixRequestBody(proxyReq, req);
      },
      error: proxyErrorHandler,
    },
  }),
);

router.use(
  // RPA 管理员接口（审批 / 官方认证 / 标签 / 管理员权限），按服务命名空间 /api/admin/rpa 区分，与主接口同进程、走同一份用户鉴权
  "/api/admin/rpa",
  createGuard(),
  userInfoPreFetchMiddleware(), // 预查询用户信息
  createProxyMiddleware({
    target: utils.RPA.base_url,
    proxyTimeout: 180000,
    pathRewrite: { "^/": "/api/admin/rpa/" },
    on: {
      proxyReq: (proxyReq, req, res) => {
        req.clearTimeout();
        req.setTimeout(180000);
        // 以同步方式设置用户信息到 header（x-bili-mid / x-bili-role 等）
        setUserHeaders(proxyReq, req);
        fixRequestBody(proxyReq, req);
      },
      error: proxyErrorHandler,
    },
    changeOrigin: true,
  }),
);

router.use(
  // be-message-service 统一反向代理（2.41.0 合并精简：message/comment/community/
  // favorite/report 等全部业务域均由 be-message 单进程承载，共用一个转发即可）。
  // 放最后：/api/v1/user 由 routes/user（UserGatewayProxy）先注册处理，
  // /api/v1/casdoor、/api/v1/rpa、/api/admin/rpa 等专属代理在前已匹配，不会误伤。
  // 注意：Express 5 挂载路径不能带尾斜杠（/api/v1/ 无法匹配子路径），故用 /api/v1；
  // pathRewrite ^/ → /api/v1/ 补回前缀，be-message 各 APIRouter 自带完整路径。
  "/api/v1",
  jwtAuthOptional, // 可登录也可不登陆，解析 JWT 以识别用户
  userInfoPreFetchMiddleware(), // 预查询用户信息，供 setUserHeaders 注入 x-bili-* 头
  createProxyMiddleware({
    target: utils.MESSAGE.base_url,
    pathRewrite: { "^/": "/api/v1/" },
    changeOrigin: true,
    proxyTimeout: 30000,
    on: {
      proxyReq: (proxyReq, req, res) => {
        // 把触发操作/推送的用户信息以 x-bili-* 头透传给 be-message-service
        setUserHeaders(proxyReq, req);
        fixRequestBody(proxyReq, req);
      },
      error: proxyErrorHandler,
    },
  }),
);

module.exports = router;
