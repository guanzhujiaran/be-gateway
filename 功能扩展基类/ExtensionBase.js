/**
 * 所有的其他功能通过这个基类往外扩展！
 */
const { DO_Lottery } = require("../木偶模块/puppeteer_lottery");
const { BAPI } = require("../lib/helper/BAPI.js");
const { Page } = require("puppeteer-core");

const basic_op = {
	page_init: async (pg, DO_Lottery_class) => {
		if (!pg || (await pg.browser().pages()).length === 0) {
			let temp = DO_Lottery_class.browser_mode;
			DO_Lottery_class.browser_mode = 1;
			await DO_Lottery_class.main();
			DO_Lottery_class.browser_mode = temp;
			await sleep(5e3);
			pg = DO_Lottery_class.global_page;
			await pg.goto("about:blank", { waitUntil: "domcontentloaded" });
		}
		let new_pg = await pg.browser().newPage();
		await new_pg.setRequestInterception(true);
		new_pg.on("request", async (req) => {
			//只拦截基础的科技log
			try {
				if (req.method().toLowerCase() == "post") {
					if (
						req
							.url()
							.includes("data.bilibili.com/log/web?013324") ||
						req
							.url()
							.includes("data.bilibili.com/log/web?000527") ||
						req.url().includes("data.bilibili.com/log/web?0000")
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
		return new_pg;
	},
	/**
	 * 将页面切换至前台
	 * @param {Page} pg
	 */ bringToFront: async (pg) => {
		if (!pg.isClosed()) {
			await pg.bringToFront();
		}
	},
};

class ExtensionClass {
	/**
	 * @param {DO_Lottery} DO_Lottery_instance DO_Lottery的实例
	 */
	constructor(DO_Lottery_instance) {
		this.__DO_Lottery_class = DO_Lottery_instance;
		this.__origin_pg = DO_Lottery_instance.global_page;
		this.basic_pg;
		this.CONFIG = {
			user_info: {
				csrf: "",
				uid: 0,
				uname: "",
				user_level: 0,
			},
		};
	}
	/**
	 * 初始化一个新的页面，专门用来抽直播抽奖
	 */
	#init = async () => {
		try {
			this.basic_pg = await basic_op.page_init(
				this.__origin_pg,
				this.__DO_Lottery_class
			);
			await basic_op.bringToFront(this.basic_pg);
			await this.basic_pg.goto(
				"https://live.bilibili.com/?spm_id_from=333.1296.0.0"
			);
			let response = await BAPI.get_user_info(this.basic_pg);
			if (response.code == 0) {
				this.CONFIG.user_info.uname = response?.data?.uname;
				this.CONFIG.user_info.uid = response?.data?.uid;
				this.CONFIG.user_info.user_level = response?.data?.user_level;
			} else {
				throw new Error(
					`登录状态获取失败！${JSON.stringify(response)}`
				);
			}
			await this.basic_pg.goto("about:blank");
			await basic_op.bringToFront(this.__DO_Lottery_class.global_page);
		} catch (e) {
			this.API.chatLog(`初始化一个新的页面失败！${e}`, "error");
			throw e;
		}
	};
}

module.exports = { ExtensionClass };
