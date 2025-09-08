/*
 * @Author: 星瞳 1944637830@qq.com
 * @Date: 2024-04-06 16:33:24
 * @LastEditors: 星瞳 1944637830@qq.com
 * @LastEditTime: 2024-05-31 18:33:48
 * @FilePath: \tampermonkey\ExpressServerEnd\SqlHelper\SqlHelper.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
const {Sequelize} = require("sequelize");
const run_env_args = require("@/ExpressServerEnd/config/run_arg");
const DB = run_env_args['env'] === 'prod' ? process.env.DB : process.env.DEV_DB;
const sequelize = new Sequelize(DB, {dialect: "postgres",
    logging: run_env_args['env'] === 'prod'?false:console.log});
sequelize
    .authenticate()
    .then(() => {
        console.log(`数据库【${DB}】连接正常`);
    })
    .catch((e) => {
        console.error(`数据库【${DB}】连接失败！${e}`);
    });
const {
    TAccountBiliAtMsg,
    TAccountBiliReplyMsg,
    TAccountBiliWhisperMsg,
    TAccountDetailInfo,
    TAccountInfo,
    TAccountInfo_DashBoardInfo,
    TAccountInfo_LotteryLog,
    TAccountInfo_ReserveLog,
    TAtariInfo,
    TBiliUser,
    TBiliUserDetail,
    TComment,
    TCommentInteractRelation,
    TCommonLog,
    TDynamicInfo,
    TLiveLotteryLog,
    TLogBiliDailyTask,
    TLotteryLogInfo,
    TPersonalizedContent,
    TPersonalizedContentType1,
    TReserveLotteryInfo,
    TUserActInfoLog,
    TUserDetail,
    TUserInfo,
    TUserLevel,
    TUserNameRecord,
    TUserPwdRecord,
    TUserVip,
} = require("./dbModel/init-models")(sequelize);


module.exports = {
    TAccountBiliAtMsg,
    TAccountBiliReplyMsg,
    TAccountBiliWhisperMsg,
    TAccountDetailInfo,
    TAccountInfo,
    TAccountInfo_DashBoardInfo,
    TAccountInfo_LotteryLog,
    TAccountInfo_ReserveLog,
    TAtariInfo,
    TBiliUser,
    TBiliUserDetail,
    TComment,
    TCommentInteractRelation,
    TCommonLog,
    TDynamicInfo,
    TLiveLotteryLog,
    TLogBiliDailyTask,
    TLotteryLogInfo,
    TPersonalizedContent,
    TPersonalizedContentType1,
    TReserveLotteryInfo,
    TUserActInfoLog,
    TUserDetail,
    TUserInfo,
    TUserLevel,
    TUserNameRecord,
    TUserPwdRecord,
    TUserVip,
    sequelize
};
