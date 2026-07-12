'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('TPersonalizedContentType1', {
      rid: { type: Sequelize.BIGINT, allowNull: false, primaryKey: true },
      title: { type: Sequelize.STRING(256), allowNull: true },
      content: { type: Sequelize.STRING(4096), allowNull: true },
      desc: { type: Sequelize.STRING(4096), allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      deletedAt: { type: Sequelize.DATE, allowNull: true }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('TPersonalizedContentType1');
  }
};
