/**
 * 动态抽奖用的全局变量
 */
class BaseGlobalVar {
    /**
     * @type {Page | undefined}
     */
    current_page;
}

class DynamicLotteryGlobalVar extends BaseGlobalVar {


    current_dynamic_id = 0
    TIME = {
        Init_Time: new Date(Date.now()), /**@property 非抽奖时间段*/
        None_Lottery_Time: ["2:00", "9:00"], /**@property 参加x秒以内必须参加的预约抽奖 */
        Reserve_Lottery_time: 30 * 3600 * 24,
    }
    /**
     *
     * @type {{page_url: *, create_dyn_response: *, msgfeed_unread: *, comment_dyn_response: *, space_reservation: *, global_dynamic_data: *, relation_modify_response: *, dynamic_thumb_response: *, reply_main: *}}
     */
    response = {
        /**@property 获取全局动态响应的网址 */
        page_url: undefined, /**@property 全局的动态数据 */
        global_dynamic_data: undefined, //全局的动态数据
        /**@property 创建或转发动态的响应 */
        create_dyn_response: undefined, //创建或转发动态的响应
        /**@property 自己评论动态的响应 */
        comment_dyn_response: undefined, //自己评论动态的响应
        /**@property 关注响应 */
        relation_modify_response: undefined, //关注响应
        /**@property 点赞动态响应 */
        dynamic_thumb_response: undefined, //点赞动态响应
        /**@property 空间预约响应 */
        space_reservation: undefined, //空间预约响应
        /**@property 评论区响应 */
        reply_main: undefined, /**@property 我的消息响应 */
        msgfeed_unread: undefined,
    }
    FLAG = {
        吃饭休息标志: false,
        opus动态标志: false,
        抽奖中标志: false,
        风控标志: false,
        抽奖暂停标志: false, //抽奖暂停标志
        初始化浏览器中标志: false,
        执行其他任务中标志: false,//是否在执行其他任务（对于当前页面而言）
    }
    recorded_data = "" //抽奖反馈信息
    user_info = {
        user_nav: {},
        uid: undefined,
        uname: undefined,
    }

    /**
     * 刷新全局响应
     */
    fresh_global_response() {
        Object.keys(this.response).forEach((key) => {
            this.response[key] = undefined;
        });
    }

    constructor(system_user_name, system_account_name) {
        super();
        this.system = {
            user_name: system_user_name,
            account_name: system_account_name,
        }
    }
}


module.exports = {DynamicLotteryGlobalVar, BaseGlobalVar};