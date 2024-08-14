/**
 * @typedef {Object} AccountInfo
 * @property {number} level - 账户等级
 * @property {string} vip - 账户会员信息
 * @property {string|null} face - 账户头像，如果有的话
 * @property {string} uname - 账户名
 * @property {string} uid - 账户b站uid
 * @property {AccountLotterySettingModel} settings - 账户的设置
 */

/**
 * @typedef {Object} UserAccount
 * @property {string} account_name - 账户名
 * @property {number} account_id - 账户ID
 * @property {number} uid - 用户ID
 * @property {AccountInfo?} info - 用户信息
 */