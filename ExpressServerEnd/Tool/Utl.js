const GenId = require('@/ExpressServerEnd/Tool/SnowFlakeGen')
const config = require("@/ExpressServerEnd/config/index");
const CryptoJS = require("crypto-js");
const SHA256 = require("crypto-js/sha256");
const axios = require("axios");
const run_env_args = require("@/ExpressServerEnd/config/run_arg");
const ip = require("ip");
const t = {
    deepMergeIfMissing: (target, source) => {
        for (let key in source) {
            if (source.hasOwnProperty(key)) {
                // 检查属性是否为对象（非数组）
                if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    // 如果目标对象中没有该属性或该属性不是对象，则创建一个新的空对象
                    if (!target.hasOwnProperty(key) || typeof target[key] !== 'object') {
                        target[key] = {};
                    }
                    // 递归调用
                    t.deepMergeIfMissing(target[key], source[key]);
                } else {
                    // 如果目标对象中没有该属性，则从源对象中复制
                    if (!target.hasOwnProperty(key)) {
                        target[key] = source[key];
                    }
                }
            }
        }
        return target;
    },
    getClientIp: (req) => {
        return req.headers['x-bili-ip'];
    },
    comment_rpid_snowflake_gen: new GenId({
        WorkerId: config?.common_config?.snow_flake_worker_id ?? 1,
        BaseTime: 1732849832635,
        SeqBitLength: 3,
        TopOverCostCount: 100
    }),
    personalized_content_type1_gen: new GenId({
        WorkerId: config?.common_config?.snow_flake_worker_id ?? 1,
        BaseTime: 1732849832635,
        SeqBitLength: 4,
        TopOverCostCount: 200
    }),
    // 用户 mid 生成器（雪花漂移算法）：替代原来的数据库自增。
    // 需求：初始数值与步进都特别小 —— 相比评论 rpid（shift=9，约 17 位数）小约 5 个数量级。
    //   · WorkerIdBitLength=1：机器码仅占 1 位（worker id 只能取 0/1，与 config.snow_flake_worker_id 对齐），
    //     若未来需要多实例并发生成 mid，请调大此值（会使 mid 变大）。
    //   · SeqBitLength=3：序列位取算法允许的最小值 3（每毫秒每机器可生成 3 个：seq 5~7）。
    //   · 时间戳左移位数 = WorkerIdBitLength + SeqBitLength = 4，即每毫秒 mid 仅递增 16（步进极小）。
    // BaseTime 沿用项目既有的过去基准时间，保证时间差恒为正、且生成值远大于历史自增 uid，避免主键冲突。
    // 生成结果恒为普通 Number（远小于 2^53），可安全写入 BIGINT 主键。
    user_mid_snowflake_gen: new GenId({
        WorkerId: config?.common_config?.snow_flake_worker_id ?? 1,
        BaseTime: 1732849832635,
        WorkerIdBitLength: 1,
        SeqBitLength: 3,
        TopOverCostCount: 50
    }),
    now_s: () => {
        return Math.round(Date.now() / 1e3)
    },
    now_ms: () => {
        return Date.now()
    },
    delete_attr_from_obj: (obj, delete_attr = ['createdAt', 'updatedAt', 'deletedAt']) => {
        delete_attr.map(attr => delete obj[attr])
    },
    /**
     *
     * @param title {string}
     * @param msg {string}
     * @return {Promise<void>}
     */
    push_plus: async ({title, msg}) => {
        title = title.slice(0, 200)
        let resp = await axios.post("http://www.pushplus.plus/send", {
            token: config.common_config.keys.system_pushplus_key,
            title: title,
            content: msg,
            template: "txt",
        });
        if (resp.data.code !== 200) {
            console.error(
                `推送${(title + msg)}失败！原因：${JSON.stringify(
                    resp.data
                )}`
            );
        }
    },
    renameKeys: (obj, keyMap) => {
        // 辅助函数：用于递归处理对象或数组中的每个元素
        const recursiveRename = currentObj => {
            if (Array.isArray(currentObj)) {
                // 如果当前元素是数组，则递归处理数组中的每个元素
                return currentObj.map(item =>
                    item && typeof item === 'object' ? recursiveRename(item) : item
                );
            } else if (currentObj !== null && typeof currentObj === 'object') {
                // 如果当前元素是对象，则创建新对象并应用映射规则
                return Object.entries(currentObj).reduce((newObj, [oldKey, value]) => {
                    const newKey = keyMap[oldKey] || oldKey; // 应用映射规则，如果没有匹配则保持原名
                    newObj[newKey] = recursiveRename(value); // 递归处理子对象或数组
                    return newObj;
                }, {});
            }
            // 如果不是对象也不是数组，直接返回原始值
            return currentObj;
        };

        // 调用辅助函数处理传入的对象
        return recursiveRename(obj);
    },
    /**
     * 对邮箱地址进行脱敏：保留 @ 前部分的「前 3 位」与完整域名，中间用 * 填充。
     * 例如：1944637830@qq.com -> 194*****qq.com
     * @param {string} email
     * @return {string}
     */
    mask_email: (email) => {
        if (!email || typeof email !== 'string' || !email.includes('@')) {
            return email || '';
        }
        const [local, domain] = email.split('@');
        if (local.length <= 3) {
            return `${local.slice(0, 1)}***${domain}`;
        }
        // 保留前 3 位，去掉尾部 2 位，中间用 * 填充（至少 3 个）
        const starCount = Math.max(3, local.length - 5);
        return `${local.slice(0, 3)}${'*'.repeat(starCount)}${domain}`;
    }
    //endregion
}
const req_tool = {
    get_ip: (req, res) => {
        // 统一返回真实 IP：优先取 x-bili-ip 头，回退到 socket 真实地址（兼容反代未透传头的情况）。
        // dev 环境不再强制 127.0.0.1，确保所有环境记录到真实来源 IP。
        let ip_addr = req?.headers?.['x-bili-ip']
            || (req?.socket?.remoteAddress)
            || (req?.connection?.remoteAddress)
            || '';
        // 去掉 IPv6 映射的 IPv4 前缀（::ffff:1.2.3.4 -> 1.2.3.4）
        if (ip_addr.startsWith('::ffff:')) {
            ip_addr = ip_addr.slice('::ffff:'.length);
        }
        if (ip.isV6Format(ip_addr)) {
            return ip_addr.split(':').splice(0, 4).join(":");
        }
        return ip_addr
    },
    get_ua: (req, res) => {
        return req.headers['user-agent']
    },
    get_headers: (req, res) => {
        return req.headers
    }
}
module.exports = {t, req_tool}