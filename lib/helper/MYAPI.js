/*
 * @Author: 星瞳 1944637830@qq.com
 * @Date: 2023-12-02 18:24:01
 * @LastEditors: 星瞳 1944637830@qq.com
 * @LastEditTime: 2024-01-04 17:43:25
 * @FilePath: \tampermonkey\lib\helper\MYAPI.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
/**
 * 存放自己写在python上面的一些服务！
 * 目前有：
 * 		1.获取需要取关的不抽奖的up的uid列表
 */
const axios = require("axios");

const MYAPI = {
	base_url: "http://127.0.0.1:23333/",
	/**
	 * API发送请求
	 * @param {String} url
	 * @param {String} method
	 * @param {JSON} data
	 * @returns {Promise<JSON>}
	 */
	ajax: async (url, method, data) => {
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
		let resp = await axios.request({
			url: url,
			method: method,
			params: params,
			data: data,
		});

		return resp.data;
	},
	/**
	 * 获取关注者中不抽奖的up
	 * @param {Page} pg
	 * @param {number[]| string[]} following_list
	 * @returns {Promise<number[]>}
	 */
	get_unlot_following: async (following_list) => {
		let url = MYAPI.base_url + "v1/post/RmFollowingList/";
		return await MYAPI.ajax(url, "post", following_list);
	},
};

module.exports = { MYAPI };
