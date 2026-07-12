'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('TUserNameRecord', {
      pk: { type: Sequelize.BIGINT, allowNull: false, primaryKey: true, autoIncrement: true },
      mid: { type: Sequelize.BIGINT, allowNull: false },
      prev_uname: { type: Sequelize.STRING(50), allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      deletedAt: { type: Sequelize.DATE, allowNull: true }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('TUserNameRecord');
  }
};
