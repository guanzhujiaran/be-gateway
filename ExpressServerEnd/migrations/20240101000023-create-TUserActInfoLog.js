'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('TUserActInfoLog', {
      mid: { type: Sequelize.BIGINT, allowNull: true },
      ip: { type: Sequelize.STRING(50), allowNull: true },
      ua: { type: Sequelize.TEXT, allowNull: true },
      headers: { type: Sequelize.JSON, allowNull: true },
      act_info: { type: Sequelize.TEXT, allowNull: true },
      pk: { type: Sequelize.BIGINT, allowNull: false, primaryKey: true, autoIncrement: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      deletedAt: { type: Sequelize.DATE, allowNull: true }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('TUserActInfoLog');
  }
};
