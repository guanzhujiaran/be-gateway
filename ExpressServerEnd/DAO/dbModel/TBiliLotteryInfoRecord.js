const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('TBiliLotteryInfoRecord', {
    pk: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    computed_lottery_pk: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: "uq_computed_lottery_pk"
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    mid: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'TUserInfo',
        key: 'uid'
      }
    }
  }, {
    sequelize,
    tableName: 'TBiliLotteryInfoRecord',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    indexes: [
      {
        name: "TBiliLotteryInfoRecord_pkey",
        unique: true,
        fields: [
          { name: "pk" },
        ]
      },
      {
        name: "uq_computed_lottery_pk",
        unique: true,
        fields: [
          { name: "computed_lottery_pk" },
        ]
      },
    ]
  });
};
