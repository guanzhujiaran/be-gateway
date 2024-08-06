const {BiliElementMap} = require("@/ExpressServerEnd/BiliPPTR/utils/element_map");
const {BaseGlobalVar} = require("@/ExpressServerEnd/BiliPPTR/utils/global_var");
const {utils} = require("@/ExpressServerEnd/BiliPPTR/utils/utils");
const {AccountLogService} = require("@/ExpressServerEnd/Service/account_log_module/account_log_service");
const {ExcTaskParams} = require("@/ExpressServerEnd/BiliPPTR/models/pages/tasks_model");
const {pptr_op, sleep} = require("@/木偶模块/util/common_utl");
const {BiliOtherPage} = require("@/ExpressServerEnd/BiliPPTR/pages/base_other_page");
const {GLOBAL_CONFIG} = require("@/ExpressServerEnd/BiliPPTR/config/global_config");
const {live_lottery_setting} = require("@/ExpressServerEnd/BiliPPTR/models/pages/live_anchor_redpack_module");
const fs = require("fs");

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


    /**
     * 直播抽奖不使用全局变量的页面，因为同时会有多个直播抽奖，所以都使用单独的页面
     * @param {BiliDynamicPage} bili_dynamic_page
     */
    constructor({bili_dynamic_page}) {
        super({bili_dynamic_page: bili_dynamic_page})
    }

    async #join_redpacket_lot({pg, room_id, anchor_uid, lot_id, total_price}) {
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
                this.API.chatLog(
                    `【直播间电池道具】房间号：https://live.bilibili.com/${room_id} ，直播间道具红包总值${
                        total_price / 1000
                    }元参与成功！\t${JSON.stringify(resp_data)}`
                );
                this.API.chatLog(`尝试点赞3次直播间`);
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
                            this.API.chatLog(
                                `【直播间电池道具】目前在线人数：${onlineNum}贡献值：${score}排名：${rank}`,
                                "success"
                            );
                            if (score == 0) {
                                if (this.CONFIG.redpacket.join_risk_mark) {
                                    this.API.chatLog(
                                        `【直播间电池道具】房间号：https://live.bilibili.com/${room_id}，参加抽奖后直播间无贡献值，可能已经风控！，暂停抽奖${this.CONFIG.redpacket.risk_sleeptime}分钟！`,
                                        "warning"
                                    );
                                } else {
                                    this.CONFIG.redpacket.join_risk_mark = true;
                                    setTimeout(() => {
                                        this.CONFIG.redpacket.join_risk_mark = false;
                                    }, this.CONFIG.redpacket.risk_sleeptime);
                                    this.API.chatLog(
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
                                this.API.chatLog(
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
                            this.API.chatLog(
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
                this.API.chatLog(
                    `【直播间电池道具】达到每日上限！${room_id}直播间道具红包参与反馈：${JSON.stringify(
                        resp_data
                    )}`,
                    "warning"
                );
            } else if (resp_data.code == 1009114) {
                // 已抽奖
                this.CONFIG.redpacket.times.fail++;
                this.API.chatLog(
                    `【直播间电池道具】${room_id}直播间道具红包参与反馈：${JSON.stringify(
                        resp_data
                    )}`,
                    "warning"
                );
            } else {
                this.CONFIG.redpacket.times.fail++;
                this.CONFIG.redpacket.join_risk_mark = true;
                this.API.chatLog(
                    `【直播间电池道具】${room_id}直播间道具红包参与反馈：${JSON.stringify(
                        resp_data
                    )}`,
                    "warning"
                );
            }

            this.API.chatLog(
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
            this.API.chatLog(`参加红包抽奖失败！${e}\n${e.stack}`, "error");
            this.Lot_log.log_write(
                `ERROR\t参加直播间[${room_id}](https://live.bilibili.com/${room_id})道具红包失败！：${e.toString()}`,
                "道具红包"
            );
            throw e;
        }
    }

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
    #is_need_join({lottery_info}) {
        if (lottery_info.type === "gold_box") return true;
        if (lottery_info.type === "anchor") {
            if (!this.bili_dynamic_page.lottery_setting.live_lottery_module.anchor_switch) return false;
            if (this.bili_dynamic_page.lottery_setting.live_lottery_module.anchor_unignore_words.length === 0) return true;
            if (this.bili_dynamic_page.lottery_setting.live_lottery_module.anchor_unignore_words.includes(lottery_info.award_name) ||
                this.bili_dynamic_page.lottery_setting.live_lottery_module.anchor_unignore_words.find(el => lottery_info.award_name.includes(el))
            ) {
                return true
            }
            return false
        }
        if (lottery_info.type === "popularity_red_pocket") {
            if (!this.bili_dynamic_page.lottery_setting.live_lottery_module.redpack_switch) return false
            if (lottery_info.total_price > this.bili_dynamic_page.lottery_setting.live_lottery_module.redpack_limit_price) return true;
            return false
        }
    }

    /**
     *
     * @param {LiveAnchorType|LiveRedPackType|LiveGoldBoxType} lottery_info
     */
    #exec_live_lottery({lottery_info}) {


    }

    /**
     *
     * @param {LiveAnchorType|LiveRedPackType|LiveGoldBoxType} lottery_info
     * @return {Promise<void>}
     */
    async main({lottery_info}) {
        try {
            if (!this.#is_need_join({lottery_info: lottery_info})) {
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