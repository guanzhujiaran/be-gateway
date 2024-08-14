/*
 * @Author: 星瞳 1944637830@qq.com
 * @Date: 2024-04-08 15:40:03
 * @LastEditors: 星瞳 1944637830@qq.com
 * @LastEditTime: 2024-05-31 17:30:06
 * @FilePath: \tampermonkey\ExpressServerEnd\test\sql_test.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
const {addAliases} = require("module-alias");

addAliases({
    '@': 'K:/BiliPPTRVerDEV/',
});
const {AccountDao} = require("@/ExpressServerEnd/DAO/AccountDao");
const {UserDao} = require('@/ExpressServerEnd/DAO/UserDao');
const {AccountLogDao} = require('@/ExpressServerEnd/DAO/AccountLogDao');
const {AccountLogService} = require('@/ExpressServerEnd/Service/account_log_module/account_log_service');
const {manual_op_fail_model} = require('@/ExpressServerEnd/BiliPPTR/models/pages/bili_dynamic_page_model');
const {AccountLotterySettingModel} = require("@/ExpressServerEnd/Model/api/v1/account/account_model");
(async () => {
    let resp = await AccountDao.get_lottery_setting_by_account_name_and_uid(
        'cookie1',11
    );
    // let resp = await AccountDao.get_reserve_lottery_infos(1,);
    console.log(resp)
    console.log(JSON.stringify(resp, '', '\t'));
})();
