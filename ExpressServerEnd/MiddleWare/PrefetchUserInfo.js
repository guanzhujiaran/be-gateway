/**
 * 前置中间件：获取用户身份并挂载到 req.userInfoForHeader，
 * 用于 setUserHeaders 注入 x-bili-* 鉴权头到上游 be-message。
 *
 * 优先级（两层降级，保证 be-message 不可用时也能解析身份）：
 *   1. be-message `/identify`（查 Redis 缓存 → 未命中调 HTTP）
 *      能拿到最新的身份（一致性最好），并以 JWT 签名缓存 5 min；
 *   2. 本地 JWT 解析（共享密钥 + jsonwebtoken）
 *      be-message 不可用 /identify 失败时触发，使用全局相同的 HS256 密钥
 *      （common_config.salt.jwt_secret）本地验签 + 解码，提取 uid 等字段；
 *   3. 都失败 → 空身份（匿名）
 *
 * 黑名单（登出）检查在网关侧完成：复用 user_redis_dao 的 JWT 签名黑名单，
 * 在任何解析路径之前执行（登出 token 一律失效）。
 *
 * @returns {Function} Express middleware function (async)
 */
const axios = require("axios");
const jwt = require("jsonwebtoken");
const config = require("@/ExpressServerEnd/config");
const { utils } = require("@/ExpressServerEnd/BiliPPTR/utils/utils");
const { user_redis_dao } = require("@/ExpressServerEnd/DAO/UserRedisDao");
const {
  redis_manager,
} = require("@/ExpressServerEnd/DAO/Redis/RedisManager");

const JWT_SECRET = config.common_config.salt.jwt_secret;

// 用户信息 Redis 缓存 TTL（秒）：1 分钟
// 取较短 TTL：用户修改昵称 / 等级等数据后，最长 1 分钟内缓存自然失效，
// 避免长期显示旧身份（如已升级、改昵称后未及时反映）。
const USER_INFO_CACHE_TTL = 60;

// 未登录 / 解析失败时的空身份
const EMPTY_USER_INFO = {
  mid: "",
  user_name: "",
  level: "",
  role: "",
  uname: "",
  sign: "",
  sex: "",
  email: "",
  vip_status: "",
  vip_type: "",
};

/**
 * 本地解析 JWT：与全局 jwtAuth 同一套 HS256 密钥。
 * ignoreExpiration=true：过期 token 仍能读出 uid（过期交由 be-message
 * /nav 的 JWT 续期逻辑处理，这里只负责身份解析）。
 *
 * @param {string} token - JWT 字符串
 * @returns {{mid, user_name, level, role}|null}
 */
function decodeJwtLocal(token) {
  try {
    const payload = jwt.verify(token, JWT_SECRET, {
      algorithms: ["HS256"],
      ignoreExpiration: true,
    });
    if (!payload || payload.uid == null) return null;
    return {
      mid: String(payload.uid),
      user_name: payload.user_name || "",
      level: payload.level != null ? String(payload.level) : "",
      role: payload.role || "",
    };
  } catch (e) {
    console.warn("[PrefetchUserInfo] 本地 JWT 解析失败:", e.message);
    return null;
  }
}

function userInfoPreFetchMiddleware() {
  return async (req, _res, next) => {
    // 优先从 HttpOnly Cookie 读取 JWT（前端不再使用 localStorage），兼容 Authorization 头
    let token = null;
    const cookieHeader = req.headers.cookie;
    if (cookieHeader) {
      const m = cookieHeader.match(/(?:^|;\s*)bili_jwt=([^;]+)/);
      if (m) token = decodeURIComponent(m[1]);
    }
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    // 无 JWT → 匿名访问
    if (!token) {
      req.userInfoForHeader = { ...EMPTY_USER_INFO };
      return next();
    }

    // 提取 JWT 签名（第三段），用于黑名单检查和缓存 key
    const parts = token.split(".");
    const signature = parts.length === 3 ? parts[2] : "";

    try {
      // 1) 黑名单检查（登出 token 立即失效，与 jwtAuth.isRevoked 逻辑一致）
      if (signature) {
        const isBlacklisted =
          await user_redis_dao.is_jwt_signature_in_black_list({ signature });
        if (isBlacklisted) {
          req.userInfoForHeader = { ...EMPTY_USER_INFO };
          return next();
        }
      }

      // 2) Redis 缓存命中 → 直接使用
      const cacheKey = `user_info:${signature}`;
      const cached = await redis_manager.connection.get(cacheKey);
      if (cached) {
        req.userInfoForHeader = JSON.parse(cached);
        return next();
      }

      // 3) 缓存未命中 → 优先调 be-message /identify
      let userInfo = null;
      try {
        const resp = await axios.get(
          `${utils.MESSAGE.base_url}/api/v1/user/identify`,
          {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 3000, // 更短的超时：3s；be-message 不可用能迅速降级到本地解析
          },
        );
        if (resp.data && resp.data.code === 0 && resp.data.data) {
          const d = resp.data.data;
          userInfo = {
            mid: d.mid || "",
            user_name: d.user_name || "",
            level: d.level || "",
            role: d.role || "",
            uname: d.uname || "",
            sign: d.sign || "",
            sex: d.sex || "",
            email: d.email || "",
            vip_status: d.vip_status || "",
            vip_type: d.vip_type || "",
          };
        }
      } catch (identifyErr) {
        console.error(
          "[PrefetchUserInfo] /identify 调用失败，降级到本地 JWT 解析:",
          identifyErr.code || identifyErr.message,
        );
      }

      // 4) /identify 失败 → 本地 JWT 解析（be-message 不可用时的兜底）
      if (!userInfo) {
        const local = decodeJwtLocal(token);
        if (local) {
          userInfo = {
            mid: local.mid,
            user_name: local.user_name,
            level: local.level,
            role: local.role,
            uname: "",
            sign: "",
            sex: "",
            email: "",
            vip_status: "",
            vip_type: "",
          };
        }
      }

      if (userInfo) {
        req.userInfoForHeader = userInfo;
        // 缓存：/identify 成功和本地解析成功都写入 Redis（下次命中不走网络）
        // key 以 signature 区分：JWT 续期换 token 会生成不同签名，自然失效
        await redis_manager.connection.setex(
          cacheKey,
          USER_INFO_CACHE_TTL,
          JSON.stringify(userInfo),
        );
      } else {
        req.userInfoForHeader = { ...EMPTY_USER_INFO };
      }
    } catch (e) {
      console.warn("[PrefetchUserInfo] 获取用户信息失败:", e.message || e);
      req.userInfoForHeader = { ...EMPTY_USER_INFO };
    }

    next();
  };
}

module.exports = {
  userInfoPreFetchMiddleware,
};
