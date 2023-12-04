let { DO_Lottery, sleep } = require("./木偶模块/puppeteer_lottery.js");
let { LIVE_LOT } = require("./直播模块/live_op.js");
let event_bus = require("./lib/helper/event_bus"); //注册事件用的，每一轮都要重新注册！
let axios = require("axios");
let fs = require("fs");

/**
 * @type {{event_name:String,lot:DO_Lottery}[]}
 */
const MYLOTLIST = []; // 全局变量，存放所有的抽奖实例{event_name:event_name,lot:lot}

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
		//养成四级号再跑脚本
		// 'lottery_setting7',//G
		// 'lottery_setting6',//G
	];
	let unfollow_mode = 0; //是否开启取关模式
	let auto_mode = 0; //是否开启全自动抽奖模式
	let browser_mode = 0; //是否只打开浏览器，不进行抽奖
	if (auto_mode && !browser_mode && !unfollow_mode) {
		try {
			console.log(`开始新的一轮抽奖！${new Date().toLocaleString()}`);
			console.log(
				`正在获取抽奖动态中！----${new Date().toLocaleString()}`
			);
			let latest_lot_dyn = fs
				.readFileSync("./木偶模块/一般的抽奖动态id.txt")
				.toString();
			let latest_lot_dyn_data = latest_lot_dyn.split("\n");
			let get_lot_dyn = await axios.get(
				"http://127.0.0.1:23333/get_others_lot_dyn/"
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
					`获取完成。\n抽奖，启动！--${start_time.toLocaleString()}`
				);
			}
		} catch (e) {
			console.error(e, "获取最新抽奖信息失败！");
			return;
		}
	} else {
		console.log(`未开启全自动模式！使用本地文件内容进行抽奖！`);
	}
	if (!browser_mode && !unfollow_mode) {
		if (new Date().getHours() >= 2 && new Date().getHours() <= 9) {
			console.log("启动时间太晚，优先睡眠");
			await sleep((9 - new Date().getHours()) * 3600e3);
		}
	}
	let opus动态标志 = true; //是否使用新版动，默认开启!
	for (let i of lottery_setting_filename_list) {
		console.log(i);
		if (unfollow_mode) {
			let lot = new DO_Lottery(i, browser_mode, opus动态标志);
			let event_name = `lot_unfollow_${i}`;
			if (event_bus.event_list.indexOf(event_name) == -1) {
				event_bus.on(event_name, async () => {
					await lot.unfollow_module();
				});
			}
			event_bus.emit(event_name);
			await sleep(600e3 * 3.0);
		} else {
			let event_name = `lot_${i}`;
			if (!browser_mode) {
				//抽奖模式
				if (event_bus.event_list.indexOf(event_name) == -1) {
					let lot = new DO_Lottery(i, browser_mode, opus动态标志);
					MYLOTLIST.push({ event_name: event_name, lot: lot });
					event_bus.on(event_name, async () => {
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

	for (let do_lottery of MYLOTLIST) {
		if (!do_lottery.lot.lottery_setting) {
			await do_lottery.lot.variable_init();
		}
		if (do_lottery.lot.lottery_setting.CONFIG.LIVE_LOT) {
			let event_name = `live_lot_${do_lottery.lot.lottery_name}`;
			if (event_bus.event_list.indexOf(event_name) == -1) {
				let live_lot = new LIVE_LOT(do_lottery.lot);
				event_bus.on(event_name, async () => {
					live_lot.main();
				});
				event_bus.emit(event_name);
			} else {
				console.log(`${do_lottery.lottery_name} 直播抽奖进行中`);
			}
		}
	}

	await sleep(10e3);

	for (let i of lottery_setting_filename_list) {
		let event_name = `lot_${i}`;
		if (event_bus.event_list.indexOf(event_name) != -1) {
			event_bus.emit(event_name);
			await sleep(600e3 * 3.0);
		} else {
			console.error(`未找到${event_name}事件！`);
		}
	}

	if (auto_mode && !browser_mode) {
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
					for (let lot of MYLOTLIST) {
						await lot.lot?.global_page.browser().close();
					}
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
