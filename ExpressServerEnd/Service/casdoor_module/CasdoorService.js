const { SDK } = require("casdoor-nodejs-sdk");
const casdoorConfig = require("@/ExpressServerEnd/config/casdoor_config");
const {
  createToken,
} = require("@/ExpressServerEnd/Service/user_permission_module/JwtModule");
const {
  UserModel,
} = require("@/ExpressServerEnd/Model/api/v1/user/user_model");
const {
  base_api_model,
} = require("@/ExpressServerEnd/Model/base_model/base_model");
const {
  UserActModel,
} = require("@/ExpressServerEnd/Model/api/v1/user/user_act_model");
const {
  UserDao,
} = require("@/ExpressServerEnd/DAO/UserDao");
// pptr 用户读写全部走 be-message RPC，不再维护本地 sequelize 用户表
const { callRpc } = require("@/ExpressServerEnd/Service/mq/rpc_client");

// 创建 Casdoor SDK 实例
const casdoorSDK = new SDK({
  endpoint: casdoorConfig.endpoint,
  clientId: casdoorConfig.clientId,
  clientSecret: casdoorConfig.clientSecret,
  appName: casdoorConfig.application,
  organizationName: casdoorConfig.organization,
  certificate: casdoorConfig.certificate,
});
class CasdoorService {
  /**
   * 通过授权码获取访问令牌（使用官方 SDK）
   * @param {string} code - OAuth2授权码
   * @returns {Promise<Object>} 包含access_token
   */
  static async getOAuthToken(code) {
    return await casdoorSDK.getAuthToken(code);
  }

  /**
   * 获取用户详细信息（解析 access_token JWT）
   * @param {string} accessToken - Casdoor访问令牌
   * @returns {Object} 用户详细信息
   */
  static getUserInfo(accessToken) {
    const user = casdoorSDK.parseJwtToken(accessToken);
    console.log("Casdoor用户信息:", JSON.stringify(user, null, 2));
    return user;
  }

  /**
   * 处理Casdoor登录回调
   * @param {string} code - 授权码
   * @param {Object} req - 请求对象
   * @param {Object} resp - 响应对象
   * @returns {Promise<base_api_model>} 包含JWT令牌的登录结果
   */
  static async handleCasdoorCallback({ code, req, resp }) {
    // 1. 获取OAuth令牌
    const oauthToken = await CasdoorService.getOAuthToken(code);
    console.log("获取到OAuth令牌:", JSON.stringify(oauthToken));

    // 2. 获取用户详细信息
    const casdoorUserInfo = await CasdoorService.getUserInfo(
      oauthToken.access_token
    );
    // console.log(
    //   "Casdoor用户详细信息:",
    //   JSON.stringify(casdoorUserInfo, null, 2)
    // );

    // 3. 检查用户是否已存在于 pptr（走 be-message RPC，不查本地表）
    const username = casdoorUserInfo.name || casdoorUserInfo.email;
    const existResp = await callRpc("get_user_info", { user_name: username });
    let localUser = existResp && existResp.code === 0 ? existResp.data : null;

    // 4. 如果用户不存在，自动创建（创建时就把完整的 OAuth token JSON 写入 TUserInfo.pwd）；
    //    如果存在，仅需更新 token，无需同步用户信息（create_user 已在创建时建好各扩展表）
    if (!localUser) {
      localUser = await CasdoorService.createLocalUserFromCasdoor(
        casdoorUserInfo,
        oauthToken,  // 传入完整 OAuth token 对象，内部序列化为 JSON 存储
        req,
        resp
      );
    }

    // 5. 不管是否新用户，只要用 Casdoor 登录，就把完整的 OAuth token 对象落库到 TUserInfo.pwd
    //    （复用 pwd 字段作为 token 仓库，存储 JSON 包含 access_token + refresh_token，
    //     供后续「用户调用」Casdoor 接口以及 token 刷新时使用）
    const tokenJson = JSON.stringify(oauthToken);
    await UserDao.update_user_pwd(localUser.uid, tokenJson);

    // 6. 生成本地JWT令牌（将 role 也放入 payload，供 PrefetchUserInfo 中间件
    //    直接从 req.auth 取值构造 x-bili-* 头，避免额外 RPC 查询）
    const jwt_token = createToken({
      user_name: localUser.user_name,
      uid: localUser.uid,
      level: localUser.level || "0",
      role: localUser.role || "0",
    });

    // 6. 记录登录活动
    req.auth = { uid: localUser.uid };
    const { UserService } = require("@/ExpressServerEnd/Service/user_module/user_service");
    await UserService.add_user_act_ip_info({
      req,
      resp,
      act_info: UserActModel.login_succ,
    });

    return new base_api_model({
      code: 0,
      msg: "Casdoor登录成功",
      data: {
        uid: localUser.uid,
        user_name: localUser.user_name,
        jwt_token: jwt_token,
        casdoor_user: {
          id: casdoorUserInfo.id,
          name: casdoorUserInfo.name,
          displayName: casdoorUserInfo.displayName,
          email: casdoorUserInfo.email,
          avatar: casdoorUserInfo.avatar,
          phone: casdoorUserInfo.phone,
          location: casdoorUserInfo.location,
          affiliation: casdoorUserInfo.affiliation,
        },
      },
    });
  }

  /**
   * 从Casdoor用户信息创建本地用户
   * @param {Object} casdoorUser - Casdoor用户信息
   * @param {Object|string} oauthToken - Casdoor OAuth token 对象（含 access_token, refresh_token），
   *   或已序列化的 JSON 字符串；内部自动序列化为 JSON 后写入 TUserInfo.pwd
   * @param {Object} req - 请求对象（可选）
   * @param {Object} resp - 响应对象（可选）
   * @returns {Promise<Object>} 本地用户对象
   */
  static async createLocalUserFromCasdoor(
    casdoorUser,
    oauthToken = "",
    req = null,
    resp = null
  ) {
    // 使用Casdoor用户名或邮箱作为本地用户名
    const username = casdoorUser.name || casdoorUser.email;

    // 将 oauthToken 序列化为 JSON 字符串存储
    const tokenStr = typeof oauthToken === "object" ? JSON.stringify(oauthToken) : oauthToken;

    // 创建用户（走 be-message RPC，一次性建 TUserInfo + TUserDetail + TUserLevel + TUserVip，uid 服务端自增）。
    // TUserInfo.pwd 字段复用作 Casdoor token 仓库：把完整的 token JSON 一并传给 create_user RPC，
    // 用户创建的同时 token 即写入 pwd，无需再单独同步。
    const createdUser = await UserModel.add_user({
      user_name: username,
      parsed_pwd: tokenStr,
    });

    if (!createdUser) {
      throw new Error("创建本地用户失败");
    }

    // 记录注册IP信息（reg_ip 更新走 RPC）
    let regIpInfoId = null;
    if (req && resp) {
      const { UserService } = require("@/ExpressServerEnd/Service/user_module/user_service");
      const regIpInfo = await UserService.add_user_act_ip_info({
        req,
        resp,
        act_info: UserActModel.reg,
      });
      regIpInfoId = regIpInfo.pk;
      await createdUser.update({ reg_ip_info_id: regIpInfoId });
    }

    console.log(`成功创建Casdoor用户: ${username}, uid: ${createdUser.uid}`);

    return createdUser;
  }

  /**
   * 验证Casdoor令牌并同步用户信息
   * @param {string} casdoorToken - Casdoor访问令牌
   * @param {Object} req - 请求对象（可选）
   * @param {Object} resp - 响应对象（可选）
   * @returns {Promise<Object>} 同步后的用户信息
   */
  static async syncUserFromCasdoor(casdoorToken, req = null, resp = null) {
    try {
      // 解析JWT获取用户基本信息
      const decodedToken = CasdoorService.parseJwtToken(casdoorToken);

      // 获取完整用户信息
      const casdoorUser = await CasdoorService.getUserInfo(casdoorToken);

      const username = casdoorUser.name || casdoorUser.email;

      const existResp = await callRpc("get_user_info", { user_name: username });
      let localUser = existResp && existResp.code === 0 ? existResp.data : null;

      if (!localUser) {
        // 用户不存在，创建新用户（创建时写入 casdoor token 到 TUserInfo.pwd）
        localUser = await CasdoorService.createLocalUserFromCasdoor(
          casdoorUser,
          casdoorToken,
          req,
          resp
        );
      }

      return {
        uid: localUser.uid,
        user_name: localUser.user_name,
        level: localUser.level,
        casdoor_user: casdoorUser,
      };
    } catch (error) {
      console.error("同步Casdoor用户失败:", error);
      throw error;
    }
  }

  /**
   * 通过本地登录名（稳定的 user_name，对应 Casdoor 用户名）获取 Casdoor 用户完整信息。
   * 注意：必须使用稳定的登录名 user_name，绝不能使用可修改的昵称 uname。
   * 例如积分(score)、余额、等级等字段都包含在返回结果中。
   *
   * 调用模式说明（Casdoor 要求 /get-user 必须带凭证，否则返回 data:null）：
   *  1. 用户调用（asUser=true 且传入 token）：在请求头携带 `Authorization: Bearer <token>`，
   *     代表以该登录用户身份获取自己的信息。
   *  2. service 调用（默认）：在 query 中携带 `service=<appName>`，以服务端应用身份进行应用间调用。
   *     当 casdoorConfig 中配置了 service 时默认走 service 调用；也可通过 options.service 覆盖。
   *
   * @param {string} userName - Casdoor 用户名（对应本地 TUserInfo.user_name）
   * @param {Object} [options]
   * @param {string} [options.token] - 用户级 Bearer token，用于「用户调用」模式
   * @param {string} [options.service] - service 应用名，用于「service 调用」模式
   * @param {boolean} [options.asUser] - 是否以用户身份调用（配合 token 使用）
   * @returns {Promise<Object|null>} Casdoor 用户对象，未找到返回 null
   */
  static async getCasdoorUserByUserName(userName, options = {}) {
    if (!userName) {
      throw new Error("缺少 Casdoor 登录名(user_name)");
    }
    if (!casdoorSDK) {
      throw new Error("Casdoor SDK 未初始化");
    }

    // 决定调用模式：优先用户调用（带 token），否则 service 调用
    const asUser = options.asUser && options.token;
    const service = options.service || casdoorConfig.service;

    // 构造 /get-user 请求参数，复用 SDK 的 axios 实例（已含 baseURL 与 Basic Auth）
    const params = {
      id: `${casdoorConfig.organization}/${userName}`,
    };
    // service 调用：在 query 中携带 service 应用名
    if (!asUser && service) {
      params.service = service;
    }

    const headers = {};
    // 用户调用：在请求头携带用户级 Bearer token
    if (asUser) {
      headers["Authorization"] = `Bearer ${options.token}`;
    }

    const resp = await casdoorSDK.request.get("/get-user", { params, headers });

    // casdoor-nodejs-sdk 的 get 请求返回的是完整 axios response（resp.data 为 Casdoor 接口包装体
    // { status, msg, data }），真正的用户对象在 resp.data.data 中
    const body = resp && resp.data ? resp.data : resp;
    const user = body && body.data ? body.data : null;
    return user;
  }

  /**
   * 从本地数据库读取指定用户的 Casdoor 用户级 access_token。
   * 该 token 在 Casdoor 登录回调时以完整 OAuth token JSON 写入 TUserInfo.pwd 字段（作为 token 仓库）。
   * 兼容旧格式：直接存储的 access_token 字符串（明文 / 32 位 md5 旧密码）。
   * @param {Object} params
   * @param {string|number} [params.uid] - 本地用户 uid
   * @param {string} [params.user_name] - 本地用户 user_name（即 Casdoor 用户名）
   * @returns {Promise<string|null>} Casdoor access_token，未找到返回 null
   */
  static async getCasdoorTokenFromDb({ uid, user_name } = {}) {
    if (!uid && !user_name) {
      throw new Error("getCasdoorTokenFromDb 需要 uid 或 user_name");
    }
    const resp = await callRpc("get_user_info", {
      uid: uid || 0,
      user_name: user_name || "",
    });
    const user_info = resp && resp.code === 0 ? resp.data : null;
    if (!user_info) {
      return null;
    }
    // pwd 字段复用作 Casdoor token 仓库
    const pwd = user_info.pwd;
    if (!pwd || /^[a-f0-9]{32}$/i.test(pwd)) {
      // 为空或仍为旧式 md5 哈希（32位十六进制）则视为无效
      return null;
    }
    // 尝试解析为 JSON（新格式：{ access_token, refresh_token }）
    try {
      const parsed = JSON.parse(pwd);
      if (parsed.access_token) {
        return parsed.access_token;
      }
    } catch {
      // 不是 JSON，说明是旧格式（纯 access_token 字符串），直接返回
    }
    return pwd;
  }

  /**
   * 从本地数据库读取指定用户的 Casdoor refresh_token。
   * @param {Object} params
   * @param {string|number} params.uid - 本地用户 uid
   * @returns {Promise<string|null>} Casdoor refresh_token，未找到返回 null
   */
  static async getCasdoorRefreshTokenFromDb({ uid }) {
    if (!uid) {
      throw new Error("getCasdoorRefreshTokenFromDb 需要 uid");
    }
    const resp = await callRpc("get_user_info", { uid: uid || 0 });
    const user_info = resp && resp.code === 0 ? resp.data : null;
    if (!user_info) {
      return null;
    }
    const pwd = user_info.pwd;
    if (!pwd) return null;
    try {
      const parsed = JSON.parse(pwd);
      return parsed.refresh_token || null;
    } catch {
      return null;
    }
  }

  /**
   * 刷新指定用户的 Casdoor OAuth token（使用存储的 refresh_token），
   * 并将新的 token JSON 更新到 TUserInfo.pwd。
   * @param {string|number} uid - 本地用户 uid
   * @returns {Promise<string|null>} 新的 access_token，刷新失败返回 null
   */
  static async refreshCasdoorToken(uid) {
    try {
      const refreshToken = await CasdoorService.getCasdoorRefreshTokenFromDb({ uid });
      if (!refreshToken) {
        console.log(`[Casdoor] 用户 ${uid} 没有 refresh_token，跳过 Casdoor token 刷新`);
        return null;
      }

      const newToken = await casdoorSDK.refreshToken(refreshToken);
      if (!newToken || !newToken.access_token) {
        console.warn(`[Casdoor] 用户 ${uid} 的 Casdoor token 刷新失败`);
        return null;
      }

      const tokenJson = JSON.stringify(newToken);
      await UserDao.update_user_pwd(uid, tokenJson);
      console.log(`[Casdoor] 用户 ${uid} 的 Casdoor token 刷新成功`);
      return newToken.access_token;
    } catch (error) {
      console.error(`[Casdoor] 用户 ${uid} 的 Casdoor token 刷新失败:`, error.message);
      return null;
    }
  }

  /**
   * 以「用户调用」方式获取当前登录用户的 Casdoor 信息。
   * 流程：本地 token（JWT）解析出用户身份 -> 从数据库 pwd 取回 Casdoor access_token
   * -> 携带 Bearer token 调用 /get-user。
   * 若数据库中没有有效的 Casdoor token（例如从未通过 Casdoor 登录），则回退为 service 调用。
   *
   * @param {Object} params
   * @param {string|number} params.uid - 当前登录用户 uid（来自 JWT 鉴权身份）
   * @param {string} [params.user_name] - 当前登录用户 user_name（即 Casdoor 用户名）
   * @returns {Promise<Object|null>} Casdoor 用户对象，未找到返回 null
   */
  static async getCasdoorUserAsUser({ uid, user_name }) {
    if (!uid && !user_name) {
      throw new Error("getCasdoorUserAsUser 需要 uid 或 user_name");
    }

    // 1. 解析 Casdoor 用户名（优先用传入的 user_name，否则按 uid 查库）
    let casdoorUserName = user_name;
    if (!casdoorUserName) {
      const info = await UserDao.get_user_info_by_uid(uid);
      casdoorUserName = info && info.user_name;
    }
    if (!casdoorUserName) {
      throw new Error("无法确定 Casdoor 登录名(user_name)");
    }

    // 2. 从数据库 pwd 取回 Casdoor 用户级 token（登录回调时写入）。
    //    该 token 即「用户自己的凭证」，后续访问 Casdoor 一律携带它做「用户调用」。
    const casdoorToken = await CasdoorService.getCasdoorTokenFromDb({
      uid,
      user_name: casdoorUserName,
    });

    // 3. 优先以「用户调用」(Bearer 携带用户自己的 token) 查询；
    //    仅当用户库中确实没有有效 token（如从未通过 Casdoor 登录）时，
    //    才回退为「service 调用」。
    if (casdoorToken) {
      return await CasdoorService.getCasdoorUserByUserName(casdoorUserName, {
        asUser: true,
        token: casdoorToken,
      });
    }

    // 没有用户自己的凭证：回退 service 调用，让用户仍能看到 Casdoor 信息
    const svcUser = await CasdoorService.getCasdoorUserByUserName(
      casdoorUserName,
      { service: casdoorConfig.service }
    );
    if (svcUser) {
      return svcUser;
    }

    // 既无用户凭证、service 调用也未找到：抛出明确错误，提示重新登录以绑定凭证
    throw new Error(
      `用户 ${casdoorUserName} 尚未绑定 Casdoor 凭证（请重新通过 Casdoor 登录一次）`
    );
  }

  /**
   * 检查Casdoor是否启用
   * @returns {boolean}
   */
  static isEnabled() {
    return casdoorConfig.enabled;
  }

  /**
   * 从OAuth提供商创建或更新用户
   * @param {Object} oauthData - OAuth用户数据
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   * @returns {Promise<Object>} 本地用户对象
   */
  static async createOrUpdateUserFromOAuth(oauthData, req, res) {
    const {
      provider,
      providerId,
      username,
      email,
      displayName,
      avatar,
      profileUrl,
    } = oauthData;

    try {
      // 检查用户是否已存在于 pptr（走 RPC）
      const existResp = await callRpc("get_user_info", { user_name: username });
      let localUser = existResp && existResp.code === 0 ? existResp.data : null;

      if (!localUser) {
        // 创建新用户（pwd 字段留空，待下方写入 Casdoor access_token）
        localUser = await UserModel.add_user({
          user_name: username,
        });

        if (!localUser) {
          throw new Error("创建本地用户失败");
        }

        // 记录注册IP信息
        if (req && res) {
          const { UserService } = require("@/ExpressServerEnd/Service/user_module/user_service");
          const regIpInfo = await UserService.add_user_act_ip_info({
            req,
            res,
            act_info: UserActModel.reg,
          });
          await localUser.update({ reg_ip_info_id: regIpInfo.pk });
        }

        console.log(
          `成功创建${provider}用户: ${username}, uid: ${localUser.uid}`
        );
      }

      // 同步用户详细信息到 TUserDetail / TUserLevel / TUserVip（走 RPC upsert）
      await callRpc("create_user", {
        user_name: username,
        uname: displayName || username,
        face: avatar || "",
        sign: `${provider}用户`,
        sex: "保密",
        email: email || "",
        current_level: 0,
        vip_type: 0,
        vip_due_date: 0,
        vip_status: 0,
      });

      return localUser;
    } catch (error) {
      console.error(`创建或更新${provider}用户失败:`, error);
      throw error;
    }
  }
}

module.exports = { CasdoorService };
