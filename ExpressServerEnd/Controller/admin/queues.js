const {createBullBoard} = require('@bull-board/api');
const {BullAdapter} = require('@bull-board/api/bullAdapter');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const {ExpressAdapter} = require('@bull-board/express');
const {task_manager} = require('@/ExpressServerEnd/Service/background_task_module/task_manager_service');
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');
const {addQueue, removeQueue, setQueues, replaceQueues} = createBullBoard({
    queues: [new BullAdapter(task_manager.dynamic_lottery_queue, {readOnlyMode: false})],
    serverAdapter: serverAdapter,
});

module.exports = serverAdapter;
