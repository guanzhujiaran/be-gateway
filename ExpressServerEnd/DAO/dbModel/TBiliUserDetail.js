const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('TBiliUserDetail', {
    uid: {
      type: DataTypes.BIGINT,
      allowNull: true,
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
    }
  }, {
    sequelize,
    tableName: 'TBiliUserDetail',
    schema: 'public',
    timestamps: false
  });
};
