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
    assist: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    content: {
      type: DataTypes.STRING(4096),
      allowNull: true
    },
    root: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'TComment',
        key: 'rpid'
      }
    },
    parent: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'TComment',
        key: 'rpid'
      }
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
    rpid: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    rid: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'TPersonalizedContent',
        key: 'content_id'
      }
    },
    like: {
      type: DataTypes.BIGINT,
      allowNull: true,
      defaultValue: 0
    },
    dislike: {
      type: DataTypes.BIGINT,
      allowNull: true,
      defaultValue: 0
    },
    is_reported: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
      comment: "是否被举办"
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
    },
    is_topped: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    ip_info_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'TUserActInfoLog',
        key: 'pk'
      }
    }
  }, {
    sequelize,
    tableName: 'TComment',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
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
