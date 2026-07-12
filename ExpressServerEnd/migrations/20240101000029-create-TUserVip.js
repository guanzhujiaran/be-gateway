'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('TUserVip', {
      mid: { type: Sequelize.BIGINT, allowNull: false, primaryKey: true },
      vip_due_date: { type: Sequelize.INTEGER, allowNull: true, defaultValue: 0, comment: "vip到期时间戳（ms" },
      vip_pay_type: { type: Sequelize.INTEGER, allowNull: true, defaultValue: 0, comment: "大致分成不同充值渠道？" },
      vip_status: { type: Sequelize.INTEGER, allowNull: true, defaultValue: 0, comment: "0：非vip\n1：目前就是vip\n2：非VIP（充值过，过期了）" },
      vip_type: { type: Sequelize.INTEGER, allowNull: true, defaultValue: 0, comment: "0：非vip\n1：月度\n2：年度\n3：十年\n4：百年" },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      deletedAt: { type: Sequelize.DATE, allowNull: true }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('TUserVip');
  }
};
