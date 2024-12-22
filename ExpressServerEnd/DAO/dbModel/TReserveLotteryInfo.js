const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('TReserveLotteryInfo', {
    pk: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    reserve_url: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    etime: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "时间戳（秒"
    },
    lottery_prize_info: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    jump_url: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    reserve_sid: {
      type: DataTypes.BIGINT,
      allowNull: false,
      unique: "TReserveLotteryInfo_reserve_sid_key"
    },
    available: {
      type: DataTypes.BOOLEAN,
      allowNull: true
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
    tableName: 'TReserveLotteryInfo',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    indexes: [
      {
        name: "TReserveLotteryInfo_pkey",
        unique: true,
        fields: [
          { name: "pk" },
        ]
      },
      {
        name: "TReserveLotteryInfo_reserve_sid_key",
        unique: true,
        fields: [
          { name: "reserve_sid" },
        ]
      },
    ]
  });
};
