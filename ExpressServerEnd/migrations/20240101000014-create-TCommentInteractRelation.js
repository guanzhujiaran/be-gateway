'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('TCommentInteractRelation', {
      pk: { type: Sequelize.BIGINT, allowNull: false, primaryKey: true, autoIncrement: true },
      comment_rpid: { type: Sequelize.BIGINT, allowNull: true },
      mid: { type: Sequelize.BIGINT, allowNull: true },
      action: { type: Sequelize.INTEGER, allowNull: true, comment: "需要登录(Cookie 或 APP)\n否则恒为 0\n0：无\n1：已点赞\n2：已点踩" },
      ctime: { type: Sequelize.INTEGER, allowNull: true, defaultValue: Sequelize.literal("EXTRACT(epoch FROM now())") },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      deletedAt: { type: Sequelize.DATE, allowNull: true },
      ip_info_id: { type: Sequelize.BIGINT, allowNull: true }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('TCommentInteractRelation');
  }
};
