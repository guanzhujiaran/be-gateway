const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('TCommentInteractRelation', {
    pk: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    comment_rpid: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'TComment',
        key: 'rpid'
      },
      unique: "TCommentInteractRelation_comment_rpid_mid_key"
    },
    mid: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'TUserInfo',
        key: 'uid'
      },
      unique: "TCommentInteractRelation_comment_rpid_mid_key"
    },
    action: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "需要登录(Cookie 或 APP)\n否则恒为 0\n0：无\n1：已点赞\n2：已点踩"
    },
    ctime: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.literal('EXTRACT(epoch FROM now())')
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
    tableName: 'TCommentInteractRelation',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    indexes: [
      {
        name: "TCommentInteractRelation_comment_rpid_mid_key",
        unique: true,
        fields: [
          { name: "comment_rpid" },
          { name: "mid" },
        ]
      },
      {
        name: "TCommentInteractRelation_pkey",
        unique: true,
        fields: [
          { name: "pk" },
        ]
      },
      {
        name: "uq_rpid_mid",
        unique: true,
        fields: [
          { name: "comment_rpid" },
          { name: "mid" },
        ]
      },
    ]
  });
};
