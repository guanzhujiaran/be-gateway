/*
 * @Author: 星瞳 1944637830@qq.com
 * @Date: 2024-04-08 20:02:08
 * @LastEditors: 星瞳 1944637830@qq.com
 * @LastEditTime: 2024-05-31 12:20:40
 * @FilePath: \tampermonkey\ExpressServerEnd\RouteModules\AccountModule.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
const express = require("express");
const {
    body,
    query, validationResult, oneOf,
} = require("express-validator");
const router = express.Router();
const cookParser = require("cookie-parser");
const {AccountService} = require("@/ExpressServerEnd/Service/account_module/account_service");
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



module.exports = router;
