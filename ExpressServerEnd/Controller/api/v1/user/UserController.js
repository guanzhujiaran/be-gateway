const express = require("express");
const {check, validationResult} = require("express-validator");
const router = express.Router();
const cookParser = require("cookie-parser");
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

router.get('/user_info', async (req, resp, next) => {
    try {
        let uid = req.auth.uid;
        /**
         * @type {RootObject<UserBaseInfo|null>}
         */
        let result = await UserService.get_user_info({uid})
        return resp.json(result.toJSON())
    } catch (e) {
        next(e);
    }
})
router.post('/refresh_token', async (req, resp, next) => {
    try {
        let uid = req.auth.uid;
        /**
         * @type {RootObject<UserBaseInfo|null>}
         */
        let result = await UserService.refresh_token({
            uid,
            req,
            resp
        })
        return resp.json(result.toJSON())
    } catch (e) {
        next(e);
    }
})

router.post('/logout', async (req, resp, next) => {
    try {
        let result = await UserService.logout({
            req,
            resp
        })
        return resp.json(result.toJSON())
    } catch (e) {
        next(e);
    }
})
router.post('/user_info/update',
    [
        check('uname', '用户名需要在2-24个字！').notEmpty({ignore_whitespace: true}).isLength({min: 2, max: 24}),
        check('usersign', '签名最多支持70个字').isLength({max: 70}),
        check('sex', '性别不正确！').isIn(['男', '女', '保密', '武装直升机', '永雏塔菲']),
        check("birthday", "生日必须是日期").isDate(),
    ],
    async (req, resp, next) => {
        try {
            let errors = validationResult(req);
            if (!errors.isEmpty()) {
                return next(errors.mapped());
            }
            let uid = req.auth.uid;
            /**
             * @type {RootObject<UserBaseInfo|null>}
             */
            let {
                uname,
                usersign,
                sex,
                birthday
            } = req.body;
            let result = await UserService.set_user_info({
                uid,
                uname,
                usersign,
                sex,
                birthday
            })
            return resp.json(result.toJSON())
        } catch (e) {
            next(e);
        }
    })


module.exports = router;
