/*
 * @Author: 星瞳 1944637830@qq.com
 * @Date: 2024-04-08 15:40:03
 * @LastEditors: 星瞳 1944637830@qq.com
 * @LastEditTime: 2024-05-31 17:30:06
 * @FilePath: \tampermonkey\ExpressServerEnd\test\sql_test.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
const sqlhelper = require("../SqlHelper/SqlHelper");

(async () => {
	let resp = await sqlhelper.get_user_info_by_user_name('admin');
	console.log(JSON.stringify(resp,'','\t'));
})();
