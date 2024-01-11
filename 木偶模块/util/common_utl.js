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
	}
}

module.exports = {
	sleep,
	pptr_op
};
