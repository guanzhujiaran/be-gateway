const {rateLimit} = require('express-rate-limit');
const {redis_manager} = require('@/ExpressServerEnd/DAO/Redis/RedisManager');
const {RedisStore} = require("rate-limit-redis");
const ip = require('ip');
const create_limiter = ({windowMs, limit, ret_message}) => {
    return rateLimit({
        windowMs: windowMs, // 15 minutes
        limit: limit, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
        standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
        legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
        store: new RedisStore({
            sendCommand: (...args) => redis_manager.connection.call(...args)
        }),
        keyGenerator: (req, res) => {
            let ip_addr = req.headers['x-bili-ip'];
            if (ip.isV6Format(ip_addr)) {
                return ip_addr.split(':').splice(0, 4).join(":");
            }
            return ip_addr
        },
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