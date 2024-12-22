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
      comment: "抽奖类型 \n0：只评论抽奖\n1：转发评论抽奖\n2：官方抽奖（只转发抽奖）\n"
    },
    update_ts: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    comment_msg: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "记录评论内容"
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
    tableName: 'TLotteryLogInfo',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
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
