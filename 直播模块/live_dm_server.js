/*
 * @Author: 星瞳 1944637830@qq.com
 * @Date: 2023-12-09 21:55:06
 * @LastEditors: 星瞳 1944637830@qq.com
 * @LastEditTime: 2024-01-01 13:15:00
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

const WebSocket = require("ws");

class live_dm_wss_service {
	/**
	 *
	 * @param {DO_Lottery[]} DO_Lottery_class_list
	 */
	constructor(DO_Lottery_class_list) {
		this.DO_Lottery_class_list = DO_Lottery_class_list;
		this.wss_port = GLOBAL_CONFIG.live_module.wss_port;
		/**@type {Object.<number,live_dm_sender[]>} */
		this.live_dm_sender_obj = {}; //{room_id:live_dm_sender}
	}
	/**
	 * 接收发弹幕消息
	 * {
	 * room_id:123456,
	 * dm_msg:'',
	 * cheat_mode:false,
	 * stop_flag:false,
	 * send_ts: (number) xx秒
	 * }
	 */
	main = () => {
		let wss = new WebSocket.Server({
			port: this.wss_port,
		});
		try {
			wss.on("connection", (ws) => {
				ws.on("message", (message) => {
					/**
					 * @typedef {Object} send_dm_msg_type
					 * @property {number} room_id - 房间号
					 * @property {string} dm_msg - 弹幕内容
					 * @property {boolean} cheat_mode - 开启作弊模式发弹幕
					 * @property {boolean} stop_flag - 是否停止发弹幕
					 * @property {number} send_ts - wss通信的时间，秒为单位
					 */
					/**@type {send_dm_msg_type} */
					let msg = JSON.parse(message);
					console.log(`[SERVER] Received:${message}`);
					if (
						!Object.keys(this.live_dm_sender_obj).includes(
							JSON.stringify(msg.room_id)
						)
					) {
						let live_dm_sender_list = [];
						for (let DO_Lottery of this.DO_Lottery_class_list) {
							live_dm_sender_list.push(
								new live_dm_sender(DO_Lottery)
							);
						}
						this.live_dm_sender_obj[msg.room_id] =
							live_dm_sender_list;
					}
					let sending_flag = false;
					this.live_dm_sender_obj[msg.room_id].map((el) => {
						el.send_ts = msg.send_ts;
						el.stop_flag = msg.stop_flag;
						sending_flag = el.sending_flag;
					});

					if (!sending_flag) {//如果没有在发送弹幕，则启动！
						this.live_dm_sender_obj[msg.room_id].map((el) =>
							el.wss_send_dm(
								msg.room_id,
								msg.dm_msg,
								msg.cheat_mode
							)
						);
					}
					ws.send(`服务器端收到，执行发弹幕命令！`, (err) => {
						if (err) {
							console.log(`[SERVER] error:${err}`);
						}
					});
				});
			});
		} catch (e) {
			console.error(e);
		}
	};
}

class live_dm_sender extends ExtensionClass {
	/**
	 * @param {DO_Lottery} DO_Lottery_instance DO_Lottery的实例
	 */
	constructor(DO_Lottery_instance) {
		super(DO_Lottery_instance);
		this.sending_flag = false; //是否正在发送弹幕
		this.stop_flag = false; //停止标志，每次发弹幕前检查一遍是否为true
		this.send_ts = 0;
	}

	/**
	 *
	 * @param {number} room_id
	 * @param {string} dm_msg
	 * @param {boolean} cheat_mode
	 */
	wss_send_dm = async (room_id, dm_msg, cheat_mode = false) => {
		try {
			if (this.sending_flag || this.stop_flag) {
				return;
			}
			this.sending_flag = true;
			if (!this.basic_pg || this.basic_pg.isClosed()) {
				await this.init();
				this.basic_pg.on("request", async (req) => {
					try {
						拦截直播流;
						if (req.url().includes("bilivideo")) {
							req.abort();
							// console.log(`成功拦截直播流：${interceptedRequest.url()}`);
							return;
						}

						if (req.url().includes("likeReportV3")) {
							let postdata = req
								.postData()
								.replace(/click_time=\d+?/, "click_time=15");
							let method = req.method();
							let headers = req.headers();
							let url = req.url();
							req.continue({
								postData: postdata,
								url: url,
								method: method,
								headers: headers,
							}); //这个东西修改了，但是不会显示在F12的浏览器抓包里面！
							return;
						}
						if (req.method().toLowerCase() == "post") {
							if (
								req
									.url()
									.includes(
										"data.bilibili.com/log/web?013324"
									) ||
								req
									.url()
									.includes(
										"data.bilibili.com/log/web?000527"
									) ||
								req
									.url()
									.includes("data.bilibili.com/log/web?0000")
							) {
								//如果是浏览器要发起检测到作弊的请求，就拦截下来，不让它发出去！
								req.abort();
								//console.log(`成功拦截科技识别请求：${interceptedRequest.url()}`);
								return;
							}
						}
						req.continue();
					} catch (e) {
						console.warn(`拦截请求：${req.url()}失败`, e);
					}
				});
			}
			if (this.basic_pg.url().includes(room_id)) {
				await this.basic_pg.goto(
					`https://live.bilibili.com/${room_id}`
				);
			}
			await this.basic_pg.bringToFront();
			while (!this.stop_flag) {
				if (!cheat_mode) {
					await live_op.polymer_op.live_send_dm_single(
						this.basic_pg,
						dm_msg,
						cheat_mode
					);
				} else {
					let space_num = 30 - dm_msg.length;
					let dm_list = [];
					for (let i = 0; i < space_num; i++) {
						if (i % 2 == 0) {
							dm_list.push(dm_msg + Math.ceil((i + 1) / 2) * " ");
						} else {
							dm_list.push(Math.ceil((i + 1) / 2) * " " + dm_msg);
						}
					}
					for (let dm of dm_list) {
						if (this.stop_flag) {
							break;
						}
						if (Date.now() / 1e3 - this.send_ts > 1e3) {
							this.stop_flag = true;
							break;
						}
						await live_op.polymer_op.live_send_dm_single(
							this.basic_pg,
							dm,
							cheat_mode
						);
					}
				}
			}
		} catch (e) {
			console.error(e);
		} finally {
			this.sending_flag = false;
		}
	};
}
