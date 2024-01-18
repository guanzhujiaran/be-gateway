/*
 * @Author: 星瞳 1944637830@qq.com
 * @Date: 2023-12-09 21:55:06
 * @LastEditors: 星瞳 1944637830@qq.com
 * @LastEditTime: 2024-01-18 02:57:26
 * @FilePath: \tampermonkey\直播模块\live_dm_server.js
 * @Description:
 * 通过wss实现发送弹幕的功能的服务器端  （5705端口直播发弹幕通知的wss消息的端口）
 */
/**
 * 直播间刷弹幕抽奖用
 * 写一个wss消息，消息一旦中断就停止刷弹幕这种，消息每10ms传递一次？
 */
const { DO_Lottery } = require("../木偶模块/puppeteer_lottery");

const { sleep, pptr_op } = require("../木偶模块/util/common_utl");

const { ExtensionClass } = require("../功能扩展基类/ExtensionBase");

const { live_op } = require("./live_op");

const GLOBAL_CONFIG = require("../CONFIG.Default");

const WebSocket = require("ws");
const { BAPI } = require("../lib/helper/BAPI");

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
	 * send_ts: (number) 请求发送弹幕的时间戳 xx秒
	 * }
	 */
	main = () => {
		let wss = new WebSocket.Server({
			port: this.wss_port,
		});
		try {
			wss.on("connection", (ws) => {
				ws.on("message", async (message) => {
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
					if (
						!Object.keys(this.live_dm_sender_obj).includes(
							JSON.stringify(msg.room_id)
						)
					) {
						let live_dm_sender_list = [];
						for (let DO_Lottery of this.DO_Lottery_class_list) {
							if (
								DO_Lottery.lottery_setting.CONFIG.LIVE_SEND_DM
							) {
								//开启了直播刷弹幕才加入列表中
								live_dm_sender_list.push(
									new live_dm_sender(DO_Lottery)
								);
							}
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

					if (!sending_flag) {
						//如果没有在发送弹幕，则启动！
						this.live_dm_sender_obj[msg.room_id].map((el) =>
							el.wss_send_dm(
								msg.room_id,
								msg.dm_msg,
								msg.cheat_mode
							)
						);
						console.log(`[SERVER] 执行发弹幕请求:${message}`);
					}
					await sleep(300);
					ws.send(`服务器端收到wss，执行发弹幕命令！`, (err) => {
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
		this.csrf = "";
		this.uid = 0;
		this.Error_flag = false;
		this.send_dm_pg; //这个模块专用的页面！
	}

	/**
	 * 根据wss消息发送弹幕
	 * @param {number} room_id
	 * @param {string} dm_msg
	 * @param {boolean} cheat_mode
	 */
	wss_send_dm = async (
		room_id,
		dm_msg,
		cheat_mode = false,
		op_mode = "API"
	) => {
		if (this.Error_flag) return;
		try {
			if (this.sending_flag || this.stop_flag) {
				return;
			}
			this.sending_flag = true;
			if (!this.basic_pg || this.basic_pg.isClosed()) {
				await this.init();
			}
			if (!this.send_dm_pg || this.send_dm_pg.isClosed()) {
				this.send_dm_pg = await this.basic_pg.browser().newPage();
			}
			await live_op.basic_op.hook_teck_logdata(this.send_dm_pg);
			if (!this.uid) {
				this.uid = await pptr_op.get_uid(this.send_dm_pg);
			}
			if (!this.csrf) {
				this.csrf = await pptr_op.get_bili_cjt(this.send_dm_pg);
			}
			let visit_id = live_op.basic_op.get_visit_id(this.uid);
			await pptr_op.check_page_is_front(this.send_dm_pg);
			if (!this.send_dm_pg.url().includes(`live.bilibili`)) {
				await this.send_dm_pg.goto(
					//`https://live.bilibili.com/${room_id}`
					`https://live.bilibili.com/all?spm_id_from=333.1296.0.0`
				);
			}
			while (!this.stop_flag) {
				if (!this.csrf) throw "csrf获取出错！";
				await pptr_op.check_page_is_front(this.send_dm_pg);
				if (!cheat_mode) {
					if (op_mode != "API") {
						await live_op.polymer_op.live_send_dm_single(
							this.send_dm_pg,
							dm_msg,
							cheat_mode
						);
					} else {
						let resp = await BAPI.live_send_msg(
							this.send_dm_pg,
							dm_msg,
							room_id,
							this.csrf,
							visit_id
						);
						if (resp.code != 0 && resp.code != 10031) {
							console.error(
								`发生未知错误！响应为：${JSON.stringify(
									resp
								)}\n参数：${JSON.stringify({
									dm_msg: dm_msg,
									room_id: room_id,
									csrf: this.csrf,
									visit_id: visit_id,
								})}`
							);
							this.stop_flag = true;
							throw `发生未知错误！响应为：${JSON.stringify(
								resp
							)}`;
						}
						await sleep(6e3);
					}
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
						await pptr_op.check_page_is_front(this.send_dm_pg);
						if (op_mode != "API") {
							await live_op.polymer_op.live_send_dm_single(
								this.send_dm_pg,
								dm,
								cheat_mode
							);
						} else {
							if (!this.csrf) {
								this.csrf = await pptr_op.get_bili_cjt(
									this.send_dm_pg
								);
							}
							let resp = await BAPI.live_send_msg(
								this.send_dm_pg,
								dm_msg,
								room_id,
								this.csrf,
								visit_id
							);
							if (resp.code != 0 && resp.code != 10031) {
								console.error(
									`发生未知错误！响应为：${JSON.stringify(
										resp
									)}\n参数：${JSON.stringify({
										dm_msg: dm_msg,
										room_id: room_id,
										csrf: this.csrf,
										visit_id: visit_id,
									})}`
								);
								this.stop_flag = true;
								throw `发生未知错误！响应为：${JSON.stringify(
									resp
								)}`;
							}
							await sleep(1e3);
						}
					}
				}
				if (Date.now() / 1e3 - this.send_ts > 1e3) {
					this.stop_flag = true;
					break;
				}
			}
		} catch (e) {
			console.error(`直播发弹幕出错，暂停1分钟！${e}\n${e.stack}`);
			this.stop_flag = true;
			this.Error_flag = true;
			setTimeout(() => {
				this.Error_flag = false;
			}, 60e3);
			return;
		} finally {
			setTimeout(async () => {
				if (this.send_dm_pg && !this.send_dm_pg.isClosed()) {
					await this.send_dm_pg.close();
				}
			}, 10e3);
		}
		this.sending_flag = false;
	};
}

module.exports = {
	live_dm_wss_service,
};
