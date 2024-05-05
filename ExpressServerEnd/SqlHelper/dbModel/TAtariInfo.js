const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('TAtariInfo', {
    pk: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    accountinfo_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'TAccountInfo',
        key: 'account_id'
      }
    },
    atari_dynamic_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      references: {
        model: 'TDynamicInfo',
        key: 'dynamic_id'
      }
    }
  }, {
    sequelize,
    tableName: 'TAtariInfo',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "TAtariInfo_pkey",
        unique: true,
        fields: [
          { name: "pk" },
        ]
      },
    ]
  });
};
