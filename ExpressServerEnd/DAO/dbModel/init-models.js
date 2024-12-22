var DataTypes = require("sequelize").DataTypes;
var _TAccountBiliAtMsg = require("./TAccountBiliAtMsg");
var _TAccountBiliReplyMsg = require("./TAccountBiliReplyMsg");
var _TAccountBiliWhisperMsg = require("./TAccountBiliWhisperMsg");
var _TAccountDetailInfo = require("./TAccountDetailInfo");
var _TAccountInfo = require("./TAccountInfo");
var _TAccountInfo_DashBoardInfo = require("./TAccountInfo_DashBoardInfo");
var _TAccountInfo_LotteryLog = require("./TAccountInfo_LotteryLog");
var _TAccountInfo_ReserveLog = require("./TAccountInfo_ReserveLog");
var _TAtariInfo = require("./TAtariInfo");
var _TBiliUser = require("./TBiliUser");
var _TBiliUserDetail = require("./TBiliUserDetail");
var _TComment = require("./TComment");
var _TCommentInteractRelation = require("./TCommentInteractRelation");
var _TCommonLog = require("./TCommonLog");
var _TDynamicInfo = require("./TDynamicInfo");
var _TLiveLotteryLog = require("./TLiveLotteryLog");
var _TLogBiliDailyTask = require("./TLogBiliDailyTask");
var _TLotteryLogInfo = require("./TLotteryLogInfo");
var _TPersonalizedContent = require("./TPersonalizedContent");
var _TPersonalizedContentType1 = require("./TPersonalizedContentType1");
var _TReserveLotteryInfo = require("./TReserveLotteryInfo");
var _TUserActInfoLog = require("./TUserActInfoLog");
var _TUserDetail = require("./TUserDetail");
var _TUserInfo = require("./TUserInfo");
var _TUserLevel = require("./TUserLevel");
var _TUserVip = require("./TUserVip");

function initModels(sequelize) {
  var TAccountBiliAtMsg = _TAccountBiliAtMsg(sequelize, DataTypes);
  var TAccountBiliReplyMsg = _TAccountBiliReplyMsg(sequelize, DataTypes);
  var TAccountBiliWhisperMsg = _TAccountBiliWhisperMsg(sequelize, DataTypes);
  var TAccountDetailInfo = _TAccountDetailInfo(sequelize, DataTypes);
  var TAccountInfo = _TAccountInfo(sequelize, DataTypes);
  var TAccountInfo_DashBoardInfo = _TAccountInfo_DashBoardInfo(sequelize, DataTypes);
  var TAccountInfo_LotteryLog = _TAccountInfo_LotteryLog(sequelize, DataTypes);
  var TAccountInfo_ReserveLog = _TAccountInfo_ReserveLog(sequelize, DataTypes);
  var TAtariInfo = _TAtariInfo(sequelize, DataTypes);
  var TBiliUser = _TBiliUser(sequelize, DataTypes);
  var TBiliUserDetail = _TBiliUserDetail(sequelize, DataTypes);
  var TComment = _TComment(sequelize, DataTypes);
  var TCommentInteractRelation = _TCommentInteractRelation(sequelize, DataTypes);
  var TCommonLog = _TCommonLog(sequelize, DataTypes);
  var TDynamicInfo = _TDynamicInfo(sequelize, DataTypes);
  var TLiveLotteryLog = _TLiveLotteryLog(sequelize, DataTypes);
  var TLogBiliDailyTask = _TLogBiliDailyTask(sequelize, DataTypes);
  var TLotteryLogInfo = _TLotteryLogInfo(sequelize, DataTypes);
  var TPersonalizedContent = _TPersonalizedContent(sequelize, DataTypes);
  var TPersonalizedContentType1 = _TPersonalizedContentType1(sequelize, DataTypes);
  var TReserveLotteryInfo = _TReserveLotteryInfo(sequelize, DataTypes);
  var TUserActInfoLog = _TUserActInfoLog(sequelize, DataTypes);
  var TUserDetail = _TUserDetail(sequelize, DataTypes);
  var TUserInfo = _TUserInfo(sequelize, DataTypes);
  var TUserLevel = _TUserLevel(sequelize, DataTypes);
  var TUserVip = _TUserVip(sequelize, DataTypes);

  TAccountBiliAtMsg.belongsTo(TAccountInfo, { as: "account", foreignKey: "account_id"});
  TAccountInfo.hasMany(TAccountBiliAtMsg, { as: "TAccountBiliAtMsgs", foreignKey: "account_id"});
  TAccountBiliReplyMsg.belongsTo(TAccountInfo, { as: "account", foreignKey: "account_id"});
  TAccountInfo.hasMany(TAccountBiliReplyMsg, { as: "TAccountBiliReplyMsgs", foreignKey: "account_id"});
  TAccountBiliWhisperMsg.belongsTo(TAccountInfo, { as: "account", foreignKey: "account_id"});
  TAccountInfo.hasMany(TAccountBiliWhisperMsg, { as: "TAccountBiliWhisperMsgs", foreignKey: "account_id"});
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
  TCommonLog.belongsTo(TAccountInfo, { as: "common_log_account", foreignKey: "common_log_account_id"});
  TAccountInfo.hasMany(TCommonLog, { as: "TCommonLogs", foreignKey: "common_log_account_id"});
  TLiveLotteryLog.belongsTo(TAccountInfo, { as: "live_lottery_account", foreignKey: "live_lottery_account_id"});
  TAccountInfo.hasMany(TLiveLotteryLog, { as: "TLiveLotteryLogs", foreignKey: "live_lottery_account_id"});
  TLogBiliDailyTask.belongsTo(TAccountInfo, { as: "log_account", foreignKey: "log_account_id"});
  TAccountInfo.hasOne(TLogBiliDailyTask, { as: "TLogBiliDailyTask", foreignKey: "log_account_id"});
  TAccountBiliAtMsg.belongsTo(TBiliUser, { as: "uid_TBiliUser", foreignKey: "uid"});
  TBiliUser.hasMany(TAccountBiliAtMsg, { as: "TAccountBiliAtMsgs", foreignKey: "uid"});
  TAccountBiliReplyMsg.belongsTo(TBiliUser, { as: "uid_TBiliUser", foreignKey: "uid"});
  TBiliUser.hasMany(TAccountBiliReplyMsg, { as: "TAccountBiliReplyMsgs", foreignKey: "uid"});
  TAccountBiliWhisperMsg.belongsTo(TBiliUser, { as: "receiver", foreignKey: "receiver_id"});
  TBiliUser.hasMany(TAccountBiliWhisperMsg, { as: "TAccountBiliWhisperMsgs", foreignKey: "receiver_id"});
  TAccountBiliWhisperMsg.belongsTo(TBiliUser, { as: "sender_u", foreignKey: "sender_uid"});
  TBiliUser.hasMany(TAccountBiliWhisperMsg, { as: "sender_u_TAccountBiliWhisperMsgs", foreignKey: "sender_uid"});
  TBiliUserDetail.belongsTo(TBiliUser, { as: "uid_TBiliUser", foreignKey: "uid"});
  TBiliUser.hasOne(TBiliUserDetail, { as: "TBiliUserDetail", foreignKey: "uid"});
  TComment.belongsTo(TComment, { as: "parent_TComment", foreignKey: "parent"});
  TComment.hasMany(TComment, { as: "TComments", foreignKey: "parent"});
  TComment.belongsTo(TComment, { as: "root_TComment", foreignKey: "root"});
  TComment.hasMany(TComment, { as: "root_TComments", foreignKey: "root"});
  TCommentInteractRelation.belongsTo(TComment, { as: "comment_rp", foreignKey: "comment_rpid"});
  TComment.hasMany(TCommentInteractRelation, { as: "TCommentInteractRelations", foreignKey: "comment_rpid"});
  TAtariInfo.belongsTo(TDynamicInfo, { as: "atari_dynamic", foreignKey: "atari_dynamic_id"});
  TDynamicInfo.hasMany(TAtariInfo, { as: "TAtariInfos", foreignKey: "atari_dynamic_id"});
  TLotteryLogInfo.belongsTo(TDynamicInfo, { as: "dynamic_info", foreignKey: "dynamic_info_id"});
  TDynamicInfo.hasMany(TLotteryLogInfo, { as: "TLotteryLogInfos", foreignKey: "dynamic_info_id"});
  TAccountInfo_LotteryLog.belongsTo(TLotteryLogInfo, { as: "lottery_log", foreignKey: "lottery_log_id"});
  TLotteryLogInfo.hasMany(TAccountInfo_LotteryLog, { as: "TAccountInfo_LotteryLogs", foreignKey: "lottery_log_id"});
  TComment.belongsTo(TPersonalizedContent, { as: "rid_TPersonalizedContent", foreignKey: "rid"});
  TPersonalizedContent.hasMany(TComment, { as: "TComments", foreignKey: "rid"});
  TPersonalizedContentType1.belongsTo(TPersonalizedContent, { as: "rid_TPersonalizedContent", foreignKey: "rid"});
  TPersonalizedContent.hasOne(TPersonalizedContentType1, { as: "TPersonalizedContentType1", foreignKey: "rid"});
  TAccountInfo_ReserveLog.belongsTo(TReserveLotteryInfo, { as: "reserveinfo_", foreignKey: "reserveinfo_sid"});
  TReserveLotteryInfo.hasMany(TAccountInfo_ReserveLog, { as: "TAccountInfo_ReserveLogs", foreignKey: "reserveinfo_sid"});
  TComment.belongsTo(TUserActInfoLog, { as: "ip_info", foreignKey: "ip_info_id"});
  TUserActInfoLog.hasMany(TComment, { as: "TComments", foreignKey: "ip_info_id"});
  TCommentInteractRelation.belongsTo(TUserActInfoLog, { as: "ip_info", foreignKey: "ip_info_id"});
  TUserActInfoLog.hasMany(TCommentInteractRelation, { as: "TCommentInteractRelations", foreignKey: "ip_info_id"});
  TPersonalizedContent.belongsTo(TUserActInfoLog, { as: "ip_info", foreignKey: "ip_info_id"});
  TUserActInfoLog.hasMany(TPersonalizedContent, { as: "TPersonalizedContents", foreignKey: "ip_info_id"});
  TUserInfo.belongsTo(TUserActInfoLog, { as: "reg_ip_info", foreignKey: "reg_ip_info_id"});
  TUserActInfoLog.hasMany(TUserInfo, { as: "TUserInfos", foreignKey: "reg_ip_info_id"});
  TUserLevel.belongsTo(TUserDetail, { as: "mid_TUserDetail", foreignKey: "mid"});
  TUserDetail.hasOne(TUserLevel, { as: "TUserLevel", foreignKey: "mid"});
  TUserVip.belongsTo(TUserDetail, { as: "mid_TUserDetail", foreignKey: "mid"});
  TUserDetail.hasOne(TUserVip, { as: "TUserVip", foreignKey: "mid"});
  TAccountInfo.belongsTo(TUserInfo, { as: "uid_TUserInfo", foreignKey: "uid"});
  TUserInfo.hasMany(TAccountInfo, { as: "TAccountInfos", foreignKey: "uid"});
  TComment.belongsTo(TUserInfo, { as: "mid_TUserInfo", foreignKey: "mid"});
  TUserInfo.hasMany(TComment, { as: "TComments", foreignKey: "mid"});
  TCommentInteractRelation.belongsTo(TUserInfo, { as: "mid_TUserInfo", foreignKey: "mid"});
  TUserInfo.hasMany(TCommentInteractRelation, { as: "TCommentInteractRelations", foreignKey: "mid"});
  TPersonalizedContent.belongsTo(TUserInfo, { as: "up_m", foreignKey: "up_mid"});
  TUserInfo.hasMany(TPersonalizedContent, { as: "TPersonalizedContents", foreignKey: "up_mid"});
  TUserActInfoLog.belongsTo(TUserInfo, { as: "mid_TUserInfo", foreignKey: "mid"});
  TUserInfo.hasMany(TUserActInfoLog, { as: "TUserActInfoLogs", foreignKey: "mid"});
  TUserDetail.belongsTo(TUserInfo, { as: "mid_TUserInfo", foreignKey: "mid"});
  TUserInfo.hasOne(TUserDetail, { as: "TUserDetail", foreignKey: "mid"});

  return {
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
    TUserVip,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
