const fs = require("fs");
const { Page } = require("puppeteer-core");
const __dir_path = "./木偶模块/";
const { BAPI } = require("../../lib/helper/BAPI.js");
const { MYAPI } = require("../../lib/helper/MYAPI.js");
const global_config = require("../../CONFIG.Default.js");
const { pptr_op } = require("../util/common_utl.js");
function sleep(ms) {
	return new Promise((resolve) => setTimeout(() => resolve(sleep), ms));
}
/**
 * 生成取关列表的csv
 * @param {Page} pg
 * @param {number | string} uid
 * @returns {Promise<number[]|string[]>} 取关列表
 */
async function generate_unfollow_file(pg, uid) {
	let all_unfollowing_list = await BAPI.get_attention_list(pg, uid).then(
		async (data) => {
			if (data.code == 0) {
				console.log(
					`${uid}\t全部关注数：【${data.data.list.length}】个`
				);
				console.log(
					`${uid}\t正在获取取关列表中！--${new Date().toLocaleString()}`
				);
				return await MYAPI.get_unlot_following(data.data.list);
			} else {
				console.error(`获取关注列表失败！${data}`);
				return [];
			}
		}
	);
	let write_string = all_unfollowing_list
		.map((el) => `https://space.bilibili.com/${el}`)
		.join("\n");
	fs.writeFileSync(
		__dir_path + `取关脚本/${uid}_取关对象.csv`,
		write_string,
		{
			flag: "w",
		},
		function (err) {
			if (err) {
				console.error(err);
				throw err;
			}
		}
	);
	return all_unfollowing_list;
}
/**
 *执行取关
 * @param {Page} pg
 * @param {number} uid
 * @param {number} limit_follower_num -- 最大关注数量
 * @returns
 */
async function do_unfollow(
	pg,
	uid = 1,
	limit_follower_num = global_config.unfollow_module.max_follow_num
) {
	try {
		let basic_url = `https://space.bilibili.com/${uid}/fans/follow`;
		await pptr_op.check_page_is_front(pg);
		if (!pg.url().includes("bilibili.com")) {
			await pg.goto(basic_url);
		}
		let nav_stat = await BAPI.web_interface_nav_stat(pg);

		if (nav_stat.code) {
			await pg.goto("about:blank");
			console.error(`${uid} 获取关注数失败！${nav_stat}`);
			return;
		}
		if (
			!nav_stat?.data?.following ||
			nav_stat?.data?.following <= limit_follower_num
		) {
			console.log(
				`${uid} 当前关注数${nav_stat?.data?.following}个 不满足取关条件（大于${limit_follower_num}个）`
			);
			return;
		}
		await generate_unfollow_file(pg, uid);
		await pptr_op.check_page_is_front(pg);
		let csrf = await pptr_op.get_bili_cjt(pg);
		let unfollow_data = fs
			.readFileSync(
				__dir_path + `取关脚本/${uid}_取关对象.csv`,
				function (err) {
					if (err) {
						console.error(err);
						throw err;
					}
					//console.log(data.toString());
				}
			)
			.toString();
		let unfollow_arr = unfollow_data.split("\n");
		let all_times = unfollow_arr.length;
		let now_time = 0;
		for (let unfollow_raw of unfollow_arr) {
			try {
				await pptr_op.check_page_is_front(pg);
				if(!pg.url().includes("bilibili")){
					await pg.goto(basic_url);
				}
				let unfollow_arr_trim = unfollow_raw.trim();
				if (unfollow_arr_trim) {
					let unfollow_mid = unfollow_arr_trim
						.split("\t")[0]
						.split("/")
						.slice(-1)
						.join("");
					let resp_json = await pg.evaluate(
						(post_data) => {
							return fetch(
								"https://api.bilibili.com/x/relation/modify",
								{
									credentials: "include",
									method: "POST",
									body: new URLSearchParams(post_data),
								}
							)
								.then((resp) => {
									return resp.json();
								})
								.catch((e) => {
									return e;
								});
						},
						{
							fid: unfollow_mid,
							act: 2,
							re_src: 11,
							spmid: "333.999.0.0",
							extend_content: JSON.stringify({
								entity: "user",
								entity_id: unfollow_mid,
							}),
							csrf: csrf,
						}
					);
					if (resp_json.code != 0) {
						console.error(
							`${JSON.stringify(
								unfollow_arr_trim
							)}\n${uid} 取关失败，原因：${JSON.stringify(
								resp_json,
								"",
								"\t"
							)}\n休息2小时`
						);
						await sleep(2 * 3600 * 1e3);
					} else {
						now_time++;
						console.log(
							`${uid}\t【取关脚本】当前进度【${now_time}/${all_times}】\thttps://space.bilibili.com/${unfollow_mid}/dynamic\t取关成功！${JSON.stringify(
								resp_json,
								"",
								"\t"
							)}\t${new Date().toLocaleString()}`
						);
					}
					await sleep(20e3);
				}
			} catch (e) {
				console.error(
					`${uid} 取关单个uid${unfollow_raw}失败，休眠2小时！${e}\n${e.stack}`
				);
				await sleep(2 * 3600 * 1e3);
			}
		}
		await pg.goto("about:blank");
	} catch (e) {
		console.error(`${uid} 取关模块执行失败！${e}\n${e.stack}`);
		await sleep(180e3);
		if (!pg.isClosed() && (await pg.browser().pages()).length != 0) {
			if (pg.isClosed()) {
				pg = await pg.browser().newPage();
			}
			return await do_unfollow(pg, uid);
		}
	} finally {
		if (!pg.isClosed() && (await pg.browser().pages()).length != 0) {
			if (pg.isClosed()) {
			} else {
				await pg.close();
			}
		}
	}
}

module.exports = do_unfollow;
