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
    },
    reg_ip_info_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'TUserActInfoLog',
        key: 'pk'
      }
    }
  }, {
    sequelize,
    tableName: 'TUserInfo',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    indexes: [
      {
        name: "TUserInfo_pkey",
        unique: true,
        fields: [
          { name: "uid" },
        ]
      },
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
