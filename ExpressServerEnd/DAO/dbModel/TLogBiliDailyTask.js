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
      allowNull: true,
      comment: "上一次充电任务的时间戳（秒"
    },
    log_account_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'TAccountInfo',
        key: 'account_id'
      },
      unique: "TLogBiliDailyTask_log_account_id_key"
    },
    live_send_gift_ts: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "上一次直播间送免费礼物的时间戳（秒"
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
    tableName: 'TLogBiliDailyTask',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    indexes: [
      {
        name: "TLogBiliDailyTask_log_account_id_key",
        unique: true,
        fields: [
          { name: "log_account_id" },
        ]
      },
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
