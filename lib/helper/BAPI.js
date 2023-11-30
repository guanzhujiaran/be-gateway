/**
 * 通过(调用pptr的page.evaluate等方法)使用B站API接口
 */
const BAPI = {
	/**
	 * API发送请求
	 * @param {Page} pg
	 * @param {String} url
	 * @param {String} method
	 * @param {JSON} data
	 */
	ajax: async (pg, url, method, data) => {
		let resp = await pg.evaluate(
			async (url, method, data) => {
				let params;
				let body;
				if (method.toLowerCase() == "get") {
					params = data;
				} else {
					body = data;
				}
				if (params) {
					let paramsArray = [];
					//拼接参数
					Object.keys(params).forEach((key) =>
						paramsArray.push(key + "=" + params[key])
					);
					if (url.search(/\?/) === -1) {
						url += "?" + paramsArray.join("&");
					} else {
						url += "&" + paramsArray.join("&");
					}
				}
				let response = await fetch(
					(url = url),
					{
						credentials: "include",
						method: method,
					},
					(body = JSON.stringify(body))
				);
				return await response.json();
			},
			url,
			method,
			data
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
		return await BAPI.ajax(pg, url, "post", data);
	},
	queryContributionRank: async (pg, ruid, room_id) => {
		let url = "https://api.bilibili.com/x/relation/modify";
		let data = {
			ruid: ruid,
			room_id: room_id,
			page: 1,
			page_size: 100,
			type: "online_rank",
			switch: "contribution_rank",
		};
		return await BAPI.ajax(pg, url, "get", data);
	},
};

module.exports = { BAPI };
