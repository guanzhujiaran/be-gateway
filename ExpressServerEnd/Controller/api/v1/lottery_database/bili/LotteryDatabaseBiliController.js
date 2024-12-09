const express = require("express");
const {check, validationResult} = require("express-validator");
const router = express.Router();
const cookParser = require("cookie-parser");
const {
    LotteryDatabaseBiliService,
} = require("@/ExpressServerEnd/Service/lottery_database_module/bili/lottery_database_bili_service");

router.use(cookParser());

router.get(
    "/GetReserveLottery",
    [
        check("page_num", "页数必须为数字").isNumeric(),
        check("page_size", "页长必须为数字").isNumeric(),
    ],
    async (req, resp, next) => {
        try {
            let errors = validationResult(req);
            if (!errors.isEmpty()) {
                return next(errors.mapped());
            }
            let uid = req.auth?.uid ?? 0;
            let {page_num, page_size} = req.query;
            let result_json = await LotteryDatabaseBiliService.handle_lottery_data(
                {uid, page_num, page_size},
                "GetReserveLottery",
            );
            return resp.json(result_json);
        } catch (e) {
            next(e);
        }
    },
);
router.get(
    "/GetOfficialLottery",
    [
        check("page_num", "页数必须为数字").isNumeric(),
        check("page_size", "页长必须为数字").isNumeric(),
    ],
    async (req, resp, next) => {
        try {
            let errors = validationResult(req);
            if (!errors.isEmpty()) {
                return next(errors.mapped());
            }
            let uid = req.auth?.uid ?? 0;
            let {page_num, page_size} = req.query;
            let result_json = await LotteryDatabaseBiliService.handle_lottery_data(
                {uid, page_num, page_size},
                "GetOfficialLottery",
            );
            return resp.json(result_json);
        } catch (e) {
            next(e);
        }
    },
);
router.get(
    "/GetChargeLottery",
    [
        check("page_num", "页数必须为数字").isNumeric(),
        check("page_size", "页长必须为数字").isNumeric(),
    ],
    async (req, resp, next) => {
        try {
            let errors = validationResult(req);
            if (!errors.isEmpty()) {
                return next(errors.mapped());
            }
            let uid = req.auth?.uid ?? 0;
            let {page_num, page_size} = req.query;
            let result_json = await LotteryDatabaseBiliService.handle_lottery_data(
                {uid, page_num, page_size},
                "GetChargeLottery",
            );
            return resp.json(result_json);
        } catch (e) {
            next(e);
        }
    },
);
router.get(
    "/GetLiveLottery",
    [
        check("page_num", "页数必须为数字").isNumeric(),
        check("page_size", "页长必须为数字").isNumeric(),
    ],
    async (req, resp, next) => {
        try {
            let errors = validationResult(req);
            if (!errors.isEmpty()) {
                return next(errors.mapped());
            }
            let uid = req.auth?.uid ?? 0;
            let {page_num, page_size} = req.query;
            let result_json = await LotteryDatabaseBiliService.handle_lottery_data(
                {uid, page_num, page_size},
                "GetLiveLottery",
            );
            return resp.json(result_json);
        } catch (e) {
            next(e);
        }
    },
);
router.get(
    "/GetTopicLottery",
    [
        check("page_num", "页数必须为数字").isNumeric(),
        check("page_size", "页长必须为数字").isNumeric(),
    ],
    async (req, resp, next) => {
        try {
            let errors = validationResult(req);
            if (!errors.isEmpty()) {
                return next(errors.mapped());
            }
            let uid = req.auth?.uid ?? 0;
            let {page_num, page_size} = req.query;
            let result_json = await LotteryDatabaseBiliService.handle_lottery_data(
                {uid, page_num, page_size},
                "GetTopicLottery",
            );
            return resp.json(result_json);
        } catch (e) {
            next(e);
        }
    },
);

router.post(
    "/AddDynamicLottery",
    [check("dynamic_id_or_url", "动态链接或id不许为空").notEmpty()],
    async (req, resp, next) => {
        try {
            let errors = validationResult(req);
            if (!errors.isEmpty()) {
                return next(errors.mapped());
            }
            // let uid = req.auth?.uid ?? 0
            let dynamic_id_or_url = req.body.dynamic_id_or_url;
            let result_json = await LotteryDatabaseBiliService.add_dynamic_lottery({
                dynamic_id_or_url,
            });
            return resp.json(result_json);
        } catch (e) {
            next(e);
        }
    },
);

module.exports = router;
