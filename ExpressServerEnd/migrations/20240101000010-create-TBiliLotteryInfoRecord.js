'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('TBiliLotteryInfoRecord', {
      pk: { type: Sequelize.BIGINT, allowNull: false, primaryKey: true, autoIncrement: true },
      computed_lottery_pk: { type: Sequelize.STRING(100), allowNull: false },
      score: { type: Sequelize.INTEGER, allowNull: true },
      mid: { type: Sequelize.BIGINT, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
      deletedAt: { type: Sequelize.DATE, allowNull: true }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('TBiliLotteryInfoRecord');
  }
};
