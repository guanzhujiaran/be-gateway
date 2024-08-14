const {
    TAccountDetailInfo,
    TAccountInfo,
    TAccountInfo_DashBoardInfo,
    TAccountInfo_LotteryLog,
    TAccountInfo_ReserveLog,
    TAtariInfo,
    TDynamicInfo,
    TLotteryLogInfo,
    TReserveLotteryInfo,
    TUserInfo,
} = require("@/ExpressServerEnd/DAO/SqlHelper");
const {UserDao} = require("@/ExpressServerEnd/DAO/UserDao");

const {Op} = require("sequelize");



class AccountDao {

    constructor() {
    }

    //#region accountinfo的crud
    /**
     * 返回新增的自增主键 account_id
     * @param account_name {string}
     * @param uid {number}
     * @return {Promise<number>}
     */
    static add_account = async (account_name, uid) => {
        let user_info = await UserDao.get_user_info_by_uid(uid);
        if (!user_info) {
            throw new Error(`uid:${uid}不存在，无法添加该用户名下的account！`);
        }
        return (await TAccountInfo.create({
            account_name: account_name,
            uid: uid,
        })).toJSON()
    };


    /**
     *
     * @param {number} uid
     * @returns {Promise<Array.<UserAccount>>} 返回账号信息
     * -- {
     "account_name": "cookie1",
     "account_id": 1,
     "uid": "1",
     "info": {
     "level": 6,
     "vip": "十年大会员",
     "face": null,
     "uname": "后藤波奇",
     "uid":"123456"
     }
     }
     */
    static get_all_account_info_by_uid = async (uid) => {
        let all_accounts = await TAccountInfo.findAll({
            where: {
                uid: uid,
            },
            include: [
                {
                    model: TAccountDetailInfo,
                    as: "info",
                    required: false,
                    attributes: ["level", "vip", "face", "uname", "uid"],
                },
            ],
            order: [['account_id', 'desc']]
        });
        return all_accounts.map((el) => el.toJSON());
    };
    /**
     *
     * @param {string} account_name
     * @param {number} uid
     * @returns {Promise<UserAccount | null>} -- {
     "account_name": "cookie1",
     "account_id": 1,
     "uid": "1",
     "info": {
     "level": 6,
     "vip": "十年大会员",
     "face": null,
     "uname": "后藤波奇"
     "uid":"1234"
     }
     }
     */
    static get_account_info_by_account_name_and_uid = async (account_name, uid) => {
        let user_info = await TAccountInfo.findOne({
            where: {
                account_name: account_name,
                uid: uid,
            },
            include: [
                {
                    model: TAccountDetailInfo,
                    as: "info",
                    required: false,
                    attributes: ["level", "vip", "face", "uname"],
                },
            ],
        });
        return user_info?.toJSON();
    };

    /**
     *
     * @param account_id {number}
     * @param uid {number}
     * @return {Promise<UserAccount | null>}
     */
    static async get_account_info_by_account_id_and_uid(account_id, uid) {
        let user_info = await TAccountInfo.findOne({
            where: {
                account_id: account_id,
                uid: uid,
            },
            include: [
                {
                    model: TAccountDetailInfo,
                    as: "info",
                    required: false,
                    attributes: ["level", "vip", "face", "uname"],
                },
            ],
        });
        return user_info?.toJSON();
    }

    /**
     * {
     *         "account_name": "cookie1",
     *         "account_id": 1,
     *         "uid": "1",
     *         "info": {
     *                 "level": 6,
     *                 "vip": "十年大会员",
     *                 "face": null,
     *                 "uname": "后藤波奇"
     *         }
     * }
     * @param account_name {string}
     * @param user_name {string}
     * @return {Promise<UserAccount | null>}
     */
    static async get_account_info_by_account_name_and_user_name(account_name, user_name) {
        let account_info = await TAccountInfo.findOne({
            where: {
                account_name: account_name,
            },
            include: [
                {
                    model: TAccountDetailInfo,
                    as: "info",
                    required: false,
                    attributes: ["level", "vip", "face", "uname"],
                },
                {
                    model: TUserInfo,
                    attributes: [],
                    as: 'uid_TUserInfo',
                    where: {
                        user_name: user_name
                    }
                }
            ],
        });
        return account_info?.toJSON()
    }

    static async save_account_detail_info_by_account_id(
        {account_id, uname, vip, level, face, uid, nav_json}
    ) {
        let account_detail_info = await TAccountDetailInfo.findOne({
            where: {
                account_info_id: account_id
            }
        })
        if (!account_detail_info) {
            return await TAccountDetailInfo.create(
                {
                    account_info_id: account_id,
                    uname: uname,
                    vip: vip,
                    level: level,
                    face: face,
                    uid: uid,
                    nav_json: nav_json
                }
            )
        }
        await account_detail_info.update({
            uname: uname,
            vip: vip,
            level: level,
            face: face,
            uid: uid,
            nav_json: nav_json
        });
        return await account_detail_info.save();

    }


    /**
     * 获取账号设置信息，如果不存在，则返回一个默认的设置
     * @param account_name {string}
     * @param uid {number}
     * @return {Promise<UserAccount|undefined>}
     */
    static async get_lottery_setting_by_account_name_and_uid(account_name, uid) {
        let account_detail_info = await TAccountInfo.findOne({
            where: {
                account_name: account_name,
                uid: uid
            },
            include: [
                {
                    model: TAccountDetailInfo,
                    as: "info",
                },
            ],
            attributes: {
                exclude: ['account_id']
            }
        })
        return account_detail_info?.toJSON()
    }

    /**
     * 保存账号设置信息
     * @param account_name {string}
     * @param uid {number}
     * @param lottery_setting {Object}
     * @return {Promise<boolean>}
     * {
     *   "account_name": "cookie1",
     *   "account_id": 1,
     *   "uid": "1",
     *   "info": [
     *     {
     *       "account_detail_info_id": 1,
     *       "account_info_id": 1,
     *       "uname": "后藤波奇",
     *       "vip": "十年大会员",
     *       "level": 6,
     *       "face": null,
     *       "uid": null,
     *       "lottery_setting": null
     *     }
     *   ]
     * }
     *
     */
    static async save_lottery_setting_by_account_name_and_uid(account_name, uid, lottery_setting) {
        let account_detail_info = await TAccountInfo.findOne({
            where: {
                account_name: account_name,
                uid: uid
            },
            include: [
                {
                    model: TAccountDetailInfo,
                    as: "info",
                }
            ]
        })
        if (!account_detail_info) return false
        if (account_detail_info.info) { // 存在则更新
            account_detail_info.info.set({
                settings: lottery_setting
            })
            await account_detail_info.info.save()
        } else {
            await TAccountDetailInfo.create({
                account_info_id: account_detail_info.account_id,
                uname: "Unknown",
                vip: "",
                level: -1,
                uid: -1,
                settings: lottery_setting
            })
        }
        return true
    }

    //#endregion

    /**
     *
     * @param account_id
     * @param limit
     * @return {Promise<*[number]>}
     */
    static async get_reserve_lottery_log_sids_by_account_id(account_id, limit = 100) {
        let reserve_log = await TAccountInfo_ReserveLog.findAll(
            {
                where: {
                    accountinfo_id: account_id,
                },
                attributes: ['reserveinfo_sid'],
                order: [["reserveinfo_sid", "desc"]],
                limit: limit
            }
        )
        return reserve_log.map(el => el.reserveinfo_sid)
    }

    static async get_reserve_lottery_log_sids_by_username_account_name(username, account_name, limit = 100) {
        let reserve_log = await TAccountInfo_ReserveLog.findAll(
            {
                attributes: ['reserveinfo_sid'],
                order: [["reserveinfo_sid", "desc"]],
                limit: limit,
                include: {
                    model: TAccountInfo,
                    where: {
                        account_name: account_name
                    },
                    as: "accountinfo",
                    include: {
                        model: TUserInfo,
                        where: {
                            user_name: username
                        },
                        as: "uid_TUserInfo"
                    }
                }
            }
        )
        return reserve_log.map(el => el.reserveinfo_sid)
    }

    static async get_reserve_lottery_infos() {
        let reserve_lottery_infos = await TReserveLotteryInfo.findAll({
            where: {
                available: true,
                etime: {[Op.gt]: Math.ceil(Date.now() / 1e3)}
            },
            attributes: {
                exclude: ['pk']
            }
        })
        return reserve_lottery_infos.map(el => el.toJSON())
    }

    static async upsert_reserve_lottery_infos(reserve_lottery_infos) {
        return await reserve_lottery_infos.map(async el => await TReserveLotteryInfo.upsert(el))
    }

    //region 获取dashboard上需要的信息

    /**
     * @typedef {Object} account_dashboard_info - API返回的dashboard信息类型
     * @property {string} account_name
     * @property {string} account_uid
     * @property {string} account_uname
     * @property {string} vip
     * @property {number} level
     * @property {number} official_lottery_num - Log里面的内容
     * @property {number} reserve_lottery_num - Log里面的内容
     * @property {number} common_lottery_num - Log里面的内容
     * @property {number} manual_num
     * @property {number} atari_up_num
     * @property {number} atari_num
     * @property {string} account_status
     * @property {number} latest_lot_timestamp
     * @property {number} failed_num
     */
    /**
     * 获取dashboard上需要的信息 通过account_name 和uid特定出一个指定的账号，通过这个账号的account_id获取其他信息
     * @param {string} account_name
     * @param {string} uid
     * @returns {promise<account_dashboard_info>}
     */
    static get_account_dashboard_info_by_account_name_and_uid = async (
        account_name,
        uid
    ) => {
        let account_info = await this.get_account_info_by_account_name_and_uid(
            account_name,
            uid
        );
        if (!account_info) {
            throw new Error(
                `account_name:${account_name}不存在，无法获取dashboard信息！`
            );
        }
        let account_dashboard_info = await TAccountInfo_DashBoardInfo.findOne({
            attributes: {exclude: ["dashboard_id", "accountinfo_id"]},
            where: {
                accountinfo_id: account_info.account_id,
            },
        });
        let official_lottery_num =
            await this.get_Log_official_lottery_num_by_account_id(
                account_info.account_id
            );
        let reserve_lottery_num =
            await this.get_Log_reserve_lottery_num_by_account_id(
                account_info.account_id
            );
        let common_lottery_num =
            await this.get_Log_common_lottery_num_by_account_id(
                account_info.account_id
            );
        let manual_num = await this.get_Log_manual_lottery_num_by_account_id(
            account_info.account_id
        );

        let atari_num = await this.get_Atari_lottery_num_by_account_id(
            account_info.account_id
        );
        let atari_up_num = await this.get_Atari_up_num_by_account_id(
            account_info.account_id
        );
        let failed_num = await this.get_Log_failed_lottery_num_by_account_id(
            account_info.account_id
        );
        return Object.assign(account_dashboard_info.toJSON(), {
            /** 中间内容-官方抽奖数量 */
            official_lottery_num: official_lottery_num,
            /** 中间内容-预约抽奖数量 */
            reserve_lottery_num: reserve_lottery_num,
            /** 中间内容-一般抽奖数量 */
            common_lottery_num: common_lottery_num,
            /** 中间内容-人工判断数量 */
            manual_num: manual_num,
            /** 中间内容-中奖up数量 */
            atari_up_num: atari_up_num,
            /** 中间内容-中奖次数 */
            atari_num: atari_num,
            /** 中间内容-参加失败的抽奖 */
            failed_num: failed_num,
        });
    };


    //#region 查询某个用户的参加抽奖数量
    /**
     * 查询一个用户成功参加的官方抽奖数量
     * @param {number} account_id
     * @returns {promise<number>}
     */
    static get_Log_official_lottery_num_by_account_id = async (account_id) => {
        return await TDynamicInfo.count({
            include: [
                {
                    model: TLotteryLogInfo,
                    as: "TLotteryLogInfos",
                    attributes: [],
                    where: {
                        is_success: true,
                        is_manual_reply: false,
                        lottery_type: {[Op.contained]: [1]},
                    },
                    include: [
                        {
                            model: TAccountInfo_LotteryLog,
                            as: "TAccountInfo_LotteryLogs",
                            attributes: [],
                            where: {
                                accountinfo_id: account_id,
                            },
                        },
                    ],
                },
            ],
        });
    };
    /**
     * 查询一个用户成功参加的一般抽奖数量
     * @param {number} account_id
     * @returns {promise<number>}
     */
    static get_Log_common_lottery_num_by_account_id = async (account_id) => {
        return await TDynamicInfo.count({
            include: [
                {
                    model: TLotteryLogInfo,
                    as: "TLotteryLogInfos",
                    attributes: [],
                    where: {
                        is_success: true,
                        is_manual_reply: false,
                        lottery_type: {[Op.contained]: [0]},
                    },
                    include: [
                        {
                            model: TAccountInfo_LotteryLog,
                            as: "TAccountInfo_LotteryLogs",
                            attributes: [],
                            where: {
                                accountinfo_id: account_id,
                            },
                        },
                    ],
                },
            ],
        });
    };
    static get_Log_reserve_lottery_num_by_account_id = async (account_id) => {
        let reserve_lottery_num = await TReserveLotteryInfo.count({
            include: [
                {
                    model: TAccountInfo_ReserveLog,
                    as: "TAccountInfo_ReserveLogs",
                    attributes: [],
                    where: {
                        accountinfo_id: account_id,
                    },
                },
            ],
        });
        return reserve_lottery_num;
    };
    static get_Log_manual_lottery_num_by_account_id = async (account_id) => {
        let official_lottery_num = await TDynamicInfo.count({
            include: [
                {
                    model: TLotteryLogInfo,
                    as: "TLotteryLogInfos",
                    attributes: [],
                    where: {
                        is_success: true,
                        is_manual_reply: false,
                        lottery_type: {[Op.contained]: [0]},
                    },
                    include: [
                        {
                            model: TAccountInfo_LotteryLog,
                            as: "TAccountInfo_LotteryLogs",
                            attributes: [],
                            where: {
                                accountinfo_id: account_id,
                            },
                        },
                    ],
                },
            ],
        });
        return official_lottery_num;
    };
    static get_Log_failed_lottery_num_by_account_id = async (account_id) => {
        let failed_lottery_num = await TDynamicInfo.count({
            include: [
                {
                    model: TLotteryLogInfo,
                    as: "TLotteryLogInfos",
                    attributes: [],
                    where: {
                        is_success: false,
                    },
                    include: [
                        {
                            model: TAccountInfo_LotteryLog,
                            as: "TAccountInfo_LotteryLogs",
                            attributes: [],
                            where: {
                                accountinfo_id: account_id,
                            },
                        },
                    ],
                },
            ],
        });
        return failed_lottery_num;
    };
    static get_Atari_lottery_num_by_account_id = async (account_id) => {
        let atari_lottery_num = await TDynamicInfo.count({
            include: [
                {
                    model: TAtariInfo,
                    as: "TAtariInfos",
                    attributes: [],
                    on: {
                        "$TAtariInfos.atari_dynamic_id$":
                            "$TDynamicInfo.dynamic_id$",
                    },
                    where: {
                        accountinfo_id: account_id,
                    },
                },
            ],
        });
        return atari_lottery_num;
    };
    static get_Atari_up_num_by_account_id = async (account_id) => {
        let atari_up_num = await TDynamicInfo.count({
            distinct: true,
            include: [
                {
                    model: TAtariInfo,
                    as: "TAtariInfos",
                    attributes: [],
                    on: {
                        "$TAtariInfos.atari_dynamic_id$":
                            "$TDynamicInfo.dynamic_id$",
                    },
                    where: {
                        accountinfo_id: account_id,
                    },
                },
            ],
        });
        return atari_up_num;
    };
    //#endregion
    //endregion


}


module.exports = {
    AccountDao
}