const { TUserInfo, TUserVip, TUserLevel, TUserDetail } = require("@/ExpressServerEnd/DAO/SqlHelper");

const { Op, literal } = require("sequelize");

class UserDao {
    constructor() {
    }

    //#region UserInfo表的增删改查
    /**
     * @typedef {Object} UserCredentials
     * @property {string} uid - 用户ID
     * @property {string} user_name - 用户名
     * @property {string} pwd - 加密后的密码
     */
    /**
     * @typedef {Object} UserBaseInfo
     * @property {string} uid - 用户ID
     * @property {string} user_name - 用户名
     */
    /**
     * 通过uid查找userinfo
     * @param {string|number} uid
     * @returns {Promise<UserCredentials|undefined> }
     * --{
     "uid": "1",
     "user_name": "admin",
     "pwd": "f6ad0632d7babd4ca84f787257941acb"
     }
     */
    static get_user_info_by_uid = async (uid) => {
        let user_info = await TUserInfo.findOne({
            attributes: {
                exclude: ['createdAt', 'updatedAt', 'deletedAt']
            },
            where: {
                uid: uid,
            },
        });
        return user_info?.toJSON();
    };

    /**
     * 通过user_name查找userinfo
     * @param user_name
     * @return {Promise<{
     *   uid: number,
     *   user_name: string,
     *   pwd: string
     * }>}
     */
    static async get_user_info_by_user_name(user_name) {
        let user_info = await TUserInfo.findOne({
            attributes: {
                exclude: ['createdAt', 'updatedAt', 'deletedAt']
            },
            where: {
                user_name: user_name,
            },
        });
        return user_info?.toJSON();
    };

    /**
     *
     * @param user_name
     * @param uid
     * @return {Promise<*>}
     */
    static async get_whole_user_info({ user_name, uid }) {
        return await TUserInfo.findOne({
            attributes: {
                exclude: ['createdAt', 'updatedAt', 'deletedAt']
            },
            where:
                Object.fromEntries(Object.entries(arguments[0]).filter((el) => el[1]))
            ,
            include:
                [
                    {
                        model: TUserDetail,
                        as: "TUserDetail",
                        required: false,
                        attributes:
                            [
                                [literal(`COALESCE("TUserDetail"."mid", "uid")`), 'mid'],
                                [literal('COALESCE("TUserDetail"."avatar", \'\')'), 'avatar'],
                                [literal(`COALESCE("TUserDetail"."uname",'bili_'|| REGEXP_REPLACE("user_name",'^(.)(.{0,2})(.*)$', '\\1**\\3', 'g'))`), 'uname'],
                                [literal('COALESCE("TUserDetail"."sign", \'\')'), 'sign'],
                                [literal('COALESCE("TUserDetail"."sex", \'\')'), 'sex']
                            ],
                        include: [
                            {
                                model: TUserVip,
                                as: "TUserVip",
                                attributes: {
                                    include: [
                                        [literal(`COALESCE("TUserDetail->TUserVip"."mid", "uid")`), 'mid'],
                                        [literal(`COALESCE("TUserDetail->TUserVip"."vip_due_date", 0)`), 'vip_due_date'],
                                        [literal('COALESCE("TUserDetail->TUserVip"."vip_pay_type", 0)'), 'vip_pay_type'],
                                        [literal('COALESCE("TUserDetail->TUserVip"."vip_status",0)'), 'vip_status'],
                                        [literal('COALESCE("TUserDetail->TUserVip"."vip_type", 0)'), 'vip_type'],
                                    ],
                                    exclude: ['createdAt', 'ip_info_id', 'updatedAt', 'deletedAt', 'mid']
                                },
                                required: false,
                            },
                            {
                                model: TUserLevel,
                                as: "TUserLevel",
                                attributes: {
                                    include: [
                                        [literal(`COALESCE("TUserDetail->TUserLevel"."mid", "uid")`), 'mid'],
                                        [literal(`COALESCE("TUserDetail->TUserLevel"."current_level", 0)`), 'current_level'],
                                        [literal('COALESCE("TUserDetail->TUserLevel"."current_exp", 0)'), 'current_exp'],
                                        [literal('COALESCE("TUserDetail->TUserLevel"."current_min",0)'), 'current_min'],
                                    ],
                                    exclude: ['createdAt', 'updatedAt', 'ip_info_id', 'deletedAt', 'mid']
                                },
                                required: false,
                            },
                        ]
                    },
                ]
        })
    }

    /**
     *
     * @param user_name
     * @param pwd
     * @return {Promise<TUserInfo>}
     */
    static add_user_info = async (user_name, pwd, transaction) => {
        return await TUserInfo.create({
            pwd: pwd,
            user_name: user_name,
        }, {
            transaction: transaction
        })
    };

    /**
     * 更新用户的pwd字段（此处被复用为：保存Casdoor用户级access_token）
     * @param {string|number} uid
     * @param {string} pwd - 新的pwd值，或Casdoor access_token
     * @return {Promise<number>} 受影响行数
     */
    static async update_user_pwd(uid, pwd) {
        return await TUserInfo.update(
            { pwd: pwd },
            { where: { uid: uid } }
        );
    };
    //#endregion

    static get_user_vip = async ({ uid }) => {
        return (await TUserVip.findOne({
            attributes: {
                exclude: ['createdAt', 'updatedAt', 'deletedAt']
            },
            where: {
                mid: uid
            }
        }))?.toJSON();
    };

    static get_user_whole_info = async ({ uid }) => {
        return (await TUserInfo.findOne({
            where: { uid },
            attributes: ["uid", "user_name", "role"],
            include: [
                {
                    model: TUserDetail,
                    as: "TUserDetail",
                    required: false,
                    include: [
                        {
                            model: TUserLevel,
                            as: "TUserLevel",
                            required: false,
                        },
                        {
                            model: TUserVip,
                            as: "TUserVip",
                            required: false,
                        }
                    ],
                },

            ],
        })).toJSON();
    }
}

module.exports = {
    UserDao
}