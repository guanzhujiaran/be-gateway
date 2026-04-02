/*
 * @Author: 星瞳 1944637830@qq.com
 * @Date: 2024-12-15
 * @LastEditors: 星瞳 1944637830@qq.com
 * @LastEditTime: 2024-12-15
 * @FilePath: \BiliPPTRVerDEV\ExpressServerEnd\app.js
 * @Description: Express应用程序主入口
 */
require("module-alias/register");
require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const cors = require("cors");
const timeout = require("connect-timeout");

// 导入配置
const run_env_args = require("./config/run_arg");
const { RESPONSE_CODES } = require("./Service/response_constants");

// 导入中间件
const { jwtAuth } = require("./Service/user_permission_module/JwtModule");
const { restrictToLocalhost } = require("./MiddleWare/Limiter");

// 导入路由
const UserRouter = require("./routes/user");
const CasdoorRouter = require("./routes/casdoor");
const AccountRouter = require("./routes/account");
const DoLotteryRouter = require("./routes/do_lottery");
const FeedbackCommentRouter = require("./routes/feedback_comment");
const FeedbackContentRouter = require("./routes/feedback_content");
const PingRouter = require("./routes/ping");
const { bullRouter } = require("./routes/queues");
const ProxyEndPort = require("./routes/proxy");

// 导入服务
const {
  system_mq_task_manager,
} = require("./Service/background_task_module/system_mq_task_service");

const port = run_env_args["port"] || 9923;
const hostname = "0.0.0.0";

const app = express();

// 开发环境请求日志中间件
if (run_env_args["env"] === "dev") {
  app.use((req, res, next) => {
    const start = new Date().getTime();
    next();
    const now = new Date();
    console.log(
      `${now} 请求【${req.path}】【${JSON.stringify(
        req.body
      )}】【${JSON.stringify(req.query)}】耗时${now.getTime() - start}ms`
    );
  });
}

// 安全中间件
app.use(timeout("30s"));
app.use(
  helmet({
    referrerPolicy: {
      policy: "no-referrer",
    },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https:", "http:"],
        fontSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'self'"],
        manifestSrc: ["'self'", "http://localhost:*", "https:"],
      },
    },
  })
);
app.use(cors()); // 解决跨域问题

// 解析中间件
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(jwtAuth);

// 路由注册
app.use("/api/v1/casdoor", CasdoorRouter);
app.use("/api/v1/user", UserRouter);
app.use("/api/v1/account", AccountRouter);
app.use("/api/v1/do_lottery", DoLotteryRouter);
app.use("/api/v1/feedback/comment", FeedbackCommentRouter);
app.use("/api/v1/feedback/content", FeedbackContentRouter);
app.use("/api/v1/ping", PingRouter);
app.use("/api/admin/queues", restrictToLocalhost, bullRouter);
app.use("", ProxyEndPort);

// 错误处理中间件
app.use((err, req, resp, next) => {
  // 错误处理中间件
  if (err.code === "permission_denied") {
    return resp.json({
      code: RESPONSE_CODES.ERRORS.PERMISSION_DENIED.code,
      msg: RESPONSE_CODES.ERRORS.PERMISSION_DENIED.msg,
      ttl: 1,
    });
  }
  switch (err.status) {
    case 401:
      return resp.json({
        code: RESPONSE_CODES.ERRORS.UNAUTHORIZED.code,
        msg: RESPONSE_CODES.ERRORS.UNAUTHORIZED.msg,
        ttl: 1,
      });
  }
  if (!err.name) {
    let err_entries = Object.entries(err);
    return resp.json({
      code: RESPONSE_CODES.ERRORS.INVALID_REQUEST.code,
      data: null,
      msg: `${RESPONSE_CODES.ERRORS.INVALID_REQUEST.msg}：${err_entries
        .map((el) => el[1].msg)
        .join(";")}`,
      ttl: 1,
    });
  }

  console.error(err.stack);
  if (run_env_args["env"] === "prod") {
    system_mq_task_manager
      .add_system_pushme_task({
        title: "nodejs服务器错误！",
        msg: `${req.url}
${JSON.stringify(req.body)}
${JSON.stringify(req.headers)}
${err.message}
${err.stack}`,
      })
      .then((r) => { });
  }
  return resp
    .json({
      code: RESPONSE_CODES.ERRORS.UNKNOWN_ERROR.code,
      data: null,
      msg: `${RESPONSE_CODES.ERRORS.UNKNOWN_ERROR.msg}${err.message}`,
      ttl: 1,
    })
    .status(500);
});

module.exports = app;
