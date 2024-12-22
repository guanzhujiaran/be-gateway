const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('TDynamicInfo', {
    dynamic_content: {
      type: DataTypes.STRING(4096),
      allowNull: true
    },
    up_name: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    up_uid: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    pubts: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    like: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    comment: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    repost: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    dynamic_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: "TDynamicInfo_dynamic_id_key"
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
    tableName: 'TDynamicInfo',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    indexes: [
      {
        name: "TDynamicInfo_dynamic_id_key",
        unique: true,
        fields: [
          { name: "dynamic_id" },
        ]
      },
      {
        name: "TDynamicInfo_pkey",
        unique: true,
        fields: [
          { name: "pk" },
        ]
      },
      {
        name: "dynamic_id_unique",
        unique: true,
        fields: [
          { name: "dynamic_id" },
        ]
      },
    ]
  });
};
