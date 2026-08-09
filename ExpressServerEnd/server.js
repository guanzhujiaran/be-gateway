/*
 * @Author: 星瞳 1944637830@qq.com
 * @Date: 2024-12-15
 * @LastEditors: 星瞳 1944637830@qq.com
 * @LastEditTime: 2024-12-15
 * @FilePath: \BiliPPTRVerDEV\ExpressServerEnd\server.js
 * @Description: 服务器启动文件
 */

const app = require('./app');
const run_env_args = require("./config/run_arg");
const { checkUpstreamHealth } = require("./Service/upstream_health_module/upstream_health_service");

const port = run_env_args["port"] || 9923;
const hostname = "0.0.0.0";

(async () => {
    // 启动前阻塞检查上游服务
    const results = await checkUpstreamHealth();
    const failed = results.filter((r) => !r.ok);

    // 非关键服务不可用时仅警告
    const nonCriticalFailed = failed.filter(
        (r) => !r.name.includes("be-message-service")
    );
    for (const f of nonCriticalFailed) {
        console.warn(`  [⚠] ${f.name} 不可用，但不影响网关启动: ${f.reason} (${f.target})`);
    }

    // be-message 不可用时拒绝启动
    const messageFailed = failed.find((r) => r.name.includes("be-message-service"));
    if (messageFailed) {
        console.error("========================================");
        console.error("be-message-service 不可用，网关拒绝启动！");
        console.error(`  [✗] ${messageFailed.name}: ${messageFailed.reason} (${messageFailed.target})`);
        console.error("========================================");
        process.exit(1);
    }

    app.listen(port, hostname, () => {
        console.log(`Server running at http://${hostname}:${port}/`);
    });
})();