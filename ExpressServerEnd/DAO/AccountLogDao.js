const {
    TAccountInfo_LotteryLog,
    TAccountInfo_ReserveLog,
    TCommonLog,
    TDynamicInfo,
    TLiveLotteryLog,
    TLogBiliDailyTask,
    TLotteryLogInfo,
    TReserveLotteryInfo,
} = require("@/ExpressServerEnd/DAO/SqlHelper");
const {Op} = require("sequelize");

class AccountLogDao {
    constructor() {
    }

    //region 动态抽奖/官方转发抽奖记录
    static async is_dynamic_info_exist(dynamic_id) {
        return await TDynamicInfo.findOne({where: {dynamic_id: dynamic_id}});
    }

    /**
     *
     * @param {TYPE_dynamic_info} dynamic_info
     * @return {Promise<void>}
     */
    static async add_dynamic_info(dynamic_info) {
        return await TDynamicInfo.upsert({
                dynamic_content: dynamic_info.dynContent,
                up_name: dynamic_info.authorName,
                up_uid: dynamic_info.up_uid,
                pubts: Math.ceil((new Date(dynamic_info.pubTime)).getTime() / 1e3),
                like: 0,
                comment: dynamic_info.commentCount,
                repost: dynamic_info.repostCount,
                dynamic_id: dynamic_info.dynId,
            },
        )
    }

    static async get_dynamic_info_by_dynamic_id(dynId) {
        return await TDynamicInfo.findOne({
            where: {
                dynamic_id: dynId
            }
        })
    }

    /**
     *
     * @param {TYPE_official_lot_info} dynamic_info
     * @return {Promise<void>}
     */
    static async add_official_dynamic_info(dynamic_info) {
        let dyn_info = await this.get_dynamic_info_by_dynamic_id(dynamic_info.dynId);
        if (dyn_info) return;
        return await TDynamicInfo.upsert({
                dynamic_content: dynamic_info.lottery_text,
                up_name: "官方抽奖",
                up_uid: dynamic_info.sender_uid,
                pubts: dynamic_info.lottery_time,
                like: 0,
                comment: 999,
                repost: 999,
                dynamic_id: dynamic_info.dynId,
            },
        )
    }

    /**
     *
     * @param {TYPE_dynamic_info[]} dynamic_infos
     * @return {Promise<*>}
     */
    static async add_dynamic_info_bulk(dynamic_infos) {
        let vals = dynamic_infos.map(dynamic_info => {
            return {
                dynamic_content: dynamic_info.dynContent,
                up_name: dynamic_info.authorName,
                up_uid: dynamic_info.up_uid,
                pubts: Math.ceil((new Date(dynamic_info.pubTime)).getTime() / 1e3),
                like: 0,
                comment: dynamic_info.commentCount,
                repost: dynamic_info.repostCount,
                dynamic_id: dynamic_info.dynId,
            }
        })
        return await TDynamicInfo.bulkCreate(vals, {
            updateOnDuplicate: ["dynamic_content", "up_name", "up_uid", "pubts", "like", "comment", "repost"],
            individualHooks: true
        })

    }

    static async add_lottery_log_info({
                                          lottery_log,
                                          is_success,
                                          is_manual_reply,
                                          dynamic_info_id,
                                          lottery_type,
                                          comment_msg
                                      }) {
        return await TLotteryLogInfo.upsert({
            lottery_log: lottery_log,
            is_success: is_success,
            is_manual_reply: is_manual_reply,
            dynamic_info_id: dynamic_info_id,
            add_ts: Math.ceil((new Date()).getTime() / 1e3),
            update_ts: Math.ceil((new Date()).getTime() / 1e3),
            lottery_type: lottery_type,
            comment_msg: comment_msg
        });
    }

    static async add_account_info_lottery_log({lottery_log_id, accountinfo_id}) {
        return await TAccountInfo_LotteryLog.upsert({
            lottery_log_id: lottery_log_id,
            accountinfo_id: accountinfo_id
        })
    }

    /**
     *
     * @param {string} account_id
     * @param {string} min_dynamic_id
     * @return {Promise<{dynamic_content:string,up_name:string,up_uid:string,pubts:number,like:number,comment:number,repost:number,dynamic_id:string}[]>}
     */
    static async get_joined_account_info_lottery_log_by_lottery_offset(account_id, min_dynamic_id) {
        let results = await TDynamicInfo.findAll({
                where: {
                    dynamic_id: {
                        [Op.gte]: min_dynamic_id
                    },
                },
                attributes: {exclude: ['pk']},
                include: {
                    model: TLotteryLogInfo,
                    where: {
                        is_success: true
                    },
                    attributes: [],
                    as: "TLotteryLogInfos",
                    include: {
                        model: TAccountInfo_LotteryLog,
                        where: {
                            accountinfo_id: account_id
                        },
                        as: "TAccountInfo_LotteryLogs",
                        attributes: [],
                    }
                }
            }
        )
        return results.map(el => el.toJSON())
    }

    //endregion

    //region 预约抽奖记录
    /**
     *
     * @param {TYPE_reserve_data} reserve_info
     * @return {Promise<void>}
     */
    static async add_reserve_info(reserve_info) {
        return await TReserveLotteryInfo.upsert(reserve_info)
    }

    /**
     *
     * @param {TYPE_reserve_data[]} reserve_infos
     * @return {Promise<void>}
     */
    static async add_reserve_info_bulk(reserve_infos) {
        return await TReserveLotteryInfo.bulkCreate(reserve_infos, {
            updateOnDuplicate: ['reserve_url', "etime", "lottery_prize_info", "jump_url", "available"]
        })
    }

    /**
     *
     * @param {string} sid_start
     * @param {string} sid_end
     * @param {string} account_id
     * @return {Promise<{accountinfo_id:string,reserveinfo_sid:string}[]>}
     */
    static async get_account_reserve_sid_info_by_sid_range({sid_start, sid_end}, account_id) {
        let results = await TAccountInfo_ReserveLog.findAll({
                where: {
                    reserveinfo_sid: {
                        [Op.and]: {
                            [Op.gte]: sid_start,
                            [Op.lte]: sid_end
                        }
                    },
                    accountinfo_id: account_id
                },
                order: [['reserveinfo_sid', 'desc']],
                attributes: {
                    exclude: ['pk']
                }
            }
        )
        return results.map(el => el.toJSON())
    }

    /**
     *
     * @param {string} account_id
     * @param {string} reserve_sid
     * @return {Promise<*>}
     */
    static async add_account_reserve_info(account_id, reserve_sid) {
        return await TAccountInfo_ReserveLog.create({
            accountinfo_id: account_id,
            reserveinfo_sid: reserve_sid
        })
    }

    //endregion
    static async create_log_bili_daily_task({account_id, sanlian_ts = 0, bcoin_ts = 0, charge_ts = 0} = {}) {
        return await TLogBiliDailyTask.create({
            log_account_id: account_id,
            sanlian_ts: sanlian_ts,
            bcoin_ts: bcoin_ts,
            charge_ts: charge_ts
        })
    }

    static async update_sanlian_ts({account_id, sanlian_ts}) {
        let log_info = await this.get_log_bili_daily_task_by_account_id(account_id)
        if (!log_info) {
            return await this.create_log_bili_daily_task({account_id: account_id, sanlian_ts: sanlian_ts})
        }
        log_info.sanlian_ts = sanlian_ts;
        return await log_info.save()
    }

    static async update_bcoin_ts({account_id, bcoin_ts}) {
        let log_info = await this.get_log_bili_daily_task_by_account_id(account_id)
        if (!log_info) {
            return await this.create_log_bili_daily_task({account_id: account_id, bcoin_ts: bcoin_ts})
        }
        log_info.bcoin_ts = bcoin_ts;
        return await log_info.save()
    }

    static async update_charge_ts({account_id, charge_ts}) {
        let log_info = await this.get_log_bili_daily_task_by_account_id(account_id)
        if (!log_info) {
            return await this.create_log_bili_daily_task({account_id: account_id, charge_ts: charge_ts})
        }
        log_info.charge_ts = charge_ts;
        return await log_info.save()
    }

    static async update_live_send_gift_ts({account_id, live_send_gift_ts}){
        let log_info = await this.get_log_bili_daily_task_by_account_id(account_id)
        if (!log_info) {
            return await this.create_log_bili_daily_task({account_id: account_id, live_send_gift_ts: live_send_gift_ts})
        }
        log_info.live_send_gift_ts = live_send_gift_ts;
        return await log_info.save()
    }

    static async get_log_bili_daily_task_by_account_id(account_id) {
        return await TLogBiliDailyTask.findOne(
            {
                where: {
                    log_account_id: account_id
                }
            }
        );
    }

    /**
     *
     * @param {number}account_id
     * @param {string}contents
     * @param {number}ts
     * @param {string}func_name
     * @param {number}level
     * @param {string}module_name
     * @return {Promise<*>}
     */
    static async add_common_log_by_account_id({account_id, contents, ts, func_name,level, module_name}) {
        return await TCommonLog.create({
            common_log_account_id: account_id,
            contents: contents,
            ts: ts,
            func_name: func_name,
            level:level,
            module_name: module_name
        })
    }

    /**
     *
     * @param {number} account_id
     * @param {number} lot_id
     * @param {string} type
     * @param {boolean} is_succ
     * @param {string} feedback_info
     * @return {Promise<void>}
     */
    static async add_live_lot_log({account_id, lot_id, type, is_succ, feedback_info}) {
        return await TLiveLotteryLog.create({
            live_lottery_account_id: account_id,
            lot_id: lot_id,
            type: type,
            is_succ: is_succ,
            feedback_info: feedback_info
        })
    }
}

module.exports = {AccountLogDao}