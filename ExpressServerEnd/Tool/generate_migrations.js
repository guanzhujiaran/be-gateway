/*
 * 根据现有的 sequelize 模型(ExpressServerEnd/DAO/dbModel)反向生成
 * 初始化(基线)迁移文件，使数据库结构可通过 sequelize-cli 进行管理。
 *
 * 生成的迁移文件特点：
 *   1. 每张表一个 create-<Table>.js 迁移文件(仅建表，不含外键约束)，
 *      以规避建表顺序 / 循环外键(如 TUserInfo <-> TUserActInfoLog)问题；
 *   2. 最后生成一个 add-foreign-keys.js，统一追加所有外键约束。
 *
 * 运行：node ExpressServerEnd/Tool/generate_migrations.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');

const dbModelDir = path.resolve(__dirname, '../DAO/dbModel');
const migrationsDir = path.resolve(__dirname, '../migrations');
const modelFiles = fs
  .readdirSync(dbModelDir)
  .filter((f) => f.endsWith('.js') && f !== 'init-models.js');

// 仅用于承载模型定义元数据，不会真正连接数据库
const dummy = new Sequelize('postgres://localhost:5432/fake_db', {
  dialect: 'postgres',
  logging: false,
});

const models = [];
const fkList = [];

function resolveType(type) {
  const key = type && type.key;
  if (!key) return `Sequelize.${String(type)}`;
  if (key === 'ARRAY') {
    // 递归解析 ARRAY 的元素类型，避免生成 Sequelize.ARRAY（缺失元素类型定义）
    const inner = type.type;
    return `Sequelize.ARRAY(${resolveType(inner)})`;
  }
  if (key === 'STRING' || key === 'CHAR') {
    const len = type.options && type.options.length;
    return len ? `Sequelize.${key}(${len})` : `Sequelize.${key}`;
  }
  if (key === 'ENUM') {
    const vals = (type.options && type.options.values) || [];
    return `Sequelize.ENUM(${vals.map((v) => JSON.stringify(v)).join(', ')})`;
  }
  if (['DECIMAL', 'FLOAT', 'DOUBLE', 'REAL'].includes(key)) {
    const o = type.options || {};
    if (o.precision != null) return `Sequelize.${key}(${o.precision}, ${o.scale || 0})`;
    return `Sequelize.${key}`;
  }
  return `Sequelize.${key}`;
}

function resolveDefault(attr) {
  const d = attr.defaultValue;
  if (d == null) return null;
  if (d && d.constructor && d.constructor.name === 'Literal') {
    return `Sequelize.literal(${JSON.stringify(d.val)})`;
  }
  if (typeof d === 'function' || typeof d === 'object') return null;
  return JSON.stringify(d);
}

function buildColumn(field, attr) {
  const parts = [`type: ${resolveType(attr.type)}`];
  parts.push(`allowNull: ${attr.allowNull === false ? 'false' : 'true'}`);
  if (attr.primaryKey) parts.push('primaryKey: true');
  if (attr.autoIncrement) parts.push('autoIncrement: true');
  const dv = resolveDefault(attr);
  if (dv) parts.push(`defaultValue: ${dv}`);
  if (attr.comment) parts.push(`comment: ${JSON.stringify(attr.comment)}`);
  return `      ${field}: { ${parts.join(', ')} }`;
}

function buildIndexes(indexes) {
  if (!indexes || !indexes.length) return null;
  // 唯一约束统一由 add-unique-constraints.js 通过 addConstraint 生成
  // （否则 Postgres 只建索引而非可被外键引用的唯一约束），此处仅保留普通索引
  const kept = indexes.filter((idx) => {
    if (idx.name && idx.name.endsWith('_pkey')) return false;
    if (idx.unique) return false;
    return true;
  });
  if (!kept.length) return null;
  const arr = kept.map((idx) => {
    const fields = idx.fields.map((f) =>
      typeof f === 'string' ? `'${f}'` : `{ name: '${f.name}'${f.length ? `, length: ${f.length}` : ''} }`
    );
    return `      { name: '${idx.name}', unique: ${!!idx.unique}, fields: [${fields.join(', ')}] }`;
  });
  return `[\n${arr.join(',\n')}\n    ]`;
}

// 收集某张表的全部唯一约束（列级 unique 与表级 unique 索引合并，复合唯一去重），
// 用于生成 add-unique-constraints.js。这些约束必须用 addConstraint 生成，
// 才会成为 Postgres 中可被外键引用的「唯一约束」而非仅唯一索引。
function collectUniqueConstraints(attrs, indexes, tableName) {
  const map = {}; // constraintName -> Set(fields)
  for (const [field, attr] of Object.entries(attrs)) {
    if (!attr.unique) continue;
    const name = typeof attr.unique === 'string' ? attr.unique : `${tableName}_${field}_uk`;
    (map[name] = map[name] || new Set()).add(field);
  }
  if (indexes && indexes.length) {
    for (const idx of indexes) {
      if (!idx.unique || !idx.name || idx.name.endsWith('_pkey')) continue;
      const fields = (idx.fields || []).map((f) => (typeof f === 'string' ? f : f.name));
      (map[idx.name] = map[idx.name] || new Set());
      for (const f of fields) map[idx.name].add(f);
    }
  }
  return map;
}

for (const file of modelFiles) {
  const factory = require(path.join(dbModelDir, file));
  const Model = factory(dummy, Sequelize.DataTypes);
  const attrs = Model.rawAttributes;
  const tableName = Model.tableName;

  for (const [field, attr] of Object.entries(attrs)) {
    if (attr.references) {
      fkList.push({
        table: tableName,
        column: field,
        refTable: attr.references.model,
        refColumn: attr.references.key,
      });
    }
  }

  const colLines = Object.entries(attrs)
    .filter(([field]) => !['createdAt', 'updatedAt', 'deletedAt'].includes(field) || true)
    .map(([field, attr]) => buildColumn(field, attr));

  const indexes = buildIndexes(Model.options.indexes);
  const optionsBlock = indexes ? `, {\n    indexes: ${indexes}\n  }` : '';

  const content = `'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('${tableName}', {
${colLines.join(',\n')}
    }${optionsBlock});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('${tableName}');
  }
};
`;
  const uniqueConstraints = collectUniqueConstraints(attrs, Model.options.indexes, tableName);
  models.push({ tableName, content, uniqueConstraints });
}

// 生成外键迁移(放到最后执行)
const fkUp = fkList
  .map((fk) => {
    const cname = `${fk.table}_${fk.column}_fkey`;
    return `    await queryInterface.addConstraint('${fk.table}', {
      constraintName: '${cname}',
      fields: ['${fk.column}'],
      type: 'FOREIGN KEY',
      references: { table: '${fk.refTable}', field: '${fk.refColumn}' },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE',
    });`;
  })
  .join('\n');

const fkDown = fkList
  .map((fk) => {
    const cname = `${fk.table}_${fk.column}_fkey`;
    return `    await queryInterface.removeConstraint('${fk.table}', '${cname}');`;
  })
  .join('\n');

const fkContent = `'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
${fkUp}
  },

  async down(queryInterface, Sequelize) {
${fkDown}
  }
};
`;

// 生成唯一约束迁移（在建表之后、外键之前执行，确保被引用列具备唯一约束）
const uniqueUp = [];
const uniqueDown = [];
for (const m of models) {
  for (const [name, fields] of Object.entries(m.uniqueConstraints)) {
    const flds = [...fields].map((f) => `'${f}'`).join(', ');
    uniqueUp.push(`    await queryInterface.addConstraint('${m.tableName}', {
      constraintName: '${name}',
      fields: [${flds}],
      type: 'UNIQUE',
    });`);
    uniqueDown.push(`    await queryInterface.removeConstraint('${m.tableName}', '${name}');`);
  }
}
const uniqueContent = `'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
${uniqueUp.join('\n')}
  },

  async down(queryInterface, Sequelize) {
${uniqueDown.join('\n')}
  }
};
`;

if (!fs.existsSync(migrationsDir)) fs.mkdirSync(migrationsDir, { recursive: true });

// 清空历史生成的基线迁移（本工具完整拥有 migrations 目录的基线），避免重名残留
for (const f of fs.readdirSync(migrationsDir)) {
  if (f.endsWith('.js')) fs.unlinkSync(path.join(migrationsDir, f));
}

// 时间缀：建表 -> 唯一约束 -> 外键
let ts = 20240101000000;
for (const m of models) {
  ts += 1;
  const fileName = `${ts}-create-${m.tableName}.js`;
  fs.writeFileSync(path.join(migrationsDir, fileName), m.content);
  console.log(`生成迁移: ${fileName}`);
}
ts += 1;
const uniqueFileName = `${ts}-add-unique-constraints.js`;
fs.writeFileSync(path.join(migrationsDir, uniqueFileName), uniqueContent);
console.log(`生成迁移: ${uniqueFileName}`);
ts += 1;
const fkFileName = `${ts}-add-foreign-keys.js`;
fs.writeFileSync(path.join(migrationsDir, fkFileName), fkContent);
console.log(`生成迁移: ${fkFileName}`);
console.log(`共生成 ${models.length} 个建表迁移 + 1 个唯一约束迁移 + 1 个外键迁移`);
