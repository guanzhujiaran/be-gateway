'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('TBiliUserDetail', {
      uid: { type: Sequelize.BIGINT, allowNull: false, primaryKey: true },
      face: { type: Sequelize.STRING(255), allowNull: true },
      face_nft: { type: Sequelize.INTEGER, allowNull: true },
      face_nft_new: { type: Sequelize.INTEGER, allowNull: true },
      name_render: { type: Sequelize.JSON, allowNull: true },
      nameplate: { type: Sequelize.JSON, allowNull: true },
      official: { type: Sequelize.JSON, allowNull: true },
      pendant: { type: Sequelize.JSON, allowNull: true },
       vip: { type: Sequelize.JSON, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      deletedAt: { type: Sequelize.DATE, allowNull: true }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('TBiliUserDetail');
  }
};
