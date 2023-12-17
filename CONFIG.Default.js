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
		wss_url:"wss://127.0.0.1:5705"//直播发弹幕通知的wss消息的端口
	},
};
module.exports = GLOBAL_CONFIG;
