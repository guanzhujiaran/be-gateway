var DataTypes = require("sequelize").DataTypes;
var _TAccountDetailInfo = require("./TAccountDetailInfo");
var _TAccountInfo = require("./TAccountInfo");
var _TAccountInfo_DashBoardInfo = require("./TAccountInfo_DashBoardInfo");
var _TAccountInfo_LotteryLog = require("./TAccountInfo_LotteryLog");
var _TAccountInfo_ReserveLog = require("./TAccountInfo_ReserveLog");
var _TAtariInfo = require("./TAtariInfo");
var _TDynamicInfo = require("./TDynamicInfo");
var _TLotteryLogInfo = require("./TLotteryLogInfo");
var _TReserveLotteryInfo = require("./TReserveLotteryInfo");
var _TUserInfo = require("./TUserInfo");

function initModels(sequelize) {
  var TAccountDetailInfo = _TAccountDetailInfo(sequelize, DataTypes);
  var TAccountInfo = _TAccountInfo(sequelize, DataTypes);
  var TAccountInfo_DashBoardInfo = _TAccountInfo_DashBoardInfo(sequelize, DataTypes);
  var TAccountInfo_LotteryLog = _TAccountInfo_LotteryLog(sequelize, DataTypes);
  var TAccountInfo_ReserveLog = _TAccountInfo_ReserveLog(sequelize, DataTypes);
  var TAtariInfo = _TAtariInfo(sequelize, DataTypes);
  var TDynamicInfo = _TDynamicInfo(sequelize, DataTypes);
  var TLotteryLogInfo = _TLotteryLogInfo(sequelize, DataTypes);
  var TReserveLotteryInfo = _TReserveLotteryInfo(sequelize, DataTypes);
  var TUserInfo = _TUserInfo(sequelize, DataTypes);

  TAccountDetailInfo.belongsTo(TAccountInfo, { as: "account_info", foreignKey: "account_info_id"});
  TAccountInfo.hasOne(TAccountDetailInfo, { as: "info", foreignKey: "account_info_id"});
  TAccountInfo_DashBoardInfo.belongsTo(TAccountInfo, { as: "accountinfo", foreignKey: "accountinfo_id"});
  TAccountInfo.hasMany(TAccountInfo_DashBoardInfo, { as: "TAccountInfo_DashBoardInfos", foreignKey: "accountinfo_id"});
  TAccountInfo_LotteryLog.belongsTo(TAccountInfo, { as: "accountinfo", foreignKey: "accountinfo_id"});
  TAccountInfo.hasMany(TAccountInfo_LotteryLog, { as: "TAccountInfo_LotteryLogs", foreignKey: "accountinfo_id"});
  TAccountInfo_ReserveLog.belongsTo(TAccountInfo, { as: "accountinfo", foreignKey: "accountinfo_id"});
  TAccountInfo.hasMany(TAccountInfo_ReserveLog, { as: "TAccountInfo_ReserveLogs", foreignKey: "accountinfo_id"});
  TAtariInfo.belongsTo(TAccountInfo, { as: "accountinfo", foreignKey: "accountinfo_id"});
  TAccountInfo.hasMany(TAtariInfo, { as: "TAtariInfos", foreignKey: "accountinfo_id"});
  TAtariInfo.belongsTo(TDynamicInfo, { as: "atari_dynamic", foreignKey: "atari_dynamic_id"});
  TDynamicInfo.hasMany(TAtariInfo, { as: "TAtariInfos", foreignKey: "atari_dynamic_id"});
  TLotteryLogInfo.belongsTo(TDynamicInfo, { as: "dynamic_info", foreignKey: "dynamic_info_id"});
  TDynamicInfo.hasMany(TLotteryLogInfo, { as: "TLotteryLogInfos", foreignKey: "dynamic_info_id"});
  TAccountInfo_LotteryLog.belongsTo(TLotteryLogInfo, { as: "lottery_log", foreignKey: "lottery_log_id"});
  TLotteryLogInfo.hasMany(TAccountInfo_LotteryLog, { as: "TAccountInfo_LotteryLogs", foreignKey: "lottery_log_id"});
  TAccountInfo_ReserveLog.belongsTo(TReserveLotteryInfo, { as: "reserveinfo_", foreignKey: "reserveinfo_sid"});
  TReserveLotteryInfo.hasMany(TAccountInfo_ReserveLog, { as: "TAccountInfo_ReserveLogs", foreignKey: "reserveinfo_sid"});
  TAccountInfo.belongsTo(TUserInfo, { as: "uid_TUserInfo", foreignKey: "uid"});
  TUserInfo.hasMany(TAccountInfo, { as: "TAccountInfos", foreignKey: "uid"});

  return {
    TAccountDetailInfo,
    TAccountInfo,
    TAccountInfo_DashBoardInfo,
    TAccountInfo_LotteryLog,
    TAccountInfo_ReserveLog,
    TAtariInfo,
    TDynamicInfo,
    TLotteryLogInfo,
    TReserveLotteryInfo,
    TUserInfo,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
