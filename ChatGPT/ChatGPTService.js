/*
 * @Author: 星瞳 1944637830@qq.com
 * @Date: 2023-08-18 17:24:27
 * @LastEditors: 星瞳 1944637830@qq.com
 * @LastEditTime: 2023-12-09 12:49:36
 * @FilePath: \tampermonkey\ChatGPT\ChatGPTService.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
const chatgpt_op = require("../木偶模块/util/chatgpt_browser");
const my_chat = new chatgpt_op();
const express = require("express");
const app = express();
const fs = require("fs");
const port = 3000;
app.use(express.json());
app.use(express.urlencoded());
const ChatGPT_log_filePath = "./ChatGPT/回复内容日志/log.txt";

// 处理 POST 请求的路由

function sleep(ms) {
	return new Promise((resolve) => setTimeout(() => resolve(sleep), ms));
}

function writeToFile(filePath, data) {
	fs.appendFile(filePath, data, "utf8", (err) => {
		if (err) {
			console.error(`写入文件时发生错误: ${err}`);
		} else {
			console.log(`成功将数据追加到文件 ${filePath}`);
		}
	});
}

app.post("/ChatGPT/ask", async (req, res) => {
	//非异步，这是同步处理
	let bt = 0;
	try {
		while (1) {
			if (!my_chat.chatpage || (await my_chat.chatpage.isClosed())) {
				await my_chat.init();
			}
			if (my_chat.isAvailable) {
				let inputText = req.body.data;
				if (!inputText) {
					console.error(`非法输入的请求喵！${req.body}`);
				}
				let processedText = await my_chat.askquestion(inputText);
				processedText = processedText
					? processedText
							.replace("jsonCopy code", "")
							.replace("data{", "{")
					: undefined;
				if (!processedText) {
					throw `获取的答案为空！`;
				}
				console.log(`回复内容：${processedText}`);
				writeToFile(
					ChatGPT_log_filePath,
					JSON.stringify(processedText) + "\n"
				);
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
			`${
				req.body.data
			}\n回复失败！当前尝试次数${bt}次！\n${e.toString()}`,
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
