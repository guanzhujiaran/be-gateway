'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('TComment', {
      mid: { type: Sequelize.BIGINT, allowNull: false },
      ctime: { type: Sequelize.INTEGER, allowNull: true, defaultValue: Sequelize.literal("EXTRACT(epoch FROM now())") },
      assist: { type: Sequelize.INTEGER, allowNull: true, defaultValue: 0 },
      content: { type: Sequelize.STRING(4096), allowNull: true },
      root: { type: Sequelize.BIGINT, allowNull: true },
      parent: { type: Sequelize.BIGINT, allowNull: true },
      rcount: { type: Sequelize.BIGINT, allowNull: true, defaultValue: 0, comment: "二级评论条数" },
      count: { type: Sequelize.BIGINT, allowNull: true, defaultValue: 0, comment: "根评论条数" },
      rpid: { type: Sequelize.BIGINT, allowNull: false, primaryKey: true },
      rid: { type: Sequelize.BIGINT, allowNull: false },
      like: { type: Sequelize.BIGINT, allowNull: true, defaultValue: 0 },
      dislike: { type: Sequelize.BIGINT, allowNull: true, defaultValue: 0 },
      is_reported: { type: Sequelize.BOOLEAN, allowNull: true, defaultValue: false, comment: "是否被举办" },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      deletedAt: { type: Sequelize.DATE, allowNull: true },
      is_topped: { type: Sequelize.BOOLEAN, allowNull: true, defaultValue: false },
      ip_info_id: { type: Sequelize.BIGINT, allowNull: true }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('TComment');
  }
};
