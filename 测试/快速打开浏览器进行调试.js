/*
 * @Author: 星瞳 1944637830@qq.com
 * @Date: 2023-12-08 00:34:37
 * @LastEditors: 星瞳 1944637830@qq.com
 * @LastEditTime: 2024-05-08 15:13:11
 * @FilePath: \tampermonkey\测试\快速打开浏览器进行调试
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
//window.EmbedPlayer.instance B站直播间播放器实例
// B站日志id
// E = {
// 	pv: "000358",
// 	event: "000527", 这个有点问题
// 	perf: "000953",
// 	error: "000900",
// 	perfHybrid: "001266"
// }
let { DO_Lottery, sleep } = require("./木偶模块/puppeteer_lottery.js");
let browser_mode = 1;
let lot = new DO_Lottery("lottery_setting1", browser_mode);
await lot.main();

let new_pg = await (await lot.global_page.browser()).newPage();

await new_pg.setBypassCSP(true)
await new_pg.setRequestInterception(true);
new_pg.on("request", async (req) => {
	try {
		if (req.method().toLowerCase() === "post") {
			if (
				req.url().includes("data.bilibili.com/log/web?013324") ||
				req.url().includes("data.bilibili.com/log/web?000527") ||
				req.url().includes("data.bilibili.com/log/web?000017") ||
				req.url().includes("data.bilibili.com/log/web?001111") ||
				req.url().includes("data.bilibili.com/log/web?web_location") ||
				req.url().includes("data.bilibili.com/log/web?content_type") ||
				req.url().includes("cm.bilibili.com/cm/api/fees/pc")
			) {
				//如果是浏览器要发起检测到作弊的请求，就拦截下来，不让它发出去！
				return req.respond({
					status: 200,
					contentType: "text/plain; charset=utf-8",
					body: "ok",
				});
				//console.log(`成功拦截科技识别请求：${interceptedRequest.url()}`);
			}
		}
		if (
			req
				.url()
				.includes(
					"api.bilibili.com/x/internal/gaia-gateway/ExClimbWuzhi"
				) &&
			req.method().toLowerCase() == "post"
		) {
			return req.respond({
				status: 200,
				contentType: "application/json; text/plain; charset=UTF-8",
				body: JSON.stringify({
					code: 0,
					data: {},
					message: "0",
					ttl: 1,
				}),
			});
		}
		if (
			req.url().includes(".bilivideo.com") || // 拦截直播流
			req.url().includes(".bilivideo.cn") ||
			req.url().includes("web-frontend/data/collector") // 前端检测设备的请求，发送多了会触发验证码
		) {
			return req.respond({
				status: 200,
				contentType: "application/octet-stream",
				body: "",
			});
		}
		if (req.url().includes("player/wbi/playurl")) {
			// 拦截播放列表
			return req.respond({
				status: 200,
				contentType: "application/json; text/plain; charset=utf-8",
				body: JSON.stringify({
					code: -412,
					message: "0",
					data: null,
					ttl: 1,
				}),
			});
		}
		if (new URL(req.url()).origin.includes(".geetest.com")) {
			// 放行极验的请求
			return req.continue();
		}
		// if (
		// 	req.resourceType() == "image" ||
		// 	req.resourceType() == "media"
		// ) {
		// 	return req.abort();
		// }

		req.continue();
	} catch (e) {
		console.warn(`拦截请求：${req.url()}失败\n${e.stack}`, e);
	}
});
