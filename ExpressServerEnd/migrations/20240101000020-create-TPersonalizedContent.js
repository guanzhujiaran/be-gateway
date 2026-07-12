'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('TPersonalizedContent', {
      oid: { type: Sequelize.BIGINT, allowNull: false, autoIncrement: true, comment: "自己的id" },
      type: { type: Sequelize.INTEGER, allowNull: false, comment: "1：文字\n后续待定" },
      up_mid: { type: Sequelize.BIGINT, allowNull: true },
      ctime: { type: Sequelize.INTEGER, allowNull: true, defaultValue: Sequelize.literal("EXTRACT(epoch FROM now())") },
      content_id: { type: Sequelize.BIGINT, allowNull: false, primaryKey: true, comment: "对外显示的业务id" },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      deletedAt: { type: Sequelize.DATE, allowNull: true },
      ip_info_id: { type: Sequelize.BIGINT, allowNull: true }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('TPersonalizedContent');
  }
};
