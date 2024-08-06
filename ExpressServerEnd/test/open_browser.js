(async () => {
    const {addAliases} = require("module-alias");
    addAliases({
        '@': 'K:/BiliPPTRVerDEV/',
    });
    const BiliLotteryOpus = require("@/ExpressServerEnd/BiliPPTR/main/bili_lottery_opus");
    const {UserDao} = require("@/ExpressServerEnd/DAO/UserDao");
    let uid = 11;
    let account_name = 'cookie1';
    let user_info = await UserDao.get_user_info_by_uid(uid);
    let bili_lottery_opus = new BiliLotteryOpus({
        user_id: user_info.uid,
        user_name: user_info.user_name,
        account_name: account_name
    });
    let bg = await bili_lottery_opus.GetBiliDynamicPage()
    await bg.lottery_op.loop.dynamic_lottery([{
        "up_uid": 3461576967326521,
        "repostCount": 999,
        "pubTime": "2024-07-29T12:00:00",
        "officialLotType": "官方抽奖",
        "officialLotId": "309304",
        "isOfficialAccount": -1,
        "isManualReply": "",
        "isLot": 1,
        "isFollowed": 0,
        "highlightWords": "",
        "hashTag": "",
        "dynamicUrl": "https://t.bilibili.com/114514?tab=2",
        "dynId": "114514",
        "dynContent": "测试",
        "commentCount": 999,
        "authorName": "官方抽奖"
    }], "一般转发抽奖")
// await bg.account_page_init(false);
// let pg = bg.global_var.current_page;

})()