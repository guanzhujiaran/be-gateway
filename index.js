/*
 * @Author: 星瞳 1944637830@qq.com
 * @Date: 2023-11-12 23:55:03
 * @LastEditors: 星瞳 1944637830@qq.com
 * @LastEditTime: 2024-02-23 22:56:15
 * @FilePath: \tampermonkey\index.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
/*
 * _______________#########_______________________
 * ______________############_____________________
 * ______________#############____________________
 * _____________##__###########___________________
 * ____________###__######_#####__________________
 * ____________###_#######___####_________________
 * ___________###__##########_####________________
 * __________####__###########_####_______________
 * ________#####___###########__#####_____________
 * _______######___###_########___#####___________
 * _______#####___###___########___######_________
 * ______######___###__###########___######_______
 * _____######___####_##############__######______
 * ____#######__#####################_#######_____
 * ____#######__##############################____
 * ___#######__######_#################_#######___
 * ___#######__######_######_#########___######___
 * ___#######____##__######___######_____######___
 * ___#######________######____#####_____#####____
 * ____######________#####_____#####_____####_____
 * _____#####________####______#####_____###______
 * ______#####______;###________###______#________
 * ________##_______####________####______________
 */

let { DO_Lottery, sleep } = require("./木偶模块/puppeteer_lottery.js");
let { LIVE_LOT_Service } = require("./直播模块/live_op.js");
let { live_dm_wss_service } = require("./直播模块/live_dm_server.js");
let event_bus = require("./lib/helper/event_bus"); //注册事件用的，每一轮都要重新注册！
let axios = require("axios");
let fs = require("fs");

/**
 * 生成抽奖文件
 * @param {Date} start_time
 */
async function gen_lot_file(start_time) {
	try {
		console.log(`开始新的一轮抽奖！${new Date().toLocaleString()}`);
		console.log(`正在获取抽奖动态中！----${new Date().toLocaleString()}`);
		let latest_lot_dyn = fs
			.readFileSync("./木偶模块/一般的抽奖动态id.txt")
			.toString();
		let latest_lot_dyn_data = latest_lot_dyn.split("\n");
		let get_lot_dyn = await axios.get(
			"http://127.0.0.1:23333/get_others_lot_dyn"
		);
		let lot_dyn_data = get_lot_dyn.data;
		if (
			latest_lot_dyn_data.length === lot_dyn_data.length &&
			latest_lot_dyn_data.every((v, i) => v === lot_dyn_data[i])
		) {
			fs.writeFileSync("./木偶模块/一般的抽奖动态id.txt", "");
		} else {
			fs.writeFileSync(
				"./木偶模块/一般的抽奖动态id.txt",
				lot_dyn_data.join("\n")
			);
			console.log(
				`获取完成。写入文件 ./木偶模块/一般的抽奖动态id.txt 共计${
					lot_dyn_data.length
				}条抽奖！\n抽奖，启动！--${start_time.toLocaleString()}`
			);
		}
	} catch (e) {
		console.error(`获取抽奖动态失败！${e}\n${e.stack}`);
		fs.writeFileSync("./木偶模块/一般的抽奖动态id.txt", "");
		await sleep(100e3);
		return await gen_lot_file(start_time);
	}
	try {
		let get_lot_dyn = await axios.get(
			"http://127.0.0.1:23333/get_others_official_lot_dyn"
		);
		let lot_dyn_data = get_lot_dyn.data;
		if (lot_dyn_data && lot_dyn_data.length != 0) {
			fs.writeFileSync(
				"./木偶模块/官方抽奖动态id.txt",
				lot_dyn_data.join("\n") + "\n",
				{ flag: "a+" }
			);
			console.log(
				`官方抽奖获取完成。写入文件 ./木偶模块/官方抽奖动态id.txt 共计${
					lot_dyn_data.length
				}条抽奖！--${start_time.toLocaleString()}`
			);
		}
	} catch (e) {
		console.error(`获取官方抽奖动态失败！${e}\n${e.stack}`);
	}
}
/**
 * @type {{event_name:String,lot:DO_Lottery}[]}
 */
const MYLOTLIST = []; // 全局变量，存放所有的抽奖实例{event_name:event_name,lot:lot}

const EVENT_NAME_MAP = {
	//事件名称
	lot_unfollow: "lot_unfollow", //取关
	lot: "lot", //动态抽奖
	ALL_LIVE_LOT: "ALL_LIVE_LOT", //直播抽奖
	LIVE_SEND_DM_SERVICE: "LIVE_SEND_DM_SERVICE", //直播刷弹幕
};

async function main() {
	let start_time = new Date();
	let lottery_setting_filename_list = [
		//抽奖设置的名称
		"lottery_setting1",
		"lottery_setting3",
		"lottery_setting2",
		"lottery_setting5",
		"lottery_setting8",
		"lottery_setting9",
		"lottery_setting10",
		"lottery_setting11",
		"lottery_setting12",
		"lottery_setting13",
		"lottery_setting14",
		// 养成四级号再跑脚本
		// 'lottery_setting7',//G
		// 'lottery_setting6',//G
	];
	let unfollow_mode = 0; //是否开启取关模式，开启后只启动取关模块，其他啥也不干
	let auto_mode = 1; //是否开启全自动抽奖模式
	let browser_mode = 0; //是否只打开浏览器，不进行抽奖
	let live_mode = 1; //是否开始直播抽奖模块
	let gen_lot_file_mark = false; //抽奖文件获取完成
	if (auto_mode && !browser_mode && !unfollow_mode) {
		try {
			gen_lot_file(start_time).then(() => {
				gen_lot_file_mark = true;
			});
		} catch (e) {
			console.error(e, "获取最新抽奖信息失败！");
		}
	} else if (browser_mode) {
		console.log(`浏览模式，不抽奖！`);
	} else {
		console.log(`未开启全自动模式！使用本地文件内容进行抽奖！`);
	}

	let opus动态标志 = true; //是否使用新版动，默认开启!

	for (let i of lottery_setting_filename_list) {
		console.log(i);
		if (unfollow_mode) {
			let lot = new DO_Lottery(i, browser_mode, opus动态标志);
			let event_name = `${EVENT_NAME_MAP.lot_unfollow}_${i}`;
			if (event_bus.event_list.indexOf(event_name) == -1) {
				event_bus.on(event_name, async () => {
					await lot.unfollow_module();
				});
			}
			event_bus.emit(event_name);
			await sleep(600e3 * 3.0);
		} else {
			let event_name = `${EVENT_NAME_MAP.lot}_${i}`;
			if (!browser_mode) {
				//抽奖模式
				if (event_bus.event_list.indexOf(event_name) == -1) {
					let lot = new DO_Lottery(i, browser_mode, opus动态标志);
					MYLOTLIST.push({ event_name: event_name, lot: lot });
					event_bus.on(event_name, async () => {
						if (
							new Date().getHours() >= 2 &&
							new Date().getHours() <= 9
						) {
							console.log("启动时间太晚，优先睡眠");
							await sleep((9 - new Date().getHours()) * 3600e3);
						}
						await lot.main();
					});
				}
			} else {
				let lot = new DO_Lottery(i, browser_mode, opus动态标志);
				MYLOTLIST.push({ event_name: event_name, lot: lot });
				setTimeout(async () => {
					//浏览器模式
					lot.main();
				}, 1000);
				await sleep(30e3); //短时间内最好不要一口气打开多个账号！
			}
		}
	}
	if (unfollow_mode) return;

	if (live_mode) {
		if (!event_bus.event_list.includes(EVENT_NAME_MAP.ALL_LIVE_LOT)) {
			let ALL_DO_Lottery = MYLOTLIST.map((el) => el.lot);
			let ALL_LIVE_LOT = new LIVE_LOT_Service(ALL_DO_Lottery);
			event_bus.on(EVENT_NAME_MAP.ALL_LIVE_LOT, async () => {
				await ALL_LIVE_LOT.main();
			});
			event_bus.emit(EVENT_NAME_MAP.ALL_LIVE_LOT);
		}
	}

	if (!event_bus.event_list.includes(EVENT_NAME_MAP.LIVE_SEND_DM_SERVICE)) {
		console.log(`注册了直播刷弹幕事件！`);
		let ALL_DO_Lottery = MYLOTLIST.map((el) => el.lot);
		let Live_DM_SENDER_SERVICE = new live_dm_wss_service(ALL_DO_Lottery);
		event_bus.on(EVENT_NAME_MAP.LIVE_SEND_DM_SERVICE, async () => {
			Live_DM_SENDER_SERVICE.main();
		});
		event_bus.emit(EVENT_NAME_MAP.LIVE_SEND_DM_SERVICE);
	}

	////////////////////////////////////////////////////各种事件注册在这一行上面
	await sleep(10e3); //防止启动浏览器时和直播抽奖启动的浏览器冲突报错！

	while (1) {
		//触发动态抽奖事件
		if (!gen_lot_file_mark && auto_mode) {
			await sleep(10e3);
			console.log(
				`正在获取抽奖动态中！----${new Date().toLocaleString()}`
			);
			continue;
		}
		for (let i of lottery_setting_filename_list) {
			//动态抽奖文件
			let event_name = `lot_${i}`;
			if (event_bus.event_list.indexOf(event_name) != -1) {
				if (new Date().getHours() >= 2 && new Date().getHours() <= 9) {
					console.log("启动时间太晚，优先睡眠");
					await sleep((9 - new Date().getHours()) * 3600e3);
				}
				event_bus.emit(event_name);
				await sleep(600e3 * 1.0);
			} else {
				console.error(`未找到动态抽奖${event_name}事件！`);
			}
		}
		break;
	}

	if (auto_mode && !browser_mode) {
		//判断是否结束，并开启下一轮
		while (1) {
			let all_end = true;
			for (let lot of MYLOTLIST) {
				if (!lot.lot?.lotFlag) {
					//如果抽完了判断准备开启下一轮
				} else {
					all_end = false;
				}
			}
			if (all_end) {
				let now = new Date();
				let tomorrow = new Date(
					start_time.getFullYear(),
					start_time.getMonth(),
					start_time.getDate() + 1,
					8
				); //开始时间的第二天
				let times = (tomorrow - now) / 1000;
				let hh = parseInt(times / 3600); //小时
				let shh = times - hh * 3600;
				let ii = parseInt(shh / 60);
				let ss = shh - ii * 60;
				tomorrow - now < 0
					? console.log("本轮抽奖完成，立刻执行下一轮！")
					: console.log(
							`本轮抽奖已完成，下一轮将在 ${
								(hh < 10 ? "0" + hh : hh) +
								"小时" +
								(ii < 10 ? "0" + ii : ii) +
								"分钟" +
								(ss < 10 ? "0" + ss : ss) +
								"秒"
							} 后启动！\n--${new Date().toLocaleString()}`
					  );
				await sleep(10e3);
				setTimeout(async () => {
					// event_bus.flush(); //事件不清空，复用事件！
					// for (let lot of MYLOTLIST) {
					// 	await lot.lot?.global_page.browser().close();
					// }//不需要关闭浏览器
					await main();
				}, tomorrow - now);
				return;
			}
			await sleep(100e3);
		}
	}
}
(async function () {
	// await sleep(7 * 3600 * 1e3);
	await main();
})();
