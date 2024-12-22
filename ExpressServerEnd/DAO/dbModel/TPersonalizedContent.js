const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('TPersonalizedContent', {
    oid: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: "自己的id",
      unique: "TPersonalizedContent_oid_type_key"
    },
    type: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "1：文字\n后续待定",
      unique: "TPersonalizedContent_oid_type_key"
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
      primaryKey: true
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
    tableName: 'TPersonalizedContent',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    indexes: [
      {
        name: "TPersonalizedContent_oid_type_key",
        unique: true,
        fields: [
          { name: "oid" },
          { name: "type" },
        ]
      },
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
