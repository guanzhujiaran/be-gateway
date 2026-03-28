const { BaseTasks } = require("@/ExpressServerEnd/Service/background_task_module/base_task");
const { Worker } = require('bullmq');
const { t } = require("@/ExpressServerEnd/Tool/Utl");
const { redis_manager } = require('@/ExpressServerEnd/DAO/Redis/RedisManager');

class SystemMqTaskManager extends BaseTasks {
    constructor() {
        super();
        const system_pushme_worker = new Worker(
            this.SystemQueueName.system_pushme_queue,
            async job => {
                console.debug(`system pushme worker start:`, job);
                await t.push_plus(job.data);
            },
            {
                concurrency: 10,
                connection: redis_manager.connection,
                autorun: false
            },
        )

        system_pushme_worker.run();
    };

    async add_system_pushme_task({ title, msg }) {
        return await this.system_pushme_queue.add(this.SystemQueueName.system_pushme_queue, { title, msg });
    }
}

system_mq_task_manager = new SystemMqTaskManager();

module.exports = { system_mq_task_manager };