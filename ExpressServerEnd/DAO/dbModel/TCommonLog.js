const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('TCommonLog', {
    pk: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    common_log_account_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'TAccountInfo',
        key: 'account_id'
      }
    },
    contents: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    ts: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    func_name: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    level: {
      type: DataTypes.SMALLINT,
      allowNull: true,
      comment: "从小到大代表严重程度\n0为debug（估计用不上\n1为info\n2为warn\n3为error\n4为critical"
    }
  }, {
    sequelize,
    tableName: 'TCommonLog',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "TErrorLog_pkey",
        unique: true,
        fields: [
          { name: "pk" },
        ]
      },
    ]
  });
};
