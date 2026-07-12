'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('TLogBiliDailyTask', {
      pk: { type: Sequelize.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
      sanlian_ts: { type: Sequelize.INTEGER, allowNull: true, comment: "上一次三连任务的时间戳（秒" },
      bcoin_ts: { type: Sequelize.INTEGER, allowNull: true, comment: "上一次领取b币的时间戳（秒" },
      charge_ts: { type: Sequelize.INTEGER, allowNull: true, comment: "上一次充电任务的时间戳（秒" },
      log_account_id: { type: Sequelize.INTEGER, allowNull: false },
      live_send_gift_ts: { type: Sequelize.INTEGER, allowNull: true, comment: "上一次直播间送免费礼物的时间戳（秒" },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      deletedAt: { type: Sequelize.DATE, allowNull: true }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('TLogBiliDailyTask');
  }
};
