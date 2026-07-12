'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('TAccountInfo_DashBoardInfo', {
      dashboard_id: { type: Sequelize.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
      accountinfo_id: { type: Sequelize.INTEGER, allowNull: true, comment: "accountinfo的外键" },
      account_uid: { type: Sequelize.TEXT, allowNull: true },
      account_uname: { type: Sequelize.TEXT, allowNull: true },
      level: { type: Sequelize.INTEGER, allowNull: true },
      account_status: { type: Sequelize.TEXT, allowNull: true },
      latest_lot_timestamp: { type: Sequelize.INTEGER, allowNull: true },
      vip: { type: Sequelize.STRING(30), allowNull: true, comment: "vip等级（普通用户，月度大会员，年度大会员，十年大会员，百年大会员" },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      deletedAt: { type: Sequelize.DATE, allowNull: true }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('TAccountInfo_DashBoardInfo');
  }
};
