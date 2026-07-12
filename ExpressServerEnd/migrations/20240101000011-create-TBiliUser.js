'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('TBiliUser', {
      mid: { type: Sequelize.BIGINT, allowNull: false, primaryKey: true },
      avatar: { type: Sequelize.STRING(255), allowNull: true },
      mid_link: { type: Sequelize.STRING(255), allowNull: true },
      nickname: { type: Sequelize.STRING(50), allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      deletedAt: { type: Sequelize.DATE, allowNull: true }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('TBiliUser');
  }
};
