const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const stealth = StealthPlugin();
stealth.enabledEvasions.delete("user-agent-override");
puppeteer.use(StealthPlugin());

const { pptr_op } = require("./common_utl");
async function launchBrowser(userProfile) {
	try {
		let __args = [];
		__args.push(
			// `--start-stack-profiler`,
			//`--load-extension=${ext1}`,
			"--disable-notifications=true",
			// "--no-sandbox",
			"-–ignore-certificate-errors",
			"--disable-session-crashed-bubble",
			"--disable-web-security",
			"--disable-gpu",
			"--disable-dev-shm-usage",
			// "--no-first-run",
			// "--mute-audio",
			// "--disable-extensions",
			"--no-zygote",
			// "--disable-xss-auditor",
			// "--disable-popup-blocking",
			// "--disable-setuid-sandbox",
			// "--disable-accelerated-2d-canvas",
			// '--single-process',
			`--profile-directory=${userProfile}`
			// "--disable-features=IsolateOrigins,site-per-process",
			// `--start-maximized`,
			// "--disable-infobars",
			// "--window-position=0,0",
			// "--ignore-certifcate-errors",
			// "--ignore-certifcate-errors-spki-list",
		);
		let browser = await puppeteer.launch({
			executablePath: `C:\\Program Files (x86)\\Microsoft\\Edge Dev\\Application\\msedge.exe`, //浏览器路径
			//executablePath:`C:\\Program Files\\Google\\Chrome Dev\\Application\\chrome.exe`,
			headless: false, //false为显示浏览器界面
			defaultViewport: {
				//分辨率
				width: 1920,
				height: 1080,
			},
			args: __args,
			userDataDir:
				"C:\\Users\\Acer\\AppData\\Local\\Microsoft\\Edge Dev\\User Data\\",
			ignoreDefaultArgs: [
				"--enable-automation",
				// "--disable-extensions",
				// "--disable-client-side-phishing-detection",
				// "--disable-sync",
			],
			ignoreHTTPSErrors: true,
		});
		//await global_var.page.setUserAgent(useragent);
		for (let p of await browser.pages()) {
			if (!(await p.url()).includes("about:blank")) {
				await p.close();
			}
		}

		return browser;
	} catch (e) {
		console.log(userProfile, "ChatGPT浏览器启动失败");
		console.warn(e);
	}
}

/**
 * 启动chatgpt浏览器 ，返回浏览器页面对象
 * @returns chatgpt_page
 */
async function intial_chatgpt_browser() {
	try {
		let chatgpt_browser = await launchBrowser("Default");
		let chatgpt_page = (await chatgpt_browser.pages())[0];
		return chatgpt_page;
	} catch (e) {
		console.warn(e);
	}
}

class chatgptOP {
	constructor() {
		this.chatpage = null;
		this.qianwen_page = null;
		this.isAvailable = false;
		this.__check_page_wrapper = this.__check_page_wrapper.bind(this);
		this.__typemsg = this.__typemsg.bind(this);
		this.__submit_click = this.__submit_click.bind(this);
		this.__waitfor_elem = this.__waitfor_elem.bind(this);
		this.__get_answer = this.__get_answer.bind(this);
		this.askquestion = this.askquestion.bind(this);
		this.__last_answer = "";
		this.avaliable_AI = {
			qianwen: {
				stat: true,
				nums: 0,
				home_page: "https://tongyi.aliyun.com/qianwen",
			},
			chatGPT: {
				stat: true,
				nums: 0,
				home_page: "https://chat.openai.com/",
			},
		};
		this.max_nums_per_iter = 10; //每轮session最多询问多少个问题
	}
	sleep(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	__check_page_wrapper(func) {
		return async (...args) => {
			try {
				if (
					!this.chatpage ||
					(await this.chatpage.isClosed()) ||
					!this.qianwen_page ||
					(await this.qianwen_page.isClosed())
				) {
					await this.init();
				}
				let res = await func.apply(this, args);
				return res;
			} catch (e) {
				console.warn(func.name, "chatgpt_error", e, this, arguments);
				this.isAvailable = true;
				throw e;
			}
		};
	}

	async init() {
		try {
			this.chatpage = await intial_chatgpt_browser();
			this.qianwen_page = await this.chatpage.browser().newPage();
			try {
				await this.qianwen_page.goto(
					this.avaliable_AI.qianwen.home_page,
					{
						waitUntil: "networkidle0",
					}
				);
			} catch (e) {
				// this.avaliable_AI.qianwen.stat = false;
			}
			try {
				await this.chatpage.goto(this.avaliable_AI.chatGPT.home_page);
			} catch (e) {
				this.avaliable_AI.chatGPT.stat = false;
			}
			this.isAvailable = true;
		} catch (e) {
			console.warn(e);
			this.isAvailable = true;
			throw e;
		}
	}

	async restart() {
		try {
			await (await this.chatpage.browser()).close();
			await this.init();
		} catch (e) {
			console.warn(e);
		}
	}

	/**
	 * 输入文字
	 * @param {string} inputmsg
	 */
	async __typemsg(inputmsg) {
		inputmsg = inputmsg.replaceAll("\r\n", "\n");
		inputmsg = inputmsg.replaceAll("\r", "\n");
		for (let sepmsg of inputmsg.split("\n")) {
			await this.chatpage.type("#prompt-textarea", String(sepmsg), {
				delay: 20,
			});
			await this.chatpage.keyboard.down("Shift");
			await this.chatpage.type("#prompt-textarea", "\n", { delay: 100 });
			await this.chatpage.keyboard.up("Shift");
			await this.sleep(100);
		}
	}
	async __submit_click() {
		await this.chatpage.click("button.absolute.transition-colors", {
			delay: 20,
		});
	}

	async __get_answer() {
		let ret_answer = await this.chatpage.$$eval(
			".markdown.prose.w-full",
			(els) => els.at(-1).textContent
		);
		if (ret_answer == this.__last_answer) {
			throw `回复内容：“${ret_answer}”和上一个重复了，可能发生未知错误！`;
		}
		this.__last_answer = ret_answer;
		return ret_answer;
	}

	async __waitfor_elem(elem) {
		return await this.chatpage.waitForSelector(elem);
	}
	async __waitfor_resp(includes_url) {
		try {
			return await this.chatpage.waitForResponse(
				(response) => response.url().includes(includes_url),
				{ timeout: 30e3 }
			);
		} catch (e) {
			console.error(`等待响应${includes_url}失败！\t${e.toString()}`);
		}
	}

	async askquestion(questionMsg) {
		this.isAvailable = false;
		let ask_channel = "";
		try {
			for (let k of Object.keys(this.avaliable_AI)) {
				switch (k) {
					case "qianwen": {
						ask_channel = "qianwen";
						if (this.avaliable_AI[ask_channel]["stat"]) {
							return await this.__ask_qianwen(questionMsg);
						}
					}
					case "chatGPT": {
						ask_channel = "chatGPT";
						if (this.avaliable_AI[ask_channel]["stat"]) {
							return await this.__ask_chatGpt(questionMsg);
						}
					}
					default: {
						console.error(`暂时没有可用的AI！！！`);
					}
				}
			}
		} catch (e) {
			// this.avaliable_AI[ask_channel]["stat"] = false; // 标记该AI不可用
			// setTimeout(() => {
			// 	this.avaliable_AI[ask_channel]["stat"] = true;
			// }, 2 * 3600e3);
			console.error(`askquestion 失败！${e.toString()}\n${e.stack}`);
		} finally {
			this.isAvailable = true;
		}
	}
	__ask_chatGpt = async (questionMsg) => {
		await pptr_op.check_page_is_front(this.chatpage);
		let typemsg = this.__check_page_wrapper(this.__typemsg);
		let submit_click = this.__check_page_wrapper(this.__submit_click);
		let get_answer = this.__check_page_wrapper(this.__get_answer);
		let waitfor_elem = this.__check_page_wrapper(this.__waitfor_elem);
		let waitfor_resp = this.__check_page_wrapper(this.__waitfor_resp);
		await typemsg(questionMsg);
		await submit_click();
		await waitfor_resp("/backend-api/lat/r");
		await waitfor_elem(".markdown.prose.w-full");
		await this.sleep(5e3);
		return await get_answer();
	};
	__ask_qianwen = async (questionMsg) => {
		const base_qianwen_op = {
			check_ask_num: async () => {
				if (this.avaliable_AI.qianwen.nums >= this.max_nums_per_iter) {
					this.avaliable_AI.qianwen.nums = 0;
					await this.qianwen_page.goto(
						this.avaliable_AI.qianwen.home_page
					);
					await this.sleep(10e3);
				}
				this.avaliable_AI.qianwen.nums++;
			},
			check_login: async () => {
				let login_btns = await this.qianwen_page.$$(`.btn--fywQbiAR`);
				if (login_btns.length > 0) {
					throw new Error(`通义千问未登录！`);
				}
			},
			type_text: async (inputmsg) => {
				inputmsg = inputmsg.replaceAll("\r\n", "\n");
				inputmsg = inputmsg.replaceAll("\r", "\n");
				for (let sepmsg of inputmsg.split("\n")) {
					await this.qianwen_page.type(
						"textarea.ant-input",
						String(sepmsg),
						{
							delay: 20,
						}
					);
					await this.qianwen_page.keyboard.down("Shift");
					await this.qianwen_page.type("textarea.ant-input", "\n", {
						delay: 100,
					});
					await this.qianwen_page.keyboard.up("Shift");
					await this.sleep(100);
				}
			},
			submit_click: async () => {
				await this.qianwen_page
					.waitForSelector(`[class^=operateBtn]`)
					.then(async (el) => {
						await el.click();
					});
			},
			waitForResp: async () => {
				await this.qianwen_page.waitForResponse(async (resp) => {
					if (
						resp.status() == 200 &&
						resp
							.url()
							.includes(
								"qianwen.biz.aliyun.com/dialog/conversation"
							) &&
						resp.request().method() == "POST"
					) {
						let resp_text = await resp.text({});
						if (
							resp_text.includes("[DONE]") &&
							!resp_text.includes("用户对话并发量超限")
						)
							return true;
					}
				});
			},
			get_answer: async () => {
				let ret_answer = await this.qianwen_page.$$eval(
					".tongyi-ui-markdown",
					(els) => els.at(-1).textContent
				);
				if (ret_answer == this.__last_answer) {
					throw Error(
						`回复内容：“${ret_answer}”和上一个重复了，可能发生未知错误！`
					);
				}
				this.__last_answer = ret_answer;
				return ret_answer;
			},
			close_notify: async () => {
				await this.qianwen_page.click('.cursor-pointer')
				let guide_close_btn = await this.qianwen_page.$$(
					`[class^=guideItemWrapperClose]`
				);
				guide_close_btn.length > 0
					? await guide_close_btn[0].click()
					: null;
				let close_icon = await this.qianwen_page.$$(`[class^=closeIcon]`)
				close_icon.length > 0? await close_icon[0].click()
				: null;
				return true
			},
		};
		await pptr_op.check_page_is_front(this.qianwen_page);
		let check_login = this.__check_page_wrapper(
			base_qianwen_op.check_login
		);
		let type_text = this.__check_page_wrapper(base_qianwen_op.type_text);
		let submit_click = this.__check_page_wrapper(
			base_qianwen_op.submit_click
		);
		let waitForResp = this.__check_page_wrapper(
			base_qianwen_op.waitForResp
		);
		let get_answer = this.__check_page_wrapper(base_qianwen_op.get_answer);
		await this.sleep(3e3);
		await base_qianwen_op.check_ask_num();
		await check_login();
		await base_qianwen_op.close_notify();
		await type_text(questionMsg);
		await submit_click();
		await waitForResp();
		await this.sleep(10e3);
		return await get_answer();
	};
}

module.exports = chatgptOP;
