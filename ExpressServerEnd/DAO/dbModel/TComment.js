const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('TComment', {
    mid: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'TUserInfo',
        key: 'uid'
      }
    },
    ctime: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.literal('EXTRACT(epoch FROM now())')
    },
    action: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    assist: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    content: {
      type: DataTypes.STRING(4096),
      allowNull: true
    },
    like: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    dislike: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    root: {
      type: DataTypes.BIGINT,
      allowNull: true,
      defaultValue: 0
    },
    parent: {
      type: DataTypes.BIGINT,
      allowNull: true,
      defaultValue: 0
    },
    rcount: {
      type: DataTypes.BIGINT,
      allowNull: true,
      defaultValue: 0,
      comment: "二级评论条数"
    },
    count: {
      type: DataTypes.BIGINT,
      allowNull: true,
      defaultValue: 0,
      comment: "根评论条数"
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    rpid: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      unique: "uq_rpid"
    },
    rid: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'TPersonalizedContent',
        key: 'content_id'
      }
    }
  }, {
    sequelize,
    tableName: 'TComment',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "TComment_pkey",
        unique: true,
        fields: [
          { name: "rpid" },
        ]
      },
      {
        name: "uq_rpid",
        unique: true,
        fields: [
          { name: "rpid" },
        ]
      },
    ]
  });
};
