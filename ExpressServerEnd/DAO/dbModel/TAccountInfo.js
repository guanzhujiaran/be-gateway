const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('TAccountInfo', {
    account_name: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "账号名称，非b站的昵称"
    },
    account_id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "账户id，自增主键",
      primaryKey: true
    },
    uid: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: "本系统的用户id",
      references: {
        model: 'TUserInfo',
        key: 'uid'
      }
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
    tableName: 'TAccountInfo',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
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
