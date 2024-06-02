/*
 * @Author: 星瞳 1944637830@qq.com
 * @Date: 2024-04-08 14:31:18
 * @LastEditors: 星瞳 1944637830@qq.com
 * @LastEditTime: 2024-05-31 12:49:39
 * @FilePath: \tampermonkey\ExpressServerEnd\ServerRun.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */

const express = require("express");
const cors = require('cors');
const bodyParser = require("body-parser");
const UserRouter = require('@/ExpressServerEnd/Controller/api/v1/user/UserController');
const AccountRouter = require("@/ExpressServerEnd/Controller/api/v1/account/AccountController");
const { jwtAuth } = require("@/ExpressServerEnd/Controller/Route/JwtModule");
const hostname = "localhost";
const port = 9923;

const app = express();
// 解决跨域问题
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(jwtAuth);
app.use("/api/v1/user", UserRouter);
app.use("/api/v1/account", AccountRouter);
app.use("*", (req, res) => {
	return res.json({
		code: -404,
		data:null,
		msg: "不存在的路径",
		ttl: 1,
	});
});
// 错误处理中间
app.use((err, req, resp, next) => {
	console.error(err);
	if (err.name === "UnauthorizedError") {
		return resp.json({
			code: -1,
			data:null,
			msg: "未登录",
			ttl: 1,
		});
	}
	return resp.json({
		code:500,
		data:null,
		msg: "服务器错误",
		ttl:1
	});
});
app.listen(port, () => {
	console.log(`Server running at http://${hostname}:${port}/`);
});
