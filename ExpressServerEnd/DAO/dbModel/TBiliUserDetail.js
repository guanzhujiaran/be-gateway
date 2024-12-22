const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('TBiliUserDetail', {
    uid: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'TBiliUser',
        key: 'mid'
      }
    },
    face: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    face_nft: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    face_nft_new: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    name_render: {
      type: DataTypes.JSON,
      allowNull: true
    },
    nameplate: {
      type: DataTypes.JSON,
      allowNull: true
    },
    official: {
      type: DataTypes.JSON,
      allowNull: true
    },
    pendant: {
      type: DataTypes.JSON,
      allowNull: true
    },
    ' vip': {
      type: DataTypes.JSON,
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
    tableName: 'TBiliUserDetail',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    indexes: [
      {
        name: "TBiliUserDetail_pkey",
        unique: true,
        fields: [
          { name: "uid" },
        ]
      },
    ]
  });
};
