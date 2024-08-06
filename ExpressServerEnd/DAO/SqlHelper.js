/*
 * @Author: 星瞳 1944637830@qq.com
 * @Date: 2024-04-06 16:33:24
 * @LastEditors: 星瞳 1944637830@qq.com
 * @LastEditTime: 2024-05-31 18:33:48
 * @FilePath: \tampermonkey\ExpressServerEnd\SqlHelper\SqlHelper.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
const config = require("dotenv").config();
const {Sequelize} = require("sequelize");
const {Op} = require("sequelize");
const DB = config.parsed.DB;
const sequelize = new Sequelize(DB, {dialect: "postgres"});
sequelize
    .authenticate()
    .then(() => {
        console.debug(`数据库连接正常`);
    })
    .catch((e) => {
        console.error(`数据库连接失败！${e}`);
    });
const {
    TAccountDetailInfo,
    TAccountInfo,
    TAccountInfo_DashBoardInfo,
    TAccountInfo_LotteryLog,
    TAccountInfo_ReserveLog,
    TAtariInfo,
    TCommonLog,
    TDynamicInfo,
    TLiveLotteryLog,
    TLogBiliDailyTask,
    TLotteryLogInfo,
    TReserveLotteryInfo,
    TUserInfo,
} = require("./dbModel/init-models")(sequelize);


module.exports = {
    TAccountDetailInfo,
    TAccountInfo,
    TAccountInfo_DashBoardInfo,
    TAccountInfo_LotteryLog,
    TAccountInfo_ReserveLog,
    TAtariInfo,
    TCommonLog,
    TDynamicInfo,
    TLiveLotteryLog,
    TLogBiliDailyTask,
    TLotteryLogInfo,
    TReserveLotteryInfo,
    TUserInfo,
};
