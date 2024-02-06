const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())
const edgePaths = require("edge-paths");
const EDGE_DEV_PATH = edgePaths.getEdgeDevPath();//获取DEV版本EDGE的路径



class NewBingReply {
    constructor() {
        this.browser;
        this.page;
        this.#init()
    }
    /**
     * 初始化浏览器
     */
    #init = async () => {
        if (!this.browser) {
            this.browser = await puppeteer.launch({
                executablePath: EDGE_DEV_PATH,
                headless: false,
                args: [`--start-stack-profiler`,
                    //`--load-extension=${ext1}`,
                    '--disable-notifications=true',
                    '-–ignore-certificate-errors',
                    '--disable-infobars',
                    '--disable-session-crashed-bubble',
                    '--disable-setuid-sandbox',
                    '--disable-web-security',
                    '--disable-gpu',
                    '--disable-dev-shm-usage',
                    '--no-first-run',
                    //'--mute-audio',
                    '--no-zygote',
                    // '--single-process',
                    `--profile-directory=Default`,
                    // "--disable-features=IsolateOrigins,site-per-process",
                    `--start-maximized`,
                    '--disable-setuid-sandbox',
                    '--disable-infobars',
                    '--window-position=0,0',
                    '--ignore-certifcate-errors',
                    '--ignore-certifcate-errors-spki-list',],
                userDataDir: "C:\\Users\\Acer\\AppData\\Local\\Microsoft\\Edge Dev\\User Data",
                ignoreDefaultArgs: [
                    '--enable-automation',
                    '--disable-extensions'
                ],
                ignoreHTTPSErrors: true,
            });
        }
        if (!this.page) {
            this.page = await this.browser.newPage();
            await this.page.goto(`https://www.bing.com/search?q=Bing+AI&showconv=1&FORM=hpcodx`)
        }
    };
    /**
     * @function 必应回复
     * @param {*} Input_dynamic_content 动态内容
     * @param {*} UpName 动态的up
     * @param {*} MyName 账号昵称
     * @param {*} MyUID 账号UID
     * @returns 
     */
    Get_Bing_Reply = async (Input_dynamic_content, UpName, MyName, MyUID) => {
        let propmt =
            `我的昵称是${MyName}，我的UID是${MyUID}。我作为B站UP主${UpName}的粉丝，想与他的动态互动，他的动态原文如下：

"${Input_dynamic_content}"

为了参与互动，我需要写一段话发送在评论区，要求内容要有创新，能让人眼前一亮，字数控制在50字以内，不要有关键词：转发，关注，评论等。除非动态内容中要求带话题或者@好友，否则不要出现 #和 @，@好友时随机选择一个B站用户。忽略[]包裹的文字，不要重复动态内容。
回复时直接回复我所需要的内容。`
        let reply_content;
        if (!this.browser || !this.page) {
            await this.#init();
        }
        if (!(await this.page.url()).includes(`www.bing.com/search?q=Bing+AI&showconv=1&FORM=hpcodx`)) {
            await this.page.goto(`https://www.bing.com/search?q=Bing+AI&showconv=1&FORM=hpcodx`)
        }
        try {
            let input_text_area = await this.page.evaluateHandle(`document.querySelector("#b_sydConvCont > cib-serp").shadowRoot.querySelector("#cib-action-bar-main").shadowRoot.querySelector("div > div.main-container.body-2 > div.input-container.as-ghost-placement > cib-text-input").shadowRoot.querySelector("#searchbox")`)
            await input_text_area.type(Input_dynamic_content)
            await this.page.waitForTimeout(1000);
            let submit_btn = await this.page.evaluateHandle(`document.querySelector("#b_sydConvCont > cib-serp").shadowRoot.querySelector("#cib-action-bar-main").shadowRoot.querySelector("div > div.main-container > div.input-container.as-ghost-placement > div.controls-right > div.control.submit > button")`)
            await submit_btn.click()
            await this.page.waitForTimeout(10e3);
            let reply_area = await this.page.evaluateHandle(`document.querySelector("#b_sydConvCont > cib-serp").shadowRoot.querySelector("#cib-conversation-main").shadowRoot.querySelector("#cib-chat-main > cib-chat-turn").shadowRoot.querySelector("cib-message-group.response-message-group").shadowRoot.querySelector("cib-message").shadowRoot.querySelector("cib-shared > div > div > div > p")`)
            reply_content = await reply_area.evaluate(el => el.innerText)
        } catch (e) {
            console.warn(`获取Bing回复失败`, e);
            await this.page.reload();
        }
        finally {
            let refresh_btn = await this.page.evaluateHandle(`document.querySelector("#b_sydConvCont > cib-serp").shadowRoot.querySelector("#cib-action-bar-main").shadowRoot.querySelector("div > div.outside-left-container > div > button")`)
            await refresh_btn.click();
        }
        return reply_content
    };
}

(async () => {



    let browser = await puppeteer.launch({
        executablePath: EDGE_DEV_PATH,
        headless: false,
        args: [`--start-stack-profiler`,
            //`--load-extension=${ext1}`,
            '--disable-notifications=true',
            '-–ignore-certificate-errors',
            '--disable-infobars',
            '--disable-session-crashed-bubble',
            '--disable-web-security',
            '--disable-gpu',
            '--disable-dev-shm-usage',
            '--no-first-run',
            //'--mute-audio',
            '--no-zygote',
            // '--single-process',
            `--profile-directory=Default`,
            // "--disable-features=IsolateOrigins,site-per-process",
            `--start-maximized`,
            '--disable-infobars',
            '--window-position=0,0',
            '--ignore-certifcate-errors',
            '--ignore-certifcate-errors-spki-list',],
        userDataDir: "C:\\Users\\Acer\\AppData\\Local\\Microsoft\\Edge Dev\\User Data",
        ignoreDefaultArgs: [
            '--enable-automation',
            '--disable-extensions',
            '--disable-client-side-phishing-detection',
            '--disable-sync',
        ],
        ignoreHTTPSErrors: true,
    });
    let page = await browser.newPage();
    await page.goto(`https://www.bing.com/search?q=Bing+AI&showconv=1&FORM=hpcodx`)

    let input_text_area = await page.evaluateHandle(`document.querySelector("#b_sydConvCont > cib-serp").shadowRoot.querySelector("#cib-action-bar-main").shadowRoot.querySelector("div > div.main-container.body-2 > div.input-container.as-ghost-placement > cib-text-input").shadowRoot.querySelector("#searchbox")`)

    input_text_area.type
    let submit_btn = await page.evaluateHandle(`document.querySelector("#b_sydConvCont > cib-serp").shadowRoot.querySelector("#cib-action-bar-main").shadowRoot.querySelector("div > div.main-container > div.input-container.as-ghost-placement > div.controls-right > div.control.submit > button")`)
    let reply_area = await page.evaluateHandle(`document.querySelector("#b_sydConvCont > cib-serp").shadowRoot.querySelector("#cib-conversation-main").shadowRoot.querySelector("#cib-chat-main > cib-chat-turn").shadowRoot.querySelector("cib-message-group.response-message-group").shadowRoot.querySelector("cib-message").shadowRoot.querySelector("cib-shared > div > div > div > p")`)
    let reply_content = await reply_area.evaluate(el => el.innerText)
})();