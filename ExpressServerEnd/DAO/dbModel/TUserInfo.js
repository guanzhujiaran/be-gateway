const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('TUserInfo', {
    uid: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    user_name: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    pwd: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'TUserInfo',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "UserInfo_pkey",
        unique: true,
        fields: [
          { name: "uid" },
        ]
      },
    ]
  });
};
