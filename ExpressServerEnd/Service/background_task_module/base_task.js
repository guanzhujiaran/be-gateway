const {Queue} = require("bullmq");
const {redis_manager} = require("@/ExpressServerEnd/DAO/Redis/RedisManager");

class BaseTasks {
    QueueName = {
        dynamic_lottery_queue: "dynamic_lottery_queue",
        live_lottery_queue: "live_lottery_queue",
        daily_task_queue: "daily_task_queue",
        unfollow_task_queue: "unfollow_task_queue",
        read_msg_task_queue: "read_msg_task_queue",
    }
    dynamic_lottery_queue = new Queue(this.QueueName.dynamic_lottery_queue, {
            connection: redis_manager.connection,
            defaultJobOptions: {
                removeOnComplete: true,
                removeOnFail: true,
                // attempts:3,
                backoff: {
                    type: "exponential",
                    delay: 10e3,
                }
            },
        },
    );
    live_lottery_queue = new Queue(this.QueueName.live_lottery_queue, {
            connection: redis_manager.connection,
            defaultJobOptions: {
                removeOnComplete: true,
                removeOnFail: true,
                // attempts:3,
                backoff: {
                    type: "exponential",
                    delay: 10e3,
                }
            },
        },
    );
    daily_task_queue = new Queue(this.QueueName.daily_task_queue, {
            connection: redis_manager.connection,
            defaultJobOptions: {
                removeOnComplete: true,
                removeOnFail: true,
                // attempts:3,
                backoff: {
                    type: "exponential",
                    delay: 10e3,
                }
            },
        },
    );
    unfollow_task_queue = new Queue(this.QueueName.unfollow_task_queue, {
        connection: redis_manager.connection,
        defaultJobOptions: {
            removeOnComplete: true,
            removeOnFail: true,
            // attempts:3,
            backoff: {
                type: "exponential",
                delay: 10e3,
            }
        },
    },)

    read_msg_task_queue = new Queue(this.QueueName.read_msg_task_queue, {
        connection: redis_manager.connection,
        defaultJobOptions: {
            removeOnComplete: true,
            removeOnFail: true,
            // attempts:3,
            backoff: {
                type: "exponential",
                delay: 10e3,
            }
        },
    },)

    constructor() {
    }
}

module.exports = {BaseTasks};
