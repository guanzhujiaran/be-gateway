const express = require("express");
const {check, validationResult} = require("express-validator");
const router = express.Router();
const cookParser = require("cookie-parser");
const {UserService} = require("@/ExpressServerEnd/Service/user_module/user_service")
const {t} = require("@/ExpressServerEnd/Tool/Utl");
const {base_api_model} = require("@/ExpressServerEnd/Model/base_model/base_model");
const {create_limiter} = require("@/ExpressServerEnd/MiddleWare");
const ip = require('ip');
const run_env_args = require("@/ExpressServerEnd/config/run_env");
const {createGuard} = require("@/ExpressServerEnd/Service/user_permission_module/user_permission_service");

router.use(cookParser());
const login_limiter = create_limiter({
    windowMs: 60 * 1e3,
    limit: 3,
    ret_message: {code: -400, data: null, msg: "尝试次数过多，1分钟后再试"}
})
const reg_limiter = create_limiter({
    windowMs: 30 * 1440 * 1e3,
    limit: 3,
    ret_message: {code: -400, data: null, msg: "30天内只能注册3次账号！！！注册那么多账号想干嘛喵！"}
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
            if (run_env_args['env'] !== 'dev') {
                let client_ip = t.getClientIp(req);
                if (!client_ip || ip.isPublic(client_ip)) {
                    return resp.json(new base_api_model({
                        code: 403,
                        data: null,
                        msg: "内部接口，禁止访问！",
                    }))
                }
            }
            let errors = validationResult(req);
            if (!errors.isEmpty()) {
                return next(errors.mapped());
            }
            let user_name = req.body.user_name;
            let pwd = req.body.pwd;
            let result = await UserService.check_login({user_name: user_name, pwd: pwd})
            /**
             * @type {RootObject<UserCredentials|null>}
             */
            let user_info_json = result.toJSON()
            return resp.json(user_info_json);
        } catch (e) {
            next(e);
        }
    }
);

router.post(
    "/reg",
    [
        check("user_name", "用户名不得为空！").not().isEmpty(),
        check("user_name").custom((value) => {
            // if (!/^[A-Za-z0-9]+$/.test(value)) {
            //     throw new Error('密码只能包含ASCII字母和数字，且不能有空格');
            // }
            if (value.includes(" ")) {
                throw new Error("用户名不能包含空格")
            }
            return true;
        }),
        check("pwd", "密码不得为空").not().isEmpty(),
        check("pwd", "密码长度不得小于8位，不得超过32位").isLength({min: 8, max: 32}),
        check("pwd").custom((value) => {
            // if (!/^[A-Za-z0-9]+$/.test(value)) {
            //     throw new Error('密码只能包含ASCII字母和数字，且不能有空格');
            // }
            if (value.includes(" ")) {
                throw new Error("密码不能包含空格")
            }
            return true;
        }),
    ],
    reg_limiter,
    async (req, resp, next) => {
        try {
            return resp.json(new base_api_model(
                {
                    code: 403,
                    data: null,
                    msg: "目前暂未开放！"
                }
            ))
            let client_ip = t.getClientIp(req);
            if (!client_ip || ip.isPublic(client_ip)) {
                return resp.json(new base_api_model({
                    code: 403,
                    data: null,
                    msg: "内部接口，禁止访问！",
                }))
            }
            var errors = validationResult(req);
            if (!errors.isEmpty()) {
                return next(errors.mapped());
            }

            let user_name = req.body.user_name;
            let pwd = req.body.pwd;

            let result = await UserService.register({user_name: user_name, pwd: pwd})
            /**
             *
             * @type {RootObject<null>}
             */
            return resp.json(result?.toJSON())
        } catch (e) {
            next(e);
        }
    }
);

module.exports = router;
