'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('TAccountBiliAtMsg', {
      account_id: { type: Sequelize.INTEGER, allowNull: true },
      at_id: { type: Sequelize.BIGINT, allowNull: false, primaryKey: true },
      item: { type: Sequelize.JSON, allowNull: true },
      uid: { type: Sequelize.BIGINT, allowNull: true },
      at_time: { type: Sequelize.INTEGER, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      deletedAt: { type: Sequelize.DATE, allowNull: true }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('TAccountBiliAtMsg');
  }
};
