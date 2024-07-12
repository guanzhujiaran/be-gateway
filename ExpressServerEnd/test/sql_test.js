/*
 * @Author: 星瞳 1944637830@qq.com
 * @Date: 2024-04-08 15:40:03
 * @LastEditors: 星瞳 1944637830@qq.com
 * @LastEditTime: 2024-05-31 17:30:06
 * @FilePath: \tampermonkey\ExpressServerEnd\test\sql_test.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
const {addAliases} = require("module-alias");

addAliases({
    '@': 'K:/BiliPPTRVerDEV/',
});
const {AccountDao} = require("@/ExpressServerEnd/DAO/AccountDao");
const {UserDao} = require('@/ExpressServerEnd/DAO/UserDao');
const {AccountLogDao} = require('@/ExpressServerEnd/DAO/AccountLogDao');
const {AccountLogService} = require('@/ExpressServerEnd/Service/account_log_module/account_log_service');
const {manual_op_fail_model} = require('@/ExpressServerEnd/BiliPPTR/models/pages/bili_dynamic_page_model');
(async () => {
    let resp = await AccountLogService.add_lottery_log_by_account_id(
        26,
        {
            dynamic_info: {
                "dynId": "944940891626274816",
                "dynamicUrl": "https://t.bilibili.com/944940891626274816?tab=2",
                "authorName": "太平洋科技网",
                "up_uid": 26987075,
                "pubTime": "2024-06-20T10:13:16",
                "dynContent": "一键升降，快人一步！Videofast一键升降三脚架，科仔爱了！【关注】@太平洋科技网 + @Ulanzi优篮子 ，【转评赞】此动态，7月10日随机抽1位小可爱送【优篮子VL49口袋补光灯】；#供电局福利##转发抽奖# #互动抽奖#",
                "commentCount": 10,
                "repostCount": 10,
                "highlightWords": "",
                "officialLotType": "",
                "officialLotId": "",
                "isOfficialAccount": 1,
                "isManualReply": "人工判断",
                "isFollowed": 1,
                "isLot": 1,
                "hashTag": ""
            },
            err_msg: '1145141919810',
        },
        true,
        true,
        '114514',
    );
    // let resp = await AccountDao.get_reserve_lottery_infos(1,);
    console.log(resp)
    console.log(JSON.stringify(resp, '', '\t'));
})();
