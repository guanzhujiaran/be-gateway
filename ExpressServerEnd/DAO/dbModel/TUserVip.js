const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('TUserVip', {
    mid: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'TUserInfo',
        key: 'uid'
      }
    },
    vip_due_date: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: "vip到期时间戳（ms"
    },
    vip_pay_type: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: "大致分成不同充值渠道？"
    },
    vip_status: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: "0：非vip\n1：目前就是vip\n2：非VIP（充值过，过期了）"
    },
    vip_type: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: "0：非vip\n1：月度\n2：年度\n3：十年\n4：百年"
    }
  }, {
    sequelize,
    tableName: 'TUserVip',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "TUserVip_pkey",
        unique: true,
        fields: [
          { name: "mid" },
        ]
      },
    ]
  });
};
