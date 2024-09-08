const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('TAccountBiliAtMsg', {
    account_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'TAccountInfo',
        key: 'account_id'
      }
    },
    at_id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    item: {
      type: DataTypes.JSON,
      allowNull: true
    },
    uid: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'TBiliUser',
        key: 'mid'
      }
    },
    at_time: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'TAccountBiliAtMsg',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "TAccountBiliAtMsg_pkey",
        unique: true,
        fields: [
          { name: "at_id" },
        ]
      },
    ]
  });
};
