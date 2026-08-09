/**
 * 用户接口中**仍由 pptr 本地实现**的部分。
 *
 * 这里只保留依赖 Node 独有能力、无法下沉 be-message 的接口：
 *  - POST /logout  需要把 JWT signature 写入 Redis 黑名单
 *
 * 其余接口（nav / user_info / user_info/update / role/set / search /
 * refresh_token / casdoor/info）已整体迁移到 be-message，由
 * UserGatewayProxy 转发，不再出现在本文件中。
 */
const express = require("express");
const router = express.Router();
const {
  UserService,
} = require("@/ExpressServerEnd/Service/user_module/user_service");

router.post("/logout", async (req, resp, next) => {
  try {
    let result = await UserService.logout({
      req,
      resp,
    });
    return resp.json(result.toJSON());
  } catch (e) {
    next(e);
  }
});

module.exports = router;