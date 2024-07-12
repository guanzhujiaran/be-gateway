const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('TLotteryLogInfo', {
    pk: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    lottery_log: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    is_success: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      comment: "是否抽奖成功了\n需要人工判断的\n点过赞的动态\n404动态\n都算成功"
    },
    is_manual_reply: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      comment: "是否需要人工判断"
    },
    dynamic_info_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'TDynamicInfo',
        key: 'pk'
      }
    },
    add_ts: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    lottery_type: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: true,
      comment: "抽奖类型 \n0：普通抽奖\n1：官方抽奖\n2：预约抽奖"
    },
    update_ts: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'TLotteryLogInfo',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "TLotteryLogInfo_pkey",
        unique: true,
        fields: [
          { name: "pk" },
        ]
      },
    ]
  });
};
