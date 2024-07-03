const {redis_manager} = require('@/ExpressServerEnd/DAO/Redis/RedisManager');
const {Queue, Worker} = require('bullmq');
const {AccountDao} = require("@/ExpressServerEnd/DAO/AccountDao");
const {UserDao} = require("@/ExpressServerEnd/DAO/UserDao");
const {base_api_model} = require("@/ExpressServerEnd/Model/base_model/base_model");
const {LIVE_LOT_Service} = require("@/直播模块/live_op");
const {event_bus, EVENT_NAME_MAP} = require('@/lib/helper/event_bus')
const BiliLotteryOpus = require("@/ExpressServerEnd/BiliPPTR/main/bili_lottery_opus");
const {
    utils,
    pptr_op,
    sleep
} = require("@/ExpressServerEnd/BiliPPTR/utils/utils");
const {AccountLogDao} = require("@/ExpressServerEnd/DAO/AccountLogDao");

class TaskManager {
    /**
     *
     * @type {{[string]:{[string]:BiliLotteryOpus}}}
     */
    user_account_hash_map = {
        // user_id:{account_id1:xxx,account_id2:xxx}
    }
    opus_list = []
    live_service = new LIVE_LOT_Service(this.opus_list);
    dynamic_lottery_queue = new Queue("dynamic_lottery_queue", {
            connection: redis_manager.connection,
            defaultJobOptions: {
                removeOnComplete: true,
                removeOnFail: true,
                // attempts:3,
                backoff:{
                    type:"exponential",
                    delay:10e3,
                }
            },

        },
    );
    /**
     * update_ts 抽奖数据获取时间 秒
     * @type {
     * {data: {
     * common_lottery:*[],
     * must_join_common_lottery:*[],
     * official_lottery:*[],
     * reserve_lottery:*[]
     * },
     *  update_ts: number
     * }
     * }
     */
    #bili_lottery_data = {
        data: undefined,
        update_ts: undefined,
    };

    /**
     * 任务管理器，将任务都放到队列里面执行，这里连接到木偶模块，直接执行抽奖任务等！
     */
    constructor() {
        this.dynamic_lottery_queue.addListener('completed', function (job, result) {
            console.log(result);
            // A job successfully completed with a `result`.
            job.remove(); // 移除任务记录，防止下次添加同名jobId失败
        })
        this.dynamic_lottery_queue.on("error", async function (job, err) {
            // await pptr_op.my_send_notify.push_me(`${job.name}执行失败！`, `${err}`)
            console.error(`${job.name}执行失败！`, `${err}`);
        })
        const dynamic_lottery_worker = new Worker("dynamic_lottery_queue", // 如果程序中断，bull里面自动会尝试再次执行！
            async job => {
                let {uid, account_name} = job.data
                console.log(`执行B站抽奖任务${JSON.stringify(job)}`);
                /**
                 * @type {BiliLotteryOpus}
                 */
                let opus = await this.#get_bili_opus_by_uid_account_name({
                    uid: uid,
                    account_name: account_name
                })

                return await opus.GetBiliDynamicPage().then(async BP => {
                    if (this.#bili_lottery_data.update_ts === undefined || (Date.now() / 1e3 - this.#bili_lottery_data.update_ts) > 60 * 60 * 24) {
                        this.#bili_lottery_data.data = await utils.BiliAPI.BiliAPI.get_lottery_database()
                        await job.log("添加抽奖数据至pg数据库！")
                        if (!this.#bili_lottery_data.data) return await pptr_op.my_send_notify.push_me('抽奖数据库内容为空！', "")
                        await Promise.all(this.#bili_lottery_data.data.common_lottery.map(async el => await AccountLogDao.add_dynamic_info(el)))
                        await Promise.all(this.#bili_lottery_data.data.official_lottery.map(async el => await AccountLogDao.add_official_dynamic_info(el)))
                        await Promise.all(this.#bili_lottery_data.data.reserve_lottery.map(async el => await AccountLogDao.add_reserve_info(el)))
                        this.#bili_lottery_data.update_ts = parseInt((Date.now() / 1e3).toFixed())
                        await job.log("抽奖数据添加至pg数据库成功！")
                    }
                    await BP.main(this.#bili_lottery_data.data);
                    if (job.data.isRemoved !== true) {
                        await this.#restart_lot_by_bili_dynamic_page_instance(BP);
                    }
                })
            },
            {
                concurrency: 10,
                connection: redis_manager.connection
            },
        )


        event_bus.on(EVENT_NAME_MAP.ALL_LIVE_LOT, async () => {
            await this.live_service.main();
        })
        // event_bus.emit(EVENT_NAME_MAP.ALL_LIVE_LOT) // 将直播任务丢到event里面执行
        event_bus.on(EVENT_NAME_MAP.log, async () => {
            while (1) {
                //n^2的复杂度？进行轮询
                let lotting_users = []
                let none_lotting_users = []

                for (let [user_name, account_infos] of Object.entries(this.user_account_hash_map)) {
                    let lotting_accounts = [];
                    let none_lotting_accounts = []
                    for (let [account_name, opus] of Object.entries(account_infos)) {
                        let BiliDynamicPage = await opus.GetBiliDynamicPage()
                        if (!BiliDynamicPage.global_var.FLAG.抽奖中标志) {
                            // 抽奖结束或没在抽奖
                            none_lotting_accounts.push(account_name)
                        } else {
                            lotting_accounts.push(account_name)
                        }
                    }
                    none_lotting_users.push({
                        user_name: none_lotting_accounts
                    })
                    lotting_users.push({user_name: lotting_accounts})
                }
                console.debug(`抽奖中的账号：${JSON.stringify(lotting_users, undefined, '\t')}\n空闲中的账号：${JSON.stringify(none_lotting_users, undefined, '\t')}`)
                await sleep(30e3)
            }

        })
        event_bus.emit(EVENT_NAME_MAP.log)
    }

    /**
     * 获取opus实例，如果不存在则创建，仅限于内部使用
     * @param uid
     * @param account_name
     * @return {Promise<*>}
     */
    async #get_bili_opus_by_uid_account_name({uid, account_name}) {
        let opus = this.user_account_hash_map[uid] && this.user_account_hash_map[uid][account_name]
        if (opus) {
            return opus
        }
        await this.add_user_account_task(uid, account_name);
        return this.user_account_hash_map[uid][account_name]
    }

    /**
     *
     * @param {BiliDynamicPage}BiliDynamicPage
     * @return {Promise<void>}
     */
    async #restart_lot_by_bili_dynamic_page_instance(BiliDynamicPage) {
        if (!BiliDynamicPage.global_var.FLAG.抽奖中标志) {
            // 抽奖结束或没在抽奖
            let start_time = BiliDynamicPage.start_time;
            let now = new Date();
            let tomorrow = new Date(
                start_time.getFullYear(),
                start_time.getMonth(),
                start_time.getDate() + 1,
                8
            ); //开始时间的第二天
            let times = (tomorrow - now) / 1000;
            let hh = (times / 3600).toFixed(); //小时
            let shh = times - hh * 3600;
            let ii = (shh / 60).toFixed();
            let ss = shh - ii * 60;

            await this.dynamic_lottery_queue.add(EVENT_NAME_MAP.lot, {
                    uid: BiliDynamicPage.user_id,
                    account_name: BiliDynamicPage.account_name
                }, {
                    jobId: `${EVENT_NAME_MAP.lot}_${BiliDynamicPage.user_id}_${BiliDynamicPage.account_name}`,
                    delay: tomorrow - now,
                }
            )
            console.log(
                `账号【${BiliDynamicPage.uname}\t${BiliDynamicPage.account_name}】抽奖启动于：${start_time.toLocaleString()} 已完成\n下一轮启动于${
                    tomorrow - now > 0 ? utils.Common.timestampToTime(tomorrow) : utils.Common.timestampToTime(now)
                }`
            );

        }
    }

    /**
     * 将账号添加到任务队列
     * @param uid {number}
     * @param account_name {string}
     */
    async add_user_account_task(uid, account_name) {
        if (!this.user_account_hash_map[uid]) {
            Object.assign(this.user_account_hash_map, {[uid]: {}})
        }
        if (this.user_account_hash_map[uid][account_name]) {
            return new base_api_model(
                {
                    code: 1001,
                    msg: "账号任务已存在！"
                }
            )
        }
        let user_info = await UserDao.get_user_info_by_uid(uid);
        if (!user_info) {
            return new base_api_model(
                {
                    code: 1000,
                    msg: "账号不存在，无法执行任务！"
                }
            )
        }


        let bili_lottery_opus = new BiliLotteryOpus({
            user_id: user_info.uid,
            user_name: user_info.user_name,
            account_name: account_name
        });
        // this.live_service.DO_Lottery_list.push(await bili_lottery_opus.GetBiliDynamicPage())
        // TODO 添加直播服务
        Object.assign(this.user_account_hash_map[uid], {[account_name]: bili_lottery_opus})
        this.opus_list.push(bili_lottery_opus)
        await this.dynamic_lottery_queue.add(EVENT_NAME_MAP.lot, {uid, account_name}, {
            jobId: `${EVENT_NAME_MAP.lot}_${uid}_${account_name}`,
        })

        return new base_api_model({
            data: true,
            msg: '添加成功！'
        })
    }


    async remove_user_account_task_before_next_job(uid, account_name) {
        if (!this.user_account_hash_map[uid]) {
            Object.assign(this.user_account_hash_map, {[uid]: {}})
        }
        if (this.user_account_hash_map[uid][account_name]) {
            let job = await this.dynamic_lottery_queue.getJob(`${EVENT_NAME_MAP.lot}_${uid}_${account_name}`);
            await job.updateData({isRemoved: true})
            await job.remove();
            return new base_api_model(
                {
                    code: 0,
                    data: true,
                    msg: "移除任务成功！下一轮抽奖生效！"
                }
            )
        }
        return new base_api_model(
            {
                code: 1000,
                msg: "账号没在运行，无法获取运行状态"
            }
        )
    }

    async bulk_add_user_tasks(uid) {
        if (!this.user_account_hash_map[uid]) {
            Object.assign(this.user_account_hash_map, {[uid]: {}})
        }
        let user_info = await UserDao.get_user_info_by_uid(uid);
        if (!user_info) {
            return new base_api_model(
                {
                    code: 1000,
                    msg: "账号不存在，无法执行任务！"
                }
            )
        }

        let account_list = await AccountDao.get_all_account_info_by_uid(uid);
        if (account_list.length === 0) {
            return new base_api_model({
                code: 1000,
                msg: "账号数量为空，先创建账号！"
            })
        }
        account_list.map(el => {
            if (!this.user_account_hash_map[uid][el.account_name]) {
                let bili_lottery_opus = new BiliLotteryOpus({
                    user_id: uid,
                    user_name: user_info.user_name,
                    account_name: el.account_name
                });
                this.live_service.DO_Lottery_list.push(bili_lottery_opus.Do_Lottery)
                Object.assign(this.user_account_hash_map[uid], {[el.account_name]: bili_lottery_opus})
                this.opus_list.push(bili_lottery_opus)
                this.dynamic_lottery_queue.add(EVENT_NAME_MAP.lot, {
                    uid,
                    account_name: el.account_name
                }, {
                    jobId: `${EVENT_NAME_MAP.lot}_${uid}_${el.account_name}`,
                })
            }
        })
        return new base_api_model({
            data: true,
            msg: '添加成功！'
        })
    }

    async get_account_running_status(uid, account_name) {
        /**
         * @type {BiliLotteryOpus}
         */
        let opus = this.user_account_hash_map[uid] ? this.user_account_hash_map[uid][account_name] : undefined
        if (!opus) {
            return new base_api_model(
                {
                    code: 1000,
                    msg: "账号没在运行，无法获取运行状态"
                }
            )
        }
        let BG = await opus.GetBiliDynamicPage()
        let is_lotterying = BG.global_var.FLAG.抽奖中标志;
        return new base_api_model(
            {
                data: {
                    is_running: is_lotterying,
                    last_start_ts: BG.start_time,
                    running_msg: is_lotterying ? "运行中" : "空闲中"
                },
                msg: '获取成功！'
            }
        )
    }


}

task_manager = new TaskManager()

module.exports = {task_manager}