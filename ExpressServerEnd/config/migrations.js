// 加载 .env（sequelize-cli 独立进程，不会走 app.js 的 dotenv）。
// dotenv 默认不覆盖已存在的环境变量，docker 注入的 process.env.DB 不受影响。
require('dotenv').config();

/*
 * sequelize-cli 使用的数据库配置。
 * 开发机与线上统一连同一个库（PPTR_Bili_Lot），不再区分 dev / prod。
 * 库名通过 docker-compose.yml / .env 注入的 process.env.DB 指定，例如：
 *   postgres://postgres:114514@postgres:5432/PPTR_Bili_Lot
 *
 * 运行迁移示例：
 *   npx sequelize-cli db:migrate
 */
const PPTR_Bili_Lot = {
  url: process.env.DB,
  dialect: 'postgres',
};

module.exports = {
  // 开发机与线上统一连同一个库（PPTR_Bili_Lot），不再区分 dev / prod
  development: PPTR_Bili_Lot,
  production: PPTR_Bili_Lot,
};
