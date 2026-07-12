'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addConstraint('TBiliLotteryInfoRecord', {
      constraintName: 'uq_computed_lottery_pk',
      fields: ['computed_lottery_pk'],
      type: 'UNIQUE',
    });
    await queryInterface.addConstraint('TComment', {
      constraintName: 'uq_rpid',
      fields: ['rpid'],
      type: 'UNIQUE',
    });
    await queryInterface.addConstraint('TCommentInteractRelation', {
      constraintName: 'TCommentInteractRelation_comment_rpid_mid_key',
      fields: ['comment_rpid', 'mid'],
      type: 'UNIQUE',
    });
    await queryInterface.addConstraint('TCommentInteractRelation', {
      constraintName: 'uq_rpid_mid',
      fields: ['comment_rpid', 'mid'],
      type: 'UNIQUE',
    });
    await queryInterface.addConstraint('TDynamicInfo', {
      constraintName: 'TDynamicInfo_dynamic_id_key',
      fields: ['dynamic_id'],
      type: 'UNIQUE',
    });
    await queryInterface.addConstraint('TDynamicInfo', {
      constraintName: 'dynamic_id_unique',
      fields: ['dynamic_id'],
      type: 'UNIQUE',
    });
    await queryInterface.addConstraint('TLogBiliDailyTask', {
      constraintName: 'TLogBiliDailyTask_log_account_id_key',
      fields: ['log_account_id'],
      type: 'UNIQUE',
    });
    await queryInterface.addConstraint('TLogBiliDailyTask', {
      constraintName: 'uk-log_account_id',
      fields: ['log_account_id'],
      type: 'UNIQUE',
    });
    await queryInterface.addConstraint('TPersonalizedContent', {
      constraintName: 'TPersonalizedContent_oid_type_key',
      fields: ['oid', 'type'],
      type: 'UNIQUE',
    });
    await queryInterface.addConstraint('TPersonalizedContent', {
      constraintName: 'uq_content_id',
      fields: ['content_id'],
      type: 'UNIQUE',
    });
    await queryInterface.addConstraint('TPersonalizedContent', {
      constraintName: 'uq_oid_type',
      fields: ['oid', 'type'],
      type: 'UNIQUE',
    });
    await queryInterface.addConstraint('TReserveLotteryInfo', {
      constraintName: 'TReserveLotteryInfo_reserve_sid_key',
      fields: ['reserve_sid'],
      type: 'UNIQUE',
    });
    await queryInterface.addConstraint('TUserInfo', {
      constraintName: 'TUserInfo_user_name_key',
      fields: ['user_name'],
      type: 'UNIQUE',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('TBiliLotteryInfoRecord', 'uq_computed_lottery_pk');
    await queryInterface.removeConstraint('TComment', 'uq_rpid');
    await queryInterface.removeConstraint('TCommentInteractRelation', 'TCommentInteractRelation_comment_rpid_mid_key');
    await queryInterface.removeConstraint('TCommentInteractRelation', 'uq_rpid_mid');
    await queryInterface.removeConstraint('TDynamicInfo', 'TDynamicInfo_dynamic_id_key');
    await queryInterface.removeConstraint('TDynamicInfo', 'dynamic_id_unique');
    await queryInterface.removeConstraint('TLogBiliDailyTask', 'TLogBiliDailyTask_log_account_id_key');
    await queryInterface.removeConstraint('TLogBiliDailyTask', 'uk-log_account_id');
    await queryInterface.removeConstraint('TPersonalizedContent', 'TPersonalizedContent_oid_type_key');
    await queryInterface.removeConstraint('TPersonalizedContent', 'uq_content_id');
    await queryInterface.removeConstraint('TPersonalizedContent', 'uq_oid_type');
    await queryInterface.removeConstraint('TReserveLotteryInfo', 'TReserveLotteryInfo_reserve_sid_key');
    await queryInterface.removeConstraint('TUserInfo', 'TUserInfo_user_name_key');
  }
};
