const { Page } = require("puppeteer-core");
const { DO_Lottery } = require("../木偶模块/puppeteer_lottery");
const utl = require("../木偶模块/util/common_utl");
const { sleep } = require("../木偶模块/puppeteer_lottery.js");
const axios = require("axios");
const fs = require("fs");
const { BAPI } = require("../lib/helper/BAPI.js");
const live_op = {
	element_map: {
		//存放元素路径
		dm_send_btn: ".bl-button--primary.bl-button--small", //发送弹幕按钮
		dm_input_box: ".chat-input.border-box", //弹幕输入框
		like_btn: ".like-btn",
		anchor_icon: ".anchor-lot-icon",
		anchor_join_btn: ".join-btn-1",
		contribution_btn: ".switch-btn-bg.live-skin-highlight-bg", //贡献值下拉框按钮
	},
	/**
	 * 初始化一个新的页面，专门进行直播操作，并注册一个拦截直播流的事件
	 * @param {Page} pg
	 * @param {DO_Lottery} DO_Lottery_class
	 * @returns {Page} 返回创建的新的页面对象
	 */
	live_page_init: async (pg, DO_Lottery_class) => {
		if (!pg || (await pg.browser().pages()).length === 0) {
			let temp = DO_Lottery_class.broswer_mode;
			DO_Lottery_class.broswer_mode = 1;
			await DO_Lottery_class.main();
			DO_Lottery_class.broswer_mode = temp;
			pg = DO_Lottery_class.global_page;
		}
		let new_pg = await (await pg.browser()).newPage();
		await new_pg.setRequestInterception(true);
		new_pg.on("request", async (interceptedRequest) => {
			try {
				//拦截直播流
				if (interceptedRequest.url().includes("bilivideo")) {
					interceptedRequest.abort();
					// console.log(`成功拦截直播流：${interceptedRequest.url()}`);
					return;
				}
				if (interceptedRequest.method().toLowerCase() == "post") {
					if (
						interceptedRequest
							.url()
							.includes("data.bilibili.com/log/web?013324")
					) {
						//如果是浏览器要发起检测到作弊的请求，就拦截下来，不让它发出去！
						interceptedRequest.abort();
						//console.log(`成功拦截科技识别请求：${interceptedRequest.url()}`);
						return;
					}
				}
				interceptedRequest.continue();
			} catch (e) {
				console.warn(`拦截请求：${interceptedRequest.url()}失败`, e);
			}
		});
		return new_pg;
	},
	basic_op: {
		/**
		 * @param {Page} pg
		 * @param {String} dm_msg
		 */
		input_dm: async (pg, dm_msg) => {
			let msg_box;
			await pg.waitForSelector(live_op.element_map.dm_input_box, {
				timeout: 10e3,
			});
			msg_box = (await pg.$$(live_op.element_map.dm_input_box))[-1];
			await msg_box.click();
			let msg_box_content = await pg.$eval(
				live_op.element_map.dm_input_box,
				(el) => el.value
			);
			let _bt = 0;
			while (msg_box_content != dm_msg) {
				//回复栏里的东西等于回复内容时break
				await msg_box.click();
				await sleep(
					utl.random_choice(
						3 * lottery_setting.Working_clearance_time
					)
				);
				await msg_box.type(dm_msg, { delay: 20 });
				await sleep(1e3);
				msg_box_content = (
					await pg.$$eval(live_op.element_map.dm_input_box, (els) =>
						els.map((el) => el.value)
					)
				).join("");
				if (
					utl.remove_invisible_char(
						msg_box_content.replaceAll(
							/[\uD800-\uDBFF][\uDC00-\uDFFF]/g,
							""
						)
					) !=
					utl.remove_invisible_char(
						dm_msg.replaceAll(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "")
					)
				) {
					//如果不等就删掉重新输入
					await sleep(1e3);
					await msg_box.click();
					await pg.keyboard.down("Control");
					await pg.keyboard.press("A");
					await pg.keyboard.up("Control");
					await sleep(1e3);
					await pg.keyboard.press("Backspace");
					console.log(
						"输入框里内容与评论不符，删除输入框里内容",
						`\nmsg_box_content:${msg_box_content}\ndm_msg:${dm_msg}`
					);
				} else {
					//相等了break出去
					break;
				}
				if (_bt >= 5) {
					this.API.chatLog("弹幕输入失败");
					throw `弹幕输入失败`;
				}
				_bt += 1;
			}
		},
		send_dm: async (pg) => {
			await pg.click(live_op.element_map.dm_send_btn);
		},
		/**
		 * 点赞直播间，每15次赞增加一点直播间贡献值
		 * @param {Page} pg
		 */
		click_like: async (pg) => {
			let like_btn;
			try {
				like_btn = await pg.$(live_op.element_map.like_btn);
			} catch (e) {
				console.error(click_like, e);
			}
			if (like_btn) {
				await like_btn.click();
				console.debug("点赞直播间");
				return true;
			}
			return false;
		},
	},

	polymer_op: {
		//通过一般操作组合成一套完整的操作
		/**
		 * 无限循环发送弹幕
		 * @param {Page} pg
		 * @param {String} dm_msg
		 * @param {boolean} cheat_mode
		 */
		live_send_dm_loop: async (pg, dm_msg, cheat_mode = false) => {
			let dm_list = [dm_msg];
			if (cheat_mode) {
				for (let i = 1; i < 30 - dm_msg.length; i++) {
					dm_list.push(dm_msg + " ".repeat(i));
				}
			}
			while (1) {
				for (let msg of dm_list) {
					await live_op.basic_op.input_dm(pg, msg);
					await sleep(100);
					await live_op.basic_op.send_dm(pg, msg);
					if (!cheat_mode) {
						await sleep(6 * 1e3);
					} else {
						await sleep(500);
					}
				}
			}
		},
		live_send_dm_single: async (pg, dm_msg) => {
			let dm_list = [dm_msg];
			for (let msg of dm_list) {
				await live_op.basic_op.input_dm(pg, msg);
				await sleep(100);
				await live_op.basic_op.send_dm(pg, msg);
				if (!cheat_mode) {
					await sleep(6 * 1e3);
				} else {
					await sleep(500);
				}
			}
		},
		/**
		 * 增加直播间贡献值
		 * @param {Page} pg
		 * @param {number} times
		 */
		increase_ContributionRank: async (pg, times = 10) => {
			try {
				if (times <= 0) {
					return;
				}
				let click_like_flag = true;
				for (let i = 0; i < times; i++) {
					for (let j = 0; j < 20; j++) {
						if (!(await live_op.basic_op.click_like(pg))) {
							click_like_flag = false;
							break;
						} else {
							await sleep(utl.random_choice([5, 6, 7, 8, 9, 10]));
						}
					}
					await pg.waitForResponse(el=>el.url().includes('likeReportV3'))
					if (!click_like_flag) {
						break;
					}
				}
				if (!click_like_flag) {
					let dm_list = ["[dog]", "[妙]", "[哇]"];
					//如果是发评论就只发送一半的次数
					for (let i = 0; i < Math.ceil(times / 2); i++) {
						let dm = utl.random_choice(dm_list);
						await live_op.polymer_op.live_send_dm_single(pg, dm);
						await sleep(5e3);
					}
				}
			} catch (e) {
				console.error(`increase_ContributionRank`, e);
			}
		},
	},
};
class API {
	constructor(uname) {
		this.uname = uname;
	}
	chatLog = (text, type = "info") => {
		let dateTime_str = new Date().toLocaleString();
		switch (type) {
			case "info": {
				console.log(`【${this.uname}】${text}  --${dateTime_str}`);
				break;
			}
			case "warning": {
				console.warn(`【${this.uname}】${text}  --${dateTime_str}`);
				break;
			}
			case "error": {
				console.error(`【${this.uname}】${text}  --${dateTime_str}`);
				break;
			}
			default: {
				console.debug(`【${this.uname}】${text}  --${dateTime_str}`);
				break;
			}
		}
	};
}

class LOT_LOG {
	constructor(uname) {
		this.uname = uname;
		this.__file_dir = "./直播模块/log/";
	}
	log_write = (text, lot_type) => {
		try {
			if (
				fs.existsSync(this.__file_dir + this.uname + lot_type + ".csv")
			) {
				fs.writeFileSync(
					this.__file_dir + this.uname + lot_type + ".csv",
					`【${
						this.uname
					}】\t${text}\t${new Date().toLocaleString()}\n`,
					{
						flag: "a+",
						encoding: "utf-8",
					}
				);
			} else {
				fs.writeFileSync(
					this.__file_dir + this.uname + lot_type + ".csv",
					`【${
						this.uname
					}】\t${text}\t${new Date().toLocaleString()}\n`,
					{
						flag: "w",
						encoding: "utf-8",
					}
				);
			}
		} catch (e) {
			console.error(`日志写入文件失败！${e}`);
		}
	};
	
}

class LIVE_LOT {
	/**
	 * 遇到一个抽奖就创建一个新的页面，而不是新的class
	 * @param {DO_Lottery} DO_Lottery_instance DO_Lottery的实例
	 */
	constructor(DO_Lottery_instance) {
		this.__DO_Lottery_class = DO_Lottery_instance;
		this.__origin_pg = DO_Lottery_instance.global_page;
		this.live_pg;
		this.API = new API();
		this.CONFIG = {
			live_info: {
				csrf: "",
				uid: 0,
				uname: "",
				user_level: 0,
				ALLFollowingList: [],
			},
			redpacket: {
				joined_redpacket_lot_id_list: [],
				max_joined_switch: false,
				join_risk_mark: false, //红包风控标志
				risk_sleeptime: 60 * 60 * 1e3, //风控等待时间
				times: {
					success: 0,
					fail: 0,
				}, //参加次数
			},
			anchor: {
				joined_anchor_id_list: [],
				max_joined_switch: false,
				join_risk_mark: false, //天选抽奖风控标志
				risk_sleeptime: 60 * 60 * 1e3, //风控等待时间
				times: {
					success: 0,
					fail: 0,
				}, //参加次数
			},
			TIME: {
				lot_sep_time: 30e3, //抽奖间隔时间30秒
			},
			RECORDER: {
				lot_id: [],
			},
		};
		this.dm_list = ["[dog]", "[妙]", "[哇]"]; //随机发送弹幕的列表
		this.Lot_log;
		this.Start_Date = new Date();
		console.log(`创建了新的直播抽奖实例`);
	}
	/**
	 * 初始化一个新的页面，专门用来抽直播抽奖
	 */
	init = async () => {
		try {
			this.live_pg = await live_op.live_page_init(
				this.__origin_pg,
				this.__DO_Lottery_class
			);
			this.live_pg.on("response", async (resp) => {
				if (resp.url().includes("get_user_info")) {
					let response = await resp.json();
					if (response.code == 0) {
						this.CONFIG.live_info.uname = response?.data?.uname;
						this.CONFIG.live_info.uid = response?.data?.uid;
						this.CONFIG.live_info.user_level =
							response?.data?.user_level;
					}
				}
			});
			this.live_pg.goto(
				"https://live.bilibili.com/?spm_id_from=333.1007.0.0"
			);
			let response = await (
				await this.live_pg.waitForResponse((resp) =>
					resp.url().includes("get_user_info")
				)
			).json();
			if (response.code == 0) {
				this.CONFIG.live_info.uname = response?.data?.uname;
				this.CONFIG.live_info.uid = response?.data?.uid;
				this.CONFIG.live_info.user_level = response?.data?.user_level;
			}
			this.API = new API(this.CONFIG.live_info.uname);
			this.Lot_log = new LOT_LOG(this.CONFIG.live_info.uname);
			await this.#init_following_list();
			await this.live_pg.goto("about:blank");
		} catch (e) {
			this.API.chatLog(`初始化一个新的页面失败！${e}`, "error");
			throw e;
		}
	};
	/**
	 * 初始化关注人数
	 */
	#init_following_list = async () => {
		while (!this.CONFIG.live_info.uid) {
			await this.live_pg.goto(
				"https://live.bilibili.com/?spm_id_from=333.1007.0.0"
			);
			await sleep(3e3);
		}
		if (!this.live_pg.url().includes("bilibili")) {
			await this.live_pg.goto(
				"https://live.bilibili.com/?spm_id_from=333.1007.0.0"
			);
		}
		await BAPI.get_attention_list(
			this.live_pg,
			this.CONFIG.live_info.uid
		).then(async (data) => {
			if (data.code == 0) {
				this.API.chatLog(`全部关注数：【${data.data.list.length}】个`);
				this.CONFIG.live_info.ALLFollowingList = data.data.list;
				if (data.data.list.length > 2800) {
					this.API.chatLog(
						`直播主播关注数达到${data.data.list.length}，注意满3000关注后，将无法新增关注，会影响中奖！`,
						"warning"
					);
				}
			}
		});
	};

	/**
	 * 参加红包抽奖
	 * @param {Page} pg
	 */
	#join_redpacket_lot = async (
		pg,
		room_id,
		anchor_uid,
		lot_id,
		total_price
	) => {
		try {
			if (!this.CONFIG.live_info.csrf) {
				//获取csrf
				if (!pg.url().includes("bilibili")) {
					await pg.goto("https://www.bilibili.com");
				}
				let all_cookies = await pg.cookies();
				let bili_cookie = all_cookies.filter((el) =>
					el.domain.includes("bilibili.com")
				);
				let csrf = bili_cookie
					.filter((el) => el.name == "bili_jct")
					.pop().value;
				this.CONFIG.live_info.csrf = csrf;
			} //获取csrf
			this.CONFIG.redpacket.joined_redpacket_lot_id_list.push(lot_id);
			if (
				this.CONFIG.redpacket.joined_redpacket_lot_id_list.length > 200
			) {
				this.CONFIG.redpacket.joined_redpacket_lot_id_list =
					this.CONFIG.redpacket.joined_redpacket_lot_id_list.slice(
						-50
					);
			}
			await sleep(5e3);
			let resp_data = await pg.evaluate(
				async (roomid, anchor_uid, csrf_token, lot_id) => {
					var formData = new FormData();
					formData.set("visit_id", "");
					formData.set("session_id", "");
					formData.set("room_id", roomid);
					formData.set("jump_from", "");
					formData.set("ruid", anchor_uid);
					formData.set(
						"spm_id",
						"live.live-room-detail.red-envelope.extract"
					);
					formData.set("jump_from", "23013");
					formData.set("build", "7560400");
					formData.set("c_locale", "zh_CN");
					formData.set("channel", "bili");
					formData.set("device", "android");
					formData.set("disable_rcmd", 0);
					formData.set("mobi_app", "android");
					formData.set("platform", "android");
					formData.set("version", "7.56.0");
					formData.set(
						"statistics",
						"%7B%22appId%22%3A1%2C%22platform%22%3A3%2C%22version%22%3A%227.56.0%22%2C%22abtest%22%3A%22%22%7D"
					);
					formData.set("csrf", csrf_token);
					formData.set("csrf_token", csrf_token);
					formData.set("lot_id", lot_id);
					let url = `https://api.live.bilibili.com/xlive/lottery-interface/v1/popularityRedPocket/RedPocketDraw`;
					let method = "post";
					let headers = {
						"User-Agent":
							"Mozilla/5.0 BiliDroid/7.56.0 (bbcallen@gmail.com) os/android model/NX709J mobi_app/android build/7560400 channel/bili innerVer/7560400 osVer/9 network/2",
					};
					return await fetch(url, {
						method: method,
						headers: headers,
						credentials: "include",
						body: formData,
					}).then(async (res) => {
						let dat = await res.json();
						return dat;
					});
				},
				room_id,
				anchor_uid,
				this.CONFIG.live_info.csrf,
				lot_id
			);
			if (resp_data.code == 0) {
				this.CONFIG.redpacket.times.success++;
				this.API.chatLog(
					`【直播间电池道具】房间号：https://live.bilibili.com/${room_id} ，直播间道具红包总值${
						total_price / 1000
					}元参与成功！\t${JSON.stringify(resp_data)}`
				);
				this.API.chatLog(`尝试点赞3次直播间`);
				await live_op.polymer_op.increase_ContributionRank(pg, 3);
				await this.#getOnlineGoldRank(pg).then(async (da) => {
					if (da.code == 0) {
						let onlineNum = da.data.count;
						let score = da.data.own_info.score;
						let rank = da.data.own_info.rank;
						this.API.chatLog(
							`【直播间电池道具】目前在线人数：${onlineNum}贡献值：${score}排名：${
								rank == -1
									? da?.data?.own_info?.rank_text
									: rank
							}`,
							"success"
						);
						if (score == 0) {
							if (this.CONFIG.redpacket.join_risk_mark) {
								this.API.chatLog(
									`【直播间电池道具】房间号：https://live.bilibili.com/${room_id}，参加抽奖后直播间无贡献值，可能已经风控！，暂停抽奖${this.CONFIG.redpacket.risk_sleeptime}分钟！`,
									"warning"
								);
							} else {
								this.CONFIG.redpacket.join_risk_mark = true;
								setTimeout(() => {
									this.CONFIG.redpacket.join_risk_mark = false;
								}, this.CONFIG.redpacket.risk_sleeptime);
								this.API.chatLog(
									`【直播间电池道具】${room_id}直播间无贡献值，可能已经风控！`,
									"warning"
								);
							}
							return this.Lot_log.log_write(
								`ERROR\t参加直播间${room_id}道具红包失败！：参加抽奖后直播间无贡献值，可能已经风控！`,
								"道具红包"
							);
						}

						if (score < 10) {
							this.API.chatLog(
								`【直播间电池道具】开始在直播间${room_id}尝试增加${
									10 - score
								}点贡献值`
							);
							await live_op.polymer_op.increase_ContributionRank(
								pg,
								10 - score
							);
						}
					} else {
						this.API.chatLog(
							`获取直播间贡献值失败！${JSON.stringify(da)}`
						);
						this.CONFIG.redpacket.join_risk_mark = true;
						setTimeout(() => {
							this.CONFIG.redpacket.join_risk_mark = false;
						}, this.CONFIG.redpacket.risk_sleeptime);
					}
				});
			} else if (resp_data.code == 1009109) {
				// 每日上限
				this.CONFIG.redpacket.times.fail++;
				this.CONFIG.redpacket.max_joined_switch = true;
				this.API.chatLog(
					`【直播间电池道具】达到每日上限！${room_id}直播间道具红包参与反馈：${JSON.stringify(
						resp_data
					)}`,
					"warning"
				);
			} else if (resp_data.code == 1009114) {
				// 已抽奖
				this.CONFIG.redpacket.times.fail++;
				this.CONFIG.redpacket.join_risk_mark = true;
				this.API.chatLog(
					`【直播间电池道具】${room_id}直播间道具红包参与反馈：${JSON.stringify(
						resp_data
					)}`,
					"warning"
				);
			} else {
				this.CONFIG.redpacket.times.fail++;
				this.CONFIG.redpacket.join_risk_mark = true;
				this.API.chatLog(
					`【直播间电池道具】${room_id}直播间道具红包参与反馈：${JSON.stringify(
						resp_data
					)}`,
					"warning"
				);
			}

			this.API.chatLog(
				`【直播间电池道具】参加直播间${room_id}道具红包反馈：${JSON.stringify(
					resp_data
				)}`
			);
			this.Lot_log.log_write(
				`SUCCESS\t参加直播间${room_id}道具红包反馈：${JSON.stringify(
					resp_data
				)}`,
				"道具红包"
			);
		} catch (e) {
			this.CONFIG.redpacket.times.fail++;
			this.API.chatLog(`参加红包抽奖失败！${e}`, "error");
			this.Lot_log.log_write(
				`ERROR\t参加直播间${room_id}道具红包失败！：${e.toString()}`,
				"道具红包"
			);
			throw e;
		}
	};
	/**
	 * 获取直播贡献值
	 * @param {Page} pg
	 * @returns {Promise<JSON>} 返回直播贡献值的json
	 */
	#getOnlineGoldRank = async (pg) => {
		try {
			pg.click(live_op.element_map.contribution_btn);
			let resp = await pg.waitForResponse((resp) =>
				resp.url().includes("queryContributionRank")
			);
			await sleep(1e3);
			await pg.click(live_op.element_map.contribution_btn);
			return await resp.json();
		} catch (e) {
			this.API.chatLog(`获取直播贡献值失败！${e}`);
			throw e;
		}
	};
	/**
	 * 参加天选抽奖
	 * @param {Page} pg
	 * @returns
	 */
	#join_anchor_lot = async (
		pg,
		lot_id,
		gift_num,
		gift_price,
		anchor_uid,
		room_id,
		require_type
	) => {
		try {
			let unusual_mark = false;
			if (
				this.CONFIG.live_info.ALLFollowingList.indexOf(anchor_uid) ==
					-1 &&
				require_type != 0
			) {
				await BAPI.IsUserFollow(pg, anchor_uid).then(async (data) => {
					if (data.code == 0) {
						if (!data.data.follow) {
							unusual_mark = true; //参加抽奖前、是需要关注的抽奖、确认是未关注状态
						}
					}
				});
			}
			this.CONFIG.anchor.joined_anchor_id_list.push(lot_id);
			if (this.CONFIG.anchor.joined_anchor_id_list.length > 200) {
				this.CONFIG.anchor.joined_anchor_id_list =
					this.CONFIG.anchor.joined_anchor_id_list.slice(-50);
			}
			await sleep(5e3);
			let anchor_icon = await pg.$(live_op.element_map.anchor_icon);
			if (!anchor_icon) {
				//没有获取到天选抽奖的图标
				console.error(`没有获取到天选抽奖的图标`);
				return this.Lot_log.log_write(
					`ERROR\t参加直播间${room_id}天选抽奖失败，原因：没有获取到天选抽奖的图标！`,
					"天选抽奖"
				);
			}
			await anchor_icon.click();
			await sleep(1e3);
			let anchor_join_btn = await pg.$(
				live_op.element_map.anchor_join_btn
			);
			if (!anchor_icon) {
				console.error(`没有获取到天选抽奖参加的按钮`);
				return this.Lot_log.log_write(
					`ERROR\t参加直播间${room_id}天选抽奖失败，原因：没有获取到天选抽奖参加的按钮！`,
					"天选抽奖"
				);
			}
			await anchor_join_btn.click();
			let anchor_join_resp = await pg.waitForResponse((resp) =>
				resp.url().includes("xlive/lottery-interface/v1/Anchor/Join")
			);
			let anchor_join_json = await anchor_join_resp.json();
			if ((anchor_join_json.code == 400) & (gift_num * gift_price != 0)) {
				console.log(
					`【天选抽奖 ${
						this.CONFIG.live_info.uname
					}】 参与 【${pg.url()}】 金瓜子余额不足!`
				);
				return;
			}
			if (anchor_join_json.code == 0) {
				this.API.chatLog(`尝试点赞3次直播间`);
				await live_op.polymer_op.increase_ContributionRank(pg, 3);
				await this.#getOnlineGoldRank(pg).then(async (da) => {
					if (da.code == 0) {
						let onlineNum = da.data.count;
						let score = da.data.own_info.score;
						let rank = da.data.own_info.rank;
						this.API.chatLog(
							`【天选时刻】目前在线人数：${onlineNum} 贡献值：${score} 排名：${rank}`
						);
						if (score == 0) {
							if (this.CONFIG.anchor.join_risk_mark) {
								this.API.chatLog(
									`【天选时刻】房间号：https://live.bilibili.com/${room_id}，参加抽奖后直播间无贡献值，可能已经风控！暂停抽奖${this.CONFIG.anchor.risk_sleeptime}分钟！`,
									"warning"
								);
							} else {
								this.CONFIG.anchor.join_risk_mark = true;
								setTimeout(() => {
									this.CONFIG.anchor.join_risk_mark = false;
								}, this.CONFIG.anchor.risk_sleeptime);
								this.API.chatLog(
									`【天选时刻】${room_id}直播间无贡献值，可能已经风控！`,
									"warning"
								);
							}
							return;
						}
						if (score < 10) {
							this.API.chatLog(
								`【天选时刻】开始在直播间${room_id}尝试增加${
									10 - score
								}点贡献值！`
							);
							await live_op.polymer_op.increase_ContributionRank(
								pg,
								10 - score
							);
						}
					}
				});
			} else {
				this.CONFIG.anchor.join_risk_mark = true;
			}
			if (unusual_mark) {
				//查看是否关注，如果关注失败则账号被风控！
				BAPI.IsUserFollow(pg, anchor_uid).then(async (data) => {
					if (data.code == 0) {
						if (!data.data.follow) {
							//参加抽奖后还是未关注状态判断为异常
							unusual_stop = true;
							console.log(
								`【天选时刻 ${
									this.CONFIG.live_info.uname
								}】检测到${room_id}关注异常，暂停抽奖${
									this.CONFIG.anchor.risk_sleeptime /
									60 /
									1000
								}分钟！`
							);
							setTimeout(async () => {
								this.CONFIG.anchor.join_risk_mark = false;
							}, this.CONFIG.anchor.risk_sleeptime);
						} else {
							this.CONFIG.live_info.ALLFollowingList.push(
								anchor_uid
							);
						}
					}
				});
			}
			this.Lot_log.log_write(
				`SUCCESS\t参加直播间${room_id}天选抽奖反馈：${anchor_join_resp}`,
				"天选抽奖"
			);
		} catch (e) {
			this.API.chatLog(`天选抽奖失败！${e}`);
			this.Lot_log.log_write(
				`ERROR\t参加直播间${room_id}天选抽奖失败！${e.toString()}`,
				"天选抽奖"
			);
			throw e;
		}
	};
	/**
	   * 
	   * @returns {Promise<Array>} 抽奖数据
		*   'lot_id': popularity_red_pocket.lot_id,
			'anchor_uid': self.get_roomid_2_uid(popularity_red_pocket.room_id),
			'room_id': popularity_red_pocket.room_id,
			'end_time': popularity_red_pocket.end_time,
			'total_price':popularity_red_pocket.total_price
			=============================

			'lot_id': anchor.server_data_id,
			'gift_num': anchor.gift_num,
			'gift_price': anchor.gift_price,
			'anchor_uid': anchor.anchor_uid,
			'room_id': anchor.room_id,
			'require_type': anchor.require_type
			'end_time': anchor.current_time + anchor.time
	   */
	#get_data_from_server = async () => {
		try {
			let url = "http://127.0.0.1:23333/v1/get/live_lots/";
			return await axios.get(url).then((resp) => {
				return resp.data;
			});
		} catch (e) {
			this.API.chatLog(`获取服务器数据失败！${e}`, "error");
			return [];
		}
	};
	#getvisit_id = (name = this.CONFIG.live_info.uid) => {
		let str = "xxxxxxxxxxxx".replace(/[x]/g, function (name) {
			let randomInt = (16 * Math.random()) | 0;
			return ("x" === name ? randomInt : (3 & randomInt) | 8)
				.toString(16)
				.toLowerCase();
		});
		return str;
	};
	/**
	 * 检查是否是第二天，如果是第二天则重置一些参数
	 */
	#check_new_day = () => {
		let now = new Date();
		if (this.Start_Date.getDay() != now.getDay()) {
			this.CONFIG.anchor.max_joined_switch = false;
			this.CONFIG.redpacket.max_joined_switch = false;
			this.Start_Date = new Date();
		}
	};
	main = async () => {
		this.#check_new_day();
		if (!this.live_pg || this.live_pg.isClosed()) {
			await this.init();
		}
		let lot_data = await this.#get_data_from_server();
		lot_data.sort((a, b) => a.end_time - b.end_time);
		for (let da of lot_data)
			try {
				{
					if (!this.live_pg || this.live_pg.isClosed()) {
						await this.init();
					}
					if (!this.CONFIG.live_info.uname) {
						this.API.chatLog(`账号登录状态出错！退出！`, "error");
						return;
					}
					if (this.CONFIG.RECORDER.lot_id.includes(da.lot_id)) {
						continue;
					}
					this.CONFIG.RECORDER.lot_id.push(da.lot_id);
					if (this.CONFIG.RECORDER.lot_id.length > 200) {
						this.CONFIG.RECORDER.lot_id =
							this.CONFIG.RECORDER.lot_id.slice(-100);
					}
					if (da.end_time - Date.now() / 1000 < 30) {
						this.API.chatLog(
							`当前抽奖剩余时间小于30秒，跳过\t${JSON.stringify(
								da
							)} ${Math.ceil(da.end_time - Date.now() / 1000)}`
						);
						continue;
					}
					if (da.total_price) {
						//如果是红包抽奖
						if (
							this.CONFIG.redpacket.max_joined_switch ||
							this.CONFIG.redpacket.join_risk_mark
						) {
							this.API.chatLog(
								`【直播间电池道具】可能已经风控！\t${JSON.stringify(
									da
								)}`,
								"warning"
							);
							continue;
						}
						let url = `https://live.bilibili.com/${
							da.room_id
						}?live_from=71002&visit_id=${this.#getvisit_id(
							this.CONFIG.live_info.uid
						)}`;
						this.API.chatLog(
							`【直播间电池道具】开始红包抽奖 ${url} `
						);
						await this.live_pg.goto(url);
						await this.#join_redpacket_lot(
							this.live_pg,
							da.room_id,
							da.anchor_uid,
							da.lot_id,
							da.total_price
						);
						await sleep(
							(da.end_time - Date.now() / 1000) * 1e3 + 5e3
						); //同一时间只抽一个奖
						await this.live_pg.goto(`about:blank`); //抽完了就进入空白页节省资源
						await sleep(this.CONFIG.TIME.lot_sep_time);
						continue;
					} else {
						//天选抽奖
						if (
							this.CONFIG.anchor.join_risk_mark ||
							this.CONFIG.anchor.max_joined_switch
						) {
							this.API.chatLog(
								`【天选时刻】可能已经风控！`,
								"warning"
							);
							continue;
						}
						let url = `https://live.bilibili.com/${
							da.room_id
						}?live_from=71002&visit_id=${this.#getvisit_id(
							this.CONFIG.live_info.uid
						)}`;
						this.API.chatLog(`开始天选抽奖 ${url} `);
						await this.live_pg.goto(url);
						await this.#join_anchor_lot(
							this.live_pg,
							da.lot_id,
							da.gift_num,
							da.gift_price,
							da.anchor_uid,
							da.room_id,
							da.require_type
						);
						await sleep(
							(da.end_time - Date.now() / 1000) * 1e3 + 5e3
						); //同一时间只抽一个奖
						await this.live_pg.goto(`about:blank`); //抽完了就进入空白页节省资源
						await sleep(this.CONFIG.TIME.lot_sep_time);
						continue;
					}
				}
			} catch (e) {
				this.API.chatLog(`处理数据失败！`, "error");
			}
		setTimeout(this.main, 1e3);
	};
}

module.exports = { LIVE_LOT };
