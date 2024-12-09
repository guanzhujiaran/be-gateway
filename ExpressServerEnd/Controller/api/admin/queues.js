const {createBullBoard} = require('@bull-board/api');
const {BullMQAdapter} = require('@bull-board/api/bullMQAdapter');
const {ExpressAdapter} = require('@bull-board/express');
const {task_manager} = require('@/ExpressServerEnd/Service/background_task_module/task_manager_service');
const ip = require("ip");
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/api/admin/queues');

const board = createBullBoard({
    queues: [
        new BullMQAdapter(task_manager.daily_task_queue, {readOnlyMode: false}),
        new BullMQAdapter(task_manager.unfollow_task_queue, {readOnlyMode: false}),
        new BullMQAdapter(task_manager.read_msg_task_queue, {readOnlyMode: false}),
        new BullMQAdapter(task_manager.live_lottery_queue, {readOnlyMode: false}),
        new BullMQAdapter(task_manager.dynamic_lottery_queue, {readOnlyMode: false}),
    ],
    serverAdapter: serverAdapter,
});


const bullRouter = serverAdapter.getRouter()
module.exports = {bullRouter};
