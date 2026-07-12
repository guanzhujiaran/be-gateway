'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('TLotteryLogInfo', {
      pk: { type: Sequelize.BIGINT, allowNull: false, primaryKey: true, autoIncrement: true },
      lottery_log: { type: Sequelize.TEXT, allowNull: true },
      is_success: { type: Sequelize.BOOLEAN, allowNull: true, comment: "是否抽奖成功了\n需要人工判断的\n点过赞的动态\n404动态\n都算成功" },
      is_manual_reply: { type: Sequelize.BOOLEAN, allowNull: true, comment: "是否需要人工判断" },
      dynamic_info_id: { type: Sequelize.BIGINT, allowNull: false },
      add_ts: { type: Sequelize.INTEGER, allowNull: true },
      lottery_type: { type: Sequelize.ARRAY(Sequelize.INTEGER), allowNull: true, comment: "抽奖类型 \n0：只评论抽奖\n1：转发评论抽奖\n2：官方抽奖（只转发抽奖）\n" },
      update_ts: { type: Sequelize.INTEGER, allowNull: true },
      comment_msg: { type: Sequelize.TEXT, allowNull: true, comment: "记录评论内容" },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      deletedAt: { type: Sequelize.DATE, allowNull: true }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('TLotteryLogInfo');
  }
};
