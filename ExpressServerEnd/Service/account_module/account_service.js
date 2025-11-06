const {AccountLotterySettingModel} = require("@/ExpressServerEnd/Model/api/v1/account/account_model");

const {base_api_model} = require("@/ExpressServerEnd/Model/base_model/base_model");
const {AccountModel} = require("@/ExpressServerEnd/Model/api/v1/account/account_model");
const {AccountDao} = require("@/ExpressServerEnd/DAO/AccountDao");
const yaml = require('js-yaml');
const fs = require("fs");
const config = require('@/ExpressServerEnd/config/index');
const {t} = require("@/ExpressServerEnd/Tool/Utl");
const {RESPONSE_CODES} = require("../response_constants");


class AccountService {
    /**
     *
     * @param account_name {string}
     * @return {AccountLotterySettingModel}
     */
    static generate_default_lottery_setting(account_name) {
        return new AccountLotterySettingModel(account_name)
    }

    /**
     * 获取用户所有账号信息
     * @param uid
     * @return {Promise<base_api_model>}
     */
    static async get_all_account_info_by_uid(uid) {
        let acc_model = new AccountModel(uid);

        let result = await acc_model.get_all_account_info_by_uid();
        return new base_api_model({
            code: RESPONSE_CODES.SUCCESS.code,
            data: result,
            msg: RESPONSE_CODES.SUCCESS.msg
        })
    }

    /**
     * 添加账户
     * @param account_name {string}
     * @param uid {number}
     * @return {Promise<base_api_model>}
     */
    static async add_account(account_name, uid) {
        let acc_model = new AccountModel(uid);
        let is_exist = await acc_model.get_account_info_by_account_name(account_name);
        if (is_exist) {
            return new base_api_model({
                code: RESPONSE_CODES.ERRORS.ACCOUNT_NAME_EXISTS.code,
                data: null,
                msg: RESPONSE_CODES.ERRORS.ACCOUNT_NAME_EXISTS.msg,
            })
        }

        let result = await acc_model.add_account(account_name);
        if (typeof result.account_id === 'number') {
            /**
             * @type {UserAccount}
             */
            return new base_api_model({
                code: RESPONSE_CODES.ACCOUNT_CREATE_SUCCESS.code,
                data: result,
                msg: RESPONSE_CODES.ACCOUNT_CREATE_SUCCESS.msg
            })
        }

        return new base_api_model({
            code: RESPONSE_CODES.ERRORS.ACCOUNT_CREATION_FAILED.code,
            data: null,
            msg: `${RESPONSE_CODES.ERRORS.ACCOUNT_CREATION_FAILED.msg}\t${result}`
        })

    }

    /**
     *
     * @param uid {number}
     * @param account_name {string}
     * @param account_id {number}
     * @return {Promise<base_api_model>}
     */
    static async get_account_info(uid, {account_name, account_id}) {
        if (!uid) return new base_api_model({
            code: RESPONSE_CODES.ERRORS.UNAUTHORIZED.code,
            data: null,
            msg: RESPONSE_CODES.ERRORS.UNAUTHORIZED.msg
        })
        if (!(account_name || account_id)) return new base_api_model({
            code: RESPONSE_CODES.ERRORS.ACCOUNT_INFO_MISSING.code,
            data: null,
            msg: RESPONSE_CODES.ERRORS.ACCOUNT_INFO_MISSING.msg
        })
        let acc_model = new AccountModel(uid);
        let ret_model = null;
        if (account_id) {
            ret_model = await acc_model.get_account_info_by_account_id(account_id);
        } else if (account_name) {
            ret_model = await acc_model.get_account_info_by_account_name(account_name)
        }
        if (ret_model) {
            return new base_api_model({
                code: RESPONSE_CODES.SUCCESS.code,
                data: ret_model,
                msg: RESPONSE_CODES.SUCCESS.msg
            })
        }
        return new base_api_model({
            code: RESPONSE_CODES.ERRORS.ACCOUNT_NOT_FOUND.code,
            data: null,
            msg: RESPONSE_CODES.ERRORS.ACCOUNT_NOT_FOUND.msg
        })

    }

    /**
     * 通过账号名称和uid获取抽奖设置
     * @param account_name
     * @param uid
     * @return {Promise<import("@ExpressServerEnd/Model/account_model").UserAccount | null>}
     */
    static async get_lottery_setting_by_account_name_and_uid(account_name, uid) {
        let acc_model = new AccountModel(uid);
        let ret_model = await acc_model.get_lottery_setting_by_account_name_and_uid(account_name);
        let origin_lottery_setting = this.generate_default_lottery_setting(account_name);
        if (!ret_model) {
            return ret_model
        }
        if (!ret_model.info) {
            ret_model.info = {}
            ret_model.info.settings = origin_lottery_setting;
        }
        if (!ret_model.info.settings) {
            ret_model.info.settings = origin_lottery_setting;
        }
        t.deepMergeIfMissing(ret_model.info.settings.lottery_setting, origin_lottery_setting.lottery_setting);
        return ret_model

    }


    static async save_lottery_setting_by_account_name_and_uid(account_name, uid, settings) {
        if (account_name !== settings.lottery_setting.CONFIG.COOKIENAME) {
            return new base_api_model({
                code: RESPONSE_CODES.ERRORS.ACCOUNT_NAME_MISMATCH.code,
                data: null,
                msg: RESPONSE_CODES.ERRORS.ACCOUNT_NAME_MISMATCH.msg
            })
        }
        let acc_model = new AccountModel(uid);
        let ret_model = await acc_model.save_lottery_setting_by_account_name_and_uid(account_name, settings);
        return new base_api_model({
            code: RESPONSE_CODES.SUCCESS.code,
            data: ret_model,
            msg: RESPONSE_CODES.SUCCESS.msg
        })
    }

    static async save_account_detail_info_by_account_id(
        {account_id, uname, vip, level, face, uid, nav_json}
    ) {
        try {
            await AccountDao.save_account_detail_info_by_account_id(arguments[0])
            return new base_api_model({
                code: RESPONSE_CODES.ACCOUNT_DETAIL_SAVE_SUCCESS.code,
                data: RESPONSE_CODES.ACCOUNT_DETAIL_SAVE_SUCCESS.msg
            })
        } catch (e) {
            return new base_api_model({
                code: RESPONSE_CODES.ERRORS.ACCOUNT_SAVE_FAILED.code,
                msg: `${RESPONSE_CODES.ERRORS.ACCOUNT_SAVE_FAILED.msg}${e.message}`
            })
        }
    }

}

module.exports = {AccountService}