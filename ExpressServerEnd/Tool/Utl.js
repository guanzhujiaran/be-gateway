const GenId = require('@/ExpressServerEnd/Tool/SnowFlakeGen')
const config = require("@/ExpressServerEnd/config/index");
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
    personalized_content_type1_gen:new GenId({
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

}
module.exports = {t}