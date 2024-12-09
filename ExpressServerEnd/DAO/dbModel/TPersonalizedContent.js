const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('TPersonalizedContent', {
    oid: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: "自己的id",
      unique: "uq_oid_type"
    },
    type: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "1：文字\n后续待定",
      unique: "uq_oid_type"
    },
    up_mid: {
      type: DataTypes.BIGINT,
      allowNull: true,
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
    content_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: "对外显示的业务id",
      primaryKey: true,
      unique: "uq_content_id"
    }
  }, {
    sequelize,
    tableName: 'TPersonalizedContent',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "TPersonalizedContent_pkey",
        unique: true,
        fields: [
          { name: "content_id" },
        ]
      },
      {
        name: "uq_content_id",
        unique: true,
        fields: [
          { name: "content_id" },
        ]
      },
      {
        name: "uq_oid_type",
        unique: true,
        fields: [
          { name: "oid" },
          { name: "type" },
        ]
      },
    ]
  });
};
