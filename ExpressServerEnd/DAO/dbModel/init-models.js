var DataTypes = require("sequelize").DataTypes;
var _TBiliLotteryInfoRecord = require("./TBiliLotteryInfoRecord");
var _TBiliUser = require("./TBiliUser");
var _TBiliUserDetail = require("./TBiliUserDetail");
var _TDynamicInfo = require("./TDynamicInfo");
var _TLotteryLogInfo = require("./TLotteryLogInfo");
var _TReserveLotteryInfo = require("./TReserveLotteryInfo");
var _TUserActInfoLog = require("./TUserActInfoLog");

function initModels(sequelize) {
  var TBiliLotteryInfoRecord = _TBiliLotteryInfoRecord(sequelize, DataTypes);
  var TBiliUser = _TBiliUser(sequelize, DataTypes);
  var TBiliUserDetail = _TBiliUserDetail(sequelize, DataTypes);
  var TDynamicInfo = _TDynamicInfo(sequelize, DataTypes);
  var TLotteryLogInfo = _TLotteryLogInfo(sequelize, DataTypes);
  var TReserveLotteryInfo = _TReserveLotteryInfo(sequelize, DataTypes);
  var TUserActInfoLog = _TUserActInfoLog(sequelize, DataTypes);

  TBiliUserDetail.belongsTo(TBiliUser, { as: "uid_TBiliUser", foreignKey: "uid"});
  TBiliUser.hasOne(TBiliUserDetail, { as: "TBiliUserDetail", foreignKey: "uid"});
  TLotteryLogInfo.belongsTo(TDynamicInfo, { as: "dynamic_info", foreignKey: "dynamic_info_id"});
  TDynamicInfo.hasMany(TLotteryLogInfo, { as: "TLotteryLogInfos", foreignKey: "dynamic_info_id"});

  return {
    TBiliLotteryInfoRecord,
    TBiliUser,
    TBiliUserDetail,
    TDynamicInfo,
    TLotteryLogInfo,
    TReserveLotteryInfo,
    TUserActInfoLog,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
