const {BiliElementMap} = require("@/ExpressServerEnd/BiliPPTR/utils/element_map");
const {utils} = require("@/ExpressServerEnd/BiliPPTR/utils/utils");
const {AccountLogService} = require("@/ExpressServerEnd/Service/account_log_module/account_log_service");
const {ExcTaskParams} = require("@/ExpressServerEnd/BiliPPTR/models/pages/tasks_model");
const {pptr_op, sleep} = require("@/木偶模块/util/common_utl");
const {BiliOtherPage} = require("@/ExpressServerEnd/BiliPPTR/pages/base_other_page");
const {AccountMsgService} = require("@/ExpressServerEnd/Service/account_module/account_msg_service");


class BiliMessagePage extends BiliOtherPage {
    /**
     * 获取私信，回复私信使用！！！
     * @param {BiliDynamicPage} bili_dynamic_page
     */
    constructor({bili_dynamic_page}) {
        super({bili_dynamic_page: bili_dynamic_page})
        this.msg_sql = new AccountMsgService();
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

    /**
     *
     * @param messages
     * @param user_cards
     * @return {Promise<void>}
     */
    async #handle_whisper_msgs({messages, user_cards}) {
        Object.keys(user_cards).map(async k => {
            let user_card = user_cards[k];
            await this.msg_sql.upsert_bili_user_Info({
                mid: user_card.mid,
                avatar: user_card.face,
                mid_link: "",
                nickname: user_card.name
            });
            await this.msg_sql.upsert_bili_user_detail(Object.assign({
                uid: user_card.mid
            }, user_card))
        })
        for (let message of messages) {
            let content
            switch (message.type) {
                case 1:
                    let msg_source = message.msg_source;
                    content = JSON.parse(message.content).content
                    switch (msg_source) {
                        case 7:
                            console.log(this.bili_dynamic_page.log_format(`获取到人工回复消息（type：${message.type}|source：${msg_source}）：【${String(content)}】`))
                            await this.msg_sql.upsert_bili_whisper_msg(
                                Object.assign({
                                        account_id: this.bili_dynamic_page.account_id,
                                    }, message
                                )
                            )
                            break;
                        case 8:
                            console.log(this.bili_dynamic_page.log_format(`获取到自动回复消息（type：${message.type}|source：${msg_source}）：【${String(content)}】`))
                            break;
                        default:
                            await this.msg_sql.upsert_bili_whisper_msg(
                                Object.assign({
                                        account_id: this.bili_dynamic_page.account_id,
                                    }, message
                                )
                            )
                            console.log(this.bili_dynamic_page.log_format(`获取到未知来源回复消息（type：${message.type}|source：${msg_source}）：【${String(content)}】`))
                    }
                    break;
                case 18:
                    content = JSON.parse(message.content).content
                    console.log(this.bili_dynamic_page.log_format(`获取到系统消息（type：${message.type}|source：${message.msg_source}）：【${String(content)}】`))
                    break;
                case 13:
                    content = JSON.parse(message.content).content
                    console.log(this.bili_dynamic_page.log_format(`获取到广告消息（type：${message.type}|source：${message.msg_source}）：【${String(content)}】`));
                    break;
                default:
                    content = JSON.parse(message.content).content
                    console.log(this.bili_dynamic_page.log_format(`获取到未知消息（type：${message.type}|source：${message.msg_source}）：【${String(content)}】`))
                    await this.msg_sql.upsert_bili_whisper_msg(
                        Object.assign({
                                account_id: this.bili_dynamic_page.account_id,
                            }, message
                        )
                    )
            }
        }
    }

    /**
     *
     * @param {Page} pg
     * @return {Promise<*[]>}
     */
    async get_all_whisper_msg(pg) {
        let new_msgs = []
        let fetch_session_msg;
        let user_cards_resp;
        await Promise.all([
            await pg.goto(BiliElementMap.url_path.user.msg_whisper),
            fetch_session_msg = await pg.waitForResponse(
                resp => resp.url()
                    .includes(
                        BiliElementMap.url_path.user.msg_session_svr_fetch_session_msgs
                    )
            ),
            user_cards_resp = await pg.waitForResponse(resp => resp.url().includes(
                    BiliElementMap.url_path.user.msg_user_cards
                )
            )
        ]);
        let messages = fetch_session_msg?.data?.messages
        let user_cards = user_cards_resp?.data
        if (messages && user_cards) {
            new_msgs.push(...messages)
            await this.#handle_whisper_msgs({messages: messages, user_cards: user_cards});
        }
        while (true) {
            let notify_num = parseInt(await pg.waitForSelector(BiliElementMap.message_page.whisper_notify_total_number).then(async el => {
                return await el.textContent();
            }))
            console.log(this.bili_dynamic_page.log_format(`当前剩余${notify_num}条新私信`))
            if (notify_num === 0) break;
            let all_notify_point = await pg.$$(BiliElementMap.message_page.whisper_notify)
            for (let notify_point of all_notify_point) {
                let parent = await notify_point.getProperty('parentNode');
                await Promise.all([
                    await parent.click(),
                    fetch_session_msg = await pg.waitForResponse(
                        resp => resp.url()
                            .includes(
                                BiliElementMap.url_path.user.msg_session_svr_fetch_session_msgs
                            )),
                    user_cards_resp = await pg.waitForResponse(resp => resp.url().includes(
                            BiliElementMap.url_path.user.msg_user_cards
                        )
                    )
                ]);
                let messages = fetch_session_msg?.data?.messages
                let user_cards = user_cards_resp?.data
                if (messages && user_cards) {
                    new_msgs.push(...messages)
                    await this.#handle_whisper_msgs({messages, user_cards});
                } else {
                    console.error(this.bili_dynamic_page.log_format(`获取单个私信消息失败！\n${JSON.stringify(fetch_session_msg)}\n${user_cards_resp}`));
                }
            }
            let left = await pg.waitForSelector(BiliElementMap.message_page.space_right_left)
            await left.evaluate(() => {
                this.scrollTo(0, 2000)
            });
            await sleep(5e3);
        }

        return new_msgs;
    }

    /**
     *
     * @param reply_items
     * @param new_replies
     * @return {Promise<boolean>} 遇到重复的返回true，表示终止，不继续获取下去！
     */
    async #handle_reply_msgs({reply_items, new_replies}) {
        for (let reply_item of reply_items) {
            let user = reply_item.user;
            await this.msg_sql.upsert_bili_user_Info({
                mid: user.mid,
                avatar: user.avatar,
                mid_link: user.mid_link,
                nickname: user.nickname
            })
            let not_exist = await this.msg_sql.upsert_bili_reply_msg(
                {
                    account_id: this.bili_dynamic_page.account_id,
                    reply_id: reply_item.id,
                    counts: reply_item.counts,
                    item: reply_item.item,
                    reply_time: reply_item.reply_time,
                    uid: user.mid
                }
            )
            if (!not_exist) {
                return true;
            }
            new_replies.push(reply_item)
        }
        return false;
    }

    /**
     *
     * @param pg
     * @return {Promise<*[]>}
     */
    async get_all_reply_msg(pg) {
        let new_replies = []
        let msgfeed_reply;
        await Promise.all([
            msgfeed_reply = await pg.waitForResponse(resp => resp.url().includes(BiliElementMap.url_path.user.msg_reply)),
            await pg.goto(BiliElementMap.url_path.user.msg_reply_router)
        ])
        let reply_items = msgfeed_reply?.data?.items
        let is_end = msgfeed_reply?.data?.cursor?.is_end
        if (reply_items) {
            let is_repeat = await this.#handle_reply_msgs({reply_items, new_replys: new_replies})
            if (is_repeat || is_end) return new_replies
        } else {
            console.error(this.bili_dynamic_page.log_format(`获取私信回复失败！\n${JSON.stringify(msgfeed_reply)}`));
            return new_replies
        }
        while (!is_end) {
            let space_right = await pg.waitForSelector(BiliElementMap.message_page.space_right);
            await Promise.all([
                space_right.evaluate(() => {
                    this.scrollTo(0, 2000)
                }),
                msgfeed_reply = await pg.waitForResponse(resp => resp.url().includes(BiliElementMap.url_path.user.msg_reply)),
            ])
            reply_items = msgfeed_reply?.data?.items;
            is_end = msgfeed_reply?.data?.cursor?.is_end;
            if (reply_items) {
                let is_repeat = await this.#handle_reply_msgs({reply_items, new_replys: new_replies})
                if (is_repeat || is_end) return new_replies
            } else {
                console.error(this.bili_dynamic_page.log_format(`获取私信回复失败！\n${JSON.stringify(msgfeed_reply)}`));
                return new_replies
            }
            await sleep(5e3)
        }
        return new_replies
    }

    async #handle_at_msgs({at_items, new_at_msgs}) {
        for (let at_item of at_items) {
            let user = at_item.user;
            await this.msg_sql.upsert_bili_user_Info({
                mid: user.mid,
                avatar: user.avatar,
                mid_link: user.mid_link,
                nickname: user.nickname
            })
            let not_exist = await this.msg_sql.upsert_bili_at_msg(
                {
                    account_id: this.bili_dynamic_page.account_id,
                    at_id: at_item.id,
                    item: at_item.item,
                    at_time: at_item.at_time,
                    uid: user.mid
                }
            )
            if (!not_exist) {
                return true;
            }
            new_at_msgs.push(at_item);
        }
        return false;
    }

    /**
     *
     * @param pg
     * @return {Promise<*[]>}
     */
    async get_all_at_msg(pg) {
        let new_at_msgs = []
        let msgfeed_at;
        await Promise.all([
            msgfeed_at = await pg.waitForResponse(resp => resp.url().includes(BiliElementMap.url_path.user.msg_at)),
            await pg.goto(BiliElementMap.url_path.user.msg_at_router)
        ])
        let reply_items = msgfeed_at?.data?.items
        let is_end = msgfeed_at?.data?.cursor?.is_end
        if (reply_items) {
            let is_repeat = await this.#handle_at_msgs({reply_items, new_at_msgs})
            if (is_repeat || is_end) return new_at_msgs
        } else {
            console.error(this.bili_dynamic_page.log_format(`获取at消息失败！\n${JSON.stringify(msgfeed_at)}`));
            return new_at_msgs
        }
        while (!is_end) {
            let space_right = await pg.waitForSelector(BiliElementMap.message_page.space_right);
            await Promise.all([
                space_right.evaluate(() => {
                    this.scrollTo(0, 2000)
                }),
                msgfeed_at = await pg.waitForResponse(resp => resp.url().includes(BiliElementMap.url_path.user.msg_at)),
            ])
            reply_items = msgfeed_at?.data?.items;
            is_end = msgfeed_at?.data?.cursor?.is_end;
            if (reply_items) {
                let is_repeat = await this.#handle_at_msgs({reply_items, new_at_msgs})
                if (is_repeat || is_end) return new_at_msgs
            } else {
                console.error(this.bili_dynamic_page.log_format(`获取at消息失败！\n${JSON.stringify(msgfeed_at)}`));
                return new_at_msgs
            }
            await sleep(5e3)
        }
        return new_at_msgs
    }

    /**
     *获取所有的私信提醒（at,reply,whisper）
     * @return {Promise<void>}
     */
    async get_all_msg_notify() {
        this.global_var.current_page = await this.bili_dynamic_page.create_new_pg(BiliElementMap.browser_usage.acquire_msg);
        try {
            let new_whisper_msg = await this.get_all_whisper_msg(this.global_var.current_page);
            let new_at_msg = await this.get_all_at_msg(this.global_var.current_page);
            let new_reply_msg = await this.get_all_reply_msg(this.global_var.current_page);
            if (new_whisper_msg.length > 0 || new_at_msg.length > 0 || new_reply_msg.length > 0) {
                await pptr_op.my_send_notify.push_me(`B站【${this.bili_dynamic_page.global_var.user_info.uname}】账号【${this.bili_dynamic_page.account_name}】获取到新消息！`,
                    `${new_whisper_msg}\n${new_at_msg}\n${new_reply_msg}`);
            }
        } catch (e) {
            throw e
        } finally {
            await this.global_var.current_page.close();
        }

    }

    /**
     * 刷新并获取所有私信内容
     * @return {Promise<void>}
     */
    async main() {
        try {
            while (this.bili_dynamic_page.global_var.FLAG.执行其他任务中标志) {
                await sleep(10e3)
            }
            console.log(this.bili_dynamic_page.log_format(`执行获取私信任务！`))
            this.bili_dynamic_page.global_var.FLAG.执行其他任务中标志 = true;
            await this.get_all_msg_notify();
            console.log(this.bili_dynamic_page.log_format(`获取私信执行完成！`))
        } catch (e) {
            console.error(this.bili_dynamic_page.log_format(`获取私信任务出错！\n${e.stack}`))
            await AccountLogService.add_common_log_by_account_id({
                account_id: this.bili_dynamic_page.account_id,
                contents: `获取消息任务失败\n${e.stack}`,
                ts: parseInt(utils.Common.dateNow_s()),
                func_name: "get_all_msg_notify",
                level: 4,
                module_name: "BiliMessagePage"
            })
        } finally {
            this.bili_dynamic_page.global_var.FLAG.执行其他任务中标志 = false;
        }
    }


}

module.exports = {
    BiliMessagePage
}