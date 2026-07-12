'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('TDynamicInfo', {
      dynamic_content: { type: Sequelize.STRING(4096), allowNull: true },
      up_name: { type: Sequelize.STRING(50), allowNull: true },
      up_uid: { type: Sequelize.STRING(50), allowNull: true },
      pubts: { type: Sequelize.INTEGER, allowNull: true },
      like: { type: Sequelize.INTEGER, allowNull: true },
      comment: { type: Sequelize.INTEGER, allowNull: true },
      repost: { type: Sequelize.INTEGER, allowNull: true },
      dynamic_id: { type: Sequelize.STRING(255), allowNull: false },
      pk: { type: Sequelize.BIGINT, allowNull: false, primaryKey: true, autoIncrement: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      deletedAt: { type: Sequelize.DATE, allowNull: true }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('TDynamicInfo');
  }
};
