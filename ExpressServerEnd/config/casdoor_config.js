const casdoorConfig = {
  endpoint: process.env.CASDOOR_ENDPOINT,
  clientId: process.env.CASDOOR_CLIENT_ID,
  clientSecret: process.env.CASDOOR_CLIENT_SECRET,
  organization: process.env.CASDOOR_ORGANIZATION,
  application: process.env.CASDOOR_APPLICATION,
  // 是否启用Casdoor
  enabled: process.env.CASDOOR_ENABLED === "true" || false,
  // 证书配置 - 从Casdoor服务器获取公钥
  certificate:
    process.env.CASDOOR_CERTIFICATE?.replaceAll(/\\n/g, "\n") || undefined,
};

console.log("[CasdoorConfig] Final config:", casdoorConfig);

module.exports = casdoorConfig;
