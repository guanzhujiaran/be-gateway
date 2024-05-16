/*
 * @Author: 星瞳 1944637830@qq.com
 * @Date: 2023-11-08 13:34:47
 * @LastEditors: 星瞳 1944637830@qq.com
 * @LastEditTime: 2024-05-16 22:00:15
 * @FilePath: \tampermonkey\木偶模块\util\common_utl.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
const { Page } = require("puppeteer-core");

function sleep(ms) {
	return new Promise((resolve) => setTimeout(() => resolve(sleep), ms));
}

const pptr_op = {
	/**
	 * 将页面切换至前台，如果无法切换，可能是页面或者浏览器关了，返回false
	 * @param {Page} pg
	 * @returns {Promise<boolean>}
	 */
	check_page_is_front: async (pg) => {
		let is_front = false;
		let bk = 0;
		while (bk <= 5) {
			try {
				if (pg && pg.isClosed()) {
					return;
				}
				is_front = await pg.evaluate(
					() => document.visibilityState === "visible"
				);
				if (!is_front) {
					await pg.bringToFront();
					is_front = true;
				}
				break;
			} catch (e) {
				console.error(`将浏览器切换至前台失败！${e}\n${e.stack}`);
				bk++;
				await sleep(3e3);
			}
		}
		return is_front;
	},
	/**
	 * 获取浏览器的b站中存储的csrf值
	 * @param {Page} pg
	 * @returns {Promise<string>} - bili_cjt 也就是csrf_token和csrf
	 */
	get_bili_cjt: async (pg) => {
		if (pg && pg.isClosed()) {
			return;
		}
		let cks = await pg.cookies("https://www.bilibili.com");
		return cks.find((el) => el.name == "bili_jct").value;
	},
	get_uid: async (pg) => {
		if (pg && pg.isClosed()) {
			return;
		}
		let cks = await pg.cookies("https://www.bilibili.com");
		return cks.find((el) => el.name == "DedeUserID").value;
	},
	/**
	 *	将函数列表和需要运行的时间丢进去，可以等间隔的时间运行
	 * @param {Array<CallableFunction>} async_func_list
	 * @param {any} args
	 * @param {number} total_ms
	 * @returns {Array<any>} 返回函数的结果
	 */
	do_promise_func_in_sep_ms: async (async_func_list, args, total_ms) => {
		let promise_list = [];
		let sep_ms = Math.ceil(total_ms / async_func_list.length);
		for (let async_func of async_func_list) {
			promise_list.push(async_func(args));
			await sleep(sep_ms);
		}
		return promise_list;
	},
	/**
	 * 移除视频播放器
	 * @param {Page} pg
	 */
	remove_video_player: async (pg) => {
		try {
			if (pg && pg.isClosed()) {
				return;
			}
			// await pg.evaluate((selector) => {
			// 	const elementToRemove = document.querySelector(selector);
			// 	if (elementToRemove) {
			// 		elementToRemove.remove();
			// 	}
			// }, `.bpx-player-primary-area`); //移除播放器
		} catch (e) {
			console.error(`${e}\n${e.stack}\n移除直播间的播放器元素失败！`);
		}
	},
	hook_teck_logdata: async (pg) => {
		await pg.setBypassCSP(true);
		await pg.setRequestInterception(true);
		pg.on("request", async (req) => {
			try {
				if (req.method().toLowerCase() == "post") {
					if (
						req
							.url()
							.includes("data.bilibili.com/log/web?013324") ||
						req
							.url()
							.includes("data.bilibili.com/log/web?000527") ||
						req
							.url()
							.includes("data.bilibili.com/log/web?000017") ||
						req
							.url()
							.includes("data.bilibili.com/log/web?001111") ||
						req
							.url()
							.includes(
								"data.bilibili.com/log/web?web_location"
							) ||
						req
							.url()
							.includes(
								"data.bilibili.com/log/web?content_type"
							) ||
						req.url().includes("cm.bilibili.com/cm/api/fees/pc") ||
						req.url().includes(`data.bilibili.com/v2/log/web`)
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
						contentType:
							"application/json; text/plain; charset=UTF-8",
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
						contentType:
							"application/json; text/plain; charset=utf-8",
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
	},
	/**
	 * 通过b站前端的__BiliUser__.isLogin判断是否账号的登录状态还在
	 * @param {Page} pg
	 * @returns
	 *  - true:登录
	 *  - false:登录失效
	 */
	check_bili_login: async (pg) => {
		let url = pg.url();
		if (!url.includes(`bilibili`)) {
			await pg.goto(`https://message.bilibili.com/`);
		}
		return await pg.evaluate(() => window.__BiliUser__?.isLogin);
	},
};

module.exports = {
	sleep,
	pptr_op,
};
