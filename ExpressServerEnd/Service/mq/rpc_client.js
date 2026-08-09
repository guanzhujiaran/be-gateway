/**
 * pptr 用户 RPC 客户端（amqplib）。
 *
 * be-message-service 作为 RPC 服务端（FastStream @broker.rpc），本模块通过
 * topic exchange `message` + routing_key `message.pptr.rpc.<method>` 调用，
 * 并使用 direct reply-to（amq.rabbitmq.reply-to）收取响应。
 *
 * pptr 侧用户读写全部走这里，不再维护本地 sequelize 用户表（TUserInfo 等）。
 *
 * 超时 / 连接失败等「通信异常」语义约定：
 *   - callRpc 在超时或底层连接异常时会直接 reject（抛出 RpcTimeoutError /
 *     RpcTransportError），错误必须向上传播，【绝不能】被当作「查无此人」处理。
 *   - 只有服务端正常返回 { code: 0, data: null } 才视为「用户不存在 / 查无此人」，
 *     这属于正常的业务成功响应，不会抛错。
 *   - 调用方若需区分二者，可捕获 err 并判断 err.isRpcTimeout / err.isRpcTransport。
 */

const amqp = require('amqplib');
const crypto = require('crypto');
const config = require('../../config');

const ROUTING_PREFIX = 'message.pptr.rpc';
const EXCHANGE = 'message_exchange'; // 与 be-message 服务端 broker.py 中的 message_exchange 一致

let _channel = null;
let _consuming = false;
let _initPromise = null; // 防止并发首次调用重复建连造成「reply consumer already set」
const _pending = new Map(); // correlationId -> { resolve, reject, timer }

function _newCorrId() {
    return crypto.randomBytes(16).toString('hex');
}

async function _ensure() {
    if (_channel && _consuming) return _channel;
    if (_initPromise) return _initPromise; // 并发调用复用同一次建连

    _initPromise = (async () => {
        const conn = await amqp.connect(config.mq_config.rabbitmq_url);
        const ch = await conn.createChannel();
        await ch.assertExchange(EXCHANGE, 'topic', { durable: true });

        // direct reply-to：服务端会把响应发回这个虚拟队列（同一 channel 只能消费一次）
        await ch.consume(
            'amq.rabbitmq.reply-to',
            (msg) => {
                if (!msg) return;
                const cid = msg.properties.correlationId;
                const handler = _pending.get(cid);
                if (!handler) return;
                clearTimeout(handler.timer);
                _pending.delete(cid);
                try {
                    const payload = JSON.parse(msg.content.toString('utf8'));
                    handler.resolve(payload);
                } catch (e) {
                    handler.reject(e);
                }
            },
            { noAck: true, exclusive: true }
        );

        // 断连/出错时重置状态，下次调用重新建连；并吞掉未捕获 error 避免进程崩溃
        const _reset = () => {
            _consuming = false;
            _channel = null;
            _initPromise = null;
        };
        ch.on('close', _reset);
        ch.on('error', () => {});
        conn.on('error', _reset);

        _consuming = true;
        _channel = ch;
        return ch;
    })();

    try {
        return await _initPromise;
    } catch (e) {
        _initPromise = null; // 建连失败则允许下次重试
        throw e;
    }
}

/**
 * 调用一次 pptr 用户 RPC。
 * @param {string} methodName 方法名（get_user_info / get_user_card / create_user）
 * @param {object} params 请求参数
 * @returns {Promise<object>} 服务端返回的 StandardResponse（{ code, msg, data }）
 */
class RpcTimeoutError extends Error {
    constructor(methodName, timeoutMs) {
        super(`pptr RPC 超时: ${methodName} (${timeoutMs}ms)`);
        this.name = 'RpcTimeoutError';
        this.isRpcTimeout = true;
        this.methodName = methodName;
        this.timeoutMs = timeoutMs;
    }
}

class RpcTransportError extends Error {
    constructor(cause) {
        super(`pptr RPC 通信异常: ${cause && cause.message ? cause.message : cause}`);
        this.name = 'RpcTransportError';
        this.isRpcTransport = true;
        this.cause = cause;
    }
}

/**
 * 调用一次 pptr 用户 RPC。
 * @param {string} methodName 方法名（get_user_info / get_user_card / create_user）
 * @param {object} params 请求参数
 * @returns {Promise<object>} 服务端返回的 StandardResponse（{ code, msg, data }）
 * @throws {RpcTimeoutError} 超时（绝不按查无此人处理，必须向上抛出）
 * @throws {RpcTransportError} 连接 / 通信异常（必须向上抛出）
 */
async function callRpc(methodName, params) {
    let ch;
    try {
        ch = await _ensure();
    } catch (e) {
        // 连接建立失败属于通信异常，直接抛出，不按查无此人处理
        throw new RpcTransportError(e);
    }

    const routingKey = `${ROUTING_PREFIX}.${methodName}`;
    const corrId = _newCorrId();
    const timeoutMs = config.mq_config.rpc_timeout_ms || 5000;

    const body = Buffer.from(JSON.stringify(params || {}));

    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            _pending.delete(corrId);
            // 超时：明确抛出 RpcTimeoutError，调用方必须抛出，不得按查无此人处理
            reject(new RpcTimeoutError(methodName, timeoutMs));
        }, timeoutMs);
        _pending.set(corrId, { resolve, reject, timer });

        try {
            ch.publish(EXCHANGE, routingKey, body, {
                replyTo: 'amq.rabbitmq.reply-to',
                correlationId: corrId,
                contentType: 'application/json',
                contentEncoding: 'utf-8',
                expiration: String(timeoutMs),
            });
        } catch (e) {
            clearTimeout(timer);
            _pending.delete(corrId);
            // publish 失败属于通信异常，直接抛出
            reject(new RpcTransportError(e));
        }
    });
}

module.exports = {
    callRpc,
    ROUTING_PREFIX,
    RpcTimeoutError,
    RpcTransportError,
};
