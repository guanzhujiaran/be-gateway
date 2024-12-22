const express = require("express");
const {
    body,
    query, validationResult, oneOf,
} = require("express-validator");
const router = express.Router();
const cookParser = require("cookie-parser");
const {task_manager} = require("@/ExpressServerEnd/Service/background_task_module/task_manager_service");
const {createGuard} = require("@/ExpressServerEnd/Service/user_permission_module/user_permission_service");
router.use(cookParser());

router.post('/bili/run',
    createGuard(),
    body('account_name').notEmpty(),
    async (req, resp, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return next(errors.mapped());
            }
            let uid = req.auth.uid;
            let account_name = req.body.account_name;
            let result = await task_manager.add_user_account_dynamic_lottery_task(uid, account_name);
            let result_json = result.toJSON()
            return resp.json(result_json)
        } catch (e) {
            next(e);
        }
    })

router.post('/bili/run_bulk',
    createGuard(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return next(errors.mapped());
            }
            let uid = req.auth.uid;
            let result = await task_manager.bulk_add_user_tasks(uid);
            let result_json = result.toJSON()
            return resp.json(result_json)
        } catch (e) {
            next(e);
        }
    }
)
router.post('/bili/run_read_account_msg',
    createGuard(),
    body('account_name').notEmpty(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return next(errors.mapped());
            }
            let uid = req.auth.uid;
            let {account_name} = req.body;
            let result = await task_manager.add_read_account_msg({uid: uid, account_name: account_name});
            let result_json = result.toJSON()
            return resp.json(result_json)
        } catch (e) {
            next(e);
        }
    }
)

module.exports = router;
