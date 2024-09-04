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

    await bg.account_page_init(false);
    let pg = bg.global_var.current_page;

})()