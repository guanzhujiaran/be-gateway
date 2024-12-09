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
      }
    },
    mid: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'TUserInfo',
        key: 'uid'
      }
    },
    action: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "需要登录(Cookie 或 APP)\n否则恒为 0\n0：无\n1：已点赞\n2：已点踩"
    }
  }, {
    sequelize,
    tableName: 'TCommentInteractRelation',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "TCommentInteractRelation_pkey",
        unique: true,
        fields: [
          { name: "pk" },
        ]
      },
    ]
  });
};
