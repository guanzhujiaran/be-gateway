const express = require("express");
const { check, validationResult } = require("express-validator");
const router = express.Router();
const cookParser = require("cookie-parser");
const { UserService } = require("@/ExpressServerEnd/Service/user_module/user_service")


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
        let result = await UserService.get_user_info({ uid })
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
        check('uname', '用户名需要在2-24个字！').notEmpty({ ignore_whitespace: true }).isLength({ min: 2, max: 24 }),
        check('usersign', '签名最多支持70个字').isLength({ max: 70 }),
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

// 设置用户角色（仅系统管理员 root 可操作）
router.post('/role/set',
    [
        check('target_uid', '目标用户UID不能为空').notEmpty(),
        check('role', '角色不能为空').notEmpty(),
    ],
    async (req, resp, next) => {
        try {
            let errors = validationResult(req);
            if (!errors.isEmpty()) {
                return next(errors.mapped());
            }
            let operator_uid = req.auth.uid;
            let {
                target_uid,
                role
            } = req.body;
            let result = await UserService.set_user_role({
                operator_uid,
                target_uid,
                role
            })
            return resp.json(result.toJSON())
        } catch (e) {
            next(e);
        }
    })


// 获取当前登录用户在 Casdoor 的用户信息（如积分 score、余额等）
// 仅允许查询本人，auth_uid 固定取自 JWT 鉴权身份，不可被外部参数覆盖。
// 后端会自动从本地 token 解析用户身份，并从数据库 pwd 取回 Casdoor access_token
// 以「用户调用」模式查询；若库中无 token 则回退为后端「service 调用」模式。
router.get('/casdoor/info', async (req, resp, next) => {
    try {
        let result = await UserService.get_casdoor_user_info({
            auth_uid: req.auth.uid,
        })
        return resp.json(result.toJSON())
    } catch (e) {
        next(e);
    }
})


module.exports = router;
