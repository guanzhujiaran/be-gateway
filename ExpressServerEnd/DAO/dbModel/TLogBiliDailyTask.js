const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('TLogBiliDailyTask', {
    pk: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    sanlian_ts: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "上一次三连任务的时间戳（秒"
    },
    bcoin_ts: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "上一次领取b币的时间戳（秒"
    },
    charge_ts: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    log_account_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'TAccountInfo',
        key: 'account_id'
      },
      unique: "uk-log_account_id"
    }
  }, {
    sequelize,
    tableName: 'TLogBiliDailyTask',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "TLogBiliDailyTask_pkey",
        unique: true,
        fields: [
          { name: "pk" },
        ]
      },
      {
        name: "uk-log_account_id",
        unique: true,
        fields: [
          { name: "log_account_id" },
        ]
      },
    ]
  });
};
