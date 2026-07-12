/*
 * 将当前由 generate_migrations.js 生成的基线迁移标记为「已执行」，
 * 使 sequelize-cli 以当前模型状态作为迁移起点（baseline）。
 *
 * 适用场景：
 *   数据库已经通过旧的 init SQL（docker_vol/postgres/init/init*.sql）
 *   或模型 sync 建好了这些表，直接 `db:migrate` 会因表已存在而失败。
 *   本脚本只写入 SequelizeMeta 记录、不改动任何表结构，从而「假装」
 *   这些基线迁移已经跑过。之后 `db:migrate` 只会执行新增的迁移。
 *
 * 数据库还是全新空库时：请勿使用本脚本，直接 `npm run migrate` 即可，
 *   它会真正建表并自然成为基线。
 *
 * 运行：node ExpressServerEnd/Tool/set_baseline.js
 */
'use strict';

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const migrationsDir = path.resolve(__dirname, '../migrations');

// 取所有迁移文件名（不含 .js），即 sequelize-cli 记录在 SequelizeMeta 中的 name
const migrationNames = fs
  .readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.js'))
  .map((f) => f.replace(/\.js$/, ''))
  .sort();

// 用于在空库场景下判断是否已存在基线表，挑一个代表性的表即可
const SAMPLE_TABLE = 'TUserInfo';

async function main() {
  if (!process.env.DB) {
    console.error('未找到环境变量 DB，请确认 .env 已正确配置（参考 .env.excample）。');
    process.exit(1);
  }

  const client = new Client({ connectionString: process.env.DB });
  await client.connect();

  try {
    // 1) 确认基线表是否已经存在于数据库中
    const tableRes = await client.query(
      `SELECT to_regclass('public."${SAMPLE_TABLE}"') AS exists;`
    );
    const tableExists = tableRes.rows[0].exists != null;

    if (!tableExists) {
      console.error(
        `\n[中止] 数据库中未发现基线表 "${SAMPLE_TABLE}"，说明这是空库。\n` +
          `         请直接运行 "npm run migrate" 来真正建表并建立基线，\n` +
          `         不要使用本脚本（否则会生成「幽灵基线」：记录已执行却没有实际表）。\n`
      );
      process.exit(1);
    }

    // 2) 确保 SequelizeMeta 表存在（与 sequelize-cli 默认结构一致）
    await client.query(
      `CREATE TABLE IF NOT EXISTS "SequelizeMeta" (
         "name" VARCHAR(255) NOT NULL PRIMARY KEY
       );`
    );

    // 3) 写入基线迁移记录（幂等：已存在则跳过）
    let inserted = 0;
    let skipped = 0;
    for (const name of migrationNames) {
      const res = await client.query(
        `INSERT INTO "SequelizeMeta" ("name") VALUES ($1)
         ON CONFLICT ("name") DO NOTHING;`,
        [name]
      );
      if (res.rowCount > 0) inserted += 1;
      else skipped += 1;
    }

    console.log(
      `\n基线建立完成：共 ${migrationNames.length} 个基线迁移，` +
        `本次新增 ${inserted} 条记录，已存在跳过 ${skipped} 条。`
    );
    console.log('现在可运行 "npm run migrate:status" 检查，或继续追加新的迁移。');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('建立基线失败：', err.message);
  process.exit(1);
});
