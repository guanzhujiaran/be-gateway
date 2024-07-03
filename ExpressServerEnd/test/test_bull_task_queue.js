const {addAliases} = require("module-alias");
addAliases({
  '@'  :'K:/BiliPPTRVerDEV/',
});
const {task_manager} = require('@/ExpressServerEnd/Service/background_service/custom_bull')

function sleep(ms) {
    return new Promise(resolve => setTimeout(() => resolve(sleep), ms));
}

(async ()=> {
    console.log(0)
    task_manager.user_global_lottery_queue.add( {uid: 1919810})

    while (1) {
        let jobs = await task_manager.user_global_lottery_queue.getJobs(['completed','waiting', 'active','delayed','failed','paused'])
        for (let job of jobs) {
            let status = await job.getState()

            console.log(status)

        }
        await sleep(10e3)
    }
})()
