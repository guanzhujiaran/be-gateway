
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
			//"294887687",
			"3493120108923438",
			"3537106980833281",
			"3532811",
			"1508263674",
		],
	},
};

module.exports = GLOBAL_CONFIG;
