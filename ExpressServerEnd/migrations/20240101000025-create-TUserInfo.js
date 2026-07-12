'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('TUserInfo', {
      uid: { type: Sequelize.BIGINT, allowNull: false, primaryKey: true, autoIncrement: true },
      user_name: { type: Sequelize.TEXT, allowNull: true },
      pwd: { type: Sequelize.TEXT, allowNull: true },
      role: { type: Sequelize.STRING(255), allowNull: true, defaultValue: "level0", comment: "level0\nlevel1\n...\nroot" },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      deletedAt: { type: Sequelize.DATE, allowNull: true },
      reg_ip_info_id: { type: Sequelize.BIGINT, allowNull: true }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('TUserInfo');
  }
};
