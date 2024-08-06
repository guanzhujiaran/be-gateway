const {AccountDao} = require("@/ExpressServerEnd/DAO/AccountDao");
const {GLOBAL_CONFIG} = require("@/ExpressServerEnd/BiliPPTR/config/global_config");

class BiliLotterySetting {

    CONFIG = {
        /**
         * @type {string} 就是account_name，不允许变更！
         */
        COOKIENAME: '',
        /**
         * @type {boolean} 是否开启自动获取每日奖励 （三连，领b币）
         */
        AUTO_DailyReward: true,
        /**
         * @type {number} 抽奖间隔模式：1为总运行时间，2为等间隔.
         */
        lottery_sep_time_type: 1,
        /**
         * @type {boolean} 普通抽奖开关，打开后执行一般抽奖动态id内的动态id
         */
        CommonLottery_switch: false,
        /**
         * @type {boolean} 只参加评论抽奖
         */
        Only_Comment_Lottery_Switch: false,
        /**
         * @type {boolean} 是否参加必抽的官方抽奖
         */
        Official_Lottery_Switch: true,
        /**
         * @type {boolean} 持久化存储用户信息，启动时自动登录，一般设置为true
         */
        PersistStore: true,
        /**
         * @type {string} 尽量都用Default，更改userdatadir，也就是账号名称，用不同的账号名称和用户名来确定唯一的浏览器信息存放路径
         */
        ProfileDir: "Default",
        /**
         * @type {string} 代理，标准格式：http://127.0.0.1:114514
         * 默认设置成本地的ipv6代理
         */
        proxy: GLOBAL_CONFIG.lot_module.default_proxy,
        /**
         * @type {boolean} 是否监听ws，执行统一的刷弹幕操作
         */
        LIVE_SEND_DM: true
    }
    copy_reply_module = {
        /**
         * @type {number} 抄评论时，复制评论的几率（[0,1]）数值越大，触发概率越高
         */
        comment_copy_chance: 0.5,
        /**
         * @type {number} 复制评论时，进行AI改写的几率（[0,1]）数值越大，触发概率越高
         */
        comment_paraphrase_chance: 0.5,
        /**
         * @type {number} 需要人工回复时，进行AI回复的几率（[0,1]）数值越大，触发概率越高
         */
        AI_reply_chance: 0.5
    }
    prevent_module = {
        /**
         * @type {number} 抽奖结束之后分享视频的数量（[0, )）
         */
        share_video_num: 7,
        /**
         * @type {[number,number]} 分享视频的时间间隔（[0, )）
         */
        share_video_sleep_time: [30e3, 50e3],
        /**
         * @type {boolean} 是否开启分享视频功能
         */
        share_video_switch: true,
        /**
         * @type {number} 开启之后根据分享视频概率进行分享
         */
        share_video_chance: 0.5,
        /**
         * @type {number} 分享视频时，复制评论的几率（[0,1]）数值越大，触发概率越高
         */
        share_copy_chance: 0.5,
        /**
         * @type {string[]} 分享视频结束后，创建文字动态的内容
         */
        create_word_dynamic_chp: ["晚安"],
        /**
         * @type {boolean} 是否开启创建文字动态功能（只在结束的时候，并且接近半夜才会生效
         */
        create_word_dynamic_chp_switch: false,
        /**
         * @type {number} 转发抽奖的过程中，分享视频的几率（[0,1]）数值越大，触发概率越高
         */
        share_video_while_repost_chance: 0.5,
        /**
         * @type {number} 每转发x个抽奖的，就分享视频，其中，x∈[0, )
         */
        share_video_while_repost_sepnum: 10,
        /**
         * @type {number} 每转发x个抽奖时，就分享视频y，其中，y∈[0, )
         */
        share_video_num_while_repost: 2,
    }
    lottery_module = {
        /**
         * @type {string} b站账号昵称
         */
        user_name: "",
        /**
         * @type {string} b站账号uid
         *
         */
        user_mid: "",
        /**
         * @type {number[]} 抽奖间隔时间，如果是总抽奖时间，那么后续会重新赋值，按照阶段式设置总运行时间
         */
        Working_clearance_time: [30e3, 40e3, 50e3],
        /**
         * @type {number} 总抽奖运行时间
         */
        lottery_run_time: 3600e3,
        /**
         * @type {number[]} 单个操作之后等待的时间？
         */
        lottery_sep_time: [1e3, 2e3, 3e3],
        /**
         * @type {string[]} 评论时需要@的对象
         */
        at_member: ['_大锦鲤_', '陈睿 ', '哔哩哔哩大会员 ', '哔哩哔哩会员购 ', '哔哩哔哩弹幕网 ', '哔哩哔哩大会员 ', '哔哩哔哩国创 ', '哔哩哔哩番剧 ', '哔哩哔哩晚会 '],
        /**
         * @type {string[]} 对官方的评论
         */
        reply_contents: ['冲'],
        /**
         * @type {string[]} 对非官方的说辞
         */
        non_official_chp: ['冲'],
        /**
         * @type {string[]} 获取评论失败时的默认评论
         */
        defined_reply_msg: ['冲'],
        /**
         * @type {number} 转发动态时，转发内容为评论内容的几率 为0时所有转发的东西都是转发动态
         */
        repost_chance: 0.5,
        /**
         * @type {number} 评论动态时点赞自己评论的几率，（[0,1]）数值越大，触发概率越高
         */
        comment_thumb_chance: 0.5,
    }
    key_word_comment = {
        /**
         * @type {number} 红包大小
         */
        red_pocket: 0.35,
        /**
         * @type {string[]} 问及喜欢的食物时的回复内容
         */
        favorite_food: ['巧克力'],
        /**
         * @type {string[]} 问及喜欢的颜色时的回复内容
         */
        favorite_color: ['白色'],
        /**
         * @type {string[]} 遇到生日动态时的回复内容
         */
        birthday_congratulation: ['生日快乐'],
        /**
         * @type {string[]} 遇到新年动态时的回复内容
         */
        newyear_congratulation: ['新年快乐'],
        /**
         * @type {string[]} 遇到恰饭动态时的回复内容
         */
        qiafan_promotion: ['冲'],
    }
    live_lottery_module = {
        /**@type { boolean } 是否开启*/
        anchor_switch: true,
        redpack_switch: true,
        anchor_unignore_words: [],
        /**@type {number} 红包最低参加的金瓜子价值（1元=1000金瓜子） */
        redpack_limit_price: 50e3,
        risk_sleeptime_s: 60 * 60
    }

    constructor(account_name) {
        this.CONFIG.COOKIENAME = account_name;
    }
}

exports.BiliLotterySetting = BiliLotterySetting;

exports.AccountLotterySettingModel = class AccountLotterySettingModel {
    constructor(account_name) {
        this.lottery_setting = new BiliLotterySetting(account_name);
    }
}
exports.AccountModel = class AccountModel {

    account_name = ""
    account_id = 0
    uid = 0
    info = {
        level: 0, vip: "", face: null, uname: "", uid: ""
    }

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

    async save_lottery_setting_by_account_name_and_uid(account_name, settings) {
        return await AccountDao.save_lottery_setting_by_account_name_and_uid(account_name, this.uid, settings)
    }
}
