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
  TUserInfo,
  TUserDetail,
  sequelize,
} = require("@/ExpressServerEnd/DAO/SqlHelper");
const {
  UserActModel,
} = require("@/ExpressServerEnd/Model/api/v1/user/user_act_model");
const {
  UserDao,
} = require("@/ExpressServerEnd/DAO/UserDao");
const { TUserLevel } = require("@/ExpressServerEnd/DAO/SqlHelper");
const { TUserVip } = require("@/ExpressServerEnd/DAO/SqlHelper");

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

    // 3. 检查用户是否已存在于本地数据库
    const username = casdoorUserInfo.name || casdoorUserInfo.email;
    let localUser = await TUserInfo.findOne({ 
      where: {
        user_name: username,
      },
    });

    // 4. 如果用户不存在，自动创建；如果存在，同步更新用户信息
    if (!localUser) {
      localUser = await CasdoorService.createLocalUserFromCasdoor(
        casdoorUserInfo,
        req,
        resp
      );
    } else {
      // 用户已存在，同步更新Casdoor信息到本地
      await CasdoorService.syncCasdoorUserInfoToDatabase(
        localUser,
        casdoorUserInfo
      );
    }

    // 5. 把 Casdoor 用户级 access_token 落库（复用 TUserInfo.pwd 字段作为 token 仓库，
    //    供后续「用户调用」Casdoor 接口时使用，避免每次都重新走 OAuth 流程）
    await UserDao.update_user_pwd(localUser.uid, oauthToken.access_token);

    // 6. 生成本地JWT令牌
    const jwt_token = createToken({
      user_name: localUser.user_name,
      uid: localUser.uid,
      level: localUser.level || "0",
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
   * @param {Object} req - 请求对象（可选）
   * @param {Object} resp - 响应对象（可选）
   * @returns {Promise<Object>} 本地用户对象
   */
  static async createLocalUserFromCasdoor(
    casdoorUser,
    req = null,
    resp = null
  ) {
    return await sequelize.transaction(async (t) => {
      // 使用Casdoor用户名或邮箱作为本地用户名
      const username = casdoorUser.name || casdoorUser.email;

      // 创建用户基础信息
      // 注：本地密码登录已废弃，TUserInfo.pwd 字段仅作 Casdoor access_token 仓库，
      // 在 Casdoor 登录回调时会写入 token，因此此处无需生成随机密码。
      const createdUser = await UserModel.add_user({
        user_name: username,
        transaction: t,
      });

      if (!createdUser) {
        throw new Error("创建本地用户失败");
      }

      // 记录注册IP信息
      let regIpInfoId = null;
      if (req && resp) {
        const { UserService } = require("@/ExpressServerEnd/Service/user_module/user_service");
        const regIpInfo = await UserService.add_user_act_ip_info({
          req,
          resp,
          act_info: UserActModel.reg,
          transaction: t,
        });
        regIpInfoId = regIpInfo.pk;
        await createdUser.update(
          { reg_ip_info_id: regIpInfoId },
          { transaction: t }
        );
      }

      // 同步Casdoor用户详细信息到TUserDetail表
      await CasdoorService.syncCasdoorUserInfoToDatabase(
        createdUser,
        casdoorUser,
        t
      );

      console.log(`成功创建Casdoor用户: ${username}, uid: ${createdUser.uid}`);

      return createdUser;
    });
  }

  /**
   * 将 Casdoor 用户信息同步到本地数据库
   * @param {Object} localUser - 本地用户对象
   * @param {Object} casdoorUser - Casdoor 用户信息
   * @param {Object} transaction - Sequelize 事务对象（可选）
   * @returns {Promise<void>}
   */
  static async syncCasdoorUserInfoToDatabase(
    localUser,
    casdoorUser,
    transaction = null
  ) {
    try {
      // 准备用户详细信息
      const userDetailData = {
        mid: localUser.uid,
        // 使用显示名称作为昵称，如果没有则使用用户名
        uname:
          casdoorUser.displayName || casdoorUser.name || localUser.user_name,
        // 头像 URL
        avatar: casdoorUser.avatar || "",
        // 个人简介/签名
        sign: casdoorUser.homepage || casdoorUser.bio || "",
        // 性别（Casdoor 可能不提供这个信息，默认为"保密"）
        sex: "保密",
        // 邮箱地址
        email: casdoorUser.email || "",
      };

      // 尝试从 Casdoor 属性中提取更多信息
      if (casdoorUser.attributes) {
        // 提取生日信息
        if (casdoorUser.attributes.birthday) {
          userDetailData.birthday = new Date(casdoorUser.attributes.birthday);
        }
        // 提取性别信息
        if (casdoorUser.attributes.gender) {
          const genderMap = {
            male: "男",
            female: "女",
          };
          userDetailData.sex =
            genderMap[casdoorUser.attributes.gender.toLowerCase()] || "保密";
        }
        // 提取签名
        if (casdoorUser.attributes.signature) {
          userDetailData.sign = casdoorUser.attributes.signature;
        }
      }

      // upsert 用户详细信息（存在则更新，不存在则创建）
      await TUserDetail.upsert(userDetailData, {
        transaction: transaction,
      });

      // 创建或初始化用户等级信息
      await TUserLevel.findOrCreate({
        where: { mid: localUser.uid },
        defaults: {
          mid: localUser.uid,
          current_level: 0,
          current_exp: 0,
          current_min: 0,
        },
        transaction: transaction,
      });

      // 创建或初始化用户VIP信息
      await TUserVip.findOrCreate({
        where: { mid: localUser.uid },
        defaults: {
          mid: localUser.uid,
          vip_status: 0,
          vip_type: 0,
          vip_pay_type: 0,
          vip_due_date: 0,
        },
        transaction: transaction,
      });

      console.log(`成功同步Casdoor用户信息到数据库: ${localUser.user_name}`);
    } catch (error) {
      console.error("同步Casdoor用户信息到数据库失败:", error);
      throw error;
    }
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

      let localUser = await TUserInfo.findOne({
        where: {
          user_name: username,
        },
      });

      if (!localUser) {
        // 用户不存在，创建新用户
        localUser = await CasdoorService.createLocalUserFromCasdoor(
          casdoorUser,
          req,
          resp
        );
      } else {
        // 用户已存在，同步更新Casdoor信息到本地
        await CasdoorService.syncCasdoorUserInfoToDatabase(
          localUser,
          casdoorUser
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
   * 该 token 在 Casdoor 登录回调时写入 TUserInfo.pwd 字段（作为 token 仓库）。
   * @param {Object} params
   * @param {string|number} [params.uid] - 本地用户 uid
   * @param {string} [params.user_name] - 本地用户 user_name（即 Casdoor 用户名）
   * @returns {Promise<string|null>} Casdoor access_token，未找到返回 null
   */
  static async getCasdoorTokenFromDb({ uid, user_name } = {}) {
    if (!uid && !user_name) {
      throw new Error("getCasdoorTokenFromDb 需要 uid 或 user_name");
    }
    const where = uid ? { uid } : { user_name };
    const user_info = await TUserInfo.findOne({
      attributes: ["uid", "user_name", "pwd"],
      where,
    });
    if (!user_info) {
      return null;
    }
    // pwd 字段复用作 Casdoor token 仓库；若为空或仍为旧式 md5 哈希（32位十六进制）则视为无效
    const pwd = user_info.pwd;
    if (!pwd || /^[a-f0-9]{32}$/i.test(pwd)) {
      return null;
    }
    return pwd;
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

    // 2. 从数据库 pwd 取回 Casdoor 用户级 token
    const casdoorToken = await CasdoorService.getCasdoorTokenFromDb({
      uid,
      user_name: casdoorUserName,
    });

    // 3. 有 token 走用户调用；否则回退 service 调用
    return await CasdoorService.getCasdoorUserByUserName(casdoorUserName, casdoorToken
      ? { asUser: true, token: casdoorToken }
      : undefined);
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
      // 检查用户是否已存在于本地数据库
      let localUser = await TUserInfo.findOne({
        where: {
          user_name: username,
        },
      });

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

      // 同步用户详细信息到 TUserDetail 表
      const userDetailData = {
        mid: localUser.uid,
        uname: displayName || username,
        avatar: avatar || "",
        sign: `${provider}用户`,
        sex: "保密",
        email: email || "", // 保存邮箱地址
      };

      await TUserDetail.upsert(userDetailData);

      // 创建或初始化用户等级信息
      await TUserLevel.findOrCreate({
        where: { mid: localUser.uid },
        defaults: {
          mid: localUser.uid,
          current_level: 0,
          current_exp: 0,
          current_min: 0,
        },
      });

      // 创建或初始化用户VIP信息
      await TUserVip.findOrCreate({
        where: { mid: localUser.uid },
        defaults: {
          mid: localUser.uid,
          vip_status: 0,
          vip_type: 0,
          vip_pay_type: 0,
          vip_due_date: 0,
        },
      });

      return localUser;
    } catch (error) {
      console.error(`创建或更新${provider}用户失败:`, error);
      throw error;
    }
  }
}

module.exports = { CasdoorService };
