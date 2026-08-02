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
        if (run_env_args['env'] === 'dev') return '127.0.0.1'
        let ip_addr = req.headers['x-bili-ip'];
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