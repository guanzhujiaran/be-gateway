const express = require("express");
const {
	check,
	validationResult,
	oneOf,
	body,
	query,
} = require("express-validator");
const router = express.Router();
const cookParser = require("cookie-parser");
router.use(cookParser());
const sqlhelper = require("../SqlHelper/SqlHelper");

router.get("/all_accounts", async (req, resp, next) => {
	try {
		let uid = req.auth.uid;
		if (uid) {
			let all_account_info = await sqlhelper.get_all_account_info_by_uid(
				uid
			);
			return resp.json({
				code: 0,
				data: all_account_info,
				msg: "success",
				ttl: 1,
			});
		}
		return resp.json({
			code: -1,
			msg: "未登录",
			ttl: 1,
		});
	} catch (e) {
		next(e);
	}
});

router.post(
	"/add_account",
	[body("account_name").notEmpty().withMessage("账号名不能为空")],
	async (req, resp, next) => {
		try {
			let uid = req.auth.uid;
			let account_name = req.body.account_name;
			let is_exist_account_name =
				await sqlhelper.get_account_info_by_account_name(account_name);
			if (is_exist_account_name) {
				return resp.json({
					code: 40014,
					msg: "该昵称已存在",
					ttl: 1,
				});
			}
			let all_account_info = await sqlhelper.add_account_info(
				account_name,
				uid
			);
			return resp.json({
				code: 0,
				msg: "账户创建成功！",
				ttl: 1,
			});
		} catch (e) {
			next(e);
		}
	}
);
router.get(
	"/get_account_info",
	[query("account_name").notEmpty()],
	async (req, resp, next) => {
		try {
			let uid = req.auth.uid;
			let account_name = req.query.account_name;
			if (!account_name) {
				return resp.json({
					code: -4,
					data: "账号名错误！",
					msg: "success",
					ttl: 1,
				});
			}
			let account_info = await sqlhelper.get(account_name, uid);
			return resp.json({
				code: 0,
				data: account_info,
				msg: "success",
				ttl: 1,
			});
		} catch (e) {
			next(e);
		}
	}
);

module.exports = router;
