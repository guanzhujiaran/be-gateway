const {AccountDao} = require("@/ExpressServerEnd/DAO/AccountDao");

exports.AccountLotterySettingModel = class AccountLotterySettingModel {
    constructor(account_name) {
        this.lottery_setting = {
            CONFIG: {
                COOKIENAME: account_name, //就是account_name，不允许变更！
                AUTO_DailyReward: true,
                lottery_sep_time_type: 1, //抽奖间隔模式：1为总运行时间，2为等间隔.
                CommonLottery_switch: false, //普通抽奖开关，打开后执行一般抽奖动态id内的动态id
                Only_Comment_Lottery_Switch: false, //只参加评论抽奖
                PersistStore: true, //持久化存储用户信息，启动时自动登录，一般设置为true
                ProfileDir: "Default", //尽量都用Default，更改userdatadir
                proxy: "",
                LIVE_SEND_DM: true
            },
            copy_reply_module: {
                comment_copy_chance: 0.5,
                comment_paraphrase_chance: 0.5,
                AI_reply_chance: 0.5
            },
            prevent_module: {
                share_video_num: 7,
                share_video_sleep_time: [30e3, 50e3],
                share_video_url: "",
                share_video_switch: true,//分享视频开关
                share_video_chance: 0.5,//开启之后根据分享视频概率进行分享
                share_copy_chance: 0.5,
                create_word_dynamic_chp: ["晚安"],
                create_word_dynamic_chp_switch: false,//只在结束的时候，并且接近半夜才会生效
                share_video_while_repost_chance: 0.5,
                share_video_while_repost_sepnum: 10,
            },
            official_lottery_switch: true, //执行官方抽奖时自动开启
            user_name: "",
            user_mid: "",
            Working_clearance_time: [30e3, 40e3, 50e3], //抽奖等待固定时间
            lottery_run_time: 3600e3,//总抽奖运行时间
            lottery_sep_time: [10e3, 15e3, 20e3],
            //后续会重新赋值，阶段式运行时间
            at_member: ['_大锦鲤_', '陈睿 ', '哔哩哔哩大会员 ', '哔哩哔哩会员购 ', '哔哩哔哩弹幕网 ', '哔哩哔哩大会员 ', '哔哩哔哩国创 ', '哔哩哔哩番剧 ', '哔哩哔哩晚会 '],
            //评论时需要@的对象
            replycontent: ['冲'],
            //对官方的评论
            non_official_chp: ['冲'],
            //对非官方的说辞
            defined_reply_msg: ['冲'],
            //获取评论失败时的默认评论
            repostchance: 0.5,
            //转发动态时，转发内容为评论内容的几率 为0时所有转发的东西都是转发动态
            comment_thumb_chance: 0.5,
            //评论动态时点赞自己评论的几率
            key_word_comment: {
                //关键词回复内容
                red_pocket: 0.35, //红包大小
                favorite_food: ['巧克力'],
                favorite_color: ['白色'],
                birthday_congratulation: ['生日快乐'],
                newyear_congratulation: ['新年快乐'],
                qiafan_promotion: ['冲'],
            }
        }
    }
}

exports.AccountModel = class AccountModel {

    account_name = ""
    account_id = 0
    uid = 0
    info = {
        level: 0,
        vip: "",
        face: null,
        uname: "",
        uid: ""
    }
    /**
     * @type {AccountLotterySettingModel}
     */
    lottery_setting

    constructor(uid) {
        this.uid = uid
    }

    /**
     * 获取用户所有账号信息
     * @return {Promise<Array<UserAccount>>}
     */
    async get_all_account_info_by_uid() {
        return await AccountDao.get_all_account_info_by_uid(this.uid)
    }

    /**
     * 通过账号名获取账号信息
     * @param account_name {string}
     * @return {Promise<UserAccount | null>}
     */
    async get_account_info_by_account_name(account_name) {
        return await AccountDao.get_account_info_by_account_name_and_uid(account_name, this.uid)
    }

    /**
     *  通过账号id获取账号信息
     * @param account_id {number}
     * @return {Promise<UserAccount | null>}
     */
    async get_account_info_by_account_id(account_id) {
        return await AccountDao.get_account_info_by_account_id_and_uid(account_id, this.uid)
    }


    async add_account(account_name) {
        return await AccountDao.add_account(account_name, this.uid)
    }

    /**
     *
     * @param account_name {string}
     * @return {Promise<UserAccount|undefined>}
     */
    async get_lottery_setting_by_account_name_and_uid(account_name) {
        return await AccountDao.get_lottery_setting_by_account_name_and_uid(account_name, this.uid);
    }
}
