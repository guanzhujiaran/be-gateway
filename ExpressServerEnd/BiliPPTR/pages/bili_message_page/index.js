const {BiliElementMap} = require("@/ExpressServerEnd/BiliPPTR/utils/element_map");
const {utils} = require("@/ExpressServerEnd/BiliPPTR/utils/utils");
const {AccountLogService} = require("@/ExpressServerEnd/Service/account_log_module/account_log_service");
const {ExcTaskParams} = require("@/ExpressServerEnd/BiliPPTR/models/pages/tasks_model");
const {pptr_op, sleep} = require("@/木偶模块/util/common_utl");
const {BiliOtherPage} = require("@/ExpressServerEnd/BiliPPTR/pages/base_other_page");


class BiliMessagePage extends BiliOtherPage {
    /**
     * 获取私信，回复私信使用！！！
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

    async #handle_fetch_session_msgs(messages, user_cards) {
        for (let message of messages) {
            let content
            switch (message.type) {
                case 1:
                    let msg_source = message.msg_source;
                    content = JSON.parse(message.content).content
                    switch (msg_source) {
                        case 7:
                            console.log(this.bili_dynamic_page.log_format(`获取到人工回复消息（type：${message.type}|source：${msg_source}）：【${String(content)}】`))
                            // TODO 这里加一个存到数据库的方法
                            break;
                        case 8:
                            console.log(this.bili_dynamic_page.log_format(`获取到自动回复消息（type：${message.type}|source：${msg_source}）：【${String(content)}】`))
                            break;
                        default:
                            // TODO 这里加一个存到数据库的方法
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
            }
        }
    }

    /**
     *
     * @param {Page} pg
     * @return {Promise<void>}
     */
    async get_all_whisper_msg(pg) {
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
            await this.#handle_fetch_session_msgs(messages, user_cards);
        } else {
            console.error(this.bili_dynamic_page.log_format(`获取单个私信消息失败！\n${JSON.stringify(fetch_session_msg)}\n${JSON.stringify(user_cards_resp)}`));
            //TODO 加一个失败日志，存到数据库！
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
                            ))
                ]);
                let messages = fetch_session_msg?.data?.messages
                if (messages) {
                    await this.#handle_fetch_session_msgs(messages);
                } else {
                    console.error(this.bili_dynamic_page.log_format(`获取单个私信消息失败！`));
                    //TODO 加一个失败日志，存到数据库！
                }
            }
            let left = await pg.waitForSelector(BiliElementMap.message_page.space_right_left)
            await left.evaluate(() => {
                this.scrollTo(0, 2000)
            });
        }


    }

    async get_all_reply_msg(pg) {

    }

    /**
     *获取所有的私信提醒（at,reply,whisper）
     * @param {Page} pg
     * @return {Promise<void>}
     */
    async get_all_msg_notify(pg) {
        await pg.goto(BiliElementMap.url_path.user.msg_unread)
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
    BiliMessagePage
}