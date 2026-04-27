const { UserLevelService } = require("../Service/user_module/user_level_service");

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
        const userWholeInfo = await UserLevelService.get_user_whole_info(uid);
        req.userInfoForHeader = {
          user_name: userWholeInfo?.user_name || "",
          role: userWholeInfo?.role || "",
          level: String(userWholeInfo?.level_info?.current_level ?? "0"),
          mid: String(userWholeInfo?.uid || ""),
          uname: userWholeInfo?.TUserDetail?.uname || "",
          sign: userWholeInfo?.TUserDetail?.sign || "",
          sex: userWholeInfo?.TUserDetail?.sex || "",
          email: userWholeInfo?.TUserDetail?.email || "", // 添加邮箱字段
          vip_status: String(userWholeInfo?.TUserDetail?.TUserVip?.vip_status ?? "0"),
          vip_type: String(userWholeInfo?.TUserDetail?.TUserVip?.vip_type ?? "0")
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
