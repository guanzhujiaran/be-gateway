/*
 * @Author: 星瞳 1944637830@qq.com
 * @Date: 2023-11-08 13:34:47
 * @LastEditors: 星瞳 1944637830@qq.com
 * @LastEditTime: 2024-02-07 00:01:58
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
		try {
			if(pg && pg.isClosed()){
				return
			}
			is_front = await pg.evaluate(
				() => document.visibilityState === "visible"
			);
			if (!is_front) {
				await pg.bringToFront();
				is_front = true;
			}
		} catch (e) {
			console.error(`将浏览器切换至前台失败！${e}\n${e.stack}`);
		}
		return is_front;
	},
	/**
	 * 获取浏览器的b站中存储的csrf值
	 * @param {Page} pg
	 * @returns {Promise<string>} - bili_cjt 也就是csrf_token和csrf
	 */
	get_bili_cjt: async (pg) => {
		let cks = await pg.cookies("https://www.bilibili.com");
		return cks.find((el) => el.name == "bili_jct").value;
	},
	get_uid: async (pg) => {
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
			remove_video_player:async (pg) => {
				try {
					await pg.evaluate((selector) => {
						const elementToRemove = document.querySelector(selector);
						if (elementToRemove) {
							elementToRemove.remove();
						}
					}, `.bpx-player-primary-area`); //移除播放器
				} catch (e) {
					console.error(`${e}\n${e.stack}\n移除直播间的播放器元素失败！`);
				}
			},
};

module.exports = {
	sleep,
	pptr_op,
};
