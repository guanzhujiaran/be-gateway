const {utils, sleep, pptr_op} = require("@/ExpressServerEnd/BiliPPTR/utils/utils");
const {BiliElementMap} = require("@/ExpressServerEnd/BiliPPTR/utils/element_map");
const puppeteer = require("puppeteer-extra");
const {GLOBAL_CONFIG} = require("@/ExpressServerEnd/BiliPPTR/config/global_config");
const {AccountLogService} = require("@/ExpressServerEnd/Service/account_log_module/account_log_service");
const {AccountDao} = require("@/ExpressServerEnd/DAO/AccountDao");
const {UserDao} = require("@/ExpressServerEnd/DAO/UserDao");

class BasePage {

    /**
     *
     * @param {string} account_name
     * @param {string} uname
     * @param account_id
     * @param user_id
     * @param {DynamicLotteryGlobalVar} global_var
     * @param {BiliLotterySetting} lottery_setting
     */
    constructor(account_name, uname, account_id, user_id, global_var, lottery_setting) {
        this.account_name = account_name;
        this.uname = uname;
        this.user_id = user_id;
        this.account_id = account_id;
        this.global_var = global_var;
        this.lottery_setting = lottery_setting;

    }

    #manual_reply_err_set = new Set(Object.entries(BiliElementMap.log_record.opus_dynamic).map(el => el[1]))
    #critical_err_set = new Set(Object.entries(BiliElementMap.log_record.critical_error).map(el => el[1]))
    #succ_info_set = new Set(Object.entries(BiliElementMap.log_record.succ_info).map(el => el[1]))

    get log_name() {
        return `【${this.uname}\t${this.account_name}\t${this.global_var.user_info.uname ?? ""}】\t`
    }

    get page_url() {
        return this.global_var.current_page?.url();
    }

    async screenshot() {
        if (this.global_var.current_page && !this.global_var.current_page.isClosed()) {
            await this.global_var.current_page.screenshot({path: `../pic/${(Date.now() / 1e3).toFixed()}.png`})
        }
    }


    log_format(msg) {

        return `${this.log_name ?? ""}${this.page_url ?? ""}\n${msg}\n${this.now}`
    }

    /**
     * 获取当前时间 （20xx-xx-xx xx:xx:xx）
     * @return {*}
     */
    get now() {
        return utils.Common.timestampToTime(Date.now() / 1e3)
    }

    log_record = {
        my_throw: async (err_msg, e = {stack: ''}) => {
            console.log(`${this.log_name}\t${this.page_url}\t${this.log_name} ${err_msg}` + e ? `\t${e.stack}` : '');
            this.global_var.recorded_data = err_msg;

            return this.log_format(err_msg + e ? `\t${e.stack}` : '')
        },
        /**
         * 将动态抽奖数据记录到数据库
         * @param {manual_op_fail_model} record_data
         * @return {Promise<void>}
         */
        dynamic_lottery_record: async (record_data) => {//记录到数据库
            let is_success = true;
            let is_manual_reply = false;
            let record_data_enum = record_data.err_msg.split('\n')[0]
            if (this.#manual_reply_err_set.has(record_data_enum)) {
                is_manual_reply = true;
            }
            if (this.#critical_err_set.has(record_data_enum)) {
                is_success = false;
                is_manual_reply = true;
            }
            if (this.#succ_info_set.has(record_data_enum)) {
                is_success = true;
                is_manual_reply = false;
            }

            return await AccountLogService.add_lottery_log_by_user_name_and_account_name(
                this.uname,
                this.account_name,
                record_data,
                is_success,
                is_manual_reply
            )
        }
    }

    /**
     * 监听全局浏览器响应，存入全局变量
     */
    async global_var_listen() {
        await this.global_var.current_page.setRequestInterception(true);
        this.global_var.current_page.on("response", async (response) => {
            //拦截响应的响应
            let url = response.url();
            try {
                switch (true) {
                    case url.includes(BiliElementMap.url_path.space.reservation) &&
                    response.status() === 200: {
                        this.global_var.response.space_reservation =
                            await response.json();
                        console.log(this.log_format(`空间预约响应：\n${JSON.stringify(
                                this.global_var.response.space_reservation
                            )}`)
                        );
                        break;
                    }
                    case url.includes(
                        BiliElementMap.url_path.opus_dynamic.dynamic_detail
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
                            throw Error(this.log_format(`global_dynamic_data\t${
                                await response.json()
                            }\n${e.stack}`));
                        }
                        break;
                    }
                    case url.includes(BiliElementMap.url_path.opus_dynamic.create_dynamic) ||
                    url.includes(BiliElementMap.url_path.opus_dynamic.dynamic_repost): {
                        let req = await response.request();
                        if ((req.method()).toLowerCase() !== "post") {
                            //option是没有数据的
                            return;
                        }
                        try {
                            this.global_var.response.create_dyn_response =
                                await response.json();
                            console.debug(
                                this.log_format(`转发动态response：\n${JSON.stringify(
                                    this.global_var.response.create_dyn_response
                                )}\n转发生成的动态链接：https://t.bilibili.com/${
                                    this.global_var.response.create_dyn_response
                                        ?.data?.dynamic_id_str ||
                                    this.global_var.response.create_dyn_response
                                        ?.data?.dyn_id_str
                                }`)
                            );
                        } catch (e) {
                            console.error(
                                this.log_format(`抓取转发动态response失败：\n${e}\n${await response.text()}`)
                            );
                            //global_var.response.create_dyn_response = undefined;
                            throw Error(this.log_format(`抓取转发动态response失败：\n${e}\n${await response.text()}`));
                        }
                        break;
                    }
                    case url.includes(BiliElementMap.url_path.opus_dynamic.dynamic_reply): {
                        try {
                            let response_json = await response.json();
                            this.global_var.response.comment_dyn_response =
                                response_json;
                            this.global_var.FLAG.评论响应标志 = true;
                            if (response_json.code === 12051) {
                                //重复评论
                                console.warn(
                                    this.log_format(`重复评论！\n${JSON.stringify(
                                        response_json,
                                    )}`)
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
                            console.debug(
                                this.log_format(`获取到评论响应：\t${this.now}\n检查阿瓦隆链接：https://api.bilibili.com/x/v2/reply/jump?type=${type}&oid=${oid}&rpid=${rpid}`)
                            );
                        } catch (e) {
                            //console.log('动态评论响应',global_var.response.comment_dyn_response);
                            this.global_var.FLAG.评论响应标志 = false;
                            console.error(this.log_format(
                                    `抓取评论动态response失败：\n${e}\n${await response.text()}`
                                )
                            );
                            //global_var.response.create_dyn_response = undefined;
                            throw Error(this.log_format(
                                `抓取评论动态response失败：\n${e}\n${await response.text()}`
                            ));
                        }
                        break;
                    }
                    case url.includes(BiliElementMap.url_path.opus_dynamic.dynamic_reply_main) ||
                    url.includes(BiliElementMap.url_path.opus_dynamic.dynamic_reply_main_wbi): {
                        try {
                            let response_json = await response.text();
                            this.global_var.response.reply_main =
                                JSON.parse(response_json);
                            // if (response_json.code === 0) {
                            //     let replies = response_json.data.replies;
                            //     for (
                            //         let repindex = 0;
                            //         repindex < replies.length;
                            //         repindex++
                            //     ) {
                            //         try {
                            //             MYAPI.fileWrite(
                            //                 `文案/评论响应.csv`,
                            //                 JSON.stringify(
                            //                     replies[repindex]
                            //                 ),
                            //                 "a+"
                            //             );
                            //         } catch {
                            //             console.warn("记录评论内容失败！");
                            //         }
                            //     }
                            // }
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
                                console.error(this.log_format(`解析评论区响应失败！\n${await response.text()}`))
                                throw Error(this.log_format(`解析评论区响应失败！\n${await response.text()}`))
                            }
                        }
                        break;
                    }
                    case url.includes(BiliElementMap.url_path.user.nav) &&
                    response.request().method() === "GET": {
                        if (!this.global_var.user_info.uname) {
                            if (await response.text()) {
                                this.global_var.user_nav = JSON.parse(
                                    await response.text()
                                );
                            }
                            try {
                                this.global_var.user_info.uid =
                                    this.global_var.user_info.user_nav.data.mid;
                                this.global_var.user_info.uname =
                                    this.global_var.user_info.user_nav.data.uname;
                            } catch {
                                this.global_var.user_info.uid = undefined;
                                this.global_var.user_info.uname = undefined;
                                console.error(
                                    this.log_format(`获取登陆信息失败，cookie可能过期`)
                                );
                            }
                        }
                        break;
                    }
                    case url.includes(BiliElementMap.url_path.user.relation_modify): {
                        try {
                            this.global_var.response.relation_modify_response =
                                await response.json();
                        } catch (e) {
                            //console.log('关注响应',global_var.response.relation_modify_response);
                            this.global_var.response.relation_modify_response =
                                undefined;
                            throw Error(this.log_format(`relation_modify_response\n${e}`));
                        }
                        break;
                    }
                    case url.includes(
                        BiliElementMap.url_path.opus_dynamic.dynamic_like_thumb
                    ): {
                        try {
                            this.global_var.response.dynamic_thumb_response =
                                await response.json();
                        } catch (e) {
                            //console.log('动态点赞响应',global_var.response.dunamic_thumb_response);
                            this.global_var.response.dynamic_thumb_response =
                                undefined;
                            throw Error(this.log_format(`global_dynamic_data\n${e}`));
                        }
                        break;
                    }
                    case url.includes(BiliElementMap.url_path.user.msg_unread): {
                        try {
                            let resp_json = await response.json();
                            if (!resp_json.code) {
                                this.global_var.response.msgfeed_unread =
                                    resp_json;
                                console.debug(this.log_format(`我的消息响应：\n${JSON.stringify(global_var.response.msgfeed_unread)}`));
                            }
                        } catch (e) {
                            this.global_var.response.msgfeed_unread = undefined;
                            throw Error(
                                this.log_format(`我的消息响应获取失败msgfeed/unread\n${e}`)
                            );
                        }
                        break;
                    }
                    case url.includes("data.bilibili.com/log/web"): {
                        break;
                    }
                    default: {
                    }
                }
            } catch (e) {
                console.error(e)
                console.error(this.log_format(`${url}\t${response.request().method}\t${JSON.stringify(
                        response
                    )}\n监听api响应失败\n${e}`)
                );
            }
        });
    };

    /**
     * 检查是否登录了账号
     * @param {boolean} need_check_login
     * @return {Promise<boolean>}
     */
    async check_login(need_check_login = false) {
        if (!need_check_login) {
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
            console.log(this.log_format(`账号初始化完成`));
            return true;
        } else {
            return false;
        }
    };

    /**
     * 检查浏览器页面，初始化页面
     * @param need_check_login
     * @param {BiliElementMap.browser_usage} usage
     * @return {Promise<boolean>}
     */
    async account_page_init(need_check_login = false, usage = BiliElementMap.browser_usage.lottery) {
        let is_create_new_page = false;
        if (
            !this.global_var.current_page ||
            (await this.global_var.current_page.browser().pages()).length === 0 ||
            !this.global_var.current_page.browser().connected
        ) {
            //浏览器未打开状态
            let cookieStr;
            try {
                cookieStr = await utils.BiliAPI.cookieSetting.getCookie(
                    this.uname,
                    this.account_name
                );
            } catch {
            }
            let browser;
            let __args = [];
            if (this.lottery_setting.CONFIG.proxy && URL.canParse(this.lottery_setting.CONFIG.proxy)) {
                console.debug(this.log_format(`使用代理：${this.lottery_setting.CONFIG.proxy}`))
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
                // "--no-sandbox",
                "--disable-setuid-sandbox",
                `--profile-directory=${this.lottery_setting.CONFIG.ProfileDir ? this.lottery_setting.CONFIG.proxy : "Default"}`,
            );
            for (let retry = 1; retry < 6; retry++) {
                //五次重试启动浏览器的机会
                try {
                    browser = await puppeteer.launch({
                        executablePath: GLOBAL_CONFIG.basic_module.browser_executable_path, //浏览器路径
                        headless: false, //false为显示浏览器界面
                        defaultViewport: {
                            //分辨率
                            width: 1920+Math.floor((Math.random()-1)*200), // [-100,100]
                            height: 1080+Math.floor((Math.random()-1)*200),// [-100,100]
                        },
                        args: __args,
                        // 路径是相对运行的根目录而言
                        userDataDir: this.lottery_setting.CONFIG.PersistStore ? `BrowserData\\${this.uname}\\${this.account_name}` : undefined,
                        ignoreDefaultArgs: [
                            "--enable-automation",
                            "--disable-extensions",
                            "--disable-client-side-phishing-detection",
                            "--disable-sync",
                            "--no-first-run",
                        ],
                        ignoreHTTPSErrors: true,
                        pipe: true,
                        protocol: "webDriverBiDi"
                    });
                    let page = (await browser.pages())[0];
                    is_create_new_page = true;
                    page.usage = usage
                    await pptr_op.hook_teck_logdata(page);
                    this.global_var.current_page = page;
                    //await global_var.page.setUserAgent(useragent);
                    // let ck = utils.BiliAPI.browserSetting.getCookies(
                    //     cookieStr,
                    //     ".bilibili.com"
                    // );
                    break;
                } catch (e) {
                    console.error(this.log_format(`浏览器启动失败，重试第${retry}次！\n${e}`));
                    await sleep(10e3);
                    if (retry === 6) {
                        throw Error(this.log_format(`浏览器启动彻底失败\n${e}`))
                    }
                }
            }
        }
        if (this.global_var.current_page && !this.global_var.current_page.isClosed()) {
            //浏览器未关闭，抽奖页面已关闭
            let br = this.global_var.current_page.browser();
            let new_pg = await br.newPage();
            is_create_new_page = true
            new_pg.usage = usage
            await pptr_op.hook_teck_logdata(new_pg);
            this.global_var.current_page = new_pg;
        }
        await this.global_var_listen();
        if (!this.global_var.user_info.uname || need_check_login) {
            return await this.check_login(true);
        }
        return true
    }

    /**
     * 所有任务结束时调用
     * @return {Promise<void>}
     */
    async task_end() {
        await this.global_var.current_page.close();
        await this.global_var.current_page.browser().close();
        this.global_var.FLAG.抽奖中标志 = false;
    }
}

module.exports = BasePage