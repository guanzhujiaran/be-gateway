'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('TUserLevel', {
      mid: { type: Sequelize.BIGINT, allowNull: false, primaryKey: true },
      current_exp: { type: Sequelize.BIGINT, allowNull: true, defaultValue: 0 },
      current_level: { type: Sequelize.BIGINT, allowNull: true, defaultValue: 0 },
      current_min: { type: Sequelize.BIGINT, allowNull: true, defaultValue: 0 },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      deletedAt: { type: Sequelize.DATE, allowNull: true }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('TUserLevel');
  }
};
