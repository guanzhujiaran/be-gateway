const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('TAccountBiliWhisperMsg', {
    account_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'TAccountInfo',
        key: 'account_id'
      }
    },
    msg_key: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    msg_source: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    msg_type: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    notify_code: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    receiver_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'TBiliUser',
        key: 'mid'
      }
    },
    receiver_type: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    sender_uid: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'TBiliUser',
        key: 'mid'
      }
    },
    timestamp: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "消息时间戳（秒）"
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
    tableName: 'TAccountBiliWhisperMsg',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    indexes: [
      {
        name: "TAccountBiliMsg_pkey",
        unique: true,
        fields: [
          { name: "msg_key" },
        ]
      },
      {
        name: "TAccountBiliWhisperMsg_pkey",
        unique: true,
        fields: [
          { name: "msg_key" },
        ]
      },
    ]
  });
};
