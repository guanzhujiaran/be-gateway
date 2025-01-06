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
const {UserService} = require("@/ExpressServerEnd/Service/user_module/user_service");
const {personalized_content_service} = require('@/ExpressServerEnd/Service/personalized_content_module/personalized_content_service');
const {UserPersonalContentDao} = require('@/ExpressServerEnd/DAO/UserPersonalContentDao');
const { user_redis_dao} = require("@/ExpressServerEnd/DAO/UserRedisDao");
const {sequelize} = require("@/ExpressServerEnd/DAO/SqlHelper");
(async () => {
    let resp = await UserService.change_user_pwd_when_login({
        uid:11,
        pwd:'qq29806233114514'
    })
    console.log(resp.toJSON())
    console.log(JSON.stringify(resp.rows.map(item => {
            item.replies = item.replies ? item.replies.map(el => el.toJSON()) : item.replies;
            return item.toJSON();
        }))
    );
})();
