const { UserService } = require("@/ExpressServerEnd/Service/user_module/user_service");

/**
 * 前置中间件：查询用户详细信息并挂载到 req.userInfoForHeader
 * @returns {Function} Express middleware function
 */
function userInfoPreFetchMiddleware() {
  return async (req, res, next) => {
    try {
      const uid = req.auth?.uid || "";

      if (uid) {
        // 调用已有的 UserService 获取用户详细信息
        const userInfo = await UserService.get_user_detail_info({ uid, is_own_uid: false });

        req.userInfoForHeader = {
          user_name: userInfo?.user_name || "",
          level: String(userInfo?.level_info?.current_level ?? "0"),
          mid: String(userInfo?.mid || ""),
          uname: userInfo?.uname || "",
          sign: userInfo?.sign || "",
          sex: userInfo?.sex || "",
          email: userInfo?.email || "", // 添加邮箱字段
          vip_status: String(userInfo?.vip?.vip_status ?? "0"),
          vip_type: String(userInfo?.vip?.vip_type ?? "0")
        };
      } else {
        // 无用户信息时设置默认值
        req.userInfoForHeader = {
          user_name: "",
          level: "",
          mid: "",
          uname: "",
          sign: "",
          sex: "",
          email: "", // 添加邮箱字段默认值
          vip_status: "",
          vip_type: ""
        };
      }
    } catch (error) {
      console.error(`查询用户信息失败:`, error);
      // 查询失败时设置默认值保证代理功能可用
      req.userInfoForHeader = {
        user_name: "",
        level: "",
        mid: "",
        uname: "",
        sign: "",
        sex: "",
        email: "", // 添加邮箱字段默认值
        vip_status: "",
        vip_type: ""
      };
    }

    next();
  };
}

module.exports = {
  userInfoPreFetchMiddleware
};
