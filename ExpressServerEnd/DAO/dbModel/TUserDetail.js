const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('TUserDetail', {
    mid: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'TUserInfo',
        key: 'uid'
      }
    },
    avatar: {
      type: DataTypes.STRING(1024),
      allowNull: true
    },
    uname: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    sign: {
      type: DataTypes.STRING(1024),
      allowNull: true
    },
    sex: {
      type: DataTypes.STRING(50),
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
    tableName: 'TUserDetail',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    indexes: [
      {
        name: "TUserDetail_pkey",
        unique: true,
        fields: [
          { name: "mid" },
        ]
      },
    ]
  });
};
