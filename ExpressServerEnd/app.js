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
const DoLotteryRouter = require("./routes/do_lottery");
const PingRouter = require("./routes/ping");
const { bullRouter } = require("./routes/queues");
const ProxyEndPort = require("./routes/proxy");
// 导入服务
const {
  system_mq_task_manager,
} = require("./Service/background_task_module/system_mq_task_service");

const app = express();

// 上游/网络请求类错误码集合（无法连接上游、上游响应无效等）
const UPSTREAM_ERROR_CODES = new Set([
  "ECONNREFUSED", // 上游服务拒绝连接
  "ECONNRESET", // 上游连接被重置
  "ENOTFOUND", // 域名无法解析
  "EAI_AGAIN", // DNS 临时解析失败
  "EHOSTUNREACH", // 主机不可达
  "ENETUNREACH", // 网络不可达
  "EPIPE", // 管道断开
  "ECONNABORTED", // 连接被中止
  "EPROTO", // 协议错误
  "HPE_INVALID_RESPONSE", // 上游返回无效响应
  "HPE_HEADER_OVERFLOW", // 上游响应头过大
]);

/**
 * 超时 / 上游网络请求错误 -> HTTP 状态码
 * - 超时（connect-timeout / 代理 proxyTimeout）统一返回 504 Gateway Timeout
 * - 上游不可达 / 响应无效等请求错误返回 502 Bad Gateway
 * @param {Error} err
 * @returns {number|null}
 */
function mapRequestErrorToHttpStatus(err) {
  if (!err) return null;
  if (err.code === "ETIMEDOUT" || err.code === "ESOCKETTIMEDOUT") {
    return 504; // 网关等待上游超时
  }
  if (UPSTREAM_ERROR_CODES.has(err.code)) {
    return 502; // 网关从上游收到无效响应 / 无法连接上游
  }
  return null;
}

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
app.use("/api/v1/do_lottery", DoLotteryRouter);
app.use("/api/v1/ping", PingRouter);
app.use("/api/admin/queues", restrictToLocalhost, bullRouter);
app.use("", ProxyEndPort);

// 错误处理中间件
app.use((err, req, resp, next) => {
  // 响应头已发送（如代理正在流式传输），无法再改写状态码，交由底层关闭连接
  if (resp.headersSent || resp.writableEnded) {
    return next(err);
  }
  // 权限错误（业务问题：HTTP 状态码保持 200，通过 body.code 区分）
  if (err.code === "permission_denied") {
    return resp.status(200).json({
      code: RESPONSE_CODES.ERRORS.PERMISSION_DENIED.code,
      msg: RESPONSE_CODES.ERRORS.PERMISSION_DENIED.msg,
      ttl: 1,
    });
  }
  switch (err.status) {
    case 401: // 未登录（业务问题：HTTP 状态码保持 200，通过 body.code 区分）
      return resp.status(200).json({
        code: RESPONSE_CODES.ERRORS.UNAUTHORIZED.code,
        msg: RESPONSE_CODES.ERRORS.UNAUTHORIZED.msg,
        ttl: 1,
      });
    case 503: // connect-timeout 触发的响应超时
    case 504: // 上游网关超时
      return resp.status(504).json({
        code: 504,
        data: null,
        msg: `请求处理超时（${err.timeout || ""}ms），请稍后重试或联系管理员`,
        ttl: 1,
      });
  }
  // 校验错误（express-validator）：err 为 mapped 对象，无 name 字段
  // 业务问题：HTTP 状态码保持 200，通过 body.code 区分
  if (!err.name) {
    let err_entries = Object.entries(err);
    return resp.status(200).json({
      code: RESPONSE_CODES.ERRORS.INVALID_REQUEST.code,
      data: null,
      msg: `${RESPONSE_CODES.ERRORS.INVALID_REQUEST.msg}：${err_entries
        .map((el) => el[1].msg)
        .join(";")}`,
      ttl: 1,
    });
  }

  // 超时 / 上游请求错误 -> 对应的 HTTP 状态码
  const requestErrorStatus = mapRequestErrorToHttpStatus(err);
  if (requestErrorStatus) {
    return resp.status(requestErrorStatus).json({
      code: requestErrorStatus,
      data: null,
      msg: `请求上游服务失败：${err.message || err.code || "未知错误"}`,
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
  return resp.status(500).json({
    code: RESPONSE_CODES.ERRORS.UNKNOWN_ERROR.code,
    data: null,
    msg: `${RESPONSE_CODES.ERRORS.UNKNOWN_ERROR.msg}${err.message}`,
    ttl: 1,
  });
});

module.exports = app;
