const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('TAccountInfo_DashBoardInfo', {
    dashboard_id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    accountinfo_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "accountinfo的外键",
      references: {
        model: 'TAccountInfo',
        key: 'account_id'
      }
    },
    account_uid: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    account_uname: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    level: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    account_status: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    latest_lot_timestamp: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    vip: {
      type: DataTypes.STRING(30),
      allowNull: true,
      comment: "vip等级（普通用户，月度大会员，年度大会员，十年大会员，百年大会员"
    }
  }, {
    sequelize,
    tableName: 'TAccountInfo_DashBoardInfo',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "TAccountInfo_DashBoardInfo_pkey",
        unique: true,
        fields: [
          { name: "dashboard_id" },
        ]
      },
    ]
  });
};
