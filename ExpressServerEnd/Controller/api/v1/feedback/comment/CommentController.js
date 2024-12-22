const express = require("express");
const {check, validationResult, body} = require("express-validator");
const router = express.Router();
const cookParser = require("cookie-parser");
const {personalized_content_service} = require("@/ExpressServerEnd/Service/personalized_content_module/personalized_content_service");
const {jwtAuthGenerator} = require("@/ExpressServerEnd/Service/user_permission_module/JwtModule");
const {UserService} = require("@/ExpressServerEnd/Service/user_module/user_service");
const {req_tool} = require("@/ExpressServerEnd/Tool/Utl");
const {UserActModel} = require("@/ExpressServerEnd/Model/api/v1/user/user_act_model");
router.use(cookParser());

router.post("/add", [
        check('oid', 'oid不正确！').notEmpty({ignore_whitespace: true}).isNumeric(),
        check('type', 'type不正确！').notEmpty({ignore_whitespace: true}).isNumeric(),
        body('root', 'root不正确！').notEmpty({ignore_whitespace: true}).isNumeric(),
        body('parent', 'parent不正确！').notEmpty({ignore_whitespace: true}).isNumeric(),
        body('content', 'content不正确！').notEmpty({ignore_whitespace: true}).isString(),
    ],
    async (req, resp, next) => {
        try {
            let errors = validationResult(req);
            if (!errors.isEmpty()) {
                return next(errors.mapped());
            }
            let uid = req.auth.uid;

            let user_act_info = await UserService.add_user_act_ip_info({
                req, resp, act_info: UserActModel.add_comment
            })
            let {
                oid,
                type,
                root = 0,
                parent = 0,
                content
            } = req.body;
            let result = await personalized_content_service.add_comment({
                oid, type, root, parent, reply_content: content, mid: uid, user_act_info_pk: user_act_info.pk
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

router.get("/reply_main",
    [
        check('oid', 'oid不正确！').notEmpty({ignore_whitespace: true}).isNumeric(),
        check('type', 'type不正确！').notEmpty({ignore_whitespace: true}).isNumeric(),
        check("page_num", "页数必须为数字").isNumeric(),
        check("page_size", "页长必须为数字").isNumeric(),
        check('order_by').optional().isString().isIn(['hot', 'time']).withMessage('order_by 必须是 "hot" 或 "time"')
    ],
    jwtAuthGenerator({credentialsRequired: false}),
    async (req, resp, next) => {
        try {
            let errors = validationResult(req);
            if (!errors.isEmpty()) {
                return next(errors.mapped());
            }
            let uid = req.auth?.uid ?? 0;
            let user_act_info = await UserService.add_user_act_ip_info({
                req, resp, act_info: UserActModel.get_comment
            })
            let {
                oid,
                type,
                page_num,
                page_size,
                order_by = "hot"
            } = req.query;
            let result = await personalized_content_service.get_content_comments_by_oid_type({
                mid: uid,
                oid,
                type,
                page_size,
                page_num,
                order_by,
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

router.post('/action',
    [
        body('rpid', 'rpid不正确！').notEmpty({ignore_whitespace: true}).isNumeric(),
        body('action', 'action不正确！').notEmpty({ignore_whitespace: true}).isNumeric().custom((val) => {
            return [0, 1, 2].includes(val)
        }),
    ],
    async (req, resp, next) => {
        try {
            let errors = validationResult(req);
            if (!errors.isEmpty()) {
                return next(errors.mapped());
            }
            let uid = req.auth.uid;
            let user_act_info = await UserService.add_user_act_ip_info({
                req, resp, act_info: UserActModel.comment_interact
            })
            let {
                rpid, action
            } = req.body;
            let result = await personalized_content_service.add_comment_like_dislike({
                rpid, mid: uid, action, user_act_info_pk: user_act_info.pk
            })
            let user_info_json = result.toJSON()
            return resp.json(user_info_json)
        } catch (e) {
            next(e);
        }
    }
)
router.post('/del',
    [
        check('oid', 'oid不正确！').notEmpty({ignore_whitespace: true}).isNumeric(),
        check('type', 'type不正确！').notEmpty({ignore_whitespace: true}).isNumeric(),
        body('rpid', 'rpid不正确！').notEmpty({ignore_whitespace: true}).isNumeric(),
    ],
    async (req, resp, next) => {
        try {
            let errors = validationResult(req);
            if (!errors.isEmpty()) {
                return next(errors.mapped());
            }
            let uid = req.auth.uid;
            let user_act_info = await UserService.add_user_act_ip_info({
                req, resp, act_info: UserActModel.del_comment
            })
            let {
                rpid, oid, type
            } = req.body;
            let result = await personalized_content_service.delete_comment({
                oid, type, rpid, uid
            })
            let user_info_json = result.toJSON()
            return resp.json(user_info_json)
        } catch (e) {
            next(e);
        }
    }
)
module.exports = router;