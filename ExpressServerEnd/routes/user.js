/**
 * /api/v1/user 路由。
 *
 * 拆分说明（用户业务下沉 be-message）：
 *  - 所有数据接口（nav / user_info / user_info/update / role/set / search /
 *    refresh_token / casdoor/info）已整体迁移到 be-message（Python），
 *    本文件通过 UserGatewayProxy 做**反向代理**转发，不再有业务逻辑；
 *  - Node 独有能力的接口（/logout）仍留在 pptr，因为它依赖 Redis 黑名单，
 *    属网关职责。
 *
 * 身份传递与 /api/v1/message、/api/v1/rpa 等既有代理完全一致：
 * app.js 的全局 jwtAuth 已完成验签并产出 req.auth.uid，这里再经
 * userInfoPreFetchMiddleware 预取用户信息，由 setUserHeaders 注入可信的
 * x-bili-* 头（并清除客户端伪造值）供上游 be-message 鉴权使用。
 *
 * 路由顺序说明：
 *  - UserLocalRouter 放在前面，先处理 /logout（本地实现）；
 *  - UserGatewayProxy 放在后面，代理其余所有路径到 be-message。
 */
const express = require("express");
const router = express.Router();
const cookParser = require("cookie-parser");
const {
  UserGatewayProxy,
} = require("@/ExpressServerEnd/Controller/api/v1/user/UserGatewayProxy");
const UserLocalRouter = require("@/ExpressServerEnd/Controller/api/v1/user/UserController");

router.use(cookParser());

// 本地优先：/logout 由 pptr 本地处理（Redis 黑名单）
router.use(UserLocalRouter);

// 其余路径（nav / user_info / refresh_token / casdoor/info 等）全部走代理
router.use(UserGatewayProxy);

module.exports = router;