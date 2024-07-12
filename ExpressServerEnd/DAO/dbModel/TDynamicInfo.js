const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('TDynamicInfo', {
    dynamic_content: {
      type: DataTypes.STRING(1500),
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
      unique: "dynamic_id_unique"
    },
    pk: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    }
  }, {
    sequelize,
    tableName: 'TDynamicInfo',
    schema: 'public',
    timestamps: false,
    indexes: [
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
