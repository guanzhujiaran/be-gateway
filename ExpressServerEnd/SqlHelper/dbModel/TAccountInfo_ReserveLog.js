const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('TAccountInfo_ReserveLog', {
    pk: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    accountinfo_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'TAccountInfo',
        key: 'account_id'
      }
    },
    reserveinfo_sid: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'TReserveLotteryInfo',
        key: 'reserve_sid'
      }
    }
  }, {
    sequelize,
    tableName: 'TAccountInfo_ReserveLog',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "TAccountInfo_ReserveLog_pkey",
        unique: true,
        fields: [
          { name: "pk" },
        ]
      },
    ]
  });
};
