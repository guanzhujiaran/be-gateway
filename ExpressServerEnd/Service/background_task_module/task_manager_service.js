const {redis_manager} = require('@/ExpressServerEnd/DAO/Redis/RedisManager');
const {Worker} = require('bullmq');
const {AccountDao} = require("@/ExpressServerEnd/DAO/AccountDao");
const {UserDao} = require("@/ExpressServerEnd/DAO/UserDao");
const {base_api_model} = require("@/ExpressServerEnd/Model/base_model/base_model");
// const {LIVE_LOT_Service} = require("@/直播模块/live_op");
const {event_bus, EVENT_NAME_MAP} = require('@/lib/helper/event_bus')
const BiliLotteryOpus = require("@/ExpressServerEnd/BiliPPTR/main/bili_lottery_opus");
const {
    utils,
    pptr_op,
    sleep
} = require("@/ExpressServerEnd/BiliPPTR/utils/utils");
const {AccountLogDao} = require("@/ExpressServerEnd/DAO/AccountLogDao");
const config = require("@/ExpressServerEnd/config");
const {BaseTasks} = require("@/ExpressServerEnd/Service/background_task_module/base_task");
const run_env_args = require("@/ExpressServerEnd/config/run_arg");


class TaskManager extends BaseTasks {
    /**
     *
     * @type {{[string]:{[string]:BiliLotteryOpus}}}
     */
    user_account_hash_map = {}
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
        super()
        const dynamic_lottery_worker = new Worker(this.BiliPageQueueName.dynamic_lottery_queue, // 如果程序中断，bull里面自动会尝试再次执行！
            async job => {
                let {uid, account_name} = job.data;
                await this.add_user_account_daily_task({uid: uid, account_name: account_name}, true);
                console.debug(`执行B站抽奖任务${JSON.stringify(job)}`);
                /**
                 * @type {BiliLotteryOpus}
                 */
                let opus = await this.#get_bili_opus_by_uid_account_name({
                    uid: uid,
                    account_name: account_name
                })
                if (!opus) throw Error(`BiliLotteryOpus获取失败！`)
                console.log(`【${uid} ${account_name}】Opus获取成功`)
                return await opus.GetBiliDynamicPage().then(async BP => {
                    if (BP.global_var.FLAG.抽奖中标志) {
                        console.error(`B站动态抽奖执行中！！`)
                        return;
                    }
                    if (this.#bili_lottery_data.update_ts === undefined || (Date.now() / 1e3 - this.#bili_lottery_data.update_ts) > 60 * 60 * 24) {
                        console.log(`获取抽奖数据中！`)
                        let lottery_database_resp = await utils.MYAPI.get_lottery_database()
                        console.log("获取到数据库抽奖数据：", lottery_database_resp)
                        this.#bili_lottery_data.data = lottery_database_resp.data ?? {
                            common_lottery: [],
                            must_join_common_lottery: [],
                            official_lottery: [],
                            reserve_lottery: []
                        }

                        console.log("添加抽奖数据至pg数据库！")
                        if (!this.#bili_lottery_data.data) return await pptr_op.my_send_notify.sys_push_me('抽奖数据库内容为空！', "")
                        await Promise.all(this.#bili_lottery_data.data.common_lottery.map(async el => await AccountLogDao.add_dynamic_info(el)))
                        await Promise.all(this.#bili_lottery_data.data.official_lottery.map(async el => await AccountLogDao.add_official_dynamic_info(el)))
                        await Promise.all(this.#bili_lottery_data.data.reserve_lottery.map(async el => await AccountLogDao.add_reserve_info(el)))
                        this.#bili_lottery_data.update_ts = parseInt((Date.now() / 1e3).toFixed())
                        console.log("抽奖数据添加至pg数据库成功！")
                    }
                    BP.latest_lottery_info = this.#bili_lottery_data.data;
                    await BP.main(this.#bili_lottery_data.data);
                    // let BU = await opus.GetBiliUnfollowPage();
                    // await BU.main();
                    await this.add_user_account_unfollow_task({uid: uid, account_name: account_name});
                    await this.add_read_account_msg({uid, account_name});
                    if (job.data.isRemoved !== true) {
                        await this.#restart_lot_by_bili_dynamic_page_instance(BP);
                    }
                    console.log(BP.log_format(`【B站动态抽奖】任务执行完毕！`))
                }).catch(e => {
                    console.error(e)
                    throw e
                })
            },
            {
                concurrency: 10,
                connection: redis_manager.connection,
                autorun: false
            },
        )
        const daily_task_worker = new Worker(this.BiliPageQueueName.daily_task_queue, async job => {
            let {uid, account_name} = job.data
            console.debug(`执行B站每日任务${JSON.stringify(job)}`);
            /**
             * @type {BiliLotteryOpus}
             */
            let opus = await this.#get_bili_opus_by_uid_account_name({
                uid: uid,
                account_name: account_name
            })
            if (!opus) throw Error(`BiliLotteryOpus获取失败！`)
            console.log(`【${uid} ${account_name}】Opus获取成功`)
            return opus.GetBiliDailyTaskPage().then(async BD => {
                await BD.main();
                await this.add_read_account_msg({uid, account_name});
            })
        }, {
            concurrency: 10,
            connection: redis_manager.connection,
            autorun: false
        })
        const unfollow_task_worker = new Worker(this.BiliPageQueueName.unfollow_task_queue, async job => {
            let {uid, account_name} = job.data
            console.debug(`执行B站取关任务${JSON.stringify(job)}`);
            /**
             * @type {BiliLotteryOpus}
             */
            let opus = await this.#get_bili_opus_by_uid_account_name({
                uid: uid,
                account_name: account_name
            })
            if (!opus) throw Error(`BiliLotteryOpus获取失败！`)
            console.log(`【${uid} ${account_name}】Opus获取成功`)
            return opus.GetBiliUnfollowPage().then(async BU => {
                await BU.main();
            })
        }, {
            concurrency: 10,
            connection: redis_manager.connection,
            autorun: false
        })
        const live_lottery_worker = new Worker(this.BiliPageQueueName.live_lottery_queue, async job => {
                let {uid, account_name, lottery_info} = job.data
                console.debug(`执行B站直播抽奖任务${JSON.stringify(job)}`);
                /**
                 * @type {BiliLotteryOpus}
                 */
                let opus = await this.#get_bili_opus_by_uid_account_name({
                    uid: uid,
                    account_name: account_name
                })
                if (!opus) throw Error(`BiliLotteryOpus获取失败！`)
                console.debug(`【${uid} ${account_name}】执行B站直播抽奖任务 Opus获取成功`)
                return opus.GetBiliLiveLotPage().then(async BL => {
                    await BL.main({lottery_info: lottery_info});
                })
            }, {
                concurrency: 10,
                connection: redis_manager.connection,
                autorun: false
            }
        )
        const read_msg_worker = new Worker(this.BiliPageQueueName.read_msg_task_queue, async job => {
                let {uid, account_name} = job.data
                console.debug(`执行B站阅读消息任务${JSON.stringify(job)}`);
                /**
                 * @type {BiliLotteryOpus}
                 */
                let opus = await this.#get_bili_opus_by_uid_account_name({
                    uid: uid,
                    account_name: account_name
                })
                if (!opus) throw Error(`BiliLotteryOpus获取失败！`)
                console.log(`【${uid} ${account_name}】Opus获取成功`)
                return opus.GetBiliMsgPage().then(async BR => {
                    await BR.main();
                });
            },
            {
                concurrency: 10,
                connection: redis_manager.connection,
                autorun: false
            }
        )
        if (run_env_args['env'] === 'dev') {
            dynamic_lottery_worker.run();
            daily_task_worker.run();
            unfollow_task_worker.run()
            live_lottery_worker.run()
            read_msg_worker.run();
        }
        event_bus.on(EVENT_NAME_MAP.ALL_LIVE_LOT, async () => {
                while (1) {
                    let lottery_infos = await utils.MYAPI.get_live_lottery({get_all: false}).catch(e => {
                        console.error(`获取直播信息失败！`, e.message);
                        return []
                    });
                    // console.debug(`获取到直播抽奖信息：${JSON.stringify(lottery_infos, undefined, '\t')}`)
                    lottery_infos.map(async lottery_info => {
                        for (let [user_name, account_infos] of Object.entries(this.user_account_hash_map)) {
                            for (let [account_name, opus] of Object.entries(account_infos)) {
                                let BiliDynamicPage = await opus.GetBiliDynamicPage()
                                await this.add_user_account_live_lot_task({
                                        uid: BiliDynamicPage.user_id,
                                        account_name: account_name,
                                        lottery_info: lottery_info
                                    }
                                )
                            }
                        }
                    })
                    await sleep(10e3); // 10秒后重新获取
                }
            }
        )
        event_bus.emit(EVENT_NAME_MAP.ALL_LIVE_LOT) // 将直播任务丢到event里面执行
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
                        }
                    )
                    lotting_users.push({user_name: lotting_accounts})
                }
                // console.debug(`抽奖中的账号：${JSON.stringify(lotting_users, undefined, '\t')}\n空闲中的账号：${JSON.stringify(none_lotting_users, undefined, '\t')}`)
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
        let opus = this.user_account_hash_map[uid] && this.user_account_hash_map[uid][account_name];
        if (opus) {
            return opus;
        }
        await this.add_user_account_dynamic_lottery_task(uid, account_name);
        return this.user_account_hash_map[uid][account_name];
    }

    /**
     *
     * @param {BiliDynamicPage}BiliDynamicPage
     * @return {Promise<void>}
     */
    async #restart_lot_by_bili_dynamic_page_instance(BiliDynamicPage) {
        if (!BiliDynamicPage.global_var.FLAG.抽奖中标志) {
            // 抽奖结束或没在抽奖
            let start_time = new Date(BiliDynamicPage.start_time);
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
     * 将每日任务添加到队列
     * @param uid
     * @param account_name
     * @param immediate_run_once
     * @return {Promise<void>}
     */
    async add_user_account_daily_task({uid, account_name}, immediate_run_once = false) {
        if (immediate_run_once) {
            await this.daily_task_queue.add(EVENT_NAME_MAP.Daily_TASK, {
                    uid: uid,
                    account_name: account_name
                }, {
                    jobId: `${EVENT_NAME_MAP.Daily_TASK}_${uid}_${account_name}`,
                }
            )
        }
        await this.daily_task_queue.add(EVENT_NAME_MAP.Daily_TASK, {
                uid: uid,
                account_name: account_name
            }, {
                jobId: `${EVENT_NAME_MAP.Daily_TASK}_${uid}_${account_name}`,
                repeat: {
                    pattern: config.cron_config.daily_task
                }
            }
        )
    }

    async add_read_account_msg({uid, account_name}) {
        await this.read_msg_task_queue.add(this.BiliPageQueueName.read_msg_task_queue, {
                uid: uid,
                account_name: account_name
            }, {
                jobId: `${EVENT_NAME_MAP.READ_MSG_TASK}_${uid}_${account_name}`,
            }
        )
    }

    async add_user_account_live_lot_task({uid, account_name, lottery_info}) {
        await this.live_lottery_queue.add(this.BiliPageQueueName.live_lottery_queue, {
            uid: uid,
            account_name: account_name,
            lottery_info: lottery_info
        })
    }

    /**
     * 执行取关任务
     * @param uid
     * @param account_name
     * @return {Promise<void>}
     */
    async add_user_account_unfollow_task({uid, account_name}) {
        await this.unfollow_task_queue.add(EVENT_NAME_MAP.Lot_Unfollow, {
                uid: uid,
                account_name: account_name
            }, {
                jobId: `${EVENT_NAME_MAP.Lot_Unfollow}_${uid}_${account_name}`,
            }
        )
    }

    /**
     *
     * @param uid
     * @param account_name
     * @return {Promise<BiliLotteryOpus|null>}
     */
    async get_user_account_opus(uid, account_name) {
        if (!this.user_account_hash_map[uid]) {
            Object.assign(this.user_account_hash_map, {[uid]: {}})
        }
        let opus = this.user_account_hash_map[uid][account_name]
        if (opus) {
            await opus.GetBiliDynamicPage()
            return opus;
        }
        let user_info = await UserDao.get_user_info_by_uid(uid);
        if (!user_info) {
            return null
        }


        let bili_lottery_opus = new BiliLotteryOpus({
            user_id: user_info.uid,
            user_name: user_info.user_name,
            account_name: account_name
        });
        await bili_lottery_opus.GetBiliDynamicPage()
        return bili_lottery_opus;
    }

    //region Serivce 接口可以直接调用的服务
    async add_user_account_read_msg({uid, account_name}) {
        await this.add_read_account_msg({uid, account_name});
        return new base_api_model({
            msg: "读取私信任务添加成功！"
        })
    }

    /**
     * 将账号添加到任务队列
     * @param uid {number}
     * @param account_name {string}
     */
    async add_user_account_dynamic_lottery_task(uid, account_name) {
        if (!this.user_account_hash_map[uid]) {
            Object.assign(this.user_account_hash_map, {[uid]: {}})
        }
        let opus = this.user_account_hash_map[uid][account_name]
        if (opus) {
            let BG = await opus.GetBiliDynamicPage()
            if (BG && BG.global_var.FLAG.抽奖中标志) {
                return new base_api_model(
                    {
                        code: 1001,
                        msg: "账号抽奖任务正在执行中"
                    }
                )
            }
            await this.dynamic_lottery_queue.add(EVENT_NAME_MAP.lot, {uid, account_name}, {
                jobId: `${EVENT_NAME_MAP.lot}_${uid}_${account_name}`,
            })
            return new base_api_model(
                {
                    code: 1001,
                    msg: "账号任务已在队列中！"
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
        Object.assign(this.user_account_hash_map[uid], {[account_name]: bili_lottery_opus})
        await this.dynamic_lottery_queue.add(EVENT_NAME_MAP.lot, {uid, account_name}, {
            jobId: `${EVENT_NAME_MAP.lot}_${uid}_${account_name}`,
        })
        await this.add_user_account_daily_task({uid: uid, account_name: account_name}, true);
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
                // this.live_service.DO_Lottery_list.push(bili_lottery_opus.Do_Lottery)
                Object.assign(this.user_account_hash_map[uid], {[el.account_name]: bili_lottery_opus})
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

    async apply_account_lottery_setting({uid, account_name, lottery_setting}) {
        if (!this.user_account_hash_map[uid] || !this.user_account_hash_map[uid][account_name]) {
            return new base_api_model(
                {
                    code: 0,
                    msg: "设置同步成功"
                }
            )
        }
        let opus = await this.get_user_account_opus(uid, account_name);
        if (!opus) return new base_api_model(({
            code: 1000,
            msg: "账号不存在，无法应用设置！"
        }))
        opus.SetBiliLotterySetting(lottery_setting);
        return new base_api_model(
            {
                code: 0,
                msg: "设置同步成功"
            }
        )

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

    //endregion
}

task_manager = new TaskManager()

module.exports = {task_manager}