const {AccountLotterySettingModel} = require("@/ExpressServerEnd/Model/api/v1/account/account_model");

const {base_api_model} = require("@/ExpressServerEnd/Model/base_model/base_model");
const {AccountModel} = require("@/ExpressServerEnd/Model/api/v1/account/account_model");

const yaml = require('js-yaml');
const fs = require("fs");
let fileContents = fs.readFileSync("ExpressServerEnd/config/config.yml", 'utf8');
const config = yaml.load(fileContents, 'utf8');

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
        return new base_api_model({data: result})
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
                code: 40014,
                data: null,
                msg: "该昵称已存在",
            })
        }

        let result = await acc_model.add_account(account_name);
        if (typeof result.account_id === 'number') {
            /**
             * @type {UserAccount}
             */
            return new base_api_model({
                    data: result,
                    msg: "账号账号创建成功！"
                }
            )
        }

        return new base_api_model({
            code: 40015,
            data: null,
            msg: `账号账号创建失败！\t${result}`
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
            code: -1,
            data: null,
            msg: "未登录！"
        })
        if (!(account_name || account_id)) return new base_api_model({
            code: 40013,
            data: null,
            msg: "请输入账号名称或账号ID！"
        })
        let acc_model = new AccountModel(uid);
        let ret_model = null;
        if (account_id) {
            ret_model = await acc_model.get_account_info_by_account_id(account_id);
        } else if (account_name) {
            ret_model = await acc_model.get_account_info_by_account_name(account_name)
        }
        if (ret_model) {
            return new base_api_model(
                {
                    data: ret_model
                }
            )
        }
        return new base_api_model({
            code: 40016,
            data: null,
            msg: "该账号不存在！"
        })

    }

    /**
     * 通过账号名称和uid获取抽奖设置
     * @param account_name
     * @param uid
     * @return {Promise<base_api_model>}
     */
    static async get_lottery_setting_by_account_name_and_uid(account_name, uid) {
        let acc_model = new AccountModel(uid);
        let ret_model = await acc_model.get_lottery_setting_by_account_name_and_uid(account_name);
        if (!ret_model) return new base_api_model({
            code: 40017,
            data: ret_model,
            msg: "该账号不存在！"
        })
        if (!ret_model.info) {
            ret_model.info = {}
            ret_model.info.settings = this.generate_default_lottery_setting(account_name);
        }
        return new base_api_model({
            data: ret_model
        })
    }
}

module.exports = {AccountService}