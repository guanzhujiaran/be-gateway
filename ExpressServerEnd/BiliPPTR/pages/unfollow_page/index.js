const {BiliElementMap} = require("@/ExpressServerEnd/BiliPPTR/utils/element_map");
const {BaseGlobalVar} = require("@/ExpressServerEnd/BiliPPTR/utils/global_var");
const {utils} = require("@/ExpressServerEnd/BiliPPTR/utils/utils");
const {AccountLogService} = require("@/ExpressServerEnd/Service/account_log_module/account_log_service");
const {ExcTaskParams} = require("@/ExpressServerEnd/BiliPPTR/models/pages/tasks_model");
const {pptr_op, sleep} = require("@/木偶模块/util/common_utl");
const {BiliOtherPage} = require("@/ExpressServerEnd/BiliPPTR/pages/base_other_page");
const {GLOBAL_CONFIG} = require("@/ExpressServerEnd/BiliPPTR/config/global_config");

class BiliUnfollowPage extends BiliOtherPage {
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
                return false
            }
        }
        return true
    }

    /**
     *
     * @param pg
     * @param limit_max_follow_num
     * @return {Promise<boolean>}
     */
    async check_follow_num(pg = this.global_var.current_page, limit_max_follow_num = GLOBAL_CONFIG.unfollow_module.max_follow_num) {
        let nav_stat = await pptr_op.BAPI.web_interface_nav_stat(pg);
        if (nav_stat.code) {
            console.error(this.bili_dynamic_page.log_format(`获取关注数失败！${JSON.stringify(nav_stat)}`));
            return false;
        }
        if (!nav_stat?.data?.following || nav_stat?.data?.following <= limit_max_follow_num) {
            console.log(this.bili_dynamic_page.log_format(`当前关注数${nav_stat?.data?.following}个 不满足取关条件（大于${limit_max_follow_num}个）`));
            return false;
        }
        console.log(this.bili_dynamic_page.log_format(`关注数量信息响应：${JSON.stringify(nav_stat)}`));
        return true;
    }

    async do_unfollow(uid, csrf, now_time, all_times, basic_url = `https://space.bilibili.com/1/fans/follow`, pg = this.global_var.current_page) {
        await pptr_op.check_page_is_front(pg);
        if (!pg.url().includes("bilibili")) {
            await pg.goto(basic_url);
        }
        let resp_json = await pg.evaluate(
            (post_data) => {
                return fetch(
                    "https://api.bilibili.com/x/relation/modify",
                    {
                        credentials: "include",
                        method: "POST",
                        body: new URLSearchParams(
                            post_data
                        ),
                    })
                    .then((resp) => {
                        return resp.json();
                    })
            },
            {
                fid: uid,
                act: 2,
                re_src: 11,
                spmid: "333.999.0.0",
                extend_content: JSON.stringify({
                    entity: "user",
                    entity_id: uid,
                }),
                csrf: csrf,
            }
        );
        if (resp_json.code !== 0) {
            console.error(
                this.bili_dynamic_page.log_format(`取关失败，原因：${JSON.stringify(
                    resp_json,
                    "",
                    "\t")}`));
            await sleep(2 * 3600 * 1e3);
            throw Error(`取关失败，原因：${JSON.stringify(resp_json, "", "\t")}`)
        } else {
            console.log(
                this.bili_dynamic_page.log_format(`【取关脚本】当前进度【${now_time}/${all_times}】\thttps://space.bilibili.com/${uid}/dynamic\t取关成功！${JSON.stringify(
                    resp_json,
                    "",
                    "\t"
                )}`)
            );
        }
        await sleep(20e3);
    }

    async #exec_unfollow() {
        this.global_var.current_page = await this.bili_dynamic_page.create_new_pg(BiliElementMap.browser_usage.unfollow);
        try {
            if (!await this.check_login(this.global_var.current_page)) throw Error(`登录失败！`);
            let pg = this.global_var.current_page;
            await this.get_user_nav(this.global_var.current_page);
            let uid = this.bili_dynamic_page.global_var.user_info.uid;
            let op_arr = []

            if (await this.check_follow_num()) {

                let unfollow_uids = await pptr_op.BAPI.get_attention_list(pg, uid).then(
                    async (resp) => {
                        if (resp.code === 0) {
                            console.log(this.bili_dynamic_page.log_format(`全部关注数：【${resp.data.list.length}】个`));
                            console.log(this.bili_dynamic_page.log_format(`正在获取取关列表中！`));
                            return await pptr_op.MYAPI.get_unlot_following(resp.data.list);
                        } else {
                            console.error(this.bili_dynamic_page.log_format(`获取关注列表失败！${resp}`));
                            return [];
                        }
                    }
                );
                let csrf = await pptr_op.get_bili_cjt(pg);
                let basic_url = `https://space.bilibili.com/${uid}/fans/follow`
                for (let i = 0; i < unfollow_uids.length; i++) {
                    op_arr.push(new ExcTaskParams({
                        func: this.do_unfollow,
                        params: [uid, csrf, i + 1, unfollow_uids.length, basic_url, pg],
                        err: `执行单个取关失败`,
                        pg: pg,
                        reload_when_err: false
                    }))
                }
            }
            await this.executeWithRetry(op_arr)

        } catch (e) {
            console.error(this.bili_dynamic_page.log_format(`取关出错！${e}`))
        } finally {
            this.global_var.current_page && await this.global_var.current_page.close();
        }
    }

    async main() {
        try {
            while (this.bili_dynamic_page.global_var.FLAG.执行其他任务中标志) {
                await sleep(10e3)
            }
            console.log(this.bili_dynamic_page.log_format(`执行取关任务！`))
            this.bili_dynamic_page.global_var.FLAG.执行其他任务中标志 = true;
            this.bili_dynamic_page.global_var.FLAG.抽奖中标志 = true;
            await this.executeWithRetry([new ExcTaskParams({
                func: this.#exec_unfollow,
                params: [],
                err: `执行单个取关失败`,
                reload_when_err: false
            })])
            console.log(this.bili_dynamic_page.log_format(`取关任务执行完成！`))
        } catch (e) {
            console.error(this.bili_dynamic_page.log_format(`执行取关任务出错！\n${e}`))
        } finally {
            this.bili_dynamic_page.global_var.FLAG.执行其他任务中标志 = false;
            this.bili_dynamic_page.global_var.FLAG.抽奖中标志 = false;
        }
    }
}

module.exports = {
    BiliUnfollowPage
}