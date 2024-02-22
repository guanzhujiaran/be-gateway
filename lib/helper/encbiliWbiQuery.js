/**
 * 获取b站wbi加密
 *
 *
 */
const md5 = require("md5");
const axios = require("axios");

let wbi_keys = {};

const mixinKeyEncTab = [
	46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49,
	33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40,
	61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11,
	36, 20, 34, 44, 52,
];

// 对 imgKey 和 subKey 进行字符顺序打乱编码
function getMixinKey(orig) {
	let temp = "";
	mixinKeyEncTab.forEach((n) => {
		temp += orig[n];
	});
	return temp.slice(0, 32);
}

// 为请求参数进行 wbi 签名
function encWbi(params, img_key, sub_key) {
	const mixin_key = getMixinKey(img_key + sub_key),
		curr_time = Math.round(Date.now() / 1000),
		chr_filter = /[!'()*]/g;
	let query = [];
	Object.assign(params, { wts: curr_time }); // 添加 wts 字段
	// 按照 key 重排参数
	Object.keys(params)
		.sort()
		.forEach((key) => {
			query.push(
				`${encodeURIComponent(key)}=${encodeURIComponent(
					// 过滤 value 中的 "!'()*" 字符
					params[key]?.toString().replace(chr_filter, "")
				)}`
			);
		});
	query = query.join("&");
	const wbi_sign = md5(query + mixin_key); // 计算 w_rid
	return query + "&w_rid=" + wbi_sign;
}

// 获取最新的 img_key 和 sub_key
async function getWbiKeys() {
	try {
		let resp = await axios({
				url: "https://api.bilibili.com/x/web-interface/nav",
				method: "get",
				responseType: "json",
				headers: {
					"User-Agent":
						"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0",
				},
			}),
			json_content = resp.data,
			img_url = json_content.data.wbi_img.img_url,
			sub_url = json_content.data.wbi_img.sub_url;
		return {
			img_key: img_url.slice(
				img_url.lastIndexOf("/") + 1,
				img_url.lastIndexOf(".")
			),
			sub_key: sub_url.slice(
				sub_url.lastIndexOf("/") + 1,
				sub_url.lastIndexOf(".")
			),
		};
	} catch (e) {
		console.error(`获取wbi加密img失败，使用内置参数！\n${e.stack}`);
		return {
			img_key: "7cd084941338484aae1ad9425b84077c",
			sub_key: "4932caff0ff746eab6f01bf08b70ac45",
		};
	}
}

async function getWbiEncQuery(da) {
	let query;
	if (!wbi_keys.img_key) {
		try{
			wbi_keys = await getWbiKeys();
		}
		catch (e) {
			console.error(`获取wbi加密img失败，使用内置参数！\n${e.stack}`);
			wbi_keys = {
				img_key: "7cd084941338484aae1ad9425b84077c",
				sub_key: "4932caff0ff746eab6f01bf08b70ac45",
			};
		}
	}

	query = encWbi(da, wbi_keys.img_key, wbi_keys.sub_key);
	return query;
}
module.exports = getWbiEncQuery;
