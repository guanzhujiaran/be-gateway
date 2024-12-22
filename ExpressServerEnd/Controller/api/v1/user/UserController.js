const express = require("express");
const {check, validationResult} = require("express-validator");
const router = express.Router();
const cookParser = require("cookie-parser");
const {UserService} = require("@/ExpressServerEnd/Service/user_module/user_service")
const {CryptoJS} = require("crypto-js");

const {t} = require("@/ExpressServerEnd/Tool/Utl");
const {base_api_model} = require("@/ExpressServerEnd/Model/base_model/base_model");
const {create_limiter} = require("@/ExpressServerEnd/MiddleWare");
const ip = require('ip');
const run_env_args = require("@/ExpressServerEnd/config/run_env");
const {createGuard} = require("@/ExpressServerEnd/Service/user_permission_module/user_permission_service");
const config = require("@/ExpressServerEnd/config");


router.use(cookParser());
const login_limiter = create_limiter({
    windowMs: 60 * 30e3,
    custom_radis_key: "login",
    limit: 3,
    ret_message: {code: -400, data: null, msg: "尝试次数过多，30分钟后再试"},
    skipSuccessfulRequests: true,
    skipFailedRequests: false,
    requestWasSuccessful: (req, resp) => {
        let {response_data} = resp// 如果是undefined就表示已经被拦截在处理请求之前了
        if (response_data === undefined) {
            console.debug(`请求被拦截，限制值+1，响应值为undefined！！！${response_data}`)
            return false
        }
        if (response_data.code !== 0) {
            console.debug(`请求错误，限制值+1，响应值不为0！！！${response_data}`)
            return false
        }
        console.debug(`请求成功！不增加限制值${response_data}`)
        return true
    }
})
const reg_limiter = create_limiter({
    windowMs: 30 * 1440 * 1e3,
    custom_radis_key: "reg",
    limit: 3,
    ret_message: {code: -400, data: null, msg: "30天内只能注册3次账号！！！注册那么多账号想干嘛喵！"},
    skipFailedRequests: true,
    skipSuccessfulRequests: false,
    requestWasSuccessful: (req, resp) => {
        let {response_data} = resp; // 如果是undefined就表示已经被拦截在处理请求之前了
        if (!response_data) return false
        if (response_data.code === 0) {
            console.debug(`请求成功，限制值+1，响应值不为0！！！${response_data}`)
            return true
        }
        console.debug(`请求出错，不增加限制值${response_data}`)
        return false
    }
})

router.get("/nav", async (req, resp, next) => {
    try {
        let uid = req.auth.uid;
        let result = await UserService.get_user_nav(uid)
        /**
         * @type {RootObject<UserBaseInfo|null>}
         */
        let user_info_json = result.toJSON()
        return resp.json(user_info_json)
    } catch (e) {
        next(e);
    }
});


router.post(
    "/login",
    [
        check("user_name", "用户名不得为空！").not().isEmpty(),
        check("pwd", "密码不得为空").not().isEmpty(),
    ],
    login_limiter,
    async (req, resp, next) => {
        try {
            // if (run_env_args['env'] !== 'dev') {
            //     let client_ip = t.getClientIp(req);
            //     if (!client_ip || ip.isPublic(client_ip)) {
            //         return resp.json(new base_api_model({
            //             code: 403,
            //             data: null,
            //             msg: "内部接口，禁止访问！",
            //         }))
            //     }
            // }
            let errors = validationResult(req);
            if (!errors.isEmpty()) {
                return next(errors.mapped());
            }
            let user_name = req.body.user_name;
            let pwd = req.body.pwd;
            let real_pwd = String(t.decrypt_frontend_enced_pwd(pwd))
            let result = await UserService.check_login({user_name: user_name, pwd: real_pwd,req,resp})
            /**
             * @type {RootObject<UserCredentials|null>}
             */
            let user_info_json = result.toJSON()
            resp.response_data = user_info_json;
            return resp.json(user_info_json);
        } catch (e) {
            next(e);
        }
    },
);

router.get('/pwd_salt',
    async (req, resp, next) => {
        return resp.json({
            code: 0,
            data: t.get_frontend_enc_pwd_salt(),
            msg: 'ok'
        })
    }
)

router.post(
    "/reg",
    [
        check("user_name", "用户名不得为空！").notEmpty(),
        check("user_name", "用户名长度在5-30个字符之间！").isLength({
            min: 5,
            max: 30
        }),
        check("user_name").custom((value) => {
            // if (!/^[A-Za-z0-9]+$/.test(value)) {
            //     throw new Error('密码只能包含ASCII字母和数字，且不能有空格');
            // }
            if (value.includes(" ")) {
                throw new Error("用户名不能包含空格")
            }
            return true;
        }),
        check("pwd").custom((value) => {
            // if (!/^[A-Za-z0-9]+$/.test(value)) {
            //     throw new Error('密码只能包含ASCII字母和数字，且不能有空格');
            // }
            let origin_pwd = String(t.decrypt_frontend_enced_pwd(value));
            if ((origin_pwd.length - 6) < 8 || (origin_pwd.length - 6) > 32) {
                throw new Error("密码长度不得小于8位，不得超过32位")
            }
            if (value.includes(" ")) {
                throw new Error("密码不能包含空格")
            }
            return true;
        }),
    ],
    reg_limiter, // 注册成功之后再记录ip
    async (req, resp, next) => {
        try {
            // return resp.json(new base_api_model(
            //     {
            //         code: 403,
            //         data: null,
            //         msg: "目前暂未开放！"
            //     }
            // ))
            // let client_ip = t.getClientIp(req);
            // if (!client_ip || ip.isPublic(client_ip)) {
            //     return resp.json(new base_api_model({
            //         code: 403,
            //         data: null,
            //         msg: "内部接口，禁止访问！",
            //     }))
            // }
            let errors = validationResult(req);
            if (!errors.isEmpty()) {
                return next(errors.mapped());
            }
            let user_name = req.body.user_name;
            let pwd = req.body.pwd;
            let real_pwd = String(t.decrypt_frontend_enced_pwd(pwd))
            let result = await UserService.register({user_name: user_name, pwd: real_pwd,req,resp});
            resp.response_data = result;
            return resp.json(result?.toJSON())

        } catch (e) {
            next(e);
        }
    },
);

module.exports = router;
