/*
 * @Author: 星瞳 1944637830@qq.com
 * @Date: 2023-12-02 19:31:39
 * @LastEditors: 星瞳 1944637830@qq.com
 * @LastEditTime: 2024-02-10 15:38:21
 * @FilePath: \tampermonkey\CONFIG.Default.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */

const GLOBAL_CONFIG = {
	unfollow_module: {
		max_follow_num: 2800, //最多关注数
	},
	live_module: {
		gift_send_live_room: {
			url: "https://live.bilibili.com/24354075",
			url_backup: "https://live.bilibili.com/1872831",
			room_id: 24354075,
			room_id_backup: 1872831,
		},
		wss_port: 5705, //直播发弹幕通知的wss消息的端口
	},
	lot_module: {
		non_lottery_up_mids: [//不去参与这些up的动态抽奖
			"571791768",
			"391464745",
			"14064125",
			"332793152",
			"54790268",
			"46880349",
			"294887687",
			"3493120108923438",
			"3537106980833281",
			"3532811",
			"1508263674",
		],
	},
};

module.exports = GLOBAL_CONFIG;
