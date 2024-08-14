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
    }
}
module.exports = {t}