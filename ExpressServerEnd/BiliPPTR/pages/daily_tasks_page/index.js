const {BiliElementMap} = require("@/ExpressServerEnd/BiliPPTR/utils/element_map");
const {BaseGlobalVar} = require("@/ExpressServerEnd/BiliPPTR/utils/global_var");
const {utils} = require("@/ExpressServerEnd/BiliPPTR/utils/utils");
const {AccountLogService} = require("@/ExpressServerEnd/Service/account_log_module/account_log_service");
const {ExcTaskParams} = require("@/ExpressServerEnd/BiliPPTR/models/pages/tasks_model");
const {pptr_op, sleep} = require("@/木偶模块/util/common_utl");
const {BiliOtherPage} = require("@/ExpressServerEnd/BiliPPTR/pages/base_other_page");

class BiliDailyTaskPage extends BiliOtherPage {
    /**
     *
     * @param {BiliDynamicPage} bili_dynamic_page
     */
    constructor({bili_dynamic_page}) {
        super({bili_dynamic_page: bili_dynamic_page})
    }

    /**
     *
     * @param {ExcTaskParams[]} tasks
     * @param {number} maxRetries
     * @return {Promise<boolean>}
     */
    async #executeWithRetry(tasks, maxRetries = 3) {
        for (let i = 0; i < tasks.length; i++) {
            const {func, params, err, pg, reload_when_err} = tasks[i];
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
                        this.global_var.current_page = await this.bili_dynamic_page.create_new_pg(BiliElementMap.browser_usage.daily_task)
                    }
                }
            }
            if (!success) {
                console.error(`Failed to execute function ${func.name} after ${maxRetries} retries.jump out of the flow!`);
                return false
            }
        }
        return true
    }

    async sanlian(pg = this.global_var.current_page) {
        /**
         *
         * @type {ExcTaskParams[]}
         */
        let op_arr = [];
        let user_nav = this.bili_dynamic_page.global_var.user_info.user_nav;
        let my_coin = user_nav.data.money;
        if (my_coin < 1) {
            console.log(
                this.bili_dynamic_page.log_format(
                    `硬币不够三连，跳过每日投币经验奖励`)
            );
            return;
        }
        let my_level = user_nav?.data?.level_info?.current_level;
        if (my_level === 6) {
            console.log(this.bili_dynamic_page.log_format(`等级满了，跳过每日投币经验奖励`));
            await AccountLogService.update_sanlian_ts({
                account_id: this.bili_dynamic_page.account_id,
                sanlian_ts: Math.ceil(Date.now() / 1000)
            })
            return;
        }
        await pg.goto(
            BiliElementMap.url_path.user.home,
            {waitUntil: "networkidle2"}
        );

        let exp_text = await pg.$$eval(
            `.home-dialy-exp-item`,
            (els) => {
                try {
                    for (let task_elm of els) {
                        if (
                            task_elm.getElementsByClassName(
                                "re-exp-info"
                            )[0].textContent === "每日投币"
                        ) {
                            if (
                                task_elm.getElementsByClassName(
                                    "re-exp-none"
                                )
                            ) {
                                return task_elm.getElementsByClassName(
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
                this.bili_dynamic_page.log_format(`需要投${coin_thow_num}个硬币`)
            );
            let video_num = Math.ceil(coin_thow_num / 2);
            let sanlian_num = Math.ceil(coin_thow_num / 2);
            let toubi_num = coin_thow_num % 2;
            let share_video_links =
                await this.bili_dynamic_page.prevent_filter_op.get_video_list(
                    video_num,
                    pg
                );
            for (let v_link of share_video_links) {
                if (sanlian_num) {
                    op_arr.push(new ExcTaskParams({
                        func: this.bili_dynamic_page.video_op.goto_video_page,
                        params: [v_link, pg],
                        err: "每日任务三连失败--前往页面失败",
                        pg: pg,
                        reload_when_err: true,
                    }))
                    op_arr.push(new ExcTaskParams({
                        func: this.bili_dynamic_page.video_op.sanlian,
                        params: [v_link, pg],
                        err: "每日任务三连失败--执行三连失败",
                        pg: pg,
                        reload_when_err: true,
                    }))
                    sanlian_num -= 1;
                    continue;
                }
                if (toubi_num) {
                    op_arr.push(new ExcTaskParams({
                        func: this.bili_dynamic_page.video_op.goto_video_page,
                        params: [v_link, pg],
                        err: "每日任务三连失败--前往页面失败",
                        pg: pg,
                        reload_when_err: true,
                    }))
                    op_arr.push(new ExcTaskParams({
                        func: this.bili_dynamic_page.video_op.toubi,
                        params: [1, v_link, pg],
                        err: "每日任务三连失败--执行投币失败",
                        pg: pg,
                        reload_when_err: true,
                    }))
                    toubi_num -= 1;
                }
            }

            if (await this.#executeWithRetry(op_arr)) {
                await AccountLogService.update_sanlian_ts({
                    account_id: this.bili_dynamic_page.account_id,
                    sanlian_ts: Math.ceil(Date.now() / 1000)
                })
                console.log(
                    this.bili_dynamic_page.log_format(`每日投币经验任务完成`)
                );
            }

        } else {
            await AccountLogService.update_sanlian_ts({
                account_id: this.bili_dynamic_page.account_id,
                sanlian_ts: Math.ceil(Date.now() / 1000)
            })
            console.log(this.bili_dynamic_page.log_format(`投币经验已满`));
        }
    }

    /**
     * 领取b币，这个没问题
     * @param pg
     * @return {Promise<boolean>}
     */
    async get_BCoin(pg = this.global_var.current_page) {
        let op_arr = [];
        let user_nav = this.bili_dynamic_page.global_var.user_info.user_nav;
        let vipStatus = user_nav.data.vipStatus;
        let vipType = user_nav.data.vipType;
        let bcoin_get = false;
        let do_get_BCoin = async () => {
            await pptr_op.check_page_is_front(pg);
            await pg.goto(
                `https://account.bilibili.com/account/big/myPackage`,
                {waitUntil: "networkidle2"}
            );
            let coupon_contents =
                await pg.$$(
                    `.coupon-content`
                );
            for (let coupon_content of coupon_contents) {
                await pptr_op.check_page_is_front(pg);
                console.log(
                    this.bili_dynamic_page.log_format(`当前大会员权益：${await coupon_content.$eval(
                        ".coupon-content-con",
                        (el) => el.innerText
                    )}`)
                );
                if ((await coupon_content.$eval(".coupon-btn", (el) => el.getAttribute("class"))).includes(`coupon-btn-disable`)) {
                    if ((await coupon_content.$eval(".coupon-content-con", (el) => el.innerText)).includes(`B币`)) {
                        let desc_tips = await coupon_content.$$eval(".coupon-desc-tip", (el) => el.map(e => e.innerText).join('\n'))
                        let dateMatch = desc_tips.match(/\d{4}\/\d{2}\/\d{2}/);
                        if (dateMatch) {
                            let dateString = dateMatch[0];
                            let date = new Date(dateString.replace(/(\d{4})\/(\d{2})\/(\d{2})/, '$1-$2-$3'));
                            let now = new Date();
                            if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
                                console.log(this.bili_dynamic_page.log_format(`领取b币的日期 ${dateString} 是本月的日期，判断为还没领取b币！`));
                            } else {
                                bcoin_get = true;
                            }
                        } else {
                            console.log(this.bili_dynamic_page.log_format(`获取领取b币的日期失败，判断为还没领取b币！`));
                        }
                    }
                } else {
                    let coupon_btn = await coupon_content.waitForSelector(`.coupon-btn`);
                    await coupon_btn.click()
                    await sleep(3e3);
                    try {
                        let _parent_node = await coupon_content.getProperty('parentNode');
                        let dialog_close_icon = await _parent_node.waitForSelector('.dialog-close-icon', {
                            visible: true,
                        });
                        await dialog_close_icon.click();
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
                    } catch (e) {
                        console.error(this.bili_dynamic_page.log_format(`当前大会员权益：${await coupon_content.$eval(
                                ".coupon-content-con",
                                (el) => el.innerText
                            )} 领取失败！\n${e}`)
                        );
                        throw e
                    }
                }
            }
        }
        if (vipType === 2 && vipStatus === 1) {
            op_arr.push(
                new ExcTaskParams({
                    func: do_get_BCoin,
                    params: [],
                    err: "每日任务获取b币失败--获取b币失败",
                    pg: pg,
                    reload_when_err: true,
                })
            )
        } else {
            bcoin_get = true;
        }
        if (await this.#executeWithRetry(op_arr) && bcoin_get) {
            await AccountLogService.update_bcoin_ts({
                account_id: this.bili_dynamic_page.account_id,
                bcoin_ts: utils.Common.dateNow_s()
            })
            return true
        }
        return false;

    }

    /**
     * b币领取之后充电，这个需要检查一下
     * @param pg
     * @param has_bcoin_get
     * @return {Promise<void>}
     */
    async charge_BCoin(pg = this.global_var.current_page, has_bcoin_get = false) {
        const charge = async () => {
            await pg.waitForSelector(`.user .pay-button`).then(async (jshandle) => {
                await jshandle.click();
            });
            await pg.waitForSelector(`.gold-store .sub-tab-box .list :not(.active)`).then(async (jshandle) => {
                await jshandle.click();
            });
            await pg.waitForSelector(`.ipt-number`).then(async () => {
                await pg.type(
                    `.ipt-number`,
                    "5"
                );
            });
            await pg.waitForSelector(`.content-cntr .pointer`).then(async jshandle => await jshandle.click())
            let create_order_resp;
            await Promise.all([
                pg.waitForSelector(`.bl-button`).then(async (jshandle) => {
                    await jshandle.click();
                }),
                create_order_resp = await pg.waitForResponse(resp => resp.url().includes(`xlive/revenue/v1/order/createOrder`))
            ]);
            create_order_resp = create_order_resp && await create_order_resp.json() || {}
            if (create_order_resp.code === 0) {
                return true;
            } else {
                throw Error(`充电失败！${JSON.stringify(create_order_resp)}`);
            }

        }
        let op_arr = []
        let user_nav = this.bili_dynamic_page.global_var.user_info.user_nav;
        let vipStatus = user_nav.data.vipStatus;
        let vipType = user_nav.data.vipType;
        if (vipType === 2 && vipStatus === 1) {
            await pptr_op.check_page_is_front(pg);
            let user_nav_resp;
            await Promise.all([
                pg.goto(
                    `https://link.bilibili.com/p/center/index#/user-center/my-info/operation`,
                    {waitUntil: "networkidle2"}
                ),
                user_nav_resp = await pg.waitForResponse(resp => resp.url().includes(BiliElementMap.url_path.user.nav))
            ]);
            user_nav = user_nav_resp && await user_nav_resp.json() || user_nav;
            if (user_nav.data.wallet.bcoin_balance !== 0) {
                op_arr.push(new ExcTaskParams({
                    func: charge, params: [], err: `b币兑换电池失败`, pg: pg, reload_when_err: true
                }))
            }
        }

        if ((await this.#executeWithRetry(op_arr) && user_nav.data.wallet.bcoin_balance !== 0) || (has_bcoin_get && user_nav.data.wallet.bcoin_balance === 0))
            await AccountLogService.update_charge_ts({
                account_id: this.bili_dynamic_page.account_id,
                charge_ts: utils.Common.dateNow_s()
            });
    }

    /**
     *
     * @param pg {Page}
     * @param send_bag_gift_room_id
     * @return {Promise<void>}
     */
    async live_send_bag_gift(pg, send_bag_gift_room_id) {//TODO这里写一个送背包礼物的逻辑
        let op_arr = [];
        await pptr_op.check_page_is_front(pg);
        let url = `https://live.bilibili.com/${send_bag_gift_room_id}`

        await pg.goto(url, {waitUntil: "networkidle2"});
        let do_send_bag = async () => {
            let bag_list_url = BiliElementMap.url_path.live.bag_list;
            let bag_resp;
            await Promise.all([
                pg.locator(BiliElementMap.live_page.gift_package).click(),
                bag_resp = await (await pg.waitForResponse(resp => resp.url().includes(bag_list_url)))?.json()
            ])
            if (bag_resp?.code === 0 && bag_resp?.data?.list?.length > 0) {
                console.log(this.bili_dynamic_page.log_format(
                    `开始执行送礼，将免费礼物送至直播间：${url}\n礼物列表：${
                        '\n'.join(bag_resp.data.list.map(el => el?.gift_name?.concat('*'.concat(JSON.stringify(el.gift_num)))))
                    }`
                ))
                for (let i = 0; i < bag_resp?.data?.list?.length ?? 0; i++) {
                    await pg.locator(BiliElementMap.live_page.new_gift_item_wrap).hover()
                    await pg.locator(
                        BiliElementMap.live_page.last_gift_send_box_btn
                    ).click()
                    await sleep(
                        utils.Common.getRandomFloat(0.5, 3)
                    )
                }
            }
        }
        op_arr.push(new ExcTaskParams({
            func: do_send_bag, params: [], err: `每日直播间送礼失败！`, pg: pg, reload_when_err: true
        }))
        if (await this.#executeWithRetry(op_arr)) {
            await AccountLogService.update_live_send_gift_ts({
                account_id: this.bili_dynamic_page.account_id,
                live_send_gift_ts: utils.Common.dateNow_s()
            });
        }
    }


    async #exec_daily_task() {
        await this.bili_dynamic_page.setting_op.refresh_lottery_setting();
        let lottery_setting = Object.fromEntries(Object.entries(this.bili_dynamic_page.lottery_setting));
        let log_info = await AccountLogService.get_log_daily_task_info(this.bili_dynamic_page.account_id);
        let sanlian_flag = (typeof log_info.sanlian_ts === "number") &&
            !utils.Common.isToday(log_info.sanlian_ts * 1e3) &&
            lottery_setting.daily_task_module.sanlian_flag;
        let get_bcoin_flag = (typeof log_info.bcoin_ts === "number") &&
            !utils.Common.isThisMonth(log_info.bcoin_ts * 1e3) &&
            lottery_setting.daily_task_module.bcoin_flag;
        let charge_flag = (typeof log_info.charge_ts === "number") &&
            !utils.Common.isThisMonth(log_info.charge_ts * 1e3) &&
            lottery_setting.daily_task_module.charge_flag;
        let live_send_gift_flag = (typeof log_info.live_send_gift_ts === "number") &&
            !utils.Common.isThisMonth(log_info.live_send_gift_ts * 1e3) &&
            lottery_setting.daily_task_module.send_bag_gift_flag &&
            parseInt(lottery_setting.daily_task_module.send_bag_gift_room_id) >= 0;


        if (sanlian_flag || get_bcoin_flag || charge_flag || live_send_gift_flag) {
            this.global_var.current_page = await this.bili_dynamic_page.create_new_pg(BiliElementMap.browser_usage.daily_task)
        } else {
            return
        }
        try {
            if (!await this.bili_dynamic_page.check_login(this.global_var.current_page)) throw Error(`登录失败！`);
            await this.get_user_nav(this.global_var.current_page);
            if (sanlian_flag) {
                await this.sanlian(); //执行三连
            }
            if (get_bcoin_flag) {
                get_bcoin_flag = !await this.get_BCoin(); //执行领取b币
            }
            if (charge_flag) {
                await this.charge_BCoin(this.global_var.current_page, !get_bcoin_flag); //执行充电
            }
            if (live_send_gift_flag) {
                await this.live_send_bag_gift(
                    this.global_var.current_page, lottery_setting.live_lottery_module.send_bag_gift_room_id
                )
            }
        } catch (e) {
            throw e
        } finally {
            this.global_var.current_page && await this.global_var.current_page.close();
        }

    }


    async main() {
        try {
            while (this.bili_dynamic_page.global_var.FLAG.执行其他任务中标志) {
                await sleep(10e3)
            }
            if (!this.bili_dynamic_page.lottery_setting.CONFIG.AUTO_DailyReward) return
            console.log(this.bili_dynamic_page.log_format(`执行每日任务！`))
            this.bili_dynamic_page.global_var.FLAG.执行其他任务中标志 = true;
            await this.#exec_daily_task();
            console.log(this.bili_dynamic_page.log_format(`每日任务执行完成！`))
        } catch (e) {
            console.error(this.bili_dynamic_page.log_format(`执行每日任务出错！\n${e.stack}`))
            await AccountLogService.add_common_log_by_account_id({
                account_id: this.bili_dynamic_page.account_id,
                contents: `每日任务执行失败\n${e.stack}`,
                ts: parseInt(utils.Common.dateNow_s()),
                func_name: "exec_daily_task",
                level: 4,
                module_name: "BiliDailyTaskPage"
            })
        } finally {
            this.bili_dynamic_page.global_var.FLAG.执行其他任务中标志 = false;
        }
    }


}

module.exports = {
    BiliDailyTaskPage
}