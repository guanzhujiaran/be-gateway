'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('TAccountInfo', {
      account_name: { type: Sequelize.TEXT, allowNull: true, comment: "账号名称，非b站的昵称" },
      account_id: { type: Sequelize.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true, comment: "账户id，自增主键" },
      uid: { type: Sequelize.BIGINT, allowNull: true, comment: "本系统的用户id" },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      deletedAt: { type: Sequelize.DATE, allowNull: true }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('TAccountInfo');
  }
};
