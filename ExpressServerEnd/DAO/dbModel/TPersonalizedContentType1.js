const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('TPersonalizedContentType1', {
    rid: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'TPersonalizedContent',
        key: 'content_id'
      }
    },
    title: {
      type: DataTypes.STRING(256),
      allowNull: true
    },
    content: {
      type: DataTypes.STRING(4096),
      allowNull: true
    },
    desc: {
      type: DataTypes.STRING(4096),
      allowNull: true
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
    tableName: 'TPersonalizedContentType1',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    indexes: [
      {
        name: "TPersonalizedContentType1_pkey",
        unique: true,
        fields: [
          { name: "rid" },
        ]
      },
    ]
  });
};
