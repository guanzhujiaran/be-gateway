const express = require("express");
const router = express.Router();
const { CasdoorService } = require("@/ExpressServerEnd/Service/casdoor_module/CasdoorService");
const crypto = require("crypto");

/**
 * 获取Casdoor登录URL
 * GET /api/v1/casdoor/login
 */
router.get("/login", (req, res) => {
    try {
        if (!CasdoorService.isEnabled()) {
            return res.json({
                code: -1,
                msg: "Casdoor未启用",
                data: null,
            });
        }

        // 生成随机state参数用于防止CSRF攻击
        const state = crypto.randomBytes(16).toString("hex");

        // 将state存储在session中（这里简化为在返回时让前端保存）
        // 实际生产环境应该使用Redis或session存储

        const loginUrl = CasdoorService.getLoginUrl(state);

        res.json({
            code: 0,
            msg: "获取登录URL成功",
            data: {
                login_url: loginUrl,
                state: state,
            },
        });
    } catch (error) {
        console.error("获取Casdoor登录URL失败:", error);
        res.json({
            code: -1,
            msg: "获取登录URL失败",
            data: null,
        });
    }
});

/**
 * Casdoor OAuth2回调端点
 * GET /api/v1/casdoor/callback?code=xxx&state=xxx
 */
router.get("/callback", async (req, res) => {
    try {
        const { code, state } = req.query;

        if (!code) {
            return res.json({
                code: -1,
                msg: "缺少授权码",
                data: null,
            });
        }

        // 注意：state验证在生产环境很重要，这里暂时跳过
        // 建议使用Redis或session存储state进行验证

        // 处理Casdoor登录
        const result = await CasdoorService.handleCasdoorCallback({
            code,
            req,
            res,
        });

        res.json(result.toJSON());
    } catch (error) {
        console.error("Casdoor回调处理失败:", error);
        res.json({
            code: -1,
            msg: `登录失败: ${error.message}`,
            data: null,
        });
    }
});

/**
 * 检查Casdoor状态
 * GET /api/v1/casdoor/status
 */
router.get("/status", (req, res) => {
    res.json({
        code: 0,
        msg: "ok",
        data: {
            enabled: CasdoorService.isEnabled(),
        },
    });
});

/**
 * 验证Casdoor令牌
 * POST /api/v1/casdoor/verify
 * Body: { token: "casdoor_token" }
 */
router.post("/verify", async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.json({
                code: -1,
                msg: "缺少令牌",
                data: null,
            });
        }

        const userInfo = await CasdoorService.parseJwtToken(token);
        const syncedUser = await CasdoorService.syncUserFromCasdoor(token);

        res.json({
            code: 0,
            msg: "验证成功",
            data: {
                casdoor_user: userInfo,
                local_user: syncedUser,
            },
        });
    } catch (error) {
        console.error("验证Casdoor令牌失败:", error);
        res.json({
            code: -1,
            msg: `验证失败: ${error.message}`,
            data: null,
        });
    }
});

module.exports = router;
