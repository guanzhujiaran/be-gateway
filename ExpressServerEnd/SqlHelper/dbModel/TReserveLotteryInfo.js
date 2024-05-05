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
    }
  }, {
    sequelize,
    tableName: 'TReserveLotteryInfo',
    schema: 'public',
    timestamps: false,
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
