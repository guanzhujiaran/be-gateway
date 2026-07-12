'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('TAccountBiliReplyMsg', {
      account_id: { type: Sequelize.INTEGER, allowNull: true },
      reply_id: { type: Sequelize.BIGINT, allowNull: false, primaryKey: true },
      counts: { type: Sequelize.INTEGER, allowNull: true },
      item: { type: Sequelize.JSON, allowNull: true },
      reply_time: { type: Sequelize.INTEGER, allowNull: true, comment: "回复的时间戳" },
      uid: { type: Sequelize.BIGINT, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      deletedAt: { type: Sequelize.DATE, allowNull: true }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('TAccountBiliReplyMsg');
  }
};
