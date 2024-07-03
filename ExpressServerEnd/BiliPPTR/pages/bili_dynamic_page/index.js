/**
 * 每一个页面就是一个对象，每个对象主要负责一个页面的功能
 * 此页面实现主站的抽奖动态转发，预约抽奖，官方抽奖，防过滤操作，每日奖励等功能，因此会写的比较长
 */
const {pptr_op, utils, sleep} = require("@/ExpressServerEnd/BiliPPTR/utils/utils");
const {GLOBAL_CONFIG} = require('@/ExpressServerEnd/BiliPPTR/config/global_config')
const axios = require('axios');
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const {BiliElementMap} = require("@/ExpressServerEnd/BiliPPTR/utils/element_map");
const {AccountDao} = require("@/ExpressServerEnd/DAO/AccountDao");
const BasePage = require("@/ExpressServerEnd/BiliPPTR/pages/base_page");
const BasicOp = require("@/ExpressServerEnd/BiliPPTR/pages/bili_dynamic_page/Op/basic_op");
const {manual_op_fail_model} = require("@/ExpressServerEnd/BiliPPTR/models/pages/bili_dynamic_page_model");
const {AccountLogDao} = require("@/ExpressServerEnd/DAO/AccountLogDao");
const {AccountLogService} = require("@/ExpressServerEnd/Service/account_log_module/account_log_service");
const stealth = StealthPlugin();
stealth.enabledEvasions.delete("user-agent-override");
puppeteer.use(StealthPlugin());


class BiliDynamicPage extends BasePage {
    start_time = utils.Common.dateNow();

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
        super(...arguments);

        //region 加载每个操作模块
        let {
            basic_op,
            video_op,
            comment_op,
            judge_official_lottery_op,
            copy_reply_op,
            prevent_filter_op
        } = new BasicOp(...arguments)
        this.basic_op = basic_op;
        this.video_op = video_op;
        this.comment_op = comment_op;
        this.judge_official_lottery_op = judge_official_lottery_op;
        this.copy_reply_op = copy_reply_op;
        this.prevent_filter_op = prevent_filter_op;

        //endregion
    }

    opus_op = {
        fast_repost: async () => {
            //直接转发
            try {
                //直接点转发
                await sleep(1e3);
                await this.basic_op.dynamic_repost();
                //最后点赞
                await this.basic_op.dynamic_thumb();
            } catch (e) {
                console.log(`转发失败！${this.global_var.response.global_dynamic_data}\n${e.stack}`);
                this.global_var.FLAG.风控标志 = true; //可能触发风控，停一个小时
                await this.log_record.my_throw(`${BiliElementMap.log_record.opus_dynamic.dynamic_fast_repost_fail}`, e);
                throw Error(`${BiliElementMap.log_record.opus_dynamic.dynamic_fast_repost_fail}\n${e.stack}`)
            }
        },
        /**
         * 同时转发评论
         * @param {string} comment_msg
         * @returns
         */
        comment_repost_dynamic: async (
            comment_msg = "",
        ) => {
            //转评带上回复内容
            try {
                await this.basic_op.comment_submit(
                    comment_msg
                );
                await sleep(3e3);
                await this.basic_op.dynamic_repost(
                    comment_msg
                );
                await sleep(3e3);
                await this.basic_op.dynamic_thumb();
            } catch (e) {
                console.error(
                    `${this.log_name}${this.page_url}转发失败，comment_repost_dynamic_with_content\t${e.stack}`
                );
                await this.log_record.my_throw(
                    BiliElementMap.log_record.opus_dynamic.comment_repost_dynamic_with_content_fail, e
                );
                throw Error(`${BiliElementMap.log_record.opus_dynamic.comment_repost_dynamic_with_content_fail}\n${e.stack}`)
            }
        },
        /**
         * 只评论，不转发
         * @param {string} comment_msg
         * @returns
         */
        only_comment: async (comment_msg) => {
            //只评论
            let page_url = this.page_url
            try {
                if (comment_msg != null) {
                    await this.basic_op.comment_submit(
                        comment_msg,
                    );
                } else {
                    console.error(
                        `${this.log_name}${page_url}\t${BiliElementMap.log_record.opus_dynamic.comment_msg_empty}\t${this.now}`
                    );
                    await this.log_record.my_throw(BiliElementMap.log_record.opus_dynamic.comment_msg_empty)
                    throw Error(BiliElementMap.log_record.opus_dynamic.comment_msg_empty)
                }
                await sleep(1e3);
                await this.basic_op.dynamic_thumb();
            } catch (e) {
                console.error(
                    `${this.log_name}${page_url}评论获取失败\n${JSON.stringify(
                        this.global_var.response.global_dynamic_data
                    )}\t${this.now}`,
                    e
                );
                await this.log_record.my_throw(
                    BiliElementMap.log_record.opus_dynamic.dynamic_only_comment_fail
                );
                throw Error(`${BiliElementMap.log_record.opus_dynamic.dynamic_only_comment_fail}\n${e.stack}`)
            }
        },
        /**
         * 关注up
         * @param {TYPE_dynamic_info} dynamic_info
         * @return {Promise<boolean>}true 关注成功，继续执行 false 关注失败，提前退出执行
         */
        follow_up: async (dynamic_info) => {
            try {
                let global_var = this.global_var;
                const handle_relation_change_response = async (pg = undefined) => {
                    if (global_var.response.relation_modify_response.code !== 0) {
                        console.error(
                            this.log_format(`点击关注失败\n${dynamic_info.dynamicUrl}\n${JSON.stringify(
                                global_var.response
                                    .relation_modify_response
                            )}`)
                        );
                        if (global_var.response.relation_modify_response.code !== 22002) {
                            await this.log_record.my_throw(BiliElementMap.log_record.opus_dynamic.follow_up_fail);
                            if (
                                pg && !pg.isClosed()
                            ) {
                                await pg.close();
                            }
                            console.error(
                                this.log_format(`点击关注失败\n${dynamic_info.dynamicUrl}\n${JSON.stringify(
                                    global_var.response
                                        .relation_modify_response
                                )}休眠1小时！`));
                            await sleep(3600e3);
                        } else {
                            //{"code":22002,"message":"因对方隐私设置，你还不能关注","ttl":1}
                            await this.log_record.my_throw(
                                BiliElementMap.log_record.opus_dynamic.follow_up_fail_banned_by_up);
                        }
                        return false;
                    } else {
                        console.log(
                            this.log_format(`关注成功！\thttps://space.bilibili.com/${dynamic_info.up_uid}`)
                        );
                    }
                    return true
                }

                for (let i = 0; i <= 5; i++) {
                    let up_mid = global_var.response.global_dynamic_data.item.modules.module_author.mid
                    console.log(this.log_format(`未关注\thttps://space.bilibili.com/${up_mid}\t${this.page_url}`)
                    );
                    if (this.page_url.includes(BiliElementMap.url_path.opus_dynamic.opus_link)) {// opus 动态需要创建新的页面
                        let follow_pg = await global_var.current_page
                            .browser()
                            .newPage();
                        follow_pg.usage = BiliElementMap.browser_usage.follow_up

                        try {
                            await follow_pg.goto(
                                `https://space.bilibili.com/${up_mid}`
                            );
                            await utils.Common.check_page_is_front(
                                follow_pg
                            );
                            await Promise.all([
                                follow_pg
                                    .waitForSelector(
                                        ".h-f-btn.h-follow"
                                    )
                                    .then((el) => el.click())
                                    .catch(() => {
                                        {
                                            status: "fail";
                                        }
                                    }),
                                (global_var.response.relation_modify_response =
                                    await follow_pg
                                        .waitForResponse(
                                            (resp) =>
                                                resp
                                                    .url()
                                                    .includes(
                                                        BiliElementMap.url_path.user.relation_modify
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
                                            status: "fail";
                                        })),
                            ])
                            if (global_var.response.relation_modify_response) {
                                if (!await handle_relation_change_response(follow_pg)) {
                                    return false
                                }
                            }
                            await sleep(5e3);
                            break;
                        } catch (e) {
                            if (i >= 5) {
                                await this.log_record.my_throw(
                                    BiliElementMap.log_record.opus_dynamic.follow_up_fail
                                );
                                return false
                            }
                            if ((await follow_pg.$$(`.h-f-icon`)).length > 0) {
                                console.log(this.log_format(`关注成功！\thttps://space.bilibili.com/${up_mid}`));
                                break;
                            }
                            console.error(this.log_format(`第${i}次点击关注失败\n${dynamic_info.dynamicUrl}\n${JSON.stringify(
                                    global_var.response.relation_modify_response
                                )}\n${e.stack}`)
                            );
                            await sleep(3e3);
                            continue;
                        } finally {
                            if (global_var.current_page.isClosed()) {
                                await this.account_page_init()
                            }
                            if (!follow_pg.isClosed()) {
                                await follow_pg.close()
                            }
                        }
                    } else {
                        try {
                            await pptr_op.check_page_is_front(
                                global_var.current_page
                            );
                            await global_var.current_page.hover(
                                "div.bili-dyn-item__main > div.bili-dyn-item__avatar > div > div"
                            );
                            await sleep(5e3);
                            await global_var.current_page.click(
                                "div.bili-user-profile-view__info__button.follow"
                            );
                            await sleep(3e3);
                            let follow_checked_btn;
                            try {
                                follow_checked_btn =
                                    await global_var.current_page.$(
                                        ".bili-user-profile-view__info__button.follow.checked",
                                        {TIMEOUT: 10e3}
                                    );
                            } catch (e) {
                                console.error(
                                    this.log_format(`点击关注失败 https://space.bilibili.com/${up_mid}\n${e.static}`)
                                );
                                await this.log_record.my_throw(
                                    BiliElementMap.log_record.opus_dynamic.follow_up_fail);
                                return false
                            }
                            if (global_var.response.relation_modify_response) {
                                if (!await handle_relation_change_response()) return false
                            }
                            if (follow_checked_btn) {
                                console.log(
                                    `${global_var.user_info.uname}\t关注成功！\thttps://space.bilibili.com/${global_var.response.global_dynamic_data.item.modules.module_author.mid}`
                                );
                                break;
                            }
                        } catch (e) {
                            if (i >= 5) {
                                await this.log_record.my_throw(
                                    `${global_var.user_info.uname}\t关注失败`, e
                                );
                            }
                            console.warn(
                                this.log_format(`关注失败\n${e.stack}`)
                            );
                            await sleep(3e3);
                            continue;
                        }
                    }
                    break;
                }
            } catch (e) {
                throw Error(`${BiliElementMap.log_record.opus_dynamic.follow_up_fail}\n${e.stack}`)
            }
        },
        /**
         * 已经在抽奖动态页面
         * @param {TYPE_dynamic_info} dynamic_info
         * @param statistic_data
         * @return {Promise<boolean>} 转发了返回true，没转发返回false
         */
        do_dynamic_lottery: async (dynamic_info, statistic_data) => {
            let global_var = this.global_var;
            let lottery_setting = this.lottery_setting
            let record_data = new manual_op_fail_model(
                dynamic_info
            )
            try {
                console.log(
                    this.log_format(`开始抽奖，动态id:【${dynamic_info.dynId}】`)
                );
                if (
                    !(await pptr_op.check_bili_login(global_var.current_page))
                ) {
                    let err_msg = `${lottery_setting.CONFIG.COOKIENAME}账号登录失效！`;
                    console.error(this.log_format(err_msg));
                    await pptr_op.my_send_notify.push_me(
                        err_msg,
                        this.log_format(`${JSON.stringify(global_var.user_info, undefined, "\t")}`)
                    );
                    throw Error(BiliElementMap.log_record.critical_error.account_logout);
                }
                //region 判断是否是404动态
                if (this.page_url.includes("www.bilibili.com/404") || await global_var.current_page.$(BiliElementMap.opus_dynamic.interact.dynamic_error_pic)) {
                    await global_var.current_page.goto(`https://www.bilibili.com/opus/${dynamic_info.dynId}`);
                    if (global_var.response.global_dynamic_data === -412) {
                        let err_msg = `${BiliElementMap.opus_dynamic.response._404_dynamic}\t${dynamic_info.dynamicUrl}`
                        console.warn(this.log_format(err_msg));
                        await this.log_record.my_throw(BiliElementMap.opus_dynamic.response._404_dynamic);
                        record_data.err_msg = BiliElementMap.opus_dynamic.response._404_dynamic;
                        await this.log_record.dynamic_lottery_record(record_data)
                        statistic_data.lottery_succ_record.push(record_data)
                        return false;
                    }
                }
                //endregion


                if (this.page_url.includes(`www.bilibili.com/opus`)) {
                    try {
                        global_var.response.global_dynamic_data =
                            await utils.Common.Get_Opus_Dynamic_Data(global_var.current_page);
                    } catch (e) {
                        console.error(
                            this.log_format(`${BiliElementMap.log_record.opus_dynamic.get_dynamic_info_fail}\n${e.stack}`)
                        );
                        await this.log_record.my_throw(BiliElementMap.log_record.opus_dynamic.get_dynamic_info_fail);
                        global_var.response.global_dynamic_data = dynamic_info.dynContent;
                    }
                }
                let bt = 0;
                while (1) {
                    if (global_var.response.global_dynamic_data) {
                        break;
                    }
                    await sleep(1e3);
                    console.error(this.log_format(`未获取到动态信息\t${this.page_url}`)
                    );
                    if (this.page_url.includes(`www.bilibili.com/opus`)) {
                        try {
                            global_var.response.global_dynamic_data =
                                await utils.Common.Get_Opus_Dynamic_Data(global_var.current_page);
                        } catch (e) {
                            console.error(this.log_format(`未获取到动态信息\t${this.page_url}\n${e.stack}`))
                        }
                    }
                    bt += 1;
                    if (bt >= 3) {
                        await this.log_record.my_throw(BiliElementMap.log_record.opus_dynamic.get_dynamic_info_fail);
                        record_data.err_msg = BiliElementMap.log_record.opus_dynamic.get_dynamic_info_fail;
                        await this.log_record.dynamic_lottery_record(record_data)
                        statistic_data.lottery_fail_record.push(record_data)
                        return false;
                    }
                    await global_var.current_page.reload();
                    await sleep(5e3);
                }
                await sleep(
                    0.5 *
                    utils.Common.random_choice(
                        lottery_setting.lottery_module.Working_clearance_time
                    )
                );
                let comment_forbidden_mark = false; //禁止评论标志
                if (global_var.response.reply_main) {
                    if (global_var.response.reply_main?.code === 12061) {
                        console.error(this.log_format(`${this.page_url}\tUP主已关闭评论区！只进行转发和点赞操作！`));
                        comment_forbidden_mark = true;
                    }
                }
                let thumb_status;
                try {
                    thumb_status =
                        (await global_var.current_page.$(BiliElementMap.opus_dynamic.interact.sidebar_like_btn_is_active)) ||
                        (await global_var.current_page.$(BiliElementMap.opus_dynamic.interact.old_like_btn_is_active));
                } catch (e) {
                    console.error(this.log_format(`获取点赞状态失败\t${this.page_url}\n${e.stack}`)
                    );
                }
                if (thumb_status) {
                    //先进行点赞判断
                    console.log(this.log_format(`${BiliElementMap.log_record.succ_info.thumbed_dynamic}\t${this.page_url}`));
                    await sleep(utils.Common.random_choice(lottery_setting.lottery_module.Working_clearance_time));
                    await this.log_record.my_throw(BiliElementMap.log_record.succ_info.thumbed_dynamic);
                    record_data.err_msg = BiliElementMap.log_record.succ_info.thumbed_dynamic;
                    await this.log_record.dynamic_lottery_record(record_data)
                    statistic_data.lottery_succ_record.push(record_data)
                    return false;
                }

                let is_past =
                    this.judge_official_lottery_op.judge_official_lottery();
                if (is_past === true) {
                    await sleep(
                        utils.Common.random_choice(
                            lottery_setting.lottery_module.Working_clearance_time
                        )
                    );
                    console.error(`${BiliElementMap.log_record.succ_info.past_official_lot}\t${this.page_url}`)
                    await this.log_record.my_throw(BiliElementMap.log_record.succ_info.past_official_lot);
                    record_data.err_msg = BiliElementMap.log_record.succ_info.past_official_lot;
                    await this.log_record.dynamic_lottery_record(record_data)
                    statistic_data.lottery_succ_record.push(record_data)
                    return false;
                } else if (is_past === false) {
                    //未过期的官方抽奖
                    if (
                        !dynamic_info.dynamicUrl.includes("tab=1") &&
                        !dynamic_info.dynamicUrl.includes("tab=2")
                    ) {
                        dynamic_info.dynamicUrl += "?tab=1";
                    }
                }

                let dynamic_comment_count =
                    global_var.response.global_dynamic_data.item.modules
                        .module_stat.comment.count;
                let dynamic_repost_count =
                    global_var.response.global_dynamic_data.item.modules
                        .module_stat.forward.count;
                if (!(dynamic_comment_count > 30 || dynamic_repost_count > 30) && !dynamic_info.dynamicUrl.includes("tab=1")) {
                    let author_official_verify =
                        global_var.response.global_dynamic_data.item
                            .modules?.module_author?.official_verify
                            ?.type;
                    if (author_official_verify !== 1) {
                        //非官方的动态少于30个评论不参加
                        await this.log_record.my_throw(
                            BiliElementMap.log_record.opus_dynamic.not_enough_comment_count
                        );
                        record_data.err_msg = BiliElementMap.log_record.opus_dynamic.not_enough_comment_count
                        await this.log_record.dynamic_lottery_record(record_data)
                        statistic_data.lottery_manual_record.push(record_data)
                        return false;
                    } else {
                        if (dynamic_comment_count <= 10) {
                            //官方的动态少于10个评论不参加
                            //如果官方的评论人数过少了，就不转发
                            await this.log_record.my_throw(
                                BiliElementMap.log_record.opus_dynamic.not_enough_comment_count
                            );
                            record_data.err_msg = BiliElementMap.log_record.opus_dynamic.not_enough_comment_count
                            await this.log_record.dynamic_lottery_record(record_data)
                            statistic_data.lottery_manual_record.push(record_data)
                            return false;
                        }
                    }
                }
                let dynamic_content;
                try {
                    dynamic_content =
                        await this.comment_op.get_dynamic_content_and_top_msg(
                            global_var.response.global_dynamic_data
                        );
                    dynamic_content = dynamic_content.replaceAll(
                        /(\[(?<=\[)(.*?)(?=\])])/gim,
                        ""
                    ); //移除表情包
                    if (dynamic_content) {
                        dynamic_info.dynContent = dynamic_content
                    }
                } catch {
                }
                let comment_msg;
                if (dynamic_content === '' || dynamic_content === undefined) {
                    console.error(
                        `${BiliElementMap.log_record.opus_dynamic.get_dynamic_content_fail}\n${global_var.response.global_dynamic_data}\n${this.page_url}`
                    );
                    await this.log_record.my_throw(
                        BiliElementMap.log_record.opus_dynamic.get_dynamic_content_fail
                    );
                    record_data.err_msg = BiliElementMap.log_record.opus_dynamic.get_dynamic_content_fail
                    await this.log_record.dynamic_lottery_record(record_data)
                    statistic_data.lottery_fail_record.push(record_data)
                    return false;
                }
                if (!dynamic_info.dynamicUrl.includes("tab=1"))//如果是只转发的动态则不生成评论内容
                {

                    comment_msg = await this.comment_op.reply_comment_generator(
                        dynamic_content,
                        dynamic_info.dynId,
                        record_data
                    );
                }
                if (
                    comment_msg === undefined ||
                    !comment_msg.includes(BiliElementMap.log_record.succ_info.manual_reply)
                ) {

                    //如果包含undefined或者不需要人工回复就开始抽奖
                    if ((!comment_msg || typeof comment_msg != "string") && !(dynamic_info.dynamicUrl.includes("tab=1"))) {
                        console.error(this.log_format(`${BiliElementMap.log_record.opus_dynamic.comment_msg_empty}\n${this.page_url}`))
                        await this.log_record.my_throw(BiliElementMap.log_record.opus_dynamic.comment_msg_empty);
                        record_data.err_msg = BiliElementMap.log_record.opus_dynamic.comment_msg_empty
                        await this.log_record.dynamic_lottery_record(record_data)
                        statistic_data.lottery_fail_record.push(record_data)
                        return false;
                    }
                    if (
                        global_var.response.global_dynamic_data.item
                            .modules.module_author.following == null
                    ) {
                        if (!await this.opus_op.follow_up(dynamic_info)) {
                            await this.log_record.my_throw(BiliElementMap.log_record.opus_dynamic.follow_up_fail);
                            record_data.err_msg = BiliElementMap.log_record.opus_dynamic.follow_up_fail
                            await this.log_record.dynamic_lottery_record(record_data)
                            statistic_data.lottery_fail_record.push(record_data)
                            return false
                        }
                    }
                    if (
                        (await pptr_op.check_page_is_front(
                            global_var.current_page
                        )) === undefined
                    ) {
                        await this.account_page_init(false);
                        await global_var.current_page.goto(dynamic_info.dynamicUrl);
                    }
                    await global_var.current_page.evaluate(() => {
                        this.scrollTo(0, 1500);
                    });
                    await sleep(1e3);
                    await global_var.current_page.evaluate(() => {
                        this.scrollTo(0, 1500);
                    });
                    await sleep(1e3);
                    await global_var.current_page.evaluate(() => {
                        this.scrollTo(0, -1500);
                    });
                    await sleep(1e3);

                    // console.log(global_var.response.global_dynamic_data)
                    if (
                        dynamic_info.dynamicUrl.includes("tab=1") //|| comment_forbidden_mark
                    ) {
                        //只转发
                        if (lottery_setting.CONFIG.Official_Lottery_Switch) {
                            await this.opus_op.fast_repost();

                            await sleep(
                                utils.Common.random_choice(
                                    lottery_setting.lottery_module.Working_clearance_time
                                )
                            );
                            record_data.err_msg = BiliElementMap.log_record.succ_info.repost_dynamic
                            await this.log_record.dynamic_lottery_record(record_data)
                            statistic_data.lottery_succ_record.push(record_data)
                            return true;
                        } else {
                            await this.log_record.my_throw(BiliElementMap.log_record.succ_info.past_official_lot);
                            record_data.err_msg = BiliElementMap.log_record.succ_info.repost_dynamic
                            await this.log_record.dynamic_lottery_record(record_data)
                            statistic_data.lottery_succ_record.push(record_data)
                            return false;
                        }
                    }
                    console.log(
                        this.log_format(
                            `${dynamic_info.dynamicUrl}\n动态内容：\n${dynamic_content}\n===============\n回复内容：${comment_msg}\n#############################`
                        )
                    );
                    if (dynamic_info.dynamicUrl.indexOf("tab=2") > -1) {
                        //评论加转发
                        if (
                            Math.random() * 0.6 <
                            lottery_setting.lottery_module.repost_chance ||
                            comment_msg?.includes("#") ||
                            global_var.response.reply_main.code === 12061 ||
                            this.comment_op.repost_with_comment_judge(
                                dynamic_content
                            )
                        ) {
                            await this.opus_op.comment_repost_dynamic(comment_msg);
                        } else {
                            await this.opus_op.comment_repost_dynamic();
                        }
                    } else if (dynamic_info.dynamicUrl.indexOf("tab=2") === -1 && dynamic_info.dynamicUrl.indexOf("tab=1") === -1) {
                        //只评论不转发
                        await this.opus_op.only_comment(comment_msg);
                        await sleep(
                            utils.Common.random_choice(
                                lottery_setting.lottery_module.Working_clearance_time
                            )
                        );
                        record_data.err_msg = BiliElementMap.log_record.succ_info.comment_dynamic
                        await this.log_record.dynamic_lottery_record(record_data)
                        statistic_data.lottery_succ_record.push(record_data)
                        return false
                    } else if (
                        !(
                            dynamic_info.dynamicUrl.indexOf("tab=2") > -1 ||
                            dynamic_info.dynamicUrl.indexOf("tab=1") > -1
                        )
                    ) {
                        await this.log_record.my_throw(BiliElementMap.log_record.opus_dynamic.unknown_url_tab);
                        record_data.err_msg = BiliElementMap.log_record.opus_dynamic.unknown_url_tab
                        await this.log_record.dynamic_lottery_record(record_data)
                        statistic_data.lottery_fail_record.push(record_data)
                        return false;
                    }
                }

                record_data.err_msg = comment_msg
                // 到这里就算是执行成功了！！！
                await this.log_record.dynamic_lottery_record(record_data);
                statistic_data.lottery_succ_record.push(record_data)
                await sleep(
                    utils.Common.random_choice(
                        lottery_setting.lottery_module.Working_clearance_time
                    )
                );
                return true;
            } catch (e) {
                console.error(
                    this.log_format(
                        `do_lottery函数执行失败\t${dynamic_info.dynamicUrl}\n${e.stack}`
                    )
                );
                if (e.toString().includes(`Requesting main frame too early`) ||
                    (await pptr_op.check_page_is_front(global_var.current_page)) === undefined) {
                    await global_var.current_page.close()
                    await global_var.current_page.browser().close();
                    await sleep(10e3);
                    await this.account_page_init(false);
                    return await this.opus_op.do_dynamic_lottery(dynamic_info); //如果只是页面或浏览器被关了，就继续执行抽奖
                }

                if ((await pptr_op.check_bili_login(global_var.current_page)) === false) {
                    await this.log_record.my_throw(BiliElementMap.log_record.critical_error.account_logout)
                    record_data.err_msg = BiliElementMap.log_record.critical_error.account_logout
                    await this.log_record.dynamic_lottery_record(record_data);
                    return false
                }
                await sleep(10e3);
                await this.log_record.my_throw(
                    `${BiliElementMap.log_record.opus_dynamic.unknown_do_dynamic_lottery_error}${e.stack}`
                );
                record_data.err_msg = e.toString().replaceAll("Error: ", "")
                await this.log_record.dynamic_lottery_record(record_data);
                statistic_data.lottery_fail_record.push(record_data)
                return false;
            }
        }
    }


    filter_log_op = {
        /**
         *
         * @param {TYPE_reserve_data[]}loop_list
         * @return {Promise<TYPE_reserve_data[]>}
         */
        reserve_lottery: async (loop_list) => {
            /**
             *
             * @type {TYPE_reserve_data[]}
             */
            let new_loop_list = Object.assign([], loop_list);
            new_loop_list.sort((a, b) => a.reserve_sid - b.reserve_sid); //升序
            let joined_infos = await AccountLogService.get_account_reserve_sid_info_by_sid_range(
                {
                    sid_start: new_loop_list[0].reserve_sid.toString(),
                    sid_end: new_loop_list.pop().reserve_sid.toString()
                }, this.account_id
            )
            let joined_sids = joined_infos.map(el => el.reserveinfo_sid);
            loop_list = new_loop_list.filter(el => !joined_sids.includes(el.reserveinfo_sid))
            return loop_list
        },
        /**
         * 初步删选，根据自带的动态内容和抽奖设置，选出不参加的动态？
         * @param {TYPE_dynamic_info[]} all_dynamic_info_list
         * @return {Promise<TYPE_dynamic_info[]>}
         */
        dynamic_lottery: async (all_dynamic_info_list) => {
            let new_loop_list = Object.assign([], all_dynamic_info_list);
            new_loop_list.sort((a, b) => a.dynId - b.dynId); //升序
            let joined_infos = await AccountLogService.get_joined_account_info_lottery_log_by_lottery_offset(
                this.account_id,
                new_loop_list[0].dynId
            )
            let joined_ids = joined_infos.map(el => el.dynamic_id);
            all_dynamic_info_list = all_dynamic_info_list.filter(el => !joined_ids.includes(el.dynId))
            return all_dynamic_info_list
        }
    }


    lottery_op = {
        /**
         * {
         *   "reserve_url": "https://space.bilibili.com/35847683/dynamic",
         *   "etime": 1718967900,
         *   "lottery_prize_info": "预约有奖：300元购物基金*1份",
         *   "jump_url": "https://www.bilibili.com/h5/lottery/result?business_id=3846504&business_type=10",
         *   "reserve_sid": 3846504,
         *   "available": true
         * }
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
         * {"dynId": "944940891626274816","dynamicUrl": "https://t.bilibili.com/944940891626274816?tab=2","authorName": "太平洋科技网",
         * "up_uid": 26987075,"pubTime": "2024-06-20T10:13:16","dynContent": "一键升降，快人一步！Videofast一键升降三脚架，科仔爱了！【关注】@太平洋科技网 + @Ulanzi优篮子 ，【转评赞】此动态，7月10日随机抽1位小可爱送【优篮子VL49口袋补光灯】；#供电局福利##转发抽奖# #互动抽奖#",
         * "commentCount": 10,"repostCount": 10,"highlightWords": "","officialLotType": "","officialLotId": "","isOfficialAccount": 1,"isManualReply": "人工判断",
         * "isFollowed": 1,"isLot": 1,"hashTag": ""
         * }
         * @typedef {Object} TYPE_dynamic_info
         * @property {string} dynId 动态id
         * @property {string} dynamicUrl - 动态链接，tab=2为需要评论加转发|tab=1为只需要转发|不带后缀为只需要评论
         * @property {string} authorName - 动态作者的昵称
         * @property {number} up_uid  - 动态作者的uid
         * @property {string} pubTime - 发布时间
         * @property {string} dynContent - 动态内容
         * @property {number} commentCount - 评论数
         * @property {number} repostCount - 转发数
         * @property {string} highlightWords - 重要的抽奖关键词
         * @property {"充电抽奖"|"官方抽奖"|""} officialLotType - 官方抽奖类型："充电抽奖"|"官方抽奖"|""
         * @property {string} officialLotId - 官方抽奖id 字符串型数字
         * @property {number} isOfficialAccount - 是否是官方账号
         * @property {string} isManualReply - 是否需要人工回复（具体根据项目中的判断函数重新判断)
         * @property {number} isFollowed - 是否关注（实际无作用）
         * @property {number} isLot - 是否是抽奖（实际无作用
         * @property {string} hashTag - 动态需要带的hashtag（实际需要根据项目
         */
        /**
         * {
         *         "dynId": "938039695183446034",
         *         "lottery_time": 1719756000,
         *         "sender_uid": "1959209",
         *         "lottery_id": 300540,
         *         "lottery_text": "宏碁 掠夺者擎 2023款笔记本 KTC H27T22C显示器 迈从k87/g98键盘"
         *       }
         * @typedef {Object} TYPE_official_lot_info
         * @property {string} dynId 动态id
         * @property {number} lottery_time 开奖时间 秒
         * @property {string} sender_uid
         * @property {number} lottery_id
         * @property {string} lottery_text
         */
        single: {
            reserve_lottery: async (reserve_info, new_reserve_data, join_success_list, joinfail_list) => {
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
                    throw Error(`前往预约页面 ${reserve_info.reserve_url} 失败\nreserve_lottery_loop\n${e.stack}`)
                }
                if (!this.global_var.response.space_reservation) {
                    throw Error(`未获取到预约响应！`)
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
                                    el.sid == reserve_info.reserve_sid
                            )
                        );
                        if (reserve_index === -1) {
                            console.error(
                                this.log_format(`未在空间 ${reserve_info.reserve_url} 找到sid为${reserve_info.reserve_sid}的直播预约`)
                            );
                            reserve_info.available = false;
                            throw Error(`未在空间 ${reserve_info.reserve_url} 找到sid为${reserve_info.reserve_sid}的直播预约`)
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
                                throw Error(`${this.page_url}预约参加失败，reserv_btn状态获取失败`);
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
                                    this.log_format(`参与预约抽奖：${reserve_info.reserve_url} 成功！`)
                                );
                                join_success_list.push(reserve_info);

                            } else {
                                joinfail_list.push(
                                    reserve_info.reserve_url
                                );
                                throw Error(this.log_format(`参与预约抽奖：${reserve_info.reserve_url} 失败！`))
                            }
                            /**
                             * //点击参与部分结束
                             */
                        } else {
                            console.log(
                                `${this.global_var.user_info.uname} 已经参与预约抽奖：${reserve_info.jump_url}`
                            );
                            join_success_list.push(reserve_info);
                        }
                    } else {
                        joinfail_list.push(reserve_info.reserve_url);
                        throw Error(`预约抽奖响应中未包含抽奖信息！\t${reserve_info.reserve_url}`)
                    }
                } else {
                    joinfail_list.push(reserve_info);
                    throw Error(`获取预约抽奖响应：${reserve_info.reserve_url} 失败！`)
                }
            },
            /**
             * 单轮抽奖
             * @param dynamic_info_args
             * @return {Promise<*|undefined>}
             */
            dynamic_lottery: async (dynamic_info_args) => {
                let lottery_setting = this.lottery_setting;
                let global_var = this.global_var;
                let dynamic_info = dynamic_info_args[0]
                let repost_counter = dynamic_info_args[1]
                let every_n_times_sleep_longtime = dynamic_info_args[2]
                let longsleepflag = dynamic_info_args[3]
                let i = dynamic_info_args[4]
                let statistic_data = dynamic_info_args[5]
                try {
                    if (global_var.current_page === undefined || global_var.current_page.isClosed()) {
                        //每次抽奖循环时检测页面是否关闭，如果关闭则重新打开浏览器页面！
                        await this.account_page_init(false, BiliElementMap.browser_usage.lottery); //重新设置global_var.page
                    }
                    global_var.current_dynamic_id = dynamic_info.dynId
                    global_var.fresh_global_response()
                    global_var.recorded_data = "";
                    await pptr_op.check_page_is_front(
                        global_var.current_page
                    );
                    //#region 前往页面
                    let break_time = 0;
                    while (break_time <= 3) {
                        break_time++;
                        try {
                            await global_var.current_page.goto(
                                dynamic_info.dynamicUrl
                            );
                            break;
                        } catch (e) {
                            console.error(
                                this.log_format(
                                    `前往页面 ${dynamic_info.dynamicUrl} 失败！\n${e.stack}` +
                                    break_time < 3 ? `\n重试第${break_time}次！` : `\n彻底失败！`
                                )
                            );
                            global_var.current_page && await global_var.current_page.close();
                            global_var.current_page && await global_var.current_page.browser().close();
                            await sleep(10e3);
                            await this.account_page_init(false);
                        }
                    }
                    await sleep(5e3);
                    //#endregion

                    let lottery_feedback = await this.opus_op.do_dynamic_lottery(dynamic_info, statistic_data);//抽奖执行

                    if (lottery_feedback && (dynamic_info.dynamicUrl.includes("tab=2") || dynamic_info.dynamicUrl.includes("tab=1"))) {
                        repost_counter++;
                    }
                    let record = global_var.recorded_data;
                    console.log(
                        this.log_format(`${JSON.stringify(dynamic_info)}\n转评反馈：\n${record}\n==============================\n`)
                    );
                    //遇到点过赞的动态不休眠
                    if (record.includes(BiliElementMap.log_record.succ_info.thumbed_dynamic)) {
                        console.log(
                            this.log_format(`${JSON.stringify(dynamic_info)}\n${BiliElementMap.log_record.succ_info.thumbed_dynamic}不休眠`)
                        );
                        await sleep(3e3);
                    } else {
                        let st =
                            utils.Common.random_choice(
                                lottery_setting.lottery_module.lottery_sep_time
                            ) *
                            (1 + Math.random() * 4);
                        if (
                            (i +
                                utils.Common.random_choice([
                                    1, 2, 3, 4, 5, 6, 7,
                                ])) %
                            every_n_times_sleep_longtime ===
                            0 &&
                            longsleepflag[0]
                        ) {
                            //每隔多少次休眠
                            st =
                                utils.Common.random_choice(
                                    utils.Common.generater_step_Array(
                                        60e3,
                                        3 * 60e3,
                                        1e3
                                    )
                                ) *
                                (1 + Math.random() * 4); //长间隔休眠时间，休息间隔拉长，模拟真人
                            longsleepflag[0] = false;
                            longsleepflag[1] = 0;
                        }
                        longsleepflag[1] += 1;
                        console.log(this.log_format(`${dynamic_info.dynamicUrl}\t休眠${(st / 1000).toFixed(2)}秒`));
                        await sleep(st); // 单个抽奖结束后等待时间
                    }
                } catch (e) {
                    // 执行失败
                    await this.log_record.my_throw(
                        `${BiliElementMap.log_record.critical_error.lottery_loop_single_fail}`, e
                    );
                    await sleep(10e3);
                    if (global_var.current_page.isClosed()) {
                        await this.account_init();
                        return await this.lottery_op.single.dynamic_lottery(dynamic_info_args)
                    }
                    throw Error(e)
                }


            }

        },
        /**
         * 每个循环执行前，都过滤一遍参加过的抽奖
         */
        loop: {

            /**
             * 预约抽奖循环程序，返回参加失败的列表
             * JsonData/预约抽奖.json 这个文件里面的内容是给人看的
             * 调用api接口存储的抽奖数据都通过后台过滤好，然后放进来，js就不需要再次过滤了
             * @param {TYPE_reserve_data[]} loop_list
             * @returns
             */
            reserve_lottery: async (loop_list) => {
                loop_list = await this.filter_log_op.reserve_lottery(loop_list);

                /**确认参加的列表*/
                /**@type {TYPE_reserve_data[]} 存放确定要去执行参与的数据 */
                let checked_loop_list = [];
                let joinfail_list = [];
                /**@type {Object[]} 存放JSONDATA里面的数据*/
                let new_reserve_data = [];
                /**@type {TYPE_reserve_data[]} 参加成功的列表*/
                let joinsuccess_list = [];
                for (let i of loop_list) {
                    checked_loop_list.push(i);
                }
                console.log(
                    this.log_format(`总共${loop_list.length}条预约抽奖 \n其中需要参加或访问${checked_loop_list.length}条`)
                );
                for (let reserve_info of loop_list) {
                    if (!checked_loop_list.includes(reserve_info)) {
                        console.log(
                            this.log_format(`${reserve_info.reserve_url}\t已经参加过了的预约抽奖，跳过！`)
                        );
                        continue;
                    }
                    for (let retryTimes = 0; retryTimes < 3; retryTimes++) {
                        try {
                            await this.lottery_op.single.reserve_lottery(reserve_info, new_reserve_data, joinsuccess_list, joinfail_list);
                        } catch (e) {
                            console.error(this.log_format(`单轮预约抽奖失败！\n${e.stack}`))
                            continue;
                        }
                        await AccountLogService.add_account_reserve_info(this.account_id, reserve_info.reserve_sid.toString())
                        break;
                    }
                }
                new_reserve_data.data = [...new Set(new_reserve_data.data)]; //对数组去重
                utils.BiliAPI.fileWrite(// 这个是给人看的数据
                    "JsonData/预约抽奖.json",
                    JSON.stringify(new_reserve_data, undefined, "\t")
                );
                let available_reserve_infos = loop_list.filter(
                    (el) =>
                        el.available !== false && el.etime > Date.now() / 1e3
                );
                if (available_reserve_infos.length > 0) {// 更新预约抽奖数据库记录
                    await AccountDao.upsert_reserve_lottery_infos(available_reserve_infos);
                }
                return {
                    joinfail_list: joinfail_list,
                    joinsuccess_list: joinsuccess_list,
                };
            },

            /**
             * 一般动态抽奖循环函数
             * @param {TYPE_dynamic_info[]} all_dynamic_info_list
             * @param {"必抽的大奖" | "一般转发抽奖" | "必抽的官方抽奖"} task_name 任务名称
             * @return {Promise<*>}
             */
            dynamic_lottery: async (all_dynamic_info_list, task_name = "一般转发抽奖") => {
                all_dynamic_info_list = await this.filter_log_op.dynamic_lottery(all_dynamic_info_list)
                //region 准备抽奖环境

                let lottery_setting = Object.assign({}, this.lottery_setting);
                let global_var = this.global_var;
                if (task_name === "必抽的大奖" || task_name === "必抽的官方抽奖") {
                    lottery_setting.CONFIG.CommonLottery_switch = true;
                    lottery_setting.CONFIG.Only_Comment_Lottery_Switch = false;
                    lottery_setting.CONFIG.Official_Lottery_Switch = true;
                }
                //对抽奖队列进行循环
                all_dynamic_info_list = utils.Common.part_shuffle(
                    Math.floor(0.2 * all_dynamic_info_list.length),
                    all_dynamic_info_list
                ); //打乱百分之十的抽奖链接
                if (lottery_setting.CONFIG.lottery_sep_time_type === 1) {
                    switch (all_dynamic_info_list.length) {
                        case all_dynamic_info_list.length <= 50:
                            lottery_setting.lottery_module.lottery_run_time = 3600e3;
                            break;
                        case 150 >= all_dynamic_info_list.length:
                            lottery_setting.lottery_module.lottery_run_time = 1.5 * 3600e3;
                            break;
                        case 200 > all_dynamic_info_list.length:
                            lottery_setting.lottery_module.lottery_run_time = 2 * 3600e3;
                            break;
                        case 300 > all_dynamic_info_list.length:
                            lottery_setting.lottery_module.lottery_run_time = 2.5 * 3600e3;
                            break;
                        default:
                            lottery_setting.lottery_module.lottery_run_time = 3 * 3600e3;
                            break;
                    }
                }
                if (
                    lottery_setting.CONFIG.lottery_sep_time_type === 2 ||
                    all_dynamic_info_list.length < 20
                ) {
                    lottery_setting.lottery_module.lottery_run_time =
                        lottery_setting.lottery_module.lottery_sep_time[0] *
                        all_dynamic_info_list.length;
                }
                lottery_setting.lottery_sep_time = utils.Common.generater_step_Array(
                    Math.floor((0.5 * lottery_setting.lottery_module.lottery_run_time + 1) /
                        (all_dynamic_info_list.length + 1)),
                    Math.floor(
                        (0.75 * lottery_setting.lottery_module.lottery_run_time + 1) /
                        (all_dynamic_info_list.length + 1),
                        10
                    ),
                    300
                );
                console.log(this.log_format(`运行时间约为${
                        lottery_setting.lottery_module.lottery_run_time / 1000 / 60
                    }分钟`)
                );
                //endregion
                //region 统计信息
                let statistic_data = {
                    lottery_succ_record: [],
                    lottery_fail_record: [],
                    lottery_manual_record: []
                }

                //endregion

                let every_n_times_sleep_longtime = 30; //每隔多少个动态休息时间延长
                let longsleepflag = [true, 0]; //0是标志是否需要长时间休息,1是休息之后经过的抽奖次数
                let repost_counter = 0;
                try {
                    for (let i = 0; i < all_dynamic_info_list.length; i++) {
                        if (
                            utils.Common.checkAuditTime(
                                global_var.TIME.None_Lottery_Time[0],
                                global_var.TIME.None_Lottery_Time[1]
                            )
                        ) {
                            console.log(
                                `${
                                    global_var.user_info.uname
                                }\t触发非抽奖时间段，需要进行休息：${
                                    global_var.TIME.None_Lottery_Time[0]
                                }-${
                                    global_var.TIME.None_Lottery_Time[1]
                                }暂停到${
                                    global_var.TIME.None_Lottery_Time[1]
                                }\t${new Date().toLocaleTimeString()}`
                            );
                            let sleep_hour =
                                parseInt(
                                    global_var.TIME.None_Lottery_Time[1].slice(
                                        0,
                                        2
                                    )
                                ) -
                                (new Date().getHours() + 1);
                            await sleep(sleep_hour * 3600e3);
                        }
                        let opus_dynamic = global_var.FLAG.opus动态标志;
                        let dynamic_info = all_dynamic_info_list[i]
                        global_var.dynamic_id = dynamic_info.dynId;
                        let is_lot_error = false;
                        let loop_lot_retry_time = 0
                        do {
                            is_lot_error = false;
                            if (lottery_setting.prevent_module.share_video_while_repost_chance !== 0 && repost_counter > lottery_setting.prevent_module.share_video_while_repost_sepnum * 33) {
                                if (
                                    Math.random() <
                                    lottery_setting.prevent_module
                                        .share_video_while_repost_chance
                                ) {
                                    console.log(
                                        this.log_format(`触发间隔分享视频`)
                                    );
                                    await this.prevent_filter_op.prevent_filter_module.share_video(
                                        lottery_setting.prevent_module.share_video_num_while_repost,
                                        1,
                                        1
                                    );
                                    repost_counter = 0;
                                }
                            }
                            let init_time_hour =
                                global_var.TIME.Init_Time.getHours();
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
                                    if (!global_var.FLAG.吃饭休息标志) {
                                        console.log(
                                            this.log_format(`模拟吃饭休息时间休息20分钟`)
                                        );
                                        await sleep(20 * 60 * 1e3);
                                        global_var.FLAG.吃饭休息标志 = true;
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
                            if (global_var.FLAG.风控标志 === true) {
                                console.log(
                                    this.log_format(`出了点问题，停个15分钟再抽`)
                                );
                                await sleep(15 * 60e3);
                                global_var.FLAG.风控标志 = false;
                            }
                            if (global_var.FLAG.抽奖暂停标志) {
                                while (1) {
                                    if (!global_var.FLAG.抽奖暂停标志) {
                                        break;
                                    }
                                    await sleep(1e3);
                                }
                            }
                            if (
                                lottery_setting.CONFIG
                                    .Only_Comment_Lottery_Switch
                            ) {
                                if (
                                    dynamic_info.dynamicUrl.includes(
                                        "tab=1"
                                    ) ||
                                    dynamic_info.dynamicUrl.includes("tab=2")
                                ) {
                                    console.log(
                                        this.log_format(`只参与评论动态`)
                                    );
                                    continue;
                                }
                            }

                            //region 执行单轮抽奖部分
                            try {
                                console.log(this.log_format(`当前任务【${task_name}】进度：  【${
                                        i + 1
                                    }/${all_dynamic_info_list.length}】\t${
                                        all_dynamic_info_list[i].dynamicUrl
                                    }`)
                                );
                                await this.lottery_op.single.dynamic_lottery(
                                    [dynamic_info, repost_counter, every_n_times_sleep_longtime, longsleepflag, i, statistic_data]
                                );
                                break;
                            } catch (e) {
                                is_lot_error = true;
                                if (loop_lot_retry_time > 3) {
                                    let record = await this.log_record.my_throw(`${BiliElementMap.log_record.critical_error.dynamic_lottery_fail}\n${e.stack}`);
                                    statistic_data.lottery_fail_record.push(new manual_op_fail_model(dynamic_info, record));
                                }
                                console.error(
                                    this.log_format(
                                        `单个lottery_loop执行失败，进行下一次尝试！\n${e.stack}`
                                    )
                                );
                                if (global_var.current_page.isClosed()) {
                                    //浏览器页面关闭则重新开启
                                    await this.account_page_init(false, BiliElementMap.browser_usage.lottery);
                                    await sleep(10e3);
                                }
                                if (!await pptr_op.check_bili_login(global_var.current_page)) {
                                    console.error(this.log_format(BiliElementMap.log_record.critical_error.account_logout))
                                    await this.log_record.my_throw(BiliElementMap.log_record.critical_error.account_logout)
                                    throw Error(BiliElementMap.log_record.critical_error.account_logout)
                                }
                            } finally {
                                loop_lot_retry_time++
                            }
                            //endregion
                        } while (loop_lot_retry_time <= 3 && is_lot_error)
                    }
                } catch (e) {
                    console.error(this.log_format(`lottery_loop执行失败，退出循环！\n${e.stack}`));
                } finally {
                    global_var.fresh_global_response()
                    global_var.recorded_data = "";
                }

                let manual_statistic_data_md = `动态链接 | 动态内容 | up昵称 | 人工回复原因\n--- | --- | --- | ---\n`
                let fail_statistic_data_md = `动态链接 | 动态内容 | up昵称 | 出错原因\n--- | --- | --- | ---\n`
                let manual_set = new Set()
                let fail_set = new Set()

                statistic_data.lottery_manual_record.map(el => {
                    manual_statistic_data_md.concat(`${el.dynamic_info.dynamicUrl} | ${el.dynamic_info.dynContent} | ${el.dynamic_info.authorName} | ${el.err_msg.replaceAll('\n', '\t')}`)
                    manual_set.add(el.dynamic_info.dynId)
                })
                statistic_data.lottery_fail_record.map(el => {
                    fail_statistic_data_md.concat(`${el.dynamic_info.dynamicUrl} | ${el.dynamic_info.dynContent} | ${el.dynamic_info.authorName} | ${el.err_msg.replaceAll('\n', '\t')}`)
                    fail_set.add(el.dynamic_info.dynId)
                })
                console.log(
                    this.log_format(`任务【${task_name}】完成，本轮总动态：${all_dynamic_info_list.length}\n人工回复动态：${manual_set.size}条\n\n${manual_statistic_data_md}\n错误动态：${fail_set.size}条\n\n${fail_statistic_data_md}`)
                );

            },

            /**
             *{"dynId": "string",
             *         "lottery_time": 0,
             *         "sender_uid": "string",
             *         "lottery_id": 0,
             *         "lottery_text": "string"}
             * @param {TYPE_official_lot_info[]}all_official_lottery_info
             * @return {Promise<void>}
             */
            official_lottery: async (all_official_lottery_info) => {
                /**
                 *
                 * @type {TYPE_dynamic_info[]}
                 */
                let all_dynamic_info = all_official_lottery_info.map(el => {
                    return {
                        up_uid: parseInt(el.sender_uid),
                        repostCount: 999,
                        pubTime: utils.Common.timestampToTime2(el.lottery_time),
                        officialLotType: "官方抽奖",
                        officialLotId: JSON.stringify(el.lottery_id),
                        isOfficialAccount: -1,
                        isManualReply: "",
                        isLot: 1,
                        isFollowed: 0,
                        highlightWords: "",
                        hashTag: "",
                        dynamicUrl: `https://t.bilibili.com/${el.dynId}?tab=1`,
                        dynId: el.dynId,
                        dynContent: el.lottery_text,
                        commentCount: 999,
                        authorName: "官方抽奖"
                    }
                })
                return await this.lottery_op.loop.dynamic_lottery(all_dynamic_info, "必抽的官方抽奖");
            }
        }
    }

    /**
     * 抽奖页面执行抽奖
     * @param common_lottery
     * @param must_join_common_lottery
     * @param official_lottery
     * @param reserve_lottery
     * @return {Promise<void>}
     */
    async main({
                   common_lottery,
                   must_join_common_lottery,
                   official_lottery,
                   reserve_lottery
               }) {
        this.start_time = utils.Common.dateNow();
        this.global_var.FLAG.抽奖中标志 = true;

        class MyTask {
            a;

            constructor(func, args) {
                this.func = func;
                this.args = args;
            }

            async run() {
               if ( await this.t.account_page_init(true) ===false){
                       throw Error(`账号未登录`)
                   }
                await this.func(...this.args);
            }
        }


        let tasks = [
            new MyTask(this.lottery_op.loop.dynamic_lottery, [common_lottery, "一般转发抽奖"]),
            new MyTask(this.lottery_op.loop.dynamic_lottery, [must_join_common_lottery, "必抽的大奖"]),
            new MyTask(this.lottery_op.loop.reserve_lottery, [reserve_lottery]),
            new MyTask(this.lottery_op.loop.official_lottery, [official_lottery]),
        ]
        tasks = utils.Common.part_shuffle(tasks.length, tasks)
        for (let task of tasks) {
            console.log(this.log_format(`当前运行任务；${task.func.name}`))
            await task.run.call({
                t: this,
                func: task.func,
                args: task.args
            }).catch(async e => {
                console.error(e)
                await pptr_op.my_send_notify.push_me(`${this.user_id} ${this.account_id}抽奖任务执行失败`, `${e.stack}`)
            });
        }
        await this.task_end();
    }
}

module.exports = {
    BiliDynamicPage
}