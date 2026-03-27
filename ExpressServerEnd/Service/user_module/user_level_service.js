const {
  TUserLevel,
  TUserDetail,
  TUserInfo,
} = require("@/ExpressServerEnd/DAO/SqlHelper");
const {
  base_api_model,
} = require("@/ExpressServerEnd/Model/base_model/base_model");
const config = require("@/ExpressServerEnd/config/index");
const { Op } = require("sequelize");

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

      return new base_api_model({
        data: {
          old_exp: String(old_exp),
          new_exp: String(new_exp),
          old_level: Number(old_level),
          new_level: Number(new_level),
          leveled_up: new_level > old_level,
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

      return new base_api_model({
        data: {
          can_add_exp: true,
          old_exp: String(old_exp),
          new_exp: String(new_exp),
          old_level: Number(old_level),
          new_level: Number(new_level),
          leveled_up: new_level > old_level,
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
   * 获取用户的完整导航信息（包含头像和等级）
   * @param uid
   * @return {Promise<base_api_model>}
   */
  static async get_user_nav_with_level(uid) {
    // 每日首次调用增加经验值
    try {
      await UserLevelService.add_daily_login_exp(uid);
    } catch (e) {
      console.error('添加每日经验值失败:', e);
      // 不影响导航信息获取，继续执行
    }

    const result = await TUserInfo.findOne({
      where: { uid },
      attributes: ["uid", "user_name", "role"],
      include: [
        {
          model: TUserDetail,
          as: "TUserDetail",
          required: false,
          attributes: ["uname", "avatar", "email"],
          include: [
            {
              model: TUserLevel,
              as: "TUserLevel",
              required: false,
              attributes: ["current_level", "current_exp", "current_min"],
            }
          ],
        },
      ],
    });

    if (!result) {
      return new base_api_model({
        code: -1,
        msg: "用户不存在",
      });
    }

    const user_data = result.toJSON();
    const level_config = config.common_config.level_config;
    const exp_requirements = level_config.level_exp_requirements;

    // 获取或初始化等级信息（现在从 TUserDetail.TUserLevel 获取）
    let level_info = user_data.TUserDetail?.TUserLevel || {
      current_level: 0,
      current_exp: 0,
      current_min: 0,
    };

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

    return new base_api_model({
      data: {
        uid: user_data.uid,
        user_name: user_data.TUserDetail?.uname || user_data.user_name,
        level: user_data.role,
        face: user_data.TUserDetail?.avatar || "",
        level_info: {
          current_level: Number(current_level),
          current_min: String(current_min),
          current_exp: String(current_exp),
          next_exp: next_exp,
        },
        email: user_data.TUserDetail?.email || "",
      },
      msg: "获取成功",
    });
  }
}

module.exports = { UserLevelService };
