/*
 * @Author: 星瞳 1944637830@qq.com
 * @Date: 2024-04-08 14:31:18
 * @LastEditors: 星瞳 1944637830@qq.com
 * @LastEditTime: 2024-05-31 12:49:39
 * @FilePath: \tampermonkey\ExpressServerEnd\ServerRun.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
const {addAliases} = require("module-alias");
addAliases({
    '@': 'K:/BiliPPTRVerDEV/',
});
const longjohn = require("longjohn");
longjohn.async_trace_limit = 1000;
Error.stackTraceLimit = 1000;
const express = require("express");
const bodyParser = require("body-parser");
const UserRouter = require('@/ExpressServerEnd/Controller/api/v1/user/UserController');
const AccountRouter = require("@/ExpressServerEnd/Controller/api/v1/account/AccountController");
const DoLotteryRouter = require("@/ExpressServerEnd/Controller/api/v1/do_lottery/DoLotteryController");
const serverAdapter = require('@/ExpressServerEnd/Controller/admin/queues');
const {jwtAuth} = require("@/ExpressServerEnd/Controller/Route/JwtModule");
const {elementAttributeModified} = require("jsdom/lib/jsdom/living/named-properties-window");

const hostname = "localhost";
const port = 9923;

const app = express();
app.use(require('cors')());// 解决跨域问题
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(jwtAuth);
app.use("/api/v1/user", UserRouter);
app.use("/api/v1/account", AccountRouter);
app.use("/api/v1/do_lottery", DoLotteryRouter);
app.use("/admin/queues", serverAdapter.getRouter())


// 错误处理中间


app.use((err, req, resp, next) => {// 错误处理中间件
    console.error(err);
    if (err.status===401) {
        let isExistPath  = app._router.stack.some(route => route && req.path.includes(route.path) )
        if (!isExistPath) {
            return resp.json({
                code: -404,
                data: null,
                msg: "不存在的路径",
                ttl: 1,
            });
        }
        return resp.json({
            code: -1,
            data: null,
            msg: "未登录",
            ttl: 1,
        });
    }
    if (!err.name) {
        let err_entries = Object.entries(err);
        return resp.json({
            code: 400,
            data: null,
            msg: `请求错误：${err_entries.map(el => el[1].msg).join(';')}`,
            ttl: 1
        })
    }
    return resp.json({
        code: 500,
        data: null,
        msg: "服务器错误",
        ttl: 1
    });
});


app.listen(port, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});
