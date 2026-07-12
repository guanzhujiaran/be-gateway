# puppeteer_Bili 后端服务（ExpressServerEnd）

> 本文档仅描述本项目中的 `ExpressServerEnd` 目录（Node.js + Express + Sequelize 后端服务）。
> 仓库内其余文件夹（`lib/`、`ChatGPT/`、`木偶模块/`、`测试/`、`直播模块/`、`功能扩展基类/`、`刷视频播放时长/` 等）不在本文档范围内。

`ExpressServerEnd` 是基于 **Express 5** 的后端 API 服务，负责账号管理、抽奖任务调度、消息收发、内容互动等业务，数据持久化使用 **PostgreSQL** + **Sequelize**。

---

## 目录结构

```
ExpressServerEnd/
├── app.js                  # Express 应用主入口（中间件、路由注册、错误处理）
├── server.js               # 服务启动文件（监听端口 + 上游健康检查）
├── ServerRun.js            # 兼容旧启动方式，直接 require server.js
├── ServerDevTest.js        # 开发自测脚本示例
├── config/                 # 配置
│   ├── index.js            # 加载 config.yml（全局设置）
│   ├── config.yml          # 盐值、JWT、雪花算法、等级经验等
│   ├── run_arg.js          # 解析命令行参数（minimist）
│   ├── migrations.js       # sequelize-cli 数据库配置（统一连 PPTR_Bili_Lot）
│   └── casdoor_config.js   # Casdoor 单点登录配置
├── routes/                 # 路由层（Express Router）
│   ├── user.js  account.js  casdoor.js
│   ├── do_lottery.js  feedback_comment.js  feedback_content.js
│   ├── ping.js  proxy.js  queues.js
├── Controller/             # 控制器层
├── Service/                # 业务服务层（JWT、权限、后台任务、上游健康等）
├── MiddleWare/             # 自定义中间件（限流、鉴权等）
├── DAO/                    # 数据访问层
│   ├── SqlHelper.js        # Sequelize 实例 + 模型初始化（核心）
│   ├── generate_model.js   # 用 sequelize-auto 从库生成模型
│   ├── dbModel/            # 自动生成的 Model（含 init-models.js）
│   ├── Redis/              # Redis 缓存 DAO
│   └── *.js                # 各业务 DAO（AccountDao、UserDao ...）
├── Model/                  # 业务模型定义
│   ├── api/v1/             # API 相关模型
│   └── base_model/         # 基础模型
├── migrations/             # sequelize-cli 迁移文件（建表 + 外键）
├── seeders/                # 种子数据
├── Tool/                   # 工具脚本（如 generate_migrations.js）
└── test/                   # 测试
```

---

## 技术栈

| 类别 | 技术 |
| --- | --- |
| Web 框架 | Express 5 |
| 数据库 | PostgreSQL（通过 `pg` 驱动） |
| ORM | `sequelize` ^6.37.8 |
| 迁移工具 | `sequelize-cli` ^6.6.5 |
| 模型生成 | `sequelize-auto` ^0.8.8 |
| 鉴权 | `express-jwt` + `jsonwebtoken` + Casdoor |
| 缓存/队列 | Redis（`ioredis` / `redis`）、Bull / BullMQ |
| 安全 | `helmet`、`cors`、`express-rate-limit` |
| 配置 | `dotenv`、YAML（`js-yaml`） |

---

## 环境准备

### 1. 运行环境
- Node.js（建议 18+）
- 一个可用的 PostgreSQL 实例
- Redis（缓存/队列，可选但推荐）

### 2. 安装依赖
```bash
cd puppeteer_Bili
npm install
```

### 3. 环境变量（`.env`）
服务通过 `dotenv` 注入环境变量，数据库连接信息依赖 **`DB`** 这个完整连接串：

```env
# 完整 PostgreSQL 连接串，例如：
DB=postgres://postgres:114514@postgres:5432/PPTR_Bili_Lot
```

> 在 Docker 部署场景下，`DB` 由 `docker-compose.yml` 注入（格式参考
> `ExpressServerEnd/config/migrations.js` 注释：`postgres://postgres:114514@postgres:5432/PPTR_Bili_Lot`）。

其余配置（如 JWT 密钥、密码盐、Casdoor 配置等）见 `ExpressServerEnd/config/config.yml` 及根目录 `.env`。

### 4. 配置说明
- `config/config.yml`：系统级设置（密码盐、JWT secret、雪花算法 workerId、等级经验阈值、定时任务 cron 等）。
- `config/migrations.js`：sequelize-cli 使用的数据库配置，`development`/`production` 均读取 `process.env.DB`（即 `PPTR_Bili_Lot`），dialect 为 `postgres`。

---

## 启动服务

命令行参数通过 `config/run_arg.js`（`minimist`）解析，`--env` 区分 `dev` / `prod`，`--port` 指定端口（默认 `9923`）。

```bash
# 开发环境（开启请求日志、SQL 日志）
npm run dev
# 等价于：node ./ExpressServerEnd/ServerRun.js --port=9923 --env=dev

# 生产环境
npm run prod
# 等价于：node ./ExpressServerEnd/ServerRun.js --port=9923 --env=prod
```

启动后监听 `0.0.0.0:9923`，并异步执行上游代理服务健康检查（不阻塞启动）。

### API 路由一览

| 路径 | 说明 |
| --- | --- |
| `/api/v1/user` | 用户相关接口 |
| `/api/v1/account` | B 站账号管理 |
| `/api/v1/casdoor` | Casdoor 单点登录回调 |
| `/api/v1/do_lottery` | 抽奖任务 |
| `/api/v1/feedback/comment` | 评论互动 |
| `/api/v1/feedback/content` | 内容互动 |
| `/api/v1/ping` | 健康检查 |
| `/api/admin/queues` | Bull 队列面板（仅限 localhost） |
| 其他 | 反向代理（`proxy.js`） |

---

## 数据库与 Sequelize 同步

项目使用 **Sequelize** 作为 ORM，模型由 `sequelize-auto` 从数据库反向生成，集中在 `ExpressServerEnd/DAO/dbModel/`，统一由 `init-models.js` 聚合。运行时连接与模型初始化在 `ExpressServerEnd/DAO/SqlHelper.js` 完成：

```js
// DAO/SqlHelper.js（核心逻辑）
const { Sequelize } = require("sequelize");
const DB = process.env.DB;                       // 完整连接串
const sequelize = new Sequelize(DB, {
  dialect: "postgres",
  logging: run_env_args['env'] === 'prod' ? false : console.log,
});

// 初始化全部模型
const { TAccountInfo, TUserInfo, /* ... */ } = require("./dbModel/init-models")(sequelize);
```

下面介绍四种「同步数据库」的方式，按实际场景选择。

### 方式一：使用 `sequelize.sync()` 直接同步模型到数据库

`sequelize.sync()` 会**根据 Model 定义自动创建 / 更新数据表**，无需手写 SQL 或迁移文件，适合快速开发或本地搭建表结构。

```js
// scripts/sync_db.js
require("module-alias/register");
require("dotenv").config();
const { Sequelize } = require("sequelize");
const initModels = require("@/ExpressServerEnd/DAO/dbModel/init-models");

const sequelize = new Sequelize(process.env.DB, {
  dialect: "postgres",
  logging: console.log,
});

// 聚合所有模型
initModels(sequelize);

// 同步所有模型到数据库
sequelize.sync({ alter: true })
  .then(() => console.log("✅ 数据库同步完成"))
  .catch((e) => console.error("❌ 数据库同步失败", e));
```

`sync()` 的参数行为：
- `sequelize.sync()`：仅当表不存在时创建（`CREATE TABLE IF NOT EXISTS`），**不会修改已存在的表**。
- `sequelize.sync({ force: true })`：**先删除所有表再重建**，会丢失数据，仅用于开发重置。
- `sequelize.sync({ alter: true })`：对比模型与现有表结构，增量 `ALTER` 表以匹配模型（不删数据），适合模型变动后同步。
- 也可对单个模型同步：`const { TAccountInfo } = initModels(sequelize); await TAccountInfo.sync({ alter: true });`

> ⚠️ `force` / `alter` 在生产环境有数据风险，请谨慎使用；生产推荐方式二（迁移）。

运行：
```bash
node scripts/sync_db.js
```

### 方式二：使用 Migrations（sequelize-cli）同步（推荐用于生产）

项目已内置迁移文件（`ExpressServerEnd/migrations/*.js`，每张表一个 `create-<Table>.js`，最后一个 `add-foreign-keys.js` 统一追加外键）。路径映射由根目录 `.sequelizerc` 指定：

```js
// .sequelizerc
module.exports = {
  config:         path.resolve('ExpressServerEnd/config/migrations.js'),
  'migrations-path': path.resolve('ExpressServerEnd/migrations'),
  'seeders-path':   path.resolve('ExpressServerEnd/seeders'),
  'models-path':    path.resolve('ExpressServerEnd/DAO/dbModel'),
};
```

执行迁移（读取 `process.env.DB`，开发机与线上统一连同一个库 `PPTR_Bili_Lot`，不再区分 dev / prod）：

```bash
# 迁移
npm run migrate
# 等价于：npx sequelize-cli db:migrate

# 查看迁移状态
npm run migrate:status

# 回滚最近一次迁移
npm run migrate:undo
```

迁移会按文件名时间戳顺序执行，先建表、最后加外键，规避循环外键（如 `TUserInfo` ↔ `TUserActInfoLog`）导致的报错。

### 方式三：从数据库生成模型（sequelize-auto）

当数据库表结构变更后，可用 `DAO/generate_model.js` 重新生成 `dbModel/` 下的模型文件：

```bash
# 生成单个表（表名可逗号分隔多个）
node ./ExpressServerEnd/DAO/generate_model.js TAccountInfo

# 生成全部表（不传参）
node ./ExpressServerEnd/DAO/generate_model.js
```

该脚本内部调用 `sequelize-auto`，连接参数（host / database / user / pass / port / dialect）与 `additional`（附加定义，引用 `puppeteer_Bili/table_additional_setting.json`，配置了 `timestamps/paranoid`，即软删除）写死在脚本内，输出到 `ExpressServerEnd/DAO/dbModel`。

生成后注意：
1. 在 `DAO/dbModel/init-models.js` 中确认关联定义（如 `TAccountInfo.hasMany(...)`）是否正确；
2. 如新增了表，需在 `DAO/SqlHelper.js` 中补充 `require` 与 `module.exports`。

### 方式四：从模型反向生成迁移（generate_migrations.js）

若模型（`dbModel/`）已就绪，但尚无迁移文件，可用 `Tool/generate_migrations.js` 反向生成基线迁移：

```bash
npm run migration:gen
# 等价于：node ./ExpressServerEnd/Tool/generate_migrations.js
```

生成的迁移特性：
- 每张表一个 `create-<Table>.js`（仅建表，不含外键，规避建表顺序 / 循环外键问题）；
- 最后生成一个 `add-foreign-keys.js`，统一追加所有外键约束（`ON DELETE NO ACTION, ON UPDATE CASCADE`）。

### 同步流程建议

```
数据库表结构变更
   │
   ├─(本地快速验证)──▶ 方式一 sequelize.sync({ alter: true })
   │
   ├─(生成模型)──────▶ 方式三 generate_model.js  → 更新 dbModel/
   │
   ├─(生成迁移)──────▶ 方式四 migration:gen       → 更新 migrations/
   │
   └─(生产同步)──────▶ 方式二 npm run migrate
```

---

## 常见问题

- **连接失败**：确认 `process.env.DB` 连接串正确、PostgreSQL 可访问（Docker 下用服务名 `postgres`）。`SqlHelper.js` 启动时会打印「数据库【xxx】连接正常 / 失败」。
- **`alter: true` 报错**：部分列类型变更 Sequelize 无法自动 ALTER，可改用迁移或手动 `ALTER`。
- **外键循环依赖**：迁移已用「先建表、后加外键」规避；若用 `sync()`，依赖闭合时也可能需手动处理。
- **新增表未生效**：记得在 `SqlHelper.js` 导出新模型，并在 `init-models.js` 维护关联关系。
