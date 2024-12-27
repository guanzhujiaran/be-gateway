const {BiliElementMap} = require("@/ExpressServerEnd/BiliPPTR/utils/element_map");
const {BaseGlobalVar} = require("@/ExpressServerEnd/BiliPPTR/utils/global_var");
const {ExcTaskParams} = require("@/ExpressServerEnd/BiliPPTR/models/pages/tasks_model");

class BiliOtherPage {
    /**
     *
     * @param {BiliDynamicPage} bili_dynamic_page
     */
    constructor({bili_dynamic_page}) {
        this.bili_dynamic_page = bili_dynamic_page;
        this.global_var = new BaseGlobalVar()
    }

    /**
     * 这个方法可以重写也可以不重写
     * @param {ExcTaskParams[]} tasks
     * @param {number} maxRetries
     * @return {Promise<boolean>}
     */
    async #executeWithRetry(tasks, maxRetries = 3,) {
        throw new Error(`未重载【${this.#executeWithRetry.name}】方法！！！`)
        // for (let i = 0; i < tasks.length; i++) {
        //     const {func, params, err, pg, reload_when_err} = tasks[i];
        //     let retries = 0;
        //     let success = false;
        //
        //     while (!success && retries < maxRetries) {
        //         try {
        //             await func(...params);
        //             success = true
        //         } catch (error) {
        //             retries++;
        //             console.error(`Error executing function ${func.name}:`, error);
        //             if (retries < maxRetries) {
        //                 console.warn(`Retrying (${retries}/${maxRetries})...`);
        //                 await sleep(1e3);
        //                 if (reload_when_err) {
        //                     await pg.reload()
        //                 }
        //             } else {
        //                 console.error('Max retries reached. Break the tasks.');
        //                 throw error;
        //             }
        //             if (pg.isClosed()) {
        //                 this.global_var.current_page = await this.bili_dynamic_page.create_new_pg(BiliElementMap.browser_usage.daily_task)
        //             }
        //         }
        //     }
        //     if (!success) {
        //         console.error(`Failed to execute function ${func.name} after ${maxRetries} retries.`);
        //         return false
        //     }
        // }
        // return true
    }

    async get_user_nav(pg = this.global_var.current_page) {
        if (Object.keys(this.bili_dynamic_page.global_var.user_info.user_nav).length !== 0) return;
        await Promise.all([
            pg.goto(BiliElementMap.url_path.space.message),
            pg.waitForResponse(resp => resp.url().includes(BiliElementMap.url_path.user.nav)).then(async resp => this.bili_dynamic_page.global_var.user_info.user_nav = await resp.json())
        ])
    }

    async main() {

        throw new Error("You must override main in a subclass.");
    }
}

module.exports = {
    BiliOtherPage
}