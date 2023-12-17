/*
 * @Author: 星瞳 1944637830@qq.com
 * @Date: 2023-12-09 21:55:06
 * @LastEditors: 星瞳 1944637830@qq.com
 * @LastEditTime: 2023-12-18 14:16:19
 * @FilePath: \tampermonkey\直播模块\live_dm_server.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
/**
 * 直播间刷弹幕抽奖用
 * 写一个wss消息，消息一旦中断就停止刷弹幕这种，消息每10ms传递一次？
 */
const { DO_Lottery, sleep } = require("../木偶模块/puppeteer_lottery");

const { ExtensionClass } = require("../功能扩展基类/ExtensionBase");

const { live_op } = require("./live_op");

const GLOBAL_CONFIG = require("../CONFIG.Default");

class live_dm_wss_service {
	constructor(wss_url) {
		// this.wss_url = GLOBAL_CONFIG.live_module.wss_url;
		this.controller = new AbortController();
	}
	listener = async () => {};
	_excutor = async (signal) => {
		if (signal.aborted) {
			throw new Error("Operation aborted");
		}
		let result = new Promise((resolve, reject) => {
			// 将signal传递给setTimeout，或者给signal绑定abort事件监听器
			let mytimer = async () => {
				while (1) {
					console.log(114514);
					await sleep(1e3);
				}
			};
			mytimer();
		});
		signal.addEventListener("abort", () => {
			result = null;
		});

		// 返回结果
		return await result;
	};
	main = async () => {
		if (!this.controller.signal.aborted) {
			this.controller = new AbortController();
			await this._excutor(this.controller.signal);
		} else {
			console.error(`函数正在执行中！`);
		}
	};
}

class live_dm_sender extends ExtensionClass {
	/**
	 * @param {DO_Lottery} DO_Lottery_instance DO_Lottery的实例
	 */
	constructor(DO_Lottery_instance) {
		super(DO_Lottery_instance);
	}
}
