'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('TAccountInfo_LotteryLog', {
      accountinfo_id: { type: Sequelize.INTEGER, allowNull: false },
      account_info_lotteryLog_id: { type: Sequelize.BIGINT, allowNull: false, primaryKey: true, autoIncrement: true, comment: "主键" },
      lottery_log_id: { type: Sequelize.BIGINT, allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      deletedAt: { type: Sequelize.DATE, allowNull: true }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('TAccountInfo_LotteryLog');
  }
};
