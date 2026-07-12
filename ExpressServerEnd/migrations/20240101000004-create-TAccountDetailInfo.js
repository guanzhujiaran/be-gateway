'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('TAccountDetailInfo', {
      account_detail_info_id: { type: Sequelize.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
      account_info_id: { type: Sequelize.INTEGER, allowNull: true },
      uname: { type: Sequelize.STRING(255), allowNull: true, comment: "账号的用户名（B站昵称）" },
      vip: { type: Sequelize.STRING(30), allowNull: true, defaultValue: "普通用户" },
      level: { type: Sequelize.SMALLINT, allowNull: true, defaultValue: 0 },
      uid: { type: Sequelize.STRING(255), allowNull: true },
      settings: { type: Sequelize.JSON, allowNull: true },
      nav_json: { type: Sequelize.JSON, allowNull: true },
      face: { type: Sequelize.STRING(255), allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      deletedAt: { type: Sequelize.DATE, allowNull: true }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('TAccountDetailInfo');
  }
};
