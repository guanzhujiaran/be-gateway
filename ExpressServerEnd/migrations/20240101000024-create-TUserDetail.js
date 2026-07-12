'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('TUserDetail', {
      mid: { type: Sequelize.BIGINT, allowNull: false, primaryKey: true },
      avatar: { type: Sequelize.STRING(1024), allowNull: true },
      uname: { type: Sequelize.STRING(50), allowNull: true },
      sign: { type: Sequelize.STRING(1024), allowNull: true },
      sex: { type: Sequelize.STRING(50), allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      deletedAt: { type: Sequelize.DATE, allowNull: true },
      birthday: { type: Sequelize.DATE, allowNull: true, defaultValue: "1969-12-31 16:00:00+00" },
      email: { type: Sequelize.STRING(255), allowNull: true }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('TUserDetail');
  }
};
