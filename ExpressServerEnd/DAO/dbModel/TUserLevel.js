const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('TUserLevel', {
    mid: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'TUserDetail',
        key: 'mid'
      }
    },
    current_exp: {
      type: DataTypes.BIGINT,
      allowNull: true,
      defaultValue: 0
    },
    current_level: {
      type: DataTypes.BIGINT,
      allowNull: true,
      defaultValue: 0
    },
    current_min: {
      type: DataTypes.BIGINT,
      allowNull: true,
      defaultValue: 0
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
    tableName: 'TUserLevel',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    indexes: [
      {
        name: "TUserLevel_pkey",
        unique: true,
        fields: [
          { name: "mid" },
        ]
      },
    ]
  });
};
