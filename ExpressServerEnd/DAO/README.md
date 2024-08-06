> ## [DAO文件](./dbModel/init-models.js) 中将
>
>## ```TAccountInfo.hasMany(TAccountDetailInfo, { as: "TAccountDetailInfos", foreignKey: "account_info_id"});```
>
>## 替换
>
>## ```  TAccountInfo.hasOne(TAccountDetailInfo, { as: "info", foreignKey: "account_info_id"});```
>
>## 设置别名