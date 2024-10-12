> ## [DAO文件](./dbModel/init-models.js) 中将
>
>## ```TAccountInfo.hasMany(TAccountDetailInfo, { as: "TAccountDetailInfos", foreignKey: "account_info_id"});```
>
>## 替换
>
>## ```  TAccountInfo.hasOne(TAccountDetailInfo, { as: "info", foreignKey: "account_info_id"});```
>
>## 设置别名
>

> ## 如果添加了新的表，则需要修改[SqlHelper.js](./SqlHelper.js)中的方法，添加新的表名

> ## 运行[generate_model](./generate_model.js)生成新的model文件