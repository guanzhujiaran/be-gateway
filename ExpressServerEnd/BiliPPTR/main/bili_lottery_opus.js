const {BiliDynamicPage} = require('@/ExpressServerEnd/BiliPPTR/pages/bili_dynamic_page/index');
const {AccountService} = require("@/ExpressServerEnd/Service/account_module/account_service");
const {AccountDao} = require("@/ExpressServerEnd/DAO/AccountDao");
const {DynamicLotteryGlobalVar} = require("@/ExpressServerEnd/BiliPPTR/utils/global_var");


/**
 * 主要用来整合不同的抽奖模块
 */
class BiliLotteryOpus {
    #BiliDynamicGlobalVar;
    #BiliLotterySetting;
    /**
     * @type {BiliDynamicPage}
     */
    #BiliDynamicPage;
    #account_id;
    #user_id;
    user_name;
    account_name;

    /**
     *
     * @param {string} user_id
     * @param {string} user_name
     * @param {string} account_name
     */
    constructor({user_id, user_name, account_name}) {
        this.user_name = user_name;
        this.account_name = account_name;
        this.#user_id = user_id;
    }

    /**
     *
     * @return {Promise<string>}
     */
    async get_account_id() {
        if (this.#account_id === undefined) {
            let account_info = await AccountDao.get_account_info_by_account_name_and_user_name(this.account_name, this.user_name);
            this.#account_id = account_info.account_id;
        }
        return this.#account_id;
    }

    /**
     *
     * @return {Promise<BiliDynamicPage>}
     * @constructor
     */
    async GetBiliDynamicPage() {
        if (this.#BiliDynamicPage) return this.#BiliDynamicPage
        if (this.#BiliDynamicGlobalVar === undefined) {
            this.#BiliDynamicGlobalVar = new DynamicLotteryGlobalVar(this.user_name, this.account_name)
        }
        if (this.#BiliLotterySetting === undefined) {
            let lottery_setting_resp = await AccountService.get_lottery_setting_by_account_name_and_uid(this.account_name, this.#user_id)
            this.#BiliLotterySetting = lottery_setting_resp.data.info.settings.lottery_setting
        }
        this.#BiliDynamicPage = new BiliDynamicPage(
            this.account_name,
            this.user_name,
            await this.get_account_id(),
            this.#user_id,
            this.#BiliDynamicGlobalVar,
            this.#BiliLotterySetting
        )
        return this.#BiliDynamicPage
    }
}

module.exports = BiliLotteryOpus;