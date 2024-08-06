const {AccountLotterySettingModel} = require("@/ExpressServerEnd/Model/api/v1/account/account_model");
const {base_api_model} = require("@/ExpressServerEnd/Model/base_model/base_model");
const {AccountModel} = require("@/ExpressServerEnd/Model/api/v1/account/account_model");
const yaml = require('js-yaml');
const fs = require("fs");
const {AccountLogDao} = require("@/ExpressServerEnd/DAO/AccountLogDao");
const {AccountDao} = require("@/ExpressServerEnd/DAO/AccountDao");
const {sequelize, TLotteryLogInfo, TAccountInfo_LotteryLog, TDynamicInfo} = require("@/ExpressServerEnd/DAO/SqlHelper");
const {Op} = require("sequelize");
const config = require('@/ExpressServerEnd/config/index');

class AccountLogService {
    /**
     *
     * @param user_name
     * @param account_name
     * @param {manual_op_fail_model} lottery_log_info
     * @param is_success
     * @param is_manual_reply
     * @param comment_msg
     * @return {Promise<void>}
     */
    static async add_lottery_log_by_user_name_and_account_name(user_name,
                                                               account_name,
                                                               lottery_log_info,
                                                               is_success,
                                                               is_manual_reply,
                                                               comment_msg
    ) {
        let database_dynamic_info = await AccountLogDao.is_dynamic_info_exist(lottery_log_info.dynamic_info.dynId);
        if (!database_dynamic_info) {
            database_dynamic_info = await AccountLogDao.add_dynamic_info(lottery_log_info.dynamic_info);
        }
        let account_info = await AccountDao.get_account_info_by_account_name_and_user_name(account_name, user_name)
        if (!account_info) {
            throw Error('account_info not exist')
        }

        try {
            return await sequelize.transaction(async (t) => {
                    let lottery_type = lottery_log_info.dynamic_info.dynamicUrl.includes('?tab=2') ? [1] : [0]
                    let log = await AccountLogDao.add_lottery_log_info({
                        lottery_log: lottery_log_info.err_msg,
                        is_success: is_success,
                        is_manual_reply: is_manual_reply,
                        dynamic_info_id: database_dynamic_info.pk,
                        lottery_type: lottery_type,
                        comment_msg: comment_msg
                    });
                    await AccountLogDao.add_account_info_lottery_log({
                        lottery_log_id: log.pk,
                        accountinfo_id: account_info.account_id
                    })
                }
            )
        } catch (e) {
            console.error(`添加抽奖日志失败！\n${e.stack}`)
        }
    }

    /**
     *
     * @param {number} account_id
     * @param {manual_op_fail_model} lottery_log_info
     * @param is_success
     * @param is_manual_reply
     * @param {string}comment_msg 记录的抽奖评论，失败了的话可以是undefined或者null之类的！
     * @return {Promise<void>}
     */
    static async add_lottery_log_by_account_id(account_id,
                                               lottery_log_info,
                                               is_success,
                                               is_manual_reply,
                                               comment_msg
    ) {
        let database_dynamic_info = await AccountLogDao.is_dynamic_info_exist(lottery_log_info.dynamic_info.dynId);
        if (!database_dynamic_info) {
            database_dynamic_info = await AccountLogDao.add_dynamic_info(lottery_log_info.dynamic_info);
        }
        try {
            return await sequelize.transaction(async (t) => {
                    /**
                     * 抽奖类型
                     * 0：只评论抽奖
                     * 1：转发评论抽奖
                     * 2：官方抽奖（只转发抽奖）
                     * @type {number[]}
                     */
                    let lottery_type = lottery_log_info.dynamic_info.dynamicUrl.includes('?tab=2') ? [1] : lottery_log_info.dynamic_info.dynamicUrl.includes('?tab=1') ? [2] : [0]
                    let [log, _] = await AccountLogDao.add_lottery_log_info({
                        lottery_log: lottery_log_info.err_msg,
                        is_success: is_success,
                        is_manual_reply: is_manual_reply,
                        dynamic_info_id: database_dynamic_info.pk,
                        lottery_type: lottery_type,
                        comment_msg: comment_msg
                    });
                    await AccountLogDao.add_account_info_lottery_log({
                        lottery_log_id: log.pk,
                        accountinfo_id: account_id
                    })
                }
            )
        } catch (e) {
            console.error(`添加抽奖日志失败！\n${e}`)
            throw Error(`添加抽奖日志失败！\n${e}`)
        }
    }

    /**
     *
     * @param {string} account_id
     * @param {string} min_dynamic_id
     * @return {Promise<{dynamic_content:string,up_name:string,up_uid:string,pubts:number,like:number,comment:number,repost:number,dynamic_id:string}[]>}
     */
    static async get_joined_account_info_lottery_log_by_lottery_offset(account_id, min_dynamic_id) {
        return await AccountLogDao.get_joined_account_info_lottery_log_by_lottery_offset(account_id, min_dynamic_id)
    }

    static async get_account_reserve_sid_info_by_sid_range({sid_start, sid_end}, account_id) {
        return await AccountLogDao.get_account_reserve_sid_info_by_sid_range({
            sid_start: sid_start,
            sid_end: sid_end
        }, account_id)
    }

    static async add_account_reserve_info(account_id, reserve_sid) {
        return await AccountLogDao.add_account_reserve_info(account_id, reserve_sid)
    }

    static async update_sanlian_ts({account_id, sanlian_ts}) {
        if (!sanlian_ts) sanlian_ts = Math.ceil(Date.now() / 1e3);
        return await AccountLogDao.update_sanlian_ts({account_id, sanlian_ts})
    }

    static async update_bcoin_ts({account_id, bcoin_ts}) {
        if (!bcoin_ts) bcoin_ts = Math.ceil(Date.now() / 1e3);
        return await AccountLogDao.update_bcoin_ts({account_id, bcoin_ts})
    }

    static async update_charge_ts({account_id, charge_ts}) {
        if (!charge_ts) charge_ts = Math.ceil(Date.now() / 1e3);
        return await AccountLogDao.update_charge_ts({account_id, charge_ts})
    }

    /**
     * 获取每日任务执行的时间戳
     * @param account_id
     * @return {Promise<{
     *     sanlian_ts:number,
     *     bcoin_ts:number,
     *     charge_ts:number
     * }>}
     */
    static async get_log_daily_task_info(account_id) {
        let log_info = await AccountLogDao.get_log_bili_daily_task_by_account_id(account_id);
        if (log_info) return log_info.toJSON();
        log_info = await AccountLogDao.create_log_bili_daily_task({account_id: account_id});
        return log_info.toJSON();
    }

    async add_common_log_by_account_id({account_id, contents, ts, func_name, module_name}) {
        if (!ts) ts = Math.ceil(Date.now() / 1e3);
        if (!func_name) func_name = '未指定';
        return await AccountLogDao.add_common_log_by_account_id({account_id, contents, ts, func_name, module_name})
    }


}

module.exports = {AccountLogService}