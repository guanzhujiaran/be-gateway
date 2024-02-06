/**
 * 通过(调用pptr的page.evaluate等方法)使用B站API接口
 */
const { pptr_op } = require(`../../木偶模块/util/common_utl`);
const BAPI = {
	/**
	 * API发送请求，fetch请求发送失败405的时候多数是content-type为application/json了，这个请求头会触发浏览器的安全机制，很离谱
	 * @param {Page} pg
	 * @param {String} url
	 * @param {String} method
	 * @param {JSON} data
	 * @param {JSON} headers
	 * @param {boolean} 是否发送的是formdata
	 * @returns {Promise<JSON>}
	 */
	ajax: async (pg, url, method, data, headers, isFormData = false) => {
		let new_headers = new Headers({
			accept: "application/json, text/plain, */*",
			"accept-language": "en-US,en;q=0.9",
			"content-type": "application/json",
			"sec-ch-ua":
				'" Not;A Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
			"sec-ch-ua-mobile": "?0",
			"sec-ch-ua-platform": '"Windows"',
			"sec-fetch-dest": "empty",
			"sec-fetch-mode": "cors",
			"sec-fetch-site": "same-site",
			referer: new URL(pg.url()).origin + "/",
		});
		if (headers) {
			for (let key in headers) {
				if (headers[key]) {
					new_headers.set(key, headers[key]);
				} else {
					new_headers.delete(key);
				}
			}
		}
		let last_headers = {};
		for (let i of new_headers) {
			last_headers[i[0]] = i[1];
		}
		if (
			pg.url().includes("bilibili.com") &&
			!url.includes("bilibili.com")
		) {
			await pg.goto(`https://live.bilibili.com/all`);
		}
		await pptr_op.check_page_is_front(pg);

		let resp = await pg.evaluate(
			async (url, method, data, last_headers, isFormData) => {
				let params;
				let body;
				if (method.toLowerCase() == "get") {
					params = data;
				} else {
					body = data;
				}
				if (params) {
					//拼接参数
					let paramsArray = [];
					Object.keys(params).forEach((key) =>
						paramsArray.push(key + "=" + params[key])
					);
					if (url.search(/\?/) === -1) {
						url += "?" + paramsArray.join("&");
					} else {
						url += "&" + paramsArray.join("&");
					}
				}
				if (isFormData) {
					let formdata = new FormData();
					Object.keys(data).forEach((t) => {
						formdata.append(t, data[t]);
					});
					body = formdata;
				}
				let latest_body =
					typeof body == "object" && !(body instanceof FormData)
						? JSON.stringify(body)
						: body;
				console.log(latest_body);
				!latest_body ? (latest_body = null) : undefined;
				let response = await fetch(url, {
					credentials: "include",
					method: method,
					body: latest_body,
					headers: last_headers,
					mode: "cors",
					referrerPolicy: "strict-origin-when-cross-origin",
				});
				return await response.json();
			},
			url,
			method,
			data,
			last_headers,
			isFormData
		);
		return resp;
	},
	/**
	 * 获取uid关注状态
	 * @param {Page} pg
	 * @param {number} uid
	 * @returns
	 */
	IsUserFollow: async (pg, uid) => {
		let url = "https://api.live.bilibili.com/relation/v1/Feed/IsUserFollow";
		let params = { follow: uid };
		return await BAPI.ajax(pg, url, "get", params);
	},
	/**
	 * 获取关注列表
	 * @param {Page} pg
	 * @param {number} uid
	 * @returns
	 */
	get_attention_list: async (pg, uid) => {
		let url = "https://api.vc.bilibili.com/feed/v1/feed/get_attention_list";
		let params = {
			uid: uid,
		};
		return await BAPI.ajax(pg, url, "get", params);
	},
	relation_modify: async (pg, unfollow_mid, csrf, act = 2) => {
		let url = "https://api.bilibili.com/x/relation/modify";
		let data = {
			fid: unfollow_mid,
			act: act,
			re_src: 11,
			spmid: "333.999.0.0",
			extend_content: JSON.stringify({
				entity: "user",
				entity_id: unfollow_mid,
			}),
			csrf: csrf,
		};
		let headers = {
			"content-type": "application/x-www-form-urlencoded",
			accept: "application/json, text/plain, */*",
		};
		return await BAPI.ajax(
			pg,
			url,
			"post",
			new URLSearchParams(data).toString(),
			headers
		);
	},
	queryContributionRank: async (pg, ruid, room_id) => {
		let url =
			"https://api.live.bilibili.com/xlive/general-interface/v1/rank/getOnlineGoldRank";
		let data = {
			ruid: ruid,
			roomId: room_id,
			page: 1,
			pageSize: 50,
		};
		return await BAPI.ajax(pg, url, "get", data);
	},
	/**
	 * 获取关注数量，粉丝数量，动态数量
	 * @param {Page} pg 
	 * @returns {Promise<JSON>}
	 * {
		"code": 0,
		"message": "0",
		"ttl": 1,
		"data": {
			"following": 792,
			"follower": 20,
			"dynamic_count": 603
    }
}
	 */
	web_interface_nav_stat: async (pg) => {
		let url = "https://api.bilibili.com/x/web-interface/nav/stat";
		return await BAPI.ajax(pg, url, "get");
	},
	/**
	 * 获取直播区的个人信息
	 * @param {Page} pg 
	 * @returns {Promise<JSON>}
	 * {
		"code": 0,
		"message": "0",
		"ttl": 1,
		"data": {
			"uid": 4237378,
			"uname": "后藤波奇",
			"face": "https://i0.hdslb.com/bfs/baselabs/c5635c08f60a78beaa42215ecae3d5f569bd7c04.png",
			"billCoin": 792,
			"silver": 369974,
			"gold": 45600,
			"achieve": 380,
			"vip": 0,
			"svip": 0,
			"user_level": 31,
			"user_next_level": 32,
			"user_intimacy": 6631995,
			"user_next_intimacy": 10000000,
			"is_level_top": 0,
			"user_level_rank": "\u003e50000",
			"user_charged": 0,
			"identification": 1,
			"wealth_info": {
				"uid": 4237378,
				"level": 14,
				"level_total_score": 70000,
				"cur_score": 58900,
				"upgrade_need_score": 11100,
				"status": 2,
				"dm_icon_key": ""
			}
		}
	}
	 */
	get_user_info: async (pg) => {
		let url =
			"https://api.live.bilibili.com/xlive/web-ucenter/user/get_user_info";
		let headers = {
			"content-type": undefined,
		};
		return await BAPI.ajax(pg, url, "get", undefined, headers);
	},
	/**
	 * 直播间点赞API
	 * @param {Page} pg
	 * @param {number} clicktime
	 * @param {number} room_id
	 * @param {number} uid
	 * @param {number} anchor_uid 是房主的uid，不是天选id，注意！！！
	 * @param {string} csrf
	 * @returns {Promise<JSON>}
	 */
	like_info_v3_like_likeReportV3: async (
		pg,
		clicktime,
		room_id,
		uid,
		anchor_uid,
		csrf
	) => {
		csrf = await pptr_op.get_bili_cjt(pg);//每次都获取最新的csrf
		let url =
			"https://api.live.bilibili.com/xlive/app-ucenter/v1/like_info_v3/like/likeReportV3";
		let headers = {
			"content-type": "application/x-www-form-urlencoded",
			accept: "application/json, text/plain, */*",
		};
		let data = {
			click_time: clicktime,
			room_id: room_id,
			uid: uid,
			anchor_id: anchor_uid,
			csrf_token: csrf,
			csrf: csrf,
			visit_id: "",
		};

		return await BAPI.ajax(
			pg,
			url,
			"post",
			new URLSearchParams(data).toString(),
			headers
		);
	},
	anchor_join: async (pg, id, room_id) => {
		let url =
			"https://api.live.bilibili.com/xlive/lottery-interface/v1/Anchor/Join";
		let data = {
			id: id,
			statistics: { platform: 0, pc_client: "pink" },
			platform: "pc",
			room_id: room_id,
			jump_from_str: "",
			session_id: "",
			spm_id: "444.8.interaction.anchor_draw_auto",
		};
		let headers = {
			accept: "application/json, text/plain, */*",
			"accept-language": "en-US,en;q=0.9",
			"content-type": "application/x-www-form-urlencoded",
			"sec-ch-ua":
				'" Not;A Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
			"sec-ch-ua-mobile": "?0",
			"sec-ch-ua-platform": '"Windows"',
			"sec-fetch-dest": "empty",
			"sec-fetch-mode": "cors",
			"sec-fetch-site": "same-site",
		};
		return await BAPI.ajax(
			pg,
			url,
			"post",
			new URLSearchParams(data).toString(),
			headers
		);
	},
	gift: {
		bag_list: async (pg, room_id) => {
			let url =
				"https://api.live.bilibili.com/xlive/web-room/v1/gift/bag_list";
			let data = {
				t: Date.now(),
				room_id: room_id,
				mobi_app: "web",
			};
			let headers = {
				"content-type": undefined,
			};
			return await BAPI.ajax(pg, url, "get", data, headers);
		},
	},
	live_send_msg: async (pg, msg, room_id, csrf, visit_id) => {
		csrf = await pptr_op.get_bili_cjt(pg);//每次都获取最新的csrf
		let url = "https://api.live.bilibili.com/msg/send";
		let da = {
			bubble: 0,
			msg: msg,
			color: 65532,
			mode: 1,
			room_type: 0,
			jumpfrom: "71002",
			reply_mid: 0,
			reply_attr: 0,
			replay_dmid: "",
			fontsize: 25,
			rnd: Math.ceil(Date.now() / 1000),
			roomid: room_id,
			csrf: csrf,
			csrf_token: csrf,
		};
		let headers = {
			accept: "*/*",
			origin: `https://live.bilibili.com`,
			referer: `https://live.bilibili.com/${room_id}?live_from=71002&visit_id=${visit_id}`,
			"content-type": undefined,
		};
		return await BAPI.ajax(pg, url, "post", da, headers, true);
	},
};

module.exports = { BAPI };
