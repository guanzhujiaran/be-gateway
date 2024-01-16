const { Page } = require("puppeteer-core");


function sleep(ms) {
	return new Promise((resolve) => setTimeout(() => resolve(sleep), ms));
}

const pptr_op={
	/**
		 * 将页面切换至前台
		 * @param {Page} pg
		 * @returns {Promise<boolean>} 
		 */
	check_page_is_front: async (pg) => {
		let is_front = false;
		try {
			is_front = await pg.evaluate(
				() => document.visibilityState === "visible"
			);
			if (!is_front) {
				await pg.bringToFront();
				is_front = true;
			}
		} catch (e) {
			console.error(`将浏览器切换至前台失败！${e}\n${e.stack}`);
		}
		return is_front;
	},
	/**
	 * 获取浏览器的b站中存储的csrf值
	 * @param {Page} pg 
	 * @returns {Promise<string>} - bili_cjt 也就是csrf_token和csrf
	 */
	get_bili_cjt:async(pg)=>{
		let cks=  await pg.cookies('https://www.bilibili.com');
		return cks.find(el=>el.name=='bili_jct').value
	},
	get_uid:async(pg)=>{
		let cks=  await pg.cookies('https://www.bilibili.com');
		return cks.find(el=>el.name=='DedeUserID').value
	},
}

module.exports = {
	sleep,
	pptr_op
};
