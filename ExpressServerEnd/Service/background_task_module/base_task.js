const {Queue} = require("bullmq");
const {redis_manager} = require("@/ExpressServerEnd/DAO/Redis/RedisManager");

/**
 *
 * @param queue_name {string}
 * @return {Queue}
 */
const queueFactory = (queue_name) => {
    return new Queue(queue_name, {
            connection: redis_manager.connection,
            defaultJobOptions: {
                removeOnComplete: true,
                removeOnFail: false,
                attempts:3,
                backoff: {
                    type: "exponential",
                    delay: 10e3,
                }
            },
        },
    )
}

class BaseTasks {
    /**
     * 专门存放B站页面的队列名称
     * @type {{dynamic_lottery_queue: string, live_lottery_queue: string, daily_task_queue: string, unfollow_task_queue: string, read_msg_task_queue: string}}
     */
    BiliPageQueueName = {
        dynamic_lottery_queue: "dynamic_lottery_queue",
        live_lottery_queue: "live_lottery_queue",
        daily_task_queue: "daily_task_queue",
        unfollow_task_queue: "unfollow_task_queue",
        read_msg_task_queue: "read_msg_task_queue",
    };
    SystemQueueName = {
        system_pushme_queue: "system_pushme_queue",
    }
    dynamic_lottery_queue = queueFactory(this.BiliPageQueueName.dynamic_lottery_queue);
    live_lottery_queue = queueFactory(this.BiliPageQueueName.live_lottery_queue);
    daily_task_queue = queueFactory(this.BiliPageQueueName.daily_task_queue);
    unfollow_task_queue = queueFactory(this.BiliPageQueueName.unfollow_task_queue);
    read_msg_task_queue = queueFactory(this.BiliPageQueueName.read_msg_task_queue);


    system_pushme_queue = queueFactory(this.SystemQueueName.system_pushme_queue);
}

module.exports = {BaseTasks};
