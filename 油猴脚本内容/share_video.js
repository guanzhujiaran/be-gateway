
function sleep(ms) {
    return new Promise(resolve => setTimeout(() => resolve(sleep), ms));
}
//video_list[1].getElementsByTagName('a')[0].click()
let prevent_filter_module = {
    prevent_filter_init: function () { prevent_filter_module.share_video(lottery_setting.share_video_num) },
    share_video: async function (share_num) {
        async function get_video_list(__share_num) {
            let share_video_list = []
            while (1) {
                if (share_video_list.length > __share_num * 5) {
                    break
                }
                if (document.getElementsByClassName('recommended-card')) {
                    for (let _i = 0; _i < document.getElementsByClassName('recommended-card').length; _i++) {
                        if (share_video_list.includes(document.getElementsByClassName('recommended-card')[_i])) { }
                        else {
                            share_video_list.push(document.getElementsByClassName('recommended-card')[_i])
                        }
                    }
                }
                await sleep(1e3)
                document.getElementsByClassName('primary-btn')[0].click()
                await sleep(1e3)
            }
            return share_video_list
        }
        async function share_video_operator() {
            await sleep(1e3)
            $('#share-btn-dynmic').click()
            await sleep(2e3)
            $('.share-btn').click()
            if ($('.success-btn')) {
                window.close()
            }
        }


        let pageurl = location.href
        if (pageurl == 'https://www.bilibili.com/' && lottery_setting.share_video_switch) {
            let video_list = await get_video_list()
            let share_video_list = []
            video_list = utl.part_shuffle(video_list.length, video_list)
            video_list.some((rcm_video) => {
                for (i = 0; i < share_num; i++) {
                    if (!share_video_list.includes(rcm_video)) {
                        share_video_list.push(rcm_video)
                    }
                }
            })
            console.log('开始分享视频', share_video_list)
            for (video_elem of share_video_list) {
                lottery_setting.share_video_url = video_elem.getElementsByTagName('a')[0].href
                video_elem.getElementsByTagName('a')[0].click()
                await sleep(lottery_setting.share_video_sleep_time)
            }
        }



        else if (pageurl.includes(lottery_setting.share_video_url && lottery_setting.share_video_switch)) {
            await share_video_operator()
        }

    }
}