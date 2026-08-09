const { UserDao } = require("@/ExpressServerEnd/DAO/UserDao");
const {
  base_api_model,
} = require("@/ExpressServerEnd/Model/base_model/base_model");
const { getRoleDescription } = require("@/ExpressServerEnd/Service/user_module/user_role_const");
const { t } = require("@/ExpressServerEnd/Tool/Utl");
// pptr 用户读写全部走 be-message RPC，不再维护本地 sequelize 用户表。
// 经验算法 / 每日幂等 / 升级角色同步等业务逻辑已整体下沉到 be-message（Python），
// 本文件仅为 RPC 透传与 API 适配层。
const { callRpc } = require("@/ExpressServerEnd/Service/mq/rpc_client");

/**
 * 把 RPC 返回的等级信息（PptrUserLevelInfo，已含 be-message 计算的 next_exp）
 * 包装为前端需要的 level_info 结构。
 */
function _to_level_info(lv) {
  if (!lv) return null;
  return {
    current_level: Number(lv.current_level || 0),
    current_exp: String(lv.current_exp != null ? lv.current_exp : 0),
    current_min: String(lv.current_min != null ? lv.current_min : 0),
    next_exp:
      lv.next_exp != null && lv.next_exp !== "" && lv.next_exp !== 0
        ? String(lv.next_exp)
        : "--",
  };
}

class UserLevelService {
  /**
   * 获取等级信息（业务逻辑在 be-message 侧完成，这里仅透传 RPC 结果）。
   * @param mid
   * @return {Promise<base_api_model>}
   */
  static async get_level_info(mid) {
    const lvResp = await callRpc("get_user_level", { uid: mid });
    const lv = lvResp && lvResp.code === 0 ? lvResp.data : null;
    return new base_api_model({
      data: _to_level_info(lv) || {
        current_level: 0,
        current_min: "0",
        current_exp: "0",
        next_exp: "--",
      },
    });
  }

  /**
   * 增加经验值（业务逻辑在 be-message 侧完成：经验计算 + 升级角色同步）。
   * @param mid
   * @param exp
   * @return {Promise<base_api_model>}
   */
  static async add_exp(mid, exp) {
    const resp = await callRpc("add_exp", { uid: mid, exp: Number(exp) || 0 });
    if (!resp || resp.code !== 0) {
      return new base_api_model({ code: 500, msg: "增加经验值失败" });
    }
    const d = resp.data || {};
    return new base_api_model({
      data: {
        old_exp: String(d.old_exp != null ? d.old_exp : 0),
        new_exp: String(d.new_exp != null ? d.new_exp : 0),
        old_level: Number(d.old_level || 0),
        new_level: Number(d.new_level || 0),
        leveled_up: !!d.leveled_up,
        role_updated: !!d.role_updated,
      },
      msg: d.leveled_up ? "升级了！" : "经验值增加成功",
    });
  }

  /**
   * 每日首次登录增加经验值（业务逻辑在 be-message 侧完成：每日幂等 + 经验计算 + 升级角色同步）。
   * @param mid
   * @return {Promise<base_api_model>}
   */
  static async add_daily_login_exp(mid) {
    const resp = await callRpc("add_daily_login_exp", { uid: mid });
    if (!resp || resp.code !== 0) {
      return new base_api_model({ code: 500, msg: "每日经验发放失败" });
    }
    const d = resp.data || {};
    const daily_exp = Number(d.new_exp != null ? d.new_exp : 0) -
      Number(d.old_exp != null ? d.old_exp : 0);
    return new base_api_model({
      data: {
        can_add_exp: d.can_add_exp !== false,
        old_exp: String(d.old_exp != null ? d.old_exp : 0),
        new_exp: String(d.new_exp != null ? d.new_exp : 0),
        old_level: Number(d.old_level || 0),
        new_level: Number(d.new_level || 0),
        leveled_up: !!d.leveled_up,
        role_updated: !!d.role_updated,
        current_level: Number(d.new_level || 0),
        current_exp: String(d.new_exp != null ? d.new_exp : 0),
        level_info: _to_level_info(d.level_info) || null,
      },
      msg: d.can_add_exp === false
        ? "今天已经领取过经验值了"
        : (d.leveled_up
          ? `每日登录奖励已发放，升级了！经验值+${daily_exp}`
          : `每日登录奖励已发放，经验值+${daily_exp}`),
    });
  }

  /**
   * 获取用户导航信息（包含等级信息）。
   * 每日首次调用时会自动增加用户的登录经验值（走 be-message RPC，逻辑在 Python 侧）。
   * @param {string} uid - 用户ID
   * @returns {Promise<base_api_model>}
   */
  static async get_user_nav_with_level(uid) {
    // 每日首次调用增加经验值（业务逻辑在 be-message 侧，这里仅触发 RPC）
    try {
      await UserLevelService.add_daily_login_exp(uid);
    } catch (e) {
      // RPC 超时 / 通信异常必须抛出，绝不能按查无此人静默吞掉
      if (e && (e.isRpcTimeout || e.isRpcTransport)) {
        throw e;
      }
      console.error('添加每日经验值失败(非通信异常):', e);
      // 其他业务错误不影响导航信息获取，继续执行
    }

    const user_data = await UserDao.get_user_whole_info({ uid });
    if (!user_data) {
      return new base_api_model({
        code: -1,
        msg: "用户不存在",
      });
    }

    // 等级信息由 be-message 侧计算，经 get_user_level RPC 取回（已含 next_exp）
    const lvResp = await callRpc("get_user_level", { uid });
    const lv = lvResp && lvResp.code === 0 ? lvResp.data : null;

    const roleInfo = getRoleDescription(user_data.role);
    return new base_api_model({
      data: {
        uid: user_data.uid,
        user_name: user_data.TUserDetail?.uname || user_data.user_name,
        role_info: {
          role: user_data.role,
          role_name: roleInfo.name,
          role_description: roleInfo.description,
        },
        face: user_data.TUserDetail?.avatar || "",
        level_info: _to_level_info(lv) || {
          current_level: 0,
          current_min: "0",
          current_exp: "0",
          next_exp: "--",
        },
        email: t.mask_email(user_data.TUserDetail?.email || ""),
      },
      msg: "获取成功",
    });
  }


  static async get_user_whole_info(uid) {
    const resp = await UserDao.get_user_whole_info({ uid });
    if (!resp) return resp;
    // 等级信息由 be-message 侧计算，经 get_user_level RPC 取回（已含 next_exp）
    const lvResp = await callRpc("get_user_level", { uid });
    const lv = lvResp && lvResp.code === 0 ? lvResp.data : null;
    resp.level_info = _to_level_info(lv) || {
      current_level: 0,
      current_min: "0",
      current_exp: "0",
      next_exp: "--",
    };
    return resp;
  }
}

module.exports = { UserLevelService };
