# puppeteer_Bili

BilibiliExplosion 的**前端网关与 Node.js 后端**。仓库内 `ExpressServerEnd` 是基于 **Express 5 + PostgreSQL + Sequelize** 的后端 API 服务，负责账号管理、抽奖任务调度、消息收发、内容互动等业务，并作为 B 站 RPA 浏览器、消息服务、爬虫后端的统一网关（反向代理 + Casdoor 单点登录）。

> 本文档主要描述 `ExpressServerEnd` 目录。仓库内其余文件夹（`lib/`、`ChatGPT/`、`木偶模块/`、`测试/`、`直播模块/`、`功能扩展基类/`、`刷视频播放时长/` 等）不在范围内。

## 功能

- 账号管理（B 站账号 CRUD、登录态维护）
- 抽奖任务调度与执行
- 评论 / 内容互动
- Casdoor 单点登录
- 作为统一网关：反向代理 `be-bilibili-crawler` / `RPA-Browser` / `be-message-service`
- Bull / BullMQ 异步队列

## 技术栈

| 类别 | 技术 |
| --- | --- |
| Web 框架 | Express 5 |
| 数据库 | PostgreSQL（pg 驱动） |
| ORM / 迁移 | Sequelize ^6 / sequelize-cli / sequelize-auto |
| 鉴权 | express-jwt + jsonwebtoken + Casdoor |
| 缓存 / 队列 | Redis（ioredis）/ Bull / BullMQ |
| 安全 | helmet / cors / express-rate-limit |
| 配置 | dotenv / js-yaml |
| 运行时 | Node.js 18+ |

## 目录结构

```
puppeteer_Bili/
├── ExpressServerEnd/
│   ├── app.js                # Express 应用主入口（中间件、路由、错误处理）
│   ├── server.js             # 服务启动（端口 + 上游健康检查）
│   ├── ServerRun.js          # 开发自测启动
│   ├── config/               # 配置（index / config.yml / run_arg / migrations / casdoor）
│   ├── routes/               # 路由层（user / account / casdoor / do_lottery / feedback_* / ping / proxy / queues）
│   ├── Controller/ Service/ MiddleWare/   # 控制器 / 业务 / 中间件
│   ├── DAO/                  # 数据访问层（SqlHelper / dbModel / Redis / 各业务 DAO）
│   ├── Model/                # 业务模型
│   ├── migrations/ seeders/  # sequelize-cli 迁移 / 种子
│   └── Tool/ test/
├── package.json
└── ...（其余非后端目录）
```

## 安装与启动

### 本地

```bash
cd puppeteer_Bili
npm install
```

环境变量 `.env`：

```env
DB=postgres://postgres:114514@postgres:5432/PPTR_Bili_Lot
```

启动（命令行参数经 `config/run_arg.js` 解析，`--env` 区分 dev/prod，`--port` 默认 `9923`）：

```bash
npm run dev    # 等价于 node ./ExpressServerEnd/ServerRun.js --port=9923 --env=dev
npm run prod   # 等价于 node ./ExpressServerEnd/ServerRun.js --port=9923 --env=prod
```

### Docker（推荐）

```bash
cd /home/minato/BilibiliExplosion
docker compose up -d gateway
```

容器内端口 `9923`，由 `docker-compose.yml` 的 `NODEJS_PPTR_PORT` 映射；依赖 `postgres` / `redis` / `casdoor`。

## 配置

- `ExpressServerEnd/config/config.yml`：系统级设置（密码盐、JWT secret、雪花算法 workerId、等级经验阈值、定时任务 cron 等）
- `ExpressServerEnd/config/migrations.js`：sequelize-cli 数据库配置，`development` / `production` 均读取 `process.env.DB`（`PPTR_Bili_Lot`，dialect `postgres`）
- `docker-compose.yml` 中注入：`DB`、`REDIS_*`、`CASDOOR_*`、`BILI_CRAWLER_URI` / `RPA_SERVICE_URI` / `MESSAGE_SERVICE_URI`（上游服务地址）

### API 路由一览

| 路径 | 说明 |
| --- | --- |
| `/api/v1/user` | 用户相关 |
| `/api/v1/account` | B 站账号管理 |
| `/api/v1/casdoor` | Casdoor 单点登录回调 |
| `/api/v1/do_lottery` | 抽奖任务 |
| `/api/v1/feedback/comment` | 评论互动 |
| `/api/v1/feedback/content` | 内容互动 |
| `/api/v1/ping` | 健康检查 |
| `/api/admin/queues` | Bull 队列面板（仅 localhost） |
| 其他 | 反向代理（`proxy.js`） |

## 与其它服务的关系

```
浏览器 / 前端 ──▶ puppeteer_Bili (gateway, :9923)
                      │  反向代理
        ┌─────────────┼───────────────────┐
        ▼             ▼                   ▼
  be-bilibili-crawler  RPA-Browser    be-message-service
        ▲                                 │
        └──────── unidbg / milvus ───────┘
```

## 附录：数据库与 Sequelize 同步

项目使用 Sequelize ORM，模型由 `sequelize-auto` 从数据库反向生成，集中在 `ExpressServerEnd/DAO/dbModel/`，统一由 `init-models.js` 聚合；运行时连接与模型初始化在 `ExpressServerEnd/DAO/SqlHelper.js` 完成。

### 方式一：sequelize.sync()

```js
const { Sequelize } = require("sequelize");
const initModels = require("@/ExpressServerEnd/DAO/dbModel/init-models");
const sequelize = new Sequelize(process.env.DB, { dialect: "postgres", logging: console.log });
initModels(sequelize);
sequelize.sync({ alter: true })
  .then(() => console.log("✅ 数据库同步完成"))
  .catch((e) => console.error("❌ 数据库同步失败", e));
```

- `sync()`：表不存在才创建；`sync({ force: true })`：删表重建（危险）；`sync({ alter: true })`：增量 ALTER（不删数据，适合开发）

### 方式二：Migrations（推荐生产）

```bash
npm run migrate          # npx sequelize-cli db:migrate
npm run migrate:status
npm run migrate:undo
```

迁移按文件名顺序执行：先建表、最后 `add-foreign-keys.js` 统一加外键，规避循环外键。

### 方式三：从数据库生成模型（sequelize-auto）

```bash
node ./ExpressServerEnd/DAO/generate_model.js TAccountInfo   # 单表
node ./ExpressServerEnd/DAO/generate_model.js                # 全部表
```

### 方式四：从模型反向生成迁移

```bash
npm run migration:gen     # node ./ExpressServerEnd/Tool/generate_migrations.js
```

### 同步流程建议

```
数据库变更 → 本地验证(方式一 alter) → 生成模型(方式三) → 生成迁移(方式四) → 生产同步(方式二)
```

## 常见问题

- **连接失败**：确认 `process.env.DB` 正确、PostgreSQL 可访问（Docker 下用服务名 `postgres`）
- **`alter: true` 报错**：部分列类型 Sequelize 无法自动 ALTER，改用迁移或手动 `ALTER`
- **外键循环依赖**：迁移已用「先建表后加外键」规避；`sync()` 也可能需手动处理
- **新增表未生效**：记得在 `SqlHelper.js` 导出新模型，并在 `init-models.js` 维护关联
