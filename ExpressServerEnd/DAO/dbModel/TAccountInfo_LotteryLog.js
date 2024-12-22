const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('TAccountInfo_LotteryLog', {
    accountinfo_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'TAccountInfo',
        key: 'account_id'
      }
    },
    account_info_lotteryLog_id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: "主键",
      primaryKey: true
    },
    lottery_log_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'TLotteryLogInfo',
        key: 'pk'
      }
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'TAccountInfo_LotteryLog',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    indexes: [
      {
        name: "TAccountInfo_LotteryLog_pkey",
        unique: true,
        fields: [
          { name: "account_info_lotteryLog_id" },
        ]
      },
    ]
  });
};
