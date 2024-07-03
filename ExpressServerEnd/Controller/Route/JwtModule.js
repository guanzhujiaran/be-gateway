/*
 * @Author: 星瞳 1944637830@qq.com
 * @Date: 2024-04-08 17:30:39
 * @LastEditors: 星瞳 1944637830@qq.com
 * @LastEditTime: 2024-05-31 22:11:00
 * @FilePath: \tampermonkey\ExpressServerEnd\RouteModules\JwtModule.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
//用一个单独模块来放生成token和验证token的方法，方便后面调用。
const md5 = require("md5");
const secretKey = "关注永雏塔菲喵，关注永雏塔菲谢谢喵！114514"
const jwt = require("jsonwebtoken");
const expressJwt = require("express-jwt");
//生成 token
/**
 *
 * @param payload {Object}
 * @param payload.user_name {string}
 * @param payload.uid {number}
 * @return {string}
 */
const createToken = (payload) =>
    jwt.sign(payload, secretKey, {
        expiresIn: 15 * 24 * 3600, // 设置token的有效期 单位（秒）
        algorithm: "HS256"
    });

// 验证 token
const jwtAuth = expressJwt
    .expressjwt({
        secret: secretKey,
        algorithms: ["HS256"],
        credentialsRequired: true, //  false：不校验
    })
    .unless({
        path: [
            "/api/v1/user/login",
            "/api/v1/user/reg",
            "/admin/queues",
            {url:/\/admin\/queues\/.*/}
        ], //不需要校验的路径
    });
module.exports = {jwtAuth, createToken};
