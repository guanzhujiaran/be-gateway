# API 接口文档

## 响应码说明

所有API接口均采用统一的响应格式：`{code: 整数, data: 对象, msg: 字符串}`

### 成功响应码

| 响应码 | 说明 |
|-------|------|
| 0 | 操作成功 |

### 错误响应码

#### 通用错误码

| 响应码 | 说明 |
|-------|------|
| 500 | 服务器错误 |
| 400 | 请求错误 |
| -101 | 账号未登录 |
| -403 | 账号无权限 |

#### 账户相关错误码 (4001x)

| 响应码 | 说明 |
|-------|------|
| 40013 | 请输入账号名称或账号ID |
| 40014 | 该昵称已存在 |
| 40015 | 账号账号创建失败 |
| 40016 | 该账号不存在 |
| 40018 | 账号名称和COOKIENAME不一致 |
| 40019 | 保存账号详情失败 |

#### 内容相关错误码 (41000xx)

| 响应码 | 说明 |
|-------|------|
| 4100023 | 待回复的资源不存在 |
| 4100024 | 无内容 |
| 4100025 | 回复的内容不存在 |
| 4100026 | 评论层级错误 |

## 1. 用户相关接口 (User)

### 1.1 获取用户导航信息
- **URL**: `/api/v1/user/nav`
- **方法**: `GET`
- **权限**: 需要登录
- **描述**: 获取用户导航栏信息
- **响应**:
``json
{
  "code": 0,
  "data": {
    "uid": "用户ID",
    "uname": "用户名",
    "face": "头像URL",
    "level": 6,
    "vip": "大会员信息"
  },
  "msg": "成功"
}
```

### 1.2 获取用户信息
- **URL**: `/api/v1/user/user_info`
- **方法**: `GET`
- **权限**: 需要登录
- **描述**: 获取用户详细信息
- **响应**:
``json
{
  "code": 0,
  "data": {
    "uid": "用户ID",
    "uname": "用户名",
    "face": "头像URL",
    "level": 6,
    "vip": "大会员信息"
  },
  "msg": "成功"
}
```

### 1.3 刷新Token
- **URL**: `/api/v1/user/refresh_token`
- **方法**: `POST`
- **权限**: 需要登录
- **描述**: 刷新用户认证Token

### 1.4 更新用户信息
- **URL**: `/api/v1/user/user_info/update`
- **方法**: `POST`
- **权限**: 需要登录
- **参数**:
  - `uname`: 用户名 (2-24个字符)
  - `usersign`: 个性签名 (最多70个字符)
  - `sex`: 性别 (男/女/保密/武装直升机/永雏塔菲)
  - `birthday`: 生日 (日期格式)
- **描述**: 更新用户个人信息

### 1.5 用户登录
- **URL**: `/api/v1/user/login`
- **方法**: `POST`
- **权限**: 无需登录
- **参数**:
  - `user_name`: 用户名
  - `pwd`: 密码
- **描述**: 用户登录接口

### 1.6 获取密码盐值
- **URL**: `/api/v1/user/pwd_salt`
- **方法**: `GET`
- **权限**: 无需登录
- **描述**: 获取前端密码加密所需的盐值

### 1.7 用户注册
- **URL**: `/api/v1/user/reg`
- **方法**: `POST`
- **权限**: 无需登录
- **参数**:
  - `user_name`: 用户名 (5-30个字符)
  - `pwd`: 密码 (8-32个字符)
- **描述**: 用户注册接口

## 2. 账号相关接口 (Account)

### 2.1 获取所有账号列表
- **URL**: `/api/v1/account/all_accounts`
- **方法**: `GET`
- **权限**: 需要登录
- **描述**: 获取当前用户的所有B站账号信息
- **响应**:
``json
{
  "code": 0,
  "data": [
    {
      "account_name": "账号名称",
      "account_id": 1,
      "uid": "用户ID",
      "info": {
        "level": 6,
        "vip": "大会员信息",
        "face": "头像URL",
        "uname": "用户名"
      }
    }
  ],
  "msg": "成功"
}
```

### 2.2 添加账号
- **URL**: `/api/v1/account/add_account`
- **方法**: `POST`
- **权限**: 需要登录
- **参数**:
  - `account_name`: 账号名称
- **描述**: 添加一个新的B站账号

### 2.3 获取账号信息
- **URL**: `/api/v1/account/get_account_info`
- **方法**: `GET`
- **权限**: 需要登录
- **参数**:
  - `account_name` 或 `account_id`: 账号名称或ID
- **描述**: 获取指定B站账号的详细信息

### 2.4 获取账号设置
- **URL**: `/api/v1/account/get_account_setting`
- **方法**: `GET`
- **权限**: 需要登录
- **参数**:
  - `account_name`: 账号名称
- **描述**: 获取指定账号的设置信息

### 2.5 保存账号设置
- **URL**: `/api/v1/account/save_account_setting`
- **方法**: `POST`
- **权限**: 需要登录
- **参数**:
  - `account_name`: 账号名称
  - `settings`: 设置内容
- **描述**: 保存账号设置

### 2.6 获取账号运行状态
- **URL**: `/api/v1/account/get_account_running_status`
- **方法**: `GET`
- **权限**: 需要登录
- **参数**:
  - `account_name`: 账号名称
- **描述**: 获取账号任务运行状态

## 3. 抽奖相关接口 (Do Lottery)

### 3.1 运行B站动态抽奖任务
- **URL**: `/api/v1/do_lottery/bili/run`
- **方法**: `POST`
- **权限**: 需要登录
- **参数**:
  - `account_name`: 账号名称
- **描述**: 为指定账号启动B站动态抽奖任务

### 3.2 批量运行B站抽奖任务
- **URL**: `/api/v1/do_lottery/bili/run_bulk`
- **方法**: `POST`
- **权限**: 需要登录
- **描述**: 为当前用户所有账号批量启动抽奖任务

### 3.3 运行读取账号消息任务
- **URL**: `/api/v1/do_lottery/bili/run_read_account_msg`
- **方法**: `POST`
- **权限**: 需要登录
- **参数**:
  - `account_name`: 账号名称
- **描述**: 为指定账号启动读取消息任务

## 4. 抽奖数据库接口 (Lottery Database)

### 4.1 获取预约抽奖列表
- **URL**: `/api/v1/lottery_database/bili/GetReserveLottery`
- **方法**: `GET`
- **权限**: 可选登录
- **参数**:
  - `page_num`: 页码
  - `page_size`: 每页数量
- **描述**: 获取预约抽奖信息列表

### 4.2 获取官方抽奖列表
- **URL**: `/api/v1/lottery_database/bili/GetOfficialLottery`
- **方法**: `GET`
- **权限**: 可选登录
- **参数**:
  - `page_num`: 页码
  - `page_size`: 每页数量
- **描述**: 获取官方抽奖信息列表

### 4.3 获取充电抽奖列表
- **URL**: `/api/v1/lottery_database/bili/GetChargeLottery`
- **方法**: `GET`
- **权限**: 可选登录
- **参数**:
  - `page_num`: 页码
  - `page_size`: 每页数量
- **描述**: 获取充电抽奖信息列表

### 4.4 获取直播抽奖列表
- **URL**: `/api/v1/lottery_database/bili/GetLiveLottery`
- **方法**: `GET`
- **权限**: 可选登录
- **参数**:
  - `page_num`: 页码
  - `page_size`: 每页数量
- **描述**: 获取直播抽奖信息列表

### 4.5 获取话题抽奖列表
- **URL**: `/api/v1/lottery_database/bili/GetTopicLottery`
- **方法**: `GET`
- **权限**: 可选登录
- **参数**:
  - `page_num`: 页码
  - `page_size`: 每页数量
- **描述**: 获取话题抽奖信息列表

### 4.6 添加动态抽奖
- **URL**: `/api/v1/lottery_database/bili/AddDynamicLottery`
- **方法**: `POST`
- **权限**: 无需登录
- **参数**:
  - `dynamic_id_or_url`: 动态ID或URL
- **描述**: 添加动态抽奖信息到数据库

### 4.7 获取所有爬虫状态
- **URL**: `/api/v1/lottery_database/bili/GetAllScrapyStatus`
- **方法**: `GET`
- **权限**: 无需登录
- **描述**: 获取所有爬虫的运行状态

### 4.8 获取抽奖排行榜
- **URL**: `/api/v1/lottery_database/bili/rank/lottery_hof/:lot_type`
- **方法**: `GET`
- **权限**: 无需登录
- **路径参数**:
  - `lot_type`: 抽奖类型 (official/reserve/charge/total)
- **查询参数**:
  - `date`: 日期范围 (month/pre_month/year/pre_year/total)
  - `rank_type`: 排行类型 (first/second/third/total)
  - `offset`: 偏移量
  - `limit`: 数量限制
- **描述**: 获取指定类型的抽奖排行榜

### 4.9 获取抽奖结果
- **URL**: `/api/v1/lottery_database/bili/lottery_result`
- **方法**: `GET`
- **权限**: 无需登录
- **查询参数**:
  - `uid`: 用户ID
  - `date`: 日期范围 (month/pre_month/year/pre_year/total)
  - `lot_type`: 抽奖类型 (official/reserve/charge/total)
  - `rank_type`: 排行类型 (first/second/third/total)
  - `offset`: 偏移量
  - `limit`: 数量限制
- **描述**: 获取指定用户的抽奖结果

### 4.10 关键词搜索抽奖
- **URL**: `/api/v1/lottery_database/bili/SearchLotteryByKeyword`
- **方法**: `GET`
- **权限**: 无需登录
- **查询参数**:
  - `keyword`: 搜索关键词
- **描述**: 根据关键词搜索抽奖信息

## 5. 反馈评论接口 (Feedback Comment)

### 5.1 添加评论
- **URL**: `/api/v1/feedback/comment/add`
- **方法**: `POST`
- **权限**: 需要登录
- **参数**:
  - `oid`: 对象ID
  - `type`: 类型
  - `root`: 根评论ID
  - `parent`: 父评论ID
  - `content`: 评论内容 (最多4096字符)
- **描述**: 为指定内容添加评论

### 5.2 获取主评论列表
- **URL**: `/api/v1/feedback/comment/reply/main`
- **方法**: `GET`
- **权限**: 可选登录
- **参数**:
  - `oid`: 对象ID
  - `type`: 类型
  - `page_num`: 页码 (1-20)
  - `page_size`: 每页数量 (1-20)
  - `order_by`: 排序方式 (hot/time)
- **描述**: 获取指定内容的主评论列表

### 5.3 获取评论回复列表
- **URL**: `/api/v1/feedback/comment/reply/reply`
- **方法**: `GET`
- **权限**: 可选登录
- **参数**:
  - `oid`: 对象ID
  - `type`: 类型
  - `root`: 根评论ID
  - `page_num`: 页码 (1-20)
  - `page_size`: 每页数量 (1-20)
- **描述**: 获取指定评论的回复列表

### 5.4 评论操作(点赞/点踩)
- **URL**: `/api/v1/feedback/comment/action`
- **方法**: `POST`
- **权限**: 需要登录
- **参数**:
  - `rpid`: 评论ID
  - `action`: 操作类型 (0-取消/1-点赞/2-点踩)
- **描述**: 对评论进行点赞或点踩操作

### 5.5 删除评论
- **URL**: `/api/v1/feedback/comment/del`
- **方法**: `POST`
- **权限**: 需要登录
- **参数**:
  - `oid`: 对象ID
  - `type`: 类型
  - `rpid`: 评论ID
- **描述**: 删除指定评论

## 6. 反馈内容接口 (Feedback Content)

### 6.1 发布内容
- **URL**: `/api/v1/feedback/content/pub_content`
- **方法**: `POST`
- **权限**: 需要登录
- **参数**:
  - `title`: 标题
  - `content`: 内容
  - `type`: 类型
  - `desc`: 描述 (可选)
- **描述**: 发布个性化内容

### 6.2 获取内容列表
- **URL**: `/api/v1/feedback/content/get_list`
- **方法**: `GET`
- **权限**: 需要登录
- **参数**:
  - `page_num`: 页码
  - `page_size`: 每页数量
  - `order_by`: 排序方式 (hot/time)
- **描述**: 获取个性化内容列表

## 7. 管理员接口 (Admin)

### 7.1 任务队列管理
- **URL**: `/api/admin/queues/*`
- **方法**: 多种
- **权限**: 管理员
- **描述**: 通过Bull Board管理后台任务队列