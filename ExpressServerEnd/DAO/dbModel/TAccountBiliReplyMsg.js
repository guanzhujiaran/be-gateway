const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('TAccountBiliReplyMsg', {
    account_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'TAccountInfo',
        key: 'account_id'
      }
    },
    reply_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    counts: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    item: {
      type: DataTypes.JSON,
      allowNull: true
    },
    reply_time: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "回复的时间戳"
    },
    uid: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'TBiliUser',
        key: 'mid'
      }
    }
  }, {
    sequelize,
    tableName: 'TAccountBiliReplyMsg',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "TAccountBiliReplyMsg_pkey",
        unique: true,
        fields: [
          { name: "reply_id" },
        ]
      },
    ]
  });
};
