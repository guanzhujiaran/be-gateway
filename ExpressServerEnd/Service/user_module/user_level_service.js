const {
  TUserLevel,
  TUserDetail,
  TUserInfo,
} = require("@/ExpressServerEnd/DAO/SqlHelper");
const { UserDao } = require("@/ExpressServerEnd/DAO/UserDao");
const {
  base_api_model,
} = require("@/ExpressServerEnd/Model/base_model/base_model");
const config = require("@/ExpressServerEnd/config/index");
const { Op } = require("sequelize");
const { levelToRole, isRoot, getRoleDescription } = require("@/ExpressServerEnd/Service/user_module/user_role_const");
const { t } = require("@/ExpressServerEnd/Tool/Utl");

/**
 * 升级时自动同步用户的成长等级角色：
 * 当经验值提升导致等级上升，且当前角色不是 root（管理员角色不会被升级逻辑覆盖）时，
 * 将 TUserInfo.role 更新为对应的 level{n}。
 * @param {string|number} mid - 用户ID
 * @param {number} new_level - 升级后的等级
 * @param {object} t - sequelize 事务
 * @return {Promise<boolean>} 是否发生了角色更新
 */
async function syncRoleOnLevelUp(mid, new_level, t) {
  const current = await TUserInfo.findOne({
    attributes: ['uid', 'role'],
    where: { uid: mid },
    transaction: t,
    lock: true,
  });
  if (!current) return false;
  // root 是独立的管理员角色，升级逻辑不得覆盖
  if (isRoot(current.role)) return false;
  const targetRole = levelToRole(new_level);
  if (current.role === targetRole) return false;
  await TUserInfo.update(
    { role: targetRole },
    { where: { uid: mid }, transaction: t }
  );
  return true;
}

class UserLevelService {
  /**
   * 获取等级信息
   * @param mid
   * @return {Promise<base_api_model>}
   */
  static async get_level_info(mid) {
    let level_info = await TUserLevel.findOne({
      where: { mid },
    });

    if (!level_info) {
      // 如果用户等级信息不存在，初始化默认值
      level_info = await TUserLevel.create({
        mid: mid,
        current_level: 0,
        current_exp: 0,
        current_min: 0,
      });
    }

    const level_config = config.common_config.level_config;
    const exp_requirements = level_config.level_exp_requirements;

    // 使用 BigInt 处理大数值，避免精度丢失
    const current_exp = BigInt(level_info.current_exp || 0);

    // 根据经验值重新计算等级，完全基于配置文件
    // level_0 默认为 0
    let current_level = 0n;
    let current_min = 0n;

    for (let level = 1n; level <= BigInt(level_config.max_level); level++) {
      const level_key = `level_${level}`;
      const required_exp = BigInt(exp_requirements[level_key] || 0);

      if (current_exp >= required_exp) {
        current_level = level;
        current_min = required_exp;
      } else {
        break;
      }
    }

    // 计算下一级所需经验值
    let next_exp = "--";
    if (current_level < BigInt(level_config.max_level)) {
      const level_key = `level_${current_level + 1n}`;
      const next_level_exp = exp_requirements[level_key];
      if (next_level_exp !== undefined && next_level_exp !== null) {
        next_exp = String(next_level_exp);
      } else {
        next_exp = "--";
      }
    }

    return new base_api_model({
      data: {
        current_level: Number(current_level),
        current_min: String(current_min),
        current_exp: String(current_exp),
        next_exp: next_exp,
      },
    });
  }

  /**
   * 增加经验值
   * @param mid
   * @param exp
   * @return {Promise<base_api_model>}
   */
  static async add_exp(mid, exp) {
    return await TUserLevel.sequelize.transaction(async (t) => {
      let level_info = await TUserLevel.findOne({
        where: { mid },
        transaction: t,
        lock: true,
      });

      if (!level_info) {
        level_info = await TUserLevel.create(
          {
            mid: mid,
            current_level: 0,
            current_exp: 0,
            current_min: 0,
          },
          { transaction: t }
        );
      }

      // 使用 BigInt 处理大数值，避免精度丢失
      const old_exp = BigInt(level_info.current_exp || 0);
      const new_exp = old_exp + BigInt(exp);
      level_info.current_exp = String(new_exp);

      const level_config = config.common_config.level_config;
      const exp_requirements = level_config.level_exp_requirements;

      // 根据经验值计算新等级，完全基于配置文件
      // level_0 默认为 0
      let new_level = 0n;
      let new_min = 0n;

      for (let level = 1n; level <= BigInt(level_config.max_level); level++) {
        const level_key = `level_${level}`;
        const required_exp = BigInt(exp_requirements[level_key] || 0);

        if (new_exp >= required_exp) {
          new_level = level;
          new_min = required_exp;
        } else {
          break;
        }
      }

      const old_level = BigInt(level_info.current_level || 0);
      level_info.current_level = Number(new_level);
      // current_min 完全根据配置计算，是当前等级的起始经验值
      level_info.current_min = String(new_min);

      await level_info.save({ transaction: t });

      // 升级时自动同步成长等级角色（不覆盖 root）
      let role_updated = false;
      if (new_level > old_level) {
        role_updated = await syncRoleOnLevelUp(mid, Number(new_level), t);
      }

      return new base_api_model({
        data: {
          old_exp: String(old_exp),
          new_exp: String(new_exp),
          old_level: Number(old_level),
          new_level: Number(new_level),
          leveled_up: new_level > old_level,
          role_updated,
        },
        msg: new_level > old_level ? "升级了！" : "经验值增加成功",
      });
    });
  }

  /**
   * 每日首次登录增加经验值
   * @param mid
   * @return {Promise<base_api_model>}
   */
  static async add_daily_login_exp(mid) {
    return await TUserLevel.sequelize.transaction(async (t) => {
      const exp_config = config.common_config.level_config;
      const daily_exp = exp_config.daily_exp_bonus;
      let level_info = await TUserLevel.findOne({
        where: { mid },
        transaction: t,
        lock: true,
      });

      if (!level_info) {
        level_info = await TUserLevel.create(
          {
            mid: mid,
            current_level: 0,
            current_exp: daily_exp || 0,
            current_min: 0,
          },
          { transaction: t }
        );
      }

      // 检查今天是否已经登录过
      // 使用updatedAt字段来判断，如果今天是第一次操作则增加经验
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const last_updated = level_info.updatedAt
        ? new Date(level_info.updatedAt)
        : new Date(0);
      last_updated.setHours(0, 0, 0, 0);

      if (last_updated.getTime() === today.getTime()) {
        // 今天已经操作过了
        return new base_api_model({
          code: 1,
          msg: "今天已经领取过经验值了",
          data: {
            can_add_exp: false,
            current_level: Number(BigInt(level_info.current_level || 0)),
            current_exp: level_info.current_exp,
          },
        });
      }

      // 增加每日经验值

      const old_exp = BigInt(level_info.current_exp || 0);
      const new_exp = old_exp + BigInt(daily_exp);
      level_info.current_exp = String(new_exp);

      const exp_requirements = exp_config.level_exp_requirements;

      // 根据经验值计算新等级，完全基于配置文件
      // level_0 默认为 0
      let new_level = 0n;
      let new_min = 0n;

      for (let level = 1n; level <= BigInt(exp_config.max_level); level++) {
        const level_key = `level_${level}`;
        const required_exp = BigInt(exp_requirements[level_key] || 0);

        if (new_exp >= required_exp) {
          new_level = level;
          new_min = required_exp;
        } else {
          break;
        }
      }

      const old_level = BigInt(level_info.current_level || 0);
      level_info.current_level = Number(new_level);
      // current_min 完全根据配置计算，是当前等级的起始经验值
      level_info.current_min = String(new_min);

      await level_info.save({ transaction: t });

      // 升级时自动同步成长等级角色（不覆盖 root）
      let role_updated = false;
      if (new_level > old_level) {
        role_updated = await syncRoleOnLevelUp(mid, Number(new_level), t);
      }

      return new base_api_model({
        data: {
          can_add_exp: true,
          old_exp: String(old_exp),
          new_exp: String(new_exp),
          old_level: Number(old_level),
          new_level: Number(new_level),
          leveled_up: new_level > old_level,
          role_updated,
          current_level: Number(new_level),
          current_exp: String(new_exp),
        },
        msg:
          new_level > old_level
            ? `每日登录奖励已发放，升级了！经验值+${daily_exp}`
            : `每日登录奖励已发放，经验值+${daily_exp}`,
      });
    });
  }
  /**
 * 根据用户经验值计算等级信息
 * @param {Object} level_info - 用户等级信息对象
 * @param {number} [level_info.current_level=0] - 当前等级
 * @param {number|string} [level_info.current_exp=0] - 当前经验值
 * @param {number|string} [level_info.current_min=0] - 当前等级最低经验值
 * @returns {Object} 计算后的等级信息
 * @returns {number} current_level - 根据经验值重新计算的当前等级
 * @returns {string} current_min - 当前等级所需的最低累积经验值（字符串格式）
 * @returns {string} current_exp - 当前经验值（字符串格式，使用BigInt处理避免精度丢失）
 * @returns {string} next_exp - 下一级所需累积经验值，已达到最高等级时返回"--"
 */
  static level_calc(level_info = {
    current_level: 0,
    current_exp: 0,
    current_min: 0
  }) {
    const level_config = config.common_config.level_config;
    const exp_requirements = level_config.level_exp_requirements;
    // 使用 BigInt 处理大数值，避免精度丢失
    const current_exp = BigInt(level_info.current_exp || 0);

    // 根据经验值重新计算等级，完全基于配置文件
    // level_0 默认为 0
    let current_level = 0n;
    let current_min = 0n;

    for (let level = 1n; level <= BigInt(level_config.max_level); level++) {
      const level_key = `level_${level}`;
      const required_exp = BigInt(exp_requirements[level_key] || 0);

      if (current_exp >= required_exp) {
        current_level = level;
        current_min = required_exp;
      } else {
        break;
      }
    }

    // 计算下一级所需经验值
    let next_exp = "--";
    if (current_level >= BigInt(level_config.max_level)) {
      // 已达到最高等级
      next_exp = "--";
    } else {
      // 获取下一级所需的累积经验值
      const level_key = `level_${current_level + 1n}`;
      const next_level_exp = exp_requirements[level_key];
      if (next_level_exp !== undefined && next_level_exp !== null) {
        next_exp = String(next_level_exp);
      } else {
        next_exp = "--";
      }
    }
    return {
      current_level: Number(current_level),
      current_min: String(current_min),
      current_exp: String(current_exp),
      next_exp: next_exp,
    }
  }

  /**
 * 获取用户导航信息（包含等级信息）
 * 每日首次调用时会自动增加用户的登录经验值
 * @param {string} uid - 用户ID
 * @returns {Promise<base_api_model>} 返回包含用户导航信息的API响应对象
 * @returns {string} data.uid - 用户ID
 * @returns {string} data.user_name - 用户昵称（优先使用详情中的昵称，否则使用用户名）
 * @returns {string} data.level - 用户角色等级
 * @returns {string} data.face - 用户头像URL
 * @returns {Object} data.level_info - 用户等级详细信息（经计算后的等级数据）
 * @returns {string} data.email - 用户邮箱
 * @returns {string} msg - 操作消息
 * @returns {number} code - 响应状态码（-1表示用户不存在）
 */
  static async get_user_nav_with_level(uid) {
    // 每日首次调用增加经验值
    try {
      await UserLevelService.add_daily_login_exp(uid);
    } catch (e) {
      console.error('添加每日经验值失败:', e);
      // 不影响导航信息获取，继续执行
    }

    const user_data = await UserDao.get_user_whole_info({ uid });
    if (!user_data) {
      return new base_api_model({
        code: -1,
        msg: "用户不存在",
      });
    }

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
        level_info: this.level_calc(user_data.TUserDetail?.TUserLevel),
        email: t.mask_email(user_data.TUserDetail?.email || ""),
      },
      msg: "获取成功",
    });
  }


  static async get_user_whole_info(uid) {
    const resp = await UserDao.get_user_whole_info({ uid });
    resp.level_info = this.level_calc(resp.TUserDetail?.TUserLevel)
    return resp
  }
}

module.exports = { UserLevelService };
