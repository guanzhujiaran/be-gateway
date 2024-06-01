const express = require("express");
const { check, validationResult } = require("express-validator");

const router = express.Router();
const cookParser = require("cookie-parser");
const { createToken } = require("./JwtModule");
const md5 = require("md5");
router.use(cookParser());
const sqlhelper = require("../SqlHelper/SqlHelper");
const password_salt = "田所浩二";
router.get("/nav", async (req, resp, next) => {
	try {
		let uid = req.auth.uid;
		let user_info = await sqlhelper.get_user_info_by_uid(uid);
		if (user_info) {
			return resp.json({
				code: 0,
				data: {
					uid: user_info.uid,
					user_name: user_info.user_name,
				},
				msg: "success",
				ttl: 1,
			});
		}
		return resp.json({
			code: -499,
			data:null,
			msg: "用户不存在",
			ttl: 1,
		});
	} catch (e) {
		next(e);
	}
});

router.post(
	"/login",
	[
		check("user_name", "用户名不得为空！").not().isEmpty(),
		check("pwd", "密码不得为空").not().isEmpty(),
	],
	async (req, resp, next) => {
		try {
			var errors = validationResult(req);
			if (!errors.isEmpty()) {
				return next(errors.mapped());
			}
			let user_name = req.body.user_name;
			let pwd = req.body.pwd;
			let parssed_pwd = md5(pwd + password_salt);
			let user_info = await sqlhelper.get_user_info_by_user_name(
				user_name
			);
			if (user_info) {
				if (parssed_pwd === user_info.pwd) {
					let jwt_token = createToken({
						user_name: user_name,
						uid: user_info.uid,
					});
					return resp.json({
						code: 0,
						msg: "登录成功！",
						data: {
							uid: user_info.uid,
							user_name: user_info.user_name,
							jwt_token: jwt_token,
						},
						ttl: 1,
					});
				}
			}
			return resp.json({
				code: -629,
				data: null,
				msg: "用户名或密码错误",
				ttl: 1,
			});
		} catch (e) {
			next(e);
		}
	}
);

router.post(
	"/reg",
	[
		check("user_name", "用户名不得为空！").not().isEmpty(),
		check("pwd", "密码不得为空").not().isEmpty(),
	],
	async (req, resp, next) => {
		try {
			var errors = validationResult(req);
			if (!errors.isEmpty()) {
				return next(errors.mapped());
			}
			let user_name = req.body.user_name;
			let is_exist = await sqlhelper.get_user_info_by_user_name(
				user_name
			);
			if (is_exist) {
				return resp.json({
					code: -1,
					msg: "用户名已存在",
					ttl: 1,
				});
			}
			let pwd = req.body.pwd;
			let parssed_pwd = md5(pwd + password_salt);
			let user_info = await sqlhelper.add_user_info(
				user_name,
				parssed_pwd
			);
			return resp.json({
				code: 0,
				data: "注册成功！",
				msg: "success",
				ttl: 1,
			});
		} catch (e) {
			next(e);
		}
	}
);

module.exports = router;
