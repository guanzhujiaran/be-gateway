const express = require("express");
const {
    body,
    query, validationResult, oneOf,
} = require("express-validator");
const router = express.Router();
const cookParser = require("cookie-parser");
const {AccountService} = require("@/ExpressServerEnd/Service/account_module/account_service");
const {task_manager} = require("@/ExpressServerEnd/Service/background_task_module/task_manager_service");
router.use(cookParser());

//region 获取所有账号列表
router.get("/all_accounts",
    /**
     *
     * @param req
     * @param resp
     * @param next
     * @return {RootObject<Array.<UserAccount>>}
     */
    async (req, resp, next) => {
        try {
            let uid = req.auth.uid;
            let result = await AccountService.get_all_account_info_by_uid(uid)
            /**
             * @type {RootObject<Array.<UserAccount>>}
             */
            let all_account_info_json = result.toJSON()
            return resp.json(all_account_info_json)
        } catch (e) {
            next(e);
        }
    });
//endregion

//region 添加账号
router.post(
    "/add_account",
    [body("account_name").notEmpty().withMessage("账号名不能为空")],
    /**
     *
     * @param req
     * @param resp
     * @param next
     * @return {Promise<RootObject<UserAccount|null>>}
     */
    async (req, resp, next) => {
        try {
            var errors = validationResult(req);
            if (!errors.isEmpty()) {
                return next(errors.mapped());
            }
            let uid = req.auth.uid;
            let account_name = req.body.account_name;
            let result = await AccountService.add_account(account_name, uid);
            /**
             * @type {RootObject<UserAccount|null>}
             */
            let result_json = result.toJSON()
            return resp.json(result_json)
        } catch (e) {
            next(e);
        }
    }
);
//endregion

//region 获取账号信息
router.get(
    "/get_account_info",
    oneOf([
            query("account_name").notEmpty(),
            query("account_id").notEmpty()
        ], {
            message: "账号名或账号id不能为空"
        },
    )
    ,
    /**
     *
     * @param {*} req
     * @param {*} resp
     * @param {*} next
     * @returns {Promise<RootObject<UserAccount>>} { "account_name": "cookie1", "account_id": 1, "uid": "1", "info": { "level": 6, "vip": "十年大会员", "face": null, "uname": "后藤波奇" } }
     */
    async (req, resp, next) => {
        try {
            var errors = validationResult(req);
            if (!errors.isEmpty()) {
                return next(errors.mapped());
            }
            let uid = req.auth.uid;
            let account_name = req.query.account_name;
            let account_id = req.query.account_id;

            let result = await AccountService.get_account_info(uid, {
                account_name: account_name,
                account_id: account_id
            });
            /**
             * @type {UserAccount}
             */
            let result_json = result.toJSON()
            return resp.json(result_json)
        } catch (e) {
            next(e);
        }
    }
);
//endregion

//region 获取账号设置
router.get(
    "/get_account_setting",
        query("account_name").notEmpty().withMessage("账号名称不能为空")
    ,
    async (req, resp, next) => {
        try {
            var errors = validationResult(req);
            if (!errors.isEmpty()) {
                return next(errors.mapped());
            }
            let uid = req.auth.uid;
            let account_name = req.query.account_name;

            let result = await AccountService.get_lottery_setting_by_account_name_and_uid(account_name,uid);
            /**
             * @type {UserAccount}
             */
            let result_json = result.toJSON()
            return resp.json(result_json)
        } catch (e) {
            next(e);
        }
    }
);
//endregion
//region 保存账号设置
router.post(
    "/save_account_setting",
        body("account_name").notEmpty(),
        body('settings').notEmpty(),
    async (req, resp, next) => {
        try {
            var errors = validationResult(req);
            if (!errors.isEmpty()) {
                return next(errors.mapped());
            }
            let uid = req.auth.uid;
            let account_name = req.body.account_name;
            let settings = req.body.settings
            let result = await AccountService.save_lottery_setting_by_account_name_and_uid(account_name,uid,settings);
            /**
             * @type {UserAccount}
             */
            let result_json = result.toJSON()
            return resp.json(result_json)
        } catch (e) {
            next(e);
        }
    }
);
//endregion

//region 保存账号设置
router.get(
    "/get_account_running_status",
        query("account_name").notEmpty(),
    async (req, resp, next) => {
        try {
            var errors = validationResult(req);
            if (!errors.isEmpty()) {
                return next(errors.mapped());
            }
            let uid = req.auth.uid;
            let account_name = req.query.account_name;
            let result = await task_manager.get_account_running_status(uid,account_name)
            /**
             * @type {UserAccount}
             */
            let result_json = result.toJSON()
            return resp.json(result_json)
        } catch (e) {
            next(e);
        }
    }
);
//endregion



module.exports = router;
