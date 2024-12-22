const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('TUserActInfoLog', {
    mid: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'TUserInfo',
        key: 'uid'
      }
    },
    ip: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    ua: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    headers: {
      type: DataTypes.JSON,
      allowNull: true
    },
    act_info: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    pk: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
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
    tableName: 'TUserActInfoLog',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    indexes: [
      {
        name: "TUserActInfoLog_pkey",
        unique: true,
        fields: [
          { name: "pk" },
        ]
      },
    ]
  });
};
