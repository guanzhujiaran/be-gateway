/**
 * 进程退出前的最后一条通知。
 *
 * 为什么必须同步：
 *  进程即将退出，事件循环不会再等待异步 IO，axios 之类的 Promise 请求
 *  有很大概率根本发不出去。这里用 execSync + curl，宁可最多阻塞 3 秒，
 *  也要保证消息送达。
 *
 * 为什么所有异常都吞掉：
 *  通知失败绝不能让退出流程卡住，也不能改变退出码 —— 退出码本身是进程管理器
 *  判断是否需要重启的依据。
 *
 * 覆盖范围：
 *  - SIGTERM / SIGINT / uncaughtException / 启动失败（主动调用 process.exit 的路径）；
 *  - 覆盖不到 kill -9、OOM killer、宿主机失联 —— 这些由最外层 OpenResty 的
 *    日志告警规则兜底（status>=502 且 upstream_status 为空）。
 */
const { execSync } = require("child_process");
const { utils } = require("../BiliPPTR/utils/utils");

const PUSHME_URL = "https://push.i-i.me";
const CURL_TIMEOUT_SEC = 3;

/**
 * 转义 shell 单引号字符串：' -> '\''
 * @param {string} text
 * @returns {string}
 */
function escapeForSingleQuote(text) {
  return String(text).replace(/'/g, "'\\''");
}

/**
 * 同步发送退出通知。best-effort，任何失败均静默。
 * @param {string} reason 退出原因（用于标题）
 * @param {string} [detail] 详细信息（用于正文）
 * @returns {void}
 */
function notifyExit(reason, detail) {
  try {
    const sysKey =
      (utils && utils.my_send_notify && utils.my_send_notify.__push_key) || {};
    if (!sysKey.pushme) return;

    const title = `[网关退出] ${reason}`;
    const content = `时间: ${new Date().toLocaleString("zh-CN")}\n详情: ${
      detail || "-"
    }`;
    const payload = escapeForSingleQuote(
      JSON.stringify({ push_key: sysKey.pushme, title, content }),
    );

    execSync(
      `curl -s -m ${CURL_TIMEOUT_SEC} -X POST '${PUSHME_URL}' ` +
        `-H 'Content-Type: application/json' -d '${payload}'`,
      { stdio: "ignore" },
    );
  } catch (e) {
    // 退出通知是 best-effort，失败直接忽略
  }
}

module.exports = { notifyExit };
