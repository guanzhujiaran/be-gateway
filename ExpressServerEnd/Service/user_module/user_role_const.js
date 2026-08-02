/**
 * 用户角色（role）常量与描述定义
 *
 * 角色分为两个维度：
 *  1. 成长等级角色 level0 ~ level6：随用户经验值（升级）自动设置，代表用户在社区中的活跃度/贡献度。
 *  2. 管理员 root：代表拥有系统最高权限的管理员，只能由已有的 root 用户手动赋予，不会随升级自动获得。
 *
 * 注意：root 是独立于等级体系的特殊角色，升级逻辑在同步等级角色时不会覆盖 root。
 */

// 管理员角色标识
const ROLE_ROOT = 'root';

// 由纯数字等级（0~6）生成对应的成长等级角色字符串
function levelToRole(level) {
  const lv = Number(level);
  if (lv >= 0 && lv <= 6) {
    return `level${lv}`;
  }
  return 'level0';
}

// 判断某个 role 是否为管理员
function isRoot(role) {
  return String(role) === ROLE_ROOT;
}

// 所有合法的角色值列表（供校验使用）
const VALID_ROLES = [
  'level0',
  'level1',
  'level2',
  'level3',
  'level4',
  'level5',
  'level6',
  ROLE_ROOT,
];

/**
 * 各角色的具体描述
 * level0 ~ level6：随升级自动设置，等级越高代表用户在社区中的贡献/活跃度越高，对应可解锁的能力也不同。
 * root：系统管理员，拥有最高权限，只能由已有 root 手动赋予。
 */
const ROLE_DESCRIPTIONS = {
  level0: {
    level: 0,
    name: '新手上路',
    description: '刚注册或经验值极少的用户，仅拥有基础浏览与使用权限。',
  },
  level1: {
    level: 1,
    name: '初级用户',
    description: '已有一定活跃度的用户，可参与基础的社区互动。',
  },
  level2: {
    level: 2,
    name: '进阶用户',
    description: '持续活跃的用户，可解锁更多社区功能与个性化配置。',
  },
  level3: {
    level: 3,
    name: '活跃用户',
    description: '活跃度较高的用户，享有更高的互动权重与部分高级功能。',
  },
  level4: {
    level: 4,
    name: '核心用户',
    description: '社区核心成员，可参与内容管理与活动运营相关功能。',
  },
  level5: {
    level: 5,
    name: '资深用户',
    description: '资深贡献者，拥有接近管理员的多数操作权限。',
  },
  level6: {
    level: 6,
    name: '荣誉用户',
    description: '社区荣誉用户，达到最高成长等级，享有最高等级的非管理权限。',
  },
  root: {
    level: 99,
    name: '系统管理员',
    description: '系统最高权限管理员，可管理用户、赋予他人管理员权限、配置系统设置等。仅能由已有管理员手动授予。',
  },
};

/**
 * 根据 role 字符串获取其描述信息，找不到时回退到 level0
 * @param {string} role
 * @returns {{level:number,name:string,description:string}}
 */
function getRoleDescription(role) {
  return ROLE_DESCRIPTIONS[role] || ROLE_DESCRIPTIONS.level0;
}

module.exports = {
  ROLE_ROOT,
  ROLE_DESCRIPTIONS,
  VALID_ROLES,
  levelToRole,
  isRoot,
  getRoleDescription,
};
