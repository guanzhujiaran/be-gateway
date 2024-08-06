const {BiliElementMap} = require("@/ExpressServerEnd/BiliPPTR/utils/element_map");
const {BaseGlobalVar, LiveLotteryGlobalVar} = require("@/ExpressServerEnd/BiliPPTR/utils/global_var");
const {utils, pptr_op, sleep} = require("@/ExpressServerEnd/BiliPPTR/utils/utils");
const {AccountLogService} = require("@/ExpressServerEnd/Service/account_log_module/account_log_service");
const {ExcTaskParams} = require("@/ExpressServerEnd/BiliPPTR/models/pages/tasks_model");
const {BiliOtherPage} = require("@/ExpressServerEnd/BiliPPTR/pages/base_other_page");
const {GLOBAL_CONFIG} = require("@/ExpressServerEnd/BiliPPTR/config/global_config");
const {live_lottery_setting} = require("@/ExpressServerEnd/BiliPPTR/models/pages/live_anchor_redpack_module");
const fs = require("fs");
const {ExecutionContext} = require("puppeteer-core");

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
                    const elementToRemove = document.querySelector(selector);
                    if (elementToRemove) {
                        elementToRemove.remove();
                    }
                }, BiliElementMap.live_page.live_player); //移除播放器
                await pg.evaluate((selector) => {
                    const elementToRemove = document.querySelector(selector);
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
     * @param {Page} pg
     * @param {LiveRedPackType} lottery_info
     * @return {Promise<void>}
     */
    async #join_redpacket_lot({pg, lottery_info}) {
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
                console.log(
                    `【直播间电池道具】房间号：https://live.bilibili.com/${room_id} ，直播间道具红包总值${
                        total_price / 1000
                    }元参与成功！\t${JSON.stringify(resp_data)}`
                );
                console.log(`尝试点赞3次直播间`);
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
                            console.log(
                                `【直播间电池道具】目前在线人数：${onlineNum}贡献值：${score}排名：${rank}`,
                                "success"
                            );
                            if (score == 0) {
                                if (this.CONFIG.redpacket.join_risk_mark) {
                                    console.log(
                                        `【直播间电池道具】房间号：https://live.bilibili.com/${room_id}，参加抽奖后直播间无贡献值，可能已经风控！，暂停抽奖${this.CONFIG.redpacket.risk_sleeptime}分钟！`,
                                        "warning"
                                    );
                                } else {
                                    this.CONFIG.redpacket.join_risk_mark = true;
                                    setTimeout(() => {
                                        this.CONFIG.redpacket.join_risk_mark = false;
                                    }, this.CONFIG.redpacket.risk_sleeptime);
                                    console.log(
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
                                console.log(
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
                            console.log(
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
                console.log(
                    `【直播间电池道具】达到每日上限！${room_id}直播间道具红包参与反馈：${JSON.stringify(
                        resp_data
                    )}`,
                    "warning"
                );
            } else if (resp_data.code == 1009114) {
                // 已抽奖
                this.CONFIG.redpacket.times.fail++;
                console.log(
                    `【直播间电池道具】${room_id}直播间道具红包参与反馈：${JSON.stringify(
                        resp_data
                    )}`,
                    "warning"
                );
            } else {
                this.CONFIG.redpacket.times.fail++;
                this.CONFIG.redpacket.join_risk_mark = true;
                console.log(
                    `【直播间电池道具】${room_id}直播间道具红包参与反馈：${JSON.stringify(
                        resp_data
                    )}`,
                    "warning"
                );
            }

            console.log(
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
            console.log(`参加红包抽奖失败！${e}\n${e.stack}`, "error");
            this.Lot_log.log_write(
                `ERROR\t参加直播间[${room_id}](https://live.bilibili.com/${room_id})道具红包失败！：${e.toString()}`,
                "道具红包"
            );
            throw e;
        }
    }

    /**
     * 通过独立的html参加天选抽奖
     * @param {Page} pg
     * @param {LiveAnchorType} lottery_info
     * @returns
     */
    async #join_anchor_lot({pg, lottery_info}) {
        await pptr_op.check_page_is_front(pg);
        if (!this.global_var.live_info.csrf) {
            this.global_var.live_info.csrf = await pptr_op.get_bili_cjt(pg);
        } //获取csrf
        let unusual_mark = false;
        let anchor_join_resp;
        const goto_live_page = async () => {
            await pg.goto(`https://live.bilibili.com/${lottery_info.room_id}`);
            await this.basic_op.remove_live_player(pg);
        }
        const before_anchor_lot = async () => {
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
        const exec_anchor_lot = async () => {
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
        const after_anchor_lot = async () => {
            if ((anchor_join_resp.code === 400) && (lottery_info.gift_num * lottery_info.gift_price !== 0)) {
                console.error(
                    this.bili_dynamic_page.log_format(`【天选抽奖 ${
                        this.bili_dynamic_page.global_var.user_info.uname
                    }】 参与 【${pg.url()}】 金瓜子余额不足!`)
                );
                throw Error(`金瓜子余额不足！`);
            }
            if (anchor_join_resp.code === 0) {
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

        if (await this.executeWithRetry([
            new ExcTaskParams({func: goto_live_page, params: [], err: "前往页面失败", pg: pg, reload_when_err: false}),
            new ExcTaskParams({
                func: before_anchor_lot,
                params: [],
                err: "天选抽奖准备失败",
                pg: pg,
                reload_when_err: false
            }),
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
        ])){
            await
        }

    };

    /**
     *
     * @param {ExcTaskParams[]} tasks
     * @param {number} maxRetries
     * @return {Promise<boolean>}
     */
    async executeWithRetry(tasks, maxRetries = 3) {
        for (let i = 0; i < tasks.length; i++) {
            let {func, params, err, pg, reload_when_err} = tasks[i];
            pg = pg ? pg : this.global_var.current_page;
            let retries = 0;
            let success = false;
            while (!success && retries < maxRetries) {
                try {
                    await func(...params);
                    success = true
                } catch (error) {
                    retries++;
                    console.error(`Error executing function ${func.name}:`, error);
                    if (retries < maxRetries) {
                        console.warn(`Retrying (${retries}/${maxRetries})...`);
                        await sleep(1e3);
                        if (reload_when_err) {
                            await pg.reload()
                        }
                    } else {
                        console.error('Max retries reached. Break the tasks.');
                        throw error;
                    }
                    if (pg.isClosed()) {
                        this.global_var.current_page = await this.bili_dynamic_page.create_new_pg(BiliElementMap.browser_usage.daily_task)
                    }
                }
            }
            if (!success) {
                console.error(`Failed to execute function ${func.name} after ${maxRetries} retries.`);
            }
        }
        return true
    }

    /**
     *
     * @param {LiveAnchorType|LiveRedPackType|LiveGoldBoxType} lottery_info
     */
    async #is_need_join({lottery_info}) {
        if ((lottery_info.end_time && (utils.Common.dateNow_s() - lottery_info.end_time) < 30) ||
            (lottery_info.join_end_time && (utils.Common.dateNow_s() - lottery_info.join_end_time) < 30)
        ) {
            console.log(this.bili_dynamic_page.log_format(`当前抽奖剩余时间小于30s，跳过`))
            return false
        }
        if (lottery_info.type === "gold_box") return true;
        if (lottery_info.type === "anchor") {
            if (!this.bili_dynamic_page.lottery_setting.live_lottery_module.anchor_switch) return false;
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
    }


    /**
     *
     * @param {LiveAnchorType|LiveRedPackType|LiveGoldBoxType} lottery_info
     */
    #exec_live_lottery({lottery_info}) {
        // TODO:创建页面

    }

    /**
     *
     * @param {LiveAnchorType|LiveRedPackType|LiveGoldBoxType} lottery_info
     * @return {Promise<void>}
     */
    async main({lottery_info}) {
        try {
            if (!await this.#is_need_join({lottery_info: lottery_info})) {
                console.log(this.bili_dynamic_page.log_format(`跳过抽奖：【${JSON.stringify(lottery_info)}】`))
                return;
            }
            console.log(this.bili_dynamic_page.log_format(`执行直播抽奖任务:【${JSON.stringify(lottery_info)}】`))
            if (lottery_info.type !== "gold_box") this.bili_dynamic_page.global_var.FLAG.执行其他任务中标志 = true;
            await this.executeWithRetry([new ExcTaskParams({
                func: this.#exec_live_lottery,
                params: [],
                err: `执行抽奖失败`,
                reload_when_err: false
            })])
            console.log(this.bili_dynamic_page.log_format(`直播抽奖任务执行完成！`))
        } catch (e) {
            console.error(this.bili_dynamic_page.log_format(`执行直播抽奖任务出错！\n${e}`))
        } finally {
            this.bili_dynamic_page.global_var.FLAG.执行其他任务中标志 = false;
        }
    }
}

module.exports = {
    BiliLiveLotPage
}