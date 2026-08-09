const {
  UserModel,
} = require("@/ExpressServerEnd/Model/api/v1/user/user_model");
// pptr 用户读写全部走 be-message RPC，不再维护本地 sequelize 用户表
const { callRpc } = require("@/ExpressServerEnd/Service/mq/rpc_client");
const {
  createToken,
} = require("@/ExpressServerEnd/Service/user_permission_module/JwtModule");
const {
  base_api_model,
} = require("@/ExpressServerEnd/Model/base_model/base_model");
const { t, req_tool } = require("@/ExpressServerEnd/Tool/Utl");
const {
  UserActModel,
} = require("@/ExpressServerEnd/Model/api/v1/user/user_act_model");
const { user_redis_dao } = require("@/ExpressServerEnd/DAO/UserRedisDao");
const {
  CasdoorService,
} = require("@/ExpressServerEnd/Service/casdoor_module/CasdoorService");
// 用户主表已下沉 be-message（RPC），仅 TUserActInfoLog（登录IP记录）仍由 pptr 本地维护
const { TUserActInfoLog } = require("@/ExpressServerEnd/DAO/SqlHelper");

class UserService {
  //region 用户令牌刷新（本地密码登录已废弃，pwd 字段仅作 Casdoor token 仓库）
  static async refresh_token({ uid, req, resp }) {
    let user_model = new UserModel({ uid: uid });
    await user_model.get_uname_uid_pwd();
    if (!user_model.uid) {
      return new base_api_model({ code: -1, msg: "账号不存在", data: null });
    }
    let jwt_token = createToken({
      user_name: user_model.user_name,
      uid: user_model.uid,
      level: user_model.level,
      role: user_model.role || "0",
    });
    await Promise.all([
      UserService.add_user_act_ip_info({
        req,
        resp,
        act_info: UserActModel.refresh_token,
      }),
      // 同步刷新 Casdoor OAuth token 并更新 TUserInfo.pwd，与登录时的逻辑保持一致
      (async () => {
        const { CasdoorService } = require("@/ExpressServerEnd/Service/casdoor_module/CasdoorService");
        await CasdoorService.refreshCasdoorToken(uid);
      })(),
    ]);

    return new base_api_model({
      data: {
        uid: user_model.uid,
        user_name: user_model.user_name,
        jwt_token: jwt_token,
      },
      msg: "刷新成功！",
    });
  }

  //endregion

  //region 用户信息相关
  static async get_user_vip({ uid }) {
    let user = new UserModel({ uid });
    return new base_api_model({
      data: await user.get_user_vip(),
    });
  }

  /**
   *
   * @param uid
   * @param is_own_uid
   * @returns {Promise<{
   *     mid:string,
   *     avatar:string|null,
   *     uname:string|null,
   *     sign:string|null,
   *     sex:string|null,
   *     level_info:{
   *        current_exp:number,
   *        current_level:number,
   *        current_min:number
   *        },
   *        vip:{
   *         vip_due_date:number,
   *         vip_pay_type:number,
   *         vip_status:number,
   *         vip_type:number
   *         }
   * }|null>} 用户信息对象，包含以下属性：
   */
  /**
   * 获取用户详细信息
   * @param {Object} params - 参数对象
   * @param {string} params.uid - 用户ID
   * @param {boolean} [params.is_own_uid=false] - 是否为当前用户自己的UID，用于控制用户名脱敏
   * @returns {Promise<Object|null>} 返回用户详细信息对象或null（用户不存在时）
   * @returns {string} uid - 用户ID
   * @returns {string} user_name - 用户名（注册时默认名字，不能修改）
   * @returns {string} pwd - 用户密码（已加密）
   * @returns {string} role - 用户角色（如："level0"）
   * @returns {number} reg_ip_info_id - 注册IP信息ID
   * @returns {Object} info - 用户详细信息
   * @returns {string} info.mid - 用户MID
   * @returns {string} info.avatar - 用户头像URL
   * @returns {string} info.uname - 用户昵称（可修改）
   * @returns {string} info.sign - 用户个性签名
   * @returns {string} info.sex - 用户性别（如："保密"）
   * @returns {string} info.birthday - 用户生日（ISO格式）
   * @returns {string} info.email - 用户邮箱
   * @returns {Object} info.level_info - 用户等级信息
   * @returns {string} info.level_info.mid - 用户MID
   * @returns {string} info.level_info.current_exp - 当前经验值
   * @returns {string} info.level_info.current_level - 当前等级
   * @returns {string} info.level_info.current_min - 当前等级最低经验值
   * @returns {Object} info.vip - 用户VIP信息
   * @returns {string} info.vip.mid - 用户MID
   * @returns {number} info.vip.vip_due_date - VIP到期时间戳
   * @returns {number} info.vip.vip_pay_type - VIP支付类型
   * @returns {number} info.vip.vip_status - VIP状态
   * @returns {number} info.vip.vip_type - VIP类型
   *
   * @example
   * // 返回示例：
   * {
   *   uid: "1",
   *   user_name: "sbd",
   *   pwd: "qcm5li652bl",
   *   role: "level0",
   *   reg_ip_info_id: 1,
   *   info: {
   *     mid: "1",
   *     avatar: "https://gitee.com/assets/no_portrait.png",
   *     uname: "星瞳",
   *     sign: "",
   *     sex: "保密",
   *     birthday: "1970-01-05T16:00:00.000Z",
   *     email: "1944637830@qq.com",
   *     level_info: {
   *       mid: "1",
   *       current_exp: "9999900000",
   *       current_level: "0",
   *       current_min: "0",
   *     },
   *     vip: {
   *       mid: "1",
   *       vip_due_date: 0,
   *       vip_pay_type: 0,
   *       vip_status: 0,
   *       vip_type: 0,
   *     },
   *   },
   * }
   */
  static async get_user_detail_info(
    { uid, is_own_uid } = { is_own_uid: false },
  ) {
    const resp = await callRpc("get_user_info", { uid });
    const data = resp && resp.code === 0 ? resp.data : null;
    if (!data) return null;
    // 构造与旧 sequelize 嵌套结构兼容的对象，供 generate_user_detail_info 复用
    const user_info = {
      uid: data.uid,
      user_name: data.user_name,
      role: data.role,
      toJSON() {
        return {
          uid: data.uid,
          user_name: data.user_name,
          role: data.role,
          TUserDetail: {
            mid: data.uid,
            uname: data.uname,
            avatar: data.face,
            sign: "",
            sex: "",
            email: "",
            TUserLevel: { mid: data.uid, current_level: data.current_level },
            TUserVip: {
              mid: data.uid,
              vip_type: data.vip_type,
              vip_due_date: data.vip_due_date,
              vip_status: data.vip_status,
            },
          },
        };
      },
    };
    return UserService.generate_user_detail_info(user_info, is_own_uid);
  }

  static generate_user_detail_info(user_info, is_own_uid = false) {
    // uname 是昵称.能改
    // user_name是注册时的默认名字,不能改
    let keyMap = {
      TUserVip: "vip",
      TUserLevel: "level_info",
    };
    let user_info_json = user_info.toJSON();
    let user_detail_json =
      user_info_json.TUserDetail ??
      { mid: user_info.uid, uname: null, avatar: null, sign: null, sex: null, email: null };
    let middle_user_name = user_info_json.user_name.slice(1, -1);
    let mock_user_name = is_own_uid
      ? user_info_json.user_name
      : user_info_json.user_name.replaceAll(
          middle_user_name,
          "*".repeat(middle_user_name.length),
        );
    user_detail_json.uname = user_detail_json.uname || mock_user_name;
    t.delete_attr_from_obj(user_detail_json);
    let ret_object = Object.fromEntries(
      Object.entries(user_detail_json).map(([key, value]) => [
        keyMap[key] || key,
        value,
      ]),
    );
    if (!ret_object.level_info) {
      let empty_level_info = { mid: null, current_level: null, current_exp: null, current_min: null };
      t.delete_attr_from_obj(empty_level_info);
      t.delete_attr_from_obj(empty_level_info, ["mid"]);
      ret_object.level_info = empty_level_info;
    }
    if (!ret_object.vip) {
      let empty_vip = { mid: null, vip_due_date: null, vip_pay_type: null, vip_status: null, vip_type: null };
      delete empty_vip.mid;
      t.delete_attr_from_obj(empty_vip);
      ret_object.vip = empty_vip;
    }
    user_info_json.info = ret_object;
    delete user_info_json.TUserDetail;
    t.delete_attr_from_obj(user_info_json);
    return user_info_json;
  }

  /**
   * 一口气获取所有的用户信息
   * @param uid_arr
   * @param own_uid
   * @return {Promise<{[p: string]: any}[]>}
   */
  static async get_all_user_detail_infos({ uid_arr, own_uid }) {
    const results = await Promise.all(
      (uid_arr || []).map(async (uid) => {
        const resp = await callRpc("get_user_info", { uid });
        const data = resp && resp.code === 0 ? resp.data : null;
        if (!data) return null;
        return {
          uid: data.uid,
          user_name: data.user_name,
          role: data.role,
          toJSON() {
            return {
              uid: data.uid,
              user_name: data.user_name,
              role: data.role,
              TUserDetail: {
                mid: data.uid,
                uname: data.uname,
                avatar: data.face,
                sign: "",
                sex: "",
                email: "",
                TUserLevel: { mid: data.uid, current_level: data.current_level },
                TUserVip: {
                  mid: data.uid,
                  vip_type: data.vip_type,
                  vip_due_date: data.vip_due_date,
                  vip_status: data.vip_status,
                },
              },
            };
          },
        };
      }),
    );
    const user_infos = results.filter(Boolean);
    if (!user_infos.length) return null;
    return user_infos.map((user_info) =>
      UserService.generate_user_detail_info(
        user_info,
        String(own_uid) === String(user_info.uid),
      ),
    );
  }

  /**
   *
   * @param req
   * @param resp
   * @param act_info {Object.<UserActModel>}
   * @param transaction
   * @return {Promise<*>}
   */
  static async add_user_act_ip_info({
    req,
    resp,
    act_info,
    transaction = undefined,
  }) {
    return await TUserActInfoLog.create(
      {
        mid: req?.auth?.uid ?? null,
        ip: req_tool.get_ip(req, resp),
        ua: req_tool.get_ua(req, resp),
        headers: req_tool.get_headers(req, resp),
        act_info,
      },
      {
        transaction: transaction,
      },
    );
  }

  static async get_user_info({ uid }) {
    const resp = await callRpc("get_user_info", { uid });
    const data = resp && resp.code === 0 ? resp.data : null;
    if (!data) {
      return new base_api_model({ code: 0, data: null, msg: "" });
    }
    const detail = {
      uid: data.uid,
      userid: data.user_name,
      uname: data.uname,
      usersign: "",
      sex: "",
      birthday: "",
      email: data.email || "",
    };
    // 邮箱脱敏：保留首字符 + @ 后缀，中间打码
    if (detail && detail.email) {
      detail.email = t.mask_email(detail.email);
    }
    return new base_api_model({
      code: 0,
      data: detail,
      msg: "",
    });
  }

  /**
   * 用户退出登录
   * @param req
   * @param resp
   * @return {Promise<base_api_model>}
   */
  static async logout({ req, resp }) {
    try {
      let uid = req.auth?.uid;
      if (!uid) {
        return new base_api_model({
          code: -1,
          msg: "用户未登录",
        });
      }

      // 将当前JWT token加入黑名单
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        // 从token中获取过期时间
        const payload = JSON.parse(
          Buffer.from(token.split(".")[1], "base64").toString(),
        );
        const ttl = Math.ceil(payload.exp - Date.now() / 1000);

        if (ttl > 0) {
          await user_redis_dao.add_black_list_jwt_signature({
            signature: token.split(".").pop(),
            ttl: ttl,
          });
        }
      }

      // 记录退出日志
      await UserService.add_user_act_ip_info({
        req,
        resp,
        act_info: UserActModel.logout,
      });

      return new base_api_model({
        code: 0,
        msg: "退出登录成功",
      });
    } catch (error) {
      console.error("退出登录失败:", error);
      return new base_api_model({
        code: -1,
        msg: "退出登录失败: " + error.message,
      });
    }
  }

  /**
   * 无密码登录（用于SSO登录）
   * @param user_name
   * @param req
   * @param resp
   * @return {Promise<base_api_model>}
   */
  static async check_login_without_password({ user_name, req, resp }) {
    let user_model = new UserModel({ user_name: user_name });
    await user_model.get_uname_uid_pwd();
    // 注：本地密码登录已废弃，pwd 字段现在仅作 Casdoor token 仓库，不再用于登录校验。
    // 此处只要用户真实存在即视为登录成功（SSO 场景）。
    if (!user_model.uid) {
      return new base_api_model({ code: -1, msg: "用户不存在", data: null });
    }
    req.auth = {
      uid: user_model.uid,
    };
    let jwt_token = createToken({
      user_name: user_model.user_name,
      uid: user_model.uid,
      level: user_model.level,
      role: user_model.role || "0",
    });

    await UserService.add_user_act_ip_info({
      req,
      resp,
      act_info: UserActModel.login_succ,
    });
    return new base_api_model({
      data: {
        uid: user_model.uid,
        user_name: user_model.user_name,
        jwt_token: jwt_token,
        level: user_model.level,
        role: user_model.role,
      },
    });
  }

  static async is_user_exists({ user_name }) {
    let is_user_name_exist = await UserModel.is_exists_by_user_name(user_name);
    return is_user_name_exist;
  }

  //region 获取 Casdoor 用户信息（积分等）
  /**
   * 获取当前登录用户在 Casdoor 侧的完整信息（如积分 score、余额等）。
   * Casdoor 用户名即本地 user_name。
   *
   * 调用模式（见 CasdoorService）：
   *  - 自动从本地 token(JWT) 解析出用户身份 -> 从数据库 pwd 字段取回 Casdoor access_token
   *    -> 作为「用户调用」(Bearer) 查询；
   *  - 若用户从未通过 Casdoor 登录（库中无 token），自动回退为「service 调用」。
   * @param {Object} params
   * @param {number|string} params.auth_uid - 当前登录用户 uid（来自 JWT 鉴权身份，不可被覆盖）
   * @param {number|string} [params.uid] - 期望查询的用户 uid（必须等于 auth_uid，否则拒绝）
   * @returns {Promise<base_api_model>}
   */
  static async get_casdoor_user_info({ auth_uid, uid }) {
    // 仅允许查询「当前登录用户」自身，禁止跨用户调用。
    // auth_uid 必须来自 JWT 鉴权身份（req.auth.uid），且不允许通过 uid 覆盖。
    if (!auth_uid) {
      return new base_api_model({ code: -401, msg: "未登录或身份信息缺失" });
    }
    if (uid !== undefined && String(uid) !== String(auth_uid)) {
      return new base_api_model({
        code: -403,
        msg: "禁止跨用户查询 Casdoor 信息",
      });
    }

    // 1. 查询本地用户，拿到用于匹配 Casdoor 的 user_name（仅以鉴权身份为准，走 RPC）
    const localResp = await callRpc("get_user_info", { uid: auth_uid });
    const local_user = localResp && localResp.code === 0 ? localResp.data : null;
    if (!local_user) {
      return new base_api_model({ code: -1, msg: "用户不存在" });
    }

    // 2. Casdoor 未启用时直接返回提示
    if (!CasdoorService.isEnabled()) {
      return new base_api_model({
        code: -2,
        msg: "Casdoor 未启用",
        data: null,
      });
    }

    // 3. 用稳定的登录名 user_name（非可修改的 uname 昵称）去 Casdoor 拉取详情。
    // getCasdoorUserAsUser 会自动：
    //   - 从本地 token(JWT) 解析用户身份
    //   - 从数据库 pwd 字段取回 Casdoor access_token（登录回调时已写入）
    //   - 以「用户调用」(Bearer 携带用户自己的凭证) 查询；
    //     仅当库中无 token 时回退「service 调用」；
    //     若两者都找不到则抛出明确错误（提示重新登录以绑定凭证）。
    let casdoor_user;
    try {
      casdoor_user = await CasdoorService.getCasdoorUserAsUser({
        uid: auth_uid,
      });
    } catch (e) {
      // 仅捕获「凭证未绑定 / 用户不存在」这类业务错误，转为 -3 返回；
      // Casdoor SDK 自身的调用异常（网络/鉴权）仍向上抛出以便排查。
      if (e && /尚未绑定 Casdoor 凭证|未找到对应的 Casdoor 用户/.test(e.message)) {
        return new base_api_model({
          code: -3,
          msg: e.message,
          data: null,
        });
      }
      throw e;
    }
    console.log("[casdoor_info] 原始 Casdoor 用户数据:", casdoor_user);
    if (!casdoor_user) {
      return new base_api_model({
        code: -3,
        msg: "未找到对应的 Casdoor 用户",
        data: null,
      });
    }

    // 4. 直接返回 Casdoor 原始用户数据，不做字段裁剪/重排
    return new base_api_model({
      code: 0,
      msg: "获取成功",
      data: casdoor_user,
    });
  }
  //endregion

  //endregion
}

module.exports = { UserService };
