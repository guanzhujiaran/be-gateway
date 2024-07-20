const {BiliElementMap}= require("@/ExpressServerEnd/BiliPPTR/utils/element_map");
const {moveJobFromActiveToWait} = require("bullmq/dist/esm/scripts");

class BiliDailyTaskPage {
    /**
     *
     * @param {BiliDynamicPage} bili_dynamic_page
     */
    constructor(bili_dynamic_page) {
        this.bili_dynamic_page = bili_dynamic_page;
    }
    /**
     *
     * @param {
     * {
     * func:(...args:any[])=>Promise<*>,
     * params:*,
     * err:string|undefined,
     * create_new_pg: puppeteer.Page | undefined,
     * reload_when_err:boolean | undefined
     * }[]
     * }tasks
     * @param {manual_op_fail_model}record_data
     * @param maxRetries
     * @return {Promise<void>}
     */
    async executeWithRetry(tasks, record_data, maxRetries = 3) {
        for (let i = 0; i < tasks.length; i++) {
            const {func, params, err, pg, reload_when_err} = tasks[i];
            let retries = 0;
            let success = false;

            while (!success && retries < maxRetries) {
                try {
                    success = await func(params);// 成功执行，不需要重试
                    if (!success) {
                        throw Error(`任务${i}执行失败！`)
                    }
                } catch (error) {
                    record_data.err_msg = err ? `${err}\n`.concat(`${error}`) : error
                    retries++;
                    console.error(`Error executing function ${func.name}:`, error);
                    if (retries < maxRetries) {
                        console.warn(`Retrying (${retries}/${maxRetries})...`);

                        if (reload_when_err) {
                            await pg.reload()
                        }
                    } else {
                        console.error('Max retries reached. Moving to the next task.');
                    }
                }
            }
            if (!success) {
                console.error(`Failed to execute function ${func.name} after ${maxRetries} retries.`);
            }
        }
    }

    async sanlian(pg){
        let user_nav = this.bili_dynamic_page.global_var.user_info.user_nav;
        let my_coin = user_nav.data.money;
        if (my_coin < 1) {
            console.log(
                this.bili_dynamic_page.log_format(
                `硬币不够三连，跳过每日投币经验奖励`)
            );
            return;
        }
        let my_level;
        try {
            my_level = user_nav.data.level_info.current_level;
        } catch {}
        if (my_level === 6) {
            console.log(this.bili_dynamic_page.log_format(`等级满了，跳过每日投币经验奖励`));
            return;
        }
        await pg.goto(
            BiliElementMap.url_path.user.home,
            { waitUntil: "networkidle2" }
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
                    global_var.user_info.uname
                }\t每日投币经验任务完成\t${new Date().toLocaleTimeString()}`
            );
        } else {
            console.log(
                `${
                    global_var.user_info.uname
                }\t投币经验已满\t${new Date().toLocaleTimeString()}`
            );
        }
    }
    async get_user_nav(pg){
        if (Object.keys(this.bili_dynamic_page.global_var.user_info.user_nav).length!==0)return;
        await Promise.all([
            pg.goto(BiliElementMap.url_path.space.message),
            pg.waitForResponse(resp=>resp.url().includes(BiliElementMap.url_path.user.nav)).then(async resp=>this.bili_dynamic_page.global_var.user_info.user_nav = await resp.json())
        ])
    }
    async #exec_daily_task() {
        let daily_tasks_page = await this.bili_dynamic_page.create_new_pg(BiliElementMap.browser_usage.daily_task)

    }


    async main() {
        if (!this.bili_dynamic_page.lottery_setting.CONFIG.AUTO_DailyReward) return
        await this.#exec_daily_task();
    }
}