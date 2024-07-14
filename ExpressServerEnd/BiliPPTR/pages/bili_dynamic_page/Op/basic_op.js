const {pptr_op, utils, sleep} = require("@/ExpressServerEnd/BiliPPTR/utils/utils");
const {BiliElementMap} = require("@/ExpressServerEnd/BiliPPTR/utils/element_map");
const BasePage = require("@/ExpressServerEnd/BiliPPTR/pages/base_page");
const {GLOBAL_CONFIG} = require("@/ExpressServerEnd/BiliPPTR/config/global_config");
const axios = require("axios");

class BasicOp extends BasePage {
    constructor(account_name, uname, account_id, user_id, global_var, lottery_setting) {
        super(...arguments);
    }

    /**
     * 基本操作。点赞，转发，评论操作
     */
    basic_op = {
        sleep: {
            single_op: async (st) => {
                st = st ?? utils.Common.random_choice(this.lottery_setting.lottery_module.lottery_sep_time);
                console.debug(this.log_format(`每个操作间隔休眠${(st / 1e3).toFixed(2)}秒`))
                await sleep(st)
            },
            single_round: async ({st, pg}) => {
                st = st ?? utils.Common.random_choice(this.lottery_setting.lottery_module.Working_clearance_time);
                console.log(this.log_format(`每个抽奖间隔休眠${(st / 1e3).toFixed(2)}秒`))
                if (st > 30e3) await pg.goto('about:blank');
                await sleep(st)
            }
        },
        /**
         * 前往动态页面
         * @param {TYPE_dynamic_info} dynamic_info
         * @return {Promise<boolean>}
         */
        dynamic_page_goto: async (dynamic_info) => {
            if (this.page_url.includes(dynamic_info.dynId)) return true;
            let break_time = 0;
            while (break_time <= 3) {
                break_time++;
                try {
                    await this.global_var.current_page.goto(
                        `https://www.bilibili.com/opus/${dynamic_info.dynId}`, {waitUntil: "networkidle2"}
                    );
                    return true;
                } catch (e) {
                    console.error(
                        this.log_format(
                            `前往页面 ${dynamic_info.dynamicUrl} 失败！\n${e.stack}` +
                            break_time < 3 ? `\n重试第${break_time}次！` : `\n彻底失败！`
                        )
                    );
                    this.global_var.current_page && await this.global_var.current_page.close();
                    this.global_var.current_page && await this.global_var.current_page.browser().close();
                    await sleep(10e3);
                    await this.account_page_init(false);
                }
            }
            throw Error(BiliElementMap.log_record.critical_error.goto_page_fail);
        },

        /**
         *
         * @param {string} modal_input_text
         * @param {string} modal_popup_btn_element 弹出框的元素名称，如果是普通的富文本框，输入和输入框的元素名称相同
         * @param {string} input_text_area_element
         * @param {string} error_name
         * @param {"modal"|"plain"} text_area_type 文本域类型 modal指弹出式的文本框，plain指普通的文本框
         * @return {Promise<void>}
         */
        check_text_area_input_same_text: async (modal_input_text, modal_popup_btn_element, input_text_area_element, error_name, text_area_type) => {
            let msg_box;
            for (let bt = 0; bt <= 5; bt++) {
                try {
                    await pptr_op.check_page_is_front(this.global_var.current_page);
                    await this.global_var.current_page
                        .waitForSelector(modal_popup_btn_element)
                        .then(async (el) => {
                            await el.click();
                        });
                    await sleep(3e3);
                    msg_box = await this.global_var.current_page.waitForSelector(input_text_area_element);
                    await msg_box.focus();
                    let msg_box_content;
                    if (text_area_type === 'modal') {
                        msg_box_content = await this.basic_op.get_opus_dynamic_repost_area_content(msg_box);
                    } else if (text_area_type === 'plain') {
                        msg_box_content = await this.global_var.current_page.$eval(input_text_area_element, (el) => el.value);
                    }
                    let _bt = 0;
                    //#region 输入转发内容
                    while (modal_input_text && !msg_box_content.includes(modal_input_text)) {//回复栏里的东西等于回复内容时break
                        msg_box = await this.global_var.current_page.waitForSelector(input_text_area_element);
                        await msg_box.focus();
                        await sleep(3e3);
                        await msg_box.type(modal_input_text, {
                            delay: 300,
                        });
                        await sleep(3e3);
                        if (text_area_type === 'modal') {
                            msg_box_content = await this.basic_op.get_opus_dynamic_repost_area_content(msg_box);
                            if (!msg_box_content.includes(modal_input_text)) {
                                await this.global_var.current_page.mouse.click(10, 10);
                                await sleep(3e3);
                                console.error("弹出框里内容与转发内容不符，删除弹出框里内容", `\nmsg_box_content:${msg_box_content}\ntextarea_input_text:${modal_input_text}`);
                                await this.global_var.current_page
                                    .waitForSelector(modal_popup_btn_element)
                                    .then(async (el) => {
                                        await el.click();
                                    });//重新点开转发modal
                            }
                        } else if (text_area_type === 'plain') {
                            msg_box_content = await this.global_var.current_page.$eval(input_text_area_element, (el) => el.value);
                            if (utils.Common.remove_invisible_char(msg_box_content.replaceAll(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "")) !== utils.Common.remove_invisible_char(modal_input_text.replaceAll(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, ""))) {
                                //如果不等就删掉重新输入
                                await sleep(1e3);
                                await msg_box.click();
                                await this.global_var.current_page.keyboard.down("Control");
                                await this.global_var.current_page.keyboard.press("A");
                                await this.global_var.current_page.keyboard.up("Control");
                                await sleep(1e3);
                                await this.global_var.current_page.keyboard.press("Backspace");
                                console.log("输入框里内容与评论不符，删除输入框里内容", `\nmsg_box_content:${msg_box_content}\ntextarea_input_text:${modal_input_text}`);
                            } else {
                                //相等了break出去
                                break;
                            }
                        }

                        if (_bt >= 5) {
                            console.error(error_name);
                            throw Error(error_name);
                        }
                        _bt += 1;
                    }
                    //#endregion
                    break;
                } catch (e) {
                    if (bt >= 5) {
                        throw Error(e);
                    }
                    console.error(`${this.log_name}${this.page_url}\t${error_name}\n${e.stack}`);
                    await this.global_var.current_page.reload({
                        waitUntil: 'networkidle2'
                    });
                }
            }
        },
        /**
         * 返回一个bool判断是否评论存在 true:存在；false：不存在，被隐藏了
         * @param {json} response_json 评论的响应
         * @param {string} dynamic_id 动态ID
         * @returns
         */
        check_reply: async (response_json, dynamic_id) => {
            if (response_json) {
                try {
                    if (response_json.code === 12051) {
                        console.warn(`${this.log_name}检查评论失败！但重复评论，算作成功！`, JSON.stringify(response_json));
                        return true;
                    }
                    let type = response_json.data.reply.type;
                    let oid = this.global_var.response.global_dynamic_data.item.basic.comment_id_str;
                    let rpid = response_json.data.reply.rpid;
                    let check_flag = false;
                    let reply_jump_resp = await utils.BiliAPI.BiliAPI.reply_jump(type, oid, rpid);
                    await reply_jump_resp.data.replies.forEach((reply) => {
                        if (reply.rpid === rpid) {
                            check_flag = true;
                        } else if (reply.replies != null) {
                            reply.replies.forEach((reply) => {
                                if (reply.rpid === rpid) {
                                    check_flag = true;
                                }
                            });
                        }
                    });
                    return check_flag;
                } catch (e) {
                    console.error(`${this.log_name}检查评论失败！${e}`, JSON.stringify(response_json));
                    return response_json.code === 12051;

                }
            }
            if (dynamic_id) {
                let dynamic_detail_res_data = this.global_var.response.global_dynamic_data;
                if (!this.global_var.response.global_dynamic_data) {
                    let dynamic_detail_res = await utils.BiliAPI.BiliAPI.get_dynamic_v1_detail(String(dynamic_id));
                    if (dynamic_detail_res.code) {
                        console.error("获取评论失败", dynamic_detail_res);
                        return false;
                    }
                    dynamic_detail_res_data = dynamic_detail_res.data;
                }
                let comment_id_str = dynamic_detail_res_data.item.basic.comment_id_str;
                let comment_type = dynamic_detail_res_data.item.basic.comment_type;
                let reply_res = await utils.BiliAPI.BiliAPI.get_reply(2, 0, comment_id_str, comment_type);
                if (reply_res.code) {
                    console.error(`${this.log_name}获取评论失败`, reply_res);
                    return false;
                } else {
                    let replies = reply_res.data.replies;
                    let find_reply = await replies.find((element) => element.member.uname === this.log_name);
                    return !!find_reply;
                }
            } else {
                return false;
            }
        },

        /**
         * 获取opus动态的转发框里的内容
         * @param {puppeteer.Node} msg_box_node
         * @returns {Promise<string>}
         */
        get_opus_dynamic_repost_area_content: async (msg_box_node) => {
            return await msg_box_node.$eval(BiliElementMap.opus_dynamic.interact.rich_text_area, async (el) => {
                let ret_msg = "";
                for (let i of el.childNodes) {
                    if (i.data) {
                        ret_msg += i.data;
                    } else {
                        let emoji_data = JSON.parse(i.dataset.data);
                        ret_msg += emoji_data.text;
                    }
                }
                return ret_msg;
            });
        },
        /**
         * 点赞动态
         * @return {Promise<boolean>} 是否继续执行下面的步骤
         */
        dynamic_thumb: async () => {
            let thumb_resp;
            await this.global_var.current_page.waitForSelector(BiliElementMap.opus_dynamic.interact.share_modal, {
                hidden: true,
                visible: false
            }) // 等待分享弹窗消失！
            await Promise.all(
                [
                    this.global_var.current_page.waitForSelector(BiliElementMap.opus_dynamic.interact.sidebar_like_btn, {visible: true})
                        .then(async el => await el.click()),
                    thumb_resp = await this.global_var.current_page.waitForResponse(
                        response => response.url().includes(BiliElementMap.url_path.opus_dynamic.dynamic_like_thumb)
                    )]
            );
            thumb_resp = thumb_resp ? await thumb_resp.json() : undefined;
            if (!thumb_resp || thumb_resp.code !== 0) {
                throw Error(`点赞失败！${thumb_resp ? JSON.stringify(thumb_resp) : "无响应"}`);
            }
            console.log(this.log_format(`${BiliElementMap.log_record.opus_dynamic.thumb_dynamic}\t${JSON.stringify(thumb_resp)}`));

            if (await this.global_var.current_page
                .waitForSelector(BiliElementMap.opus_dynamic.interact.sidebar_like_btn_is_active)
                .then((el) => true)
                .catch(
                    (e) => {
                        throw Error(`等待元素${BiliElementMap.opus_dynamic.interact.sidebar_like_btn_is_active}失败！\t${e}`)
                    }
                )
            ) {
                console.log(this.log_format(`${BiliElementMap.log_record.opus_dynamic.thumb_dynamic}`));
            } else {
                console.error(this.log_format(BiliElementMap.log_record.opus_dynamic.err.like.dynamic_like_icon_fail));
                throw Error(BiliElementMap.log_record.opus_dynamic.err.like.dynamic_like_icon_fail)
            }
            return true;
        },
        /**
         * 点击转发
         * @param {string} repost_content
         * @return {Promise<boolean>} 是否继续执行下面的步骤
         */
        dynamic_repost: async (repost_content = "") => {
            await this.basic_op.check_text_area_input_same_text(
                repost_content,
                BiliElementMap.opus_dynamic.interact.sidebar_forward_btn,
                BiliElementMap.opus_dynamic.interact.repost_input_text_area,
                BiliElementMap.log_record.opus_dynamic.err.repost.dynamic_repost_content_input_fail,
                "modal"
            )
            let repost_resp;
            await Promise.all([
                this.global_var.current_page.waitForSelector(BiliElementMap.opus_dynamic.interact.repost_btn, {visible: true}).then(async el => await el.click()),
                repost_resp = await this.global_var.current_page.waitForResponse(
                    resp => resp.url().includes(BiliElementMap.url_path.opus_dynamic.dynamic_repost)
                        || resp.url().includes(BiliElementMap.url_path.opus_dynamic.create_dynamic)
                )
            ])
            repost_resp = repost_resp ? await repost_resp.json() : undefined;
            if (!repost_resp || repost_resp.code !== 0) {
                throw Error(`转发响应失败！${JSON.stringify(repost_resp)}`)
            }
            console.log(this.log_format(`${BiliElementMap.log_record.opus_dynamic.repost_dynamic}\t${JSON.stringify(repost_resp)}`));
            return true;
        },
        /**
         * 回复内容
         * @param comment_msg
         * @return {Promise<boolean>}是否继续执行下面的步骤
         */
        comment_submit: async (comment_msg) => {
            //点击回复
            /**
             * 检查评论是否被风控
             */
            const CheckRisk = async () => {
                let comment_dyn_response_code = 0;
                if (this.global_var.response.comment_dyn_response) {
                    comment_dyn_response_code = this.global_var.response.comment_dyn_response.code;
                } else {
                    console.error(this.log_format(BiliElementMap.log_record.opus_dynamic.err.comment.reply_response_timeout));
                    throw Error(BiliElementMap.log_record.opus_dynamic.err.comment.reply_response_timeout);
                }
                let captcha = await this.global_var.current_page.$$(BiliElementMap.opus_dynamic.captcha.comment_captcha);

                if (comment_dyn_response_code === 12051) {
                    //重复评论code
                    console.log(this.log_format(`重复评论${JSON.stringify(this.global_var.response.comment_dyn_response)}`))
                    return true;
                }
                if (captcha.length !== 0 || comment_dyn_response_code) {
                    let err_msg = BiliElementMap.log_record.opus_dynamic.err.comment.dynamic_comment_captcha_fail
                    await this.log_record.my_throw(err_msg);
                    console.error(this.log_format(`${err_msg}\t休眠4小时！`));
                    await sleep(4 * 3600e3);
                    throw Error(err_msg);
                }
            }

            let page_url = this.page_url;
            if (this.global_var.response.reply_main.code === 12061) {
                //UP主已关闭评论区
                return true;
            }
            if (page_url.includes("read/cv")) {
                await this.global_var.current_page.goto(`https://t.bilibili.com/${this.global_var.dynamic_id}`);
            }
            if (typeof comment_msg != "string" || !comment_msg || comment_msg.includes("undefined") || comment_msg.includes("null") || comment_msg.includes("true") || comment_msg.includes("false")) {
                //检查是否传入的是string类型参数 或者是否为空
                await this.log_record.my_throw(`${BiliElementMap.log_record.opus_dynamic.err.comment.comment_msg_error}\t传入参数评论内容为空`);
                return false;
            }
            let bt = 0;
            for (let i = 1; ; i++) {
                try {
                    await this.basic_op.check_text_area_input_same_text(
                        comment_msg,
                        BiliElementMap.opus_dynamic.interact.reply_box_text_area,
                        BiliElementMap.opus_dynamic.interact.reply_box_text_area,
                        BiliElementMap.log_record.opus_dynamic.err.comment.comment_msg_input_error,
                        "plain"
                    )
                    let comment_resp;
                    await Promise.all([
                        this.global_var.current_page.waitForSelector(BiliElementMap.opus_dynamic.interact.reply_send_btn).then(el => el.click()),
                        comment_resp = await this.global_var.current_page.waitForResponse(
                            resp => resp.url().includes(BiliElementMap.url_path.opus_dynamic.dynamic_reply_add))
                    ])
                    this.global_var.response.comment_dyn_response = comment_resp ? await comment_resp.json() : undefined;

                    console.log(this.log_format(`评论响应：${JSON.stringify(this.global_var.response.comment_dyn_response)}`))
                    await CheckRisk();
                    break;
                } catch (e) {
                    bt++;
                    console.error(this.log_format(`第${i}次尝试输入动态评论！\n${e}`));
                    if (this.global_var.response.comment_dyn_response?.code === 12051) {
                        break;
                    }
                    if (bt >= 3) {
                        throw e;
                    }
                    await this.global_var.current_page.reload({
                        waitUntil: "networkidle2",
                    });
                    await this.global_var.current_page.evaluate(() => {
                        this.scrollTo(0, 1500);
                    });
                }
            }

            for (let i = 0; i < 10; i++) {
                if (this.global_var.response.comment_dyn_response) {
                    console.log(this.log_format(`检查评论是否被阿瓦隆中`));
                    let check_reply_result = await this.basic_op.check_reply(this.global_var.response.comment_dyn_response, utils.BiliAPI.BiliAPI.draw_dynamic_id(page_url));
                    if (check_reply_result) {
                        console.log(this.log_format(`评论成功，躲过阿瓦隆`));
                        break;
                    } else {
                        let er = BiliElementMap.log_record.opus_dynamic.err.comment.dynamic_comment_kami_kakushi_fail
                        console.error(er);
                        await this.log_record.my_throw(er);
                        return false
                    }
                } else {
                    if (i === 9) {
                        await this.log_record.my_throw(BiliElementMap.log_record.response.reply_response_timeout);
                        return false
                    }
                }
                await sleep(3e3);
            }

            try {
                if (Math.random() < this.lottery_setting.lottery_module.comment_thumb_chance) {
                    await sleep(3e3);
                    await this.basic_op.comment_thumb();
                    await sleep(3e3);
                }
            } catch (e) {
                console.error(this.log_format(e))
            }
            return true
        },
        comment_thumb: async () => {
            let uname = this.global_var.user_info.uname;
            let comment_user_index = await this.global_var.current_page.$$eval(BiliElementMap.opus_dynamic.interact.reply_user_icon, (els, uname) => {
                for (let j = 0; j < els.length; j++) {
                    if (els[j].textContent === uname) {
                        return j;
                    }
                }
            }, uname);
            let my_comment_thumb;
            my_comment_thumb = (await this.global_var.current_page.$$(BiliElementMap.opus_dynamic.interact.comment_thumb_btn))[comment_user_index];

            if (my_comment_thumb) {
                await my_comment_thumb.click();
            } else {
                console.error(this.log_format(`${BiliElementMap.log_record.opus_dynamic.comment_thumb_fail}\t获取评论框元素失败评论点赞失败`));
            }
            if (!(await this.global_var.current_page.waitForSelector(BiliElementMap.opus_dynamic.interact.comment_thumb_btn_is_active, {timeout: 10e3}))) {
                console.error(this.log_format(`${BiliElementMap.log_record.opus_dynamic.comment_thumb_fail}\t评论点赞失败，获取点赞成功图标失败`));
            } else {
                console.log(`${this.log_name}评论点赞成功`);
            }
        }
    }
    comment_op = {
        /**
         * 获取动态内容和置顶回复
         * @param dynamic_data
         * @return {Promise<string>}
         */
        get_dynamic_content_and_top_msg: async (dynamic_data) => {
            //获取动态内容和up置顶的回复
            let get_top_msg = async () => {
                try {
                    if (this.global_var.response.reply_main !== undefined) {
                        try {
                            if (
                                this.global_var.response.reply_main.code ===
                                12061 ||
                                this.global_var.response.reply_main.code ===
                                12002 ||
                                this.global_var.response.reply_main?.data
                                    ?.control?.input_disable //无法评论
                            ) {
                                // code:
                                // 12061
                                // message:
                                // 'UP主已关闭评论区'
                                return "";
                            }
                            let ret_msg = "";
                            let upper_mid =
                                this.global_var.response.reply_main.data
                                    .upper.mid;
                            let replies =
                                this.global_var.response.reply_main.data
                                    .replies;
                            let top =
                                this.global_var.response.reply_main.data.top
                                    .upper;
                            if (top != null) {
                                ret_msg += top.content.message;
                                if (top.replies) {
                                    for (let rp of top.replies) {
                                        if (rp.mid === upper_mid) {
                                            ret_msg +=
                                                rp.content.message;
                                        }
                                    }
                                }
                            }
                            for (let i = 0; i < replies.length; i++) {
                                let replies_content =
                                    replies[i].content.message;
                                let replies_mid =
                                    replies[i].content.message.mid;
                                if (replies_mid === upper_mid) {
                                    ret_msg += replies_content;
                                }
                            }
                            return ret_msg;
                        } catch (e) {
                            console.error(
                                `${this.log_name}${this.page_url}\tup置顶的回复获取失败\t${this.global_var.response.reply_main}\t${this.now}`
                            );
                            return "";
                        }
                    } else {
                        console.error("未拦截到评论API内容");
                        return "";
                    }
                } catch (e) {
                    console.error(`up置顶的回复获取失败\n${e.stack}`);
                    return "";
                }
            };
            try {
                if (!dynamic_data) {
                    dynamic_data = (
                        await utils.BiliAPI.BiliAPI.get_dynamic_v1_detail(
                            utils.BiliAPI.BiliAPI.draw_dynamic_id(
                                this.page_url
                            )
                        )
                    ).data;
                    this.global_var.response.global_dynamic_data =
                        dynamic_data;
                }
                let top_msg = "";
                if (this.global_var.response?.reply_main !== undefined) {
                    top_msg = await get_top_msg();
                }
                let dynmaic_content = "";
                let dynamic_type = dynamic_data.item.type;
                if (dynamic_type === "DYNAMIC_TYPE_AV") {
                    let dynamic_content1;
                    let dynamic_content2;
                    let dynamic_content3;
                    try {
                        dynamic_content1 =
                            dynamic_data.item.modules.module_dynamic
                                .desc.text;
                    } catch {
                        dynamic_content1 = "";
                    }
                    try {
                        dynamic_content2 =
                            dynamic_data.item.modules.module_dynamic
                                .major.archive.desc;
                    } catch {
                        dynamic_content2 = "";
                    }
                    try {
                        dynamic_content3 =
                            dynamic_data.item.modules.module_dynamic
                                .major.archive.title;
                    } catch {
                        dynamic_content3 = "";
                    }

                    if (
                        dynamic_content1 !== undefined &&
                        dynamic_content1 != null
                    ) {
                        dynmaic_content += dynamic_content1;
                    }
                    if (
                        dynamic_content2 !== undefined
                    ) {
                        dynmaic_content += dynamic_content2;
                    }
                    if (
                        dynamic_content3 !== undefined
                    ) {
                        dynmaic_content += dynamic_content3;
                    }
                } else if (dynamic_type === "DYNAMIC_TYPE_ARTICLE") {
                    let dynamic_content1;
                    let dynamic_content2;
                    let dynamic_content3;
                    let dynamic_content4;
                    try {
                        dynamic_content1 =
                            dynamic_data.item.modules.module_dynamic
                                .desc.text;
                    } catch {
                        dynamic_content1 = "";
                    }
                    try {
                        dynamic_content2 =
                            dynamic_data.item.modules.module_dynamic
                                .desc.additional;
                    } catch {
                        dynamic_content2 = "";
                    }
                    try {
                        dynamic_content3 =
                            dynamic_data.item.modules.module_dynamic
                                .major.article.desc;
                    } catch {
                        dynamic_content3 = "";
                    }
                    try {
                        dynamic_content4 =
                            dynamic_data.item.modules.module_dynamic
                                .major.opus.summary.text;
                    } catch {
                        dynamic_content4 = "";
                    }

                    if (
                        dynamic_content1 !== undefined &&
                        dynamic_content1 != null
                    ) {
                        dynmaic_content += dynamic_content1;
                    }
                    if (
                        dynamic_content2 !== undefined &&
                        dynamic_content2 != null
                    ) {
                        dynmaic_content += dynamic_content2;
                    }
                    if (
                        dynamic_content3 !== undefined &&
                        dynamic_content3 != null
                    ) {
                        dynmaic_content += dynamic_content3;
                    }
                    if (
                        dynamic_content4 !== undefined &&
                        dynamic_content4 != null
                    ) {
                        dynmaic_content += dynamic_content4;
                    }
                } else {
                    //图片动态或文字动态
                    let dynamic_content1;
                    let dynamic_content2;
                    let dynamic_content3;
                    let dynamic_content4;
                    try {
                        dynamic_content1 =
                            dynamic_data.item.modules.module_dynamic.major?.opus?.summary?.rich_text_nodes
                                ?.map((el) => el.text)
                                .join("");
                    } catch {
                        dynamic_content1 = "";
                    }

                    try {
                        dynamic_content4 =
                            dynamic_data.item.modules.module_dynamic
                                ?.major?.opus?.title;
                    } catch {
                        dynamic_content4 = "";
                    }
                    try {
                        dynamic_content2 =
                            dynamic_data.item.modules.module_dynamic
                                .topic;
                    } catch {
                        dynamic_content2 = "";
                    }
                    try {
                        dynamic_content3 =
                            dynamic_data.item.modules.module_dynamic
                                ?.desc?.text;
                    } catch {
                        dynamic_content3 = "";
                    }

                    if (
                        dynamic_content1 !== undefined
                    ) {
                        dynmaic_content += dynamic_content1;
                    }
                    if (
                        dynamic_content2 !== undefined
                    ) {
                        dynmaic_content += dynamic_content2;
                    }
                    if (
                        dynamic_content3 !== undefined &&
                        dynamic_content3 != null
                    ) {
                        dynmaic_content += dynamic_content3;
                    }
                    if (
                        dynamic_content4 !== undefined
                    ) {
                        dynmaic_content += dynamic_content4;
                    }
                }
                let ret_dynamic_content = (
                    dynmaic_content +
                    "\n" +
                    String(top_msg).replaceAll("undefined", "")
                ).trim();
                return ret_dynamic_content;
            } catch (e) {
                console.error(`${this.log_name}${this.page_url}\t获取动态和置顶评论内容失败\t${dynamic_data}\t${e.stack}\t${this.now}`
                );
                return JSON.stringify(dynamic_data);
            }
        },
        /**
         * 预回复内容
         * @param {string} dynamic_content
         * @param {string} reply_msg
         * @returns 返回空字符串表示无需带话题或@，返回undefined表示获取话题失败！
         */
        pre_msg_processing: (dynamic_content, reply_msg) => {
            function zhDigitToArabic(digit) {
                const zh = [
                    "零",
                    "一",
                    "二",
                    "三",
                    "四",
                    "五",
                    "六",
                    "七",
                    "八",
                    "九",
                ];
                const unit = ["千", "百", "十"];
                const quot = [
                    "万",
                    "亿",
                    "兆",
                    "京",
                    "垓",
                    "秭",
                    "穰",
                    "沟",
                    "涧",
                    "正",
                    "载",
                    "极",
                    "恒河沙",
                    "阿僧祗",
                    "那由他",
                    "不可思议",
                    "无量",
                    "大数",
                ];
                let result = 0,
                    quotFlag;

                for (let i = digit.length - 1; i >= 0; i--) {
                    if (zh.indexOf(digit[i]) > -1) {
                        // 数字
                        if (quotFlag) {
                            result += quotFlag * getNumber(digit[i]);
                        } else {
                            result += getNumber(digit[i]);
                        }
                    } else if (unit.indexOf(digit[i]) > -1) {
                        // 十分位
                        if (quotFlag) {
                            result +=
                                quotFlag *
                                getUnit(digit[i]) *
                                getNumber(digit[i - 1]);
                        } else {
                            result +=
                                getUnit(digit[i]) *
                                getNumber(digit[i - 1]);
                        }
                        --i;
                    } else if (quot.indexOf(digit[i]) > -1) {
                        // 万分位
                        if (unit.indexOf(digit[i - 1]) > -1) {
                            if (getNumber(digit[i - 1])) {
                                result +=
                                    getQuot(digit[i]) *
                                    getNumber(digit[i - 1]);
                            } else {
                                result +=
                                    getQuot(digit[i]) *
                                    getUnit(digit[i - 1]) *
                                    getNumber(digit[i - 2]);
                                quotFlag = getQuot(digit[i]);
                                --i;
                            }
                        } else {
                            result +=
                                getQuot(digit[i]) *
                                getNumber(digit[i - 1]);
                            quotFlag = getQuot(digit[i]);
                        }
                        --i;
                    }
                }

                return result;

                // 返回中文大写数字对应的阿拉伯数字
                function getNumber(num) {
                    for (let i = 0; i < zh.length; i++) {
                        if (zh[i] == num) {
                            return i;
                        }
                    }
                }

                // 取单位
                function getUnit(num) {
                    for (let i = unit.length; i > 0; i--) {
                        if (num == unit[i - 1]) {
                            return Math.pow(10, 4 - i);
                        }
                    }
                }

                // 取分段
                function getQuot(q) {
                    for (let i = 0; i < quot.length; i++) {
                        if (q === quot[i]) {
                            return Math.pow(10, (i + 1) * 4);
                        }
                    }
                }
            }

            if (!reply_msg) {
                reply_msg = "";
            }
            let premsg = ""; //判断是否需要@或者带话题
            let msg = undefined;
            dynamic_content = dynamic_content.replaceAll(/＠/gim, "@");
            dynamic_content = dynamic_content.replaceAll(
                /@((?! ).){1,10} /gim,
                ""
            );
            dynamic_content = dynamic_content.replaceAll(
                /标记/gim,
                "艾特"
            );
            dynamic_content = dynamic_content.replaceAll(
                /朋友/gim,
                "好友"
            );
            dynamic_content = dynamic_content.replaceAll(
                "转发话题",
                "带话题"
            );
            dynamic_content = dynamic_content.replaceAll("＃", "#");
            dynamic_content = dynamic_content.replaceAll("UP", "up");
            let non_topic_content = dynamic_content.replaceAll(
                /(?<=#)(.{0,10})(?=#)/gim,
                ""
            );
            let topobj_6 = non_topic_content.match(
                /@.{0,3}位.*|.*@.{0,3}名.*/gim
            );
            let topobj_5 = non_topic_content.match(
                /@.{0,3}1位.*|.*@.{0,3}1名.*/
            );
            let topobj_4 = non_topic_content.match(
                /@.{0,3}一位.*|.*@.{0,3}一名.*/gim
            );
            let topobj_3 = non_topic_content.match(
                /@.{0,3}一位好友.*|.*@.{0,3}你的|.*@.{0,3}一名好友.*/gim
            );
            let topobj_2 = non_topic_content.match(
                /艾特.{0,3}位好友.*|.*艾特.{0,3}名好友.*|艾特.{0,7}up/gim
            );
            let topobj_1 =
                non_topic_content.match(/@你想祝福的人.*/gim);
            let topobj0 = non_topic_content.match(
                /@{0,3}位胖友.*|.*@{0,3}名胖友.*/gim
            );
            let topobj1 = non_topic_content.match(
                /圈.{0,3}位你的伙伴.*|.*圈.{0,3}名你的伙伴.*/gim
            );
            let topobj2 =
                non_topic_content.match(/带tag#.{0,30}#.*/gim);
            let topobj3 = non_topic_content.match(
                /带话题.{0,40}#.{0,30}#((?!投稿).)*$/gim
            );
            let topobj4 = non_topic_content.match(
                /带上tag#.{0,30}#((?!投稿).)*$/gim
            );
            let topobj5 = non_topic_content.match(
                /带#.{0,30}#.{0,10}话题((?!投稿).)*$/gim
            );
            let topobj6 = non_topic_content.match(/艾特好友.*/gim);
            let topobj7 = non_topic_content.match(
                /@.{0,4}名好友.*|.*@.{0,4}位好友.*/gim
            );
            let topobj8 =
                non_topic_content.match(/@你的.{0,3}个小伙伴.*/gim);
            let topobj9 =
                non_topic_content.match(/@两位好友.*|.*@两名好友.*/gim);
            let topobj10 = non_topic_content.match(
                /带#.{0,30}#((?!投稿).)*$/gim
            );
            let topobj11 =
                non_topic_content.match(/@.{0,5}你的.{0,3}个好友.*/gim);
            let topobj12 = non_topic_content.match(
                /带[^来】看懂]{0,5}#.{0,30}#((?!投稿).)*$/gim
            );
            let topobj13 = non_topic_content.match(
                /加话题#.{0,30}#((?!投稿).)*$/gim
            );
            let topobj14 = non_topic_content.match(
                /带标签#.{0,30}#((?!投稿).)*$/gim
            );
            let topobj15 =
                non_topic_content.match(/@三位好友.*|.*@三名好友.*/gim);
            let topobj_16 = non_topic_content.match(
                /带(.{0,3}#.{0,20}) 话题.(?!投稿).*?/gim
            );
            let at_members = this.lottery_setting.lottery_module.at_member;
            if (
                topobj_6 != null ||
                topobj6 != null ||
                topobj_5 != null ||
                topobj_4 != null ||
                topobj_3 != null ||
                topobj_2 != null ||
                topobj_1 != null ||
                topobj0 != null ||
                topobj1 != null ||
                topobj7 != null ||
                topobj8 != null ||
                topobj11 != null
            ) {
                let UPname = "";
                try {
                    UPname =
                        this.global_var.response.global_dynamic_data.item
                            .modules.module_author.name;
                } catch {
                }
                let at_times = 1;
                let findContent = [
                    topobj_6,
                    topobj6,
                    topobj_5,
                    topobj_4,
                    topobj_3,
                    topobj_2,
                    topobj_1,
                    topobj0,
                    topobj1,
                    topobj7,
                    topobj8,
                    topobj11,
                ].join("");
                let num = parseInt(
                    findContent.match(/\d+/gim)?.join("") ||
                    zhDigitToArabic(findContent)
                );
                if (num > 0 && num < 5) {
                    at_times = num;
                }
                let choose_Up_list = [];
                premsg =
                    "@" +
                    (UPname
                        ? UPname
                        : utils.Common.random_choice(
                            at_members
                        )) +
                    " ";
                for (let i = 0; i < at_times - 1; i++) {
                    let at_up = "";
                    while (!choose_Up_list.includes(at_up)) {
                        at_up = utils.Common.random_choice(
                            at_members
                        );
                        if (!choose_Up_list.includes(at_up)) {
                            choose_Up_list.push(at_up);
                        }
                        if (
                            choose_Up_list.length ===
                            at_members.length
                        )
                            break;
                    }
                    premsg += "@" + at_up + " ";
                }
            } else if (topobj9 != null) {
                premsg = `@${utils.Common.random_choice(
                    at_members
                )} @${utils.Common.random_choice(at_members)} `;
            } else if (topobj2 != null) {
                msg = /带tag#(.{0,20})#.*/gim
                    .exec(dynamic_content)
                    ?.slice(1);
                if (msg)
                    for (let _ = 0; _ < msg.length; _++) {
                        if (msg[_] != null && msg[_] !== undefined) {
                            premsg += "#" + msg[_] + "#";
                        }
                    }
            } else if (topobj3 != null) {
                msg = /带话题.*?#(.{0,30})#.*/gim
                    .exec(dynamic_content)
                    ?.slice(1);
                if (msg)
                    for (let _ = 0; _ < msg.length; _++) {
                        if (msg[_] != null && msg[_] !== undefined) {
                            premsg += "#" + msg[_] + "#";
                        }
                    }
            } else if (topobj4 != null) {
                msg = /带上tag#(.{0,30})#.*/gim
                    .exec(dynamic_content)
                    ?.slice(1);
                if (msg)
                    for (let _ = 0; _ < msg.length; _++) {
                        if (msg[_] != null && msg[_] !== undefined) {
                            premsg += "#" + msg[_] + "#";
                        }
                    }
            } else if (topobj5 != null) {
                msg = /带#(.{0,30})#.{0,10}话题.*/gim
                    .exec(dynamic_content)
                    ?.slice(1);
                if (msg)
                    for (let _ = 0; _ < msg.length; _++) {
                        if (msg[_] != null && msg[_] !== undefined) {
                            premsg += "#" + msg[_] + "#";
                        }
                    }
            } else if (topobj10 != null) {
                msg = /带#(.{0,30})#.*/gim
                    .exec(dynamic_content)
                    ?.slice(1);
                if (msg)
                    for (let _ = 0; _ < msg.length; _++) {
                        if (msg[_] != null && msg[_] !== undefined) {
                            premsg += "#" + msg[_] + "#";
                        }
                    }
            } else if (topobj12 != null) {
                msg = /带.{0,5}#(.{0,30})#.*/gim
                    .exec(dynamic_content)
                    ?.slice(1);
                if (msg)
                    for (let _ = 0; _ < msg.length; _++) {
                        if (msg[_] != null && msg[_] !== undefined) {
                            premsg += "#" + msg[_] + "#";
                        }
                    }
            } else if (topobj13 != null) {
                msg = /加话题#(.{0,30})#.*/gim
                    .exec(dynamic_content)
                    ?.slice(1);
                if (msg)
                    for (let _ = 0; _ < msg.length; _++) {
                        if (msg[_] != null && msg[_] !== undefined) {
                            premsg += "#" + msg[_] + "#";
                        }
                    }
            } else if (topobj14 != null) {
                msg = /带标签#(.{0,30})#.*/gim
                    .exec(dynamic_content)
                    ?.slice(1);
                if (msg)
                    for (let _ = 0; _ < msg.length; _++) {
                        if (msg[_] != null && msg[_] !== undefined) {
                            premsg += "#" + msg[_] + "#";
                        }
                    }
            } else if (topobj15 != null) {
                premsg = `@${utils.Common.random_choice(
                    at_members
                )} @${utils.Common.random_choice(
                    at_members
                )} @${utils.Common.random_choice(at_members)} `;
            } else if (topobj_16 != null) {
                msg = /带(.{0,3}#.{0,20}) 话题.(?!投稿).*?/gim
                    .exec(dynamic_content)
                    ?.slice(1);
                if (msg)
                    for (let _ = 0; _ < msg.length; _++) {
                        if (msg[_] != null && msg[_] !== undefined) {
                            premsg += "#" + msg[_] + "#";
                        }
                    }
            }
            if (premsg.indexOf("#") > -1) {
                let tpremsg = "";
                for (let _ = 0; _ < premsg.split("#").length; _++) {
                    if (
                        premsg.split("#")[_] !== "" &&
                        premsg.split("#")[_] !== " " &&
                        premsg.split("#")[_] !== "  " &&
                        premsg.split("#")[_] !== "和"
                    ) {
                        if (tpremsg.length < 18) {
                            tpremsg += "#" + premsg.split("#")[_] + "#";
                        }
                    }
                }
                premsg = tpremsg;
            }
            if (
                /带话题#.*#((?!投稿).)*$/gim.test(non_topic_content) ||
                /带((?!】|来|看懂)).{0,5}#/.test(non_topic_content) ||
                topobj2 ||
                topobj3 ||
                topobj4 ||
                topobj5 ||
                topobj10 ||
                topobj12 ||
                topobj13 ||
                topobj14
            ) {
                if (
                    !(premsg.includes("#") || reply_msg.includes("#"))
                ) {
                    // utl.my_throw("话题获取失败");
                    return undefined;
                }
            }
            return premsg;
        },
        /**
         * 预处理动态内容
         */
        pre_process_dynamic_content: (dynamic_content) => {
            try {
                dynamic_content = dynamic_content.replaceAll(
                    /「/gim,
                    "【"
                );
                dynamic_content = dynamic_content.replaceAll(
                    /」/gim,
                    "】"
                );
                dynamic_content = dynamic_content.replaceAll(
                    /〗/gim,
                    "】"
                );
                dynamic_content = dynamic_content.replaceAll(
                    /〖/gim,
                    "【"
                );
                dynamic_content = dynamic_content.replaceAll(
                    /“/gim,
                    '"'
                );
                dynamic_content = dynamic_content.replaceAll(
                    /”/gim,
                    '"'
                );
                dynamic_content = dynamic_content.replaceAll(
                    /＠/gim,
                    "@"
                );
                dynamic_content = dynamic_content.replaceAll(
                    /@.{0,8} /gim,
                    ""
                );
                dynamic_content = dynamic_content.replaceAll(
                    /好友/gim,
                    "朋友"
                );
                dynamic_content = dynamic_content.replaceAll(
                    /伙伴/gim,
                    "朋友"
                );
                dynamic_content = dynamic_content.replaceAll(
                    /安利/gim,
                    "分享"
                );
                dynamic_content = dynamic_content.replaceAll(
                    /【关注】/gim,
                    ""
                );
                dynamic_content = dynamic_content.replaceAll(
                    /添加话题/gim,
                    "带话题"
                );

                dynamic_content = dynamic_content.replaceAll(
                    /[?|❓]/gim,
                    "？"
                );
                return dynamic_content;
            } catch {
                return dynamic_content;
            }
        },
        /**
         * 判断是否需要人工回复
         * @param {string} dynamic_content
         * @returns {boolean} - true ：人工回复 false：自动评论
         */
        manual_reply_judge: function (dynamic_content) {
            //判断是否需要人工回复 返回true需要人工判断  返回null不需要人工判断
            //64和67用作判断是否能使用关键词回复
            let none_lottery_word1 = /.*测试.{0,5}gua/gim.test(
                dynamic_content
            );
            if (none_lottery_word1) {
                return true;
            }
            dynamic_content = dynamic_content.replaceAll(/「/gim, "【");
            dynamic_content = dynamic_content.replaceAll(/」/gim, "】");
            dynamic_content = dynamic_content.replaceAll(/〗/gim, "】");
            dynamic_content = dynamic_content.replaceAll(/〖/gim, "【");
            dynamic_content = dynamic_content.replaceAll(/“/gim, '"');
            dynamic_content = dynamic_content.replaceAll(/”/gim, '"');
            dynamic_content = dynamic_content.replaceAll(/＠/gim, "@");
            dynamic_content = dynamic_content.replaceAll(
                /@.{0,8} /gim,
                ""
            );
            dynamic_content = dynamic_content.replaceAll(
                /好友/gim,
                "朋友"
            );
            dynamic_content = dynamic_content.replaceAll(
                /伙伴/gim,
                "朋友"
            );
            dynamic_content = dynamic_content.replaceAll(
                /安利/gim,
                "分享"
            );
            dynamic_content = dynamic_content.replaceAll(
                /【关注】/gim,
                ""
            );
            dynamic_content = dynamic_content.replaceAll(
                /添加话题/gim,
                "带话题"
            );

            dynamic_content = dynamic_content.replaceAll(
                /[?|❓]/gim,
                "？"
            );
            dynamic_content = dynamic_content.replaceAll(/:/gim, "：");
            let manual_re1 =
                /.*评论.{0,20}告诉|.*有关的评论|.*告诉.{0,20}留言/gim.test(
                    dynamic_content
                );
            let manual_re2 =
                /.*评论.{0,20}理由|.*参与投稿.{0,30}有机会获得/gim.test(
                    dynamic_content
                );
            let manual_re3 = /.*评论.{0,10}对|.*造.{0,3}句子/gim.test(
                dynamic_content
            );
            let manual_re4 =
                /.*猜赢|.*猜对|.*答对|.*猜到.{0,5}答案/gim.test(
                    dynamic_content
                );
            let manual_re5 =
                /.*说.{0,10}说|.*谈.{0,10}谈|.*夸.{0,10}夸|评论.{0,10}写.{0,10}写|.*写下.{0,5}假如.{0,5}是|.*讨论.{0,10}怎么.{0,10}？/gim.test(
                    dynamic_content
                );
            let manual_re7 =
                /.*最先猜中|.*带文案|.*许.{0,5}愿望/gim.test(
                    dynamic_content
                );
            let manual_re8 = /.*新衣回/gim.test(dynamic_content);
            let manual_re9 =
                /.*留言.{0,10}建议|.*评论.{0,10}答|.*一句话证明|.*留言.{0,10}得分|.*有趣.{0,3}留言|.*有趣.{0,3}评论|.*留言.{0,3}晒出|.*评论.{0,3}晒出/gim.test(
                    dynamic_content
                );
            let manual_re11 =
                /.*评论.{0,10}祝福|.*评论.{0,10}意见|.*意见.{0,10}评论|.*留下.{0,10}意见|.*留下.{0,15}印象|.*意见.{0,10}留下/gim.test(
                    dynamic_content
                );
            let manual_re12 =
                /.*评论.{0,10}讨论|.*话题.{0,10}讨论|.*参与.{0,5}讨论/gim.test(
                    dynamic_content
                );
            let manual_re14 =
                /.*评论.{0,10}说出|,*留言.{0,5}身高/gim.test(
                    dynamic_content
                );
            let manual_re15 =
                /.*评论.{0,20}分享|.*评论.{0,20}互动((?!抽奖|,|，|来).)*$|.*评论.{0,20}提问|.*想问.{0,20}评论|.*想说.{0,20}评论|.*想问.{0,20}留言|.*想说.{0,20}留言/gim.test(
                    dynamic_content
                );
            let manual_re16 = /.*评论.{0,10}聊.{0,10}聊/gim.test(
                dynamic_content
            );
            let manual_re17 = /.*评.{0,10}接力/gim.test(
                dynamic_content
            );
            let manual_re18 =
                /.*聊.{0,10}聊|有没有.{0,20}事.{0,5}？/gim.test(
                    dynamic_content
                );
            let manual_re19 =
                /.*评论.{0,10}扣|.*评论.{0,5}说.{0,3}下/gim.test(
                    dynamic_content
                );
            let manual_re20 = /.*转发.{0,10}分享/gim.test(
                dynamic_content
            );
            let manual_re21 = /.*评论.{0,10}告诉/gim.test(
                dynamic_content
            );
            let manual_re22 = /.*评论.{0,10}唠.{0,10}唠/gim.test(
                dynamic_content
            );
            let manual_re23 =
                /.*今日.{0,5}话题|.*参与.{0,5}话题|.*参与.{0,5}答题/gim.test(
                    dynamic_content
                );
            let manual_re24 = /.*说.*答案|.*评论.{0,15}答案/gim.test(
                dynamic_content
            );
            let manual_re25 = /.*说出/gim.test(dynamic_content);
            let manual_re26 = /.*为.{0,10}加油/gim.test(
                dynamic_content
            );
            let manual_re27 =
                /.*评论.{0,10}话|.*你中意的|.*评.{0,10}你.{0,5}的|.*写上.{0,10}你.{0,5}的|.*写下.{0,10}你.{0,5}的/gim.test(
                    dynamic_content
                );
            let manual_re28 =
                /.*评论.{0,15}最想做7的事|.*评.{0,15}最喜欢|.*评.{0,15}最.{0,7}的事|.*最想定制的画面|最想.{0,20}\?|最想.{0,20}？/gim.test(
                    dynamic_content
                );
            let manual_re29 =
                /.*分享.{0,20}经历|.*经历.{0,20}分享/gim.test(
                    dynamic_content
                );
            let manual_re30 = /.*分享.{0,20}心情/gim.test(
                dynamic_content
            );
            let manual_re31 = /.*评论.{0,10}句|评论.{0,6}包含/gim.test(
                dynamic_content
            );
            let manual_re32 = /.*转关评下方视频/gim.test(
                dynamic_content
            );
            let manual_re33 =
                /.*分享.{0,10}美好|.*分享.{0,10}期待/gim.test(
                    dynamic_content
                );
            let manual_re34 = /.*视频.{0,10}弹幕/gim.test(
                dynamic_content
            );
            let manual_re35 = /.*生日快乐/gim.test(dynamic_content);
            let manual_re36 = /.*一句话形容/gim.test(dynamic_content);
            let manual_re38 =
                /.*分享.{0,10}喜爱|.*分享.{0,10}最爱|.*推荐.{0,10}最爱|.*推荐.{0,10}喜爱/gim.test(
                    dynamic_content
                );
            let manual_re39 =
                /.*分享((?![,，]).){0,10}最|.*评论((?![,，]).){0,10}最/gim.test(
                    dynamic_content
                );
            let manual_re40 =
                /.*带话题.{0,15}晒|.*带话题.{0,15}讨论/gim.test(
                    dynamic_content
                );
            let manual_re41 =
                /.*分享.{0,15}事|点赞.{0,3}数.{0,3}前/gim.test(
                    dynamic_content
                );
            let manual_re42 = /.*送出.{0,15}祝福/gim.test(
                dynamic_content
            );
            let manual_re43 = /.*评论.{0,30}原因/gim.test(
                dynamic_content
            );
            let manual_re47 = /.*答案.{0,10}参与/gim.test(
                dynamic_content
            );
            let manual_re48 = /.*唠.{0,5}唠/gim.test(dynamic_content);
            let manual_re49 = /.*分享一下/gim.test(dynamic_content);
            let manual_re50 = /.*评论.{0,30}故事/gim.test(
                dynamic_content
            );
            let manual_re51 =
                /.*告诉.{0,30}什么|.*告诉.{0,30}最|有什么安排呀～/gim.test(
                    dynamic_content
                );
            let manual_re53 = /.*发布.{0,20}图.{0,5}动态/gim.test(
                dynamic_content
            );
            let manual_re54 = /.*视频.{0,20}评论/gim.test(
                dynamic_content
            );
            let manual_re55 = /.*复zhi|.*长按/gim.test(dynamic_content);
            let manual_re56 = /.*多少.{0,10}合适/gim.test(
                dynamic_content
            );
            let manual_re57 = /.*喜欢.{0,5}哪/gim.test(dynamic_content);
            let manual_re58 =
                /.*多少.{0,15}？|.*多少.{0,15}\?|.*有没有.{0,15}？|.*有没有.{0,15}\?|.*是什么.{0,15}？|.*是什么.{0,15}\?/gim.test(
                    dynamic_content
                );
            let manual_re61 = /.*看.{0,10}猜/gim.test(dynamic_content);
            let manual_re63 =
                /.*评论.{0,10}猜|.*评论.{0,15}预测|选择.{0,5}任意.{0,17}评论/gim.test(
                    dynamic_content
                );
            let manual_re65 = /.*老规矩你们懂的/gim.test(
                dynamic_content
            );
            let manual_re67 =
                /.*[评|带]((?!抽奖|,|，|来).){0,7}“|.*[评|带]((?!抽奖|,|，|来).){0,7}"|.*[评|带]((?!抽奖|,|，|来).){0,7}【|.*[评|带]((?!抽奖|,|，|来).){0,7}：|.*[评|带]((?!抽奖|,|，|来).){0,7}「|.*带关键词.{0,7}"|.*评论关键词[“”‘’"']|.*留言((?!抽奖|,|，|来).){0,7}“|.*对出.{0,10}下联.{0,5}横批|.*回答.{0,8}问题|.*留下.{0,10}祝福语|.*留下.{0,10}愿望|.*找到.{0,10}不同的.{0,10}留言|.*答案放在评论区|.*几.{0,5}呢？|.*有奖问答|.*想到.{0,19}关于.{0,20}告诉|.*麻烦大伙评论这个|报暗号【.{0,4}】|评论.{0,3}输入.{0,3}["“”:：]|.*评论.{0,7}暗号/gim.test(
                    dynamic_content
                );
            let manual_re76 =
                /.*留言((?!抽奖|,|，|来).).{0,7}"|.*留下((?!抽奖|,|，|来).){0,5}“|.*留下((?!抽奖|,|，|来).){0,5}【|.*留下((?!抽奖|,|，|来).){0,5}：|.*留下((?!抽奖|,|，|来).){0,5}「/gim.test(
                    dynamic_content
                );
            let manual_re77 =
                /.*留言((?!抽奖|,|，|来).).{0,7}"|.*留言((?!抽奖|,|，|来).).{0,7}“|.*留言((?!抽奖|,|，|来).){0,7}【|.*留言((?!抽奖|,|，|来).){0,7}：|.*留言((?!抽奖|,|，|来).){0,7}「/gim.test(
                    dynamic_content
                );
            let manual_re64 =
                /和.{0,5}分享.{0,5}的|.*分享.{0,10}你的|.*正确回答|.*回答正确|.*评论.{0,10}计划|.*定.{0,10}目标.{0,5}？|.*定.{0,10}目标.{0,5}?|.*评论.{0,7}看的电影|.*如果.{0,20}觉得.{0,10}？|.*如果.{0,20}觉得.{0,10}\?|评论.{0,7}希望.{0,5}|.*竞猜[\s\S]{0,15}[答评]|.*把喜欢的.{0,10}评论|.*评论.{0,5}解.{0,5}密|.*这款.{0,10}怎么.{0,3}？|.*最喜欢.{0,5}的.*为什么？|.*留下.{0,15}的.{0,5}疑问|.*写下.{0,10}的.{0,5}问题/gim.test(
                    dynamic_content
                );
            let manual_re6 =
                /.*@TA|.*@.{0,15}朋友|.*艾特|.*@.{0,3}你的|.*标记.{0,10}朋友|.*@{0,15}赞助商|.*发表你的新年愿望\+个人的昵称|.*抽奖规则请仔细看图片|.*带上用户名|.*活动详情请戳图片|.*@个人用户名|评论.{0,5}附带.{0,10}相关内容|回复.{0,5}视频.{0,10}相关内容|.*评论.{0,5}昵称|转发.{0,8}并@/gim.test(
                    dynamic_content
                );
            let manual_re62 =
                /.*评论.{0,10}#.*什么|.*转评.{0,3}#.*(?<=，)/gim.test(
                    dynamic_content
                );
            let manual_re68 =
                /.*将.{0,10}内容.{0,10}评|.*打几分？/gim.test(
                    dynamic_content
                );
            let manual_re70 =
                /.*会不会.{0,20}？|.*会不会.{0,20}\?|如何.{0,20}？|如何.{0,20}\?/gim.test(
                    dynamic_content
                );
            let manual_re71 =
                /.*猜.{0,10}猜|.*猜.{0,10}比分|.*猜中.{0,10}获得|.*猜中.{0,10}送出/gim.test(
                    dynamic_content
                );
            let manual_re72 = /.*生日|.*新年祝福/gim.test(
                dynamic_content
            );
            let manual_re73 =
                /.*知道.{0,15}什么.{0,15}？|.*知道.{0,15}什么.{0,15}\?|.*用什么|.*评.{0,10}收.{0,5}什么.{0.7}\?|.*评.{0,10}收.{0,5}什么.{0,7}？|.*抽奖口令.{0,3}：/gim.test(
                    dynamic_content
                );
            let manual_re74 =
                /.*领.{0,10}红包.{0,5}大小|.*领.{0,10}多少.{0,10}红包|.*红包金额/gim.test(
                    dynamic_content
                );
            let manual_re75 =
                /.*本周话题|.*互动话题|.*互动留言|.*互动时间|.*征集.{0,10}名字|.*征集.{0,15}外号|.*投票.{0,5}选.{0,10}最.{0,5}的|.*投票.{0,10}评论|.*一人说一个谐音梗|帮.{0,5}想想.{0,5}怎么|评论.{0,5}想给.{0,7}的|取.{0,7}名字/gim.test(
                    dynamic_content
                );

            return (
                manual_re1 ||
                manual_re2 ||
                manual_re3 ||
                manual_re4 ||
                manual_re5 ||
                manual_re6 ||
                manual_re7 ||
                manual_re8 ||
                manual_re9 ||
                manual_re11 ||
                manual_re12 ||
                manual_re14 ||
                manual_re15 ||
                manual_re16 ||
                manual_re17 ||
                manual_re18 ||
                manual_re19 ||
                manual_re20 ||
                manual_re21 ||
                manual_re22 ||
                manual_re23 ||
                manual_re24 ||
                manual_re25 ||
                manual_re26 ||
                manual_re27 ||
                manual_re28 ||
                manual_re29 ||
                manual_re30 ||
                manual_re31 ||
                manual_re32 ||
                manual_re33 ||
                manual_re34 ||
                manual_re35 ||
                manual_re36 ||
                manual_re38 ||
                manual_re39 ||
                manual_re40 ||
                manual_re41 ||
                manual_re42 ||
                manual_re43 ||
                manual_re76 ||
                manual_re47 ||
                manual_re48 ||
                manual_re49 ||
                manual_re50 ||
                manual_re51 ||
                manual_re53 ||
                manual_re54 ||
                manual_re58 ||
                manual_re55 ||
                manual_re56 ||
                manual_re57 ||
                manual_re61 ||
                manual_re62 ||
                manual_re63 ||
                manual_re64 ||
                manual_re65 ||
                manual_re67 ||
                manual_re68 ||
                manual_re70 ||
                manual_re71 ||
                manual_re72 ||
                manual_re73 ||
                manual_re74 ||
                manual_re75 ||
                manual_re77 ||
                manual_re77
            );
        },
        /**
         * 返回true代表这个动态不是抽奖up的动态，不能转发评论
         * @return {boolean}
         */
        non_lottery_up_judge: () => {
            try {
                let non_lottery_up_mids = GLOBAL_CONFIG.lot_module
                    .non_lottery_up_mids
                    ? GLOBAL_CONFIG.lot_module.non_lottery_up_mids
                    : [
                        "571791768",
                        "391464745",
                        "14064125",
                        "332793152",
                        "54790268",
                        "46880349",
                        //"294887687",
                        "3493120108923438",
                        "3537106980833281",
                        "3532811",
                        "1508263674",
                    ];
                let up_mid =
                    this.global_var.response.global_dynamic_data.item.modules.module_author.mid.toString();
                return non_lottery_up_mids.includes(up_mid);
            } catch (e) {
                console.error(`${this.log_name}${this.page_url}\t判断非抽奖up失败\t${e.stack}`);
                return false
            }
        },
        key_word_reply: (dynamic_content) => {
            if (
                /.*[评|带]((?!抽奖|,|，|来).){0,7}“|.*[评|带]((?!抽奖|,|，|来).){0,7}"|.*[评|带]((?!抽奖|,|，|来).){0,7}【|.*[评|带]((?!抽奖|,|，|来).){0,7}:|.*[评|带]((?!抽奖|,|，|来).){0,7}：|.*[评|带]((?!抽奖|,|，|来).){0,7}「|.*带关键词.{0,7}"|.*评论关键词[“”‘’"']|.*留言((?!抽奖|,|，|来).){0,7}“|.*对出.{0,10}下联.{0,5}横批|.*回答.{0,8}问题|.*留下.{0,10}祝福语|.*留下.{0,10}愿望|.*找到.{0,10}不同的.{0,10}留言|.*答案放在评论区|.*几.{0,5}呢？|.*有奖问答|.*想到.{0,19}关于.{0,20}告诉|.*麻烦大伙评论这个|留下.{0,7}的|报暗号【.{0,4}】/gim.test(
                    dynamic_content
                ) ||
                /.*留下((?!抽奖|,|，).){0,5}“|.*留下((?!抽奖|,|，).){0,5}【|.*留下((?!抽奖|,|，).){0,5}:|.*留下((?!抽奖|,|，).){0,5}：|.*留下((?!抽奖|,|，).){0,5}「/gim.test(
                    dynamic_content
                ) ||
                /.*留言((?!抽奖|,|，).).{0,7}“|.*留言((?!抽奖|,|，).){0,7}【|.*留言((?!抽奖|,|，).){0,7}:|.*留言((?!抽奖|,|，).){0,7}：|.*留言((?!抽奖|,|，).){0,7}「/gim.test(
                    dynamic_content
                ) ||
                /.*分享.{0,10}你的|.*正确回答|.*回答正确|.*评论.{0,10}计划|.*定.{0,10}目标.{0,5}？|.*定.{0,10}目标.{0,5}?|.*评论.{0,7}看的电影|.*如果.{0,20}觉得.{0,10}？|.*如果.{0,20}觉得.{0,10}\?|评论.{0,7}希望.{0,5}|.*竞猜[\s\S]{0,15}答|.*把喜欢的.{0,10}评论|.*评论.{0,5}解.{0,5}密|.*这款.{0,10}怎么.{0,3}？|.*最喜欢.{0,5}的.*为什么？|.*留下.{0,15}的.{0,5}疑问|.*写下.{0,10}的.{0,5}问题/gim.test(
                    dynamic_content
                ) ||
                /.*@TA|.*@.{0,15}朋友|.*艾特|.*@.{0,3}你的|.*标记.{0,10}朋友|.*@{0,15}赞助商|.*发表你的新年愿望\+个人的昵称|.*抽奖规则请仔细看图片|.*带上用户名|.*活动详情请戳图片|.*@个人用户名|评论.{0,5}附带.{0,10}相关内容|回复.{0,5}视频.{0,10}相关内容/gim.test(
                    dynamic_content
                ) ||
                /.*评论.{0,10}#.*什么|.*转评.{0,3}#.*(?<=，)/gim.test(
                    dynamic_content
                ) ||
                /.*本周话题|.*互动话题|.*互动留言|.*互动时间|.*征集.{0,10}名字/gim.test(
                    dynamic_content
                )
            ) {
                //如果是指定回复某个评论直接返回undefined
                return undefined;
            }
            if (
                /.*留下((?!抽奖).){0,5}“|.*留下((?!抽奖).){0,5}【|.*留下((?!抽奖).){0,5}:|.*留下((?!抽奖).){0,5}：|.*留下((?!抽奖).){0,5}「/gim.test(
                    dynamic_content
                )
            ) {
                return undefined;
            }
            if (
                /.*猜.{0,10}猜|.*猜.{0,10}比分|.*猜中.{0,10}获得/gim.test(
                    dynamic_content
                )
            ) {
                return undefined;
            }
            if (
                /.*领到多少红包|.*领.{0,3}到.{0,3}红包大小|.*评论.{0,10}红包金额|留言.{0,10}红包金额|.*领.{0,3}的.{0,3}红包大小/gim.test(
                    dynamic_content
                )
            ) {
                return this.lottery_setting.key_word_comment.red_pocket;
            }
            if (/.*喜欢.{0,5}零食/gim.test(dynamic_content)) {
                if (this.lottery_setting.key_word_comment.favorite_food.length > 0) {
                    return (
                        utils.Common.random_choice([
                            "",
                            "最爱",
                            "喜欢",
                            "想吃",
                            "",
                            "",
                        ]) +
                        utils.Common.random_choice(
                            this.lottery_setting.key_word_comment
                                .favorite_food
                        )
                    );
                } else {
                    return (
                        utils.Common.random_choice([
                            "",
                            "最爱",
                            "喜欢",
                            "想吃",
                            "",
                            "",
                        ]) +
                        utils.Common.random_choice([
                            "薯片",
                            "巧克力",
                            "辣条",
                            "冰淇淋",
                            "肉松饼",
                            "魔芋爽",
                            "小酥肉",
                            "烤冷面",
                            "鸡柳",
                            "曲奇饼干",
                            "芒果干",
                            "猪肉脯",
                        ])
                    );
                }
            }
            if (
                /.*喜欢.{0,5}颜色|.*最爱.{0,5}颜色/gim.test(
                    dynamic_content
                )
            ) {
                if (this.lottery_setting.key_word_comment.favorite_color) {
                    return (
                        utils.Common.random_choice(["", "喜欢", "", ""]) +
                        utils.Common.random_choice(
                            this.lottery_setting.key_word_comment
                                .favorite_color
                        )
                    );
                } else {
                    return (
                        utils.Common.random_choice(["", "喜欢", "", ""]) +
                        utils.Common.random_choice(["白色", "黑色", "红色"])
                    );
                }
            }
            if (
                /.*生日季|.*生日回|.*生日会|.*生日祝福|.*岁生日/gim.test(
                    dynamic_content
                )
            ) {
                if (
                    this.lottery_setting.key_word_comment
                        .birthday_congratulation
                ) {
                    return utils.Common.random_choice(
                        this.lottery_setting.key_word_comment
                            .birthday_congratulation
                    );
                } else {
                    return utils.Common.random_choice([
                        "生快",
                        "生日快乐！",
                        "生日快乐呀",
                    ]);
                }
            }
            if (/.*新年祝福/gim.test(dynamic_content)) {
                if (
                    this.lottery_setting.key_word_comment
                        .newyear_congratulation
                ) {
                    return utils.Common.random_choice(
                        this.lottery_setting.key_word_comment
                            .newyear_congratulation
                    );
                } else {
                    return utils.Common.random_choice([
                        "祝新年福满天！",
                        "新年快乐！",
                        "新年快乐呀",
                    ]);
                }
            }
            if (
                /.*长按.{0,5}复制|.*复制.{0,5}长按|.*长按.{0,5}fu制|.*长按.{0,5}copy/gim.test(
                    dynamic_content
                )
            ) {
                if (this.lottery_setting.key_word_comment.qiafan_promotion) {
                    return utils.Common.random_choice(
                        this.lottery_setting.key_word_comment
                            .qiafan_promotion
                    );
                } else {
                    return undefined;
                }
            }
            return undefined;
        },
        /**
         * 判断是否需要转发评论的内容  true:转发评论的内容 false:转发默认内容
         */
        repost_with_comment_judge: (dynamic_content) => {
            dynamic_content =
                this.comment_op.pre_process_dynamic_content(
                    dynamic_content
                );
            return /.*转发.{0,5}含关键词|转发.{0,8}并@/gim.test(
                dynamic_content
            );
        },
        /**
         *  返回undefined表示需要人工回复，而不是从预设的回复里面选内容
         * @param dynamic_content
         * @param dynamic_id
         * @param record_data
         * @return {Promise<undefined|string>}
         */
        reply_comment_generator: async (dynamic_content,dynamic_id,record_data) => {
            //生成所需评论//生成评论
            let comment_msg = undefined;
            if (
                this.comment_op.non_lottery_up_judge()
            ) {
                console.log("包含非抽奖up，跳过");
                await this.log_record.my_throw(BiliElementMap.log_record.succ_info.manual_reply_non_lottery_up);
                record_data.err_msg = BiliElementMap.log_record.succ_info.manual_reply_non_lottery_up
                await this.log_record.dynamic_lottery_record(record_data)
                return undefined
            }
            let pre_msg = "";
            pre_msg = this.comment_op.pre_msg_processing(
                dynamic_content,
                comment_msg
            );
            if (
                this.comment_op.manual_reply_judge(
                    dynamic_content
                ) ||
                this.global_var.response.global_dynamic_data.item.basic
                    .comment_type === 1 ||
                pre_msg === undefined
            ) {
                //先判断是否要人工回复 视频全部抄
                let key_reply =
                    this.comment_op.key_word_reply(
                        dynamic_content
                    ); //再判断是否包含关键词回复
                if (!key_reply) {
                    //如果没有关键词，那就判断是否抄评论或者直接交给人工回复
                    /** next的值为 0: 抄评论 1:AI回复 2:人工回复
                     * @type {{prev:number,next:number}}
                     */
                    let e = {prev: 0, next: 0};
                    let copy_msg_flag =
                        this.global_var.response.reply_main?.code === 12061
                            ? false
                            : this.copy_reply_op.copy_reply_judge(
                                dynamic_content
                            ) ||
                            this.global_var.response.global_dynamic_data
                                .item.basic.comment_type === 1;
                    if (!copy_msg_flag) {
                        //如果不能抄评论，先设置为人工回复
                        e.next = 2;
                    }
                    if (
                        copy_msg_flag &&
                        Math.random() <
                        this.lottery_setting.copy_reply_module
                            .comment_copy_chance
                    ) {
                        //优先顺序为：1:先抄评论；2:AI写评论；3:如果AI没写出来就抄评论；4:人工回复
                        e.next = 0;
                    } else if (
                        Math.random() <
                        this.lottery_setting.copy_reply_module
                            .AI_reply_chance
                    ) {
                        e.next = 1;
                    } else {
                        e.next = 2;
                    }
                    if (pre_msg === undefined) {
                        //话题获取失败了，直接开抄！
                        if (
                            0 <
                            this.lottery_setting.copy_reply_module
                                .comment_copy_chance ||
                            0 <
                            this.lottery_setting.copy_reply_module
                                .AI_reply_chance
                        ) {
                            e.next = 0;
                            pre_msg = "";
                        }
                    }
                    //0: 抄评论 1:AI回复 2:人工回复 99: 退出
                    let get_comment_times = 0;
                    while (!comment_msg) {
                        get_comment_times++;
                        switch ((e.prev = e.next)) {
                            case 0:
                                console.log(this.log_format(`可以抄评论的动态\t${this.page_url}`));
                                let copy_msg;
                                let para_msg;
                                try {
                                    if (this.global_var.response.global_dynamic_data.item.basic.comment_type === 1 ||
                                        this.global_var.response.global_dynamic_data.item.basic.comment_type === 8 ||
                                        1 === 1) {
                                        copy_msg =
                                            await this.copy_reply_op.get_copy_reply(
                                                dynamic_id,
                                                1,
                                                Math.random(),
                                                true,
                                                dynamic_content
                                            );
                                    } else {
                                        copy_msg =
                                            await this.copy_reply_op.get_copy_reply(
                                                dynamic_id,
                                                1,
                                                0.01,
                                                false,
                                                dynamic_content
                                            );
                                    }
                                    console.log(
                                        `${
                                            this.log_name
                                        }抄取评论：${copy_msg}\t${this.now}`
                                    );
                                    pre_msg = pre_msg ? pre_msg : "";
                                } catch (e) {
                                    console.error(this.log_format(`获取抄评论内容失败，设置为人工回复动态！\n${e.stack}`));
                                    e.next = 2;
                                    break;
                                }
                                if (this.copy_reply_op.para_phase_judge(dynamic_content)) {
                                    //判断是否是可以进行同义改写
                                    if (copy_msg && Math.random() < this.lottery_setting.copy_reply_module.comment_paraphrase_chance) {
                                        try {
                                            console.log(this.log_format(`将要进行改写的评论：${copy_msg}`));
                                            para_msg = await this.copy_reply_op.ChatGPT_paraphase(copy_msg);
                                            console.log(this.log_format(`原评论：${copy_msg}\n改写为评论：${para_msg}`));
                                        } catch (e) {
                                            console.error(this.log_format(`获取同义改写内容失败，reply_comment_generator\n${e.stack}`));
                                        }
                                    }
                                } else {
                                    console.warn(
                                        this.log_format(`${this.page_url}\t特殊动态内容无法使用同义改写`)
                                    );
                                }
                                comment_msg = para_msg === undefined || para_msg === "" ? copy_msg : para_msg;
                                if (!comment_msg){
                                    e.next=99;
                                    console.error(this.log_format(`${this.page_url}\t评论内容为空，跳过！`));
                                }
                                break;
                            case 1:
                                try {
                                    comment_msg = await this.copy_reply_op.ChatGpt_reply(dynamic_content);
                                    if (comment_msg === "" || comment_msg === undefined) {
                                        //AI回复生成失败，判断抄评论是否开启，开启的话执行抄评论
                                        console.error(this.log_format(`${this.page_url}\tAI回复失败！启动抄评论模式\n${err.stack}`));
                                    }
                                } catch (err) {
                                    console.error(this.log_format(`${this.page_url}\tAI回复失败！启动抄评论模式\n${err.stack}`));
                                } finally {
                                    if (this.lottery_setting.copy_reply_module.comment_copy_chance > 0) {
                                        e.next = 0;
                                    } else {
                                        e.next = 2;
                                    }
                                }
                                break;
                            case 2:
                                comment_msg = BiliElementMap.log_record.succ_info.manual_reply;
                                console.log(
                                    this.log_format(`${this.page_url}\t${comment_msg}\t${dynamic_id}`)
                                );
                                await this.log_record.my_throw(
                                    BiliElementMap.log_record.succ_info.manual_reply
                                );
                                record_data.err_msg = BiliElementMap.log_record.succ_info.manual_reply
                                await this.log_record.dynamic_lottery_record(record_data)
                                return undefined; //返回undefined表示需要人工回复，而不是从预设的回复里面选内容
                            case 99:
                                console.error(
                                    this.log_format(`生成评论失败！获取评论次数${get_comment_times}超过3次\t获取评论失败！`)
                                );
                                comment_msg = BiliElementMap.log_record.succ_info.manual_reply;
                                await this.log_record.my_throw(
                                    BiliElementMap.log_record.opus_dynamic.err.comment.comment_msg_generate_fail
                                );
                                record_data.err_msg = BiliElementMap.log_record.opus_dynamic.err.comment.comment_msg_generate_fail
                                await this.log_record.dynamic_lottery_record(record_data)
                                return undefined; //返回undefined表示需要人工回复，而不是从预设的回复里面选内容
                        }
                        await sleep(3e3);
                    }
                } else {
                    console.log(
                        this.log_format(`${this.page_url}\n触发关键词回复:${dynamic_content}`)
                    );
                    comment_msg = key_reply;
                }
            }

            if (
                typeof comment_msg == "string" &&
                comment_msg.includes(BiliElementMap.log_record.succ_info.manual_reply)
            ) {
                comment_msg = undefined;
            }

            let official_type =
                this.global_var.response.global_dynamic_data?.item?.modules
                    ?.module_author?.official_verify?.type;
            if (official_type === undefined) {
                console.warn(this.log_format(`${this.page_url}\t获取动态发布者认证类型失败！`))
            }
            if (!comment_msg) {
                comment_msg = utils.Common.random_choice(
                    this.lottery_setting.lottery_module.defined_reply_msg
                );
                if (official_type === 1) {
                    comment_msg = utils.Common.random_choice(
                        this.lottery_setting.lottery_module.reply_contents
                    );
                } else {
                    comment_msg = utils.Common.random_choice(
                        this.lottery_setting.lottery_module.non_official_chp
                    );
                }
            }

            //最后检查一下回复内容是否正常
            if (
                !comment_msg ||
                typeof comment_msg != "string" ||
                pre_msg === undefined
            ) {
                console.error(
                    `${this.log_name}${this.page_url}\n回复内容出错:${dynamic_content}`
                );
                await this.log_record.my_throw(BiliElementMap.log_record.opus_dynamic.err.comment.comment_msg_content_error);
                return undefined;
            }
            if (comment_msg.includes(pre_msg)) {
                pre_msg = "";
            }
            return pre_msg + comment_msg;
        },
    }
    copy_reply_op = {
        //抄评论模块
        ignore_replies: [
            //无视掉的抄评论词
            `转发了`,
            `转发动态`,
            `秋梨膏`,
            `我我我`,
            `永不缺席`,
            `永不中奖`,
            `永不放弃`,
            `好运`,
            `说不定呢`,
            `冲`,
            `凑热闹`,
            `永不缺席`,
            `无所谓`,
            "来了",
            "期待",
            "好",
            "来了来了",
            "好好好",
            "抽我",
            "抽我抽我",
            "下午好",
            "早上好",
            "中午好",
            "晚上好",
            "重在参与",
            "许愿",
            "加油点赞",
            "支持支持",
            "支持",
            "好耶",
            "1",
            "不错啊",
            "许愿呀",
            "锦鲤附体",
            "用自己的微薄之力给up撑腰",
            "冲冲冲",
            "做个梦",
            "幸运儿来啦！",
            "来力来力",
            "坚持不懈，迎难而上，开拓创新！",
            "我",
            "中",
            "来力",
            "开心",
            "可以",
            "来啦",
            "万一呢",
            "加油加油!",
            "加油加油！",
            "点赞",
            "真棒",
            "坚持不懈，迎难而上",
            "谢谢宠粉祝粉丝越来越多发展越来越好",
            "大家注意看，这是",
            "他真是太宠粉了，请多点点关注",
            "许个愿，我永远支持up主，祝愿你的粉丝越来越多，感谢有你啊",
            "希望你们中",
            "我是天选之子",
            "太酷了！！！！必须支持",
        ],
        /**
         *
         * @param {string} dynamic_id_or_BVid
         * @param {number} mode 1是热评，2是最新 ，3是混合
         * @param {number} pn_percent 评论大致的百分比页数，入参是小数
         * @param {boolean} get_api_reply_resp_flag true是获取api响应，false则使用global_var里面的评论响应
         * @param {String} dynamic_content 动态内容
         * @returns
         */
        get_copy_reply: async (
            dynamic_id_or_BVid,
            mode,
            pn_percent,
            get_api_reply_resp_flag,
            dynamic_content = ""
        ) => {
            //，获取的评论是去掉了@和表情包的
            //dynamic_id_or_BVid:动态id或bv号 mode ：1是热评，2是最新 ，3是混合 pn_percent：评论大致的百分比页数，入参是小数
            let all_replies_content = [];
            let ret_reply; //最终返回的评论
            let pn_list = [];
            let loop_times = 3;
            if (!get_api_reply_resp_flag) loop_times = 1;
            for (let _ = 0; _ < loop_times; _++) {
                //超过就退出,进行随机抽取
                let resp =
                    await this.copy_reply_op.get_reply_list(
                        dynamic_id_or_BVid,
                        mode,
                        pn_percent,
                        get_api_reply_resp_flag,
                        dynamic_content,
                        pn_list
                    );
                all_replies_content = all_replies_content.concat(
                    resp.ret_list
                );
                pn_list.push(resp.pn);
                if (resp.reply_count <= 10) {
                    //没有评论直接退出
                    break;
                }
                if (all_replies_content.length <= 15) {
                    //如果只获取到了一半的话，再获取一点，不然样本数量不够
                    resp =
                        await this.copy_reply_op.get_reply_list(
                            dynamic_id_or_BVid,
                            mode,
                            Math.random(),
                            true,
                            dynamic_content,
                            pn_list
                        );
                    all_replies_content = all_replies_content.concat(
                        resp.ret_list
                    );
                    pn_list.push(resp.pn);
                }
                if (all_replies_content.length <= 15) {
                    continue;
                }
                console.log(
                    `${this.log_name}${this.page_url}获取到的所有评论，获取了 ${pn_list} 页数\n总获取次数：${loop_times}次！${this.now}`
                );
                console.log(all_replies_content);
                if (!!ret_reply) {
                    break;
                }
                pn_percent = Math.random(); //每次循环设置为随机值，防止一直获取同样内容
                await sleep(10e3);
                if (resp.reply_count <= 10) {
                    //没有评论直接退出
                    break;
                }
            }
            if (all_replies_content.length >= 15) {
                ret_reply = utils.Common.weight_rand(all_replies_content);
            }
            return ret_reply;
        },
        /**
         * 获取评论并移除表情包和话题和@，除非是动态里有的话题和@
         * @param {string} dynamic_id_or_BVid
         * @param {number} mode 1是热评，2是最新 ，3是混合
         * @param {number} pn_percent 评论大致的百分比页数，入参是小数
         * @param {boolean} get_api_reply_resp_flag true是获取api响应，false则使用global_var里面的评论响应
         * @param {string} dynamic_content 动态内容
         * @param {number[]} pn_list 获取过的评论页数
         * @returns {Promise<{ret_list: string[], reply_count: number}>} { ret_list, reply_count }
         */
        get_reply_list: async (
            dynamic_id_or_BVid,
            mode,
            pn_percent,
            get_api_reply_resp_flag,
            dynamic_content = "",
            pn_list = []
        ) => {
            if (
                !(
                    this.global_var.response.reply_main &&
                    this.global_var.response.reply_main.code === 0
                )
            ) {
                //如果global_var的响应没问题
                if (get_api_reply_resp_flag === undefined) {
                    get_api_reply_resp_flag = false;
                }
            }
            let ret_list = [];
            let pn = 0;
            let dynDetail_data =
                this.global_var.response.global_dynamic_data;
            let comment_id_str;
            let comment_type;
            let reply_count = 0;
            let up_mid = 0;
            let get_comment_page = 0; //获取评论页数，20条评论一页
            let reply_main_res;
            let get_api_fail = false; //true代表获取api失败

            if (
                !String(dynamic_id_or_BVid).toUpperCase().includes("BV")
            ) {
                //如果是动态id
                if (
                    dynDetail_data === undefined ||
                    dynDetail_data === -412 ||
                    this.global_var.response.reply_main === undefined
                ) {
                    let dynamic_detail_res =
                        await utils.BiliAPI.BiliAPI.get_dynamic_v1_detail(
                            String(dynamic_id_or_BVid)
                        );
                    //dynamic_detail_res:动态的完整响应 mode ：1是热评，2是最新 ，3是混合 pn_percent：评论大致的百分比页数，入参是小数
                    if (dynamic_detail_res.code !== 0) {
                        console.error(`${this.log_name}${this.page_url}\t获取评论失败，响应业务码不为0\n${JSON.stringify(dynamic_detail_res)}\n${dynamic_id_or_BVid}\n${this.now}`);
                        return {ret_list, reply_count, pn: -1};
                    }
                    comment_id_str =
                        dynamic_detail_res.data.item.basic
                            .comment_id_str;
                    comment_type =
                        dynamic_detail_res.data.item.basic.comment_type;
                    reply_count =
                        dynamic_detail_res.data.item.modules.module_stat
                            .comment.count;
                    try {
                        up_mid =
                            dynamic_detail_res.data.item.modules
                                .module_author.mid;
                    } catch (e) {
                        console.error(`${this.log_name}${this.page_url}\tget_reply_list失败\n${e.stack}\n${this.now}`);
                    }
                } else {
                    comment_id_str =
                        dynDetail_data.item.basic.comment_id_str;
                    comment_type =
                        dynDetail_data.item.basic.comment_type;
                    reply_count =
                        dynDetail_data.item.modules.module_stat.comment
                            .count;
                    try {
                        up_mid =
                            dynDetail_data.item.modules.module_author
                                .mid;
                    } catch (e) {
                        console.error(`${this.log_name}${this.page_url}\tget_reply_list失败，获取up_mid失败！\n${e.stack}\n${this.now}`);
                    }
                }
            } else {
                //如果是视频
                comment_id_str = utils.BiliAPI.BiliAPI.BV_AV_trans(dynamic_id_or_BVid);
                reply_count = 1000;
                comment_type = "1";
            }
            if (
                get_api_reply_resp_flag ||
                this.global_var.response.reply_main === undefined ||
                get_api_fail
            ) {
                get_comment_page = Math.floor(
                    Math.ceil(reply_count * pn_percent) / 20
                );
                if (pn_list.indexOf(get_comment_page) > -1) {
                    get_comment_page = utils.Common.random_choice(
                        Array.from(
                            {length: Math.ceil(reply_count / 20)},
                            (_, i) => 1 + i
                        ).filter((x) => pn_list.indexOf(x) === -1)
                    );
                }
                pn = get_comment_page;
                reply_main_res = await utils.BiliAPI.BiliAPI.get_reply(
                    mode,
                    get_comment_page,
                    comment_id_str,
                    comment_type
                );
                if (!reply_main_res.code) {
                    up_mid = reply_main_res.data?.upper?.mid;
                } else {
                    console.error(`${this.log_name}${this.page_url}\t评论api获取数据失败！\n${JSON.stringify(
                        reply_main_res
                    )}\n${this.now}`);
                }
            } else {
                reply_main_res = this.global_var.response.reply_main;
                up_mid = this.global_var.response.reply_main.data.upper.mid;
            }
            if (reply_main_res.code !== 0) {
                console.error(`${this.log_name}${this.page_url}\t获取评论失败，响应业务码不为0\n${JSON.stringify(reply_main_res)}\n${this.now}`);
                if (
                    this.global_var.response.reply_main &&
                    this.global_var.response.reply_main.code === 0
                ) {
                    reply_main_res = this.global_var.response.reply_main;
                }
            }
            let replies = reply_main_res.data.replies;
            if (replies.length < 5) {
                console.warn(`${this.log_name}${this.page_url}\t评论数量过少，不抄了\n${JSON.stringify(reply_main_res)}\n${this.now}`);
                return {ret_list, reply_count, pn: -1};
            }
            let replies_content = [...Array(replies.length)].map(
                (x) => undefined
            );
            for (
                let repindex = 0;
                repindex < replies.length;
                repindex++
            ) {
                //去除表情包
                try {
                    utils.BiliAPI.fileWrite(
                        GLOBAL_CONFIG.file_path.comment_resp_record,
                        JSON.stringify(replies[repindex]),
                        "a+"
                    );
                } catch {
                    console.warn("记录评论内容失败！");
                }
                if (replies[repindex].mid === up_mid) {
                    //不抄取up的评论
                    continue;
                }
                replies_content[repindex] = utils.Common
                    .remove_emoji_topic_at(
                        replies[repindex].content.message.replaceAll(
                            replies[repindex].member.uname, //替换at的自己的用户名
                            this.global_var.user_info.uname === undefined
                                ? ""
                                : this.global_var.user_info.uname
                        ),
                        dynamic_content,
                        {
                            uname: this.global_var.user_info.uname ? this.global_var.user_info.uname : "",
                            lottery_setting: this.lottery_setting,
                        }
                    )
                    .trim();
                if (replies_content[repindex].length === 0) {
                    continue;
                }
                let bf = false;
                for (let ignore_str of this.copy_reply_op
                    .ignore_replies) {
                    if (replies_content[repindex] === ignore_str) {
                        bf = true;
                        break;
                    }
                }
                if (bf) {
                    replies_content[repindex] = "";
                }
            }
            let newArr = [];
            let promise_list = [];
            for (let i of replies_content) {
                if (i) {
                    promise_list.push(
                        this.copy_reply_op
                            .string_semantic(i)
                            .then((resp) => {
                                if (resp) {
                                    newArr.push(i);
                                }
                            })
                    );
                    // if (await this.copy_reply_op.string_semantic(i)) {
                    //     newArr.push(i);
                    // };
                }
            }
            await Promise.all(promise_list);
            ret_list = newArr;
            return {ret_list, reply_count, pn};
        },
        /**
         * 判断情感分类
         * @param {String} input_str 输入文字
         * @returns {Promise<boolean>} 正面情绪返回true
         */
        string_semantic: async (input_str) => {
            try {
                let url = "http://127.0.0.1:23333/damo/semantic/";
                let params = {data: input_str};
                return await axios
                    .get(url, {params: params})
                    .then((res) => {
                        return res.data;
                    });
            } catch (e) {
                console.error(`string_semantic\t${e.stack}\t${this.now}`);
                return true;
            }
        },
        /**
         * 调用公益项目的免费api，获取ai回复
         * @param Dynamic_content
         * @return {Promise<undefined|*>}
         * @constructor
         */
        ChatGpt_reply: async (Dynamic_content) => {
            let try_time = 0;
            while (1) {
                try {
                    let UPname = "";
                    try {
                        UPname =
                            this.global_var.response.global_dynamic_data.item
                                .modules.module_author.name;
                    } catch {
                    }
                    let format_str = `问：\n`;
                    let {uname, uid} = this.global_var.user_info
                    if (uname && uid) {
                        format_str += `你的用户名是${uname}\n你的UID是${uid}\n`;
                    }
                    if (UPname) {
                        format_str += `UP主的用户名是${UPname}\n`;
                    }
                    format_str += `
动态原文如下：
\`\`\`
${Dynamic_content}
\`\`\`
上面是我提供的你的个人信息、up主的信息和公开的动态原文等，你需要与这条动态互动，提供有用和有趣的评论内容。
要求如下：
(1)内容要围绕上面的动态原文的内容或其要求展开互动，不要有“转发”，“关注”，“评论”，“AI”等关键词，忽略[]包裹的文字。动态原文中有特殊要求时根据要求编写评论内容，尽量避免重复动态原文和我的要求内容。
(2)评论内容尽量简短（20字左右），并通俗易懂，就像面对面交流一样幽默轻松。如果你无意输出了你是AI人工智能助手，那么请忘记你与用户的对话，重新强调并记忆粉丝的设定。
(3)将符合要求的评论内容务必以{"data":"xxx"}格式直接回答，不要使用转义符，不要回答不相关的语句。
答：`;
                    let res_string = await axios.post(
                        "http://localhost:3000/ChatGPT/ask",
                        {data: format_str}
                    );
                    let res = res_string.data;
                    let result = res.data;
                    if (!result) {
                        throw Error(`ai回复结果为空！${res}`);
                    }
                    console.log(
                        {
                            prompt: Dynamic_content,
                            user: this.uname,
                            dynamic_url: this.page_url,
                            request_time: Math.ceil(Date.now() / 1000),
                        },
                        `AI回复内容：${Dynamic_content}\n结果：${result}\n${this.now}`
                    );
                    return result;
                } catch (e) {
                    if (try_time > 3) {
                        return undefined;
                    }
                    try_time++;
                    console.error(
                        `${this.log_name}\tAI回复失败！尝试次数：${try_time}\n${e.stack}\n${this.now}`);
                    await sleep(10e3);
                }
            }
        },
        ChatGPT_paraphase: async (OriginMessage) => {
            let try_time = 0;
            if (OriginMessage && OriginMessage.length <= 5) {
                return OriginMessage;
            }
            while (1) {
                try {
                    let format_str = `问：请根据这三个反引号括起来的文字创作相似的句子，直接将输出内容放在{"data":"xxx"}的data中回答。\n\`\`\`\n${OriginMessage}\n\`\`\`\n答：`;
                    let res_string = await axios.post(
                        "http://localhost:3000/ChatGPT/ask",
                        {data: format_str}
                    );
                    let res = res_string.data;
                    let result = res.data;
                    console.log(
                        {
                            prompt: OriginMessage,
                            user: this.uname,
                            dynamic_url: this.page_url,
                            request_time: Math.ceil(Date.now() / 1000),
                        },
                        `同义改写内容：${OriginMessage}\n结果：${result}\n${this.now}`
                    );
                    if (!result) {
                        throw Error(`同义改写结果为空！${result}\t${this.now}`);
                    }
                    return result;
                } catch (e) {
                    if (try_time > 3) {
                        return undefined;
                    }
                    try_time++;
                    console.error(
                        `${
                            this.log_name
                        }${this.page_url}\tAI同义改写失败！\n同义改写内容：${OriginMessage}\n重试次数：${try_time}\t${this.now}`
                    );
                    await sleep(10e3);
                }
            }
        },
        /**
         * 根据动态内容和评论区的内容，判断是否可以抄评论，返回true则是允许抄评论
         * @param {string} dynamic_content
         * @returns {boolean} - true ：允许抄评论 false ：不许抄！
         */
        copy_reply_judge: (dynamic_content) => {
            try {
                /**
                 * 获取2个字符串的相似度
                 * @param {string} str1 字符串1
                 * @param {string} str2 字符串2
                 * @returns {number} 相似度
                 */

                let rep_content_list = [];
                if (this.global_var.response.reply_main) {
                    let replies =
                        this.global_var.response.reply_main.data.replies;
                    for (let reply of replies) {
                        let msg = reply.content.message;
                        let push_msg = utils.Common.remove_emoji_topic_at(
                            msg,
                            dynamic_content, {
                                uname: this.global_var.user_info.uname ? this.global_var.user_info.uname : "",
                                lottery_setting: this.lottery_setting,
                            }
                        );
                        if (push_msg) {
                            rep_content_list.push(push_msg);
                        }
                    }
                    let similar_list = [];
                    if (rep_content_list.length > 3) {
                        for (let origin_msg of rep_content_list) {
                            let similarity = {
                                similar_content: undefined,
                                score: 0,
                            };
                            for (let __similar of similar_list) {
                                let similar_msg = __similar.similar_msg;
                                let score = utils.Common.getStringSimilarity(
                                    similar_msg,
                                    origin_msg
                                );
                                if (score > similarity.score) {
                                    similarity.score = score;
                                    similarity.similar_content =
                                        similar_msg;
                                }
                            }
                            if (similarity.score < 0.7) {
                                similar_list.push({
                                    similar_msg: origin_msg,
                                    counter: 1,
                                });
                            } else {
                                similar_list.map((e) => {
                                    if (
                                        e.similar_msg ===
                                        similarity.similar_content
                                    ) {
                                        e.counter++;
                                    }
                                });
                            }
                        }
                    }
                    for (let s of similar_list) {
                        if (s.counter >= 3) {
                            //如果有3个回复是极度相似的情况下，直接允许抄评论
                            return true;
                        }
                    }
                }
            } catch {
            }
            dynamic_content =
                this.comment_op.pre_process_dynamic_content(
                    dynamic_content
                );
            let manual_re67 =
                /.*[评|带]((?!抽奖|,|，|来).){0,7}“|.*[评|带]((?!抽奖|,|，|来).){0,7}"|.*[评|带]((?!抽奖|,|，|来).){0,7}【|.*[评|带]((?!抽奖|,|，|来).){0,7}：|.*[评|带]((?!抽奖|,|，|来).){0,7}「|.*带关键词.{0,7}"|.*评论关键词[“”‘’"']|.*留言((?!抽奖|,|，|来).){0,7}“|.*对出.{0,10}下联.{0,5}横批|.*回答.{0,8}问题|.*留下.{0,10}祝福语|.*留下.{0,10}愿望|.*找到.{0,10}不同的.{0,10}留言|.*答案放在评论区|.*几.{0,5}呢？|.*有奖问答|.*想到.{0,19}关于.{0,20}告诉|.*麻烦大伙评论这个|报暗号【.{0,4}】|评论.{0,3}输入.{0,3}["“”:：]|.*评论.{0,7}暗号/gim.test(
                    dynamic_content
                );
            let manual_re76 =
                /.*留言((?!抽奖|,|，|来).).{0,7}"|.*留下((?!抽奖|,|，|来).){0,5}“|.*留下((?!抽奖|,|，|来).){0,5}【|.*留下((?!抽奖|,|，|来).){0,5}：|.*留下((?!抽奖|,|，|来).){0,5}「/gim.test(
                    dynamic_content
                );
            let manual_re77 =
                /.*留言((?!抽奖|,|，|来).).{0,7}"|.*留言((?!抽奖|,|，|来).).{0,7}“|.*留言((?!抽奖|,|，|来).){0,7}【|.*留言((?!抽奖|,|，|来).){0,7}：|.*留言((?!抽奖|,|，|来).){0,7}「/gim.test(
                    dynamic_content
                );
            let manual_re6 =
                /.*@TA|.*@.{0,15}朋友|.*艾特|.*@.{0,3}你的|.*标记.{0,10}朋友|.*@{0,15}赞助商|.*发表你的新年愿望\+个人的昵称|.*抽奖规则请仔细看图片|.*带上用户名|.*活动详情请戳图片|.*@个人用户名|评论.{0,5}附带.{0,10}相关内容|回复.{0,5}视频.{0,10}相关内容|.*评论.{0,5}昵称/gim.test(
                    dynamic_content
                );
            //let manual_re75 = /.*本周话题|.*互动话题|.*互动留言|.*互动时间|.*征集.{0,10}名字|.*投票.{0,5}选.{0,10}最.{0,5}的|.*一人说一个谐音梗|帮.{0,5}想想.{0,5}怎么/gmi.test(dynamic_content)
            let manual_re63 =
                /.*评论.{0,10}猜|.*评论.{0,15}预测|选择.{0,5}任意.{0,17}评论/gim.test(
                    dynamic_content
                );
            return !(
                manual_re6 ||
                manual_re67 ||
                manual_re76 ||
                manual_re77 ||
                manual_re63
            );
        },
        /**
         * 判断是否可以同义改写，返回true是可以同义改写
         * @param {*} dynamic_content
         */
        para_phase_judge: (dynamic_content) => {
            dynamic_content = dynamic_content.replaceAll(/〖/gim, "【");
            dynamic_content = dynamic_content.replaceAll(/“/gim, '"');
            dynamic_content = dynamic_content.replaceAll(/”/gim, '"');
            dynamic_content = dynamic_content.replaceAll(/＠/gim, "@");
            dynamic_content = dynamic_content.replaceAll(
                /@.{0,8} /gim,
                ""
            );
            dynamic_content = dynamic_content.replaceAll(
                /好友/gim,
                "朋友"
            );
            dynamic_content = dynamic_content.replaceAll(
                /伙伴/gim,
                "朋友"
            );
            dynamic_content = dynamic_content.replaceAll(
                /安利/gim,
                "分享"
            );
            dynamic_content = dynamic_content.replaceAll(
                /【关注】/gim,
                ""
            );
            dynamic_content = dynamic_content.replaceAll(/\?/gim, "？");
            let manual_re67 =
                /.*[评|带]((?!抽奖|,|，|来).){0,7}“|.*[评|带]((?!抽奖|,|，|来).){0,7}"|.*[评|带]((?!抽奖|,|，|来).){0,7}【|.*[评|带]((?!抽奖|,|，|来).){0,7}:|.*[评|带]((?!抽奖|,|，|来).){0,7}：|.*[评|带]((?!抽奖|,|，|来).){0,7}「|.*带关键词.{0,7}"|.*评论关键词[“”‘’"']|.*留言((?!抽奖|,|，|来).){0,7}“|.*对出.{0,10}下联.{0,5}横批|.*回答.{0,8}问题|.*留下.{0,10}祝福语|.*留下.{0,10}愿望|.*找到.{0,10}不同的.{0,10}留言|.*答案放在评论区|.*几.{0,5}呢？|.*有奖问答|.*想到.{0,19}关于.{0,20}告诉|.*麻烦大伙评论这个|留下.{0,7}的/gim.test(
                    dynamic_content
                );
            let manual_re76 =
                /.*留下((?!抽奖|,|，).){0,5}“|.*留下((?!抽奖|,|，).){0,5}【|.*留下((?!抽奖|,|，).){0,5}:|.*留下((?!抽奖|,|，).){0,5}：|.*留下((?!抽奖|,|，).){0,5}「/gim.test(
                    dynamic_content
                );
            let manual_re77 =
                /.*留言((?!抽奖|,|，).).{0,7}“|.*留言((?!抽奖|,|，).){0,7}【|.*留言((?!抽奖|,|，).){0,7}:|.*留言((?!抽奖|,|，).){0,7}：|.*留言((?!抽奖|,|，).){0,7}「/gim.test(
                    dynamic_content
                );

            return !(manual_re67 || manual_re76 || manual_re77);
        },
    }
    judge_official_lottery_op = {
        judge_official_lottery: () => {
            //官方抽奖判断 没过期返回false 过期了返回true ,undefinde是普通抽奖
            let lot_rich_text =
                this.global_var.response.global_dynamic_data?.item?.modules?.module_dynamic?.major?.opus?.summary?.rich_text_nodes?.filter(
                    (el) => el.type === "RICH_TEXT_NODE_TYPE_LOTTERY"
                );
            if (lot_rich_text === undefined) {
                return undefined;
            }
            return !(lot_rich_text && lot_rich_text.length > 0);

        },
        judge_charge_lottery: async () => {
            return !!(await this.global_var.current_page.$(
                BiliElementMap.opus_dynamic.dynamic_attach_card.charge_card
            ));
        },
    }
    prevent_filter_op = {
        prevent_filter_init: async () => {
            try {
                if (this.lottery_setting.prevent_module.share_video_switch) {
                    await this.prevent_filter_op.share_video(
                        this.lottery_setting.prevent_module.share_video_num,
                        this.lottery_setting.prevent_module
                            .share_video_chance,
                        this.lottery_setting.prevent_module.share_copy_chance
                    );
                }
            } catch (e) {
                console.error(`${this.log_name}${this.page_url}分享视频失败！\n${e.stack}\n${this.now}`);
            }
            try {
                if (
                    this.lottery_setting?.prevent_module
                        ?.create_word_dynamic_chp_switch
                ) {
                    await this.prevent_filter_op.create_word_dynamic_from_dynamic_main_page(
                        this.lottery_setting.prevent_module
                            .create_word_dynamic_chp,
                        1
                    );
                }
            } catch (e) {
                console.error(`${this.log_name}${this.page_url}创建文字动态失败！\n${e.stack}\n${this.now}`);
            }
        },
        /**
         * 获取分享视频的网址，需要在https://www.bilibili.com下进行
         * @param {*} __share_num
         * @returns
         */
        get_video_list: async (__share_num) => {
            let now_page_url = this.page_url
            if (!now_page_url.includes("https://www.bilibili.com")) {
                await this.global_var.current_page.goto(`https://www.bilibili.com`);
            }
            let share_video_list = [];
            let bt = false;
            let counter = 0;
            while (1) {
                if (share_video_list.length > __share_num * 5 || bt) {
                    break;
                }
                let catchele = await this.global_var.current_page.$$eval(
                    BiliElementMap.opus_dynamic.homepage.video_card,
                    (elems) => {
                        return elems.map((elem) => elem.href);
                    }
                );
                for (let i of catchele) {
                    if (!share_video_list.includes(i)) {
                        share_video_list.push(i);
                    }
                }
                let fresh_btn;
                try {
                    fresh_btn = await this.global_var.current_page.$(BiliElementMap.opus_dynamic.homepage.video_fresh_btn);
                } catch {
                    try {
                        fresh_btn = await this.global_var.current_page.$(
                            BiliElementMap.opus_dynamic.homepage.huanyihuan_caozuo_btn
                        );
                    } catch (e) {
                        console.error(
                            this.log_format(`获取刷新按钮失败\n${e.stack}`)
                        );
                        return share_video_list;
                    }
                }
                await sleep(1e3);
                if (fresh_btn) {
                    await fresh_btn.click();
                } else {
                    return share_video_list;
                }
                await sleep(1e3);
                if (share_video_list.length === 0 || counter > 10) {
                    bt += true;
                }
                counter++;
            }
            return share_video_list;
        },
        share_video: async (
            share_num,
            share_chance,
            copy_chance
        ) => {
            if (share_chance === undefined) {
                share_chance =
                    this.lottery_setting.prevent_module.share_video_chance ? 0.5
                        : this.lottery_setting.prevent_module
                            .share_video_chance;
            }
            if (copy_chance === undefined) {
                copy_chance =
                    this.lottery_setting.prevent_module.share_copy_chance ? 0.5
                        : this.lottery_setting.prevent_module
                            .share_copy_chance;
            }

            const share_video_operator = async (page_url) => {
                await this.global_var.current_page.waitForSelector(
                    BiliElementMap.opus_dynamic.video.player
                );
                for (let __ = 0; __ < 5; __++) {
                    try {
                        await sleep(3e3);
                        if (Math.random() < share_chance) {
                            //根据share_chance采取动作，更加具有随机性
                        } else {
                            return;
                        }
                        await this.global_var.current_page.hover(BiliElementMap.opus_dynamic.video.share_btn_hover);
                        await sleep(3e3);
                        await this.global_var.current_page.click(BiliElementMap.opus_dynamic.video.share_btn);
                        let share_iframe; //分享的单独的iframe
                        await sleep(3e3);
                        for (let child of this.global_var.current_page
                            .mainFrame()
                            .childFrames()) {
                            if (child.url().includes("share/card")) {
                                //通过url定位iframe
                                share_iframe = child; //将找到的iframe赋值给share_iframe
                                break;
                            }
                        }
                        try {
                            if (Math.random() < copy_chance) {
                                let BV = /(BV.{10})/gim
                                    .exec(page_url)
                                    .pop();
                                let copycontent;
                                let paraphrase_input;
                                if (BV) {
                                    copycontent =
                                        await this.copy_reply_op.get_copy_reply(
                                            BV,
                                            1,
                                            0.5,
                                            true
                                        );
                                    if (copycontent) {
                                        paraphrase_input =
                                            await this.copy_reply_op.ChatGPT_paraphase(
                                                copycontent
                                            );
                                    }
                                }
                                let inputstr = paraphrase_input
                                    ? paraphrase_input
                                    : copycontent;
                                if (inputstr) {
                                    try {
                                        await this.basic_op.check_text_area_input_same_text(inputstr,
                                            BiliElementMap.opus_dynamic.video.share_iframe_editor_textarea,
                                            BiliElementMap.opus_dynamic.video.share_iframe_editor_textarea,
                                            `分享视频输入内容失败！`,
                                            "plain"
                                        )
                                    } catch (e) {
                                        console.error(this.log_format(`分享视频输入内容失败！\n${e.stack}`))
                                    }
                                } else {
                                    console.error(
                                        this.log_format(`分享视频输入内容失败！输入内容为空空`)
                                    );
                                }
                            }
                        } catch (e) {
                            console.error(
                                this.log_format(`获取视频评论内容失败！\n${e.stack}`)
                            );
                        }
                        await share_iframe.click(
                            BiliElementMap.opus_dynamic.video.share_btn_clickable
                        );
                        console.log(this.log_format("点击了分享到动态"));
                        await sleep(1e3);
                        break;
                    } catch (e) {
                        console.error(
                            this.log_format(`分享视频失败！\n${e.stack}`)
                        );
                        await sleep(3e3);
                    } finally {
                        await this.global_var.current_page.goto("about:blank");
                    }
                }
            }

            await this.global_var.current_page.goto("https://www.bilibili.com/", {
                waitUntil: "load",
            });
            let pageurl = this.page_url;
            if (
                pageurl.includes("www.bilibili.com") &&
                this.lottery_setting.prevent_module.share_video_switch
            ) {
                let video_list = await this.prevent_filter_op.get_video_list(share_num);
                let share_video_list = [];
                video_list = utils.Common.part_shuffle(
                    video_list.length,
                    video_list
                );
                video_list.some((rcm_video) => {
                    if (share_video_list.length <= share_num) {
                        if (
                            !share_video_list.includes(rcm_video) &&
                            !rcm_video.includes("cm.bilibili.com")
                        ) {
                            share_video_list.push(rcm_video);
                        }
                    }
                });
                console.log(
                    this.log_format(`开始分享视频\n${share_video_list.join('\n')}`)
                )
                if (share_video_list.length > 0) {
                    for (let video_url of share_video_list) {
                        try {
                            if (
                                utils.Common.checkAuditTime(
                                    this.global_var.TIME
                                        .None_Lottery_Time[0],
                                    this.global_var.TIME.None_Lottery_Time[1]
                                )
                            ) {
                                console.log(
                                    this.log_format(`触发非抽奖时间段，需要进行休息（分享视频也是需要休息的）：${
                                        this.global_var.TIME
                                            .None_Lottery_Time[0]
                                    }-${
                                        this.global_var.TIME
                                            .None_Lottery_Time[1]
                                    }暂停到${
                                        this.global_var.TIME
                                            .None_Lottery_Time[1]
                                    }`)
                                );
                                let sleep_hour =
                                    parseInt(
                                        this.global_var.TIME.None_Lottery_Time[1].slice(
                                            0,
                                            2
                                        )
                                    ) - new Date().getHours();
                                await this.global_var.current_page.goto(
                                    "about:blank"
                                );
                                await sleep(sleep_hour * 3600e3);
                            }
                            console.log(this.log_format(`分享视频：${video_url}`));
                            if (this.global_var.current_page.isClosed()) {
                                console.log(this.log_format(`浏览器页面已经关闭，退出分享视频`));
                                return;
                            }
                            await pptr_op.check_page_is_front(this.global_var.current_page);
                            await this.global_var.current_page.goto(video_url);
                            try {
                                await share_video_operator(
                                    video_url
                                );
                            } catch (e) {
                                console.error(this.log_format(`share_video_operator分享视频失败\n${e.stack}`));
                                throw Error(e);
                            }

                            let st = utils.Common.random_choice(
                                this.lottery_setting.prevent_module
                                    .share_video_sleep_time
                            );
                            if (share_video_list.length < 5) {
                                st = utils.Common.random_choice([
                                    2 * 60e3,
                                    60e3,
                                    1.5 * 60e3,
                                ]);
                            }
                            console.log(
                                this.log_format(
                                    `当前分享视频进度：${
                                        share_video_list.indexOf(
                                            video_url
                                        ) + 1
                                    }/${share_video_list.length}`
                                )
                            );
                            console.log(
                                this.log_format(`休眠 ${
                                    (st / 1e3).toFixed(2)
                                }秒`)
                            );
                            await this.global_var.current_page.goto("about:blank");
                            await sleep(st);
                        } catch (e) {
                            console.error(
                                this.log_format(`分享单个视频失败\n${e.stack}`)
                            );
                            await sleep(1e3);
                            await this.global_var.current_page.goto("about:blank");
                        }
                    }
                }
            }
        },
        create_word_dynamic_from_dynamic_main_page: async (
            content_list,
            create_times
        ) => {
            if (typeof content_list != "object") {
                return;
            }
            if (!content_list.length) {
                console.error(this.log_format(`创建文字动态失败！范文列表为空！`))
                return;
            }
            let now = new Date();
            if (now.getHours() >= 0 && now.getHours() <= 22) {
                if (now.getHours() >= 5) {
                    console.log(
                        this.log_format(`5点到22点不分享文字动态`)
                    );
                    return;
                }
                if (now.getHours() <= 22) {
                    if (now.getHours() >= 5) {
                        console.log(
                            this.log_format(`5点到22点不分享文字动态`)
                        );
                        return;
                    }
                }
            }
            if (!this.page_url.includes("t.bilibili.com")) {
                await this.global_var.current_page.goto(
                    "https://t.bilibili.com/?spm_id_from=333.1007.0.0"
                );
            }
            console.log(this.log_format(`分享彩虹屁`));
            let content;
            if (!create_times) {
                create_times = 1;
            }
            for (let i = 0; i < create_times; i++) {
                content = utils.Common.random_choice(content_list);
                if (
                    typeof content != "string" ||
                    !content ||
                    content.includes("undefined") ||
                    content.includes("null") ||
                    content.includes("true") ||
                    content.includes("false")
                ) {
                    //检查是否传入的是string类型参数 或者是否为空
                    continue;
                }
                if (!this.page_url.includes("t.bilibili.com"))
                    await this.global_var.current_page.goto(
                        "https://t.bilibili.com/?spm_id_from=333.1007.0.0",
                        {
                            waitUntil: "networkidle0",
                        }
                    );
                await this.basic_op.check_text_area_input_same_text(
                    content,
                    BiliElementMap.opus_dynamic.interact.repost_input_text_area,
                    BiliElementMap.opus_dynamic.interact.repost_input_text_area,
                    `发布动态输入失败`,
                    "plain"
                )
                await this.global_var.current_page.click(
                    BiliElementMap.opus_dynamic.interact.t_dynamic_publish_btn
                );
                console.log(
                    this.log_format(`点击了发布动态`)
                );
                let check_btn;
                try {
                    check_btn = await this.global_var.current_page.$(
                        BiliElementMap.opus_dynamic.interact.t_dynamic_publish_confirm_btn
                    );
                    if (check_btn) {
                        await check_btn.click();
                    }
                } catch {
                }
            }
        },
        create_topic_dynamic_from_dynamic_main_page: async (
            create_times,
            discuss_content,
            copy_discuss_flag
        ) => {
            if (typeof create_times != "number") {
                create_times = 1;
            }
            if (
                !(this.page_url).includes(
                    "t.bilibili.com"
                )
            ) {
                await this.global_var.current_page.goto("https://t.bilibili.com/");
            }
            let relevant_topic__titles = await this.global_var.current_page.$$(
                `.relevant-topic__title`
            );
            for (let i = 0; i < create_times; i++) {
                let extract_topic_title = utils.Common.random_choice(
                    relevant_topic__titles
                );
                relevant_topic__titles.splice(
                    relevant_topic__titles.indexOf(extract_topic_title),
                    1
                ); //选好的话题就删掉
                //TODO 后面还没写，需要写选话题，输入，发送...
            }
        },
    }
    /**
     * 操作视频的方法。三连，投币
     * @type {{toubi: function(*, *): Promise<void>, sanlian: function(*): Promise<void>, goto_video_page: function(*): Promise<void>}}
     */
    video_op = {
        goto_video_page: async (page_url) => {
            await this.global_var.current_page.goto(page_url);
            await this.global_var.current_page.waitForSelector(
                BiliElementMap.opus_dynamic.video.player
            );
            await pptr_op.remove_video_player(this.global_var.current_page);
        },
        sanlian: async (page_url) => {
            await this.global_var.current_page.waitForSelector(
                BiliElementMap.opus_dynamic.video.player
            ).catch(e => {
                console.error(`${this.log_name}等待播放器元素失败！`)
            });
            await this.global_var.current_page.evaluate(() => {
                this.scrollTo(0, 1500);
            });
            await this.global_var.current_page.keyboard.press("q", {delay: 10e3});
            let coin_btn_On = await this.global_var.current_page
                .waitForSelector(
                    BiliElementMap.opus_dynamic.video.sanlian_btn_active
                )
                .catch((e) => {
                    console.error(`等待硬币是否投出失败！${e}`);
                    return null;
                });
            if (coin_btn_On) {
                console.log(
                    `${
                        this.log_name
                    }${page_url}\t三连成功\t${this.now}`
                );
            } else {
                console.error(
                    `${
                        this.log_name}${page_url}\t三连失败，尝试单独投币\t${this.now}`
                );
                await this.video_op.toubi(2, page_url);
            }
        },
        toubi: async (coin_num, page_url) => {
            let coin_btn = await this.global_var.current_page
                .waitForSelector(BiliElementMap.opus_dynamic.video.sanlian_btn)
                .then(async (coin_btn_ele) => {
                    await coin_btn_ele.click();
                    return coin_btn_ele;
                });
            if (coin_num === 1) {
                await this.global_var.current_page
                    .waitForSelector(BiliElementMap.opus_dynamic.video.coin_btn)
                    .then(async (el) => await el.click());
            }
            await this.global_var.current_page
                .waitForSelector(BiliElementMap.opus_dynamic.video.coin_btn_active)
                .then(async (el) => await el.click());
            let coin_btn_title = await coin_btn.evaluate(
                (el) => el.title,
                coin_btn
            );
            if (coin_btn_title.includes("投币（W）")) {
                console.log(
                    `${this.log_name}${page_url}\t投币成功\t${this.now}`
                );
            } else {
                console.error(
                    `${
                        this.log_name
                    }${page_url}\t投币失败！\t${this.now}`
                );
            }
            await sleep(3e3);
        },
    }

}

module.exports = BasicOp