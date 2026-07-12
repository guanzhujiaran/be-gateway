'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('TLiveLotteryLog', {
      live_lottery_account_id: { type: Sequelize.INTEGER, allowNull: true },
      lot_id: { type: Sequelize.INTEGER, allowNull: true, comment: "B站直播抽奖的id\n可能只能到我自己的数据库里面去查询了\n当type是goldbox时，lot_id表示金宝箱的id" },
      type: { type: Sequelize.STRING(32), allowNull: true, comment: "anchor\nredpack\ngoldbox" },
      is_succ: { type: Sequelize.BOOLEAN, allowNull: true },
      feedback_info: { type: Sequelize.TEXT, allowNull: true, comment: "直播抽奖反馈信息，如果成功则为null" },
      pk: { type: Sequelize.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      deletedAt: { type: Sequelize.DATE, allowNull: true }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('TLiveLotteryLog');
  }
};
