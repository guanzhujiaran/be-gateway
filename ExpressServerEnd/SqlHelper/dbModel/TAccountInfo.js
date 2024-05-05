const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('TAccountInfo', {
    account_name: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    account_id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    uid: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'TUserInfo',
        key: 'uid'
      }
    }
  }, {
    sequelize,
    tableName: 'TAccountInfo',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "TAccountInfo_pkey",
        unique: true,
        fields: [
          { name: "account_id" },
        ]
      },
    ]
  });
};
