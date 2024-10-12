const {BiliElementMap} = require("@/ExpressServerEnd/BiliPPTR/utils/element_map");
const {BaseGlobalVar, LiveLotteryGlobalVar} = require("@/ExpressServerEnd/BiliPPTR/utils/global_var");
const {utils, pptr_op, sleep} = require("@/ExpressServerEnd/BiliPPTR/utils/utils");
const {AccountLogService} = require("@/ExpressServerEnd/Service/account_log_module/account_log_service");
const {ExcTaskParams} = require("@/ExpressServerEnd/BiliPPTR/models/pages/tasks_model");
const {BiliOtherPage} = require("@/ExpressServerEnd/BiliPPTR/pages/base_other_page");
const {GLOBAL_CONFIG} = require("@/ExpressServerEnd/BiliPPTR/config/global_config");
const {live_lottery_setting} = require("@/ExpressServerEnd/BiliPPTR/models/pages/live_anchor_redpack_module");
const fs = require("fs");
const {AccountService} = require("@/ExpressServerEnd/Service/account_module/account_service");

class BiliLiveLotPage extends BiliOtherPage {
    basic_op = {
        /**
         * 获取visit_id
         * @param {number} uid
         * @returns
         */
        get_visit_id: (uid) => {
            return "xxxxxxxxxxxx".replace(/[x]/g, function (name) {
                let randomInt = (16 * Math.random()) | 0;
                return ("x" === name ? randomInt : (3 & randomInt) | 8)
                    .toString(16)
                    .toLowerCase();
            });
        },
        /**
         * 移除直播间的播放器元素
         * @param {Page} pg
         */
        remove_live_player: async (pg) => {
            try {
                await pg.evaluate(() => {
                    window.EmbedPlayer && window.EmbedPlayer.instance.freeze();
                });//暂停直播播放
                await pg.evaluate((selector) => {
                    let elementToRemove = document.querySelector(selector);
                    if (elementToRemove) {
                        elementToRemove.remove();
                    }
                }, BiliElementMap.live_page.live_player); //移除播放器
                await pg.evaluate((selector) => {
                    let elementToRemove = document.querySelector(selector);
                    if (elementToRemove) {
                        elementToRemove.remove();
                    }
                }, `.EvaRenderer_LayerWrapper`);
            } catch (e) {
                console.error(this.bili_dynamic_page.log_format(`${e}\n${e.stack}\n移除直播间的播放器元素失败！`));
            }
        },
        /**
         * @param {Page} pg
         * @param {String} dm_msg
         */
        input_dm: async (pg, dm_msg) => {
            let msg_box;
            await pg.waitForSelector(BiliElementMap.live_page.dm_input_box, {
                timeout: 10e3,
            });
            msg_box = (await pg.$$(BiliElementMap.live_page.dm_input_box))[-1];
            await msg_box.click();
            let msg_box_content = await pg.$eval(
                BiliElementMap.live_page.dm_input_box,
                (el) => el.value
            );
            let _bt = 0;
            while (msg_box_content !== dm_msg) {
                //回复栏里的东西等于回复内容时break
                await msg_box.click();
                await sleep(
                    utils.Common.random_choice(
                        [300, 500, 1e3]
                    )
                );
                await msg_box.type(dm_msg, {delay: 20});
                await sleep(1e3);
                msg_box_content = (
                    await pg.$$eval(BiliElementMap.live_page.dm_input_box, (els) =>
                        els.map((el) => el.value)
                    )
                ).join("");
                if (
                    utils.Common.remove_invisible_char(
                        msg_box_content.replaceAll(
                            /[\uD800-\uDBFF][\uDC00-\uDFFF]/g,
                            ""
                        )
                    ) !==
                    utils.Common.remove_invisible_char(
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
                        this.bili_dynamic_page.log_format(`输入框里内容与评论不符，删除输入框里内容\nmsg_box_content:${msg_box_content}\ndm_msg:${dm_msg}`)
                    );
                } else {
                    //相等了break出去
                    break;
                }
                if (_bt >= 5) {
                    this.bili_dynamic_page.log_format("弹幕输入失败");
                    throw `弹幕输入失败`;
                }
                _bt += 1;
            }
        },
        send_dm: async (pg) => {
            await pg.click(BiliElementMap.live_page.dm_send_btn);
        },
        /**
         * 点赞直播间，每15次赞增加一点直播间贡献值
         * @param {Page} pg
         */
        click_like: async (pg) => {
            let like_btn;
            try {
                like_btn = await pg.$(BiliElementMap.live_page.like_btn);
            } catch (e) {
                console.error(this.bili_dynamic_page.log_format(`click_like ${e}\n${e.stack}`));
            }
            if (like_btn) {
                await like_btn.click();
                return true;
            }
            return false;
        },
        read_live_lot_json: () => {
            try {
                if (fs.existsSync(GLOBAL_CONFIG.file_path.live_lottery_setting_json)) {
                    return JSON.stringify(
                        fs.readFileSync(GLOBAL_CONFIG.file_path.live_lottery_setting_json).toString()
                    );
                } else {
                    let live_lottery = new live_lottery_setting();
                    fs.writeFileSync(GLOBAL_CONFIG.file_path.live_lottery_setting_json, JSON.stringify(live_lottery), {flag: "w"})
                    return live_lottery;
                }
            } catch (e) {
                console.error(`读取直播抽奖设定失败！${e}\n${e.stack}`);
            }
        },
    }
    polymer_op = {
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
                    await this.basic_op.input_dm(pg, msg);
                    await sleep(100);
                    await this.basic_op.send_dm(pg, msg);
                    if (!cheat_mode) {
                        await sleep(6 * 1e3);
                    } else {
                        await sleep(500);
                    }
                }
            }
        },
        live_send_dm_single: async (pg, dm_msg, cheat_mode = false) => {
            await this.basic_op.input_dm(pg, dm_msg);
            await sleep(100);
            await this.basic_op.send_dm(pg, dm_msg);
            if (!cheat_mode) {
                await sleep(6 * 1e3);
            } else {
                await sleep(500);
            }
        },
        BAPI_live_send_dm_single: async (pg, dm_msg, cheat_mode = false) => {
            await utils.BAPI.send_dm(pg, dm_msg);
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
         * @param {number} anchor_uid
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
            if (times <= 0) {
                return;
            }
            let click_like_flag = true;
            for (let i = 0; i < times; i++) {
                let resp = await utils.BAPI.like_info_v3_like_likeReportV3(
                    pg,
                    15,
                    room_id,
                    uid,
                    anchor_uid,
                    csrf
                );
                await sleep(2e3);
                if (resp.code) {
                    console.error(this.bili_dynamic_page.log_format(`${uid}\t${csrf}\t点赞失败！${JSON.stringify(resp)}`));
                    throw Error(`${uid}\t${csrf}\t点赞失败！${JSON.stringify(resp)}`)
                } else {
                    console.log(this.bili_dynamic_page.log_format(`点赞成功！${JSON.stringify(resp)}`));
                }
            }
            if (!click_like_flag) {
                let dm_list = ["[dog]", "[妙]", "[哇]"];
                //如果是发评论就只发送一半的次数
                for (let i = 0; i < Math.ceil(times / 2); i++) {
                    let dm = utils.Common.random_choice(dm_list);
                    await this.polymer_op.live_send_dm_single(pg, dm);
                    await sleep(5e3);
                }
            }
        },
        getOnlineGoldRank: async (pg, ruid, room_id) => {
            return await utils.BAPI.queryContributionRank(pg, ruid, room_id);
        }
    }

    /**
     * 直播抽奖不使用全局变量的页面，因为同时会有多个直播抽奖，所以都使用单独的页面
     * @param {BiliDynamicPage} bili_dynamic_page
     */
    constructor({bili_dynamic_page}) {
        super({bili_dynamic_page: bili_dynamic_page})
        this.global_var = new LiveLotteryGlobalVar()
    }

    /**
     *
     * @param {Page}pg
     * @param {LiveGoldBoxType} lottery_info
     */
    async #join_goldbox_lot({pg, lottery_info}) {
        let is_succ = false;
        let response;
        let goto_live_page = async () => {
            await pg.emulate({
                userAgent: this.global_var.redpack.emulate_info.ua,
                viewport: {
                    width: 600,
                    height: 1024,
                    deviceScaleFactor: 1,
                    isMobile: true,
                    hasTouch: true,
                    isLandscape: false,
                },
            });
            await pg.goto(`https://live.bilibili.com/p/html/live-room-treasurebox/index.html?aid=${lottery_info.aid}#/`);
        }
        let before_anchor_lot = async () => {
            this.global_var.goldbox.joined_goldbox_id_list.push(lottery_info.aid * 100 + lottery_info.num);//实物抽奖特征id：aid*100+number
            if (this.global_var.goldbox.joined_goldbox_id_list.length > 200) {
                this.global_var.goldbox.joined_goldbox_id_list = this.global_var.goldbox.joined_goldbox_id_list.slice(-50);
            }
        }
        let exec_anchor_lot = async () => {
            response = await utils.BAPI.gold_box.draw({pg: pg, aid: lottery_info.aid, number: lottery_info.num});
        }
        let after_anchor_lot = async () => {
            switch (response.code) {
                case 0: {
                    is_succ = true;
                    console.log(this.bili_dynamic_page.log_format(`【实物宝箱抽奖】成功参加抽奖：【${lottery_info.title}】(aid=${lottery_info.aid},number=${lottery_info.number})！`))
                    break;
                }
                case -403 || 403 || -3: {
                    let feedback = `【实物宝箱抽奖】(aid=${lottery_info.aid},number=${lottery_info.number})${response.msg}`
                    console.error(this.bili_dynamic_page.log_format(feedback))
                    throw Error(feedback)
                }
                default : {
                    let feedback = `【实物宝箱抽奖】未知响应code(aid=${lottery_info.aid},number=${lottery_info.number})${response.msg}`
                    console.error(this.bili_dynamic_page.log_format(feedback))
                    throw Error(feedback)
                }
            }

        }

        await this.#executeWithRetry([
            new ExcTaskParams({
                func: before_anchor_lot,
                params: [],
                err: "天选抽奖准备失败",
                pg: pg,
                reload_when_err: false
            }),
            new ExcTaskParams({func: goto_live_page, params: [], err: "前往页面失败", pg: pg, reload_when_err: false}),
            new ExcTaskParams({
                func: exec_anchor_lot,
                params: [],
                err: "天选抽奖执行失败",
                pg: pg,
                reload_when_err: true
            }),
            new ExcTaskParams({
                func: after_anchor_lot,
                params: [],
                err: "天选抽奖后处理失败",
                pg: pg,
                reload_when_err: false
            })
        ], 3, this.#live_lot_error_log_gen({lottery_info: lottery_info}))

        if (is_succ) {
            await AccountLogService.add_live_lot_log({
                account_id: this.bili_dynamic_page.account_id,
                lot_id: lottery_info.aid * 100 + lottery_info.num,
                type: lottery_info.type,
                is_succ: true,
                feedback_info: null,
            })
        }
    }

    /**
     *
     * @param {Page} pg
     * @param {LiveRedPackType} lottery_info
     * @return {Promise<void>}
     */
    async #join_redpacket_lot({pg, lottery_info}) {
        let resp_data;
        let is_succ = false;
        let before_redpack_lot = async () => {
            this.global_var.redpack.joined_redpacket_lot_id_list.push(lottery_info.lot_id);
            if (
                this.global_var.redpack.joined_redpacket_lot_id_list.length > 200
            ) {
                this.global_var.redpack.joined_redpacket_lot_id_list =
                    this.global_var.redpack.joined_redpacket_lot_id_list.slice(
                        -50
                    );
            }
        }
        let goto_live_page = async () => {
            await pg.emulate({
                userAgent: this.global_var.redpack.emulate_info.ua,
                viewport: {
                    width: 600,
                    height: 1024,
                    deviceScaleFactor: 1,
                    isMobile: true,
                    hasTouch: true,
                    isLandscape: false,
                },
            });
            await pg.goto(`https://live.bilibili.com/${lottery_info.room_id}`);
        }

        let exec_redpack_lot = async () => {
            resp_data = await pg.evaluate(
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
                lottery_info.room_id,
                lottery_info.anchor_uid,
                this.global_var.live_info.csrf,
                lottery_info.lot_id
            );
        }
        let after_redpack_lot = async () => {
            switch (resp_data.code) {
                case 0: {
                    console.log(
                        this.bili_dynamic_page.log_format(`【直播间电池道具】房间号：https://live.bilibili.com/${lottery_info.room_id} ，直播间道具红包总值${
                            lottery_info.total_price / 1000
                        }元参与成功！\n${JSON.stringify(resp_data)}`)
                    );
                    await this.polymer_op.increase_ContributionRank(
                        pg,
                        3,
                        lottery_info.room_id,
                        this.global_var.live_info.uid,
                        lottery_info.anchor_uid,
                        this.global_var.live_info.csrf
                    );
                    await this.polymer_op.getOnlineGoldRank(pg, lottery_info.anchor_uid, lottery_info.room_id).then(
                        async (da) => {
                            if (da.code === 0) {
                                let onlineNum = da.data.onlineNum;
                                let score = da.data.ownInfo.score;
                                let rank = da.data.ownInfo.rank;
                                console.log(
                                    this.bili_dynamic_page.log_format(`【直播间电池道具】目前在线人数：${onlineNum}贡献值：${score}排名：${rank}`)
                                )
                                if (score === 0) {
                                    if (this.global_var.redpack.join_risk_mark) {
                                        console.log(
                                            this.bili_dynamic_page.log_format(`【直播间电池道具】房间号：https://live.bilibili.com/${lottery_info.room_id}，参加抽奖后直播间无贡献值，可能已经风控！，暂停抽奖${this.bili_dynamic_page.lottery_setting.live_lottery_module.risk_sleeptime_s / 60}分钟！`)
                                        );
                                    } else {
                                        this.global_var.redpacket.join_risk_mark = true;
                                        setTimeout(() => {
                                            this.global_var.redpacket.join_risk_mark = false;
                                        }, this.bili_dynamic_page.lottery_setting.live_lottery_module.risk_sleeptime_s * 1e3);
                                        console.log(
                                            this.bili_dynamic_page.log_format(`【直播间电池道具】[${lottery_info.room_id}](https://live.bilibili.com/${lottery_info.room_id})直播间无贡献值，可能已经风控！`)
                                        );
                                    }
                                    throw Error("参加抽奖后直播间无贡献值");
                                }

                                if (score < 10) {
                                    console.log(this.bili_dynamic_page.log_format(
                                            `【直播间电池道具】开始在直播间[${lottery_info.room_id}](https://live.bilibili.com/${lottery_info.room_id})尝试增加${
                                                10 - score
                                            }点贡献值`
                                        )
                                    );
                                    await this.polymer_op.increase_ContributionRank(
                                        pg,
                                        10 - score,
                                        lottery_info.room_id,
                                        this.global_var.live_info.uid,
                                        lottery_info.anchor_uid,
                                        this.global_var.live_info.csrf
                                    );
                                }
                            } else {
                                throw Error(`获取直播间贡献值失败！${JSON.stringify(da)}`);
                            }
                        }
                    );
                    is_succ = true
                    break;
                }
                case 1009109: {// 每日上限
                    this.global_var.redpack.max_joined_switch = true;
                    let feedback_info = `【直播间电池道具】达到每日上限！${lottery_info.room_id}直播间道具红包参与反馈：${JSON.stringify(
                        resp_data
                    )}`
                    console.log(this.bili_dynamic_page.log_format(
                            feedback_info
                        )
                    );
                    await AccountLogService.add_live_lot_log({
                        account_id: this.bili_dynamic_page.account_id,
                        lot_id: lottery_info.lot_id,
                        type: lottery_info.type,
                        is_succ: false,
                        feedback_info: feedback_info,
                    });
                    break;
                }
                case 1009114: {
                    let feedback_info = `【直播间电池道具】${lottery_info.room_id}直播间道具红包参与反馈：${JSON.stringify(
                        resp_data
                    )}`
                    console.log(this.bili_dynamic_page.log_format(
                            feedback_info
                        )
                    );
                    await AccountLogService.add_live_lot_log({
                        account_id: this.bili_dynamic_page.account_id,
                        lot_id: lottery_info.lot_id,
                        type: lottery_info.type,
                        is_succ: true,
                        feedback_info: feedback_info,
                    });
                    break
                }
                default: {
                    this.global_var.redpack.join_risk_mark = true;
                    let feedback_info = `【直播间电池道具】未知响应 ${lottery_info.room_id}直播间道具红包参与反馈：${JSON.stringify(
                        resp_data
                    )}`
                    console.log(this.bili_dynamic_page.log_format(
                            feedback_info
                        )
                    );
                    await AccountLogService.add_live_lot_log({
                        account_id: this.bili_dynamic_page.account_id,
                        lot_id: lottery_info.lot_id,
                        type: lottery_info.type,
                        is_succ: false,
                        feedback_info: feedback_info,
                    })
                }
            }
        }
        await this.#executeWithRetry([
                new ExcTaskParams({
                    func: before_redpack_lot,
                    params: [],
                    err: "红包抽奖准备失败",
                    pg: pg,
                    reload_when_err: false
                }),
                new ExcTaskParams({func: goto_live_page, params: [], err: "前往页面失败", pg: pg, reload_when_err: false}),
                new ExcTaskParams({
                    func: exec_redpack_lot,
                    params: [],
                    err: "红包抽奖执行失败",
                    pg: pg,
                    reload_when_err: true
                }),
                new ExcTaskParams({
                    func: after_redpack_lot,
                    params: [],
                    err: "红包抽奖后处理失败",
                    pg: pg,
                    reload_when_err: false
                })
            ], 3, this.#live_lot_error_log_gen({lottery_info: lottery_info})
        )
        if (is_succ) {
            await AccountLogService.add_live_lot_log({
                account_id: this.bili_dynamic_page.account_id,
                lot_id: lottery_info.lot_id,
                type: lottery_info.type,
                is_succ: true,
                feedback_info: null,
            })
        }
    }

    /**
     *
     * @param lottery_info
     * @return {(function(*): Promise<void>)|*}
     */
    #live_lot_error_log_gen({lottery_info}) {
        return async (err) => {
            await AccountLogService.add_live_lot_log({
                account_id: this.bili_dynamic_page.account_id,
                lot_id: lottery_info.lot_id,
                type: lottery_info.type,
                is_succ: false,
                feedback_info: err,
            })
        }
    }

    /**
     * 通过新的页面参加天选抽奖
     * @param {Page} pg
     * @param {LiveAnchorType} lottery_info
     * @returns
     */
    async #join_anchor_lot({pg, lottery_info}) {
        let is_succ = false;
        let unusual_mark = false;
        let anchor_join_resp;
        let before_anchor_lot = async () => {
            if (this.CONFIG.live_info.ALLFollowingList.indexOf(lottery_info.anchor_uid) === -1 && lottery_info.require_type !== 0) {
                await utils.BAPI.IsUserFollow(pg, lottery_info.anchor_uid).then(
                    async (data) => {
                        if (data.code === 0) {
                            if (!data.data.follow) {
                                unusual_mark = true; //参加抽奖前、是需要关注的抽奖、确认是未关注状态
                            }
                        } else {
                            console.error(this.bili_dynamic_page.log_format(`检查关注的响应获取失败！${JSON.stringify(data)}`));
                        }
                    }
                );
            }
            this.global_var.anchor.joined_anchor_id_list.push(lottery_info.lot_id);
            if (this.global_var.anchor.joined_anchor_id_list.length > 200) {
                this.global_var.anchor.joined_anchor_id_list = this.global_var.anchor.joined_anchor_id_list.slice(-50);
            }
        }
        let goto_live_page = async () => {
            await pg.goto(`https://live.bilibili.com/${lottery_info.room_id}`);
            await this.basic_op.remove_live_player(pg);
        }

        let exec_anchor_lot = async () => {
            await pg.waitForSelector(BiliElementMap.live_page.rightArrow_btn, {
                timeout: 10e3,
            }).then(async (btn) => await btn.click());
            await pg.waitForSelector(BiliElementMap.live_page.anchor_icon);
            let anchor_icon = await pg.waitForSelector(BiliElementMap.live_page.anchor_icon, {timeout: 10e3});
            //没有获取到天选抽奖的图标
            if (!anchor_icon) throw Error(`ERROR\t参加直播间${lottery_info.room_id}天选抽奖失败，原因：没有获取到天选抽奖的图标！`)
            await anchor_icon.click();
            let anchor_iframe = await pg.waitForFrame(frame => frame.url().includes("live.bilibili.com/p/html/live-lottery/anchor-join.html"));
            await anchor_iframe.waitForSelector(BiliElementMap.live_page.anchor_join_btn);
            let anchor_join_btn = await anchor_iframe?.$(BiliElementMap.live_page.anchor_join_btn);
            if (!anchor_join_btn) throw Error(`未在iframe中找到天选参与按钮！`)
            let __anchor_join_resp;
            await Promise.all([
                anchor_join_btn.click(),
                __anchor_join_resp = await pg.waitForResponse(
                    (resp) => resp.url().includes(BiliElementMap.url_path.live.anchor.join),
                    {timeout: 10e3}
                )
            ])
            anchor_join_resp = await __anchor_join_resp.json();
        }
        let after_anchor_lot = async () => {
            if ((anchor_join_resp.code === 400) && (lottery_info.gift_num * lottery_info.gift_price !== 0)) {
                console.error(
                    this.bili_dynamic_page.log_format(`【天选抽奖 ${
                        this.bili_dynamic_page.global_var.user_info.uname
                    }】 参与 【${pg.url()}】 金瓜子余额不足!`)
                );
                throw Error(`金瓜子余额不足！`);
            }
            if (anchor_join_resp.code === 0) {
                is_succ = true;
                console.log(this.bili_dynamic_page.log_format(`尝试点赞3次直播间`));
                await this.polymer_op.increase_ContributionRank(
                    pg,
                    3,
                    lottery_info.room_id,
                    this.global_var.live_info.uid,
                    lottery_info.anchor_uid,
                    this.global_var.live_info.csrf
                );
                await this.polymer_op.getOnlineGoldRank(
                    pg,
                    lottery_info.anchor_uid,
                    lottery_info.room_id
                ).then(async (da) => {
                    if (da.code === 0) {
                        let onlineNum = da.data.onlineNum;
                        let score = da.data.ownInfo.score;
                        let rank = da.data.ownInfo.rank;
                        console.log(this.bili_dynamic_page.log_format(`【天选时刻】目前在线人数：${onlineNum} 贡献值：${score} 排名：${rank}`));
                        if (score === 0) {
                            if (this.global_var.anchor.join_risk_mark) {
                                console.warn(
                                    `【天选时刻】房间号：https://live.bilibili.com/${lottery_info.room_id}，参加抽奖后直播间无贡献值，可能已经风控！暂停抽奖${
                                        this.bili_dynamic_page.lottery_setting.live_lottery_module.risk_sleeptime_s * 1e3
                                    }分钟！`,
                                );
                            } else {
                                this.global_var.anchor.join_risk_mark = true;
                                setTimeout(() => {
                                    this.global_var.anchor.join_risk_mark = false;
                                }, this.bili_dynamic_page.lottery_setting.live_lottery_module.risk_sleeptime_s * 1e3);
                                console.warn(this.bili_dynamic_page.log_format(`【天选时刻】${lottery_info.room_id}直播间无贡献值，可能已经风控！)`));
                            }
                        }
                        if (score < 10) {
                            console.log(
                                this.bili_dynamic_page.log_format(`【天选时刻】开始在直播间${lottery_info.room_id}尝试增加${
                                    10 - score
                                }点贡献值！`)
                            );
                            await this.polymer_op.increase_ContributionRank(
                                pg,
                                10 - score,
                                lottery_info.room_id,
                                this.global_var.live_info.uid,
                                lottery_info.anchor_uid,
                                this.global_var.live_info.csrf
                            );
                        }
                    }
                });
            } else {
                this.global_var.anchor.join_risk_mark = true;
                throw Error(`参加抽奖失败！${JSON.stringify(anchor_join_resp)}`);
            }
            console.log(this.bili_dynamic_page.log_format(`SUCCESS\t参加直播间[${lottery_info.room_id}](https://live.bilibili.com/${lottery_info.room_id})天选抽奖反馈：${JSON.stringify(
                    anchor_join_resp
                )}`)
            );
            if (unusual_mark) {
                //查看是否关注，如果关注失败则账号被风控！
                await utils.BAPI.IsUserFollow(pg, lottery_info.anchor_uid).then(
                    async (data) => {
                        if (data.code === 0) {
                            if (!data.data.follow) {
                                //参加抽奖后还是未关注状态判断为异常
                                this.global_var.anchor.join_risk_mark = true;
                                console.error(
                                    this.bili_dynamic_page.log_format(`【天选时刻 ${
                                        this.CONFIG.live_info.uname
                                    }】检测到${lottery_info.room_id}关注异常，暂停抽奖${
                                        this.bili_dynamic_page.lottery_setting.live_lottery_module.risk_sleeptime_s /
                                        60
                                    }分钟！\n${JSON.stringify(data)}`)
                                );
                                setTimeout(async () => {
                                    this.global_var.anchor.join_risk_mark = false;
                                }, this.bili_dynamic_page.lottery_setting.live_lottery_module.risk_sleeptime_s * 1e3);
                            } else {
                                this.global_var.live_info.ALLFollowingList.push(
                                    lottery_info.anchor_uid
                                );
                            }
                        }
                    }
                );
            }
        }
        await this.#executeWithRetry([
            new ExcTaskParams({
                func: before_anchor_lot,
                params: [],
                err: "天选抽奖准备失败",
                pg: pg,
                reload_when_err: false
            }),
            new ExcTaskParams({func: goto_live_page, params: [], err: "前往页面失败", pg: pg, reload_when_err: false}),
            new ExcTaskParams({
                func: exec_anchor_lot,
                params: [],
                err: "天选抽奖执行失败",
                pg: pg,
                reload_when_err: true
            }),
            new ExcTaskParams({
                func: after_anchor_lot,
                params: [],
                err: "天选抽奖后处理失败",
                pg: pg,
                reload_when_err: false
            })
        ], 3, this.#live_lot_error_log_gen({lottery_info: lottery_info}))
        if (is_succ) {
            await AccountLogService.add_live_lot_log({
                account_id: this.bili_dynamic_page.account_id,
                lot_id: lottery_info.lot_id,
                type: lottery_info.type,
                is_succ: true,
                feedback_info: null,
            })
        }
    };

    /**
     *
     * @param {ExcTaskParams[]} tasks
     * @param {number} maxRetries
     * @param {function} err_do
     * @param {Error} [err_do.err]
     * @return {Promise<boolean>}
     */
    async #executeWithRetry(tasks, maxRetries = 3, err_do) {
        for (let i = 0; i < tasks.length; i++) {
            let {func, params, err, pg, reload_when_err} = tasks[i];
            pg = pg ? pg : this.global_var.current_page;
            let retries = 0;
            let success = false;
            let exec_err
            while (!success && retries < maxRetries) {
                try {
                    await func(...params);
                    success = true
                } catch (error) {
                    retries++;
                    exec_err = error;
                    console.error(`Error executing function ${func.name}:`, error);
                    if (retries < maxRetries) {
                        console.warn(`Retrying (${retries}/${maxRetries})...`);
                        await sleep(1e3);
                        if (reload_when_err) {
                            await pg.reload()
                        }
                    } else {
                        console.error('Max retries reached. Break the tasks.');
                        await AccountLogService.add_common_log_by_account_id({
                            account_id: this.bili_dynamic_page.account_id,
                            contents: `${err}\n${error.stack}`,
                            ts: parseInt(utils.Common.dateNow_s()),
                            func_name: func.name,
                            level: 4,
                            module_name: this.constructor.name
                        })
                        throw error;
                    }
                    if (pg.isClosed()) {
                        this.global_var.current_page = await this.bili_dynamic_page.create_new_pg(BiliElementMap.browser_usage.live_lottery)
                    }
                }
            }
            if (!success) {
                console.error(`Failed to execute function ${func.name} after ${maxRetries} retries.jump out of the flow!`);
                err_do && await err_do(exec_err);
                return false
            }
        }
        return true
    }

    /**
     *
     * @param {LiveAnchorType|LiveRedPackType|{goldbox:LiveGoldBoxType[]}} lottery_info
     */
    async #is_need_join({lottery_info}) {
        if (!utils.Common.isToday(this.global_var.live_info.init_ms)) {
            this.global_var.redpack.max_joined_switch = false;
            this.global_var.live_info.init_ms = new Date();
        }
        if ((lottery_info.end_time && (utils.Common.dateNow_s() - lottery_info.end_time) < 30) ||
            (!lottery_info.goldbox)
        ) {
            console.log(this.bili_dynamic_page.log_format(`当前抽奖剩余时间小于30s，跳过`))
            return false
        }
        if (lottery_info.goldbox && lottery_info.goldbox.length > 0) {
            if (lottery_info.goldbox[lottery_info.goldbox.length - 1].join_end_time >= utils.Common.dateNow()) {
                return false //已经全部结束
            }
            for (let i = 0; i <= lottery_info.goldbox.length; i++) {
                if (lottery_info.goldbox[i].join_start_time * 1e3 > utils.Common.dateNow()) {
                    return false; //未开始
                }
                if (this.global_var.goldbox.joined_goldbox_id_list.includes(lottery_info.goldbox[i].aid * 100 + lottery_info.goldbox[i].num)) {
                    lottery_info.goldbox[i] = null;
                }//实物抽奖特征id：aid*100+number
                else {
                    return true;
                }
            }
            return false; // 已经全部参加！
        }
        if (lottery_info.type === "anchor") {
            if (!this.bili_dynamic_page.lottery_setting.live_lottery_module.anchor_switch) return false;
            if (this.global_var.anchor.joined_anchor_id_list.includes(lottery_info.lot_id)) return false;
            if (this.bili_dynamic_page.lottery_setting.live_lottery_module.anchor_unignore_words.length === 0) return true;
            if (this.bili_dynamic_page.lottery_setting.live_lottery_module.anchor_unignore_words.includes(lottery_info.award_name) ||
                this.bili_dynamic_page.lottery_setting.live_lottery_module.anchor_unignore_words.find(el => lottery_info.award_name.includes(el))
            ) {
                return true
            }
            await AccountLogService.add_live_lot_log({
                account_id: this.bili_dynamic_page.account_id,
                lot_id: lottery_info.lot_id,
                type: lottery_info.type,
                is_succ: true,
                feedback_info: `忽略奖品名称：${lottery_info.award_name}`
            })
            return false
        }
        if (lottery_info.type === "popularity_red_pocket") {
            if (!this.bili_dynamic_page.lottery_setting.live_lottery_module.redpack_switch) return false
            if (!this.global_var.redpack.max_joined_switch) return false;
            if (this.global_var.redpack.joined_redpacket_lot_id_list.includes(lottery_info.lot_id)) return false
            if (lottery_info.total_price > this.bili_dynamic_page.lottery_setting.live_lottery_module.redpack_limit_price) return true;
            await AccountLogService.add_live_lot_log({
                account_id: this.bili_dynamic_page.account_id,
                lot_id: lottery_info.lot_id,
                type: lottery_info.type,
                is_succ: true,
                feedback_info: `忽略金额：${lottery_info.total_price}`
            })
            return false
        }
        console.error(this.bili_dynamic_page.log_format(`未知直播抽奖类型！！！${JSON.stringify(lottery_info)}`))
        return false
    }


    /**
     *
     * @param {LiveAnchorType|LiveRedPackType|{goldbox:LiveGoldBoxType[]},type:"gold_box"} lottery_info
     */
    async #exec_live_lottery({lottery_info}) {
        await this.bili_dynamic_page.setting_op.refresh_lottery_setting();
        let pg = await this.bili_dynamic_page.create_new_pg(BiliElementMap.browser_usage.live_lottery)
        await pptr_op.check_page_is_front(pg);
        if (!await this.bili_dynamic_page.check_login(pg)) throw Error(`登录失败！`);
        if (!this.global_var.live_info.csrf) {
            this.global_var.live_info.csrf = await pptr_op.get_bili_cjt(pg);
        } //获取csrf
        if (!this.global_var.live_info.uid) {
            this.global_var.live_info.uid = await pptr_op.get_uid(pg);
        }
        switch (lottery_info.type) {
            case "anchor":
                await this.#join_anchor_lot({pg: pg, lottery_info: lottery_info});
                break;
            case "popularity_red_pocket":
                await this.#join_redpacket_lot({pg: pg, lottery_info: lottery_info});
                break;
            case "gold_box":
                await this.#join_goldbox_lot({pg: pg, lottery_info: lottery_info[0]});
                break;
            default: {
                await AccountLogService.add_common_log_by_account_id({
                    account_id: this.bili_dynamic_page.account_id,
                    contents: "执行直播抽奖任务出错！未知抽奖类型！",
                    ts: parseInt(utils.Common.dateNow_s()),
                    func_name: "exec_live_lottery",
                    level: 4,
                    module_name: "BiliLiveLotPage"
                })
                console.error(this.bili_dynamic_page.log_format(`未知直播抽奖类型！！！${JSON.stringify(lottery_info)}`));
                break;
            }
        }

    }

    /**
     *
     * @param {LiveAnchorType|LiveRedPackType|{goldbox:LiveGoldBoxType[]}} lottery_info
     * @return {Promise<void>}
     */
    async main({lottery_info}) {
        try {
            if (!await this.#is_need_join({lottery_info: lottery_info})) {
                console.log(this.bili_dynamic_page.log_format(`跳过抽奖：【${JSON.stringify(lottery_info)}】`))
                return;
            }
            console.log(this.bili_dynamic_page.log_format(`执行直播抽奖任务:【${JSON.stringify(lottery_info)}】`))
            if (lottery_info.goldbox && lottery_info.goldbox.length > 0) {
                this.bili_dynamic_page.global_var.FLAG.执行其他任务中标志 = true;
                lottery_info.type = "gold_box";
                lottery_info.goldbox = lottery_info.goldbox.filter(el => el);
            }
            await this.#exec_live_lottery({lottery_info: lottery_info});
            console.log(this.bili_dynamic_page.log_format(`直播抽奖任务执行完成！`))
        } catch (e) {
            await AccountLogService.add_common_log_by_account_id({
                account_id: this.bili_dynamic_page.account_id,
                contents: `直播抽奖执行失败\n${e.stack}`,
                ts: parseInt(utils.Common.dateNow_s()),
                func_name: "exec_live_lottery",
                level: 4,
                module_name: "BiliLiveLotPage"
            })
            console.error(this.bili_dynamic_page.log_format(`执行直播抽奖任务出错！\n${e}`))
        } finally {
            this.bili_dynamic_page.global_var.FLAG.执行其他任务中标志 = false;
        }
    }
}

module.exports = {
    BiliLiveLotPage
}