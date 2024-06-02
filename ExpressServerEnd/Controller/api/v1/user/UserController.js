const express = require("express");
const {check, validationResult} = require("express-validator");
const router = express.Router();
const cookParser = require("cookie-parser");
const {createToken} = require("@/ExpressServerEnd/Controller/Route/JwtModule");
const {UserService} = require("@/ExpressServerEnd/Service/user_module/user_service")
router.use(cookParser());


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
    async (req, resp, next) => {
        try {
            var errors = validationResult(req);
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
        check("pwd", "密码不得为空").not().isEmpty(),
        check("pwd", "密码长度不得小于8位").isLength({min: 8}),
    ],
    async (req, resp, next) => {
        try {
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
            let result_json = result.toJSON();
            return resp.json(result.toJSON())
        } catch (e) {
            next(e);
        }
    }
);

module.exports = router;
