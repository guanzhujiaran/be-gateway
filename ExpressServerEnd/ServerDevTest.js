/*
 * @Author: 星瞳 1944637830@qq.com
 * @Date: 2024-04-08 14:31:18
 * @LastEditors: 星瞳 1944637830@qq.com
 * @LastEditTime: 2024-05-31 12:49:39
 * @FilePath: \tampermonkey\ExpressServerEnd\ServerRun.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
const {addAliases} = require("module-alias");
addAliases({
    '@': 'K:/BiliPPTRVerDEV/',
});
const {task_manager} = require("@/ExpressServerEnd/Service/background_task_module/task_manager_service");

let test_uid = 11;
let test_account_name = 'cookie1';

(async () => {
    await task_manager.add_read_account_msg({uid: test_uid, account_name: test_account_name});
})();