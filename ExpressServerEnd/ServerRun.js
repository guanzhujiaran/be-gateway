/*
 * @Author: 星瞳 1944637830@qq.com
 * @Date: 2024-04-08 14:31:18
 * @LastEditors: 星瞳 1944637830@qq.com
 * @LastEditTime: 2024-05-31 12:49:39
 * @FilePath: \tampermonkey\ExpressServerEnd\ServerRun.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
require("module-alias/register");
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const UserRouter = require("@/ExpressServerEnd/Controller/api/v1/user/UserController");
const AccountRouter = require("@/ExpressServerEnd/Controller/api/v1/account/AccountController");
const DoLotteryRouter = require("@/ExpressServerEnd/Controller/api/v1/do_lottery/DoLotteryController");
const LotteryDatabaseBiliRouter = require("@/ExpressServerEnd/Controller/api/v1/lottery_database/bili/LotteryDatabaseBiliController");
const FeedbackCommentRouter = require("@/ExpressServerEnd/Controller/api/v1/feedback/comment/CommentController");
const FeedbackContentRouter = require("@/ExpressServerEnd/Controller/api/v1/feedback/content/ContentController");
const ProxyEndPort = require("@/ExpressServerEnd/Controller/ProxyEndPort");
const {bullRouter} = require("@/ExpressServerEnd/Controller/api/admin/queues");
const {
    jwtAuth,
} = require("@/ExpressServerEnd/Service/user_permission_module/JwtModule");
const run_env_args = require("@/ExpressServerEnd/config/run_arg");
const port = run_env_args["port"] || 9923;
const hostname = "0.0.0.0";
const app = express();
const helmet = require('helmet');
const {createGuard} = require("@/ExpressServerEnd/Service/user_permission_module/user_permission_service");
const {restrictToLocalhost} = require("@/ExpressServerEnd/MiddleWare/Limiter");
const timeout = require('connect-timeout')
const {system_mq_task_manager} = require("@/ExpressServerEnd/Service/background_task_module/system_mq_task_service");

app.use((req, res, next) => {
    const start = new Date().getTime();
    next();
    const now = new Date()
    console.log(`${now} 请求【${req.path}】【${JSON.stringify(req.body)}】【${JSON.stringify(req.query)}】耗时${now.getTime() - start}ms`);
})
app.use(timeout('15s'))
app.use(helmet({
    referrerPolicy: {
        policy: "no-referrer"
    },
}));
app.use(require("cors")()); // 解决跨域问题
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(jwtAuth);
if (run_env_args['env'] === 'dev') {
    app.use(createGuard());
}
app.use("/api/v1/user", UserRouter);
app.use("/api/v1/account", AccountRouter);
app.use("/api/v1/do_lottery", DoLotteryRouter);
app.use("/api/v1/lottery_database/bili", LotteryDatabaseBiliRouter);
app.use("/api/v1/feedback/comment", FeedbackCommentRouter);
app.use("/api/v1/feedback/content", FeedbackContentRouter);
app.use("/api/admin/queues", restrictToLocalhost, bullRouter);
app.use('', ProxyEndPort);

// 错误处理中间

app.use((err, req, resp, next) => {
    // 错误处理中间件
    // console.error(err);
    if (err.code === 'permission_denied') {
        return resp.json({
            code: -403,
            msg: "账号无权限",
            ttl: 1,
        });
    }
    switch (err.status) {
        case 401 :
            return resp.json({
                code: -101,
                msg: "账号未登录",
                ttl: 1,
            });
    }
    if (!err.name) {
        let err_entries = Object.entries(err);
        return resp.json({
            code: 400,
            data: null,
            msg: `请求错误：${err_entries.map((el) => el[1].msg).join(";")}`,
            ttl: 1,
        });
    }

    console.error(err.stack)
    if (run_env_args['env'] === 'prod') {
        system_mq_task_manager.add_system_pushme_task({
            title: 'nodejs服务器错误！',
            msg: `${req.url}\n${JSON.stringify(req.body)}\n${JSON.stringify(req.headers)}\n${err.message}\n${err.stack}`
        }).then(r => {
        })
    }
    return resp.json({
        code: 500,
        data: null,
        msg: `服务器错误喵！别尝试了，喊我修复先！${err.message}`,
        ttl: 1,
    }).status(500);

});

app.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});
