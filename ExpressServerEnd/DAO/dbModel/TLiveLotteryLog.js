const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('TLiveLotteryLog', {
    live_lottery_account_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'TAccountInfo',
        key: 'account_id'
      }
    },
    lot_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "B站直播抽奖的id\n可能只能到我自己的数据库里面去查询了\n当type是goldbox时，lot_id表示金宝箱的id"
    },
    type: {
      type: DataTypes.STRING(32),
      allowNull: true,
      comment: "anchor\nredpack\ngoldbox"
    },
    is_succ: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    feedback_info: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "直播抽奖反馈信息，如果成功则为null"
    },
    pk: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
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
    tableName: 'TLiveLotteryLog',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    indexes: [
      {
        name: "TLiveLotteryLog_pkey",
        unique: true,
        fields: [
          { name: "pk" },
        ]
      },
    ]
  });
};
