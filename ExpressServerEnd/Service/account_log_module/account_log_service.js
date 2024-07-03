const {AccountLotterySettingModel} = require("@/ExpressServerEnd/Model/api/v1/account/account_model");

const {base_api_model} = require("@/ExpressServerEnd/Model/base_model/base_model");
const {AccountModel} = require("@/ExpressServerEnd/Model/api/v1/account/account_model");

const yaml = require('js-yaml');
const fs = require("fs");
const {AccountLogDao} = require("@/ExpressServerEnd/DAO/AccountLogDao");
const {AccountDao} = require("@/ExpressServerEnd/DAO/AccountDao");
const {sequelize, TLotteryLogInfo, TAccountInfo_LotteryLog, TDynamicInfo} = require("@/ExpressServerEnd/DAO/SqlHelper");
const {Op} = require("sequelize");
let fileContents = fs.readFileSync("ExpressServerEnd/config/config.yml", 'utf8');
const config = yaml.load(fileContents, 'utf8');

class AccountLogService {
    /**
     *
     * @param user_name
     * @param account_name
     * @param {manual_op_fail_model} lottery_log_info
     * @param is_success
     * @param is_manual_reply
     * @return {Promise<void>}
     */
    static async add_lottery_log_by_user_name_and_account_name(user_name,
                                                               account_name,
                                                               lottery_log_info,
                                                               is_success,
                                                               is_manual_reply,
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
                        lottery_type: lottery_type
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
}

module.exports = {AccountLogService}