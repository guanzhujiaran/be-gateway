'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('TReserveLotteryInfo', {
      pk: { type: Sequelize.BIGINT, allowNull: false, primaryKey: true, autoIncrement: true },
      reserve_url: { type: Sequelize.TEXT, allowNull: true },
      etime: { type: Sequelize.INTEGER, allowNull: true, comment: "时间戳（秒" },
      lottery_prize_info: { type: Sequelize.TEXT, allowNull: true },
      jump_url: { type: Sequelize.TEXT, allowNull: true },
      reserve_sid: { type: Sequelize.BIGINT, allowNull: false },
      available: { type: Sequelize.BOOLEAN, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      deletedAt: { type: Sequelize.DATE, allowNull: true }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('TReserveLotteryInfo');
  }
};
