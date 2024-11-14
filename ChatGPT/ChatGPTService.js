/*
 * @Author: 星瞳 1944637830@qq.com
 * @Date: 2023-08-18 17:24:27
 * @LastEditors: 星瞳 1944637830@qq.com
 * @LastEditTime: 2024-11-11 15:22:44
 * @FilePath: \tampermonkey\ChatGPT\ChatGPTService.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
// const chatgpt_op = require("../木偶模块/util/chatgpt_browser");
// const my_chat = new chatgpt_op();
const express = require("express");
const timeout = require("express-timeout-handler");
const app = express();
app.use(timeout.handler({ timeout: 30000 }));
const fs = require("fs");
const axios = require("axios");
const port = 3000;
app.use(express.json());
app.use(express.urlencoded());
const ChatGPT_log_filePath = "./ChatGPT/回复内容日志/log.txt";
// 处理 POST 请求的路由
// 超时的错误处理程序
app.use((err, req, res, next) => {
	if (err.timeout) {
		res.status(503).send("请求超时");
	} else {
		next(err);
	}
});
function sleep(ms) {
	return new Promise((resolve) => setTimeout(() => resolve(sleep), ms));
}

app.post("/ChatGPT/ask", async (req, res) => {
	//非异步，这是同步处理
	let bt = 0;
	try {
		while (1) {
			// if (
			// 	!my_chat.chatpage ||
			// 	(await my_chat.chatpage.isClosed()) ||
			// 	!my_chat.qianwen_page ||
			// 	(await my_chat.qianwen_page.isClosed())
			// ) {
			// 	await my_chat.init();
			// }
			// if (my_chat.isAvailable) {
			if (1) {
				let inputText = req.body.data;
				if (!inputText) {
					console.error(`非法输入的请求喵！${req.body}`);
				}
				let resp = await axios.post(
					"http://127.0.0.1:23333/api/v1/ChatGpt3_5/ReplySingle",
					{
						question: inputText,
						ts: Math.ceil(Date.now() / 1000),
					}
				);
				if (resp.data.code) {
					throw Error(resp.msg);
				}
				console.debug(
					`请求：${inputText}\n获取到响应：${JSON.stringify(
						resp.data
					)}`
				);
				// let processedText = await my_chat.askquestion(inputText);
				let processedText = resp.data.data.answer;
				processedText = processedText
					? JSON.parse(
							processedText
								.replace("：{", "{")
								.replace("jsonCopy code", "")
								.replace("data{", "{")
								.replaceAll("json1", "")
								.replaceAll("Json\n1", "")
								.replaceAll("```json\n", "")
								.replaceAll("\n```", "")
								.replaceAll("\n2", "")
								.replaceAll("\n4", "")
								.replaceAll("\n5", "")
								.replaceAll("\n6", "")
								.replaceAll("\n7", "")
								.replaceAll("\n8", "")
								.replaceAll("\n9", "")
								.replaceAll("\n10", "")
								.replaceAll("\n11", "")
								.replaceAll("\n12", "")
								.trim()
					  )
					: undefined;
				if (!processedText) {
					throw Error(`获取的答案为空！`);
				}
				console.log(`回复内容：${JSON.stringify(processedText)}`);
				res.send(processedText);
				break;
			} else {
				bt++;
				if (bt >= 3) {
					res.send(undefined);
					break;
				}
				console.log("繁忙中！等待10秒");
				await sleep(10e3);
			}
		}
	} catch (e) {
		console.warn(
			`${req.body.data}\n回复失败！当前尝试次数${bt}次！\n${e.stack}`,
			new Date().toLocaleString()
		);
	}
	res.send(undefined);
});

// 处理 GET 请求的路由（用于测试）
app.get("/", (req, res) => {
	res.send("本地 REST API 已成功运行！");
});

// 启动服务器并监听端口
app.listen(port, () => {
	console.log(`服务器已运行在 http://localhost:${port}`);
});
