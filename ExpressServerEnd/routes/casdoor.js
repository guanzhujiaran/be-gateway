const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const {
  CasdoorService,
} = require("@/ExpressServerEnd/Service/casdoor_module/CasdoorService");
const casdoorConfig = require("@/ExpressServerEnd/config/casdoor_config");

// 用于在登录发起时记录「前端来源」，回调时据此重定向回前端。
// 之所以用 cookie 而不是单纯依赖 req.headers.origin：
// OAuth 回调是 Casdoor 对浏览器发起的「顶层 302 跳转」，浏览器在该请求上
// 不会携带 Origin/Referer（Referer 只会是 Casdoor 页面），因此回调瞬间无法直接
// 拿到前端地址。只能在「登录发起」那一刻（前端直接请求本端点，Origin 存在）把来源记下来。
const FE_COOKIE = "casdoor_rf";

/**
 * 解析 Cookie 头（不依赖 cookie-parser 中间件）
 * @param {string} raw
 * @returns {Object}
 */
function parseCookies(raw) {
  const out = {};
  if (!raw) return out;
  for (const part of raw.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}

/**
 * 校验给定 origin 是否合法（必须是 http/https 绝对地址）。
 * 若配置了 CASDOOR_FRONTEND_ALLOWLIST，则必须命中白名单（防止开放重定向/ token 泄露）。
 * @param {string} origin
 * @returns {boolean}
 */
function isAllowedFrontend(origin) {
  if (!origin) return false;
  let url;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;

  const allowlist = (process.env.CASDOOR_FRONTEND_ALLOWLIST || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (allowlist.length === 0) return true; // 未配置白名单时放行（由部署方自行保证安全）
  return allowlist.includes(url.origin);
}

/**
 * 从请求中推导「前端来源」。优先级：
 *   1. 环境变量 FRONTEND_URL（运维显式指定，最可靠）
 *   2. 登录发起时写入的 cookie（casdoor_rf）
 *   3. 请求 Origin（XHR/fetch 类请求会带，顶层跳转不带）
 *   4. 请求 Referer 的 origin
 *   5. 兜底：后端自身 host（即当前错误行为，仅作为最后手段）
 * @param {Object} req
 * @returns {string|null}
 */
function resolveFrontendUrl(req) {
  if (process.env.FRONTEND_URL) return process.env.FRONTEND_URL;

  const cookies = parseCookies(req.headers.cookie || "");
  if (cookies[FE_COOKIE] && isAllowedFrontend(cookies[FE_COOKIE])) {
    return cookies[FE_COOKIE];
  }

  if (req.headers.origin && isAllowedFrontend(req.headers.origin)) {
    return req.headers.origin;
  }

  if (req.headers.referer) {
    try {
      const refOrigin = new URL(req.headers.referer).origin;
      if (isAllowedFrontend(refOrigin)) return refOrigin;
    } catch {
      /* ignore */
    }
  }

  return null; // 调用方自行兜底到后端 host
}

/**
 * Casdoor 登录发起端点
 * 前端登录按钮应指向此处（而不是直接拼接 Casdoor 登录地址）。
 * 这里能拿到前端的 Origin，记录到 cookie 后 302 跳转 Casdoor 授权页。
 * GET /api/v1/casdoor/login
 */
router.get("/login", (req, res) => {
  // 前端来源：优先 Origin，其次 Referer，再次 FRONTEND_URL，最后后端自身。
  let feOrigin =
    req.headers.origin ||
    (req.headers.referer ? safeOrigin(req.headers.referer) : null) ||
    process.env.FRONTEND_URL ||
    `${req.protocol}://${req.get("host")}`;

  if (!isAllowedFrontend(feOrigin)) {
    // 不在白名单（且白名单已配置）时，回退到 FRONTEND_URL 或后端自身地址
    feOrigin = process.env.FRONTEND_URL || `${req.protocol}://${req.get("host")}`;
  }

  // 将前端来源写入短期 HttpOnly cookie，供回调使用
  res.cookie(FE_COOKIE, feOrigin, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 10 * 60 * 1000, // 10 分钟足够完成一次 OAuth 握手
    path: "/",
  });

  // 构造 Casdoor 授权地址
  const redirectUri =
    process.env.CASDOOR_REDIRECT_URI ||
    `${req.protocol}://${req.get("host")}/api/v1/casdoor/callback`;
  const state = crypto.randomBytes(16).toString("hex");

  const signinUrl =
    `${casdoorConfig.endpoint}/login/oauth/authorize?` +
    new URLSearchParams({
      client_id: casdoorConfig.clientId,
      response_type: "code",
      redirect_uri: redirectUri,
      scope: "read",
      state,
    }).toString();

  return res.redirect(signinUrl);
});

/**
 * 安全地从 URL 字符串取出 origin
 * @param {string} value
 * @returns {string|null}
 */
function safeOrigin(value) {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

/**
 * Casdoor OAuth2 回调端点
 * GET /api/v1/casdoor/callback?code=xxx&state=xxx
 */
router.get("/callback", async (req, res) => {
  const { code, state } = req.query;

  if (!code) {
    return res.status(400).send("缺少授权码");
  }

  // 处理 Casdoor 登录
  const result = await CasdoorService.handleCasdoorCallback({
    code,
    req,
    res,
  });

  // 优先用环境变量 FRONTEND_URL；其次用登录发起时记录的 cookie；
  // 再尝试从请求 Origin/Referer 推导；最后兜底到后端自身 host。
  const frontendUrl =
    resolveFrontendUrl(req) || `${req.protocol}://${req.get("host")}`;

  if (result.code === 0 && result.data?.jwt_token) {
    // 登录成功，重定向到前端并带上 token，同时清除来源 cookie
    res.clearCookie(FE_COOKIE, { path: "/" });
    return res.redirect(
      `${frontendUrl}/app/casdoor-callback?token=${encodeURIComponent(
        result.data.jwt_token
      )}&uid=${result.data.uid}&user_name=${encodeURIComponent(
        result.data.user_name
      )}`
    );
  } else {
    // 登录失败，直接返回错误信息
    res.clearCookie(FE_COOKIE, { path: "/" });
    return res.status(400).json({
      code: result.code || -1,
      msg: result.msg || "登录失败",
      data: null,
    });
  }
});

module.exports = router;
