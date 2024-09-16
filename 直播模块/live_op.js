/*
 * @Author: 星瞳 1944637830@qq.com
 * @Date: 2023-11-07 22:44:13
 * @LastEditors: 星瞳 1944637830@qq.com
 * @LastEditTime: 2024-08-23 09:53:35
 * @FilePath: \tampermonkey\直播模块\live_op.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
/**
 * 直播抽奖功能
 */
const { Page } = require("puppeteer-core");
const { event_bus, EVENT_NAME_MAP } = require("../lib/helper/event_bus"); //注册事件用的，每一轮都要重新注册！
const { sleep, pptr_op } = require("../木偶模块/util/common_utl");
const { DO_Lottery } = require("../木偶模块/puppeteer_lottery");
const axios = require("axios");
const fs = require("fs");
const { BAPI } = require("../lib/helper/BAPI.js");
const { API } = require("./LIVETOOL");
const GLOBAL_CONFIG = require("../CONFIG.Default");
const utl = {
	random_choice: function (input_list) {
		let index = Math.floor(Math.random() * input_list.length);
		return input_list[index];
	},
	remove_invisible_char(origin_str) {
		let reg =
			/[\0-\x1F\x7F-\x9F\xAD\u0378\u0379\u037F-\u0383\u038B\u038D\u03A2\u0528-\u0530\u0557\u0558\u0560\u0588\u058B-\u058E\u0590\u05C8-\u05CF\u05EB-\u05EF\u05F5-\u0605\u061C\u061D\u06DD\u070E\u070F\u074B\u074C\u07B2-\u07BF\u07FB-\u07FF\u082E\u082F\u083F\u085C\u085D\u085F-\u089F\u08A1\u08AD-\u08E3\u08FF\u0978\u0980\u0984\u098D\u098E\u0991\u0992\u09A9\u09B1\u09B3-\u09B5\u09BA\u09BB\u09C5\u09C6\u09C9\u09CA\u09CF-\u09D6\u09D8-\u09DB\u09DE\u09E4\u09E5\u09FC-\u0A00\u0A04\u0A0B-\u0A0E\u0A11\u0A12\u0A29\u0A31\u0A34\u0A37\u0A3A\u0A3B\u0A3D\u0A43-\u0A46\u0A49\u0A4A\u0A4E-\u0A50\u0A52-\u0A58\u0A5D\u0A5F-\u0A65\u0A76-\u0A80\u0A84\u0A8E\u0A92\u0AA9\u0AB1\u0AB4\u0ABA\u0ABB\u0AC6\u0ACA\u0ACE\u0ACF\u0AD1-\u0ADF\u0AE4\u0AE5\u0AF2-\u0B00\u0B04\u0B0D\u0B0E\u0B11\u0B12\u0B29\u0B31\u0B34\u0B3A\u0B3B\u0B45\u0B46\u0B49\u0B4A\u0B4E-\u0B55\u0B58-\u0B5B\u0B5E\u0B64\u0B65\u0B78-\u0B81\u0B84\u0B8B-\u0B8D\u0B91\u0B96-\u0B98\u0B9B\u0B9D\u0BA0-\u0BA2\u0BA5-\u0BA7\u0BAB-\u0BAD\u0BBA-\u0BBD\u0BC3-\u0BC5\u0BC9\u0BCE\u0BCF\u0BD1-\u0BD6\u0BD8-\u0BE5\u0BFB-\u0C00\u0C04\u0C0D\u0C11\u0C29\u0C34\u0C3A-\u0C3C\u0C45\u0C49\u0C4E-\u0C54\u0C57\u0C5A-\u0C5F\u0C64\u0C65\u0C70-\u0C77\u0C80\u0C81\u0C84\u0C8D\u0C91\u0CA9\u0CB4\u0CBA\u0CBB\u0CC5\u0CC9\u0CCE-\u0CD4\u0CD7-\u0CDD\u0CDF\u0CE4\u0CE5\u0CF0\u0CF3-\u0D01\u0D04\u0D0D\u0D11\u0D3B\u0D3C\u0D45\u0D49\u0D4F-\u0D56\u0D58-\u0D5F\u0D64\u0D65\u0D76-\u0D78\u0D80\u0D81\u0D84\u0D97-\u0D99\u0DB2\u0DBC\u0DBE\u0DBF\u0DC7-\u0DC9\u0DCB-\u0DCE\u0DD5\u0DD7\u0DE0-\u0DF1\u0DF5-\u0E00\u0E3B-\u0E3E\u0E5C-\u0E80\u0E83\u0E85\u0E86\u0E89\u0E8B\u0E8C\u0E8E-\u0E93\u0E98\u0EA0\u0EA4\u0EA6\u0EA8\u0EA9\u0EAC\u0EBA\u0EBE\u0EBF\u0EC5\u0EC7\u0ECE\u0ECF\u0EDA\u0EDB\u0EE0-\u0EFF\u0F48\u0F6D-\u0F70\u0F98\u0FBD\u0FCD\u0FDB-\u0FFF\u10C6\u10C8-\u10CC\u10CE\u10CF\u1249\u124E\u124F\u1257\u1259\u125E\u125F\u1289\u128E\u128F\u12B1\u12B6\u12B7\u12BF\u12C1\u12C6\u12C7\u12D7\u1311\u1316\u1317\u135B\u135C\u137D-\u137F\u139A-\u139F\u13F5-\u13FF\u169D-\u169F\u16F1-\u16FF\u170D\u1715-\u171F\u1737-\u173F\u1754-\u175F\u176D\u1771\u1774-\u177F\u17DE\u17DF\u17EA-\u17EF\u17FA-\u17FF\u180F\u181A-\u181F\u1878-\u187F\u18AB-\u18AF\u18F6-\u18FF\u191D-\u191F\u192C-\u192F\u193C-\u193F\u1941-\u1943\u196E\u196F\u1975-\u197F\u19AC-\u19AF\u19CA-\u19CF\u19DB-\u19DD\u1A1C\u1A1D\u1A5F\u1A7D\u1A7E\u1A8A-\u1A8F\u1A9A-\u1A9F\u1AAE-\u1AFF\u1B4C-\u1B4F\u1B7D-\u1B7F\u1BF4-\u1BFB\u1C38-\u1C3A\u1C4A-\u1C4C\u1C80-\u1CBF\u1CC8-\u1CCF\u1CF7-\u1CFF\u1DE7-\u1DFB\u1F16\u1F17\u1F1E\u1F1F\u1F46\u1F47\u1F4E\u1F4F\u1F58\u1F5A\u1F5C\u1F5E\u1F7E\u1F7F\u1FB5\u1FC5\u1FD4\u1FD5\u1FDC\u1FF0\u1FF1\u1FF5\u1FFF\u200B-\u200F\u202A-\u202E\u2060-\u206F\u2072\u2073\u208F\u209D-\u209F\u20BB-\u20CF\u20F1-\u20FF\u218A-\u218F\u23F4-\u23FF\u2427-\u243F\u244B-\u245F\u2700\u2B4D-\u2B4F\u2B5A-\u2BFF\u2C2F\u2C5F\u2CF4-\u2CF8\u2D26\u2D28-\u2D2C\u2D2E\u2D2F\u2D68-\u2D6E\u2D71-\u2D7E\u2D97-\u2D9F\u2DA7\u2DAF\u2DB7\u2DBF\u2DC7\u2DCF\u2DD7\u2DDF\u2E3C-\u2E7F\u2E9A\u2EF4-\u2EFF\u2FD6-\u2FEF\u2FFC-\u2FFF\u3040\u3097\u3098\u3100-\u3104\u312E-\u3130\u318F\u31BB-\u31BF\u31E4-\u31EF\u321F\u32FF\u4DB6-\u4DBF\u9FCD-\u9FFF\uA48D-\uA48F\uA4C7-\uA4CF\uA62C-\uA63F\uA698-\uA69E\uA6F8-\uA6FF\uA78F\uA794-\uA79F\uA7AB-\uA7F7\uA82C-\uA82F\uA83A-\uA83F\uA878-\uA87F\uA8C5-\uA8CD\uA8DA-\uA8DF\uA8FC-\uA8FF\uA954-\uA95E\uA97D-\uA97F\uA9CE\uA9DA-\uA9DD\uA9E0-\uA9FF\uAA37-\uAA3F\uAA4E\uAA4F\uAA5A\uAA5B\uAA7C-\uAA7F\uAAC3-\uAADA\uAAF7-\uAB00\uAB07\uAB08\uAB0F\uAB10\uAB17-\uAB1F\uAB27\uAB2F-\uABBF\uABEE\uABEF\uABFA-\uABFF\uD7A4-\uD7AF\uD7C7-\uD7CA\uD7FC-\uF8FF\uFA6E\uFA6F\uFADA-\uFAFF\uFB07-\uFB12\uFB18-\uFB1C\uFB37\uFB3D\uFB3F\uFB42\uFB45\uFBC2-\uFBD2\uFD40-\uFD4F\uFD90\uFD91\uFDC8-\uFDEF\uFDFE\uFDFF\uFE1A-\uFE1F\uFE27-\uFE2F\uFE53\uFE67\uFE6C-\uFE6F\uFE75\uFEFD-\uFF00\uFFBF-\uFFC1\uFFC8\uFFC9\uFFD0\uFFD1\uFFD8\uFFD9\uFFDD-\uFFDF\uFFE7\uFFEF-\uFFFB\uFFFE\uFFFF]/g;
		return origin_str.replaceAll(reg, "");
	},
};

const live_op = {
	//@TODO 增加一个发送wss消息，模拟观看直播的功能
	element_map: {
		//存放元素路径
		dm_send_btn: ".bl-button--primary.bl-button--small", //发送弹幕按钮
		dm_input_box: ".chat-input.border-box", //弹幕输入框
		like_btn: ".like-btn",
		anchor_icon: ".anchor-lot-icon",
		anchor_join_btn: `[class*="join-btn-"]`,
		contribution_btn: ".switch-btn-bg.live-skin-highlight-bg", //贡献值下拉框按钮
		gift_package: ".gift-control-section .gift-package", //包裹按钮
		gift_item_free: ".gift-item.package.free",
		live_room_treasurebox: {
			round_item: ".round-item", // 金宝箱侧边栏
			join_btn: ".bl-button.bl-button--primary", //参加金宝箱按钮
		},
		rightArrow_btn: ".pointer.arrow-box", //直播的功能展开箭头
		live_player: `#live-player-ctnr`, //直播播放器！
	},
	/**
	 * 初始化一个新的页面，专门进行直播操作，并注册一个拦截直播流的事件
	 * @param {Page} pg
	 * @param {DO_Lottery} DO_Lottery_class
	 * @returns {Promise<Page>} 返回创建的新的页面对象
	 */
	live_page_init: async (DO_Lottery_class) => {
		for (let err_times = 0; ; err_times++) {
			try {
				if (
					!DO_Lottery_class.global_var.page ||
					DO_Lottery_class.global_var.page.isClosed()
				) {
					await DO_Lottery_class.account_init(false);
					await sleep(5e3);
				}
				await pptr_op.check_page_is_front(
					DO_Lottery_class.global_var.page
				);
				let new_br = DO_Lottery_class.global_var.page.browser();
				let new_pg = await new_br.newPage();
				if (!(await pptr_op.check_page_is_front(new_pg))) {
					throw Error(`直播浏览器初始化时切换标签失败！`);
				}
				await new_pg.setRequestInterception(true);
				new_pg.on("request", async (req) => {
					try {
						// 拦截直播流
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
									.includes(
										"data.bilibili.com/log/web?0000"
									) ||
								req
									.url()
									.includes(
										"data.bilibili.com/log/web?001111"
									) ||
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
								req
									.url()
									.includes(
										"cm.bilibili.com/cm/api/fees/pc"
									) ||
								req
									.url()
									.includes(`data.bilibili.com/v2/log/web`)
							) {
								//如果是浏览器要发起检测到作弊的请求，就拦截下来，不让它发出去！
								return req.respond({
									status: 200,
									contentType: "text/plain; charset=utf-8",
									body: "ok",
								});
							}
						}
						req.continue();
					} catch (e) {
						console.warn(`拦截请求：${req.url()}失败`, e);
					}
				});
				await sleep(1e3);
				return new_pg;
			} catch (e) {
				if (err_times > 3) {
					throw e;
				}
				console.error(
					`${DO_Lottery_class.lottery_name}\t直播抽奖浏览器页面初始化失败！${e}\n${e.stack}`
				);
				await sleep(10e3);
			}
		}
	},
	basic_op: {
		/**
		 * 获取visit_id
		 * @param {number} name
		 * @returns
		 */
		get_visit_id: (name = this.CONFIG.live_info.uid) => {
			let str = "xxxxxxxxxxxx".replace(/[x]/g, function (name) {
				let randomInt = (16 * Math.random()) | 0;
				return ("x" === name ? randomInt : (3 & randomInt) | 8)
					.toString(16)
					.toLowerCase();
			});
			return str;
		},
		/**
		 * 移除直播间的播放器元素
		 * @param {Page} pg
		 */
		remove_live_player: async (pg) => {
			try {
				await pg.evaluate(() => {
					window.EmbedPlayer && window.EmbedPlayer.instance.freeze();
				});
				await pg.evaluate((selector) => {
					const elementToRemove = document.querySelector(selector);
					if (elementToRemove) {
						elementToRemove.remove();
					}
				}, live_op.element_map.live_player); //移除播放器
				await pg.evaluate((selector) => {
					const elementToRemove = document.querySelector(selector);
					if (elementToRemove) {
						elementToRemove.remove();
					}
				}, `.EvaRenderer_LayerWrapper`);
			} catch (e) {
				console.error(`${e}\n${e.stack}\n移除直播间的播放器元素失败！`);
			}
		},
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
				console.error(`click_like ${e}\n${e.stack}`);
			}
			if (like_btn) {
				await like_btn.click();
				return true;
			}
			return false;
		},

		read_live_lot_json: () => {
			try {
				if (fs.existsSync(`./live_lot_setting.json`)) {
					let setting = JSON.stringify(
						fs.readFileSync(`./live_lot_setting.json`).toString()
					);
					return setting;
				} else {
					return {
						unignore_anchor_key_word: [
							"手办",
							"ps",
							"旗舰手机",
							"铁三角",
							"海盗船",
							"轻薄本",
							"华硕",
							"ROG",
							"耳机",
							"手机",
							"Mate",
							"mate",
							"Pro",
							"Pro",
						],
					};
				}
			} catch (e) {
				console.error(`读取直播抽奖设定失败！${e}\n${e.stack}`);
			}
		},
	},

	polymer_op: {
		//通过一般操作组合成一套完整的操作
		/**
		 * 无限循环发送弹幕
		 * @param {Page} pg
		 * @param {String} dm_msg
		 * @param {AbortSignal} signal
		 * @param {boolean} cheat_mode
		 */
		live_send_dm_loop: async (pg, dm_msg, signal, cheat_mode = false) => {
			let dm_list = [dm_msg];
			if (cheat_mode) {
				for (let i = 1; i < 30 - dm_msg.length; i++) {
					dm_list.push(dm_msg + " ".repeat(i));
				}
			}
			while (1) {
				for (let msg of dm_list) {
					if (signal.aborted) {
						return;
					}
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
		live_send_dm_single: async (pg, dm_msg, cheat_mode = false) => {
			await live_op.basic_op.input_dm(pg, dm_msg);
			await sleep(100);
			await live_op.basic_op.send_dm(pg, dm_msg);
			if (!cheat_mode) {
				await sleep(6 * 1e3);
			} else {
				await sleep(500);
			}
		},
		BAPI_live_send_dm_single: async (pg, dm_msg, cheat_mode = false) => {
			await BAPI.send_dm(pg, dm_msg);
			if (!cheat_mode) {
				await sleep(6 * 1e3);
			} else {
				await sleep(500);
			}
		},
		/**
		 *
		 * @param {Page} pg
		 * @param {number} times
		 * @param {number} room_id
		 * @param {number} uid
		 * @param {number} anchor_id
		 * @param {string} csrf
		 * @returns
		 */
		increase_ContributionRank: async (
			pg,
			times = 10,
			room_id,
			uid,
			anchor_uid,
			csrf
		) => {
			try {
				if (times <= 0) {
					return;
				}
				let click_like_flag = true;
				for (let i = 0; i < times; i++) {
					let resp = await BAPI.like_info_v3_like_likeReportV3(
						pg,
						15,
						room_id,
						uid,
						anchor_uid,
						csrf
					);
					await sleep(2e3);
					if (resp.code) {
						console.error(
							`${uid}\t${csrf}\t点赞失败！${JSON.stringify(resp)}`
						);
						click_like_flag = false;
						return;
					} else {
						console.log(`点赞成功！${JSON.stringify(resp)}`);
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
				console.error(`increase_ContributionRank error\n${e.stack}`);
			}
		},
	},
};

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
			console.error(`日志写入文件失败！${e}\n${e.stack}`);
		}
	};
}

/**
 * @class LIVE_LOT
 * @description 单个账号的抽奖类
 */
class LIVE_LOT {
	/**
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
		this.Start_Date = new Date(0); //new Date();
		this.live_lot_switch =
			DO_Lottery_instance.lottery_setting?.CONFIG?.LIVE_LOT;
		this.GOLDBOX_Info = {
			aid_list: [],
			live_room_url_list: [], //aid对应的直播间url
			/**@type {number[]} 已经前往的金宝箱直播间url */
			has_gone_to_live_room_aid_list: [],
		};
		this.emulate_ua =
			"Mozilla/5.0 BiliDroid/7.63.0 (bbcallen@gmail.com) os/android model/Redmi K30 Pro mobi_app/android build/7630200 channel/360 innerVer/7630200 osVer/11 network/2";
		console.log(`创建了新的直播抽奖实例`);
	}
	/**
	 * 初始化一个新的页面，专门用来抽直播抽奖
	 * @param {boolean} android_emulate 是否模拟安卓
	 */
	init = async (android_emulate = true) => {
		while (this.initializing_flag) {
			await sleep(1e3);
		}
		this.initializing_flag = true;
		try {
			this.live_pg = await live_op.live_page_init(
				this.__DO_Lottery_class
			);
			if (android_emulate) {
				await this.live_pg.emulate({
					name: "Redmi K30 Pro",
					userAgent: this.emulate_ua,
					viewport: {
						width: 600,
						height: 1024,
						deviceScaleFactor: 1,
						isMobile: true,
						hasTouch: true,
						isLandscape: false,
					},
				});
			}

			await pptr_op.check_page_is_front(this.live_pg);
			if (!this.CONFIG.live_info.uname) {
				await this.live_pg.goto(
					"https://live.bilibili.com/all?spm_id_from=333.1296.0.0"
				);
				await live_op.basic_op.remove_live_player(this.live_pg);
				let response = await BAPI.get_user_info(this.live_pg);
				if (response.code == 0) {
					this.CONFIG.live_info.uname = response?.data?.uname;
					this.CONFIG.live_info.uid = response?.data?.uid;
					this.CONFIG.live_info.user_level =
						response?.data?.user_level;
				} else {
					throw new Error(
						`登录状态获取失败！${JSON.stringify(response)}`
					);
				}
				this.API = new API(this.CONFIG.live_info.uname);
				this.Lot_log = new LOT_LOG(this.CONFIG.live_info.uname);
				await this.#init_following_list();
				this.API = new API(this.CONFIG.live_info.uname);
				this.Lot_log = new LOT_LOG(this.CONFIG.live_info.uname);
			}
			await this.live_pg.goto("about:blank");
			await pptr_op.check_page_is_front(
				this.__DO_Lottery_class.global_page
			);
			this.initializing_flag = false;
		} catch (e) {
			this.API.chatLog(
				`初始化一个新的页面失败！${e}\n${e.stack}`,
				"error"
			);
			this.initializing_flag = false;
			throw e;
		}
	};
	/**
	 * 初始化关注人数
	 */
	#init_following_list = async () => {
		if (!this.live_pg.url().includes("bilibili")) {
			await pptr_op.check_page_is_front(this.live_pg);
			await this.live_pg.goto(
				"https://live.bilibili.com/?spm_id_from=333.1007.0.0"
			);
		}
		await pptr_op.check_page_is_front(this.__DO_Lottery_class.global_page);
		await BAPI.get_attention_list(
			this.live_pg,
			this.CONFIG.live_info.uid
		).then(async (data) => {
			if (data.code == 0) {
				this.API.chatLog(`全部关注数：【${data.data.list.length}】个`);
				this.CONFIG.live_info.ALLFollowingList = data.data.list;
				if (data.data.list.length > 2000) {
					this.API.chatLog(
						`直播主播关注数达到${data.data.list.length}，注意满3000关注后，将无法新增关注，会影响中奖！`,
						"warning"
					);
					if (this.live_lot_switch) {
						this.API.chatLog(
							`直播抽奖flag开启中，自动执行取关脚本！`,
							"info"
						);
						let event_name = `${EVENT_NAME_MAP.lot_unfollow}_${this.__DO_Lottery_class.lottery_name}`;
						if (event_bus.event_list.indexOf(event_name) == -1) {
							event_bus.on(event_name, async () => {
								try {
									this.CONFIG.live_info.uid
										? (this.__DO_Lottery_class.global_var.user_info.uid =
												this.CONFIG.live_info.uid)
										: {};
									await this.__DO_Lottery_class.unfollow_module(
										2000
									);
								} catch (e) {
									this.API.chatLog(`取关脚本执行失败！${e}`);
								}
							});
						}
						event_bus.emit(event_name);
					}
				}
			}
		});
	};
	/**
	 * 检查this.live_pg是否关闭
	 */
	#check_browser = async () => {
		while (this.initializing_flag) {
			await sleep(1e3);
			continue;
		}
		try {
			if (!this.live_pg || this.live_pg.isClosed()) {
				await this.init(false);
			}
		} catch (e) {
			console.error(`${e}\n${e.stack}`);
			this.API.chatLog(`浏览器出错！\n${e.stack}`, "error");
			this.initializing_flag = false;
			throw e; //出了未知错误就直接抛出错误，不接着执行了！
		} finally {
			this.initializing_flag = false;
		}
	};
	/**
	 * 参加红包抽奖
	 * @param {*} pg
	 * @param {*} room_id
	 * @param {*} anchor_uid
	 * @param {*} lot_id
	 * @param {*} total_price
	 * @param {*} room_owner_uid
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
				this.CONFIG.live_info.csrf = await pptr_op.get_bili_cjt(pg);
			} //获取csrf
			await this.#check_browser();
			let new_pg = await this.live_pg.browser().newPage();
			setTimeout(async () => {
				if (new_pg && !new_pg.isClosed()) {
					await new_pg.close();
				}
			}, 180e3);
			await pptr_op.hook_teck_logdata(new_pg);
			await new_pg.emulate({
				name: "Redmi K30 Pro",
				userAgent: this.emulate_ua,
				viewport: {
					width: 600,
					height: 1024,
					deviceScaleFactor: 1,
					isMobile: true,
					hasTouch: true,
					isLandscape: false,
				},
			});
			await new_pg.goto(`https://live.bilibili.com/${room_id}`);
			// await live_op.basic_op.remove_live_player(new_pg);
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
			let resp_data = await new_pg.evaluate(
				//红包抽奖和天选抽奖的js里面数据获取依赖wss的消息，所以要查看https://s1.hdslb.com/bfs/static/blive/blfe-live-room/static/js/app.268978a8c4d7b424e697.js 里面如何绕过前端不显示红包抽奖的界面
				async (roomid, anchor_uid, csrf_token, lot_id) => {
					var formData = new FormData();
					formData.set("visit_id", "");
					formData.set("jump_from", "");
					formData.set("session_id", "");
					formData.set("room_id", roomid);
					formData.set("ruid", anchor_uid);
					formData.set("spm_id", "444.8.red_envelope.extract");
					formData.set("jump_from", "26000");
					formData.set("build", "7630200");
					formData.set("c_locale", "en_US");
					formData.set("channel", "360");
					formData.set("device", "android");
					formData.set("mobi_app", "android");
					formData.set("platform", "android");
					formData.set("version", "7.63.0");
					formData.set(
						"statistics",
						"%7B%22appId%22%3A1%2C%22platform%22%3A3%2C%22version%22%3A%227.63.0%22%2C%22abtest%22%3A%22%22%7D"
					);
					formData.set("csrf", csrf_token);
					formData.set("csrf_token", csrf_token);
					formData.set("lot_id", lot_id);
					let url = `https://api.live.bilibili.com/xlive/lottery-interface/v1/popularityRedPocket/RedPocketDraw`;
					let method = "post";
					let headers = new Headers();
					headers.set("User-Agent", this.emulate_ua);
					let resp = await fetch(url, {
						method: method,
						headers: headers,
						credentials: "include",
						body: formData,
					}).then(async (res) => {
						let dat = await res.json();
						return dat;
					});
					return resp;
				},
				room_id,
				anchor_uid,
				this.CONFIG.live_info.csrf,
				lot_id
			);
			setTimeout(async () => {
				if (new_pg && !new_pg.isClosed()) {
					try {
						await new_pg.close();
					} catch (e) {
						console.error(`关闭直播浏览器页面失败！\n${e}`);
					}
				}
			}, 180e3);
			if (resp_data.code == 0) {
				this.CONFIG.redpacket.times.success++;
				this.API.chatLog(
					`【直播间电池道具】房间号：https://live.bilibili.com/${room_id} ，直播间道具红包总值${
						total_price / 1000
					}元参与成功！\t${JSON.stringify(resp_data)}`
				);
				this.API.chatLog(`尝试点赞3次直播间`);
				await live_op.polymer_op.increase_ContributionRank(
					new_pg,
					3,
					room_id,
					this.CONFIG.live_info.uid,
					anchor_uid,
					this.CONFIG.live_info.csrf
				);
				await this.#getOnlineGoldRank(new_pg, anchor_uid, room_id).then(
					async (da) => {
						if (da.code == 0) {
							let onlineNum = da.data.onlineNum;
							let score = da.data.ownInfo.score;
							let rank = da.data.ownInfo.rank;
							this.API.chatLog(
								`【直播间电池道具】目前在线人数：${onlineNum}贡献值：${score}排名：${rank}`,
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
										`【直播间电池道具】[${room_id}](https://live.bilibili.com/${room_id})直播间无贡献值，可能已经风控！`,
										"warning"
									);
								}
								return this.Lot_log.log_write(
									`ERROR\t参加直播间[${room_id}](https://live.bilibili.com/${room_id})道具红包失败！：参加抽奖后直播间无贡献值，可能已经风控！`,
									"道具红包"
								);
							}

							if (score < 10) {
								this.API.chatLog(
									`【直播间电池道具】开始在直播间[${room_id}](https://live.bilibili.com/${room_id})尝试增加${
										10 - score
									}点贡献值`
								);
								await live_op.polymer_op.increase_ContributionRank(
									new_pg,
									10 - score,
									room_id,
									this.CONFIG.live_info.uid,
									anchor_uid,
									this.CONFIG.live_info.csrf
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
					}
				);
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
				`【直播间电池道具】参加直播间[${room_id}](https://live.bilibili.com/${room_id})道具红包反馈：${JSON.stringify(
					resp_data
				)}`
			);
			this.Lot_log.log_write(
				`SUCCESS\t参加直播间[${room_id}](https://live.bilibili.com/${room_id})道具红包反馈：${JSON.stringify(
					resp_data
				)}`,
				"道具红包"
			);
		} catch (e) {
			this.CONFIG.redpacket.times.fail++;
			this.CONFIG.redpacket.join_risk_mark = true;
			this.API.chatLog(`参加红包抽奖失败！${e}\n${e.stack}`, "error");
			this.Lot_log.log_write(
				`ERROR\t参加直播间[${room_id}](https://live.bilibili.com/${room_id})道具红包失败！：${e.toString()}`,
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
	#getOnlineGoldRank = async (pg, ruid, room_id) => {
		// try {
		// 	let contribution_btn = await pg.$(
		// 		live_op.element_map.contribution_btn
		// 	);
		// 	if (!contribution_btn) {
		// 		throw `未找到贡献值下拉框`;
		// 	}
		// 	contribution_btn.click();
		// 	let resp = await pg.waitForResponse((resp) =>
		// 		resp.url().includes("queryContributionRank")
		// 	);
		// 	await sleep(1e3);
		// 	await pg.click(live_op.element_map.contribution_btn);
		// 	return await resp.json();
		// } catch (e) {
		// 	this.API.chatLog(`获取直播贡献值失败！${e}`, "error");
		// }
		//获取失败则使用API
		let resp = await BAPI.queryContributionRank(pg, ruid, room_id);
		return resp;
	};
	/**
	 * 参加天选抽奖
	 * @param {Page} pg
	 * @param {number} lot_id
	 * @param {number} gift_num
	 * @param {number} gift_price
	 * @param {number} anchor_uid
	 * @param {number} room_id
	 * @param {number} require_type
	 * @returns
	 */
	#join_anchor_lot = async (
		//@TODO 这个函数尝试使用创建的新页面加wss消息执行
		//https://live.bilibili.com/p/html/live-lottery/anchor-join.html?roomId=21738461&uid=4237378&anchorId=123456&from=web&liteVersion=0
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
			// let anchor_icon = await pg.$(live_op.element_map.anchor_icon);
			// if (!anchor_icon) {
			// 	//没有获取到天选抽奖的图标
			// 	console.error(`没有获取到天选抽奖的图标`);
			// 	return this.Lot_log.log_write(
			// 		`ERROR\t参加直播间${room_id}天选抽奖失败，原因：没有获取到天选抽奖的图标！`,
			// 		"天选抽奖"
			// 	);
			// }
			// let anchor_join_btn = await pg
			// 	.frames()
			// 	.find((el) =>
			// 		el
			// 			.url()
			// 			.includes(
			// 				"live.bilibili.com/p/html/live-lottery/anchor-join.html"
			// 			)
			// 	)
			// 	.$(live_op.element_map.anchor_join_btn);
			// if (!anchor_icon) {
			// 	console.error(`没有获取到天选抽奖参加的按钮`);
			// 	return this.Lot_log.log_write(
			// 		`ERROR\t参加直播间${room_id}天选抽奖失败，原因：没有获取到天选抽奖参加的按钮！`,
			// 		"天选抽奖"
			// 	);
			// }
			// await anchor_join_btn.click();

			// let anchor_join_resp = await pg.waitForResponse((resp) =>
			// 	resp.url().includes("xlive/lottery-interface/v1/Anchor/Join")
			// );
			// let anchor_join_json = await anchor_join_resp.json();

			let anchor_join_resp = await BAPI.anchor_join(pg, lot_id, room_id);

			if ((anchor_join_resp.code == 400) & (gift_num * gift_price != 0)) {
				console.log(
					`【天选抽奖 ${
						this.CONFIG.live_info.uname
					}】 参与 【${pg.url()}】 金瓜子余额不足!`
				);
				return;
			}
			if (anchor_join_resp.code == 0) {
				this.API.chatLog(`尝试点赞3次直播间`);
				await live_op.polymer_op.increase_ContributionRank(
					pg,
					3,
					room_id,
					this.CONFIG.live_info.uid,
					anchor_uid,
					this.CONFIG.live_info.csrf
				);
				await this.#getOnlineGoldRank(pg, anchor_uid, room_id).then(
					async (da) => {
						if (da.code == 0) {
							let onlineNum = da.data.onlineNum;
							let score = da.data.ownInfo.score;
							let rank = da.data.ownInfo.rank;
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
							}
							if (score < 10) {
								this.API.chatLog(
									`【天选时刻】开始在直播间${room_id}尝试增加${
										10 - score
									}点贡献值！`
								);
								await live_op.polymer_op.increase_ContributionRank(
									pg,
									10 - score,
									room_id,
									this.CONFIG.live_info.uid,
									anchor_uid,
									this.CONFIG.live_info.csrf
								);
							}
						}
					}
				);
			} else {
				this.CONFIG.anchor.join_risk_mark = true;
			}
			if (unusual_mark) {
				//查看是否关注，如果关注失败则账号被风控！
				BAPI.IsUserFollow(pg, anchor_uid).then(async (data) => {
					if (data.code == 0) {
						if (!data.data.follow) {
							//参加抽奖后还是未关注状态判断为异常
							this.CONFIG.anchor.join_risk_mark = true;
							console.error(
								`【天选时刻 ${
									this.CONFIG.live_info.uname
								}】检测到${room_id}关注异常，暂停抽奖${
									this.CONFIG.anchor.risk_sleeptime /
									60 /
									1000
								}分钟！\n${JSON.stringify(data)}`
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
				`SUCCESS\t参加直播间[${room_id}](https://live.bilibili.com/${room_id})天选抽奖反馈：${JSON.stringify(
					anchor_join_resp
				)}`,
				"天选抽奖"
			);
		} catch (e) {
			this.API.chatLog(`天选抽奖失败！${e}\n${e.stack}`, "error");
			this.Lot_log.log_write(
				`ERROR\t参加直播间[${room_id}](https://live.bilibili.com/${room_id})天选抽奖失败！${e.toString()}`,
				"天选抽奖"
			);
			throw e;
		}
	};
	/**
	 * 通过独立的html参加天选抽奖
	 * @param {Page} pg
	 * @param {number} lot_id
	 * @param {number} gift_num
	 * @param {number} gift_price
	 * @param {number} anchor_uid
	 * @param {number} room_id
	 * @param {number} require_type
	 * @returns
	 */
	#join_anchor_lot_html = async (
		pg,
		lot_id,
		gift_num,
		gift_price,
		anchor_uid,
		room_id,
		require_type
	) => {
		let anchor_page;
		try {
			if (!pg || pg.isClosed()) {
				try {
					await this.init(false);
				} catch (e) {
					console.error(`${e}\n${e.stack}`);
					this.API.chatLog(`浏览器出错！`);
					throw e; //出了未知错误就直接抛出错误，不接着执行了！
				}
			}
			if (!this.CONFIG.live_info.csrf) {
				this.CONFIG.live_info.csrf = await pptr_op.get_bili_cjt(pg);
			} //获取csrf
			/**@type {Page} 专门抽天选的*/
			anchor_page = await pg.browser().newPage();
			await pptr_op.hook_teck_logdata(anchor_page);
			await pptr_op.check_page_is_front(anchor_page);
			await anchor_page.goto(`https://live.bilibili.com/${room_id}`, {
				timeout: 180e3,
			});
			await live_op.basic_op.remove_live_player(anchor_page);
			await pptr_op.check_page_is_front(anchor_page);
			let unusual_mark = false;
			if (
				this.CONFIG.live_info.ALLFollowingList.indexOf(anchor_uid) ==
					-1 &&
				require_type != 0
			) {
				await BAPI.IsUserFollow(anchor_page, anchor_uid).then(
					async (data) => {
						if (data.code == 0) {
							if (!data.data.follow) {
								unusual_mark = true; //参加抽奖前、是需要关注的抽奖、确认是未关注状态
							}
						} else {
							console.error(
								`检查关注的响应获取失败！${JSON.stringify(
									data
								)}`
							);
						}
					}
				);
			}
			this.CONFIG.anchor.joined_anchor_id_list.push(lot_id);
			if (this.CONFIG.anchor.joined_anchor_id_list.length > 200) {
				this.CONFIG.anchor.joined_anchor_id_list =
					this.CONFIG.anchor.joined_anchor_id_list.slice(-50);
			}
			await pptr_op.check_page_is_front(anchor_page);
			try {
				await anchor_page
					.waitForSelector(live_op.element_map.rightArrow_btn, {
						timeout: 10e3,
					})
					.then(async (btn) => await btn.click());
			} catch (e) {
				console.error(`获取直播间右箭头失败！\n${e.stack}`);
			}

			await anchor_page.waitForSelector(live_op.element_map.anchor_icon, {
				timeout: 180e3,
			});
			let anchor_icon = await anchor_page.$(
				live_op.element_map.anchor_icon
			);
			if (!anchor_icon) {
				//没有获取到天选抽奖的图标
				this.API.chatLog(`没有获取到天选抽奖的图标`, `error`);
				return this.Lot_log.log_write(
					`ERROR\t参加直播间${room_id}天选抽奖失败，原因：没有获取到天选抽奖的图标！`,
					"天选抽奖"
				);
			}
			await anchor_icon.click();
			await anchor_page.waitForFrame(async (frame) => {
				return frame
					.url()
					.includes(
						"live.bilibili.com/p/html/live-lottery/anchor-join.html"
					);
			});
			let anchor_iframe = anchor_page
				.frames()
				.find((el) =>
					el
						.url()
						.includes(
							"live.bilibili.com/p/html/live-lottery/anchor-join.html"
						)
				);
			await anchor_iframe.waitForSelector(
				live_op.element_map.anchor_join_btn,
				{ timeout: 180e3 }
			);
			await sleep(1e3);
			let anchor_join_btn = await anchor_iframe?.$(
				live_op.element_map.anchor_join_btn
			);
			if (!anchor_join_btn) {
				console.error(`未找到天选参与按钮！`);
				return;
			}
			await anchor_join_btn.click();
			let __anchor_join;
			try {
				__anchor_join = await anchor_page.waitForResponse(
					(resp) => resp.url().includes("/Anchor/Join"),
					{ timeout: 10e3 }
				);
			} catch (e) {
				console.error(`等待参与天选抽奖响应失败！${e}\n${e.stack}`);
			}
			let anchor_join_resp = {};
			if (__anchor_join) anchor_join_resp = await __anchor_join.json();
			if ((anchor_join_resp.code == 400) & (gift_num * gift_price != 0)) {
				console.log(
					`【天选抽奖 ${
						this.CONFIG.live_info.uname
					}】 参与 【${anchor_page.url()}】 金瓜子余额不足!`
				);
				return;
			}
			if (anchor_join_resp.code == 0) {
				this.API.chatLog(`尝试点赞3次直播间`);
				await live_op.polymer_op.increase_ContributionRank(
					anchor_page,
					3,
					room_id,
					this.CONFIG.live_info.uid,
					anchor_uid,
					this.CONFIG.live_info.csrf
				);
				await this.#getOnlineGoldRank(
					anchor_page,
					anchor_uid,
					room_id
				).then(async (da) => {
					if (da.code == 0) {
						let onlineNum = da.data.onlineNum;
						let score = da.data.ownInfo.score;
						let rank = da.data.ownInfo.rank;
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
						}
						if (score < 10) {
							this.API.chatLog(
								`【天选时刻】开始在直播间${room_id}尝试增加${
									10 - score
								}点贡献值！`
							);
							await live_op.polymer_op.increase_ContributionRank(
								anchor_page,
								10 - score,
								room_id,
								this.CONFIG.live_info.uid,
								anchor_uid,
								this.CONFIG.live_info.csrf
							);
						}
					}
				});
			} else {
				this.CONFIG.anchor.join_risk_mark = true;
			}
			if (unusual_mark) {
				//查看是否关注，如果关注失败则账号被风控！
				BAPI.IsUserFollow(anchor_page, anchor_uid).then(
					async (data) => {
						if (data.code == 0) {
							if (!data.data.follow) {
								//参加抽奖后还是未关注状态判断为异常
								this.CONFIG.anchor.join_risk_mark = true;
								console.error(
									`【天选时刻 ${
										this.CONFIG.live_info.uname
									}】检测到${room_id}关注异常，暂停抽奖${
										this.CONFIG.anchor.risk_sleeptime /
										60 /
										1000
									}分钟！\n${JSON.stringify(data)}`
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
					}
				);
			}
			this.Lot_log.log_write(
				`SUCCESS\t参加直播间[${room_id}](https://live.bilibili.com/${room_id})天选抽奖反馈：${JSON.stringify(
					anchor_join_resp
				)}`,
				"天选抽奖"
			);
		} catch (e) {
			this.API.chatLog(`天选抽奖失败！${e}\n${e.stack}`, "error");
			this.Lot_log.log_write(
				`ERROR\t参加直播间[${room_id}](https://live.bilibili.com/${room_id})天选抽奖失败！${e.toString()}`,
				"天选抽奖"
			);
			if (anchor_page && !anchor_page.isClosed()) {
				await anchor_page.close();
			}
		}
		return anchor_page;
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
			let url = "http://127.0.0.1:23333/v1/get/live_lots";
			return await axios.get(url).then((resp) => {
				return resp.data;
			});
		} catch (e) {
			this.API.chatLog(
				`获取服务器数据失败！${e}\n${JSON.stringify(e.stack)}`,
				"error"
			);
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
	 * 每日赠送包裹里的礼物
	 * @param {Page} pg
	 */
	#send_daily_gift = async (pg) => {
		let gift_url = GLOBAL_CONFIG.live_module.gift_send_live_room.url;
		await pg.goto(gift_url, { waitUntil: "networkidle0" });
		await sleep(30e3);
		await BAPI.gift
			.bag_list(pg, GLOBAL_CONFIG.live_module.gift_send_live_room.room_id)
			.then(async (bagResult) => {
				if (
					bagResult.data == undefined ||
					bagResult.data.list == undefined
				)
					return;
				let list = bagResult?.data?.list;
				if (list == undefined) return;
				this.API.chatLog(
					`所有礼物将赠送至直播间【 ${gift_url} 】~\n礼物：\n${list
						.map((el) =>
							[el.gift_name, el.gift_num, el.corner_mark].join(
								"\t"
							)
						)
						.join("\n")}`
				);
				await sleep(1e3);
				for (let times = 0; times < list.length; times++) {
					for (let i = 0; i < 3; i++) {
						try {
							await sleep(10e3);
							await pptr_op.check_page_is_front(pg);
							await pg
								.waitForSelector(
									live_op.element_map.gift_package
								)
								.then(async (el) => {
									await pptr_op.check_page_is_front(pg);
									await el.click();
								});
							let gift_item_free = await pg.waitForSelector(
								live_op.element_map.gift_item_free
							);
							await gift_item_free.hover();
							await sleep(1e3);
							let button = await pg.$(
								`.feed-button-root .click-root .content-box`
							);
							await button.click();
							await sleep(1e3);
							break;
						} catch (e) {
							console.error(
								`送礼物失败！ 第${i} 次尝试\n${e}\n${e.stack}`
							);
							await pg.reload();
							await sleep(10e3);
						}
					}
				}
			});
	};
	/**
	 * 检查是否是第二天，如果是第二天则重置一些参数
	 */
	#check_new_day = async () => {
		let now = new Date();
		if (this.Start_Date.getDay() != now.getDay()) {
			this.CONFIG.anchor.max_joined_switch = false;
			this.CONFIG.redpacket.max_joined_switch = false;
			this.Start_Date = new Date();
			//检查到第二天就将包裹里的礼物全部送出去
			let new_pg = await this.live_pg.browser().newPage();
			try {
				await pptr_op.hook_teck_logdata(new_pg);
				await this.#send_daily_gift(new_pg);
			} catch (e) {
				console.error(`每日任务执行失败!\t${e}\n${e.stack}`);
			} finally {
				await new_pg.close();
			}
		}
	};
	/**
	 * @typedef {Object} roundObj
	 * @property {string} imgUrl - 奖品图片链接
	 * @property {number} join_end_time - 抽奖加入截止时间
	 * @property {number} join_start_time - 抽奖加入开始时间
	 * @property {number} round_num - 回合数
	 * @property {string} startTime - 开始时间的str形式 2023-12-28 14:31:00
	 * @param {roundObj} round - 奖品的回合
	 * @param {Page} pg
	 * @param {number} aid
	 */
	#glod_box_draw = async (round, pg, aid) => {
		for (let retry_time = 0; retry_time < 3; retry_time++) {
			//尝试3次
			try {
				await this.#check_browser();
				if (pg.isClosed()) {
					pg = await this.live_pg.browser().newPage();
					await pg.setExtraHTTPHeaders({
						referer: `https://live.bilibili.com/`,
						//${Math.ceil(Math.random() * (10000000 - 1000) + 1000
						//)}?live_from=84002&spm_id_from=333.337.0.0`,
					});
				}
				if (!pg.url().includes("live-room-treasurebox")) {
					await pg.goto(
						`https://live.bilibili.com/p/html/live-room-treasurebox/index.html?aid=${aid}#/`
					);
				}
				await sleep(
					utl.random_choice([5e3, 10e3, 15e3, 20e3, 25e3, 30e3, 35e3])
				);
				await pptr_op.check_page_is_front(pg);
				let round_items = await pg.$$(
					live_op.element_map.live_room_treasurebox.round_item
				);
				let current_round_item = round_items[round.round_num - 1];
				await current_round_item.click();
				let join_btn = await pg.$(
					live_op.element_map.live_room_treasurebox.join_btn
				);
				await join_btn.click();
				break;
			} catch (e) {
				this.API.chatLog(
					`执行金宝箱点击操作失败！ ${e}\n${e.stack}`,
					"error"
				);
				await sleep(10e3);
			}
		}
	};

	/**
	 *	参加金宝箱抽奖主函数
	 * @param {number} aid
	 */
	gold_box_main = async (aid) => {
		/**
		 * 监控是否有金宝箱对应的直播间
		 * @param {number} lottery_start_ts 抽奖开始时间（秒
		 * @returns
		 */
		let monitor_aid_live_url = async (lottery_start_ts, lottery_end_ts) => {
			while (1) {
				try {
					if (
						this.GOLDBOX_Info.has_gone_to_live_room_aid_list.includes(
							aid
						)
					)
						break;
					let aid_idx = this.GOLDBOX_Info.aid_list.indexOf(aid);
					if (aid_idx > -1) {
						await this.#check_browser();
						let gold_box_live_pg = await this.live_pg
							.browser()
							.newPage();
						await pptr_op.hook_teck_logdata(gold_box_live_pg);
						let live_url =
							this.GOLDBOX_Info.live_room_url_list[aid_idx];
						if (live_url) {
							setTimeout(async () => {
								while (1) {
									try {
										await pptr_op.check_page_is_front(
											gold_box_live_pg
										);
										await gold_box_live_pg.goto(live_url);
										await live_op.basic_op.remove_live_player(
											gold_box_live_pg
										);
										this.GOLDBOX_Info.has_gone_to_live_room_aid_list.push(
											aid
										);
										break;
									} catch (e) {
										this.API.chatLog(
											`前往金宝箱直播间失败！`,
											"error"
										);
										await sleep(10e3);
									}
								}
							}, lottery_start_ts * 1e3 - Date.now() - 600e3);
							setTimeout(async () => {
								if (gold_box_live_pg.isClosed) return;
								await gold_box_live_pg.close();
							}, lottery_end_ts - Date.now() + 1000e3);
							return;
						}
					}
				} catch (e) {
					console.error(`${e}\n${e.stack}\n前往金宝箱直播页面失败！`);
				}
				await sleep(10e3);
			}
		};
		try {
			this.__DO_Lottery_class.no_exit_falg.goldbox_lottery_flag = true;
			await this.#check_browser();
			let new_pg = await this.live_pg.browser().newPage();
			await new_pg.setExtraHTTPHeaders({
				referer: `https://live.bilibili.com/`,
			});
			await pptr_op.hook_teck_logdata(new_pg);
			new_pg.goto(
				`https://live.bilibili.com/p/html/live-room-treasurebox/index.html?aid=${aid}#/`
			);
			let goldbox_resp = await (
				await new_pg.waitForResponse((resp) =>
					resp.url().includes("goldBox/getBoxInfo")
				)
			).json();
			/**@type {roundObj[]} */
			let rounds = goldbox_resp.data.rounds;
			for (let round of rounds) {
				round.join_end_time * 1e3 > Date.now()
					? setTimeout(() => {
							try {
								this.#glod_box_draw(round, new_pg, aid);
							} catch (e) {
								this.API.chatLog(
									`参加金宝箱失败！${e}\n${e.stack}`,
									"error"
								);
							}
					  }, round.join_start_time * 1e3 - Date.now() + 10e3)
					: undefined;
			}
			setTimeout(async () => {
				this.__DO_Lottery_class.no_exit_falg.goldbox_lottery_flag = false;
				this.check_is_need_to_close_browser(new_pg);
			}, rounds[rounds.length - 1].join_end_time * 1e3 - Date.now());
			monitor_aid_live_url();
		} catch (e) {
			console.error(
				`${this.__DO_Lottery_class.lottery_name}执行金宝箱抽奖失败！${e}\n${e.stack}`
			);
			await sleep(10e3);
			this.__DO_Lottery_class.goldbox_lottery_flag = false;
			return this.gold_box_main(aid);
		}
	};
	/**
	 * 检查是否需要关闭浏览器，如果需要，则直接关闭浏览器
	 * @param {Page} new_pg
	 */
	check_is_need_to_close_browser = async (new_pg) => {
		setTimeout(async () => {
			try {
				if (!new_pg.isClosed()) {
					await new_pg.close();
				}
				if ((await new_pg.browser().pages()).length != 0) {
					if (
						Object.keys(this.__DO_Lottery_class.no_exit_falg).some(
							(k) => this.__DO_Lottery_class.no_exit_falg[k]
						) ||
						this.__DO_Lottery_class.browser_mode
					) {
						this.API.chatLog(
							`检测到有任务未完成，不许关闭浏览器！\n${JSON.stringify(
								this.__DO_Lottery_class.no_exit_falg,
								"",
								"\n"
							)}`
						);
						return;
					}
					if (this.__DO_Lottery_class.lottery_setting.CONFIG.LIVE_LOT)
						return;
					if (this.__DO_Lottery_class.lotFlag) {
						this.API.chatLog(
							`检测到有任务未完成，不许关闭浏览器！\n抽奖标志(lotFlag)为true！`
						);
						return;
					}
					if (
						this.__DO_Lottery_class.global_var.page &&
						this.__DO_Lottery_class.global_var.page.isClosed()
					)
						return;
					await new_pg.browser().close();
				}
			} catch (e) {
				console.error(
					`${this.CONFIG.live_info.uname}\t检查是否需要关闭浏览器失败！${e}\n${e.stack}`
				);
			}
		}, 15 * 60 * 1e3);
	};
	/**
	 *
	 * @param {object[]} lot_data
	 * @returns
	 */
	main = async (lot_data, dailysend_prize_flag = false) => {
		try {
			await this.#check_browser();
			if (dailysend_prize_flag) {
				await this.#check_new_day();
			}
			if (!lot_data) {
				lot_data = await this.#get_data_from_server();
			}
			lot_data.sort((a, b) => a.end_time - b.end_time);
			for (let da of lot_data)
				try {
					{
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
								)} ${Math.ceil(
									da.end_time - Date.now() / 1000
								)}`
							);
							continue;
						}
						await this.#check_browser();
						// if (!this.CONFIG.live_info.uname) {
						// 	this.API.chatLog(
						// 		`账号登录状态出错！退出！`,
						// 		"error"
						// 	);
						// 	return;
						// }
						if (da.total_price) {
							this.#redpacket_main(da);
							continue;
						} else if (!da.goldbox) {
							this.#anchor_main(da);
							continue;
						}
					}
				} catch (e) {
					this.API.chatLog(`处理数据失败！${e}\n${e.stack}`, "error");
				}
		} catch (e) {
			console.error(
				`${this.CONFIG.live_info.uname}\t出了严重错误！\n${e.stack}`,
				e
			);
			// throw e;
		}
	};
	//#region 天选和红包的主函数
	/**
	 * 红包主函数
	 * @param {Object} da
	 */
	#redpacket_main = async (da) => {
		//如果是红包抽奖
		try {
			if (
				this.CONFIG.redpacket.max_joined_switch ||
				this.CONFIG.redpacket.join_risk_mark
			) {
				this.API.chatLog(
					`【直播间电池道具】可能已经风控！\t${JSON.stringify(da)}`,
					"warning"
				);
				return;
			}
			let url = `https://live.bilibili.com/${
				da.room_id
			}?live_from=71002&visit_id=${this.#getvisit_id(
				this.CONFIG.live_info.uid
			)}`;
			this.API.chatLog(`【直播间电池道具】开始红包抽奖 ${url} `);
			await this.#join_redpacket_lot(
				this.live_pg,
				da.room_id,
				da.anchor_uid,
				da.lot_id,
				da.total_price
			);
			await pptr_op.check_page_is_front(
				this.__DO_Lottery_class.global_page
			);
			await sleep((da.end_time - Date.now() / 1000) * 1e3 + 5e3); //同一时间只抽一个奖
			await pptr_op.check_page_is_front(this.live_pg);
			await this.live_pg.goto(`about:blank`); //抽完了就进入空白页节省资源
			await pptr_op.check_page_is_front(
				this.__DO_Lottery_class.global_page
			);
			await sleep(this.CONFIG.TIME.lot_sep_time);
		} catch (e) {
			this.API.chatLog(`红包主函数执行失败！${e}\n${e.stack}`, "error");
		}
	};
	/**
	 * 天选主函数
	 * @param {Object} da
	 */
	#anchor_main = async (da) => {
		//天选抽奖
		try {
			if (
				this.CONFIG.anchor.join_risk_mark ||
				this.CONFIG.anchor.max_joined_switch
			) {
				this.API.chatLog(`【天选时刻】可能已经风控！`, "warning");
				await this.check_is_need_to_close_browser(this.live_pg);
				return;
			}
			let url = `https://live.bilibili.com/${
				da.room_id
			}?live_from=71002&visit_id=${this.#getvisit_id(
				this.CONFIG.live_info.uid
			)}`;
			this.API.chatLog(`开始天选抽奖 ${url} `);
			//await pptr_op.check_page_is_front(this.live_pg);
			// await this.live_pg.goto(url);
			let anchor_page;
			try {
				anchor_page = await this.#join_anchor_lot_html(
					this.live_pg,
					da.lot_id,
					da.gift_num,
					da.gift_price,
					da.anchor_uid,
					da.room_id,
					da.require_type
				);
				await sleep(180e3);
			} catch (e) {
				console.error(
					`${this.CONFIG.live_info.uname}\t天选参加失败！${e}\n${e.stack}`
				);
			} finally {
				setTimeout(async () => {
					try {
						if (anchor_page && !anchor_page.isClosed()) {
							console.log(
								`${this.CONFIG.live_info.uname}\t关闭天选抽奖浏览器页面`
							);
							await anchor_page.close();
						}
					} catch (e) {
						console.error(
							`${this.CONFIG.live_info.uname}\t关闭天选抽奖浏览器页面失败！${e}`
						);
					}
				}, 15 * 60e3);
			}
		} catch (e) {
			console.error(
				`${this.CONFIG.live_info.uname}天选抽奖失败！${e}\n${e.stack}`
			);
		} finally {
			await this.check_is_need_to_close_browser(this.live_pg);
			await pptr_op.check_page_is_front(
				this.__DO_Lottery_class.global_page
			);
			// await pptr_op.check_page_is_front(this.live_pg);
			await this.live_pg.goto(`about:blank`); //抽完了就进入空白页节省资源
		}
	};
	//#endregion
}

/**
 * @class LIVE_LOT_Service
 * @description 控制所有账号进行直播抽奖操作
 */
class LIVE_LOT_Service {
	/**
	 * @param {DO_Lottery[]} DO_Lottery_list
	 */
	constructor(DO_Lottery_list) {
		//class的constructor里面的属性注释需要使用type，而不是prop
		this.DO_Lottery_list = DO_Lottery_list;
		/** @type { LIVE_LOT[] } 抽奖执行对象*/
		this.LIVE_LOT_list = []; //需要直播抽奖的
		/** @type { String[] } */
		this.LIVE_LOT_name_list = [];
		/** @type { LIVE_LOT[] } */
		this.ALL_LIVE_LOT = []; //所有的直播抽奖的class实例，无论抽不抽都加进去，用于后续的宝箱抽奖或者特大奖用
		this.ALL_LIVE_LOT_name_list = [];
		this.event_map = {
			live_lot: "live_lot", //直播抽奖
			gold_box: "gold_box",
		};
		this.API = new API(`直播抽奖系统`);
		this.GOLDBOX = {
			recorded_aid: [],
		};
		this.live_lot_setting = live_op.basic_op.read_live_lot_json();
		setTimeout(() => {
			this.live_lot_setting = live_op.basic_op.read_live_lot_json();
		}, 10e3); //每隔10秒钟刷新一下抽奖设置
	}
	/**
	 *
	 * @returns {Promise<Object[]>}
	 */
	#get_data_from_server = async () => {
		try {
			let url = "http://127.0.0.1:23333/v1/get/live_lots";
			let response = await axios.get(url).then((resp) => {
				return resp.data;
			});
			// console.debug(
			// 	`【直播抽奖】获取到服务器数据！${JSON.stringify(response)}`
			// );
			return response;
		} catch (e) {
			this.API.chatLog(
				`获取服务器数据失败！${e}\n${JSON.stringify(e.stack)}`,
				"error"
			);
			return [];
		}
	};

	/**
	 * 循环抽奖主函数
	 */
	#main_lot = async () => {
		while (1) {
			try {
				let lot_data = await this.#get_data_from_server();

				if (lot_data) {
					let promise_list = [];
					if (
						this.live_lot_setting &&
						this.live_lot_setting.unignore_anchor_key_word
					) {
						for (let da of lot_data) {
							if (!da.award_name || !da.danmu) continue;
							if (
								this.live_lot_setting.unignore_anchor_key_word.filter(
									(el) =>
										da?.danmu?.includes(el) ||
										da?.award_name?.includes(el)
								).length > 0
							) {
								console.debug(
									`所有账号参加抽奖！${JSON.stringify(
										lot_data
									)}`
								);
								let anchor_left_ms =
									da.end_time * 1e3 - Date.now() - 120e3;
								promise_list.concat(
									pptr_op.do_promise_func_in_sep_ms(
										this.ALL_LIVE_LOT.map((el) => el.main),
										[da],
										anchor_left_ms
									)
								);
							}
						}
					}
					for (let LIVE_LOT of this.LIVE_LOT_list) {
						promise_list.push(LIVE_LOT.main(lot_data, true));
						await sleep(10e3);
					}
					await Promise.all(promise_list);
				}

				let gold_box_data = lot_data.filter((el) => el.goldbox).pop();
				//#region 金宝箱抽奖
				if (gold_box_data) {
					//默认所有账号都参加金宝箱抽奖！
					for (let goldbox of gold_box_data.goldbox) {
						if (goldbox.live_url) {
							for (let LIVE_LOT of this.ALL_LIVE_LOT) {
								//设置live_lot的金宝箱信息
								if (
									!LIVE_LOT.GOLDBOX_Info.aid_list.includes(
										goldbox.aid
									)
								) {
									LIVE_LOT.GOLDBOX_Info.aid_list.push(
										goldbox.aid
									);
									LIVE_LOT.GOLDBOX_Info.live_room_url_list.push(
										goldbox.live_url
									);
								}
							}
						}

						let event_name = `${this.event_map.gold_box}_${goldbox.aid}`;
						if (this.GOLDBOX.recorded_aid.includes(goldbox.aid)) {
							continue;
						}
						if (
							goldbox.join_start_time - Date.now() / 1e3 < 3600 && // 最后要把3600e3后面的e3去掉！
							Date.now() / 1e3 < goldbox.join_end_time
						) {
							this.GOLDBOX.recorded_aid.push(goldbox.aid);
							if (!event_bus.event_list.includes(event_name)) {
								event_bus.on(event_name, async () => {
									let promise_list = [];
									for (let LIVE_LOT of this.ALL_LIVE_LOT) {
										promise_list.push(
											LIVE_LOT.gold_box_main(goldbox.aid)
										);
										await sleep(21e3);
									}
								});
							}
							event_bus.emit(event_name);
						}
						if (
							event_bus.event_list.includes(event_name) &&
							Date.now() / 1e3 > goldbox.join_end_time //删除过期宝箱事件
						) {
							event_bus.off(event_name, () => {
								console.log(`移除事件${event_name}`);
							});
						}
					}
				}
				//#endregion

				this.GOLDBOX.recorded_aid =
					this.GOLDBOX.recorded_aid.slice(-10); //只保留最后十个aid
			} catch (e) {
				console.error(`出了严重错误！\n${e.stack}`, e);
			}
			await sleep(1e3);
		}
	};
	main = async () => {
		for (let do_lottery of this.DO_Lottery_list) {
			if (!do_lottery.lottery_setting) {
				await do_lottery.variable_init(false);
			}
			let event_name = `live_lot_${do_lottery.lottery_name}`;

			if (do_lottery.lottery_setting.CONFIG.LIVE_LOT) {
				if (this.LIVE_LOT_name_list.indexOf(event_name) == -1) {
					let live_lot = new LIVE_LOT(do_lottery);
					this.LIVE_LOT_list.push(live_lot);
					this.LIVE_LOT_name_list.push(event_name);
					this.ALL_LIVE_LOT.push(live_lot);
					this.ALL_LIVE_LOT_name_list.push(event_name);
				} else {
					console.log(`${do_lottery.lottery_name} 直播抽奖进行中`);
				}
			} else {
				if (this.ALL_LIVE_LOT_name_list.indexOf(event_name) == -1) {
					let live_lot = new LIVE_LOT(do_lottery);
					this.ALL_LIVE_LOT.push(live_lot);
				}
			}
		}

		if (event_bus.event_list.indexOf(this.event_map.live_lot) == -1)
			event_bus.on(this.event_map.live_lot, async () => {
				try {
					await this.#main_lot();
				} catch (e) {
					console.error(`直播抽奖出错！\n${e.stack}`, e);
				}
			});
		event_bus.emit(this.event_map.live_lot);
	};
}

module.exports = { LIVE_LOT, live_op, LIVE_LOT_Service };
