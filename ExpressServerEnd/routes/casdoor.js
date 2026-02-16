const express = require("express");
const router = express.Router();
const {
  CasdoorService,
} = require("@/ExpressServerEnd/Service/casdoor_module/CasdoorService");

/**
 * Casdoor OAuth2回调端点
 * GET /api/v1/casdoor/callback?code=xxx&state=xxx
 */
router.get("/callback", async (req, res) => {
  const { code, state } = req.query;

  if (!code) {
    return res.status(400).send("缺少授权码");
  }

  // 处理Casdoor登录
  const result = await CasdoorService.handleCasdoorCallback({
    code,
    req,
    res,
  });

  if (result.code === 0 && result.data?.jwt_token) {
    // 登录成功，重定向到前端并带上 token
    const frontendUrl = process.env.FRONTEND_URL;
    res.redirect(
      `${frontendUrl}/casdoor-callback?token=${encodeURIComponent(
        result.data.jwt_token
      )}&uid=${result.data.uid}&user_name=${encodeURIComponent(
        result.data.user_name
      )}`
    );
  } else {
    // 登录失败，重定向到前端错误页面
    const frontendUrl = process.env.FRONTEND_URL;
    res.redirect(
      `${frontendUrl}/login?error=${encodeURIComponent(
        result.msg || "登录失败"
      )}`
    );
  }
});

module.exports = router;
