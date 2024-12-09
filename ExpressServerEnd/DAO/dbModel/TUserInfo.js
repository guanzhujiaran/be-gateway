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
      allowNull: true,
      unique: "TUserInfo_user_name_key"
    },
    pwd: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    role: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: "level0",
      comment: "level0\nlevel1\n...\nroot"
    }
  }, {
    sequelize,
    tableName: 'TUserInfo',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "TUserInfo_user_name_key",
        unique: true,
        fields: [
          { name: "user_name" },
        ]
      },
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
