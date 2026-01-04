/*
 * @Author: 星瞳 1944637830@qq.com
 * @Date: 2024-04-08 17:30:39
 * @LastEditors: 星瞳 1944637830@qq.com
 * @LastEditTime: 2024-05-31 22:11:00
 * @FilePath: \tampermonkey\ExpressServerEnd\RouteModules\JwtModule.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
//用一个单独模块来放生成token和验证token的方法，方便后面调用。
const config = require('@/ExpressServerEnd/config');
const secretKey = config.common_config.salt.jwt_secret;
const jwt = require("jsonwebtoken");
const expressJwt = require("express-jwt");
const {user_redis_dao} = require("@/ExpressServerEnd/DAO/UserRedisDao");
const on_expired = async (req, err) => {
    throw (err);
};
const is_revoked = async (req, token) => {
    return !!(await user_redis_dao.is_jwt_signature_in_black_list({signature: token.signature}));
}
//生成 token
/**
 *
 * @param payload {Object}
 * @param payload.uid {number}
 * @param payload.level {string} - 角色：0,1,2,3,4,5,6 还有一个超级root
 * @return {string}
 */
const createToken = (payload) =>
    jwt.sign(payload, secretKey, {
        expiresIn: 15 * 24 * 3600, // 设置token的有效期 单位（秒）
        algorithm: "HS256",
    });

// 验证 token
const jwtAuth = expressJwt
    .expressjwt({
        secret: secretKey,
        algorithms: ["HS256"],
        credentialsRequired: true, //  false：不校验
        onExpired: on_expired,
        isRevoked: is_revoked
    })
    .unless({
        path: [
            "/api/v1/user/login",
            "/api/v1/user/reg",
            "/api/v1/user/pwd_salt",
            "/api/v1/casdoor/login",
            "/api/v1/casdoor/callback",
            "/api/v1/casdoor/status",
            "/api/admin/queues",
            {url: /api\/v1\/lottery_database\/bili\/.*/},
            {url: /api\/admin\/queues\/.*/},
            {url: /api\/v1\/feedback\/comment\/reply\/main/},
            {url: /api\/v1\/feedback\/comment\/reply\/reply/},
            {url: /api\/v1\/samsClub\/.*/}
        ], //不需要校验的路径
    });

const jwtAuthGenerator = ({
                              credentialsRequired = true
                          }) => {
    return expressJwt
        .expressjwt({
            secret: secretKey,
            algorithms: ["HS256"],
            credentialsRequired: credentialsRequired, //  false：不校验
            onExpired: on_expired,
            isRevoked: is_revoked
        })
}


module.exports = {jwtAuth, createToken, jwtAuthGenerator};
