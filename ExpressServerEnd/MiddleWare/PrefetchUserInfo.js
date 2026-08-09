/**
 * 前置中间件：从 JWT payload 中提取 uid 并挂载到 req.userInfoForHeader，
 * 用于 setUserHeaders 注入 x-bili-* 鉴权头到上游 be-message。
 *
 * be-message 的 /nav 等接口仅依赖 x-bili-mid 做身份识别，其余字段
 * （level / role / uname / sign 等）均由 be-message 自行查库获取，
 * 故 pptr 侧无需通过 RabbitMQ RPC 预取用户信息。
 *
 * @returns {Function} Express middleware function
 */
function userInfoPreFetchMiddleware() {
  return (req, _res, next) => {
    const uid = req.auth?.uid || "";

    req.userInfoForHeader = {
      mid: String(uid),
      // be-message 自己查库获取完整用户信息，此处仅需提供可信 mid
      user_name: req.auth?.user_name ?? "",
      level: req.auth?.level != null ? String(req.auth.level) : "",
      role: req.auth?.role ?? "",
      uname: "",
      sign: "",
      sex: "",
      email: "",
      vip_status: "",
      vip_type: "",
    };

    next();
  };
}

module.exports = {
  userInfoPreFetchMiddleware
};
