const {rateLimit} = require('express-rate-limit');
const {redis_manager} = require('@/ExpressServerEnd/DAO/Redis/RedisManager');
const {RedisStore} = require("rate-limit-redis");
const ip = require('ip');
const run_env_args = require("@/ExpressServerEnd/config/run_env");
const {req_tool} = require("@/ExpressServerEnd/Tool/Utl");
/**
 *
 * @param custom_radis_key
 * @param windowMs
 * @param limit
 * @param ret_message
 * @param skip 返回true就不记录，返回false就记录下这次访问
 * @param requestWasSuccessful
 * @param skipSuccessfulRequests
 * @param skipFailedRequests
 * @return {RateLimitRequestHandler}
 */
const create_limiter = ({
                            custom_radis_key,
                            windowMs,
                            limit,
                            ret_message,
                            skip,
                            requestWasSuccessful,
                            skipSuccessfulRequests,
                            skipFailedRequests,
                        }) => {
    return rateLimit({
        windowMs: windowMs, // 15 minutes
        limit: limit, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
        standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
        legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
        store: new RedisStore({
            sendCommand: (...args) => redis_manager.connection.call(...args),
            windowMs: windowMs,
            prefix: `limiter:${custom_radis_key}:`
        }),
        keyGenerator: (req, res) => {
            return req_tool.get_ip(req, res)
        },
        skip: typeof skip === 'function' ? skip : undefined,
        skipSuccessfulRequests: skipSuccessfulRequests === undefined ? false : skipSuccessfulRequests,
        skipFailedRequests: skipFailedRequests === undefined ? false : skipFailedRequests,
        requestWasSuccessful: typeof requestWasSuccessful === 'function' ? requestWasSuccessful : undefined,
        message: ret_message,
        statusCode: 200,
    })
}

function restrictToLocalhost(req, res, next) {
    let ip_addr = req.headers['x-bili-ip'];
    if (ip.isPrivate(ip_addr ?? "")) {
        next();
    } else {
        return res.json({
            code: -403,
            msg: "非本地连接无权限访问",
            ttl: 1,
        });
    }
}

module.exports = {
    create_limiter,
    restrictToLocalhost
}