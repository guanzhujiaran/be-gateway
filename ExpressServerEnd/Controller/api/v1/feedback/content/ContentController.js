const express = require("express");
const {check, validationResult} = require("express-validator");
const router = express.Router();
const cookParser = require("cookie-parser");
const {personalized_content_service} = require("@/ExpressServerEnd/Service/personalized_content_module/personalized_content_service");
router.use(cookParser());

router.post("/pub_content", [
        check('title', '标题不正确！').notEmpty({ignore_whitespace: true}).isString(),
        check('content', '内容不正确！').notEmpty({ignore_whitespace: true}).isString(),
        check('type', '发布类型不正确！').notEmpty({ignore_whitespace: true}).isNumeric(),
        check('desc').optional().isString().withMessage('描述不正确'),
    ],
    async (req, resp, next) => {
        try {
            let errors = validationResult(req);
            if (!errors.isEmpty()) {
                return next(errors.mapped());
            }
            let uid = req.auth.uid;
            let {
                title,
                content,
                desc = "",
                type
            } = req.body;
            let result = await personalized_content_service.add_personalized_content({
                mid: uid,
                title,
                content,
                desc,
                type,
                req,resp
            })
            /**
             * @type {RootObject<{oid:number}|null>}
             */
            let user_info_json = result.toJSON()
            return resp.json(user_info_json)
        } catch (e) {
            next(e);
        }
    }
);

router.get("/get_list",
    [
        check("page_num", "页数必须为数字").isNumeric(),
        check("page_size", "页长必须为数字").isNumeric(),
        check('order_by').optional().isString().isIn(['hot', 'time']).withMessage('order_by 必须是 "hot" 或 "time"')
    ],
    async (req, resp, next) => {
        try {
            let errors = validationResult(req);
            if (!errors.isEmpty()) {
                return next(errors.mapped());
            }
            let uid = req.auth.uid;
            let {
                page_num,
                page_size,
                order_by = "hot"
            } = req.query;
            let result = await personalized_content_service.get_personalized_content({
                mid: uid,
                page_num,
                page_size,
                order_by
            })
            /**
             * @type {RootObject<{oid:number}|null>}
             */
            let user_info_json = result.toJSON()
            return resp.json(user_info_json)
        } catch (e) {
            next(e);
        }
    }
)

module.exports = router;