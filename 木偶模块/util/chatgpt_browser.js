const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const stealth = StealthPlugin();
stealth.enabledEvasions.delete("user-agent-override");
puppeteer.use(StealthPlugin());

async function launchBrowser(userProfile) {
	try {
		let __args = [];
		__args.push(
			`--start-stack-profiler`,
			//`--load-extension=${ext1}`,
			"--disable-notifications=true",
			"--no-sandbox",
			"-–ignore-certificate-errors",
			"--disable-infobars",
			"--disable-session-crashed-bubble",
			"--disable-web-security",
			"--disable-gpu",
			"--disable-dev-shm-usage",
			"--no-first-run",
			//'--mute-audio',
			"--disable-extensions",
			"--no-zygote",
			"--disable-xss-auditor",
			"--disable-popup-blocking",
			"--disable-setuid-sandbox",
			//'--disable-accelerated-2d-canvas',
			// '--single-process',
			`--profile-directory=${userProfile}`,
			// "--disable-features=IsolateOrigins,site-per-process",
			`--start-maximized`,
			"--disable-infobars",
			"--window-position=0,0",
			"--ignore-certifcate-errors",
			"--ignore-certifcate-errors-spki-list"
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
				"--disable-extensions",
				"--disable-client-side-phishing-detection",
				"--disable-sync",
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
		this.isAvailable = false;
		this.__check_page_wrapper = this.__check_page_wrapper.bind(this);
		this.__typemsg = this.__typemsg.bind(this);
		this.__submit_click = this.__submit_click.bind(this);
		this.__waitfor_elem = this.__waitfor_elem.bind(this);
		this.__get_answer = this.__get_answer.bind(this);
		this.askquestion = this.askquestion.bind(this);
		this.__last_answer = "";
	}
	sleep(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	__check_page_wrapper(func) {
		return async (...args) => {
			try {
				if (!this.chatpage || (await this.chatpage.isClosed())) {
					await this.init();
				}
				let res = await func.apply(this, args);
				return res;
			} catch (e) {
				this.chatpage.screenshot({
					path: `./ChatGPT/err_pic/ChatGPT_Error_${Date.now()}_${
						arguments[0].name
					}.jpg`,
				});
				console.warn(func.name, "chatgpt_error", e, this, arguments);
				await this.chatpage.goto("https://chat.openai.com/", {});
				this.isAvailable = true;
				throw e;
			}
		};
	}

	async init() {
		try {
			this.chatpage = await intial_chatgpt_browser();
			await this.chatpage.goto("https://chat.openai.com/", {
				waitUntil: "networkidle0",
			});
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
		await this.chatpage.click("button.absolute.transition-colors", { delay: 20 });
	}

	async __get_answer() {
		if (
			await this.chatpage.$(
				`.py-2.px-3.border.text-gray-600.rounded-md.text-sm`
			)
		) {
			throw "获取回复出错";
		}
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
		try {
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
		} catch (e) {
			console.error(`askquestion失败！${e.toString()}`);
		} finally {
			this.isAvailable = true;
		}
	}
}

module.exports = chatgptOP;
