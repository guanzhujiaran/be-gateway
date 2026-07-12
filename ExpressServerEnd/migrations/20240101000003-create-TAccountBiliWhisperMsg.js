'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('TAccountBiliWhisperMsg', {
      account_id: { type: Sequelize.INTEGER, allowNull: true },
      msg_key: { type: Sequelize.BIGINT, allowNull: false, primaryKey: true, autoIncrement: true },
      msg_source: { type: Sequelize.INTEGER, allowNull: true },
      msg_type: { type: Sequelize.INTEGER, allowNull: true },
      notify_code: { type: Sequelize.STRING(255), allowNull: true },
      receiver_id: { type: Sequelize.BIGINT, allowNull: true },
      receiver_type: { type: Sequelize.INTEGER, allowNull: true },
      sender_uid: { type: Sequelize.BIGINT, allowNull: true },
      timestamp: { type: Sequelize.INTEGER, allowNull: true, comment: "消息时间戳（秒）" },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      deletedAt: { type: Sequelize.DATE, allowNull: true }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('TAccountBiliWhisperMsg');
  }
};
