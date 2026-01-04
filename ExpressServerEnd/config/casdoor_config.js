const path = require("path");
const fs = require("fs");

/**
 * Casdoor配置
 * 请在.env文件中配置以下环境变量：
 * - CASDOOR_ENDPOINT: Casdoor服务器地址，如 http://localhost:8000
 * - CASDOOR_CLIENT_ID: 客户端ID
 * - CASDOOR_CLIENT_SECRET: 客户端密钥
 * - CASDOOR_ORGANIZATION: 组织名称
 * - CASDOOR_APPLICATION: 应用名称
 */

const casdoorConfig = {
    endpoint: process.env.CASDOOR_ENDPOINT || "http://localhost:8000",
    clientId: process.env.CASDOOR_CLIENT_ID || "",
    clientSecret: process.env.CASDOOR_CLIENT_SECRET || "",
    organization: process.env.CASDOOR_ORGANIZATION || "built-in",
    application: process.env.CASDOOR_APPLICATION || "app-built-in",
    // 本地回调地址
    redirectUri: process.env.CASDOOR_REDIRECT_URI || "http://localhost:3000/callback",
    // JWT配置（用于验证Casdoor令牌）
    jwtPublicKey: process.env.CASDOOR_JWT_PUBLIC_KEY || "",
    // 是否启用Casdoor
    enabled: process.env.CASDOOR_ENABLED === "true" || false,
};

module.exports = casdoorConfig;
