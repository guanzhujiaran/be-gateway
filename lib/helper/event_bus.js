/*
 * @Author: 星瞳 1944637830@qq.com
 * @Date: 2023-07-12 12:02:44
 * @LastEditors: 星瞳 1944637830@qq.com
 * @LastEditTime: 2023-12-29 00:26:02
 * @FilePath: \tampermonkey\lib\helper\event_bus.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
const { EventEmitter } = require("events");

/**
 * 事件总线
 */
const event_bus = {
	ee: new EventEmitter(),
	event_list: [],
	on(event, fn) {
		this.ee.addListener(event, fn);
		this.event_list.push(event);
	},
	emit(event, msg) {
		this.ee.emit(event, msg);
	},
	flush() {
		this.event_list.forEach((event) => {
			this.ee.removeAllListeners(event);
		});
		this.event_list = [];
	},
	off(event, fn) {
		this.ee.removeListener(event, fn);
		const index = this.event_list.indexOf(event);
		if (index !== -1) {
			this.event_list.splice(index, 1);
		}
	},
};

module.exports = event_bus;
