const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('TAccountDetailInfo', {
    account_detail_info_id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    account_info_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'TAccountInfo',
        key: 'account_id'
      }
    },
    uname: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "账号的用户名（B站昵称）"
    },
    vip: {
      type: DataTypes.STRING(30),
      allowNull: true,
      defaultValue: "普通用户"
    },
    level: {
      type: DataTypes.SMALLINT,
      allowNull: true,
      defaultValue: 0
    },
    uid: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    settings: {
      type: DataTypes.JSON,
      allowNull: true
    },
    nav_json: {
      type: DataTypes.JSON,
      allowNull: true
    },
    face: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'TAccountDetailInfo',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "TAccountDetailInfo_pkey",
        unique: true,
        fields: [
          { name: "account_detail_info_id" },
        ]
      },
    ]
  });
};
