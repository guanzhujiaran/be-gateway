'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('TCommonLog', {
      pk: { type: Sequelize.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
      common_log_account_id: { type: Sequelize.INTEGER, allowNull: true },
      contents: { type: Sequelize.TEXT, allowNull: true },
      ts: { type: Sequelize.INTEGER, allowNull: true },
      func_name: { type: Sequelize.TEXT, allowNull: true },
      level: { type: Sequelize.SMALLINT, allowNull: true, comment: "从小到大代表严重程度\n0为debug（估计用不上\n1为info\n2为warn\n3为error\n4为critical" },
      module_name: { type: Sequelize.TEXT, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      deletedAt: { type: Sequelize.DATE, allowNull: true }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('TCommonLog');
  }
};
