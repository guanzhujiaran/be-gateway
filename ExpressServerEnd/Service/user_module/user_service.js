const { UserModel } = require("@/ExpressServerEnd/Model/api/v1/user/user_model");
const md5 = require("md5");
const { createToken, jwtAuth } = require("@/ExpressServerEnd/Service/user_permission_module/JwtModule");
const { base_api_model } = require("@/ExpressServerEnd/Model/base_model/base_model");
const config = require('@/ExpressServerEnd/config/index');
const {
    TUserDetail,
    TUserLevel,
    TUserVip,
    TUserInfo,
    TUserActInfoLog,
    sequelize, TUserNameRecord
} = require("@/ExpressServerEnd/DAO/SqlHelper");
const { t, req_tool } = require("@/ExpressServerEnd/Tool/Utl");
const { Op, literal } = require("sequelize");
const { UserActModel } = require("@/ExpressServerEnd/Model/api/v1/user/user_act_model");
const { user_redis_dao } = require("@/ExpressServerEnd/DAO/UserRedisDao");
const { UserLevelService } = require("@/ExpressServerEnd/Service/user_module/user_level_service");

const password_salt = config.common_config.salt.password_salt;

class UserService {
    //region 用户登录注册密码相关
    static async change_user_pwd_when_login({ uid, pwd, req, resp }) {
        let user_info = await TUserInfo.findOne({ uid })

        if (!user_info) return new base_api_model({
            code: -100,
            msg: '账号不存在'
        });


        if (req) {
            req.auth = {
                uid: uid,
            }
            await UserService.add_user_act_ip_info({ req, resp, act_info: UserActModel.try_to_change_pwd })
        }
        let parsed_pwd = md5(pwd + password_salt);
        if (parsed_pwd === user_info.pwd) return new base_api_model({
            code: -99,
            msg: '新密码不能与旧密码相同'
        });
        user_info.pwd = parsed_pwd;
        await user_info.save();
        if (req) {
            await UserService.add_user_act_ip_info({ req, resp, act_info: UserActModel.change_pwd })
        }
        return new base_api_model({
            code: 0,
            msg: '修改成功，用新密码重新登录！'
        })
    }

    /**
     * 用户登录
     * @param uid
     * @param user_name
     * @param pwd {string} - 设置成前端加过密的密码
     * @param req
     * @param resp
     * @return {Promise<base_api_model>}
     */
    static async check_login({ uid, user_name, pwd, req, resp }) {
        let user_model = new UserModel({ uid: uid, user_name: user_name });
        await user_model.get_uname_uid_pwd();
        if (user_model.parsed_pwd) {
            req.auth = {
                uid: user_model.uid
            }
            let parsed_pwd = md5(pwd + password_salt);
            if (user_model.parsed_pwd === parsed_pwd) {
                let jwt_token = createToken({
                    user_name: user_model.user_name, uid: user_model.uid, level: user_model.level
                });

                await UserService.add_user_act_ip_info({ req, resp, act_info: UserActModel.login_succ })
                return new base_api_model({
                    data: {
                        uid: user_model.uid, user_name: user_model.user_name, jwt_token: jwt_token,
                    }
                })
            }
            await UserService.add_user_act_ip_info({ req, resp, act_info: UserActModel.login_fail_pwd_err })
        }
        return new base_api_model({ code: -1, msg: '密码错误或账号不存在', data: null })
    }

    static async refresh_token({ uid, req, resp }) {
        let user_model = new UserModel({ uid: uid });
        await user_model.get_uname_uid_pwd();
        if (user_model.parsed_pwd) {
            let jwt_token = createToken({
                user_name: user_model.user_name, uid: user_model.uid, level: user_model.level
            });
            await Promise.all([
                UserService.add_user_act_ip_info({ req, resp, act_info: UserActModel.refresh_token }),
                // user_redis_dao.add_black_list_jwt_signature({
                //     signature: req.headers.authorization.split('.').pop(),
                //     ttl: Math.ceil(req.auth.exp - Date.now() / 1000)
                // })
            ])

            return new base_api_model({
                data: {
                    uid: user_model.uid, user_name: user_model.user_name, jwt_token: jwt_token,
                },
                msg: '刷新成功！'
            })
        }
        return new base_api_model({ code: -1, msg: '账号不存在', data: null })
    }

    /**
     * 获取用户登录信息
     * @param uid
     * @return {Promise<base_api_model>}
     */
    static async get_user_nav(uid) {
        return await UserLevelService.get_user_nav_with_level(uid);
    }

    /**
     *
     * @param user_name
     * @param pwd
     * @param req
     * @param resp
     * @return {Promise<base_api_model>}
     */
    static async register({ user_name, pwd, req, resp }) {
        let is_user_name_exist = await UserModel.is_exists_by_user_name(user_name);
        if (is_user_name_exist) {
            return new base_api_model({
                code: 40014, msg: "该用户名已存在",
            })
        }
        let parsed_pwd = md5(pwd + password_salt);
        let created_instance;
        return await sequelize.transaction(async t => {
            created_instance = await UserModel.add_user({
                user_name: user_name, parsed_pwd: parsed_pwd, transaction: t
            })
            if (created_instance) {
                req.auth = {
                    uid: created_instance.uid
                }
                let reg_ip_info = await UserService.add_user_act_ip_info({
                    req,
                    resp,
                    act_info: UserActModel.reg,
                    transaction: t
                })
                created_instance.reg_ip_info_id = reg_ip_info.pk;
                await created_instance.save({ transaction: t });
                return new base_api_model({
                    msg: "注册成功！",
                })
            }
            return new base_api_model({
                msg: "发生未知错误，注册失败！",
            })
        })

    }

    //endregion

    //region 用户信息相关
    static async get_user_vip({ uid }) {
        let user = new UserModel({ uid })
        return new base_api_model({
            data: await user.get_user_vip()
        })
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
    static async get_user_detail_info({ uid, is_own_uid } = { is_own_uid: false }) {

        let user_info = await TUserInfo.findOne({
            attributes: {
                include: ['user_name', 'role']
            },
            where: {
                uid: uid
            }, include: [{
                model: TUserDetail, as: "TUserDetail", required: false,
                attributes: {
                    exclude: ['createdAt', 'updatedAt', 'deletedAt']
                },
                include: [
                    {
                        model: TUserLevel, as: "TUserLevel", required: false, attributes: {
                            exclude: ['createdAt', 'updatedAt', 'deletedAt']
                        },
                    },
                    {
                        model: TUserVip, as: "TUserVip", required: false, attributes: {
                            exclude: ['createdAt', 'updatedAt', 'deletedAt']
                        },
                    }
                ]
            }
            ]
        });
        if (!user_info) return null
        return UserService.generate_user_detail_info(user_info, is_own_uid);
    }

    static generate_user_detail_info(user_info, is_own_uid = false) {
        // uname 是昵称.能改
        // user_name是注册时的默认名字,不能改
        let keyMap = {
            TUserVip: "vip", TUserLevel: "level_info"
        }
        let user_info_json = user_info.toJSON();
        let user_detail_json = user_info_json.TUserDetail ?? (new TUserDetail({ mid: user_info.uid })).toJSON();
        let middle_user_name = user_info_json.user_name.slice(1, -1)
        let mock_user_name = is_own_uid ? user_info_json.user_name : user_info_json.user_name.replaceAll(middle_user_name, '*'.repeat(middle_user_name.length));
        user_detail_json.uname = user_detail_json.uname || mock_user_name
        t.delete_attr_from_obj(user_detail_json)
        let ret_object = Object.fromEntries(Object.entries(user_detail_json).map(([key, value]) => [keyMap[key] || key, value]));
        if (!ret_object.level_info) {
            let empty_level_info = (new TUserLevel({})).toJSON();
            t.delete_attr_from_obj(empty_level_info)
            t.delete_attr_from_obj(empty_level_info, ['mid'])
            ret_object.level_info = empty_level_info;
        }
        if (!ret_object.vip) {
            let empty_vip = (new TUserVip({})).toJSON();
            delete empty_vip.mid;
            t.delete_attr_from_obj(empty_vip)
            ret_object.vip = empty_vip;
        }
        user_info_json.info = ret_object
        delete user_info_json.TUserDetail
        t.delete_attr_from_obj(user_info_json)
        return user_info_json
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
                include: ['user_name']
            },
            where: {
                uid: {
                    [Op.in]: uid_arr
                }
            }, include: [{
                model: TUserDetail, as: "TUserDetail", required: false,
                attributes: {
                    exclude: ['createdAt', 'updatedAt', 'deletedAt']
                },
                include: [
                    {
                        model: TUserLevel, as: "TUserLevel", required: false, attributes: {
                            exclude: ['createdAt', 'updatedAt', 'deletedAt']
                        },
                    },
                    {
                        model: TUserVip, as: "TUserVip", required: false, attributes: {
                            exclude: ['createdAt', 'updatedAt', 'deletedAt']
                        },
                    }
                ]
            }
            ]
        });
        if (!user_infos) return null
        return user_infos.map(user_info => UserService.generate_user_detail_info(user_info, String(own_uid) === String(user_info.uid)))
    }


    /**
     *
     * @param req
     * @param resp
     * @param act_info {Object.<UserActModel>}
     * @param transaction
     * @return {Promise<*>}
     */
    static async add_user_act_ip_info({ req, resp, act_info, transaction = undefined }) {
        return await TUserActInfoLog.create({
            mid: req?.auth?.uid ?? null,
            ip: req_tool.get_ip(req, resp),
            ua: req_tool.get_ua(req, resp),
            headers: req_tool.get_headers(req, resp), act_info
        }, {
            transaction: transaction
        })
    }


    static async get_user_info({ uid }) {
        let user_info = await TUserInfo.findOne({
            attributes: ['uid'],
            where: {
                uid: uid,
            },
            include: [
                {
                    attributes: {
                        include: [
                            [literal(`COALESCE("TUserDetail"."mid", "TUserInfo"."uid")`), 'mid'],
                            [literal(`COALESCE("TUserInfo"."user_name")`), 'userid'],
                            [literal(`COALESCE("TUserDetail"."uname","TUserInfo"."user_name")`), 'uname'],
                            [literal('COALESCE("TUserDetail"."sign", \'\')'), 'usersign'],
                            [literal('COALESCE("TUserDetail"."sex", \'保密\')'), 'sex'],
                            [literal('COALESCE("TUserDetail"."birthday", \'1970-01-01 00:00:00+08\'::date)'), 'birthday']
                        ],
                        exclude: ['createdAt', 'updatedAt', 'deletedAt', 'avatar', 'sign']
                    },
                    as: 'TUserDetail',
                    model: TUserDetail,
                    required: false
                }
            ]
        })
        return new base_api_model({
            code: 0,
            data: user_info.toJSON().TUserDetail,
            msg: ''
        })
    }

    static async set_user_info({
        uid,
        uname,
        usersign,
        sex,
        birthday
    }) {
        let is_exist = await TUserDetail.findOne(
            {
                where: {
                    uname: uname,
                    [Op.not]: {
                        mid: uid
                    },
                }
            }
        );
        if (is_exist) return new base_api_model({
            code: 40014,
            msg: "该昵称已存在"
        });
        let origin_user_detail = await TUserDetail.findOne({
            where: {
                mid: uid
            }
        });
        await sequelize.transaction(async t => {
            await TUserDetail.upsert({
                mid: uid,
                uname,
                sign: usersign,
                sex,
                birthday
            }, { transaction: t })
            if (origin_user_detail && origin_user_detail.uname !== uname) {
                //更新了昵称的情况
                await TUserNameRecord.create({
                    mid: uid,
                    prev_uname: uname
                }, { transaction: t })
            }
        });
        return new base_api_model({
            msg: '0'
        })
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
                    msg: '用户未登录'
                });
            }

            // 将当前JWT token加入黑名单
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.substring(7);
                // 从token中获取过期时间
                const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
                const ttl = Math.ceil(payload.exp - Date.now() / 1000);

                if (ttl > 0) {
                    await user_redis_dao.add_black_list_jwt_signature({
                        signature: token.split('.').pop(),
                        ttl: ttl
                    });
                }
            }

            // 记录退出日志
            await UserService.add_user_act_ip_info({
                req,
                resp,
                act_info: UserActModel.logout
            });

            return new base_api_model({
                code: 0,
                msg: '退出登录成功'
            });
        } catch (error) {
            console.error('退出登录失败:', error);
            return new base_api_model({
                code: -1,
                msg: '退出登录失败: ' + error.message
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
        if (user_model.parsed_pwd) {
            req.auth = {
                uid: user_model.uid
            }
            let jwt_token = createToken({
                user_name: user_model.user_name, uid: user_model.uid, level: user_model.level
            });

            await UserService.add_user_act_ip_info({ req, resp, act_info: UserActModel.login_succ })
            return new base_api_model({
                data: {
                    uid: user_model.uid, user_name: user_model.user_name, jwt_token: jwt_token,
                    level: user_model.level, role: user_model.role
                }
            })
        }
        return new base_api_model({ code: -1, msg: '用户不存在', data: null })
    }

    static async is_user_exists({ user_name }) {
        let is_user_name_exist = await UserModel.is_exists_by_user_name(user_name);
        return is_user_name_exist
    }

    //endregion
}

module.exports = { UserService }
