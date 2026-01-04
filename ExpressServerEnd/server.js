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

const port = run_env_args["port"] || 9923;
const hostname = "0.0.0.0";

app.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});