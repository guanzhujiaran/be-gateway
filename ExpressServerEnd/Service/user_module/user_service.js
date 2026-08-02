const {
  UserModel,
} = require("@/ExpressServerEnd/Model/api/v1/user/user_model");
const {
  createToken,
  jwtAuth,
} = require("@/ExpressServerEnd/Service/user_permission_module/JwtModule");
const {
  base_api_model,
} = require("@/ExpressServerEnd/Model/base_model/base_model");
const config = require("@/ExpressServerEnd/config/index");
const {
  TUserDetail,
  TUserLevel,
  TUserVip,
  TUserInfo,
  TUserActInfoLog,
  sequelize,
  TUserNameRecord,
} = require("@/ExpressServerEnd/DAO/SqlHelper");
const { t, req_tool } = require("@/ExpressServerEnd/Tool/Utl");
const { Op, literal } = require("sequelize");
const {
  UserActModel,
} = require("@/ExpressServerEnd/Model/api/v1/user/user_act_model");
const { user_redis_dao } = require("@/ExpressServerEnd/DAO/UserRedisDao");
const {
  UserLevelService,
} = require("@/ExpressServerEnd/Service/user_module/user_level_service");
const {
  VALID_ROLES,
  isRoot,
  ROLE_ROOT,
  getRoleDescription,
} = require("@/ExpressServerEnd/Service/user_module/user_role_const");
const {
  CasdoorService,
} = require("@/ExpressServerEnd/Service/casdoor_module/CasdoorService");

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
    });
    await Promise.all([
      UserService.add_user_act_ip_info({
        req,
        resp,
        act_info: UserActModel.refresh_token,
      }),
      // user_redis_dao.add_black_list_jwt_signature({
      //     signature: req.headers.authorization.split('.').pop(),
      //     ttl: Math.ceil(req.auth.exp - Date.now() / 1000)
      // })
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

  /**
   * 获取用户登录信息
   * @param uid
   * @return {Promise<base_api_model>}
   */
  static async get_user_nav(uid) {
    return await UserLevelService.get_user_nav_with_level(uid);
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
    let user_info = await TUserInfo.findOne({
      attributes: {
        include: ["user_name", "role"],
      },
      where: {
        uid: uid,
      },
      include: [
        {
          model: TUserDetail,
          as: "TUserDetail",
          required: false,
          attributes: {
            exclude: ["createdAt", "updatedAt", "deletedAt"],
          },
          include: [
            {
              model: TUserLevel,
              as: "TUserLevel",
              required: false,
              attributes: {
                exclude: ["createdAt", "updatedAt", "deletedAt"],
              },
            },
            {
              model: TUserVip,
              as: "TUserVip",
              required: false,
              attributes: {
                exclude: ["createdAt", "updatedAt", "deletedAt"],
              },
            },
          ],
        },
      ],
    });
    if (!user_info) return null;
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
      new TUserDetail({ mid: user_info.uid }).toJSON();
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
      let empty_level_info = new TUserLevel({}).toJSON();
      t.delete_attr_from_obj(empty_level_info);
      t.delete_attr_from_obj(empty_level_info, ["mid"]);
      ret_object.level_info = empty_level_info;
    }
    if (!ret_object.vip) {
      let empty_vip = new TUserVip({}).toJSON();
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
    let user_infos = await TUserInfo.findAll({
      attributes: {
        include: ["user_name"],
      },
      where: {
        uid: {
          [Op.in]: uid_arr,
        },
      },
      include: [
        {
          model: TUserDetail,
          as: "TUserDetail",
          required: false,
          attributes: {
            exclude: ["createdAt", "updatedAt", "deletedAt"],
          },
          include: [
            {
              model: TUserLevel,
              as: "TUserLevel",
              required: false,
              attributes: {
                exclude: ["createdAt", "updatedAt", "deletedAt"],
              },
            },
            {
              model: TUserVip,
              as: "TUserVip",
              required: false,
              attributes: {
                exclude: ["createdAt", "updatedAt", "deletedAt"],
              },
            },
          ],
        },
      ],
    });
    if (!user_infos) return null;
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
    let user_info = await TUserInfo.findOne({
      attributes: ["uid"],
      where: {
        uid: uid,
      },
      include: [
        {
          attributes: {
            include: [
              [
                literal(`COALESCE("TUserDetail"."mid", "TUserInfo"."uid")`),
                "mid",
              ],
              [literal(`COALESCE("TUserInfo"."user_name")`), "userid"],
              [
                literal(
                  `COALESCE("TUserDetail"."uname","TUserInfo"."user_name")`,
                ),
                "uname",
              ],
              [literal('COALESCE("TUserDetail"."sign", \'\')'), "usersign"],
              [literal('COALESCE("TUserDetail"."sex", \'保密\')'), "sex"],
              [
                literal(
                  'COALESCE("TUserDetail"."birthday", \'1970-01-01 00:00:00+08\'::date)',
                ),
                "birthday",
              ],
            ],
            exclude: ["createdAt", "updatedAt", "deletedAt", "avatar", "sign"],
          },
          as: "TUserDetail",
          model: TUserDetail,
          required: false,
        },
      ],
    });
    const detail = user_info.toJSON().TUserDetail;
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

  static async set_user_info({ uid, uname, usersign, sex, birthday }) {
    let is_exist = await TUserDetail.findOne({
      where: {
        uname: uname,
        [Op.not]: {
          mid: uid,
        },
      },
    });
    if (is_exist)
      return new base_api_model({
        code: 40014,
        msg: "该昵称已存在",
      });
    let origin_user_detail = await TUserDetail.findOne({
      where: {
        mid: uid,
      },
    });
    await sequelize.transaction(async (t) => {
      await TUserDetail.upsert(
        {
          mid: uid,
          uname,
          sign: usersign,
          sex,
          birthday,
        },
        { transaction: t },
      );
      if (origin_user_detail && origin_user_detail.uname !== uname) {
        //更新了昵称的情况
        await TUserNameRecord.create(
          {
            mid: uid,
            prev_uname: uname,
          },
          { transaction: t },
        );
      }
    });
    return new base_api_model({
      msg: "0",
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

  /**
   * 设置（调整）用户的角色
   * 权限要求：只有当前操作者自身为 root（系统管理员）才能调用本接口。
   * - 管理员可以把任意普通用户提升为 root（赋予管理员权限），也可以把 root 降为某个等级角色。
   * - 普通用户无法修改任何人的角色（包括自己）。
   *
   * @param {Object} params
   * @param {string|number} params.operator_uid - 当前操作者 UID（来自 JWT）
   * @param {string|number} params.target_uid - 目标用户 UID
   * @param {string} params.role - 目标角色，取值见 VALID_ROLES（level0~level6 或 root）
   * @return {Promise<base_api_model>}
   */
  static async set_user_role({ operator_uid, target_uid, role }) {
    // 1. 校验目标角色合法
    if (!VALID_ROLES.includes(role)) {
      return new base_api_model({
        code: 400,
        msg: `非法的角色值：${role}`,
      });
    }

    // 2. 查询操作者角色，只有 root 才能赋予/调整角色
    const operator_info = await TUserInfo.findOne({
      attributes: ["uid", "user_name", "role"],
      where: { uid: operator_uid },
    });
    if (!operator_info) {
      return new base_api_model({ code: -1, msg: "操作者账号不存在" });
    }
    if (!isRoot(operator_info.role)) {
      return new base_api_model({
        code: -403,
        msg: "权限不足：只有系统管理员（root）才能设置用户角色",
      });
    }

    // 3. 不能操作自己（防止管理员误把自己降级导致系统无管理员）
    if (String(operator_uid) === String(target_uid)) {
      return new base_api_model({
        code: 400,
        msg: "不能修改自己的角色",
      });
    }

    // 4. 查询目标用户
    const target_info = await TUserInfo.findOne({
      attributes: ["uid", "user_name", "role"],
      where: { uid: target_uid },
    });
    if (!target_info) {
      return new base_api_model({ code: 400, msg: "目标用户不存在" });
    }

    // 5. 更新目标用户角色
    await TUserInfo.update({ role: role }, { where: { uid: target_uid } });

    const target_desc = getRoleDescription(role);
    return new base_api_model({
      code: 0,
      msg: `已将用户【${target_info.user_name}】的角色设置为【${target_desc.name}】`,
      data: {
        target_uid: String(target_uid),
        target_user_name: target_info.user_name,
        role: role,
        role_name: target_desc.name,
        role_description: target_desc.description,
      },
    });
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

    // 1. 查询本地用户，拿到用于匹配 Casdoor 的 user_name（仅以鉴权身份为准）
    const local_user = await TUserInfo.findOne({
      attributes: ["uid", "user_name"],
      where: { uid: auth_uid },
    });
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
    //   - 从数据库 pwd 字段取回 Casdoor access_token
    //   - 以「用户调用」(Bearer) 查询；若库中无 token 则回退「service 调用」
    // 故意不使用 try/catch，便于在 casdoor SDK 调用出错时直接抛出真实堆栈
    const casdoor_user = await CasdoorService.getCasdoorUserAsUser({
      uid: auth_uid,
    });
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
