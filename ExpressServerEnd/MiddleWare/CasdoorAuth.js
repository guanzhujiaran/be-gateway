const { CasdoorService } = require("@/ExpressServerEnd/Service/casdoor_module/CasdoorService");

/**
 * Casdoor认证中间件
 * 用于验证Casdoor令牌并将其转换为本地JWT
 */
const casdoorAuth = async (req, res, next) => {
    try {
        // 如果Casdoor未启用，跳过此中间件
        if (!CasdoorService.isEnabled()) {
            return next();
        }

        const authHeader = req.headers.authorization;
        const casdoorToken = authHeader && authHeader.split(" ")[0] === "Casdoor"
            ? authHeader.split(" ")[1]
            : null;

        // 如果没有Casdoor令牌，跳过此中间件（可能有其他认证方式）
        if (!casdoorToken) {
            return next();
        }

        // 验证Casdoor令牌并同步用户信息
        const syncedUser = await CasdoorService.syncUserFromCasdoor(casdoorToken);

        // 将用户信息附加到请求对象
        req.auth = {
            uid: syncedUser.uid,
            user_name: syncedUser.user_name,
            level: syncedUser.level,
            casdoor_user: syncedUser.casdoor_user,
        };

        next();
    } catch (error) {
        console.error("Casdoor认证失败:", error);
        return res.status(401).json({
            code: -1,
            msg: "Casdoor认证失败",
            data: null,
        });
    }
};

module.exports = { casdoorAuth };
