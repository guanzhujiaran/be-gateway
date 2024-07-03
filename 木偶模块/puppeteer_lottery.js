const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const stealth = StealthPlugin();
stealth.enabledEvasions.delete("user-agent-override");
puppeteer.use(StealthPlugin());
let HTMLOP = require("./util/HTMLop");
const fs = require("fs");
const unfollow_op = require("./取关脚本/unfollow");
const global_config = require("../CONFIG.Default.js");
//导入包
const {sleep, pptr_op, utl} = require("./util/common_utl");
const {AccountDao} = require("@/ExpressServerEnd/DAO/AccountDao.js");
const {UserDao} = require("@/ExpressServerEnd/DAO/UserDao.js");
const {ENVIRONMENT} = require("./init_environment_var");
const {usage_map} = require("@/木偶模块/init_environment_var");

/**
 * @typedef {import('puppeteer').Page} Page
 */
class DO_Lottery {
    user_name;
    uid;
    account_name;
    account_id
    browser_mode;

    /**
     *
     * @param {String} user_name
     * @param {String} account_name
     * @param {boolean} browser_mode - 浏览模式，true为只打开浏览器不抽奖
     * @param {boolean} opus动态标志
     */
    constructor(user_name, account_name, browser_mode, opus动态标志 = true) {
        this.user_name = user_name;
        this.account_name = account_name;
        this.browser_mode = browser_mode;
        this.opus动态标志 = opus动态标志;
        /**
         * @property {Page} global_page - 全局公用的浏览器页面
         */
        this.global_page = undefined;
        this.lottery_setting = undefined;
        /**
         * @property {JSON} login_status - 抽奖账号登录的状态
         */
        this.login_status = undefined;
        /**
         *
         * @type {GlobalVar}
         */
        this.global_var = undefined;
        this.my_operator = undefined;
        this.MYAPI = undefined;
        /**
         * @type {boolean} other_lottery_flag -  是否有其他抽奖正在进行
         */
        this.goldbox_lottery_flag = false;
        /**
         * @prop {Object} no_exit_falg - 当前抽奖实例的非退出浏览器Flag
         * @prop {boolean} no_exit_falg.unread_msg - 未读消息
         * @prop {boolean} goldbox_lottery_flag - 金宝箱抽奖
         */
        this.no_exit_falg = {
            unread_msg: false,
            goldbox_lottery_flag: false,
        };
    }


    /**
     * 检查是否页面还存活着，关了的话开一个新页面并返回
     * @param {Page} pg
     * @param {string} defaultUrl 默认应该在的网址
     * @param usage
     * @returns {Promise<Page>}
     */
    check_page_is_alive = async (
        pg,
        defaultUrl = "https://www.bilibili.com",
        usage = usage_map.Lottery
    ) => {
        let ret_pg = pg;
        if (!pg) {
            await this.account_init(usage);
            await pptr_op.hook_teck_logdata(ret_pg);
            return ret_pg;
        }
        if (pg.isClosed()) {
            if ((await pg.browser().pages()).length !== 0) {
                this.global_var.current_page =await this.handle_create_new_page(usage)
                if (defaultUrl) {
                    await pptr_op.check_page_is_front(ret_pg);
                    await ret_pg.goto(defaultUrl);
                }
                await pptr_op.hook_teck_logdata(ret_pg);
                return ret_pg;
            } else {
                await this.#launch_lottery();
                ret_pg = await (await this.global_var.current_page.browser()).newPage();
                this.global_var.current_page = this.handle_create_new_page(ret_pg, usage)
                if (defaultUrl) {
                    await pptr_op.check_page_is_front(ret_pg);
                    await ret_pg.goto(defaultUrl);
                }
                await pptr_op.hook_teck_logdata(ret_pg);
                return ret_pg;
            }
        }
        if (!ret_pg.url().includes(defaultUrl)) {
            await pptr_op.check_page_is_front(ret_pg);
            await ret_pg.goto(defaultUrl);
        }
        return ret_pg;
    };
    /**
     * 初始化环境！（主要是 初始化lottery_setting）
     * @return {Promise<void>}
     */
    #init_environment = async () => {
        if (!this.lottery_setting) { // 如果没有抽奖设置就重新生成一下
            let evm = new ENVIRONMENT();
            await evm.main();
            this.global_var = evm.global_var;
            this.my_operator = evm.my_operator;
            this.MYAPI = evm.MYAPI;
            this.lottery_setting = evm.lottery_setting;
            this.no_exit_falg = {
                unread_msg: false,
                goldbox_lottery_flag: false,
            };
        }
    };
    /**
     * 初始化类的属性变量和环境
     */
    variable_init = async () => {
        this.login_status = undefined;
        Object.keys(this.no_exit_falg).map((keys) =>
            Object.assign(this.no_exit_falg[keys], false)
        ); // 初始化关闭浏览器Flag
        await this.#init_environment();
    };

    /**
     * true代表正在抽奖中，false代表抽完了
     * @param {boolean} lotFlag - true代表正在抽奖中，false代表抽完了
     */
    _setLotFlag = (lotFlag) => {
        this.global_var.FLAG.抽奖中标志 = lotFlag;
    };

    unfollow_module = async (
        limit_follower_num = global_config.unfollow_module.max_follow_num
    ) => {
        await this.#init_environment();
        await this.account_init();
        this.global_var.current_page = await this.check_page_is_alive(
            this.global_var.current_page,
            this.global_var.current_page.url()
        );
        await unfollow_op(
            this.global_var.current_page,
            this.global_var.user_info.uid,
            limit_follower_num
        );
    };
    /**
     * 主函数
     */
    main = async () => {
        await this.variable_init();
        await this.mainFunc();
    };

    /**
     * 创建新页面
     * @param usage
     * @param is_hook_tech
     */
    async handle_create_new_page(usage,is_hook_tech=true){
        if(!this.global_var.current_page || this.global_var.current_page.isClosed()){
            await this.account_init(false,)
        }
        let br = await this.global_var.current_page.browser();
        let new_pg = await br.newPage();
        new_pg.usage = usage
        if (is_hook_tech){
            await pptr_op.hook_teck_logdata(new_pg);
        }
        return new_pg
    }

    async global_page_listen()  {
            await this.global_var.current_page.setRequestInterception(true);
            this.global_var.current_page.on("response", async (response) => {
                //拦截响应的响应
                let url = response.url();
                try {
                    switch (true) {
                        case url.includes(`/space/reservation`) &&
                        response.status() === 200: {
                            this.global_var.response.space_reservation =
                                await response.json();
                            break;
                        }
                        case url.includes(
                            `/x/polymer/web-dynamic/v1/detail?`
                        ): {
                            try {
                                this.global_var.response.global_dynamic_data = (
                                    await response.json()
                                ).data;
                            } catch (e) {
                                if ((await response.json()).code === -412) {
                                    this.global_var.response.global_dynamic_data =
                                        -412;
                                } else {
                                    this.global_var.response.global_dynamic_data =
                                        undefined;
                                }
                                console.error(`${
                                    this.global_var.user_info.uname
                                }\t${url}\tglobal_dynamic_data\t${
                                    (await response.json()).message
                                }\n${e}`);
                            }
                            break;
                        }
                        case url.includes("/x/dynamic/feed/create/dyn") ||
                        url.includes("dynamic_repost/reply"): {
                            let req = await response.request();
                            if ((req.method()).toLowerCase() !== "post") {
                                //option是没有数据的
                                console.log(
                                    (await response.request()).method()
                                );
                                return;
                            }
                            try {
                                this.global_var.response.create_dyn_response =
                                    await response.json();
                                console.log(
                                    `${
                                        this.global_var.user_info.uname
                                    }\t转发动态response：\n${JSON.stringify(
                                        this.global_var.response.create_dyn_response
                                    )}\n转发生成的动态链接：https://t.bilibili.com/${
                                        this.global_var.response.create_dyn_response
                                            ?.data?.dynamic_id_str ||
                                        this.global_var.response.create_dyn_response
                                            ?.data?.dyn_id_str
                                    }`
                                );
                            } catch (e) {
                                console.warn(
                                    `${
                                        this.global_var.user_info.uname
                                    }\t抓取转发动态response失败：\n${e}\n${await response.text()}`
                                );
                                //global_var.response.create_dyn_response = undefined;
                                throw `${this.global_var.user_info.uname}\tcreate_dyn_response, ${e}, ${this.global_var.user_info.uname}`;
                            } finally {
                            }
                            break;

                        }
                        case url.includes("/x/v2/reply/add"): {
                            try {
                                let response_json = await response.json();
                                this.global_var.response.comment_dyn_response =
                                    response_json;
                                this.global_var.FLAG.评论响应标志 = true;
                                if (response_json.code === 12051) {
                                    //重复评论
                                    console.warn(
                                        `${
                                            this.global_var.user_info.uname
                                        } ${url} 重复评论！${JSON.stringify(
                                            response_json,
                                            "",
                                            "\t"
                                        )} `
                                    );

                                    return;
                                }
                                let oid;
                                let type;
                                let rpid;
                                try {
                                    type = response_json.data.reply.type;
                                } catch {
                                    throw Error(`评论响应type获取出错`);
                                }
                                try {
                                    oid = response_json.data.reply.oid;
                                } catch {
                                    try {
                                        oid =
                                            this.global_var.response
                                                .global_dynamic_data.item.basic
                                                .comment_id_str;
                                    } catch {
                                        //throw (`评论响应oid获取出错`)
                                    }
                                }
                                try {
                                    rpid = response_json.data.reply.rpid_str;
                                } catch {
                                    //throw (`评论响应rpid获取出错`)
                                }
                                console.log(
                                    `${
                                        this.global_var.user_info.uname
                                    }\t获取到评论响应：\t${new Date().toLocaleTimeString()}\n`,
                                    `检查阿瓦隆链接：https://api.bilibili.com/x/v2/reply/jump?type=${type}&oid=${oid}&rpid=${rpid}`
                                );
                            } catch (e) {
                                //console.log('动态评论响应',global_var.response.comment_dyn_response);
                                this.global_var.FLAG.评论响应标志 = false;
                                console.warn(
                                    `${
                                        this.global_var.user_info.uname
                                    }\t抓取评论动态response失败：\n${e}\n${await response.text()}`
                                );
                                //global_var.response.create_dyn_response = undefined;
                                throw Error(`${url}\t${this.global_var.user_info.uname}\tcomment_dyn_response, ${e}, ${this.global_var.user_info.uname}`);
                            } finally {
                            }
                            break;
                        }
                        case url.includes("/x/v2/reply/main") ||
                        url.includes("/x/v2/reply/wbi/main"): {
                            try {
                                let response_json = await response.text();
                                this.global_var.response.reply_main =
                                    JSON.parse(response_json);
                                if (response_json.code === 0) {
                                    let replies = response_json.data.replies;
                                    for (
                                        let repindex = 0;
                                        repindex < replies.length;
                                        repindex++
                                    ) {
                                        try {
                                            this.MYAPI.fileWrite(
                                                `文案/评论响应.csv`,
                                                JSON.stringify(
                                                    replies[repindex]
                                                ),
                                                "a+"
                                            );
                                        } catch {
                                            console.warn("记录评论内容失败！");
                                        }
                                    }
                                }
                            } catch (e) {
                                try {
                                    let response_json = await response.text();
                                    this.global_var.response.reply_main = JSON.parse(
                                        /.*?\((.*)\)/gim
                                            .exec(response_json)
                                            .slice(1)
                                            .join("")
                                    );
                                } catch (e) {
                                    throw Error(
                                        `${
                                            this.global_var.user_info.uname
                                        }\treply_main, ${await response.text()},${e.stack}`)
                                }
                            } finally {
                            }
                            break;
                        }
                        case url.includes("/x/web-interface/nav") &&
                        response.request().method() === "GET": {
                            if (!this.global_var.user_info.uname) {
                                if (await response.text()) {
                                    this.global_var.user_nav = JSON.parse(
                                        await response.text()
                                    );
                                }
                                try {
                                    this.global_var.user_info.uid =
                                        this.global_var.user_nav.data.mid;
                                    this.global_var.user_info.uname =
                                        this.global_var.user_nav.data.uname;
                                } catch {
                                    this.global_var.user_info.uid = undefined;
                                    this.global_var.user_info.uname = undefined;
                                    console.warn(
                                        this.global_var.user_nav,
                                        `获取登陆信息失败，cookie可能过期`
                                    );
                                }
                            }
                            break;
                        }
                        case url.includes("/x/relation/modify"): {
                            try {
                                this.global_var.response.relation_modify_response =
                                    await response.json();
                            } catch (e) {
                                //console.log('关注响应',global_var.response.relation_modify_response);
                                this.global_var.response.relation_modify_response =
                                    undefined;
                                throw Error(`relation_modify_response, ${e}, ${this.global_var.user_info.uname}`);
                            } finally {
                            }
                            break;

                        }
                        case url.includes(
                            "/dynamic_like/v1/dynamic_like/thumb"
                        ): {
                            try {
                                this.global_var.response.dynamic_thumb_response =
                                    await response.json();
                            } catch (e) {
                                //console.log('动态点赞响应',global_var.response.dunamic_thumb_response);
                                this.global_var.response.dynamic_thumb_response =
                                    undefined;
                                throw Error(`${this.global_var.user_info.uname}\tglobal_dynamic_data, ${e}, ${this.global_var.user_info.uname}`);
                            } finally {
                            }
                            break;

                        }
                        case url.includes("space/reservation"): {
                            try {
                                this.global_var.response.space_reservation =
                                    await response.json();
                                console.log(
                                    `${
                                        this.global_var.user_info.uname
                                    }\t空间预约响应：\n${JSON.stringify(
                                        this.global_var.response.space_reservation
                                    )}`
                                );
                            } catch (e) {
                                this.global_var.response.space_reservation =
                                    undefined;
                                throw Error(`${this.global_var.user_info.uname}\nreservation, ${e}`);
                            } finally {
                            }
                            break;

                        }
                        case url.includes("msgfeed/unread"): {
                            try {
                                let resp_json = await response.json();
                                if (!resp_json.code) {
                                    this.global_var.response.msgfeed_unread =
                                        resp_json;
                                    // console.log(`${this.global_var.user_info.uname}\t我的消息响应：\n${JSON.stringify(this.global_var.response.msgfeed_unread)}`);
                                }
                            } catch (e) {
                                this.global_var.response.msgfeed_unread = undefined;
                                //throw (`${this.global_var.user_info.uname}\t我的消息响应获取失败msgfeed/unread, ${e}`);
                            } finally {
                            }
                            break;

                        }
                        case url.includes("data.bilibili.com/log/web"): {
                            break;
                        }
                        default: {
                            break;
                        }
                    }
                } catch (e) {
                    console.warn(
                        `${
                            this.global_var.user_info.uname
                        }监听api响应失败\t${url}\n${e}\n${JSON.stringify(
                            response
                        )}`
                    );
                }
            });
        };


    /**
     * 浏览器启动
     * @param {boolean} check_login_flag - 是否检查登录状态，也就是是否前往b站首页
     * @param {usage_map} usage 新页面的用途
     * @returns {Promise<boolean>} true 代表账号信息获取成功
     */
    account_init = async (check_login_flag = true, usage = usage_map.Lottery) => {
        let is_create_new_pg = false;
        /**
         *检查是否登录了账号
         * @returns {Promise<boolean | undefined>}
         */
        let check_login = async () => {
            if (!check_login_flag) {
                return true;
            }
            try {
                await this.global_var.current_page.goto(
                    "https://message.bilibili.com/?spm_id_from=333.1007.0.0#/love",
                    {
                        waitUntil: "domcontentloaded",
                    }
                );
                await sleep(3e3);
                await this.global_var.current_page.goto("about:blank");
            } catch {
                await sleep(3e3);
            }

            if (this.global_var.user_info.uname) {
                console.log(
                    this.lottery_setting.CONFIG.COOKIENAME,
                    this.global_var.user_info.uname,
                    "账号初始化完成"
                );
                return true;
            } else {
                return false;
            }
        };
        /**
         * 监听浏览器响应
         */

        if (
            (await this.global_var.current_page.browser().pages()).length === 0 ||
            !this.global_var.current_page.browser().isConnected()
        ) {
            //浏览器未打开状态
            let cookieStr;
            try {
                cookieStr = await this.MYAPI.cookieSetting.getCookie(
                    this.lottery_setting.CONFIG.COOKIENAME
                );
            } catch {
            }
            let browser;
            let __args = [];
            if (this.lottery_setting.CONFIG.proxy) {
                __args.push(`--proxy-server=${this.lottery_setting.CONFIG.proxy}`);
            }
            __args.push(
                "--disable-web-security",
                "--start-stack-profiler",
                "-–ignore-certificate-errors",
                "--disable-infobars",
                "--disable-session-crashed-bubble",
                "--disable-gpu",
                "--disable-dev-shm-usage",
                "--mute-audio",
                "--disable-extensions",
                "--no-zygote",
                "--disable-xss-auditor",
                "--disable-popup-blocking",
                "--start-maximized",
                "--disable-infobars",
                "--window-position=0,0",
                "--ignore-certifcate-errors",
                "--ignore-certifcate-errors-spki-list",
                "--window-size=1920,1080",
                "--disable-accelerated-2d-canvas",
                "--disable-setuid-sandbox",
                `--profile-directory=${this.lottery_setting.CONFIG.ProfileDir}`
            );
            for (let retry = 0; retry < 5; retry++) {
                //五次重试启动浏览器的机会
                try {
                    if (this.lottery_setting.CONFIG.PersistStore) {
                        browser = await puppeteer.launch({

                            executablePath: `C:\\Users\\Acer\\AppData\\Local\\Google\\Chrome SxS\\Application\\chrome.exe`, //浏览器路径
                            headless: false, //false为显示浏览器界面
                            defaultViewport: {
                                //分辨率
                                width: 1920,
                                height: 1080,
                            },
                            args: __args,
                            userDataDir: `${this.user_name}\\${this.account_name}`,
                            ignoreDefaultArgs: [
                                "--enable-automation",
                                "--disable-extensions",
                                "--disable-client-side-phishing-detection",
                                "--disable-sync",
                                "--no-first-run",
                            ],
                            dumpio:true,
                            pipe:true,
                            ignoreHTTPSErrors: true,
                            protocol:'webDriverBiDi'
                        });
                        let page = (await browser.pages())[0];
                        await pptr_op.hook_teck_logdata(page);
                        this.global_var.current_page = this.handle_create_new_page(page, usage_map.Lottery)
                        is_create_new_pg = true
                        //await this.global_var.current_page_info.page.setUserAgent(useragent);//设置浏览器ua
                    } else {
                        browser = await puppeteer.launch({
                                executablePath:
                                    "C:/Users/Acer/AppData/Local/Google/Chrome SxS/Application/chrome.exe", //浏览器路径
                                headless: false, //false为显示浏览器界面
                                defaultViewport: {
                                    width: 1920,
                                    height: 1080,
                                },
                                args: __args,
                                ignoreDefaultArgs: [
                                    "--enable-automation",
                                    "--disable-extensions",
                                    "--disable-client-side-phishing-detection",
                                    "--disable-sync",
                                ],

                            }
                        );
                        let page = await browser.newPage();
                        await pptr_op.hook_teck_logdata(page);
                        this.global_var.current_page =this.handle_create_new_page(page, usage_map.BrowserMode)
                        let ck = this.MYAPI.browserSetting.getCookies(
                            cookieStr,
                            ".bilibili.com"
                        );
                        is_create_new_pg = true;
                    }
                    await this.global_var.current_page.goto("about:blank");
                    break;
                } catch (e) {
                    console.error(
                        `${this.lottery_setting.CONFIG.COOKIENAME}\t浏览器启动失败\n${e}`
                    );
                    await sleep(10e3);
                    continue;
                }
            }
        }
        if (this.global_var.current_page && !this.global_var.current_page.isClosed()) {
            //浏览器未关闭，抽奖页面已关闭
            let br = this.global_page.browser();
            let new_pg = await br.newPage();
            await pptr_op.hook_teck_logdata(new_pg);
            this.global_var.current_page =this.handle_create_new_page(new_pg, usage)
            is_create_new_pg = true;
        }
        if (is_create_new_pg && !this.browser_mode) {
            await global_page_listen();
        }
        if (!this.global_var.user_info.uname) {
            await check_login();
        }
    };


    #launch_lottery = async () => {
        /**
         * @type {GlobalVar}
         */
        let MYAPI = this.MYAPI;
        let my_operator = this.my_operator;
        if (this.lottery_setting === undefined)
            this.lottery_setting = await utl.get_lottery_setting(this.account_name, this.uid);
        try {
            //#region 抽预约抽奖
            /**
             * {
             url: reserve_url,
             etime: etime,
             lottery_prize_info: lottery_prize_info,
             开奖时间: new Date(
             etime * 1e3
             ).toLocaleString(),
             jump_url: jump_url,
             add_ts_scond: Math.floor(Date.now() / 1000),
             };

             * @typedef {Object} TYPE_reserve_data
             * @property {String} reserve_url 空间动态链接 like https://space.bilibili.com/1927279531
             * @property {number} etime - 结束时间(秒)
             * @property {String} lottery_prize_info - 奖品名称
             * @property {String} jump_url  - 单独抽奖的跳转链接，like https://www.bilibili.com/h5/lottery/result?business_id=3640758&business_type=10
             * @property {number} reserve_sid - 直播预约sid
             * @property {boolean} available - 预约是否正常存在
             *
             */
            /**
             * 预约抽奖循环程序，返回参加成功和失败的抽奖数据
             * @param {TYPE_reserve_data[]} loop_list
             * @returns
             */
            const reserve_lottery_loop = async (loop_list) => {
                let joined_lottery_record = await AccountDao.get_reserve_lottery_log_sids_by_account_id(this.account_id)
                joined_lottery_record = utl.noRepeatArr(
                    joined_lottery_record
                ); //参加过的必抽的大奖

                /**确认参加的列表*/
                /**@type {TYPE_reserve_data[]} 存放确定要去执行参与的数据 */
                let checked_loop_list = [];
                let joinfail_list = [];
                /**@type {Object[]} 存放JSONDATA里面的数据*/
                let new_reserve_data = [];
                /**@type {TYPE_reserve_data[]} 参加成功的列表*/
                let joinsuccess_list = [];
                for (let i of loop_list) {
                    if (
                        !joined_lottery_record.includes(
                            JSON.stringify(i.reserve_sid)
                        )
                    ) {
                        // 记录中不包含sid则添加进抽奖列表
                        checked_loop_list.push(i);
                    }
                }

                console.log(
                    `${this.global_var.user_info.uname}\t总共${loop_list.length}条预约抽奖 \n其中需要参加或访问${checked_loop_list.length}条\n`
                );
                for (let reserve_info of loop_list) {
                    if (!checked_loop_list.includes(reserve_info)) {
                        console.log(
                            `${this.global_var.user_info.uname}\t${reserve_info.reserve_url}\t已经参加过了的预约抽奖，跳过！`
                        );
                        continue;
                    }
                    let record_data = undefined;
                    console.log(
                        `${this.global_var.user_info.uname}\t前往预约页面: ${reserve_info.reserve_url}\n`
                    );
                    this.global_var.response.space_reservation = undefined;
                    await pptr_op.check_page_is_front(this.global_var.current_page);
                    try {
                        await this.global_var.current_page.goto(
                            reserve_info.reserve_url
                        );
                        await sleep(10e3);
                        await pptr_op.check_page_is_front(this.global_var.current_page);
                    } catch (e) {
                        console.warn(
                            `${this.global_var.user_info.uname}\t前往预约页面 ${reserve_info.reserve_url} 失败\nreserve_lottery_loop\n`,
                            e
                        );
                    }
                    if (!this.global_var.response.space_reservation) {
                        console.warn(
                            `${this.global_var.user_info.uname}\t未获取到预约响应！`
                        );
                        continue;
                    }
                    await sleep(3e3);
                    let reserve_index; //预约抽奖的序号
                    if (this.global_var.response.space_reservation) {
                        //如果获取到空间预约响应，则判断时间是否符合
                        if (this.global_var.response.space_reservation.data) {
                            let reserve_datas =
                                this.global_var.response.space_reservation.data;
                            reserve_index = reserve_datas.indexOf(
                                reserve_datas.find(
                                    (el) =>
                                        el.sid === reserve_info.reserve_sid
                                )
                            );
                            if (reserve_index === -1) {
                                console.error(
                                    `未在空间 ${reserve_info.reserve_url} 找到sid为${reserve_info.reserve_sid}的直播预约`
                                );
                                reserve_info.available = false;
                                continue;
                            }
                            let lottery_data = reserve_datas[reserve_index];
                            let etime = lottery_data.etime;
                            let lottery_prize_info =
                                lottery_data.lottery_prize_info.text;
                            let jump_url =
                                lottery_data.lottery_prize_info.jump_url;
                            record_data = {
                                url: reserve_info.reserve_url,
                                etime: etime,
                                lottery_prize_info: lottery_prize_info,
                                开奖时间: new Date(
                                    etime * 1e3
                                ).toLocaleString(),
                                jump_url: jump_url,
                                add_ts_scond: Math.floor(Date.now() / 1000),
                            };
                            new_reserve_data.push(record_data);

                            let btn_subscribe_btn_cancel; //检测是否已经参与了
                            let reserve_card;
                            let reserve_cards = await this.global_var.current_page.$$(
                                `.subscribe-list li`,
                                {timeout: 10e3}
                            );
                            if (
                                reserve_cards &&
                                reserve_cards.length >= reserve_index
                            ) {
                                reserve_card = reserve_cards[reserve_index];
                            }
                            try {
                                btn_subscribe_btn_cancel =
                                    await reserve_card.$(
                                        `.btn-subscribe.btn-cancel`
                                    );
                            } catch (e) {
                            }
                            if (!btn_subscribe_btn_cancel && reserve_card) {
                                let reserve_btn; //点击参与部分
                                try {
                                    reserve_btn = await reserve_card.$(
                                        `.btn-subscribe`
                                    );
                                } catch {
                                }
                                if (reserve_btn) {
                                    //如果找到了预约按钮
                                    await reserve_btn.click();
                                } else {
                                    joinfail_list.push(
                                        reserve_info.reserve_url
                                    );
                                    console.warn(
                                        `预约参加失败，reserv_btn`
                                    );
                                }
                                await sleep(3e3);
                                let reserve_btn_cancel;
                                try {
                                    reserve_btn_cancel =
                                        await reserve_card.$$(
                                            ".btn-subscribe.btn-cancel",
                                            {timeout: 10e3}
                                        );
                                } catch {
                                }
                                if (reserve_btn_cancel.length > 0) {
                                    console.log(
                                        `${this.global_var.user_info.uname} 参与预约抽奖：${reserve_info.reserve_url} 成功！`
                                    );
                                    joinsuccess_list.push(reserve_info);
                                } else {
                                    console.warn(
                                        `${this.global_var.user_info.uname} 参与预约抽奖：${reserve_info.reserve_url} 失败！`
                                    );
                                    joinfail_list.push(
                                        reserve_info.reserve_url
                                    );
                                }
                                /**
                                 * //点击参与部分结束
                                 */
                            } else {
                                console.log(
                                    `${this.global_var.user_info.uname} 已经参与预约抽奖：${reserve_info.jump_url}`
                                );
                                joinsuccess_list.push(reserve_info);
                            }
                        } else {
                            console.warn(
                                `${this.global_var.user_info.uname} 预约抽奖响应中未包含抽奖信息！\t${reserve_info.reserve_url} `
                            );
                            joinfail_list.push(reserve_info.reserve_url);
                        }
                    } else {
                        console.warn(
                            `${this.global_var.user_info.uname} 获取预约抽奖响应：${reserve_info.reserve_url} 失败！`
                        );
                        joinfail_list.push(reserve_info);
                        continue;
                    }
                }
                new_reserve_data.data = [...new Set(new_reserve_data.data)]; //对数组去重
                this.MYAPI.fileWrite(// 这个是给人看的
                    "JsonData/预约抽奖.json",
                    JSON.stringify(new_reserve_data, "", "\t")
                );
                let available_reserve_infos = loop_list.filter(
                    (el) =>
                        el.available !== false && el.etime > Date.now() / 1e3
                );
                if (available_reserve_infos.length > 0) {
                    await AccountDao.upsert_reserve_lottery_infos(available_reserve_infos);
                }
                return {
                    joinfail_list: joinfail_list,
                    joinsuccess_list: joinsuccess_list,
                };
            }

            //#endregion
            //#region 开始抽奖

            /**
             * 开始抽奖
             * @param {*} goto_url
             * @param {*} opus_dynamic
             * @returns {Promise<boolean>}
             */
            const do_lottery = async (goto_url, opus_dynamic = false) => {
                try {
                    console.log(
                        `${
                            this.global_var.user_info.uname
                        }\t开始抽奖\t${goto_url}\t${new Date().toLocaleTimeString()}`
                    );
                    if (
                        !(await pptr_op.check_bili_login(this.global_var.current_page))
                    ) {
                        let err_msg = `${this.lottery_setting?.CONFIG?.COOKIENAME}账号登录失效！`;
                        console.error(err_msg);
                        await pptr_op.my_send_notify.push_me(
                            err_msg,
                            JSON.stringify(this.global_var.user_info, "", "\t")
                        );
                        throw Error(err_msg);
                    }
                    let pageurl = this.global_var.current_page.url();
                    if (pageurl.includes("opus")) {
                        console.log(
                            `${
                                this.global_var.user_info.uname
                            }\t使用opus动态模式\t${goto_url}\t${new Date().toLocaleTimeString()}`
                        );
                        opus_dynamic = true;
                    } else {
                        opus_dynamic = false;
                        console.log(
                            `${
                                this.global_var.user_info.uname
                            }\t使用传统动态模式\t${goto_url}\t${new Date().toLocaleTimeString()}`
                        );
                    }
                    ///判断是否是404动态
                    if (pageurl.includes("read/cv")) {
                        opus_dynamic = false;
                        console.log(
                            `${
                                this.global_var.user_info.uname
                            }\t使用传统动态模式\t${goto_url}\t${new Date().toLocaleTimeString()}`
                        );
                        await this.global_var.current_page.goto(
                            `https://t.bilibili.com/${this.global_var.dynamic_id}`
                        );
                        pageurl = this.global_var.current_page.url();
                    }
                    if (
                        pageurl.includes("www.bilibili.com/404") &&
                        !goto_url.includes(`www.bilibili.com/opus`)
                    ) {
                        for (let i = 0; i < 3; i++) {
                            try {
                                console.log(
                                    `${
                                        this.global_var.user_info.uname
                                    }\t查看该动态是否为404动态\t${goto_url}\t${new Date().toLocaleTimeString()}`
                                );
                                await this.global_var.current_page.goto(
                                    `https://www.bilibili.com/opus/${this.MYAPI.BiliAPI.draw_dynamic_id(
                                        goto_url
                                    )}`
                                );
                                await sleep(3e3);
                                pageurl = this.global_var.current_page.url();
                                let error_container = await this.global_var.current_page.$(
                                    ".error-container"
                                ); //404动态的那张图片
                                if (
                                    error_container ||
                                    this.global_var.response.global_dynamic_data ===
                                    -412
                                ) {
                                    console.log(
                                        `${
                                            this.global_var.user_info.uname
                                        }404动态\n${goto_url}\nhttps://www.bilibili.com/opus/${this.MYAPI.BiliAPI.draw_dynamic_id(
                                            goto_url
                                        )}\t${new Date().toLocaleString()}`
                                    );
                                    await my_operator.log_record.my_throw(
                                        `404动态\t${goto_url}\t${this.global_var.user_info.uname}`
                                    );
                                    return false;
                                }
                                break;
                            } catch (e) {
                                console.error(e);

                            }
                        }
                    }
                    if (pageurl.includes("www.bilibili.com/404")) {
                        console.log(
                            `404动态\n${goto_url}\nhttps://www.bilibili.com/opus/${this.MYAPI.BiliAPI.draw_dynamic_id(
                                goto_url
                            )}\t${this.global_var.user_info.uname}`
                        );
                        await my_operator.log_record.my_throw(
                            `404动态\t${goto_url}\t${this.global_var.user_info.uname}`
                        );
                        return false;
                    }
                    if (await this.global_var.current_page.$(`.error-container`)) {
                        console.log(
                            `404动态\n${goto_url}\nhttps://www.bilibili.com/opus/${this.MYAPI.BiliAPI.draw_dynamic_id(
                                goto_url
                            )}\t${this.global_var.user_info.uname}`
                        );
                        await my_operator.log_record.my_throw(
                            `404动态\t${goto_url}\t${this.global_var.user_info.uname}`
                        );
                        return false;
                    }

                    if (pageurl.includes(`www.bilibili.com/opus`)) {
                        try {
                            this.global_var.response.global_dynamic_data =
                                await utl.Get_Opus_Dynamic_Data();
                        } catch (e) {
                            console.warn(
                                `${this.global_var.user_info.uname}获取动态详情失败`,
                                e
                            );
                        }
                    }
                    console.log(
                        `${
                            this.global_var.user_info.uname
                        }\t是记录的抽奖动态\t${goto_url}\t${new Date().toLocaleTimeString()}`
                    );
                    let bt = 0;
                    while (1) {
                        if (this.global_var.response.global_dynamic_data) {
                            break;
                        }
                        await sleep(1e3);
                        console.log(
                            `${this.global_var.user_info.uname}\t未获取到动态信息\t${goto_url}`
                        );
                        if (pageurl.includes(`www.bilibili.com/opus`)) {
                            try {
                                this.global_var.response.global_dynamic_data =
                                    await utl.Get_Opus_Dynamic_Data();
                            } catch (e) {
                                console.warn(
                                    `${this.global_var.user_info.uname}获取动态详情失败`,
                                    e
                                );
                            }
                        }
                        await this.global_var.current_page.reload();
                        await sleep(5e3);
                        bt += 1;
                        if (bt >= 3) {
                            await my_operator.log_record.my_throw(
                                `未获取到动态信息\t${goto_url}\t${this.global_var.user_info.uname}`
                            );
                            return false;
                        }
                    }
                    await sleep(
                        0.5 *
                        utl.random_choice(
                            this.lottery_setting.Working_clearance_time
                        )
                    );
                    let comment_forbidden_mark = false; //禁止评论标志
                    if (this.global_var.response.reply_main) {
                        if (this.global_var.response.reply_main?.code === 12061) {
                            console.warn(
                                `${this.global_var.user_info.uname} ${pageurl} UP主已关闭评论区！ 只进行转发和点赞操作！`
                            );
                            comment_forbidden_mark = true;
                            //UP主已关闭评论区
                            // await my_operator.log_record.my_throw(
                            // 	"动态评论失败，原因：UP主已关闭评论区"
                            // );
                            // return;
                        }
                    }
                    let thumb_status;
                    try {
                        thumb_status =
                            (await this.global_var.current_page.$(
                                ".side-toolbar__action.like.is-active"
                            )) ||
                            (await this.global_var.current_page.$(
                                ".bili-dyn-action.like.active"
                            ));
                    } catch (e) {
                        console.error(
                            `获取点赞状态失败，\t${pageurl}\t${this.global_var.user_info.uname}`,
                            e
                        );
                    }
                    if (thumb_status) {
                        //先进行点赞判断
                        console.log(
                            `${this.global_var.user_info.uname}\t点过赞的动态\t${pageurl}`
                        );
                        await sleep(
                            utl.random_choice(
                                this.lottery_setting.Working_clearance_time
                            )
                        );
                        let comment_msg = "点过赞的动态";
                        await my_operator.log_record.my_throw(comment_msg);
                        return false;
                    }

                    // if (await my_operator.judge_lottery_time.judge_charge_lottery()) {
                    //     await sleep(utl.random_choice(this.lottery_setting.Working_clearance_time))
                    //     await my_operator.log_record.my_throw('过期的官方抽奖（充电抽奖）')
                    //     return
                    // }
                    let is_past =
                        my_operator.judge_lottery_time.judge_official_lottery();
                    if (is_past === true) {
                        await sleep(
                            utl.random_choice(
                                this.lottery_setting.Working_clearance_time
                            )
                        );
                        await my_operator.log_record.my_throw(
                            `过期的官方抽奖\t${pageurl}\t${this.global_var.user_info.uname}`
                        );
                        return false;
                    } else if (is_past === false) {
                        //未过期的官方抽奖
                        if (
                            !goto_url.includes("tab=1") &&
                            !goto_url.includes("tab=2")
                        ) {
                            goto_url += "?tab=1";
                        }
                    }

                    let dynamic_comment_count =
                        this.global_var.response.global_dynamic_data.item.modules
                            .module_stat.comment.count;
                    let dynamic_repost_count =
                        this.global_var.response.global_dynamic_data.item.modules
                            .module_stat.forward.count;
                    if (
                        !(
                            dynamic_comment_count > 30 ||
                            dynamic_repost_count > 30
                        ) &&
                        !goto_url.includes("tab=1")
                    ) {
                        let author_official_verify =
                            this.global_var.response.global_dynamic_data.item
                                .modules?.module_author?.official_verify
                                ?.type;
                        if (author_official_verify !== 1) {
                            //非官方的动态少于30个评论不参加
                            await my_operator.log_record.my_throw(
                                "评论人数过少，需要人工判断"
                            );
                            return false;
                        } else {
                            if (dynamic_comment_count <= 10) {
                                //官方的动态少于10个评论不参加
                                //如果官方的评论人数过少了，就不转发
                                await my_operator.log_record.my_throw(
                                    "评论人数过少，需要人工判断"
                                );
                                return false;
                            }
                        }
                    }
                    let dynamic_content;
                    try {
                        dynamic_content =
                            await my_operator.dynamic_content_operator.get_dynamic_content_and_top_msg(
                                this.global_var.response.global_dynamic_data
                            );
                        dynamic_content = dynamic_content.replaceAll(
                            /(\[(?<=\[)(.*?)(?=\])])/gim,
                            ""
                        ); //移除表情包
                    } catch {
                    }
                    let comment_msg;
                    if (dynamic_content === false) {
                        console.warn(
                            this.global_var.response.global_dynamic_data
                        );
                        await my_operator.log_record.my_throw(
                            "dynamic_content==false回复内容为空或者是动态内容为空，检查一下获取动态的函数"
                        );
                        return undefined;
                    }
                    // console.log(this.global_var.response.global_dynamic_data)
                    if (goto_url.includes("tab=1")) {
                        //如果是只转发的动态则不生成评论内容
                    } else {
                        comment_msg =
                            await my_operator.dynamic_comment_operator.reply_comment_generator(
                                dynamic_content,
                                this.MYAPI.BiliAPI.draw_dynamic_id(goto_url)
                            );
                    }
                    if (
                        comment_msg === undefined ||
                        !comment_msg.includes(`需要人工回复的动态`)
                    ) {
                        //如果包含undefined或者不需要人工回复就开始抽奖
                        if (
                            (!comment_msg ||
                                typeof comment_msg != "string") &&
                            !(
                                goto_url.includes("tab=1") ||
                                comment_forbidden_mark
                            )
                        ) {
                            await my_operator.log_record.my_throw("回复内容为空");
                            return false;
                        }
                        if (
                            this.global_var.response.global_dynamic_data.item
                                .modules.module_author.following == null
                        ) {
                            //判断关注，为null则是没关注 总共尝试5次关注
                            for (let i = 0; i <= 5; i++) {
                                await pptr_op.check_bili_login(
                                    this.global_var.current_page
                                );
                                if (
                                    pageurl.includes(
                                        `www.bilibili.com/opus/`
                                    )
                                ) {
                                    // try {
                                    //     await sleep(1e3)
                                    //     await this.global_var.current_page_info.page.evaluate(() => {
                                    //         this.scrollTo(0, 2500)
                                    //     })
                                    //     await sleep(1e3)
                                    //     let follow_btn = await this.global_var.current_page_info.page.$(`.bili-follow-button`)
                                    //     let button_content = await (await follow_btn.getProperty('textContent')).jsonValue()
                                    //     if (button_content.includes(`已关注`)) {
                                    //         console.log(`${this.global_var.user_info.uname}\t已经关注的UP！\thttps://space.bilibili.com/${this.global_var.response.global_dynamic_data.item.modules.module_author.mid}`);
                                    //         break;
                                    //     }
                                    //     await follow_btn.click();
                                    //     await sleep(3e3)
                                    //     await this.global_var.current_page_info.page.evaluate(() => {
                                    //         this.scrollTo(0, -1500)
                                    //     })
                                    //     follow_btn = await this.global_var.current_page_info.page.$(`.bili-follow-button`)
                                    //     button_content = await (await follow_btn.getProperty('textContent')).jsonValue()
                                    //     if (button_content.includes(`已关注`)) {
                                    //         console.log(`${goto_url}\t${this.global_var.user_info.uname}\t关注成功！\thttps://space.bilibili.com/${this.global_var.response.global_dynamic_data.item.modules.module_author.mid}`);
                                    //         break;
                                    //     }
                                    //     else {
                                    //         if (this.global_var.response.relation_modify_response) {
                                    //             if (this.global_var.response.relation_modify_response.code != 0) {
                                    //                 console.warn(`${goto_url}\t${this.global_var.user_info.uname}\t点击关注失败 https://space.bilibili.com/${this.global_var.response.global_dynamic_data.item.modules.module_author.mid}\n${JSON.stringify(this.global_var.response.relation_modify_response)}`);
                                    //                 if (this.global_var.response.relation_modify_response.code != 22002) {//{"code":22002,"message":"因对方隐私设置，你还不能关注","ttl":1}
                                    //                     console.warn(`${goto_url}\t${this.global_var.user_info.uname}\t点击关注失败 https://space.bilibili.com/${this.global_var.response.global_dynamic_data.item.modules.module_author.mid}\n${JSON.stringify(this.global_var.response.relation_modify_response)}\t风控导致，休眠0.25小时！${(new Date()).toLocaleTimeString()}`);
                                    //                     await sleep(0.25 * 3600e3)
                                    //                 }
                                    //                 else {
                                    //                     break;//因为被拉黑了所以直接跳过
                                    //                 }
                                    //                 break;
                                    //             }
                                    //         }
                                    //         console.warn(`${goto_url}\t${this.global_var.user_info.uname}\t点击关注失败 https://space.bilibili.com/${this.global_var.response.global_dynamic_data.item.modules.module_author.mid}`);
                                    //         await sleep(5e3)
                                    //     }
                                    // }
                                    // catch (e) {
                                    //     if (i >= 5) {
                                    //         throw (`${this.global_var.user_info.uname}\t关注失败，${e}`)
                                    //     }
                                    //     console.log(e);
                                    //     await sleep(3e3)
                                    //     continue;
                                    // }
                                    let follow_pg = await this.global_var.current_page
                                        .browser()
                                        .newPage();
                                    try {
                                        await follow_pg.goto(
                                            `https://space.bilibili.com/${this.global_var.response.global_dynamic_data.item.modules.module_author.mid}`
                                        );
                                        await pptr_op.check_page_is_front(
                                            follow_pg
                                        );
                                        await Promise.all([
                                            follow_pg
                                                .waitForSelector(
                                                    ".h-f-btn.h-follow"
                                                )
                                                .then((el) => el.click())
                                                .catch(() => {
                                                    return {
                                                        status: "fail"
                                                    }
                                                }),
                                            (this.global_var.response.relation_modify_response =
                                                await follow_pg
                                                    .waitForResponse(
                                                        (resp) =>
                                                            resp
                                                                .url()
                                                                .includes(
                                                                    "x/relation/modify"
                                                                )
                                                    )
                                                    .then(
                                                        async (
                                                            response
                                                        ) => {
                                                            return await response.json();
                                                        }
                                                    )
                                                    .catch(() => {
                                                        return {
                                                            status: "fail"
                                                        }
                                                    })),
                                        ]).catch((e) => {
                                            console.error(
                                                `${
                                                    this.global_var.user_info
                                                        .uname
                                                }\t关注 https://space.bilibili.com/${
                                                    this.global_var.response
                                                        .global_dynamic_data
                                                        .item.modules
                                                        .module_author.mid
                                                } 失败，${JSON.stringify(
                                                    e
                                                )}\n${e.stack}`
                                            );
                                        });

                                        if (
                                            this.global_var.response
                                                .relation_modify_response
                                        ) {
                                            if (
                                                this.global_var.response
                                                    .relation_modify_response
                                                    .code !== 0
                                            ) {
                                                console.warn(
                                                    `${goto_url}\t${
                                                        this.global_var.user_info
                                                            .uname
                                                    }\t点击关注失败 https://space.bilibili.com/${
                                                        this.global_var.response
                                                            .global_dynamic_data
                                                            .item.modules
                                                            .module_author
                                                            .mid
                                                    }\n${JSON.stringify(
                                                        this.global_var.response
                                                            .relation_modify_response
                                                    )}`
                                                );
                                                if (
                                                    this.global_var.response
                                                        .relation_modify_response
                                                        .code !== 22002
                                                ) {
                                                    //{"code":22002,"message":"因对方隐私设置，你还不能关注","ttl":1}
                                                    console.warn(
                                                        `${goto_url}\t${
                                                            this.global_var
                                                                .user_info
                                                                .uname
                                                        }\t点击关注失败 https://space.bilibili.com/${
                                                            this.global_var
                                                                .response
                                                                .global_dynamic_data
                                                                .item
                                                                .modules
                                                                .module_author
                                                                .mid
                                                        }\n${JSON.stringify(
                                                            this.global_var
                                                                .response
                                                                .relation_modify_response
                                                        )}\t风控导致，休眠1小时！${new Date().toLocaleTimeString()}`
                                                    );
                                                    await my_operator.log_record.my_throw(
                                                        `${goto_url}\t${
                                                            this.global_var
                                                                .user_info
                                                                .uname
                                                        }\t点击关注失败 https://space.bilibili.com/${
                                                            this.global_var
                                                                .response
                                                                .global_dynamic_data
                                                                .item
                                                                .modules
                                                                .module_author
                                                                .mid
                                                        }\n${JSON.stringify(
                                                            this.global_var
                                                                .response
                                                                .relation_modify_response
                                                        )}\t风控导致，休眠1小时！${new Date().toLocaleTimeString()}`
                                                    );
                                                    if (
                                                        !follow_pg.isClosed()
                                                    ) {
                                                        await follow_pg.close();
                                                    }
                                                    await sleep(3600e3);
                                                    break;
                                                } else {
                                                    await my_operator.log_record.my_throw(
                                                        `${goto_url}\t${this.global_var.user_info.uname}\t被拉黑了，不抽了 https://space.bilibili.com/${this.global_var.response.global_dynamic_data.item.modules.module_author.mid}`
                                                    );
                                                    if (
                                                        !follow_pg.isClosed()
                                                    ) {
                                                        await follow_pg.close();
                                                    } //因为被拉黑了所以直接跳过
                                                    return true;
                                                }
                                            } else {
                                                console.log(
                                                    `${goto_url}\t${this.global_var.user_info.uname}\t关注成功！\thttps://space.bilibili.com/${this.global_var.response.global_dynamic_data.item.modules.module_author.mid}`
                                                );
                                            }
                                        }
                                        await sleep(5e3);
                                        if (!follow_pg.isClosed()) {
                                            await follow_pg.close();
                                        }
                                        break;
                                    } catch (e) {
                                        if (i >= 5) {
                                            await my_operator.log_record.my_throw(
                                                `${this.global_var.user_info.uname}\t关注失败，${e}`
                                            );
                                        }
                                        if (
                                            (
                                                await follow_pg.$$(
                                                    `.h-f-icon`
                                                )
                                            ).length > 0
                                        ) {
                                            console.log(
                                                `${this.global_var.user_info.uname}\t关注 https://space.bilibili.com/${this.global_var.response.global_dynamic_data.item.modules.module_author.mid} 成功了`
                                            );
                                            break;
                                        }
                                        console.error(
                                            `${
                                                this.global_var.user_info.uname
                                            }\t关注 https://space.bilibili.com/${
                                                this.global_var.response
                                                    .global_dynamic_data
                                                    .item.modules
                                                    .module_author.mid
                                            } 失败，${JSON.stringify(e)}\n${
                                                e.stack
                                            }`
                                        );
                                        await sleep(3e3);
                                        if (!follow_pg.isClosed()) {
                                            await follow_pg.close();
                                        }
                                        continue;
                                    }
                                } else {
                                    try {
                                        console.log(
                                            `${this.global_var.user_info.uname}\t未关注\thttps://space.bilibili.cthis.om/${this.global_var.response.global_dynamic_data.item.modules.module_author.mid}\t${pageurl}`
                                        );
                                        await pptr_op.check_page_is_front(
                                            this.global_var.current_page
                                        );
                                        await this.global_var.current_page.hover(
                                            "div.bili-dyn-item__main > div.bili-dyn-item__avatar > div > div"
                                        );
                                        await sleep(5e3);
                                        await this.global_var.current_page.click(
                                            "div.bili-user-profile-view__info__button.follow"
                                        );
                                        await sleep(3e3);
                                        let follow_checked_btn;
                                        try {
                                            follow_checked_btn =
                                                await this.global_var.current_page.$(
                                                    ".bili-user-profile-view__info__button.follow.checked",
                                                    {TIMEOUT: 10e3}
                                                );
                                        } catch {
                                            console.error(
                                                `${this.global_var.user_info.uname}\t点击关注失败 https://space.bilibili.com/${this.global_var.response.global_dynamic_data.item.modules.module_author.mid}`
                                            );
                                            await my_operator.log_record.my_throw(
                                                `${this.global_var.user_info.uname}\t点击关注失败 https://space.bilibili.com/${this.global_var.response.global_dynamic_data.item.modules.module_author.mid}`
                                            );
                                            throw this.global_var.response
                                                .relation_modify_response;
                                        }
                                        if (
                                            this.global_var.response
                                                .relation_modify_response
                                        ) {
                                            if (
                                                this.global_var.response
                                                    .relation_modify_response
                                                    .code !== 0
                                            ) {
                                                console.warn(
                                                    `${goto_url}\t${
                                                        this.global_var.user_info
                                                            .uname
                                                    }\t点击关注失败 https://space.bilibili.com/${
                                                        this.global_var.response
                                                            .global_dynamic_data
                                                            .item.modules
                                                            .module_author
                                                            .mid
                                                    }\n${JSON.stringify(
                                                        this.global_var.response
                                                            .relation_modify_response
                                                    )}`
                                                );
                                                if (
                                                    this.global_var.response
                                                        .relation_modify_response
                                                        .code !== 22002
                                                ) {
                                                    //{"code":22002,"message":"因对方隐私设置，你还不能关注","ttl":1}
                                                    console.warn(
                                                        `${goto_url}\t${
                                                            this.global_var
                                                                .user_info
                                                                .uname
                                                        }\t点击关注失败 https://space.bilibili.com/${
                                                            this.global_var
                                                                .response
                                                                .global_dynamic_data
                                                                .item
                                                                .modules
                                                                .module_author
                                                                .mid
                                                        }\n${JSON.stringify(
                                                            this.global_var
                                                                .response
                                                                .relation_modify_response
                                                        )}\t风控导致，休眠0.5小时！${new Date().toLocaleTimeString()}`
                                                    );
                                                    await my_operator.log_record.my_throw(
                                                        `${goto_url}\t${
                                                            this.global_var
                                                                .user_info
                                                                .uname
                                                        }\t点击关注失败 https://space.bilibili.com/${
                                                            this.global_var
                                                                .response
                                                                .global_dynamic_data
                                                                .item
                                                                .modules
                                                                .module_author
                                                                .mid
                                                        }\n${JSON.stringify(
                                                            this.global_var
                                                                .response
                                                                .relation_modify_response
                                                        )}\t风控导致，休眠0.5小时！${new Date().toLocaleTimeString()}`
                                                    );
                                                    await sleep(
                                                        0.5 * 3600e3
                                                    );
                                                    break;
                                                } else {
                                                    return true; //因为被拉黑了所以直接跳过
                                                }
                                            } else {
                                                console.log(
                                                    `${goto_url}\t${this.global_var.user_info.uname}\t关注成功！\thttps://space.bilibili.com/${this.global_var.response.global_dynamic_data.item.modules.module_author.mid}`
                                                );
                                            }
                                        }
                                        if (follow_checked_btn) {
                                            console.log(
                                                `${this.global_var.user_info.uname}\t关注成功！\thttps://space.bilibili.com/${this.global_var.response.global_dynamic_data.item.modules.module_author.mid}`
                                            );
                                            break;
                                        }
                                        // if (this.global_var.response.relation_modify_response.code == 0) {
                                        //     console.log('关注成功', this.global_var.response.relation_modify_response);
                                        //     break;
                                        // }
                                        // else {
                                        //     await my_operator.log_record.my_throw('关注失败')
                                        // }
                                    } catch (e) {
                                        if (i >= 3) {
                                            await my_operator.log_record.my_throw(
                                                `${this.global_var.user_info.uname}\t关注失败，${e}`
                                            );
                                        }
                                        console.warn(
                                            `${this.global_var.user_info.uname}\t关注失败\n${e}\n${e.stack}`
                                        );
                                        await sleep(3e3);
                                        await this.global_var.current_page.evaluate(
                                            () => {
                                                this.scrollTo(0, 2500);
                                            }
                                        );
                                        continue;
                                    }
                                }
                                break;
                            }
                        }
                        if (
                            !(await pptr_op.check_page_is_front(
                                this.global_var.current_page
                            ))
                        ) {
                            await this.account_init(false);
                            await this.global_var.current_page.goto(goto_url);
                        }
                        await this.global_var.current_page.evaluate(() => {
                            this.scrollTo(0, 1500);
                        });
                        await sleep(1e3);
                        await this.global_var.current_page.evaluate(() => {
                            this.scrollTo(0, 1500);
                        });
                        await sleep(1e3);
                        await this.global_var.current_page.evaluate(() => {
                            this.scrollTo(0, -1500);
                        });
                        await sleep(1e3);

                        // console.log(this.global_var.response.global_dynamic_data)
                        if (
                            goto_url.includes("tab=1") //|| comment_forbidden_mark
                        ) {
                            //只转发
                            if (this.lottery_setting.official_lottery_switch) {
                                await my_operator.fast_repost(opus_dynamic);
                                comment_msg = "无需评论动态";
                                await my_operator.log_record.construct_comment_record_data(
                                    comment_msg
                                );
                                await sleep(
                                    utl.random_choice(
                                        this.lottery_setting.Working_clearance_time
                                    )
                                );
                                return false;
                            } else {
                                await my_operator.log_record.my_throw("过期的官方抽奖");
                                return false;
                            }
                        }
                        console.log(
                            `${goto_url}\t${this.global_var.user_info.uname}\t动态内容： \n`,
                            dynamic_content,
                            "\n========================",
                            `${this.global_var.user_info.uname}\t${goto_url}\t回复内容： `,
                            comment_msg,
                            `\n#############################`
                        );
                        if (goto_url.indexOf("tab=2") > -1) {
                            //评论加转发
                            if (
                                Math.random() * 0.6 <
                                this.lottery_setting.repostchance ||
                                comment_msg?.includes("#") ||
                                this.global_var.response.reply_main.code ===
                                12061 ||
                                my_operator.dynamic_comment_operator.repost_with_comment_judge(
                                    dynamic_content
                                )
                                // 	dynamic_content.length > 200) &&
                            ) {
                                // if (pageurl.includes("opus")) {
                                await my_operator.comment_repost_dynamic_with_content(
                                    comment_msg,
                                    opus_dynamic
                                );
                                // } else {
                                // 	await my_operator.comment_repost_dynamic_without_content(
                                // 		comment_msg,
                                // 		opus_dynamic
                                // 	);
                                // }
                            } else {
                                await my_operator.comment_repost_dynamic_without_content(
                                    comment_msg,
                                    opus_dynamic
                                );
                            }
                        } else if (
                            goto_url.indexOf("tab=2") == -1 &&
                            goto_url.indexOf("tab=1") == -1
                        ) {
                            //只评论不转发
                            await my_operator.only_comment(
                                comment_msg,
                                opus_dynamic
                            );
                        } else if (
                            !(
                                goto_url.indexOf("tab=2") > -1 ||
                                goto_url.indexOf("tab=1") > -1
                            )
                        ) {
                            await my_operator.log_record.my_throw("未知tab类型");
                            return false;
                        }
                    }
                    await my_operator.log_record.construct_comment_record_data(
                        comment_msg
                    );
                    await sleep(
                        utl.random_choice(
                            this.lottery_setting.Working_clearance_time
                        )
                    );
                    return true;
                } catch (e) {
                    console.error(
                        `${
                            this.global_var.user_info.uname
                        }\tdo_lottery函数执行失败\t${goto_url}\t${new Date().toLocaleTimeString()}\n${e}\n${
                            e.stack
                        }`
                    );
                    e.message.includes(
                        `Requesting main frame too early!`
                    ) && (await this.global_var.current_page.close());
                    await pptr_op.check_bili_login(this.global_var.current_page);
                    if (
                        e
                            .toString()
                            .includes(`Requesting main frame too early`) ||
                        !(await pptr_op.check_page_is_front(
                            this.global_var.current_page
                        ))
                    ) {
                        (await this.global_var.current_page.close()) ||
                        (await this.global_var.current_page.browser().close());
                        await sleep(10e3);
                        await this.account_init(false);
                        return await do_lottery(goto_url, opus_dynamic); //如果只是页面或浏览器被关了，就继续执行抽奖
                    }
                    await sleep(10e3);
                    await my_operator.log_record.my_throw(
                        `发生未知错误，不可避免！${e.toString()}`
                    );
                    return true;
                }
            };
            /**
             * 抽奖循环，返回参与成功的抽奖
             * @param {Array} all_dynamic_id_list
             * @param {string} task_name --执行的任务名称
             * @returns {Promise<string[]>} 参与成功的抽奖动态id
             */
            let lottery_loop = async (
                all_dynamic_id_list,
                task_name = ""
            ) => {
                //对抽奖队列进行循环
                all_dynamic_id_list = utl.part_shuffle(
                    0.1 * all_dynamic_id_list.length,
                    all_dynamic_id_list
                ); //打乱百分之十的抽奖链接
                if (this.lottery_setting.CONFIG.lottery_sep_time_type === 1) {
                    if (all_dynamic_id_list.length <= 50) {
                        //设置运行时间
                        this.lottery_setting.lottery_run_time = 3600e3;
                    } else if (150 >= all_dynamic_id_list.length) {
                        this.lottery_setting.lottery_run_time = 1.5 * 3600e3;
                    } else if (200 > all_dynamic_id_list.length) {
                        this.lottery_setting.lottery_run_time = 2 * 3600e3;
                    } else if (300 > all_dynamic_id_list.length) {
                        this.lottery_setting.lottery_run_time = 2.5 * 3600e3;
                    } else {
                        this.lottery_setting.lottery_run_time = 3 * 3600e3;
                    }
                }
                if (
                    this.lottery_setting.CONFIG.lottery_sep_time_type === 2 ||
                    all_dynamic_id_list.length < 20
                ) {
                    this.lottery_setting.lottery_run_time =
                        this.lottery_setting.lottery_sep_time[0] *
                        all_dynamic_id_list.length;
                }
                this.lottery_setting.lottery_sep_time = utl.generater_step_Array(
                    (parseInt(0.5 * this.lottery_setting.lottery_run_time + 1) /
                        (all_dynamic_id_list.length + 1)),
                    parseInt(
                        (0.75 * this.lottery_setting.lottery_run_time + 1) /
                        (all_dynamic_id_list.length + 1)),
                    300
                );

                console.log(
                    `运行时间约为${
                        this.lottery_setting.lottery_run_time / 1000 / 60
                    }分钟`
                );
                let lottery_success = [];
                let lottery_record = []; //记录抽奖评论信息
                let manual_op = []; //需要人工操作的动态
                let manual_op_failed_record = []; //返回的失败的record
                let every_n_times_sleep_longtime = 30; //每隔多少个动态休息时间延长
                let longsleepflag = [true, 0]; //0是标志是否需要长时间休息,1是休息之后经过的抽奖次数
                let repost_counter = 0;
                try {
                    for (let i = 0; i < all_dynamic_id_list.length; i++) {
                        if (
                            utl.checkAuditTime(
                                this.global_var.TIME.None_Lottery_Time[0],
                                this.global_var.TIME.None_Lottery_Time[1]
                            )
                        ) {
                            console.log(
                                `${
                                    this.global_var.user_info.uname
                                }\t触发非抽奖时间段，需要进行休息：${
                                    this.global_var.TIME.None_Lottery_Time[0]
                                }-${
                                    this.global_var.TIME.None_Lottery_Time[1]
                                }暂停到${
                                    this.global_var.TIME.None_Lottery_Time[1]
                                }\t${new Date().toLocaleTimeString()}`
                            );
                            let sleep_hour =
                                parseInt(
                                    this.global_var.TIME.None_Lottery_Time[1].slice(
                                        0,
                                        2
                                    )
                                ) -
                                (new Date().getHours() + 1);
                            await sleep(sleep_hour * 3600e3);
                        }
                        let opus_dynamic = this.global_var.FLAG.opus动态标志;
                        this.global_var.dynamic_id =
                            MYAPI.BiliAPI.draw_dynamic_id(
                                all_dynamic_id_list[i]
                            );
                        let is_lot_error = false;
                        let loop_lot_retry_time = 0
                        do {
                            try {
                                if (
                                    this.lottery_setting.prevent_module
                                        .share_video_while_repost_chance != 0 &&
                                    repost_counter >
                                    this.lottery_setting.prevent_module
                                        .share_video_while_repost_sepnum *
                                    3
                                ) {
                                    if (
                                        Math.random() <
                                        this.lottery_setting.prevent_module
                                            .share_video_while_repost_chance
                                    ) {
                                        console.log(
                                            `${this.global_var.user_info.uname}\t触发间隔分享视频`
                                        );
                                        await my_operator.prevent_filter_module.share_video(
                                            1,
                                            1,
                                            1
                                        );
                                        repost_counter = 0;
                                    }
                                }
                                let init_time_hour =
                                    this.global_var.TIME.Init_Time.getHours();
                                if (
                                    !(init_time_hour < 19
                                        ? init_time_hour >= 18
                                        : init_time_hour < 12
                                            ? init_time_hour >= 11
                                            : false)
                                ) {
                                    //如果初始化的时间不在吃饭时间内，则判断
                                    if (
                                        new Date().getHours() < 19
                                            ? new Date().getHours() >= 18
                                            : new Date().getHours() < 12
                                                ? new Date().getHours() >= 11
                                                : false
                                    ) {
                                        if (!this.global_var.FLAG.吃饭休息标志) {
                                            console.log(
                                                `${this.global_var.user_info.uname}\t模拟吃饭休息时间休息20分钟`
                                            );
                                            await sleep(20 * 60 * 1e3);
                                            this.global_var.FLAG.吃饭休息标志 = true;
                                        }
                                    }
                                }
                                if (
                                    longsleepflag[1] >
                                    Math.round(
                                        every_n_times_sleep_longtime *
                                        (1 - 0.5 * Math.random())
                                    )
                                ) {
                                    longsleepflag[0] = true;
                                }
                                if (this.global_var.fengkong_flag == true) {
                                    console.log(
                                        `${this.global_var.user_info.uname} 出了点问题，停个15分钟再抽`,
                                        new Date().toLocaleString()
                                    );
                                    await sleep(15 * 60e3);
                                    this.global_var.fengkong_flag = false;
                                }
                                if (this.global_var.Pause) {
                                    while (1) {
                                        if (!this.global_var.Pause) {
                                            break;
                                        }
                                        await sleep(1e3);
                                    }
                                }
                                if (
                                    this.lottery_setting.CONFIG
                                        .Only_Comment_Lottery_Switch
                                ) {
                                    if (
                                        all_dynamic_id_list[i].includes(
                                            "tab=1"
                                        ) ||
                                        all_dynamic_id_list[i].includes("tab=2")
                                    ) {
                                        console.log(
                                            `${this.global_var.user_info.uname}  ${all_dynamic_id_list[i]}  只参与评论动态`
                                        );
                                        continue;
                                    }
                                }

                                try {
                                    let d = new Date();
                                    console.log(
                                        `${
                                            this.global_var.user_info.uname
                                        }\t当前任务【${task_name}】进度：  【${
                                            i + 1
                                        }/${all_dynamic_id_list.length}】\t\t${
                                            all_dynamic_id_list[i]
                                        } ${d.toLocaleTimeString()}`
                                    );
                                    if (this.global_var.current_page.isClosed()) {
                                        //每次抽奖循环时检测页面是否关闭，如果关闭则重新打开浏览器页面！
                                        await this.account_init(); //重新设置global_var.current_page_info.page
                                    }
                                    this.global_var.FLAG.抽奖中标志 = true;
                                    this.global_var.response.global_dynamic_data =
                                        undefined; //全局的动态数据
                                    this.global_var.response.create_dyn_response =
                                        undefined; //创建或转发动态的响应
                                    this.global_var.response.comment_dyn_response =
                                        undefined; //自己评论动态的响应
                                    this.global_var.response.relation_modify_response =
                                        undefined; //关注响应
                                    this.global_var.response.dynamic_thumb_response =
                                        undefined; //点赞动态响应
                                    this.global_var.response.space_reservation =
                                        undefined; //空间预约响应
                                    this.global_var.recorded_data = "";
                                    this.global_var.response.pageurl = all_dynamic_id_list[i];
                                    await pptr_op.check_page_is_front(
                                        this.global_var.current_page
                                    );
                                    //#region 前往页面
                                    if (opus_dynamic) {
                                        let break_time = 0;
                                        while (break_time <= 3) {
                                            break_time++;
                                            try {
                                                await this.global_var.current_page.goto(
                                                    `https://www.bilibili.com/opus/${this.MYAPI.BiliAPI.draw_dynamic_id(
                                                        all_dynamic_id_list[i]
                                                    )}`
                                                );
                                                break;
                                            } catch (e) {
                                                console.error(
                                                    `${
                                                        this.global_var.user_info
                                                            .uname
                                                    }\t前往页面失败！https://www.bilibili.com/opus/${this.MYAPI.BiliAPI.draw_dynamic_id(
                                                        all_dynamic_id_list[i]
                                                    )}\t${e}\n${e.stack}` +
                                                    (break_time < 3
                                                        ? `\n重试第${break_time}次！`
                                                        : `\n彻底失败！`)
                                                );
                                                await this.global_var.current_page
                                                    .browser()
                                                    .close();
                                                await sleep(10e3);
                                                await this.account_init(false);
                                            }
                                        }
                                    } else {
                                        await this.global_var.current_page.goto(
                                            all_dynamic_id_list[i]
                                        );
                                    }
                                    //#endregion
                                    await sleep(5e3);
                                    await pptr_op.check_bili_login(
                                        this.global_var.current_page
                                    );
                                    let 抽奖反馈 = await do_lottery(
                                        all_dynamic_id_list[i],
                                        opus_dynamic
                                    );
                                    if (
                                        抽奖反馈 &&
                                        (all_dynamic_id_list[i].includes(
                                                "tab=2"
                                            ) ||
                                            all_dynamic_id_list[i].includes(
                                                "tab=1"
                                            ))
                                    ) {
                                        repost_counter++;
                                    }
                                    let record = this.global_var.recorded_data;
                                    console.log(
                                        `${this.global_var.user_info.uname}\t${all_dynamic_id_list[i]}\t转评反馈：\n${record}\n==============================\n`
                                    );
                                    lottery_record.push(record);
                                    //遇到点过赞的动态不休眠
                                    if (record.includes("点过赞的动态")) {
                                        console.log(
                                            `${this.global_var.user_info.uname}\t${all_dynamic_id_list[i]}\t点过赞的动态不休眠`
                                        );
                                    } else {
                                        let st =
                                            utl.random_choice(
                                                this.lottery_setting.lottery_sep_time
                                            ) *
                                            (1 + Math.random() * 4);
                                        if (
                                            (i +
                                                utl.random_choice([
                                                    1, 2, 3, 4, 5, 6, 7,
                                                ])) %
                                            every_n_times_sleep_longtime ===
                                            0 &&
                                            longsleepflag[0]
                                        ) {
                                            //每隔多少次休眠
                                            st =
                                                utl.random_choice(
                                                    utl.generater_step_Array(
                                                        1 * 60e3,
                                                        3 * 60e3,
                                                        1e3
                                                    )
                                                ) *
                                                (1 + Math.random() * 4); //长间隔休眠时间，休息间隔拉长，模拟真人
                                            longsleepflag[0] = false;
                                            longsleepflag[1] = 0;
                                        }
                                        longsleepflag[1] += 1;
                                        console.log(
                                            `${this.global_var.user_info.uname}\t${
                                                all_dynamic_id_list[i]
                                            }\t休眠 ${
                                                st / 1000
                                            }秒\t${new Date().toLocaleTimeString()}`
                                        );
                                        await sleep(st); // 单个抽奖结束后等待时间
                                    }
                                    try {
                                        if (
                                            /https:\/\/t.bilibili.com\/(.\d+)/gim.exec(
                                                record
                                            ) ||
                                            /https:\/\/www.bilibili.com\/opus\/(.\d+)/gim.exec(
                                                record
                                            )
                                        ) {
                                            //如果动态id获取为空
                                            //啥都不干，因为可能是404的动态
                                        } else if (
                                            all_dynamic_id_list[i].includes(
                                                /https:\/\/t.bilibili.com\/(.\d+)/gim
                                                    .exec(record)
                                                    .slice(1)[0]
                                            ) ||
                                            all_dynamic_id_list[i].includes(
                                                /https:\/\/www.bilibili.com\/opus\/(.\d+)/gim
                                                    .exec(record)
                                                    .slice(1)[0]
                                            )
                                        ) {
                                            //如果不为空，判断是否包含对应动态id
                                            //包含，啥都不干
                                        } else {
                                            //不包含，添加进去
                                            manual_op.push(
                                                all_dynamic_id_list[i]
                                            );
                                            console.log(
                                                `${this.global_var.user_info.uname}\t${all_dynamic_id_list[i]}\t添加入人工回复队列`
                                            );
                                            manual_op_failed_record.push(
                                                record
                                            );
                                            continue;
                                        }
                                        if (
                                            !record.includes("404动态") &&
                                            !record.includes("无需评论动态") &&
                                            !record.includes("点过赞的动态") &&
                                            !record.includes(
                                                "过期的官方抽奖"
                                            ) &&
                                            !record.includes(
                                                "发生未知错误，不可避免"
                                            ) &&
                                            (record.includes("undefined") ||
                                                record.includes(
                                                    `评论被阿瓦隆吞掉了`
                                                ) ||
                                                record.includes(`转发失败`) ||
                                                record.includes(
                                                    `动态评论失败`
                                                ) ||
                                                record.includes(
                                                    `回复内容出错`
                                                ) ||
                                                record.includes(`评论失败`) ||
                                                record.includes(
                                                    `评论获取失败`
                                                ) ||
                                                record.includes(
                                                    `话题获取失败`
                                                ) ||
                                                record.includes(
                                                    `回复内容为空`
                                                ) ||
                                                record.includes(`关注失败`) ||
                                                record.includes(
                                                    "动态点赞失败"
                                                ) ||
                                                record.includes(
                                                    `未获取到动态信息`
                                                ))
                                        ) {
                                            manual_op.push(
                                                all_dynamic_id_list[i]
                                            );
                                            // console.log(`${this.global_var.user_info.uname}\t${all_dynamic_id_list[i]}\t添加入人工回复队列`)
                                            manual_op_failed_record.push(
                                                record
                                            );
                                        } else {
                                            lottery_success.push(
                                                all_dynamic_id_list[i]
                                            );
                                        }
                                    } catch (e) {
                                        //提取动态id失败
                                        console.warn(e);
                                        console.warn(
                                            `${this.global_var.user_info.uname}\t${all_dynamic_id_list[i]}\t${record}\t提取动态id失败`
                                        );
                                        manual_op.push(all_dynamic_id_list[i]);
                                        console.warn(
                                            `${this.global_var.user_info.uname}\t${all_dynamic_id_list[i]}\t${record}\t添加入人工回复队列`
                                        );
                                        manual_op_failed_record.push(record);
                                        await my_operator.log_record.my_throw(`${e}`);
                                        if (!this.global_var.user_info.uname) {
                                            throw (
                                                (e, "提取动态id失败,record出错")
                                            );
                                        }
                                        throw e;
                                    }
                                } catch (e) {
                                    manual_op.push(all_dynamic_id_list[i]);
                                    let record = this.global_var.recorded_data;
                                    if (record) {
                                        manual_op_failed_record.push(record);
                                    } else {
                                        manual_op_failed_record.push(
                                            JSON.stringify(e)
                                        );
                                    }
                                    await my_operator.log_record.my_throw(
                                        `lottery_loop执行单条任务失败，原因：${e}`
                                    );
                                    console.error(
                                        `lottery_loop执行单条任务失败，原因：${e}\n${this.global_var.user_info.uname}\t${all_dynamic_id_list[i]}\n${e}\n${e.stack}`
                                    );
                                    await sleep(10e3);
                                    if (!this.global_var.user_info.uname) {
                                        //没登录或者浏览器页面关了
                                        break;
                                    }
                                    if (this.global_var.current_page.isClosed()) {
                                        await this.account_init();
                                    }
                                }

                                is_lot_error = false;
                            } catch (e) {
                                is_lot_error = true;
                                if (loop_lot_retry_time > 3) {
                                    manual_op.push(all_dynamic_id_list[i]);
                                    let record = await my_operator.log_record.my_throw(`${e}`);
                                    manual_op_failed_record.push(record);
                                }
                                console.error(
                                    `单个lottery_loop执行失败，进入下一个循环！${this.global_var.user_info.uname}\t${all_dynamic_id_list[i]}\n${e}\n${e.stack}`
                                );
                                if (!this.global_var.user_info.uname) {
                                    //没登录或者浏览器页面关了
                                    break;
                                }
                                if (this.global_var.current_page.isClosed()) {
                                    //浏览器页面关闭则重新开启
                                    await this.account_init(false);
                                    await sleep(10e3);
                                }
                            } finally {
                                loop_lot_retry_time++
                            }
                        } while (loop_lot_retry_time <= 3 && is_lot_error)

                    }
                } catch (e) {
                    console.error(
                        `${this.global_var.user_info.uname}\tlottery_loop执行失败，退出循环！\n`,
                        e
                    );
                    await pptr_op.check_bili_login(this.global_var.current_page);
                    await sleep(30e3);
                } finally {
                    this.global_var.response.global_dynamic_data = undefined; //全局的动态数据
                    this.global_var.response.create_dyn_response = undefined; //创建或转发动态的响应
                    this.global_var.response.comment_dyn_response = undefined; //自己评论动态的响应
                    this.global_var.response.relation_modify_response =
                        undefined; //关注响应
                    this.global_var.response.dynamic_thumb_response = undefined; //点赞动态响应
                    this.global_var.response.space_reservation = undefined; //空间预约响应
                    this.global_var.recorded_data = "";
                    let d = new Date();
                    if (manual_op.length != 0) {
                        //人工判断列表非空时的操作
                        if (this.global_var.user_info.uname) {
                            let filepath =
                                "log/" +
                                `${this.lottery_setting.CONFIG.COOKIENAME} ${
                                    this.global_var.user_info.uname
                                } 人工判断${d.toLocaleString()}.csv`
                                    .replaceAll("/", "-")
                                    .replaceAll(":", "：");
                            let write_in_content = [];
                            for (let i = 0; i < manual_op.length; i++) {
                                console.log(manual_op[i]);
                                let myDynamicId =
                                    MYAPI.BiliAPI.draw_dynamic_id(
                                        manual_op[i]
                                    );
                                if (
                                    i + 1 <=
                                    manual_op_failed_record.length
                                ) {
                                    write_in_content.push(
                                        `https://www.bilibili.com/opus/${myDynamicId} ,${manual_op_failed_record[i]}`
                                    );
                                } else {
                                    write_in_content.push(
                                        `https://www.bilibili.com/opus/${myDynamicId}`
                                    );
                                }
                            }
                            MYAPI.fileWrite(
                                filepath,
                                write_in_content.join("\n")
                            );
                        }
                    } else {
                        // let filepath = 'log/' + `${this.lottery_setting.CONFIG.COOKIENAME} ${this.global_var.user_info.uname} 抽奖完成${d.toLocaleString()}.csv`.replaceAll('/', '-').replaceAll(':', '：')
                        // MYAPI.fileWrite(filepath, '')
                    }
                    console.log(
                        `\t${this.lottery_setting.CONFIG.COOKIENAME}\t${this.global_var.user_info.uname}\t${this.global_var.user_info.uname}抽奖完成`,
                        d.toLocaleString()
                    );
                    // console.log(
                    // 	`${this.global_var.user_info.uname}\t`,
                    // 	lottery_record
                    // );
                    console.log(
                        `${this.global_var.user_info.uname}\t人工回复动态：${manual_op.length}条`
                    );
                    console.log(
                        `${this.global_var.user_info.uname}\t`,
                        manual_op
                    );
                    console.log(
                        `${this.global_var.user_info.uname}\t失败原因:`,
                        manual_op_failed_record
                    );
                    return lottery_success;
                }
            };

            /**
             * 检查每天是否投币经验满了
             */
            const Daily_rewards = async () => {
                let MyDailyFuncMap = {
                    sanlian: async () => {
                        let my_coin = this.global_var.user_nav.data.money;
                        if (my_coin < 1) {
                            console.log(
                                `${
                                    this.global_var.user_info.uname
                                }\t硬币不够三连，跳过每日投币经验奖励\t${new Date().toLocaleTimeString()}`
                            );
                            return;
                        }
                        let my_level;
                        try {
                            my_level =
                                this.global_var.user_nav.data.level_info
                                    .current_level;
                        } catch {
                        }
                        if (my_level == 6) {
                            console.log(
                                `${
                                    this.global_var.user_info.uname
                                }\t等级满了，跳过每日投币经验奖励\t${new Date().toLocaleTimeString()}`
                            );
                            return;
                        }
                        await this.global_var.current_page.goto(
                            `https://account.bilibili.com/account/home`,
                            {waitUntil: "networkidle2"}
                        );
                        let exp_text = await this.global_var.current_page.$$eval(
                            `.home-dialy-exp-item`,
                            (els) => {
                                try {
                                    for (let taskel of els) {
                                        if (
                                            taskel.getElementsByClassName(
                                                "re-exp-info"
                                            )[0].textContent === "每日投币"
                                        ) {
                                            if (
                                                taskel.getElementsByClassName(
                                                    "re-exp-none"
                                                )
                                            ) {
                                                return taskel.getElementsByClassName(
                                                    "re-exp-none"
                                                )[0].textContent;
                                            } else {
                                                return null;
                                            }
                                        }
                                    }
                                } catch {
                                    return null;
                                }
                            }
                        );
                        let exp_re = /([0-9]+)\/([0-9]+)/gi.exec(exp_text);
                        if (exp_re) {
                            let exp_min = parseInt(exp_re[1]);
                            let exp_max = parseInt(exp_re[2]);
                            let coin_thow_num = (exp_max - exp_min) / 10;
                            coin_thow_num =
                                coin_thow_num > parseInt(my_coin)
                                    ? parseInt(my_coin)
                                    : coin_thow_num;
                            console.log(
                                `${
                                    this.global_var.user_info.uname
                                }\t需要投${coin_thow_num}个硬币\t${new Date().toLocaleTimeString()}`
                            );
                            let video_num = Math.ceil(coin_thow_num / 2);
                            let sanlian_num = parseInt(coin_thow_num / 2);
                            let toubi_num = coin_thow_num % 2;
                            let share_video_links =
                                await my_operator.prevent_filter_module.get_video_list(
                                    video_num
                                );
                            for (let v_link of share_video_links) {
                                if (sanlian_num) {
                                    await my_operator.video_operator.goto_video_page(
                                        v_link
                                    );
                                    await my_operator.video_operator.sanlian(
                                        v_link
                                    );
                                    sanlian_num -= 1;
                                    continue;
                                }
                                if (toubi_num) {
                                    await my_operator.video_operator.goto_video_page(
                                        v_link
                                    );
                                    await my_operator.video_operator.toubi(
                                        1,
                                        v_link
                                    );
                                    toubi_num -= 1;
                                }
                            }
                            console.log(
                                `${
                                    this.global_var.user_info.uname
                                }\t每日投币经验任务完成\t${new Date().toLocaleTimeString()}`
                            );
                        } else {
                            console.log(
                                `${
                                    this.global_var.user_info.uname
                                }\t投币经验已满\t${new Date().toLocaleTimeString()}`
                            );
                        }
                    },
                    VipGetBCoin: async () => {
                        try {
                            let vipStatus =
                                this.global_var.user_nav?.data?.vipStatus;
                            let vipType =
                                this.global_var.user_nav?.data?.vipType;
                            if (vipType === 2 && vipStatus === 1) {
                                let bcoin_get = false;
                                await this.global_var.current_page.goto(
                                    `https://account.bilibili.com/account/big/myPackage`,
                                    {waitUntil: "networkidle2"}
                                );
                                let coupon_contents =
                                    await this.global_var.current_page.$$(
                                        `.coupon-content`
                                    );
                                for (let coupon_content of coupon_contents) {
                                    await pptr_op.check_page_is_front(
                                        this.global_var.current_page
                                    );
                                    console.log(
                                        `${
                                            this.global_var.user_info.uname
                                        }\n当前大会员权益：${await coupon_content.$eval(
                                            ".coupon-content-con",
                                            (el) => el.innerText
                                        )}`
                                    );
                                    if (
                                        (
                                            await coupon_content.$eval(
                                                ".coupon-btn",
                                                (el) =>
                                                    el.getAttribute("class")
                                            )
                                        ).includes(`coupon-btn-disable`)
                                    ) {
                                        continue;
                                    } else {
                                        if (
                                            (
                                                await coupon_content.$eval(
                                                    ".coupon-content-con",
                                                    (el) => el.innerText
                                                )
                                            ).includes(`B币`)
                                        ) {
                                            bcoin_get = true;
                                        }
                                        await this.global_var.current_page
                                            .waitForSelector(".coupon-btn")
                                            .then(async (jshandle) => {
                                                await jshandle.click();
                                            });
                                        try {
                                            await this.global_var.current_page
                                                .waitForSelector(
                                                    `.dialog-close-icon`
                                                )
                                                .then(async (jshandle) => {
                                                    await jshandle.click();
                                                });
                                        } catch (e) {
                                            console.log(
                                                `${
                                                    this.global_var.user_info
                                                        .uname
                                                }\n当前大会员权益：${await coupon_content.$eval(
                                                    ".coupon-content-con",
                                                    (el) => el.innerText
                                                )} 已领取`
                                            );
                                        }
                                    }
                                }
                                if (bcoin_get) {
                                    await this.global_var.current_page.goto(
                                        `https://link.bilibili.com/p/center/index#/user-center/my-info/operation`,
                                        {waitUntil: "networkidle2"}
                                    );
                                    await this.global_var.current_page.waitForSelector(
                                        `.user .pay-button`,
                                        async (jshandle) => {
                                            await jshandle.click();
                                        }
                                    );
                                    await this.global_var.current_page.waitForSelector(
                                        `.gold-store .sub-tab-box .list :not(.active)`,
                                        async (jshandle) => {
                                            await jshandle.click();
                                        }
                                    );
                                    await this.global_var.current_page.waitForSelector(
                                        `.ipt-number`,
                                        async (jshandle) => {
                                            await this.global_var.current_page.type(
                                                jshandle,
                                                "5"
                                            );
                                        }
                                    );
                                    // await this.global_var.current_page_info.page.waitForSelector(
                                    // 	`input.pointer`,
                                    // 	async (jshandle) => {
                                    // 		await jshandle.click();
                                    // 	}
                                    // );
                                    await this.global_var.current_page.click(
                                        `.bl-button`
                                    );
                                }
                            }
                        } catch (e) {
                            console.error(
                                `${this.global_var.user_info.uname}\t领取5b币失败！`,
                                e
                            );
                        }
                    },
                };
                if (this.lottery_setting.CONFIG.AUTO_DailyReward) {
                    try {
                        await MyDailyFuncMap.sanlian();
                    } catch (e) {
                        console.error(
                            `${this.global_var.user_info.uname}\t三连失败！`,
                            e
                        );
                    }
                    await MyDailyFuncMap.VipGetBCoin();
                }
            }

            /**
             * 初始化抽奖信息
             * @returns
             */
            const lottery_init = async () => {
                try {
                    //#region 开始必抽的预约抽奖
                    /**
                     * 返回参与成功的预约抽奖list
                     * @returns
                     */

                    const 必抽的预约抽奖 = async () => {
                        let reserve_lottery_sapce_list = await AccountDao.get_reserve_lottery_infos()
                        reserve_lottery_sapce_list = utl.noRepeatArr(
                            reserve_lottery_sapce_list
                        );
                        utl.part_shuffle(
                            reserve_lottery_sapce_list,
                            reserve_lottery_sapce_list.length
                        ); //打乱顺序
                        /** @member {Array} 参加失败或者没参加的预约抽奖*/
                        let joinfail_list = [];
                        /** @type {TYPE_reserve_data[]} 参加成功或者超时的预约抽奖*/
                        let success_list = [];
                        if (reserve_lottery_sapce_list.length !== 0) {
                            console.log(
                                `${this.global_var.user_info.uname}\t开始执行任务：必抽的预约抽奖`
                            );
                            let result = await reserve_lottery_loop(
                                reserve_lottery_sapce_list
                            );
                            joinfail_list = result.joinfail_list;
                            success_list = result.joinsuccess_list;
                            console.log(
                                `${this.global_var.user_info.uname}\t任务完成：必抽的预约抽奖`
                            );
                        } else {
                            console.log(
                                `${this.global_var.user_info.uname}\t抽奖数量为0，跳过任务：必抽的预约抽奖`
                            );
                        }
                        if (joinfail_list.length !== 0) {
                            let d = new Date();
                            MYAPI.fileWrite(
                                `log/` +
                                `${
                                    this.global_var.user_info.uname
                                }_${d.toLocaleString()}参加失败的预约抽奖.txt`
                                    .replaceAll("/", "-")
                                    .replaceAll(":", "："),
                                joinfail_list.join("\n")
                            );
                        }
                        success_list.map((el) =>
                            joined_lottery_record.push(el.reserve_sid)
                        ); //参与成功的预约抽奖写进记录里
                        return success_list;
                    }

                    //#endregion
                    //#region 必抽的大奖加官方抽奖
                    const 必抽的大奖加官方抽奖=async ()=> {
                        console.log(
                            `${this.global_var.user_info.uname}\t开始执行任务：必抽的大奖加官方抽奖`
                        );

                        let need_repost_official_dynamic =
                            MYAPI.fileRead.lottery_dynamic_ids(
                                `官方抽奖动态id.txt`
                            );
                        let need_mustjoin_lottery_dynamic =
                            MYAPI.fileRead.lottery_dynamic_ids(
                                `必抽的大奖.txt`
                            );

                        //region 必抽的大奖，先是必抽的大奖，然后再是官方抽奖，因为有可能会在官抽的评论区加抽
                        let mustjoin_lottery_record_path_name = `抽奖记录/必抽的大奖记录/${this.global_var.user_info.uname}_参加过的大奖.txt`;
                        let mustjoin_lottery_record =
                            MYAPI.fileRead.lottery_dynamic_ids(
                                mustjoin_lottery_record_path_name
                            );
                        mustjoin_lottery_record = utl.noRepeatArr(
                            mustjoin_lottery_record
                        ); //参加过的必抽的大奖
                        need_mustjoin_lottery_dynamic = utl.noRepeatArr(
                            need_mustjoin_lottery_dynamic
                        );
                        let finally_mustjoin_lottery_dynaimc = [];
                        for (let i of need_mustjoin_lottery_dynamic) {
                            if (!mustjoin_lottery_record.includes(i)) {
                                finally_mustjoin_lottery_dynaimc.push(i);
                            }
                        }

                        this.lottery_setting.official_lottery_switch = true; //开启官方抽奖
                        this.lottery_setting.CONFIG.Only_Comment_Lottery_Switch = false; //关闭只抽普通抽奖
                        let must_join_lottery_result = [];
                        if (finally_mustjoin_lottery_dynaimc.length !== 0) {
                            console.log(
                                `${this.global_var.user_info.uname}\t开始必抽的大奖！`
                            );
                            must_join_lottery_result = await lottery_loop(
                                finally_mustjoin_lottery_dynaimc,
                                "必抽的大奖"
                            );
                        } //必抽的大奖
                        MYAPI.fileWrite(
                            mustjoin_lottery_record_path_name,
                            must_join_lottery_result.join("\n"),
                            "a+"
                        );
                        //endregion
                        //////////////////////////////////////////////

                        /////////////////////////////////////////////必抽的官抽
                        let official_lottery_record_path_name = `抽奖记录/官方抽奖记录/${this.global_var.user_info.uname}_参加过的官方抽奖.txt`;
                        let reposted_official_dynamic =
                            MYAPI.fileRead.lottery_dynamic_ids(
                                official_lottery_record_path_name
                            );
                        reposted_official_dynamic = utl.noRepeatArr(
                            reposted_official_dynamic
                        );
                        need_repost_official_dynamic = utl.noRepeatArr(
                            need_repost_official_dynamic
                        );
                        let finally_repost_official_dynaimc = [];
                        for (let i of need_repost_official_dynamic) {
                            if (!reposted_official_dynamic.includes(i)) {
                                finally_repost_official_dynaimc.push(i);
                            }
                        }
                        this.lottery_setting.official_lottery_switch = true; //开启官方抽奖
                        this.lottery_setting.CONFIG.Only_Comment_Lottery_Switch = false; //关闭只抽评论抽奖
                        this.lottery_setting.lottery_sep_time =
                            utl.generater_step_Array(
                                // 控制官方抽奖单个抽奖完成后的休眠时间
                                30e3,
                                180e3,
                                1e3
                            );
                        this.lottery_setting.CONFIG.lottery_sep_time_type = 2;
                        let official_lottery_result = [];
                        if (finally_repost_official_dynaimc.length != 0) {
                            official_lottery_result = await lottery_loop(
                                finally_repost_official_dynaimc,
                                "必抽的官抽"
                            );
                        } //必抽的官抽
                        MYAPI.fileWrite(
                            official_lottery_record_path_name,
                            official_lottery_result.join("\n"),
                            "a+"
                        );
                        ///////////////////////////////////////////////////
                        console.log(
                            `${this.global_var.user_info.uname}\t任务完成：必抽的大奖加官方抽奖`
                        );
                    }

                    //#endregion
                    //#region 普通抽奖
                    async function 普通抽奖() {
                        let all_dynamic_id_list = [];
                        if (this.lottery_setting.CONFIG.CommonLottery_switch) {
                            console.log(
                                `${this.global_var.user_info.uname}\t开始执行任务：普通抽奖`
                            );
                            all_dynamic_id_list =
                                MYAPI.fileRead.lottery_dynamic_ids(
                                    "一般的抽奖动态id.txt"
                                ); //获取抽奖动态id
                            all_dynamic_id_list =
                                utl.noRepeatArr(all_dynamic_id_list);
                            await lottery_loop(
                                all_dynamic_id_list,
                                "一般抽奖"
                            );
                        } else {
                            console.log(
                                `${this.global_var.user_info.uname}\t未开启开关，跳过任务：普通抽奖`
                            );
                        }
                    }

                    //#endregion
                    //#region 抽奖执行函数
                    async function lottery_excutor() {
                        let non_random_tasklist = [
                            "必抽的预约抽奖",
                            "参加点击的活动",
                        ];

                        for (let non_random_taskname of non_random_tasklist) {
                            switch (non_random_taskname) {
                                case "必抽的预约抽奖":
                                    eval(this.lottery_setting_string); //重置抽奖设置
                                    try {
                                        await 必抽的预约抽奖();
                                    } catch (e) {
                                        console.error(
                                            `${this.lottery_setting.CONFIG.COOKIENAME} 【必抽的预约抽奖】执行失败`
                                        );
                                    }
                                    break;
                                case "参加点击的活动":
                                    try {
                                        let op = JSON.parse(
                                            fs.readFileSync(
                                                __dirpath +
                                                "JsonData/待操作HTML元素.json",
                                                "utf-8"
                                            )
                                        ); //require并不是同步地读取文件，如果这个JSON文件是动态变化的话可能无法读取到最新的JSON文件。
                                        // require('./JsonData/待操作HTML元素.json');
                                        console.log(
                                            `${this.global_var.user_info.uname}\t开始执行任务：参加点击的活动`
                                        );
                                        await HTMLOP(
                                            this.global_var.current_page,
                                            op.op
                                        );
                                        console.log(
                                            `${this.global_var.user_info.uname}\t任务完成：参加点击的活动`
                                        );
                                    } catch (e) {
                                        console.error(
                                            `${this.lottery_setting.CONFIG.COOKIENAME} 【参加点击的活动】执行失败`
                                        );
                                    }
                                    break;
                            }
                        }

                        let tasklist = ["普通抽奖", "必抽的大奖加官方抽奖"];
                        this.global_var.Pause = false;
                        console.log(`${Date()}开始获取动态id`);
                        this.global_var.FLAG.抽奖中标志 = true; //设置开始抽奖的标志
                        this.global_var.current_page.on("close", function () {
                            //确认关闭后干的事情
                            this.global_var.FLAG.抽奖中标志 = false;
                        });

                        tasklist = utl.part_shuffle(
                            tasklist.length,
                            tasklist
                        );
                        console.log(
                            `${
                                this.global_var.user_info.uname
                            }\t任务执行顺序:\n${tasklist.join("\n")}`
                        );
                        for (let taskName of tasklist) {
                            switch (taskName) {
                                case "普通抽奖":
                                    eval(this.lottery_setting_string); //重置抽奖设置
                                    await 普通抽奖();
                                    break;
                                case "必抽的大奖加官方抽奖":
                                    eval(this.lottery_setting_string); //重置抽奖设置
                                    await 必抽的大奖加官方抽奖();
                                    break;
                            }
                        }
                    }

                    //#endregion
                    await lottery_excutor();
                    //#region 开始防过滤操作
                    try {
                        let clf = this.global_var.current_page.isClosed();
                        if (clf) {
                            console.debug(
                                `${this.global_var.user_info.uname}\t页面已关闭，停止分享视频操作！`
                            );
                            return;
                        }
                        if (
                            (this.lottery_setting.prevent_module
                                    .share_video_switch ||
                                this.lottery_setting.prevent_module
                                    .create_word_dynamic_chp_switch) &&
                            !clf
                        ) {
                            console.log(
                                `${this.global_var.user_info.uname}\t开始防过滤操作`
                            );
                            //await this.global_var.current_page_info.page.setDefaultNavigationTimeout(30);
                            await sleep(10e3);
                            if (this.global_var.user_info.uname) {
                                await this.global_var.current_page.goto(
                                    "https://www.bilibili.com"
                                );
                                try {
                                    await my_operator.prevent_filter_module.prevent_filter_init();
                                } catch (e) {
                                    console.error(
                                        `放过滤操作失败！${e}\n${e.stack}`
                                    );
                                }
                            } else {
                                console.warn(
                                    "登陆失败" + JSON.stringify(this.global_var)
                                );
                                await this.global_var.current_page.goto("about:blank");
                                throw (
                                    "登陆失败" + JSON.stringify(this.global_var)
                                );
                            }
                            await pptr_op.check_page_is_front(
                                this.global_var.current_page
                            );
                            await this.global_var.current_page.goto("about:blank");
                            console.log(
                                `${this.global_var.user_info.uname}\t防过滤操作完成！`
                            );
                            await this.global_var.current_page.goto("about:blank");
                        }
                    } catch (e) {
                        console.error(`分享视频失败！`, e);
                    }
                    //#endregion 开始防过滤操作
                    //#region 检查是否需要取关
                    try {
                        if (this.global_var.user_info.uid) {
                            await pptr_op.check_page_is_front(
                                this.global_var.current_page
                            );
                            if (
                                (await this.global_var.current_page.browser().pages())
                                    .length !== 0
                            ) {
                                console.log(
                                    `${this.global_var.user_info.uname}\t开始执行取关模块`
                                );
                                let unfollow_pg = await this.global_var.current_page
                                    .browser()
                                    .newPage();
                                await unfollow_op(
                                    unfollow_pg,
                                    this.global_var.user_info.uid
                                );
                                console.log(
                                    `${this.global_var.user_info.uname}\t取关模块执行完毕`
                                );
                            } else {
                                console.log(
                                    `${this.global_var.user_info.uname}浏览器关闭，不执行取关模块！`
                                );
                            }
                        }
                    } catch (e) {
                        console.error(`防过滤操作失败`, e);
                    }
                    //#endregion
                    this.global_var.FLAG.抽奖中标志 = false;
                    // try {
                    //     await MYAPI.cookieSetting.saveCookie(this.lottery_setting.CONFIG.COOKIENAME)//结束保存cookie
                    // }
                    // catch (e) {
                    //     console.log(e, `${this.lottery_setting.CONFIG.COOKIENAME} cookie保存失败`);
                    // }
                } catch (e) {
                    console.error(
                        `${this.global_var.user_info.uname}\t抽奖执行函数(lottery_init)执行失败！\n${e.stack}`
                    );
                }
            }

            //#region 启动入口函数
            /**
             *
             * @returns {Promise<boolean>} login_status
             */
            let Init = async () => {
                //await sleep(3600e3)
                let login_status = false;
                try {
                    login_status = await this.account_init();
                } catch (e) {
                    console.warn(
                        `ERROR:${e}\n${e.stack}\naccount_init\n${this.lottery_setting.CONFIG.COOKIENAME}`
                    );
                }

                try {
                    for (let i = 0; i < 5; i++) {
                        //如果没有登陆信息，先多次尝试获取
                        if (!this.global_var.user_info.uname) {
                            await this.global_var.current_page.reload();
                            await sleep(5e3);
                        } else {
                            break;
                        }
                    }
                } catch (e) {
                    console.warn(
                        `${this.lottery_setting.CONFIG.COOKIENAME}登陆出错：\n`,
                        e
                    );
                    return login_status;
                }
                if (!this.global_var.user_info.uname) {
                    console.warn(
                        `${this.lottery_setting.CONFIG.COOKIENAME}，账号初始化失败，无登录信息！`
                    );
                    return login_status;
                } //如果登陆信息获取失败直接退出
                //设置全局标志
                this.global_var.FLAG.opus动态标志 = opus动态标志;
                try {
                    if (!this.browser_mode) {
                        await Daily_rewards();
                    }
                } catch (e) {
                    console.warn(
                        `${
                            this.global_var.user_info.uname
                        }\t每日投币经验任务失败\t${new Date().toLocaleTimeString()}\n`
                    );
                    console.warn(e);
                    await this.global_var.current_page.goto("about:blank");
                } finally {
                    try {
                        await this.global_var.current_page.goto("about:blank");
                    } catch {
                    }
                }

                if (this.browser_mode) {
                    return login_status;
                } //如果是打开浏览器模式则直接退出抽奖

                await lottery_init();
                return login_status;
            };
            //#endregion

            this._setLotFlag(true);
            this.login_status = await Init(); //初始化抽奖，同时开始抽奖
            //#endregion
            //#region 动态抽奖任务完成之后
            await sleep(60e3);
            this._setLotFlag(false);
            if (!this.browser_mode && this.global_var.user_info.uid) {
                if (this.global_var.response.msgfeed_unread) {
                    if (
                        this.global_var.response.msgfeed_unread.data.at > 0 ||
                        this.global_var.response.msgfeed_unread.data.reply > 0
                    ) {
                        this.no_exit_falg.unread_msg = true;
                        //如果有回复或者@就不退出浏览器
                        await pptr_op.my_send_notify.push_me(
                            `${this.global_var.user_info.uname} 有新的回复或at`,
                            `at数量：${this.global_var.response.msgfeed_unread.data.at}\n回复数量：${this.global_var.response.msgfeed_unread.data.reply}`
                        );
                        if (this.global_var.current_page.isClosed()) {
                        } //页面关了全都不管
                        else {
                            await this.global_var.current_page.goto(`about:blank`);
                        }
                        return;
                    }
                }
                try {
                    if (
                        this.global_var.current_page.isClosed() ||
                        this.lottery_setting.CONFIG.LIVE_LOT ||
                        Object.keys(this.no_exit_falg).some(
                            (k) => this.no_exit_falg[k]
                        ) //反射的方式查看设置的标志是否符合不是全为true
                    ) {
                        //页面关了或者有其他事件不关浏览器
                        console.log(
                            `${
                                this.global_var.user_info.uname
                            }\t还有任务未完成(或者页面已关闭)，不关闭浏览器\n${JSON.stringify(
                                this.no_exit_falg,
                                "",
                                "\t"
                            )}  --${new Date().toLocaleTimeString()}`
                        );
                    } else {
                        if (!this.global_var.user_info.uid) {
                            console.error(
                                `${this.lottery_setting.CONFIG.COOKIENAME} 账号失效`
                            );
                            return;
                        }
                        console.log(
                            `${
                                this.global_var.user_info.uname
                            }\t没什么事了关闭浏览器！  --${new Date().toLocaleTimeString()}`
                        );
                        await this.global_var.current_page.browser().close(); //页面没关全部关掉
                    }
                } catch (e) {
                    console.error(`发生致命错误！${e}\n${e.stack}`);
                    await this.global_var.current_page.close();
                }
            }
            //#endregion
        } catch (e) {
            console.error(
                `${this.global_var.user_info.uname}\t执行launch_lottery抽奖失败！\n${e.stack}`
            );
        } finally {
            this._setLotFlag(false);
        }
    };
    mainFunc = async () => {
        try {
            if (this.account_id === undefined) {
                let account_info = await AccountDao.get_account_info_by_account_name_and_uid(this.account_name, this.uid);
                this.account_id = account_info.account_id
            }
            if (this.user_name === undefined) {
                let user_info = await UserDao.get_user_info_by_uid(this.uid);
                this.uid = user_info.uid;
            }
            await this.#launch_lottery();
        } catch (e) {
            console.error(
                e,
                new Date().toLocaleString()
            );
        }
    };
}

module.exports = {DO_Lottery, sleep};
