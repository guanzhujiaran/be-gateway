const express = require("express");
const crypto = require("crypto");
const router = express.Router();
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
    feOrigin =
      process.env.FRONTEND_URL || `${req.protocol}://${req.get("host")}`;
  }

  // 构造 Casdoor 授权地址
  const redirectUri =
    process.env.CASDOOR_REDIRECT_URI || `/api/v1/casdoor/callback`;
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

module.exports = router;