'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addConstraint('TAccountBiliAtMsg', {
      constraintName: 'TAccountBiliAtMsg_account_id_fkey',
      fields: ['account_id'],
      type: 'FOREIGN KEY',
      references: { table: 'TAccountInfo', field: 'account_id' },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addConstraint('TAccountBiliAtMsg', {
      constraintName: 'TAccountBiliAtMsg_uid_fkey',
      fields: ['uid'],
      type: 'FOREIGN KEY',
      references: { table: 'TBiliUser', field: 'mid' },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addConstraint('TAccountBiliReplyMsg', {
      constraintName: 'TAccountBiliReplyMsg_account_id_fkey',
      fields: ['account_id'],
      type: 'FOREIGN KEY',
      references: { table: 'TAccountInfo', field: 'account_id' },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addConstraint('TAccountBiliReplyMsg', {
      constraintName: 'TAccountBiliReplyMsg_uid_fkey',
      fields: ['uid'],
      type: 'FOREIGN KEY',
      references: { table: 'TBiliUser', field: 'mid' },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addConstraint('TAccountBiliWhisperMsg', {
      constraintName: 'TAccountBiliWhisperMsg_account_id_fkey',
      fields: ['account_id'],
      type: 'FOREIGN KEY',
      references: { table: 'TAccountInfo', field: 'account_id' },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addConstraint('TAccountBiliWhisperMsg', {
      constraintName: 'TAccountBiliWhisperMsg_receiver_id_fkey',
      fields: ['receiver_id'],
      type: 'FOREIGN KEY',
      references: { table: 'TBiliUser', field: 'mid' },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addConstraint('TAccountBiliWhisperMsg', {
      constraintName: 'TAccountBiliWhisperMsg_sender_uid_fkey',
      fields: ['sender_uid'],
      type: 'FOREIGN KEY',
      references: { table: 'TBiliUser', field: 'mid' },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addConstraint('TAccountDetailInfo', {
      constraintName: 'TAccountDetailInfo_account_info_id_fkey',
      fields: ['account_info_id'],
      type: 'FOREIGN KEY',
      references: { table: 'TAccountInfo', field: 'account_id' },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addConstraint('TAccountInfo', {
      constraintName: 'TAccountInfo_uid_fkey',
      fields: ['uid'],
      type: 'FOREIGN KEY',
      references: { table: 'TUserInfo', field: 'uid' },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addConstraint('TAccountInfo_DashBoardInfo', {
      constraintName: 'TAccountInfo_DashBoardInfo_accountinfo_id_fkey',
      fields: ['accountinfo_id'],
      type: 'FOREIGN KEY',
      references: { table: 'TAccountInfo', field: 'account_id' },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addConstraint('TAccountInfo_LotteryLog', {
      constraintName: 'TAccountInfo_LotteryLog_accountinfo_id_fkey',
      fields: ['accountinfo_id'],
      type: 'FOREIGN KEY',
      references: { table: 'TAccountInfo', field: 'account_id' },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addConstraint('TAccountInfo_LotteryLog', {
      constraintName: 'TAccountInfo_LotteryLog_lottery_log_id_fkey',
      fields: ['lottery_log_id'],
      type: 'FOREIGN KEY',
      references: { table: 'TLotteryLogInfo', field: 'pk' },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addConstraint('TAccountInfo_ReserveLog', {
      constraintName: 'TAccountInfo_ReserveLog_accountinfo_id_fkey',
      fields: ['accountinfo_id'],
      type: 'FOREIGN KEY',
      references: { table: 'TAccountInfo', field: 'account_id' },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addConstraint('TAccountInfo_ReserveLog', {
      constraintName: 'TAccountInfo_ReserveLog_reserveinfo_sid_fkey',
      fields: ['reserveinfo_sid'],
      type: 'FOREIGN KEY',
      references: { table: 'TReserveLotteryInfo', field: 'reserve_sid' },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addConstraint('TAtariInfo', {
      constraintName: 'TAtariInfo_accountinfo_id_fkey',
      fields: ['accountinfo_id'],
      type: 'FOREIGN KEY',
      references: { table: 'TAccountInfo', field: 'account_id' },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addConstraint('TAtariInfo', {
      constraintName: 'TAtariInfo_atari_dynamic_id_fkey',
      fields: ['atari_dynamic_id'],
      type: 'FOREIGN KEY',
      references: { table: 'TDynamicInfo', field: 'dynamic_id' },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addConstraint('TBiliLotteryInfoRecord', {
      constraintName: 'TBiliLotteryInfoRecord_mid_fkey',
      fields: ['mid'],
      type: 'FOREIGN KEY',
      references: { table: 'TUserInfo', field: 'uid' },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addConstraint('TBiliUserDetail', {
      constraintName: 'TBiliUserDetail_uid_fkey',
      fields: ['uid'],
      type: 'FOREIGN KEY',
      references: { table: 'TBiliUser', field: 'mid' },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addConstraint('TComment', {
      constraintName: 'TComment_mid_fkey',
      fields: ['mid'],
      type: 'FOREIGN KEY',
      references: { table: 'TUserInfo', field: 'uid' },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addConstraint('TComment', {
      constraintName: 'TComment_root_fkey',
      fields: ['root'],
      type: 'FOREIGN KEY',
      references: { table: 'TComment', field: 'rpid' },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addConstraint('TComment', {
      constraintName: 'TComment_parent_fkey',
      fields: ['parent'],
      type: 'FOREIGN KEY',
      references: { table: 'TComment', field: 'rpid' },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addConstraint('TComment', {
      constraintName: 'TComment_rid_fkey',
      fields: ['rid'],
      type: 'FOREIGN KEY',
      references: { table: 'TPersonalizedContent', field: 'content_id' },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addConstraint('TComment', {
      constraintName: 'TComment_ip_info_id_fkey',
      fields: ['ip_info_id'],
      type: 'FOREIGN KEY',
      references: { table: 'TUserActInfoLog', field: 'pk' },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addConstraint('TCommentInteractRelation', {
      constraintName: 'TCommentInteractRelation_comment_rpid_fkey',
      fields: ['comment_rpid'],
      type: 'FOREIGN KEY',
      references: { table: 'TComment', field: 'rpid' },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addConstraint('TCommentInteractRelation', {
      constraintName: 'TCommentInteractRelation_mid_fkey',
      fields: ['mid'],
      type: 'FOREIGN KEY',
      references: { table: 'TUserInfo', field: 'uid' },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addConstraint('TCommentInteractRelation', {
      constraintName: 'TCommentInteractRelation_ip_info_id_fkey',
      fields: ['ip_info_id'],
      type: 'FOREIGN KEY',
      references: { table: 'TUserActInfoLog', field: 'pk' },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addConstraint('TCommonLog', {
      constraintName: 'TCommonLog_common_log_account_id_fkey',
      fields: ['common_log_account_id'],
      type: 'FOREIGN KEY',
      references: { table: 'TAccountInfo', field: 'account_id' },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addConstraint('TLiveLotteryLog', {
      constraintName: 'TLiveLotteryLog_live_lottery_account_id_fkey',
      fields: ['live_lottery_account_id'],
      type: 'FOREIGN KEY',
      references: { table: 'TAccountInfo', field: 'account_id' },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addConstraint('TLogBiliDailyTask', {
      constraintName: 'TLogBiliDailyTask_log_account_id_fkey',
      fields: ['log_account_id'],
      type: 'FOREIGN KEY',
      references: { table: 'TAccountInfo', field: 'account_id' },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addConstraint('TLotteryLogInfo', {
      constraintName: 'TLotteryLogInfo_dynamic_info_id_fkey',
      fields: ['dynamic_info_id'],
      type: 'FOREIGN KEY',
      references: { table: 'TDynamicInfo', field: 'pk' },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addConstraint('TPersonalizedContent', {
      constraintName: 'TPersonalizedContent_up_mid_fkey',
      fields: ['up_mid'],
      type: 'FOREIGN KEY',
      references: { table: 'TUserInfo', field: 'uid' },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addConstraint('TPersonalizedContent', {
      constraintName: 'TPersonalizedContent_ip_info_id_fkey',
      fields: ['ip_info_id'],
      type: 'FOREIGN KEY',
      references: { table: 'TUserActInfoLog', field: 'pk' },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addConstraint('TPersonalizedContentType1', {
      constraintName: 'TPersonalizedContentType1_rid_fkey',
      fields: ['rid'],
      type: 'FOREIGN KEY',
      references: { table: 'TPersonalizedContent', field: 'content_id' },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addConstraint('TUserActInfoLog', {
      constraintName: 'TUserActInfoLog_mid_fkey',
      fields: ['mid'],
      type: 'FOREIGN KEY',
      references: { table: 'TUserInfo', field: 'uid' },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addConstraint('TUserDetail', {
      constraintName: 'TUserDetail_mid_fkey',
      fields: ['mid'],
      type: 'FOREIGN KEY',
      references: { table: 'TUserInfo', field: 'uid' },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addConstraint('TUserInfo', {
      constraintName: 'TUserInfo_reg_ip_info_id_fkey',
      fields: ['reg_ip_info_id'],
      type: 'FOREIGN KEY',
      references: { table: 'TUserActInfoLog', field: 'pk' },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addConstraint('TUserLevel', {
      constraintName: 'TUserLevel_mid_fkey',
      fields: ['mid'],
      type: 'FOREIGN KEY',
      references: { table: 'TUserDetail', field: 'mid' },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addConstraint('TUserNameRecord', {
      constraintName: 'TUserNameRecord_mid_fkey',
      fields: ['mid'],
      type: 'FOREIGN KEY',
      references: { table: 'TUserInfo', field: 'uid' },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addConstraint('TUserPwdRecord', {
      constraintName: 'TUserPwdRecord_mid_fkey',
      fields: ['mid'],
      type: 'FOREIGN KEY',
      references: { table: 'TUserInfo', field: 'uid' },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addConstraint('TUserVip', {
      constraintName: 'TUserVip_mid_fkey',
      fields: ['mid'],
      type: 'FOREIGN KEY',
      references: { table: 'TUserDetail', field: 'mid' },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('TAccountBiliAtMsg', 'TAccountBiliAtMsg_account_id_fkey');
    await queryInterface.removeConstraint('TAccountBiliAtMsg', 'TAccountBiliAtMsg_uid_fkey');
    await queryInterface.removeConstraint('TAccountBiliReplyMsg', 'TAccountBiliReplyMsg_account_id_fkey');
    await queryInterface.removeConstraint('TAccountBiliReplyMsg', 'TAccountBiliReplyMsg_uid_fkey');
    await queryInterface.removeConstraint('TAccountBiliWhisperMsg', 'TAccountBiliWhisperMsg_account_id_fkey');
    await queryInterface.removeConstraint('TAccountBiliWhisperMsg', 'TAccountBiliWhisperMsg_receiver_id_fkey');
    await queryInterface.removeConstraint('TAccountBiliWhisperMsg', 'TAccountBiliWhisperMsg_sender_uid_fkey');
    await queryInterface.removeConstraint('TAccountDetailInfo', 'TAccountDetailInfo_account_info_id_fkey');
    await queryInterface.removeConstraint('TAccountInfo', 'TAccountInfo_uid_fkey');
    await queryInterface.removeConstraint('TAccountInfo_DashBoardInfo', 'TAccountInfo_DashBoardInfo_accountinfo_id_fkey');
    await queryInterface.removeConstraint('TAccountInfo_LotteryLog', 'TAccountInfo_LotteryLog_accountinfo_id_fkey');
    await queryInterface.removeConstraint('TAccountInfo_LotteryLog', 'TAccountInfo_LotteryLog_lottery_log_id_fkey');
    await queryInterface.removeConstraint('TAccountInfo_ReserveLog', 'TAccountInfo_ReserveLog_accountinfo_id_fkey');
    await queryInterface.removeConstraint('TAccountInfo_ReserveLog', 'TAccountInfo_ReserveLog_reserveinfo_sid_fkey');
    await queryInterface.removeConstraint('TAtariInfo', 'TAtariInfo_accountinfo_id_fkey');
    await queryInterface.removeConstraint('TAtariInfo', 'TAtariInfo_atari_dynamic_id_fkey');
    await queryInterface.removeConstraint('TBiliLotteryInfoRecord', 'TBiliLotteryInfoRecord_mid_fkey');
    await queryInterface.removeConstraint('TBiliUserDetail', 'TBiliUserDetail_uid_fkey');
    await queryInterface.removeConstraint('TComment', 'TComment_mid_fkey');
    await queryInterface.removeConstraint('TComment', 'TComment_root_fkey');
    await queryInterface.removeConstraint('TComment', 'TComment_parent_fkey');
    await queryInterface.removeConstraint('TComment', 'TComment_rid_fkey');
    await queryInterface.removeConstraint('TComment', 'TComment_ip_info_id_fkey');
    await queryInterface.removeConstraint('TCommentInteractRelation', 'TCommentInteractRelation_comment_rpid_fkey');
    await queryInterface.removeConstraint('TCommentInteractRelation', 'TCommentInteractRelation_mid_fkey');
    await queryInterface.removeConstraint('TCommentInteractRelation', 'TCommentInteractRelation_ip_info_id_fkey');
    await queryInterface.removeConstraint('TCommonLog', 'TCommonLog_common_log_account_id_fkey');
    await queryInterface.removeConstraint('TLiveLotteryLog', 'TLiveLotteryLog_live_lottery_account_id_fkey');
    await queryInterface.removeConstraint('TLogBiliDailyTask', 'TLogBiliDailyTask_log_account_id_fkey');
    await queryInterface.removeConstraint('TLotteryLogInfo', 'TLotteryLogInfo_dynamic_info_id_fkey');
    await queryInterface.removeConstraint('TPersonalizedContent', 'TPersonalizedContent_up_mid_fkey');
    await queryInterface.removeConstraint('TPersonalizedContent', 'TPersonalizedContent_ip_info_id_fkey');
    await queryInterface.removeConstraint('TPersonalizedContentType1', 'TPersonalizedContentType1_rid_fkey');
    await queryInterface.removeConstraint('TUserActInfoLog', 'TUserActInfoLog_mid_fkey');
    await queryInterface.removeConstraint('TUserDetail', 'TUserDetail_mid_fkey');
    await queryInterface.removeConstraint('TUserInfo', 'TUserInfo_reg_ip_info_id_fkey');
    await queryInterface.removeConstraint('TUserLevel', 'TUserLevel_mid_fkey');
    await queryInterface.removeConstraint('TUserNameRecord', 'TUserNameRecord_mid_fkey');
    await queryInterface.removeConstraint('TUserPwdRecord', 'TUserPwdRecord_mid_fkey');
    await queryInterface.removeConstraint('TUserVip', 'TUserVip_mid_fkey');
  }
};
