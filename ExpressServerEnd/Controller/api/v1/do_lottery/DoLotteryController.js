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

router.post('/bili/run',
    body('account_name'),
    async (req, resp, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return next(errors.mapped());
            }
            let uid = req.auth.uid;
            let account_name = req.body.account_name;
            let result = await task_manager.add_user_account_task(uid, account_name);
            let result_json = result.toJSON()
            return resp.json(result_json)
        } catch (e) {
            next(e);
        }
    })

router.post('/bili/run_bulk',
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

module.exports = router;
