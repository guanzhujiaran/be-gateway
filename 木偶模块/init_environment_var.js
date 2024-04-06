const superagent = require("superagent");
const axios = require("axios");
const fs = require("fs");
const QueryWbiEnc = require("../lib/helper/encbiliWbiQuery");
const { Page } = require("puppeteer-core");
const GLOBAL_CONFIG = require("../CONFIG.Default");
const { pptr_op } = require("./util/common_utl");
const { error } = require("console");
const __dirpath = "./木偶模块/";
if (!fs.existsSync(__dirpath)) {
	//创建文件目录
	fs.mkdirSync(__dirpath);
}
if (!fs.existsSync(__dirpath + "cookie_file")) {
	//创建文件目录
	fs.mkdirSync(__dirpath + "cookie_file");
}
if (!fs.existsSync(__dirpath + "log")) {
	//创建文件目录
	fs.mkdirSync(__dirpath + "log");
}
if (!fs.existsSync(__dirpath + "抽奖记录")) {
	//创建文件目录
	fs.mkdirSync(__dirpath + "抽奖记录");
}
if (!fs.existsSync(__dirpath + "抽奖记录/官方抽奖记录")) {
	//创建文件目录
	fs.mkdirSync(__dirpath + "抽奖记录/官方抽奖记录");
}
if (!fs.existsSync(__dirpath + "抽奖记录/必抽的大奖记录")) {
	//创建文件目录
	fs.mkdirSync(__dirpath + "抽奖记录/必抽的大奖记录");
}
if (!fs.existsSync(__dirpath + "抽奖记录/必抽的预约抽奖记录")) {
	//创建文件目录
	fs.mkdirSync(__dirpath + "抽奖记录/必抽的预约抽奖记录");
}
if (!fs.existsSync(__dirpath + "JsonData")) {
	//创建文件目录
	fs.mkdirSync(__dirpath + "JsonData");
}
function sleep(ms) {
	return new Promise((resolve) => setTimeout(() => resolve(sleep), ms));
}
let lottery_setting_file_reader = async (filename) => {
	let path = `${__dirpath}lottery_setting/${filename}.txt`;
	let data = fs
		.readFileSync(path, function (err) {
			if (err) {
				console.log(err);
				throw err;
			}
			//console.log(data.toString());
		})
		.toString();
	return data;
};
//这个文件的环境配置完成！
class ENVIRONMENT {
	constructor(lottery_name) {
		this.lottery_name = lottery_name;
		this.utl = undefined;
		this.global_var = undefined;
		this.my_operator = undefined;
		this.MYAPI = undefined;
		this.lottery_setting = undefined;
	}
	main = async () => {
		if (this.lottery_setting) {
			return;
		}
		let utl = {
			/**
			 * 检查是否在时间段内，加上一点随机数[doge]
			 * @param {string} beginTime xx:xx格式的开始时间
			 * @param {string} endTime xx:xx格式的结束时间
			 * @returns
			 */
			checkAuditTime: (beginTime, endTime) => {
				var nowDate = new Date();
				var beginDate = new Date(nowDate);
				var endDate = new Date(nowDate);

				var beginIndex = beginTime.lastIndexOf(":");
				var beginHour = beginTime.substring(0, beginIndex);
				var beginMinue = beginTime.substring(
					beginIndex + 1,
					beginTime.length
				);
				beginDate.setHours(beginHour, beginMinue, 0, 0);

				var endIndex = endTime.lastIndexOf(":");
				var endHour = endTime.substring(0, endIndex);
				var endMinue = endTime.substring(endIndex + 1, endTime.length);
				endDate.setHours(endHour, endMinue, 0, 0);
				return (
					nowDate.getTime() - beginDate.getTime() >=
						-1800e3 * Math.random() &&
					nowDate.getTime() <= endDate.getTime()
				);
			},
			downFile: function (fileName, fileContent) {
				//下载文件
				let csvString =
					"data:text/csv;charset=utf-8,\ufeff" +
					encodeURIComponent(fileContent);
				let link = document.createElement("a");
				link.href = csvString;
				//对下载的文件命名
				link.download = fileName;
				document.body.appendChild(link);
				utl.simulate(link, "click");
				document.body.removeChild(link);
			},
			generater_step_Array: function (min, max, step) {
				let len = Math.abs(max - min);
				if (len <= 0) return [];
				let arr = new Array(len);
				let cNum = min;
				let cIndex = 0;
				function addArr(index, val) {
					if (cNum >= min && cNum <= max) {
						arr[index] = cNum;
						cNum++;
						cIndex++;
					}
				}
				for (let i = 0; i < arr.length; i++) {
					addArr(cIndex, cNum);
				}
				return arr.filter((item) => item % step == 0);
			},
			/**
			 * 随机选一个，等同于Python的random.choice()
			 * @param {any[]} input_list
			 * @returns {any}
			 */
			random_choice: function (input_list) {
				let index = Math.floor(Math.random() * input_list.length);
				return input_list[index];
			},
			part_shuffle: function (shuffle_num, shuffle_list) {
				//打乱部分顺序
				if (shuffle_num > shuffle_list.length) {
					shuffle_num = shuffle_list.length;
				}
				for (var i = 0; i < shuffle_num; i++) {
					var rdm = Math.floor(Math.random() * shuffle_list.length);
					shuffle_list.push(shuffle_list[rdm]);
					shuffle_list.splice(rdm, 1);
				}
				return shuffle_list;
			},
			my_throw: async function (err_msg) {
				await my_operator.log_record.construct_comment_record_data(
					err_msg
				);
				return global_var.recorded_data;
			},
			const_object_remake: function (origin_data, const_data) {
				//从origin_data中重新读取设置的参数const_data是需要修改的数据
				for (let k of Object.keys(origin_data)) {
					if (
						typeof eval(`origin_data.${k}`) == "object" &&
						eval(`origin_data.${k}.length`) == undefined
					) {
						this.const_object_remake(
							eval(`origin_data.${k}`),
							eval(`const_data.${k}`)
						);
					} else {
						eval(`const_data.${k}=origin_data.${k}`);
					}
				}
			},
			checkNewDay: (ts) => {
				//判断新的一天
				if (ts === 0) return true;
				let t = new Date(ts);
				let d = new Date();
				let td = t.getDate();
				let dd = d.getDate();
				return dd !== td;
			},
			dateNow: () => Date.now(),
			/**
			 * 移除表情包和话题和@，之后重新添加获取到的话题
			 * @param {String} origin_str
			 * @param {String} dynamic_content
			 * @returns {String}
			 */
			remove_emoji_topic_at: (origin_str, dynamic_content = "") => {
				//移除表情包和话题和@
				if (origin_str) {
					origin_str = origin_str.replaceAll(/＠/gim, "@");
					origin_str = origin_str.replaceAll(/【/gim, "[");
					origin_str = origin_str.replaceAll(/】/gim, "]");
					let at_re = new RegExp(
						`@${global_var.user_info.uname}`,
						"gmi"
					);
					if (!at_re.test(origin_str)) {
						//如果没有@自己的尝试将@后面内容替换
						origin_str = origin_str.replace(
							/@.{0,12}? |@.{0,12}$/gim,
							function (match) {
								if (
									dynamic_content.includes(match.slice(1, -1))
								) {
									return match;
								}
								return (
									"@" +
									utl.random_choice(
										lottery_setting.at_member
									) +
									" "
								);
							}
						);
					}
					origin_str = origin_str.replaceAll("＃", "#");
					let topic_match = origin_str.match(
						/(\#(?<=#)(.*?)(?=#)#)/gim
					);
					if (topic_match) {
						for (let match_str of topic_match) {
							let topic_content = match_str.replaceAll("#", "");
							if (dynamic_content.includes(topic_content))
								continue;
							origin_str.replaceAll(match_str, "");
						}
					}
					return origin_str.replaceAll(
						/(\[(?<=\[)(.*?)(?=\])])/gim,
						""
					);
				} else {
					console.error(
						`${global_var.user_info.uname}\t提取@和表情出错\t${origin_str}`
					);
					return origin_str;
				}
			},
			weight_rand: (input_list) => {
				//根据输入列表的次数的5次方设置权重抽取
				try {
					let weight_list = [];
					let havedone_list = [];
					input_list.map((e) => {
						if (havedone_list.includes(e)) {
							weight_list.find((currentValue, index, arr) => {
								if (currentValue.content == e) {
									arr[index].count += 1;
								}
							});
						} else {
							weight_list.push({ content: e, count: 1 });
							havedone_list.push(e);
						}
					});
					weight_list = weight_list.map((e) => {
						return {
							content: e.content,
							weight: Math.pow(e.count, 5),
						}; //用遇见次数的5次幂决定权重
					}); //加完权重了
					let totalWeight = weight_list.reduce(function (
						pre,
						cur,
						index
					) {
						cur.startW = pre;
						return (cur.endW = pre + cur.weight);
					},
					0);
					let random = Math.ceil(Math.random() * totalWeight);
					let selectElement = weight_list.find(
						(element) =>
							element.startW < random && element.endW >= random
					);
					return selectElement.content;
				} catch (e) {
					return undefined;
				}
			},
			/**
			 * 获取opus的动态详情
			 * @returns
			 */
			Get_Opus_Dynamic_Data: async function () {
				let polymer_detail_data = {
					item: {
						basic: {},
						id_str: undefined,
						modules: {
							module_author: {},
							module_dynamic: {
								major: {
									opus: {},
								},
							},
							module_stat: {},
						},
						type: undefined,
						visible: true,
					},
				};
				let opus_init_detail;
				for (let i = 0; i < 3; i++) {
					try {
						opus_init_detail = await global_var.page.evaluate(
							`window.__INITIAL_STATE__`
						);
						if (opus_init_detail) {
							break;
						} else {
							await sleep(10e3);
						}
					} catch (e) {
						console.warn(e);
						await sleep(10e3);
					}
				}

				polymer_detail_data.item.basic = opus_init_detail.detail.basic;
				polymer_detail_data.item.id_str =
					opus_init_detail.detail.id_str;
				for (let m of opus_init_detail.detail.modules) {
					switch (m.module_type) {
						case "MODULE_TYPE_AUTHOR": {
							polymer_detail_data.item.modules.module_author =
								m.module_author;
							polymer_detail_data.item.modules.module_author.official_verify =
								m.module_author.official;
							break;
						}
						case "MODULE_TYPE_CONTENT": {
							let text = [];
							for (let paragraph of m.module_content.paragraphs) {
								if (paragraph.para_type == 1) {
									for (let node of paragraph.text.nodes) {
										switch (node.type) {
											case "TEXT_NODE_TYPE_WORD": {
												text.push(node.word.words);
												break;
											}
											case "TEXT_NODE_TYPE_RICH": {
												text.push(node.rich.text);
												break;
											}
										}
									}
								}
							}
							polymer_detail_data.item.modules.module_dynamic.desc =
								{
									rich_text_nodes: m.module_content.paragraphs
										.filter((el) => {
											return el?.text;
										})
										.map((el) => {
											return el.text.nodes;
										})
										.reduce((acc, curr) =>
											acc.concat(curr)
										),
									text: text.join(""),
								};

							break;
						}
						case "MODULE_TYPE_STAT": {
							polymer_detail_data.item.modules.module_stat =
								m.module_stat;
							break;
						}
						case "MODULE_TYPE_TITLE": {
							polymer_detail_data.item.modules.module_dynamic.major.opus.title =
								m.module_title.text;
							break;
						}
					}
				}
				polymer_detail_data.item.type = opus_init_detail.detail.type;
				return polymer_detail_data;
			},
			/**
			 * 对列表去重
			 * @param {*} arr
			 * @returns
			 */
			noRepeatArr: function (arr) {
				let newArr = [];
				try {
					for (let i = 0; i < arr.length; i++) {
						if (!newArr.includes(arr[i])) {
							newArr.push(arr[i]);
						}
					}
					return newArr;
				} catch (e) {
					console.warn(e, `${global_var.user_info.uname}\tnoRepeat`);
					return arr;
				}
				return newArr;
			},
			/**
			 * 去除所有不可见字符
			 * @param {*} origin_str
			 * @returns
			 */
			remove_invisible_char(origin_str) {
				let reg =
					/[\0-\x1F\x7F-\x9F\xAD\u0378\u0379\u037F-\u0383\u038B\u038D\u03A2\u0528-\u0530\u0557\u0558\u0560\u0588\u058B-\u058E\u0590\u05C8-\u05CF\u05EB-\u05EF\u05F5-\u0605\u061C\u061D\u06DD\u070E\u070F\u074B\u074C\u07B2-\u07BF\u07FB-\u07FF\u082E\u082F\u083F\u085C\u085D\u085F-\u089F\u08A1\u08AD-\u08E3\u08FF\u0978\u0980\u0984\u098D\u098E\u0991\u0992\u09A9\u09B1\u09B3-\u09B5\u09BA\u09BB\u09C5\u09C6\u09C9\u09CA\u09CF-\u09D6\u09D8-\u09DB\u09DE\u09E4\u09E5\u09FC-\u0A00\u0A04\u0A0B-\u0A0E\u0A11\u0A12\u0A29\u0A31\u0A34\u0A37\u0A3A\u0A3B\u0A3D\u0A43-\u0A46\u0A49\u0A4A\u0A4E-\u0A50\u0A52-\u0A58\u0A5D\u0A5F-\u0A65\u0A76-\u0A80\u0A84\u0A8E\u0A92\u0AA9\u0AB1\u0AB4\u0ABA\u0ABB\u0AC6\u0ACA\u0ACE\u0ACF\u0AD1-\u0ADF\u0AE4\u0AE5\u0AF2-\u0B00\u0B04\u0B0D\u0B0E\u0B11\u0B12\u0B29\u0B31\u0B34\u0B3A\u0B3B\u0B45\u0B46\u0B49\u0B4A\u0B4E-\u0B55\u0B58-\u0B5B\u0B5E\u0B64\u0B65\u0B78-\u0B81\u0B84\u0B8B-\u0B8D\u0B91\u0B96-\u0B98\u0B9B\u0B9D\u0BA0-\u0BA2\u0BA5-\u0BA7\u0BAB-\u0BAD\u0BBA-\u0BBD\u0BC3-\u0BC5\u0BC9\u0BCE\u0BCF\u0BD1-\u0BD6\u0BD8-\u0BE5\u0BFB-\u0C00\u0C04\u0C0D\u0C11\u0C29\u0C34\u0C3A-\u0C3C\u0C45\u0C49\u0C4E-\u0C54\u0C57\u0C5A-\u0C5F\u0C64\u0C65\u0C70-\u0C77\u0C80\u0C81\u0C84\u0C8D\u0C91\u0CA9\u0CB4\u0CBA\u0CBB\u0CC5\u0CC9\u0CCE-\u0CD4\u0CD7-\u0CDD\u0CDF\u0CE4\u0CE5\u0CF0\u0CF3-\u0D01\u0D04\u0D0D\u0D11\u0D3B\u0D3C\u0D45\u0D49\u0D4F-\u0D56\u0D58-\u0D5F\u0D64\u0D65\u0D76-\u0D78\u0D80\u0D81\u0D84\u0D97-\u0D99\u0DB2\u0DBC\u0DBE\u0DBF\u0DC7-\u0DC9\u0DCB-\u0DCE\u0DD5\u0DD7\u0DE0-\u0DF1\u0DF5-\u0E00\u0E3B-\u0E3E\u0E5C-\u0E80\u0E83\u0E85\u0E86\u0E89\u0E8B\u0E8C\u0E8E-\u0E93\u0E98\u0EA0\u0EA4\u0EA6\u0EA8\u0EA9\u0EAC\u0EBA\u0EBE\u0EBF\u0EC5\u0EC7\u0ECE\u0ECF\u0EDA\u0EDB\u0EE0-\u0EFF\u0F48\u0F6D-\u0F70\u0F98\u0FBD\u0FCD\u0FDB-\u0FFF\u10C6\u10C8-\u10CC\u10CE\u10CF\u1249\u124E\u124F\u1257\u1259\u125E\u125F\u1289\u128E\u128F\u12B1\u12B6\u12B7\u12BF\u12C1\u12C6\u12C7\u12D7\u1311\u1316\u1317\u135B\u135C\u137D-\u137F\u139A-\u139F\u13F5-\u13FF\u169D-\u169F\u16F1-\u16FF\u170D\u1715-\u171F\u1737-\u173F\u1754-\u175F\u176D\u1771\u1774-\u177F\u17DE\u17DF\u17EA-\u17EF\u17FA-\u17FF\u180F\u181A-\u181F\u1878-\u187F\u18AB-\u18AF\u18F6-\u18FF\u191D-\u191F\u192C-\u192F\u193C-\u193F\u1941-\u1943\u196E\u196F\u1975-\u197F\u19AC-\u19AF\u19CA-\u19CF\u19DB-\u19DD\u1A1C\u1A1D\u1A5F\u1A7D\u1A7E\u1A8A-\u1A8F\u1A9A-\u1A9F\u1AAE-\u1AFF\u1B4C-\u1B4F\u1B7D-\u1B7F\u1BF4-\u1BFB\u1C38-\u1C3A\u1C4A-\u1C4C\u1C80-\u1CBF\u1CC8-\u1CCF\u1CF7-\u1CFF\u1DE7-\u1DFB\u1F16\u1F17\u1F1E\u1F1F\u1F46\u1F47\u1F4E\u1F4F\u1F58\u1F5A\u1F5C\u1F5E\u1F7E\u1F7F\u1FB5\u1FC5\u1FD4\u1FD5\u1FDC\u1FF0\u1FF1\u1FF5\u1FFF\u200B-\u200F\u202A-\u202E\u2060-\u206F\u2072\u2073\u208F\u209D-\u209F\u20BB-\u20CF\u20F1-\u20FF\u218A-\u218F\u23F4-\u23FF\u2427-\u243F\u244B-\u245F\u2700\u2B4D-\u2B4F\u2B5A-\u2BFF\u2C2F\u2C5F\u2CF4-\u2CF8\u2D26\u2D28-\u2D2C\u2D2E\u2D2F\u2D68-\u2D6E\u2D71-\u2D7E\u2D97-\u2D9F\u2DA7\u2DAF\u2DB7\u2DBF\u2DC7\u2DCF\u2DD7\u2DDF\u2E3C-\u2E7F\u2E9A\u2EF4-\u2EFF\u2FD6-\u2FEF\u2FFC-\u2FFF\u3040\u3097\u3098\u3100-\u3104\u312E-\u3130\u318F\u31BB-\u31BF\u31E4-\u31EF\u321F\u32FF\u4DB6-\u4DBF\u9FCD-\u9FFF\uA48D-\uA48F\uA4C7-\uA4CF\uA62C-\uA63F\uA698-\uA69E\uA6F8-\uA6FF\uA78F\uA794-\uA79F\uA7AB-\uA7F7\uA82C-\uA82F\uA83A-\uA83F\uA878-\uA87F\uA8C5-\uA8CD\uA8DA-\uA8DF\uA8FC-\uA8FF\uA954-\uA95E\uA97D-\uA97F\uA9CE\uA9DA-\uA9DD\uA9E0-\uA9FF\uAA37-\uAA3F\uAA4E\uAA4F\uAA5A\uAA5B\uAA7C-\uAA7F\uAAC3-\uAADA\uAAF7-\uAB00\uAB07\uAB08\uAB0F\uAB10\uAB17-\uAB1F\uAB27\uAB2F-\uABBF\uABEE\uABEF\uABFA-\uABFF\uD7A4-\uD7AF\uD7C7-\uD7CA\uD7FC-\uF8FF\uFA6E\uFA6F\uFADA-\uFAFF\uFB07-\uFB12\uFB18-\uFB1C\uFB37\uFB3D\uFB3F\uFB42\uFB45\uFBC2-\uFBD2\uFD40-\uFD4F\uFD90\uFD91\uFDC8-\uFDEF\uFDFE\uFDFF\uFE1A-\uFE1F\uFE27-\uFE2F\uFE53\uFE67\uFE6C-\uFE6F\uFE75\uFEFD-\uFF00\uFFBF-\uFFC1\uFFC8\uFFC9\uFFD0\uFFD1\uFFD8\uFFD9\uFFDD-\uFFDF\uFFE7\uFFEF-\uFFFB\uFFFE\uFFFF]/g;
				return origin_str.replaceAll(reg, "");
			},
			/**
			 * 检查页面是否在前台，如果不在则直接将页面放到前台来
			 * @param {Page} pg
			 * @returns {Promise<boolean>} true代表在前台了
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
					await sleep(1e3);
				}
				return is_front;
			},
		};
		/**
		 * @typedef {Object} global_var_Obj - 全局变量
		 * @property {Page|undefined} page - 浏览器页面
		 * @property {string} pageurl - 抽奖网址
		 * @property {number} dynamic_id - 动态ID
		 * @property {Object} TIME - 时间相关
		 * @property {Date} TIME.Init_Time - 初始化时间
		 * @property {Array.<string>} TIME.None_Lottery_Time - 非抽奖时间段
		 * @property {number} TIME.Reserve_Lottery_time - 参加x秒以内必须参加的预约抽奖
		 * @property {Object} response - 所有的响应类
		 * @property {Object|undefined} response.global_dynamic_data - 全局的动态数据
		 * @property {Object|undefined} response.create_dyn_response - 创建或转发动态的响应
		 * @property {Object|undefined} response.comment_dyn_response - 自己评论动态的响应
		 * @property {Object|undefined} response.relation_modify_response - 关注响应
		 * @property {Object|undefined} response.dynamic_thumb_response - 点赞动态响应
		 * @property {Object|undefined} response.space_reservation - 空间预约响应
		 * @property {Object|undefined} response.reply_main - 评论区响应
		 * @property {Object|undefined} response.msgfeed_unread - 我的消息响应
		 * @property {Object} FLAG - 标志位
		 * @property {boolean} FLAG.吃饭休息标志 - 吃饭休息标志
		 * @property {boolean} FLAG.评论响应标志 - 评论响应标志
		 * @property {boolean} FLAG.opus动态标志 - opus动态标志
		 * @property {Object|undefined} user_nav - 用户导航
		 * @property {boolean} fengkong_flag - 风控标志
		 * @property {string} recorded_data - 抽奖反馈信息
		 * @property {Object} user_info - 用户信息
		 * @property {number|undefined} user_info.uid - 用户ID
		 * @property {string|undefined} user_info.uname - 用户名
		 * @property {boolean} Pause - 抽奖暂停标志
		 * @property {Object} Baidu_wenxin - 百度文心相关
		 * @property {string|undefined} Baidu_wenxin.access_token - 百度文心的access_token
		 * @property {string} Baidu_wenxin.API_Key - 百度文心的API_Key
		 * @property {string} Baidu_wenxin.Secret_key - 百度文心的Secret_key
		 * @property {string} Baidu_wenxin.access_token_api - 百度文心的access_token_api
		 * @property {string} Baidu_wenxin.paraphrase_api - 百度文心的paraphrase_api
		 * @property {string} Baidu_wenxin.get_result_api - 百度文心的get_result_api
		 * @property {Object} Getter - 获取器
		 * @property {function} Getter.check_login_status - 检查登录状态
		 */
		/**@type {global_var_Obj} */
		let global_var = {
			/**
			 * @type {Page} page - 浏览器页面
			 */
			page: undefined, //创建的网页
			pageurl: "", //抽奖网址
			dynamic_id: 0,
			TIME: {
				Init_Time: new Date(Date.now()),
				/**@property 非抽奖时间段*/
				None_Lottery_Time: ["2:00", "9:00"],
				/**@property 参加x秒以内必须参加的预约抽奖 */
				Reserve_Lottery_time: 30 * 3600 * 24,
			},
			/**@property 所有的响应类 */
			response: {
				/**@property 全局的动态数据 */
				global_dynamic_data: undefined, //全局的动态数据
				/**@property 创建或转发动态的响应 */
				create_dyn_response: undefined, //创建或转发动态的响应
				/**@property 自己评论动态的响应 */
				comment_dyn_response: undefined, //自己评论动态的响应
				/**@property 关注响应 */
				relation_modify_response: undefined, //关注响应
				/**@property 点赞动态响应 */
				dynamic_thumb_response: undefined, //点赞动态响应
				/**@property 空间预约响应 */
				space_reservation: undefined, //空间预约响应
				/**@property 评论区响应 */
				reply_main: undefined,
				/**@property 我的消息响应 */
				msgfeed_unread: undefined,
			},
			FLAG: {
				吃饭休息标志: false,
				评论响应标志: false,
				opus动态标志: false,
			},
			user_nav: undefined,
			fengkong_flag: false, //风控标志
			recorded_data: "", //抽奖反馈信息
			user_info: {
				uid: undefined,
				uname: undefined,
			},
			Pause: false, //抽奖暂停标志
			Baidu_wenxin: {
				access_token: undefined, //百度文心的access_token
				API_Key: `Pqu42f2I0OGa5fdyf280FIULvn04DYEA`,
				Secret_key: `KdgUQdnByOtwjd6dwaImo5ckNbHxqRnv`,
				access_token_api: `https://wenxin.baidu.com/moduleApi/portal/api/oauth/token`,
				paraphrase_api: `https://wenxin.baidu.com/moduleApi/portal/api/rest/1.0/ernie/3.0.20/zeus`,
				get_result_api: `https://wenxin.baidu.com/moduleApi/portal/api/rest/1.0/ernie/v1/getResult`,
			},
			Getter: {
				check_login_status: function () {
					if (!global_var.user_info.uname) {
						console.warn(
							`登陆失败\n${lottery_setting.CONFIG.COOKIENAME}`
						);
						this.login_status = false;
						throw "登陆失败";
					}
				},
			},
		};
		let my_operator = {
			basic_operator: {
				/**
				 * 返回一个bool判断是否评论存在 true:存在；false：不存在，被隐藏了
				 * @param {json} response_json 评论的响应
				 * @param {} dynamic_id 动态ID
				 * @returns
				 */
				check_reply: async (response_json, dynamic_id) => {
					if (response_json) {
						try {
							let type = response_json.data.reply.type;
							let oid =
								global_var.response.global_dynamic_data.item
									.basic.comment_id_str;
							let rpid = response_json.data.reply.rpid;
							let check_flag = false;
							let reply_jump_resp =
								await MYAPI.BiliAPI.reply_jump(type, oid, rpid);
							await reply_jump_resp.data.replies.forEach(
								(reply) => {
									if (reply.rpid == rpid) {
										check_flag = true;
									} else if (reply.replies != null) {
										reply.replies.forEach((reply) => {
											if (reply.rpid == rpid) {
												check_flag = true;
											}
										});
									}
								}
							);
							return check_flag;
						} catch (e) {
							console.warn(e);
							return false;
						}
					}
					if (dynamic_id) {
						let dynamic_detail_res_data =
							global_var.response.global_dynamic_data;
						if (!global_var.response.global_dynamic_data) {
							let dynamic_detail_res =
								await MYAPI.BiliAPI.get_dynamic_v1_detail(
									String(dynamic_id)
								);
							if (dynamic_detail_res.code) {
								console.warn(
									"获取评论失败",
									dynamic_detail_res
								);
								return false;
							}
							dynamic_detail_res_data = dynamic_detail_res.data;
						}
						let comment_id_str =
							dynamic_detail_res_data.item.basic.comment_id_str;
						let comment_type =
							dynamic_detail_res_data.item.basic.comment_type;
						let reply_res = await MYAPI.BiliAPI.get_reply(
							2,
							0,
							comment_id_str,
							comment_type
						);
						if (reply_res.code) {
							console.warn("获取评论失败", reply_res);
							return false;
						} else {
							let replies = reply_res.data.replies;
							let find_reply = await replies.find(
								(element) =>
									element.member.uname ==
									global_var.user_info.uname
							);
							if (find_reply) {
								return true;
							} else {
								return false;
							}
						}
					} else {
						return false;
					}
				},
				/**
				 * 获取opus动态的转发框里的内容
				 * @param {*} msg_box_node
				 * @returns {Promise<string>}
				 */
				get_opus_dynamic_repost_area_content: async (msg_box_node) => {
					return await msg_box_node.$eval(
						`.bili-rich-textarea__inner`,
						async (el) => {
							let ret_msg = "";
							for (let i of el.childNodes) {
								if (i.data) {
									ret_msg += i.data;
								} else {
									let emoji_data = JSON.parse(i.dataset.data);
									ret_msg += emoji_data.text;
								}
							}
							return ret_msg;
						}
					);
				},
				/**
				 * 点赞动态
				 * @param {*} opus_dynamic 是否通过opus动态操作
				 */
				dynamic_thumb: async (opus_dynamic = false) => {
					//动态点赞
					global_var.Getter.check_login_status();
					try {
						if (typeof global_var.recorded_data == "string") {
							if (
								global_var.recorded_data.includes(
									"动态评论失败，评论被隐藏"
								)
							) {
								console.warn(
									`${global_var.user_info.uname}\t${
										global_var.pageurl
									}动态评论失败，评论被隐藏，不进行动态点赞！\t${new Date().toLocaleTimeString()}`
								);
								return;
							}
						}
						let pageurl = await global_var.page.url();
						if (pageurl.includes("opus")) {
							opus_dynamic = true;
						} else {
							opus_dynamic = false;
						}

						if (opus_dynamic || 1) {
							await sleep(2e3);
							await global_var.page.click(
								`.side-toolbar__action.like`
							);
							await sleep(1e3);
							for (let i = 0; i < 2; i++) {
								if (
									await global_var.page.$(
										`.side-toolbar__action.like.is-active`
									)
								) {
									console.log(
										`${global_var.user_info.uname}\t${pageurl}\t动态点赞成功`
									);
									await sleep(
										utl.random_choice(
											lottery_setting.Working_clearance_time
										)
									);
									break;
								} else {
									console.error(
										`${global_var.user_info.uname}\t${global_var.pageurl}\t动态点赞失败`
									);
									await sleep(2e3);
								}
							}
						}
						// else {
						// 	await sleep(2e3);
						// 	await global_var.page.click(
						// 		".bili-dyn-action.like"
						// 	);
						// 	await sleep(1e3);
						// 	console.log(
						// 		`${global_var.user_info.uname}\t${global_var.pageurl}\t动态点赞成功`
						// 	);
						// 	await sleep(
						// 		utl.random_choice(
						// 			lottery_setting.Working_clearance_time
						// 		)
						// 	);
						// }
					} catch (e) {
						console.warn(
							`${global_var.user_info.uname}\t${global_var.pageurl}\t动态点赞失败`,
							e
						);
						await utl.my_throw(
							`${global_var.user_info.uname}\t${global_var.pageurl}\t动态点赞失败`
						);
					}
					// if (!global_var.response.dynamic_thumb_response.code) {
					//     console.log('动态点赞成功')
					//     await sleep(utl.random_choice(lottery_setting.Working_clearance_time))
					// }
					// else {
					//     console.log(`动态点赞失败，${global_var.response.dynamic_thumb_response}`)
					//     global_var.fengkong_flag = true//可能触发风控，停一个小时
					//     await utl.my_throw(`动态点赞失败，dynamic_thumb`, global_var.response.dynamic_thumb_response)
					//     throw (`动态点赞失败，dynamic_thumb，`, global_var.response.dynamic_thumb_response);
					// }
				},
				/**
				 * 点击转发
				 * @param {boolean} opus_dynamic
				 * @param {string} repost_content
				 * @returns
				 */
				dynamic_repost: async (
					opus_dynamic = false,
					repost_content = ""
				) => {
					if (typeof global_var.recorded_data == "string") {
						if (
							global_var.recorded_data.includes(
								"动态评论失败，评论被隐藏"
							)
						) {
							console.error(
								`${global_var.user_info.uname}\t${
									global_var.pageurl
								}动态评论失败，评论被隐藏，不进行动态转发！\t${new Date().toLocaleTimeString()}`
							);
							return;
						}
					}
					//点击转发
					global_var.Getter.check_login_status();
					await pptr_op.check_page_is_front(global_var.page);
					let pageurl = global_var.page.url();
					if (pageurl.includes("opus")) {
						opus_dynamic = true;
					} else {
						opus_dynamic = false;
					}

					await sleep(3e3);
					try {
						if (opus_dynamic || 1) {
							let repost_btn = await global_var.page.$(
								`.side-toolbar__action.forward`
							);
							await repost_btn.click();
							await sleep(3e3);
							if (repost_content) {
								let msg_box;
								for (let bt = 0; bt <= 5; bt++) {
									try {
										if (
											!(await global_var.page.$(
												`.bili-rich-textarea`
											))
										) {
											await repost_btn.click();
										}
										await global_var.page.waitForSelector(
											`.bili-rich-textarea`,
											{ timeout: 10e3 }
										);
										msg_box = await global_var.page.$(
											`.bili-rich-textarea`
										);
										await msg_box.focus();
										let msg_box_content =
											await my_operator.basic_operator.get_opus_dynamic_repost_area_content(
												msg_box
											);
										let _bt = 0;

										while (
											msg_box_content.includes(
												repost_content
											)
										) {
											//回复栏里的东西等于回复内容时break
											if (
												!(await global_var.page.$(
													`.bili-rich-textarea`
												))
											) {
												await repost_btn.click();
											}
											msg_box = await global_var.page.$(
												`.bili-rich-textarea`
											);
											await msg_box.focus();
											await sleep(
												utl.random_choice(
													3 *
														lottery_setting.Working_clearance_time
												)
											);
											await msg_box.type(repost_content, {
												delay: 20,
											});
											await sleep(1e3);
											msg_box_content =
												await my_operator.basic_operator.get_opus_dynamic_repost_area_content(
													msg_box
												);
											if (
												!msg_box_content.includes(
													repost_content
												)
											) {
												//如果不等就删掉重新输入，如果是转发 被转发的动态,则只需要判断是否包含即可
												await global_var.page.mouse.click(
													10,
													10
												);
												await sleep(3e3);
												await repost_btn.click();
												msg_box =
													await global_var.page.$(
														`.bili-rich-textarea`
													);
												console.log(
													"转发框里内容与转发内容不符，删除转发框里内容",
													`\nmsg_box_content:${msg_box_content}\repost_content:${repost_content}`
												);
											}
											if (_bt >= 5) {
												console.error(
													"转发框里输入内容失败"
												);
												await utl.my_throw(
													"动态评论失败"
												);
												throw `动态评论失败`;
											}
											_bt += 1;
										}
										await sleep(1e3);
										break;
									} catch (e) {
										if (bt >= 5) {
											throw e;
										}
										await sleep(3e3);
										await global_var.page.evaluate(() => {
											this.scrollTo(0, 1500);
										});
										await global_var.page.evaluate(() => {
											this.scrollTo(0, -1500);
										});
										await sleep(3e3);
									}
								}
							}
							let repost_launcher = await global_var.page.$(
								`.bili-dyn-share-publishing__action.launcher`
							);
							await repost_launcher.click();
							await sleep(6e3);
						}
						// else {
						// 	let repost_btn = await global_var.page.$(
						// 		".bili-dyn-forward-publishing__action__btn"
						// 	);
						// 	let repost_text_area = await global_var.page.$(
						// 		".bili-rich-textarea"
						// 	);
						// 	if (repost_btn && repost_text_area) {
						// 	} else {
						// 		//如果没有等待元素，则尝试前往转发页面
						// 		await global_var.page.click(
						// 			`.bili-dyn-action.forward`
						// 		);
						// 		await sleep(1e3);
						// 		repost_btn = await global_var.page.$(
						// 			".bili-dyn-forward-publishing__action__btn"
						// 		);
						// 		repost_text_area = await global_var.page.$(
						// 			".bili-rich-textarea"
						// 		);
						// 	}
						// 	if (repost_content) {
						// 		//旧版动态页（非opus） 面如果有评论需要转发，就直接在转发页面输入
						// 		await repost_text_area.type(repost_content, {
						// 			delay: 20,
						// 		});
						// 		let textContent =
						// 			await repost_text_area.evaluate(
						// 				(el) => el.textContent
						// 			);
						// 		if (textContent && textContent.length > 950) {
						// 			await repost_text_area.focus();
						// 			await global_var.page.keyboard.down(
						// 				"Control"
						// 			);
						// 			await global_var.page.keyboard.press("A");
						// 			await global_var.page.keyboard.up(
						// 				"Control"
						// 			);
						// 			await sleep(1e3);
						// 			await global_var.page.keyboard.press(
						// 				"Backspace"
						// 			);
						// 			await repost_text_area.type(
						// 				textContent.slice(0, 950)
						// 			);
						// 		}
						// 	}
						// 	await sleep(1e3);
						// 	await repost_btn.click();

						// 	// let bt = 0
						// 	// while (!global_var.response.create_dyn_response) {
						// 	//     if (bt > 5) { break }
						// 	//     await sleep(1e3)
						// 	//     bt += 1
						// 	// }
						// 	// try {
						// 	//     if (global_var.response.create_dyn_response.code != 0) {
						// 	//         console.log(`动态转发失败，create_dyn_response.code`, global_var.response.create_dyn_response)
						// 	//         global_var.fengkong_flag = true//可能触发风控，停一个小时
						// 	//         return await utl.my_throw(`动态转发失败，create_dyn_response.code`)
						// 	//     }
						// 	//     else {
						// 	//         console.log('动态转发成功');
						// 	//     }
						// 	// }
						// 	// catch (e) {
						// 	//     if (!e.includes(`Error: Node is either not clickable or not an HTMLElement`)) {
						// 	//         global_var.fengkong_flag = true
						// 	//     }//可能触发风控，停一个小时
						// 	//     await utl.my_throw(`动态转发失败，dynamic_repost，${e}`)
						// 	//     throw (`动态转发失败，dynamic_repost，${e}`)
						// 	// }
						// }
					} catch (e) {
						console.error(
							`${global_var.user_info.uname}\t${global_var.pageurl}动态转发失败，dynamic_repost，${e}\n${e.stack}`
						);
						await utl.my_throw(
							`动态转发失败，dynamic_repost，${e}`
						);
						//return
					}
				},
				/**
				 * 点击回复按钮
				 * @param {String} comment_msg 回复内容
				 * @returns {}
				 */
				comment_submit: async (comment_msg, opus_dynamic = false) => {
					//点击回复
					/**
					 * 检查评论是否被风控
					 */
					async function CheckRisk() {
						let comment_dyn_response_code = 0;
						try {
							if (global_var.response.comment_dyn_response) {
								comment_dyn_response_code =
									global_var.response.comment_dyn_response
										.code;
							} else {
								console.warn(
									`${global_var.user_info.uname}\t检查是否评论被风控时未获取到响应！`
								);
								throw `${global_var.user_info.uname}\t检查是否评论被风控时未获取到响应！`;
							}
						} catch {
							throw `${global_var.user_info.uname}\t检查是否评论被风控时未获取到响应！`;
						}
						let captcha; //检查验证码
						try {
							captcha = await global_var.page.$(
								`.comment-captcha`
							);
						} catch (e) {
							console.warn("无需验证码", e);
						}
						if (comment_dyn_response_code == 12051) {
							//重复评论code
							return true;
						}
						if (captcha || comment_dyn_response_code) {
							await utl.my_throw("动态评论失败，需要验证码");
							console.warn(
								`${
									global_var.user_info.uname
								}\t动态${await global_var.page.url()} 评论失败，需要验证码，休眠4小时！\t${new Date().toLocaleTimeString()}`
							);
							await sleep(4 * 3600e3);
							throw `动态评论失败，需要验证码`;
						}
						await sleep(3e3);
					}
					global_var.Getter.check_login_status();
					let pageurl = await global_var.page.url();
					if (global_var.response.reply_main.code == 12061) {
						//UP主已关闭评论区
						return;
					}
					if (pageurl.includes("opus")) {
						opus_dynamic = true;
					} else {
						opus_dynamic = false;
					}
					if (pageurl.includes("read/cv")) {
						opus_dynamic = false;
						await global_var.page.goto(
							`https://t.bilibili.com/${global_var.dynamic_id}`
						);
					}
					global_var.FLAG.评论响应标志 = false;
					if (
						typeof comment_msg != "string" ||
						!comment_msg ||
						comment_msg.includes("undefined") ||
						comment_msg.includes("null") ||
						comment_msg.includes("true") ||
						comment_msg.includes("false")
					) {
						//检查是否传入的是string类型参数 或者是否为空
						return await utl.my_throw("动态评论内容出错");
					}
					await sleep(1e3);

					for (let i = 0; i < 3; i++) {
						let bt = 0;

						try {
							if (opus_dynamic || 1) {
								let msg_box;
								await global_var.page.waitForSelector(
									`.reply-box-textarea`,
									{ timeout: 10e3 }
								);
								msg_box = await global_var.page.$(
									`.reply-box-textarea`
								);
								await msg_box.click();
								let msg_box_content =
									await global_var.page.$eval(
										`.reply-box-textarea`,
										(el) => el.value
									);
								let _bt = 0;
								while (msg_box_content != comment_msg) {
									//回复栏里的东西等于回复内容时break
									await msg_box.click();
									await sleep(
										utl.random_choice(
											3 *
												lottery_setting.Working_clearance_time
										)
									);
									await msg_box.type(comment_msg, {
										delay: 20,
									});
									await sleep(1e3);
									msg_box_content =
										await global_var.page.$eval(
											`.reply-box-textarea`,
											(el) => el.value
										);
									if (
										utl.remove_invisible_char(
											msg_box_content.replaceAll(
												/[\uD800-\uDBFF][\uDC00-\uDFFF]/g,
												""
											)
										) !=
										utl.remove_invisible_char(
											comment_msg.replaceAll(
												/[\uD800-\uDBFF][\uDC00-\uDFFF]/g,
												""
											)
										)
									) {
										//如果不等就删掉重新输入
										await sleep(1e3);
										await msg_box.click();
										await global_var.page.keyboard.down(
											"Control"
										);
										await global_var.page.keyboard.press(
											"A"
										);
										await global_var.page.keyboard.up(
											"Control"
										);
										await sleep(1e3);
										await global_var.page.keyboard.press(
											"Backspace"
										);
										console.log(
											"输入框里内容与评论不符，删除输入框里内容",
											`\nmsg_box_content:${msg_box_content}\ncomment_msg:${comment_msg}`
										);
									} else {
										//相等了break出去
										break;
									}
									if (_bt >= 5) {
										console.log("输入框里输入内容失败");
										await utl.my_throw("动态评论失败");
										throw `动态评论失败`;
									}
									_bt += 1;
								}
								await sleep(1e3);
								await global_var.page.click(`.send-text`);
								await MYAPI.PageFunc.waitForResponse(
									global_var.page,
									"reply/add"
								);
								await sleep(1e3);

								await CheckRisk();
							}
							// else {
							// 	//老版动态评论
							// 	let msg_box;
							// 	let comment_box_jquery = `textarea[name=msg]`;
							// 	try {
							// 		await global_var.page.waitForSelector(
							// 			`.reply-box-textarea`,
							// 			{ timeout: 10e3 }
							// 		);
							// 		comment_box_jquery = `.reply-box-textarea`;
							// 	} catch {
							// 		comment_box_jquery = `textarea[name=msg]`;
							// 	}
							// 	msg_box = await global_var.page.$(
							// 		comment_box_jquery
							// 	);
							// 	await msg_box.focus();
							// 	let msg_box_content =
							// 		await global_var.page.$eval(
							// 			comment_box_jquery,
							// 			(el) => el.value
							// 		);
							// 	let _bt = 0;
							// 	while (msg_box_content != comment_msg) {
							// 		//回复栏里的东西等于回复内容时break
							// 		await msg_box.focus();
							// 		await sleep(
							// 			utl.random_choice(
							// 				3 *
							// 					lottery_setting.Working_clearance_time
							// 			)
							// 		);
							// 		await msg_box.type(comment_msg, {
							// 			delay: 20,
							// 		});
							// 		await sleep(1e3);
							// 		msg_box_content =
							// 			await global_var.page.$eval(
							// 				comment_box_jquery,
							// 				(el) => el.value
							// 			);
							// 		if (
							// 			utl.remove_invisible_char(
							// 				msg_box_content.replaceAll(
							// 					/[\uD800-\uDBFF][\uDC00-\uDFFF]/g,
							// 					""
							// 				)
							// 			) !=
							// 			utl.remove_invisible_char(
							// 				comment_msg.replaceAll(
							// 					/[\uD800-\uDBFF][\uDC00-\uDFFF]/g,
							// 					""
							// 				)
							// 			)
							// 		) {
							// 			//如果不等就删掉重新输入
							// 			await sleep(1e3);
							// 			await msg_box.focus();
							// 			await global_var.page.keyboard.down(
							// 				"Control"
							// 			);
							// 			await global_var.page.keyboard.press(
							// 				"A"
							// 			);
							// 			await global_var.page.keyboard.up(
							// 				"Control"
							// 			);
							// 			await sleep(1e3);
							// 			await global_var.page.keyboard.press(
							// 				"Backspace"
							// 			);
							// 			console.log(
							// 				"输入框里内容与评论不符，删除输入框里内容",
							// 				`\nmsg_box_content:${msg_box_content}\ncomment_msg:${comment_msg}`
							// 			);
							// 		} else {
							// 			//相等了就break出去
							// 			break;
							// 		}
							// 		if (_bt >= 5) {
							// 			console.log("输入框里输入内容失败");
							// 			await utl.my_throw("动态评论失败");
							// 			throw `动态评论失败`;
							// 		}
							// 		_bt += 1;
							// 	}
							// 	await sleep(1e3);
							// 	let comment_submit_jquert = `.comment-submit`;
							// 	try {
							// 		if (
							// 			await global_var.page.$(
							// 				`.reply-box-send`
							// 			)
							// 		) {
							// 			comment_submit_jquert = `.reply-box-send`;
							// 		} else {
							// 			comment_submit_jquert = `.comment-submit`;
							// 		}
							// 	} catch {
							// 		comment_submit_jquert = `.comment-submit`;
							// 	}
							// 	await global_var.page.click(
							// 		comment_submit_jquert
							// 	);
							// 	await MYAPI.PageFunc.waitForResponse(
							// 		global_var.page,
							// 		"reply/add"
							// 	);
							// 	await sleep(1e3);
							// }
							break;
						} catch (e) {
							bt++;
							console.error(
								global_var.user_info.uname,
								global_var.page.url(),
								`第${i + 1}次尝试输入动态评论！`,
								e
							);
							await utl.check_page_is_front(global_var.page);
							if (
								global_var.response.comment_dyn_response
									?.code == 12051
							) {
								break;
							}
							if (bt >= 5) {
								throw e;
							}
							await global_var.page.reload();
							await sleep(3e3);
							await global_var.page.evaluate(() => {
								this.scrollTo(0, 1500);
							});
							await global_var.page.evaluate(() => {
								this.scrollTo(0, -1500);
							});
							await sleep(3e3);
						}
					}

					//无论新版还是旧版动态都在最后再检查一次评论是否成功
					await CheckRisk();
					for (let i = 0; i < 10; i++) {
						if (global_var.response.comment_dyn_response) {
							console.log(
								`${
									global_var.user_info.uname
								}\t${pageurl}\t检查评论是否被阿瓦隆中${new Date().toLocaleString()}`
							);
							let check_reply_result =
								await my_operator.basic_operator.check_reply(
									global_var.response.comment_dyn_response,
									MYAPI.BiliAPI.draw_dynamic_id(pageurl)
								);
							if (check_reply_result) {
								console.log(
									`${
										global_var.user_info.uname
									}\t${await global_var.page.url()}\t评论成功，躲过阿瓦隆\t${new Date().toLocaleString()}`
								);
								break;
							} else {
								await utl.my_throw("动态评论失败，评论被隐藏");
								break;
							}
						} else {
							if (i == 9) {
								await utl.my_throw(
									`动态评论失败，获取评论响应失败${new Date().toLocaleString()}`
								);
							}
						}
						await sleep(2e3);
					}

					try {
						if (
							Math.random() < lottery_setting.comment_thumb_chance
						) {
							await my_operator.basic_operator.comment_thumb(
								opus_dynamic
							);
							await sleep(
								utl.random_choice(
									lottery_setting.Working_clearance_time
								)
							);
						}
					} catch (e) {
						throw e;
					}
				},
				comment_thumb: async (opus_dynamic = false) => {
					global_var.Getter.check_login_status();
					let pageurl = await global_var.page.url();
					if (pageurl.includes("opus")) {
						opus_dynamic = true;
					} else {
						opus_dynamic = false;
					}

					if (opus_dynamic) {
						try {
							let uname = global_var.user_info.uname;
							await sleep(3e3);
							let comment_user_index =
								await global_var.page.$$eval(
									`.user-name`,
									(els, uname) => {
										for (let j = 0; j < els.length; j++) {
											if (els[j].textContent == uname) {
												return j;
											}
										}
									},
									uname
								);
							let my_comment_thumb;
							try {
								my_comment_thumb = (
									await global_var.page.$$(`.reply-like`)
								)[comment_user_index];
							} catch (e) {
								console.warn(`my_comment_thumb，`, e);
								throw (`my_comment_thumb，`, e);
							}
							//console.log(`点赞第${comment_user_index}个评论条数`);
							if (my_comment_thumb) {
								await my_comment_thumb.click();
							} else {
								console.log("获取评论框元素失败评论点赞失败");
								return await utl.my_throw("评论点赞失败");
							}
							if (
								!(await global_var.page.waitForSelector(
									`.svg-icon.liked.use-color.like-icon.liked`,
									{ timeout: 10e3 }
								))
							) {
								console.warn("评论点赞失败");
								return await utl.my_throw("评论点赞失败");
							} else {
								console.log("评论点赞成功");
							}
						} catch (e) {
							console.log(e);
							console.warn(`评论点赞失败，comment_thumb`, e);
							await utl.my_throw(
								`评论点赞失败，comment_thumb，${e}`
							);
							throw `评论点赞失败，comment_thumb，${e}`;
						}
					} else {
						try {
							let uname = global_var.user_info.uname;
							await sleep(3e3);
							let comment_user_index =
								await global_var.page.$$eval(
									`.user-name`,
									(els, uname) => {
										for (let j = 0; j < els.length; j++) {
											if (els[j].textContent == uname) {
												return j;
											}
										}
									},
									uname
								);
							let my_comment_thumb;
							try {
								my_comment_thumb = (
									await global_var.page.$$(`.reply-like`)
								)[comment_user_index];
							} catch (e) {
								console.warn(`my_comment_thumb，`, e);
								throw (`my_comment_thumb，`, e);
							}
							//console.log(`点赞第${comment_user_index}个评论条数`);
							if (my_comment_thumb) {
								await my_comment_thumb.click();
							} else {
								console.log("获取评论框元素失败评论点赞失败");
								return await utl.my_throw("评论点赞失败");
							}
							if (
								!(await global_var.page.waitForSelector(
									`.svg-icon.liked.use-color.like-icon.liked`,
									{ timeout: 10e3 }
								))
							) {
								console.warn("评论点赞失败");
								return await utl.my_throw("评论点赞失败");
							} else {
								console.log("评论点赞成功");
							}
						} catch (e) {
							console.error(e);
							console.error(`评论点赞失败，comment_thumb`, e);
							await utl.my_throw(
								`评论点赞失败，comment_thumb，${e}`
							);
							throw `评论点赞失败，comment_thumb，${e}`;
						}
					}
				},
			},
			/**
			 * 操作视频的方法
			 */
			video_operator: {
				goto_video_page: async function (pageurl) {
					await global_var.page.goto(pageurl);
					await global_var.page.waitForSelector(
						`.bpx-player-video-area`
					);
					await pptr_op.remove_video_player(global_var.page);
				},
				sanlian: async function (pageurl) {
					let thumb_btn = await global_var.page
						.waitForSelector(`.video-like.video-toolbar-left-item`)
						.then(async (thumb_btn_element) => {
							await thumb_btn_element.click({ delay:10e3 });
						})
						.catch((e) => {
							console.error(`获取点赞按钮失败！${e}`);
						});
					let coin_btn = await global_var.page.$(
						`.video-coin.video-toolbar-left-item`
					);
					let coin_btn_On = await global_var.page
						.waitForSelector(
							`.video-coin.video-toolbar-left-item.on`
						)
						.catch((e) => {
							console.log(`等待硬币是否投出失败！${e}`);
							return null;
						});
					if (coin_btn_On) {
						console.log(
							`${
								global_var.user_info.uname
							}\t${pageurl}\t三连成功\t${new Date().toLocaleTimeString()}`
						);
					} else {
						console.warn(
							`${
								global_var.user_info.uname
							}\t${pageurl}\t三连失败，尝试单独投币\t${new Date().toLocaleTimeString()}`
						);
						await this.toubi(2, pageurl);
					}
				},
				toubi: async function (coin_num, pageurl) {
					let coin_btn = await global_var.page.waitForSelector(
						`.video-coin.video-toolbar-left-item`
					).then(async coin_btn_ele=>{
						await coin_btn_ele.click()
						return coin_btn_ele
					});
					if (coin_num == 1) {
						let one_coin_box = await global_var.page.$(
							`.mc-box.left-con`
						);
						await one_coin_box.click();
					}
					let coin_confirm_btn = await global_var.page.$(
						`.coin-bottom>.bi-btn`
					);
					await coin_confirm_btn.click();
					let coin_btn_title = await coin_btn.evaluate(
						(el) => el.title,
						coin_btn
					);
					if (coin_btn_title == "投币（W）") {
						console.log(
							`${
								global_var.user_info.uname
							}\t${pageurl}\t投币成功\t${new Date().toLocaleTimeString()}`
						);
					} else {
						console.warn(
							`${
								global_var.user_info.uname
							}\t${pageurl}\t投币成功\t${new Date().toLocaleTimeString()}`
						);
					}
					await sleep(3e3);
				},
			},
			fast_repost: async (opus_dynamic) => {
				//直接转发
				try {
					//直接点转发
					await sleep(1e3);
					await my_operator.basic_operator.dynamic_repost(
						opus_dynamic
					);
					//最后点赞
					await my_operator.basic_operator.dynamic_thumb(
						opus_dynamic
					);
				} catch {
					try {
						await sleep(
							utl.random_choice(
								lottery_setting.Working_clearance_time
							)
						);
						await global_var.page.click(".bili-dyn-action.forward"); //前往转发子页面
						await sleep(1e3);
						await my_operator.basic_operator.dynamic_repost(
							opus_dynamic
						);
						//最后点赞
						await my_operator.basic_operator.dynamic_thumb(
							opus_dynamic
						);
					} catch {
						console.log(global_var.response.global_dynamic_data);
						global_var.fengkong_flag = true; //可能触发风控，停一个小时
						return await utl.my_throw(`转发失败，fast_repost`);
					}
				}
			},
			/**
			 * 勾选同时转发到我的动态
			 * @param {*} comment_msg
			 * @returns
			 */
			comment_repost_dynamic_with_content: async (
				comment_msg,
				opus_dynamic = false
			) => {
				//转评带上回复内容
				let pageurl = await global_var.page.url();
				if (pageurl.includes("opus")) {
					opus_dynamic = true;
				} else {
					opus_dynamic = false;
				}

				if (opus_dynamic) {
					try {
						await my_operator.basic_operator.comment_submit(
							comment_msg,
							opus_dynamic
						);
						await sleep(3e3);
						await my_operator.basic_operator.dynamic_repost(
							opus_dynamic,
							comment_msg
						);
						await sleep(3e3);
						await my_operator.basic_operator.dynamic_thumb(
							opus_dynamic
						);
					} catch (e) {
						console.log(
							`转发失败，comment_repost_dynamic_with_content，${e}\n${pageurl}\t${global_var.user_info.uname}`
						);
						return await utl.my_throw(
							`转发失败，comment_repost_dynamic_with_content，${e}\n${pageurl}\t${global_var.user_info.uname}`
						);
					}
				} else {
					try {
						// let bt = 0;
						// while (1) {
						// 	if (bt > 5) {
						// 		//多次尝试点击勾选，超过次数则退出
						// 		break;
						// 	}
						// 	try {
						// 		await global_var.page.click(
						// 			`.reply-box-textarea`
						// 		);
						// 		await global_var.page
						// 			.waitForSelector(`.forward-input`, {
						// 				timeout: 5e3,
						// 			})
						// 			.then(async (checkbox) => {
						// 				await checkbox.click();
						// 			}); //勾选同时转发到我的动态
						// 		//  await global_var.page.click('.dynamic-repost-checkbox')
						// 		await sleep(1e3);
						// 		if (
						// 			await global_var.page.$eval(
						// 				".forward-input",
						// 				(el) => el.checked
						// 			)
						// 		) {
						// 			await sleep(3e3);
						// 			break;
						// 		}
						// 	} catch (e) {
						// 		await sleep(1e3);
						// 		await global_var.page.reload();
						// 		await sleep(3e3);
						// 		await global_var.page.evaluate(() => {
						// 			this.scrollTo(0, 1500);
						// 		});
						// 	}
						// 	bt += 1;
						// }
						// if (
						// 	await global_var.page.$eval(
						// 		".forward-input",
						// 		(el) => el.checked
						// 	)
						// ) {
						// 	await sleep(1e3);
						// } else {
						// 	console.log(
						// 		`勾选同时转发到我的动态转发失败\t${global_var.pageurl}\t${global_var.user_info.uname}`
						// 	);
						// 	await utl.my_throw(
						// 		"勾选同时转发到我的动态转发失败"
						// 	);
						// 	throw `勾选同时转发到我的动态转发失败，comment_repost_dynamic_with_content，${e}`;
						// }
						if (comment_msg != null && comment_msg != undefined) {
							await my_operator.basic_operator.comment_submit(
								comment_msg,
								opus_dynamic
							);
							await sleep(3e3);
							await my_operator.basic_operator.dynamic_repost(
								opus_dynamic,
								comment_msg
							);
						} else {
							console.error(
								`评论获取失败，comment_repost_dynamic_with_content\t${global_var.pageurl}\t${global_var.user_info.uname}`
							);
							return await utl.my_throw(
								"评论获取失败，comment_repost_dynamic_with_content"
							);
						}
						//检查转发是否成功
						try {
							let bt = 0;
							while (
								global_var.response.create_dyn_response ==
								undefined
							) {
								if (bt >= 10) {
									break;
								}
								await sleep(1e3);
								bt += 1;
							}
							///////////先暂时不判断响应
							// if (!global_var.response.create_dyn_response) {
							//     if (global_var.response.create_dyn_response.code != 0) {
							//         console.log(global_var.response.create_dyn_response)
							//         global_var.fengkong_flag = true//可能触发风控，停一个小时
							//         return await utl.my_throw(`动态转发失败，comment_repost_dynamic_with_content`)
							//     }
							// }
							// else {
							//     console.log('动态转发成功');
							// }
						} catch (e) {
							global_var.fengkong_flag = true; //可能触发风控，停一个小时
							await utl.my_throw(
								`动态转发失败，comment_repost_dynamic_with_content，${e}`
							);
							throw `动态转发失败，comment_repost_dynamic_with_content，${e}\n${global_var.pageurl}\t${global_var.user_info.uname}`;
						}

						//动态点赞
						await sleep(3e3);
						await my_operator.basic_operator.dynamic_thumb(
							opus_dynamic
						);
					} catch (e) {
						console.log(
							`转发失败，comment_repost_dynamic_with_content，${e}\n${pageurl}\t${global_var.user_info.uname}`
						);
						return await utl.my_throw(
							`转发失败，comment_repost_dynamic_with_content，${e}\n${pageurl}\t${global_var.user_info.uname}`
						);
					}
				}
			},
			/**
			 * 先评论再点击转发，转发内容为自动生成内容
			 * @param {*} comment_msg
			 * @returns
			 */
			comment_repost_dynamic_without_content: async (
				comment_msg,
				opus_dynamic
			) => {
				//转评不带回复内容
				let pageurl = await global_var.page.url();
				if (pageurl.includes("opus")) {
					opus_dynamic = true;
				} else {
					opus_dynamic = false;
				}

				if (opus_dynamic) {
					try {
						await my_operator.basic_operator.comment_submit(
							comment_msg,
							opus_dynamic
						);
						await sleep(3e3);
						await my_operator.basic_operator.dynamic_repost(
							opus_dynamic,
							""
						);
						await sleep(3e3);
						await my_operator.basic_operator.dynamic_thumb(
							opus_dynamic
						);
					} catch (e) {
						console.warn(
							`${global_var.response.create_dyn_response}\t评论转发失败，comment_repost_dynamic_without_content,\t${pageurl}\t${global_var.user_info.uname}\n`,
							e
						);
						return await utl.my_throw(
							`评论转发失败，comment_repost_dynamic_without_content，${e}`
						);
					}
				} else {
					//先评论
					try {
						if (comment_msg != null && comment_msg != undefined) {
							await my_operator.basic_operator.comment_submit(
								comment_msg,
								opus_dynamic
							);
						} else {
							console.warn(
								`评论获取失败\t${pageurl}\t${global_var.user_info.uname}`
							);
							return await utl.my_throw(
								"评论获取失败， comment_repost_dynamic_without_content"
							);
						}
						//再转发
						await sleep(1e3);
						// await global_var.page.click(".bili-dyn-action.forward"); //前往转发子页面
						// await sleep(1e3);
						await my_operator.basic_operator.dynamic_repost(
							opus_dynamic
						);
						//最后点赞
						await my_operator.basic_operator.dynamic_thumb(
							opus_dynamic
						);
					} catch (e) {
						console.warn(
							`${global_var.response.create_dyn_response}\t评论转发失败，comment_repost_dynamic_without_content,\t${pageurl}\t${global_var.user_info.uname}\n`,
							e
						);
						return await utl.my_throw(
							`评论转发失败，comment_repost_dynamic_without_content，${e}`
						);
					}
				}
			},
			only_comment: async (comment_msg, opus_dynamic) => {
				//只评论
				let pageurl = await global_var.page.url();
				if (pageurl.includes("opus")) {
					opus_dynamic = true;
				} else {
					opus_dynamic = false;
				}
				if (opus_dynamic) {
					try {
						if (comment_msg != null && comment_msg != undefined) {
							await my_operator.basic_operator.comment_submit(
								comment_msg,
								opus_dynamic
							);
						} else {
							console.warn(
								`评论获取失败\n${pageurl}\t${global_var.user_info.uname}`
							);
							return;
						}
						await sleep(1e3);
						await my_operator.basic_operator.dynamic_thumb(
							opus_dynamic
						);
					} catch (e) {
						console.warn(
							`评论获取失败\n${JSON.stringify(
								global_var.response.global_dynamic_data
							)}\t${pageurl}\t${global_var.user_info.uname}`
						);
						return await utl.my_throw(
							`评论获取失败， only_comment，${e}`
						);
					}
				} else {
					try {
						if (comment_msg != null && comment_msg != undefined) {
							await my_operator.basic_operator.comment_submit(
								comment_msg,
								opus_dynamic
							);
						} else {
							console.warn(
								`评论获取失败\n${pageurl}\t${global_var.user_info.uname}`
							);
							return;
						}
						await sleep(1e3);
						await my_operator.basic_operator.dynamic_thumb(
							opus_dynamic
						);
					} catch (e) {
						console.warn(
							`评论获取失败\n${JSON.stringify(
								global_var.response.global_dynamic_data
							)}\n${pageurl}\n${global_var.user_info.uname}`
						);
						return await utl.my_throw(
							`评论获取失败， only_comment，${e}`
						);
					}
				}
			},
			dynamic_content_operator: {
				//获取动态信息相关操作
				get_dynamic_content_and_top_msg: async (dynamic_data) => {
					//获取动态内容和up置顶的回复
					let get_top_msg = async () => {
						try {
							if (global_var.response.reply_main != undefined) {
								try {
									if (
										global_var.response.reply_main.code ==
											12061 ||
										global_var.response.reply_main?.data
											?.control?.input_disable //无法评论
									) {
										// code:
										// 12061
										// message:
										// 'UP主已关闭评论区'
										return "";
									}
									let ret_msg = "";
									let upper_mid =
										global_var.response.reply_main.data
											.upper.mid;
									let replies =
										global_var.response.reply_main.data
											.replies;
									let top =
										global_var.response.reply_main.data.top
											.upper;
									if (top != null) {
										ret_msg += top.content.message;
										if (top.replies) {
											for (let rp of top.replies) {
												if (rp.mid == upper_mid) {
													ret_msg +=
														rp.content.message;
												}
											}
										}
									}
									for (let i = 0; i < replies.length; i++) {
										let replies_content =
											replies[i].content.message;
										let replies_mid =
											replies[i].content.message.mid;
										if (replies_mid == upper_mid) {
											ret_msg += replies_content;
										}
									}
									return ret_msg;
								} catch (e) {
									console.error(
										`up置顶的回复获取失败`,
										e,
										global_var.response.reply_main
									);
									await utl.my_throw("up置顶的回复获取失败");
									return "";
								}
							} else {
								console.log("未拦截到评论API内容");
								await utl.my_throw("获取置顶评论失败");
								return "";
							}
						} catch (e) {
							console.error(`up置顶的回复获取失败`, e);
							await utl.my_throw("up置顶的回复获取失败");
							return "";
						}
					};
					try {
						if (!dynamic_data) {
							dynamic_data = (
								await MYAPI.BiliAPI.get_dynamic_v1_detail(
									MYAPI.BiliAPI.draw_dynamic_id(
										await global_var.page.url()
									)
								)
							).data;
							global_var.response.global_dynamic_data =
								dynamic_data;
						}
						let top_msg = "";
						if (global_var.response.reply_main != undefined) {
							top_msg = await get_top_msg();
						}
						let dynmaic_content = "";
						let dynamic_type = dynamic_data.item.type;
						if (dynamic_type == "DYNAMIC_TYPE_AV") {
							let dynamic_content1;
							let dynamic_content2;
							let dynamic_content3;
							try {
								dynamic_content1 =
									dynamic_data.item.modules.module_dynamic
										.desc.text;
							} catch {
								dynamic_content1 = "";
							}
							try {
								dynamic_content2 =
									dynamic_data.item.modules.module_dynamic
										.major.archive.desc;
							} catch {
								dynamic_content2 = "";
							}
							try {
								dynamic_content3 =
									dynamic_data.item.modules.module_dynamic
										.major.archive.title;
							} catch {
								dynamic_content3 = "";
							}

							if (
								dynamic_content1 != undefined &&
								dynamic_content1 != null
							) {
								dynmaic_content += dynamic_content1;
							}
							if (
								dynamic_content2 != undefined &&
								dynamic_content2 != null
							) {
								dynmaic_content += dynamic_content2;
							}
							if (
								dynamic_content3 != undefined &&
								dynamic_content3 != null
							) {
								dynmaic_content += dynamic_content3;
							}
						} else if (dynamic_type == "DYNAMIC_TYPE_ARTICLE") {
							let dynamic_content1;
							let dynamic_content2;
							let dynamic_content3;
							let dynamic_content4;
							try {
								dynamic_content1 =
									dynamic_data.item.modules.module_dynamic
										.desc.text;
							} catch {
								dynamic_content1 = "";
							}
							try {
								dynamic_content2 =
									dynamic_data.item.modules.module_dynamic
										.desc.additional;
							} catch {
								dynamic_content2 = "";
							}
							try {
								dynamic_content3 =
									dynamic_data.item.modules.module_dynamic
										.major.article.desc;
							} catch {
								dynamic_content3 = "";
							}
							try {
								dynamic_content4 =
									dynamic_data.item.modules.module_dynamic
										.major.opus.summary.text;
							} catch {
								dynamic_content4 = "";
							}

							if (
								dynamic_content1 != undefined &&
								dynamic_content1 != null
							) {
								dynmaic_content += dynamic_content1;
							}
							if (
								dynamic_content2 != undefined &&
								dynamic_content2 != null
							) {
								dynmaic_content += dynamic_content2;
							}
							if (
								dynamic_content3 != undefined &&
								dynamic_content3 != null
							) {
								dynmaic_content += dynamic_content3;
							}
							if (
								dynamic_content4 != undefined &&
								dynamic_content4 != null
							) {
								dynmaic_content += dynamic_content4;
							}
						} else {
							//图片动态或文字动态
							let dynamic_content1;
							let dynamic_content2;
							let dynamic_content3;
							let dynamic_content4;
							try {
								dynamic_content1 =
									dynamic_data.item.modules.module_dynamic.major?.opus?.summary?.rich_text_nodes
										?.map((el) => el.text)
										.join("");
							} catch {
								dynamic_content1 = "";
							}

							try {
								dynamic_content4 =
									dynamic_data.item.modules.module_dynamic
										?.major?.opus?.title;
							} catch {
								dynamic_content4 = "";
							}
							try {
								dynamic_content2 =
									dynamic_data.item.modules.module_dynamic
										.topic;
							} catch {
								dynamic_content2 = "";
							}
							try {
								dynamic_content3 =
									dynamic_data.item.modules.module_dynamic
										?.desc?.text;
							} catch {
								dynamic_content3 = "";
							}

							if (
								dynamic_content1 != undefined &&
								dynamic_content1 != null
							) {
								dynmaic_content += dynamic_content1;
							}
							if (
								dynamic_content2 != undefined &&
								dynamic_content2 != null
							) {
								dynmaic_content += dynamic_content2;
							}
							if (
								dynamic_content3 != undefined &&
								dynamic_content3 != null
							) {
								dynmaic_content += dynamic_content3;
							}
							if (
								dynamic_content4 != undefined &&
								dynamic_content4 != null
							) {
								dynmaic_content += dynamic_content4;
							}
						}
						let ret_dynamic_content = (
							dynmaic_content +
							"\n" +
							String(top_msg).replaceAll("undefined", "")
						).trim();
						return ret_dynamic_content;
					} catch (e) {
						console.warn(
							dynamic_data,
							"\n",
							global_var.user_info.uname,
							`get_dynamic_content_and_top_msg\n`,
							e,
							dynamic_data,
							global_var.response.global_dynamic_data
						);
						return JSON.stringify(dynamic_data);
					}
				},
			},
			dynamic_comment_operator: {
				//回复内容相关操作
				/**
				 * 预回复内容
				 * @param {string} dynamic_content
				 * @param {string} reply_msg
				 * @param {string} author_name
				 * @returns 返回空字符串表示无需带话题或@，返回undefined表示获取话题失败！
				 */
				pre_msg_processing: function (dynamic_content, reply_msg) {
					function zhDigitToArabic(digit) {
						const zh = [
							"零",
							"一",
							"二",
							"三",
							"四",
							"五",
							"六",
							"七",
							"八",
							"九",
						];
						const unit = ["千", "百", "十"];
						const quot = [
							"万",
							"亿",
							"兆",
							"京",
							"垓",
							"秭",
							"穰",
							"沟",
							"涧",
							"正",
							"载",
							"极",
							"恒河沙",
							"阿僧祗",
							"那由他",
							"不可思议",
							"无量",
							"大数",
						];
						let result = 0,
							quotFlag;

						for (let i = digit.length - 1; i >= 0; i--) {
							if (zh.indexOf(digit[i]) > -1) {
								// 数字
								if (quotFlag) {
									result += quotFlag * getNumber(digit[i]);
								} else {
									result += getNumber(digit[i]);
								}
							} else if (unit.indexOf(digit[i]) > -1) {
								// 十分位
								if (quotFlag) {
									result +=
										quotFlag *
										getUnit(digit[i]) *
										getNumber(digit[i - 1]);
								} else {
									result +=
										getUnit(digit[i]) *
										getNumber(digit[i - 1]);
								}
								--i;
							} else if (quot.indexOf(digit[i]) > -1) {
								// 万分位
								if (unit.indexOf(digit[i - 1]) > -1) {
									if (getNumber(digit[i - 1])) {
										result +=
											getQuot(digit[i]) *
											getNumber(digit[i - 1]);
									} else {
										result +=
											getQuot(digit[i]) *
											getUnit(digit[i - 1]) *
											getNumber(digit[i - 2]);
										quotFlag = getQuot(digit[i]);
										--i;
									}
								} else {
									result +=
										getQuot(digit[i]) *
										getNumber(digit[i - 1]);
									quotFlag = getQuot(digit[i]);
								}
								--i;
							}
						}

						return result;

						// 返回中文大写数字对应的阿拉伯数字
						function getNumber(num) {
							for (let i = 0; i < zh.length; i++) {
								if (zh[i] == num) {
									return i;
								}
							}
						}

						// 取单位
						function getUnit(num) {
							for (let i = unit.length; i > 0; i--) {
								if (num == unit[i - 1]) {
									return Math.pow(10, 4 - i);
								}
							}
						}

						// 取分段
						function getQuot(q) {
							for (var i = 0; i < quot.length; i++) {
								if (q == quot[i]) {
									return Math.pow(10, (i + 1) * 4);
								}
							}
						}
					}
					if (!reply_msg) {
						reply_msg = "";
					}
					let premsg = ""; //判断是否需要@或者带话题
					let msg = undefined;
					dynamic_content = dynamic_content.replaceAll(/＠/gim, "@");
					dynamic_content = dynamic_content.replaceAll(
						/@((?! ).){1,10} /gim,
						""
					);
					dynamic_content = dynamic_content.replaceAll(
						/标记/gim,
						"艾特"
					);
					dynamic_content = dynamic_content.replaceAll(
						/朋友/gim,
						"好友"
					);
					dynamic_content = dynamic_content.replaceAll(
						"转发话题",
						"带话题"
					);
					dynamic_content = dynamic_content.replaceAll("＃", "#");
					dynamic_content = dynamic_content.replaceAll("UP", "up");
					let non_topic_content = dynamic_content.replaceAll(
						/(?<=#)(.{0,10})(?=#)/gim,
						""
					);
					let topobj_6 = non_topic_content.match(
						/@.{0,3}位.*|.*@.{0,3}名.*/gim
					);
					let topobj_5 = non_topic_content.match(
						/@.{0,3}1位.*|.*@.{0,3}1名.*/
					);
					let topobj_4 = non_topic_content.match(
						/@.{0,3}一位.*|.*@.{0,3}一名.*/gim
					);
					let topobj_3 = non_topic_content.match(
						/@.{0,3}一位好友.*|.*@.{0,3}你的|.*@.{0,3}一名好友.*/gim
					);
					let topobj_2 = non_topic_content.match(
						/艾特.{0,3}位好友.*|.*艾特.{0,3}名好友.*|艾特.{0,7}up/gim
					);
					let topobj_1 =
						non_topic_content.match(/@你想祝福的人.*/gim);
					let topobj0 = non_topic_content.match(
						/@{0,3}位胖友.*|.*@{0,3}名胖友.*/gim
					);
					let topobj1 = non_topic_content.match(
						/圈.{0,3}位你的伙伴.*|.*圈.{0,3}名你的伙伴.*/gim
					);
					let topobj2 =
						non_topic_content.match(/带tag#.{0,30}#.*/gim);
					let topobj3 = non_topic_content.match(
						/带话题.{0,40}#.{0,30}#((?!投稿).)*$/gim
					);
					let topobj4 = non_topic_content.match(
						/带上tag#.{0,30}#((?!投稿).)*$/gim
					);
					let topobj5 = non_topic_content.match(
						/带#.{0,30}#.{0,10}话题((?!投稿).)*$/gim
					);
					let topobj6 = non_topic_content.match(/艾特好友.*/gim);
					let topobj7 = non_topic_content.match(
						/@.{0,4}名好友.*|.*@.{0,4}位好友.*/gim
					);
					let topobj8 =
						non_topic_content.match(/@你的.{0,3}个小伙伴.*/gim);
					let topobj9 =
						non_topic_content.match(/@两位好友.*|.*@两名好友.*/gim);
					let topobj10 = non_topic_content.match(
						/带#.{0,30}#((?!投稿).)*$/gim
					);
					let topobj11 =
						non_topic_content.match(/@.{0,5}你的.{0,3}个好友.*/gim);
					let topobj12 = non_topic_content.match(
						/带[^来】看懂]{0,5}#.{0,30}#((?!投稿).)*$/gim
					);
					let topobj13 = non_topic_content.match(
						/加话题#.{0,30}#((?!投稿).)*$/gim
					);
					let topobj14 = non_topic_content.match(
						/带标签#.{0,30}#((?!投稿).)*$/gim
					);
					let topobj15 =
						non_topic_content.match(/@三位好友.*|.*@三名好友.*/gim);
					let topobj_16 = non_topic_content.match(
						/带(.{0,3}#.{0,20}) 话题.(?!投稿).*?/gim
					);
					if (
						topobj_6 != null ||
						topobj6 != null ||
						topobj_5 != null ||
						topobj_4 != null ||
						topobj_3 != null ||
						topobj_2 != null ||
						topobj_1 != null ||
						topobj0 != null ||
						topobj1 != null ||
						topobj7 != null ||
						topobj8 != null ||
						topobj11 != null
					) {
						let UPname = "";
						try {
							UPname =
								global_var.response.global_dynamic_data.item
									.modules.module_author.name;
						} catch {}
						let at_times = 1;
						let findContent = [
							topobj_6,
							topobj6,
							topobj_5,
							topobj_4,
							topobj_3,
							topobj_2,
							topobj_1,
							topobj0,
							topobj1,
							topobj7,
							topobj8,
							topobj11,
						].join("");
						let num = parseInt(
							findContent.match(/\d+/gim).join("") ||
								zhDigitToArabic(findContent)
						);
						if (num > 0 && num < 5) {
							at_times = num;
						}
						let choose_Up_list = [];
						premsg =
							"@" +
							(UPname
								? UPname
								: utl.random_choice(
										lottery_setting.at_member
								  )) +
							" ";
						for (let i = 0; i < at_times - 1; i++) {
							let at_up = "";
							while (!choose_Up_list.includes(at_up)) {
								at_up = utl.random_choice(
									lottery_setting.at_member
								);
								if (!choose_Up_list.includes(at_up)) {
									choose_Up_list.push(at_up);
								}
								if (
									choose_Up_list.length ==
									lottery_setting.at_member.length
								)
									break;
							}
							premsg += "@" + at_up + " ";
						}
					} else if (topobj9 != null) {
						premsg = `@${utl.random_choice(
							lottery_setting.at_member
						)} @${utl.random_choice(lottery_setting.at_member)} `;
					} else if (topobj2 != null) {
						msg = /带tag#(.{0,20})#.*/gim
							.exec(dynamic_content)
							.slice(1);
						for (let _ = 0; _ < msg.length; _++) {
							if (msg[_] != null && msg[_] != undefined) {
								premsg += "#" + msg[_] + "#";
							}
						}
					} else if (topobj3 != null) {
						msg = /带话题.*?#(.{0,30})#.*/gim
							.exec(dynamic_content)
							.slice(1);
						for (let _ = 0; _ < msg.length; _++) {
							if (msg[_] != null && msg[_] != undefined) {
								premsg += "#" + msg[_] + "#";
							}
						}
					} else if (topobj4 != null) {
						msg = /带上tag#(.{0,30})#.*/gim
							.exec(dynamic_content)
							.slice(1);
						for (let _ = 0; _ < msg.length; _++) {
							if (msg[_] != null && msg[_] != undefined) {
								premsg += "#" + msg[_] + "#";
							}
						}
					} else if (topobj5 != null) {
						msg = /带#(.{0,30})#.{0,10}话题.*/gim
							.exec(dynamic_content)
							.slice(1);
						for (let _ = 0; _ < msg.length; _++) {
							if (msg[_] != null && msg[_] != undefined) {
								premsg += "#" + msg[_] + "#";
							}
						}
					} else if (topobj10 != null) {
						msg = /带#(.{0,30})#.*/gim
							.exec(dynamic_content)
							.slice(1);
						for (let _ = 0; _ < msg.length; _++) {
							if (msg[_] != null && msg[_] != undefined) {
								premsg += "#" + msg[_] + "#";
							}
						}
					} else if (topobj12 != null) {
						msg = /带.{0,5}#(.{0,30})#.*/gim
							.exec(dynamic_content)
							.slice(1);
						for (let _ = 0; _ < msg.length; _++) {
							if (msg[_] != null && msg[_] != undefined) {
								premsg += "#" + msg[_] + "#";
							}
						}
					} else if (topobj13 != null) {
						msg = /加话题#(.{0,30})#.*/gim
							.exec(dynamic_content)
							.slice(1);
						for (let _ = 0; _ < msg.length; _++) {
							if (msg[_] != null && msg[_] != undefined) {
								premsg += "#" + msg[_] + "#";
							}
						}
					} else if (topobj14 != null) {
						msg = /带标签#(.{0,30})#.*/gim
							.exec(dynamic_content)
							.slice(1);
						for (let _ = 0; _ < msg.length; _++) {
							if (msg[_] != null && msg[_] != undefined) {
								premsg += "#" + msg[_] + "#";
							}
						}
					} else if (topobj15 != null) {
						premsg = `@${utl.random_choice(
							lottery_setting.at_member
						)} @${utl.random_choice(
							lottery_setting.at_member
						)} @${utl.random_choice(lottery_setting.at_member)} `;
					} else if (topobj_16 != null) {
						msg = /带(.{0,3}#.{0,20}) 话题.(?!投稿).*?/gim
							.exec(dynamic_content)
							.slice(1);
						for (let _ = 0; _ < msg.length; _++) {
							if (msg[_] != null && msg[_] != undefined) {
								premsg += "#" + msg[_] + "#";
							}
						}
					}
					if (premsg.indexOf("#") > -1) {
						let tpremsg = "";
						for (let _ = 0; _ < premsg.split("#").length; _++) {
							if (
								premsg.split("#")[_] != "" &&
								premsg.split("#")[_] != " " &&
								premsg.split("#")[_] != "  " &&
								premsg.split("#")[_] != "和"
							) {
								if (tpremsg.length < 18) {
									tpremsg += "#" + premsg.split("#")[_] + "#";
								}
							}
						}
						premsg = tpremsg;
					}
					if (
						/带话题#.*#((?!投稿).)*$/gim.test(non_topic_content) ||
						/带((?!】|来|看懂)).{0,5}#/.test(non_topic_content) ||
						topobj2 ||
						topobj3 ||
						topobj4 ||
						topobj5 ||
						topobj10 ||
						topobj12 ||
						topobj13 ||
						topobj14
					) {
						if (
							!(premsg.includes("#") || reply_msg.includes("#"))
						) {
							// utl.my_throw("话题获取失败");
							return undefined;
						}
					}
					return premsg;
				},
				/**
				 * 预处理动态内容
				 */
				pre_process_dynamic_content: (dynamic_content) => {
					try {
						dynamic_content = dynamic_content.replaceAll(
							/「/gim,
							"【"
						);
						dynamic_content = dynamic_content.replaceAll(
							/」/gim,
							"】"
						);
						dynamic_content = dynamic_content.replaceAll(
							/〗/gim,
							"】"
						);
						dynamic_content = dynamic_content.replaceAll(
							/〖/gim,
							"【"
						);
						dynamic_content = dynamic_content.replaceAll(
							/“/gim,
							'"'
						);
						dynamic_content = dynamic_content.replaceAll(
							/”/gim,
							'"'
						);
						dynamic_content = dynamic_content.replaceAll(
							/＠/gim,
							"@"
						);
						dynamic_content = dynamic_content.replaceAll(
							/@.{0,8} /gim,
							""
						);
						dynamic_content = dynamic_content.replaceAll(
							/好友/gim,
							"朋友"
						);
						dynamic_content = dynamic_content.replaceAll(
							/伙伴/gim,
							"朋友"
						);
						dynamic_content = dynamic_content.replaceAll(
							/安利/gim,
							"分享"
						);
						dynamic_content = dynamic_content.replaceAll(
							/【关注】/gim,
							""
						);
						dynamic_content = dynamic_content.replaceAll(
							/添加话题/gim,
							"带话题"
						);

						dynamic_content = dynamic_content.replaceAll(
							/[\?|❓]/gim,
							"？"
						);
						return dynamic_content;
					} catch {
						return dynamic_content;
					}
				},
				/**
				 * 判断是否需要人工回复
				 * @param {string} dynamic_content
				 * @returns {boolean} - true ：人工回复 false：自动评论
				 */
				manual_reply_judge: function (dynamic_content) {
					//判断是否需要人工回复 返回true需要人工判断  返回null不需要人工判断
					//64和67用作判断是否能使用关键词回复
					let none_lottery_word1 = /.*测试.{0,5}gua/gim.test(
						dynamic_content
					);
					if (none_lottery_word1) {
						return true;
					}
					dynamic_content = dynamic_content.replaceAll(/「/gim, "【");
					dynamic_content = dynamic_content.replaceAll(/」/gim, "】");
					dynamic_content = dynamic_content.replaceAll(/〗/gim, "】");
					dynamic_content = dynamic_content.replaceAll(/〖/gim, "【");
					dynamic_content = dynamic_content.replaceAll(/“/gim, '"');
					dynamic_content = dynamic_content.replaceAll(/”/gim, '"');
					dynamic_content = dynamic_content.replaceAll(/＠/gim, "@");
					dynamic_content = dynamic_content.replaceAll(
						/@.{0,8} /gim,
						""
					);
					dynamic_content = dynamic_content.replaceAll(
						/好友/gim,
						"朋友"
					);
					dynamic_content = dynamic_content.replaceAll(
						/伙伴/gim,
						"朋友"
					);
					dynamic_content = dynamic_content.replaceAll(
						/安利/gim,
						"分享"
					);
					dynamic_content = dynamic_content.replaceAll(
						/【关注】/gim,
						""
					);
					dynamic_content = dynamic_content.replaceAll(
						/添加话题/gim,
						"带话题"
					);

					dynamic_content = dynamic_content.replaceAll(
						/[\?|❓]/gim,
						"？"
					);
					dynamic_content = dynamic_content.replaceAll(/:/gim, "：");
					let manual_re1 =
						/.*评论.{0,20}告诉|.*有关的评论|.*告诉.{0,20}留言/gim.test(
							dynamic_content
						);
					let manual_re2 =
						/.*评论.{0,20}理由|.*参与投稿.{0,30}有机会获得/gim.test(
							dynamic_content
						);
					let manual_re3 = /.*评论.{0,10}对|.*造.{0,3}句子/gim.test(
						dynamic_content
					);
					let manual_re4 =
						/.*猜赢|.*猜对|.*答对|.*猜到.{0,5}答案/gim.test(
							dynamic_content
						);
					let manual_re5 =
						/.*说.{0,10}说|.*谈.{0,10}谈|.*夸.{0,10}夸|评论.{0,10}写.{0,10}写|.*写下.{0,5}假如.{0,5}是|.*讨论.{0,10}怎么.{0,10}？/gim.test(
							dynamic_content
						);
					let manual_re7 =
						/.*最先猜中|.*带文案|.*许.{0,5}愿望/gim.test(
							dynamic_content
						);
					let manual_re8 = /.*新衣回/gim.test(dynamic_content);
					let manual_re9 =
						/.*留言.{0,10}建议|.*评论.{0,10}答|.*一句话证明|.*留言.{0,10}得分|.*有趣.{0,3}留言|.*有趣.{0,3}评论|.*留言.{0,3}晒出|.*评论.{0,3}晒出/gim.test(
							dynamic_content
						);
					let manual_re11 =
						/.*评论.{0,10}祝福|.*评论.{0,10}意见|.*意见.{0,10}评论|.*留下.{0,10}意见|.*留下.{0,15}印象|.*意见.{0,10}留下/gim.test(
							dynamic_content
						);
					let manual_re12 =
						/.*评论.{0,10}讨论|.*话题.{0,10}讨论|.*参与.{0,5}讨论/gim.test(
							dynamic_content
						);
					let manual_re14 =
						/.*评论.{0,10}说出|,*留言.{0,5}身高/gim.test(
							dynamic_content
						);
					let manual_re15 =
						/.*评论.{0,20}分享|.*评论.{0,20}互动((?!抽奖|,|，|来).)*$|.*评论.{0,20}提问|.*想问.{0,20}评论|.*想说.{0,20}评论|.*想问.{0,20}留言|.*想说.{0,20}留言/gim.test(
							dynamic_content
						);
					let manual_re16 = /.*评论.{0,10}聊.{0,10}聊/gim.test(
						dynamic_content
					);
					let manual_re17 = /.*评.{0,10}接力/gim.test(
						dynamic_content
					);
					let manual_re18 =
						/.*聊.{0,10}聊|有没有.{0,20}事.{0,5}？/gim.test(
							dynamic_content
						);
					let manual_re19 =
						/.*评论.{0,10}扣|.*评论.{0,5}说.{0,3}下/gim.test(
							dynamic_content
						);
					let manual_re20 = /.*转发.{0,10}分享/gim.test(
						dynamic_content
					);
					let manual_re21 = /.*评论.{0,10}告诉/gim.test(
						dynamic_content
					);
					let manual_re22 = /.*评论.{0,10}唠.{0,10}唠/gim.test(
						dynamic_content
					);
					let manual_re23 =
						/.*今日.{0,5}话题|.*参与.{0,5}话题|.*参与.{0,5}答题/gim.test(
							dynamic_content
						);
					let manual_re24 = /.*说.*答案|.*评论.{0,15}答案/gim.test(
						dynamic_content
					);
					let manual_re25 = /.*说出/gim.test(dynamic_content);
					let manual_re26 = /.*为.{0,10}加油/gim.test(
						dynamic_content
					);
					let manual_re27 =
						/.*评论.{0,10}话|.*你中意的|.*评.{0,10}你.{0,5}的|.*写上.{0,10}你.{0,5}的|.*写下.{0,10}你.{0,5}的/gim.test(
							dynamic_content
						);
					let manual_re28 =
						/.*评论.{0,15}最想做7的事|.*评.{0,15}最喜欢|.*评.{0,15}最.{0,7}的事|.*最想定制的画面|最想.{0,20}\?|最想.{0,20}？/gim.test(
							dynamic_content
						);
					let manual_re29 =
						/.*分享.{0,20}经历|.*经历.{0,20}分享/gim.test(
							dynamic_content
						);
					let manual_re30 = /.*分享.{0,20}心情/gim.test(
						dynamic_content
					);
					let manual_re31 = /.*评论.{0,10}句|评论.{0,6}包含/gim.test(
						dynamic_content
					);
					let manual_re32 = /.*转关评下方视频/gim.test(
						dynamic_content
					);
					let manual_re33 =
						/.*分享.{0,10}美好|.*分享.{0,10}期待/gim.test(
							dynamic_content
						);
					let manual_re34 = /.*视频.{0,10}弹幕/gim.test(
						dynamic_content
					);
					let manual_re35 = /.*生日快乐/gim.test(dynamic_content);
					let manual_re36 = /.*一句话形容/gim.test(dynamic_content);
					let manual_re38 =
						/.*分享.{0,10}喜爱|.*分享.{0,10}最爱|.*推荐.{0,10}最爱|.*推荐.{0,10}喜爱/gim.test(
							dynamic_content
						);
					let manual_re39 =
						/.*分享((?!,|，).){0,10}最|.*评论((?!,|，).){0,10}最/gim.test(
							dynamic_content
						);
					let manual_re40 =
						/.*带话题.{0,15}晒|.*带话题.{0,15}讨论/gim.test(
							dynamic_content
						);
					let manual_re41 =
						/.*分享.{0,15}事|点赞.{0,3}数.{0,3}前/gim.test(
							dynamic_content
						);
					let manual_re42 = /.*送出.{0,15}祝福/gim.test(
						dynamic_content
					);
					let manual_re43 = /.*评论.{0,30}原因/gim.test(
						dynamic_content
					);
					let manual_re47 = /.*答案.{0,10}参与/gim.test(
						dynamic_content
					);
					let manual_re48 = /.*唠.{0,5}唠/gim.test(dynamic_content);
					let manual_re49 = /.*分享一下/gim.test(dynamic_content);
					let manual_re50 = /.*评论.{0,30}故事/gim.test(
						dynamic_content
					);
					let manual_re51 =
						/.*告诉.{0,30}什么|.*告诉.{0,30}最|有什么安排呀～/gim.test(
							dynamic_content
						);
					let manual_re53 = /.*发布.{0,20}图.{0,5}动态/gim.test(
						dynamic_content
					);
					let manual_re54 = /.*视频.{0,20}评论/gim.test(
						dynamic_content
					);
					let manual_re55 = /.*复zhi|.*长按/gim.test(dynamic_content);
					let manual_re56 = /.*多少.{0,10}合适/gim.test(
						dynamic_content
					);
					let manual_re57 = /.*喜欢.{0,5}哪/gim.test(dynamic_content);
					let manual_re58 =
						/.*多少.{0,15}？|.*多少.{0,15}\?|.*有没有.{0,15}？|.*有没有.{0,15}\?|.*是什么.{0,15}？|.*是什么.{0,15}\?/gim.test(
							dynamic_content
						);
					let manual_re61 = /.*看.{0,10}猜/gim.test(dynamic_content);
					let manual_re63 =
						/.*评论.{0,10}猜|.*评论.{0,15}预测|选择.{0,5}任意.{0,17}评论/gim.test(
							dynamic_content
						);
					let manual_re65 = /.*老规矩你们懂的/gim.test(
						dynamic_content
					);
					let manual_re67 =
						/.*[评|带]((?!抽奖|,|，|来).){0,7}“|.*[评|带]((?!抽奖|,|，|来).){0,7}"|.*[评|带]((?!抽奖|,|，|来).){0,7}【|.*[评|带]((?!抽奖|,|，|来).){0,7}：|.*[评|带]((?!抽奖|,|，|来).){0,7}：|.*[评|带]((?!抽奖|,|，|来).){0,7}「|.*带关键词.{0,7}"|.*评论关键词[“”‘’"']|.*留言((?!抽奖|,|，|来).){0,7}“|.*对出.{0,10}下联.{0,5}横批|.*回答.{0,8}问题|.*留下.{0,10}祝福语|.*留下.{0,10}愿望|.*找到.{0,10}不同的.{0,10}留言|.*答案放在评论区|.*几.{0,5}呢？|.*有奖问答|.*想到.{0,19}关于.{0,20}告诉|.*麻烦大伙评论这个|报暗号【.{0,4}】|评论.{0,3}输入.{0,3}["“”:：]|.*评论.{0,7}暗号/gim.test(
							dynamic_content
						);
					let manual_re76 =
						/.*留言((?!抽奖|,|，|来).).{0,7}"|.*留下((?!抽奖|,|，|来).){0,5}“|.*留下((?!抽奖|,|，|来).){0,5}【|.*留下((?!抽奖|,|，|来).){0,5}：|.*留下((?!抽奖|,|，|来).){0,5}「/gim.test(
							dynamic_content
						);
					let manual_re77 =
						/.*留言((?!抽奖|,|，|来).).{0,7}"|.*留言((?!抽奖|,|，|来).).{0,7}“|.*留言((?!抽奖|,|，|来).){0,7}【|.*留言((?!抽奖|,|，|来).){0,7}：|.*留言((?!抽奖|,|，|来).){0,7}「/gim.test(
							dynamic_content
						);
					let manual_re64 =
						/和.{0,5}分享.{0,5}的|.*分享.{0,10}你的|.*正确回答|.*回答正确|.*评论.{0,10}计划|.*定.{0,10}目标.{0,5}？|.*定.{0,10}目标.{0,5}?|.*评论.{0,7}看的电影|.*如果.{0,20}觉得.{0,10}？|.*如果.{0,20}觉得.{0,10}\?|评论.{0,7}希望.{0,5}|.*竞猜[\s\S]{0,15}[答评]|.*把喜欢的.{0,10}评论|.*评论.{0,5}解.{0,5}密|.*这款.{0,10}怎么.{0,3}？|.*最喜欢.{0,5}的.*为什么？|.*留下.{0,15}的.{0,5}疑问|.*写下.{0,10}的.{0,5}问题/gim.test(
							dynamic_content
						);
					let manual_re6 =
						/.*@TA|.*@.{0,15}朋友|.*艾特|.*@.{0,3}你的|.*标记.{0,10}朋友|.*@{0,15}赞助商|.*发表你的新年愿望\+个人的昵称|.*抽奖规则请仔细看图片|.*带上用户名|.*活动详情请戳图片|.*@个人用户名|评论.{0,5}附带.{0,10}相关内容|回复.{0,5}视频.{0,10}相关内容|.*评论.{0,5}昵称|转发.{0,8}并@/gim.test(
							dynamic_content
						);
					let manual_re62 =
						/.*评论.{0,10}#.*什么|.*转评.{0,3}#.*(?<=，)/gim.test(
							dynamic_content
						);
					let manual_re68 =
						/.*将.{0,10}内容.{0,10}评|.*打几分？/gim.test(
							dynamic_content
						);
					let manual_re70 =
						/.*会不会.{0,20}？|.*会不会.{0,20}\?|如何.{0,20}？|如何.{0,20}\?/gim.test(
							dynamic_content
						);
					let manual_re71 =
						/.*猜.{0,10}猜|.*猜.{0,10}比分|.*猜中.{0,10}获得|.*猜中.{0,10}送出/gim.test(
							dynamic_content
						);
					let manual_re72 = /.*生日|.*新年祝福/gim.test(
						dynamic_content
					);
					let manual_re73 =
						/.*知道.{0,15}什么.{0,15}？|.*知道.{0,15}什么.{0,15}\?|.*用什么|.*评.{0,10}收.{0,5}什么.{0.7}\?|.*评.{0,10}收.{0,5}什么.{0,7}？|.*抽奖口令.{0,3}：/gim.test(
							dynamic_content
						);
					let manual_re74 =
						/.*领.{0,10}红包.{0,5}大小|.*领.{0,10}多少.{0,10}红包|.*红包金额/gim.test(
							dynamic_content
						);
					let manual_re75 =
						/.*本周话题|.*互动话题|.*互动留言|.*互动时间|.*征集.{0,10}名字|.*征集.{0,15}外号|.*投票.{0,5}选.{0,10}最.{0,5}的|.*投票.{0,10}评论|.*一人说一个谐音梗|帮.{0,5}想想.{0,5}怎么|评论.{0,5}想给.{0,7}的|取.{0,7}名字/gim.test(
							dynamic_content
						);

					return (
						manual_re1 ||
						manual_re2 ||
						manual_re3 ||
						manual_re4 ||
						manual_re5 ||
						manual_re6 ||
						manual_re7 ||
						manual_re8 ||
						manual_re9 ||
						manual_re11 ||
						manual_re12 ||
						manual_re14 ||
						manual_re15 ||
						manual_re16 ||
						manual_re17 ||
						manual_re18 ||
						manual_re19 ||
						manual_re20 ||
						manual_re21 ||
						manual_re22 ||
						manual_re23 ||
						manual_re24 ||
						manual_re25 ||
						manual_re26 ||
						manual_re27 ||
						manual_re28 ||
						manual_re29 ||
						manual_re30 ||
						manual_re31 ||
						manual_re32 ||
						manual_re33 ||
						manual_re34 ||
						manual_re35 ||
						manual_re36 ||
						manual_re38 ||
						manual_re39 ||
						manual_re40 ||
						manual_re41 ||
						manual_re42 ||
						manual_re43 ||
						manual_re76 ||
						manual_re47 ||
						manual_re48 ||
						manual_re49 ||
						manual_re50 ||
						manual_re51 ||
						manual_re53 ||
						manual_re54 ||
						manual_re58 ||
						manual_re55 ||
						manual_re56 ||
						manual_re57 ||
						manual_re61 ||
						manual_re62 ||
						manual_re63 ||
						manual_re64 ||
						manual_re65 ||
						manual_re67 ||
						manual_re68 ||
						manual_re70 ||
						manual_re71 ||
						manual_re72 ||
						manual_re73 ||
						manual_re74 ||
						manual_re75 ||
						manual_re77 ||
						manual_re77
					);
				},
				/**
				 * 返回true代表这个动态不是抽奖up的动态，不能转发评论
				 */
				non_lottery_up_judge: () => {
					try {
						let non_lottery_up_mids = GLOBAL_CONFIG.lot_module
							.non_lottery_up_mids
							? GLOBAL_CONFIG.lot_module.non_lottery_up_mids
							: [
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
							  ];
						let up_mid =
							global_var.response.global_dynamic_data.item.modules.module_author.mid.toString();
						if (non_lottery_up_mids.includes(up_mid)) {
							return true;
						} else {
							return false;
						}
					} catch (e) {
						console.warn(`Error\tnon_lottery_up_judge\n`, e);
					}
				},
				key_word_reply: (dynamic_content) => {
					if (
						/.*[评|带]((?!抽奖|,|，|来).){0,7}“|.*[评|带]((?!抽奖|,|，|来).){0,7}"|.*[评|带]((?!抽奖|,|，|来).){0,7}【|.*[评|带]((?!抽奖|,|，|来).){0,7}:|.*[评|带]((?!抽奖|,|，|来).){0,7}：|.*[评|带]((?!抽奖|,|，|来).){0,7}「|.*带关键词.{0,7}"|.*评论关键词[“”‘’"']|.*留言((?!抽奖|,|，|来).){0,7}“|.*对出.{0,10}下联.{0,5}横批|.*回答.{0,8}问题|.*留下.{0,10}祝福语|.*留下.{0,10}愿望|.*找到.{0,10}不同的.{0,10}留言|.*答案放在评论区|.*几.{0,5}呢？|.*有奖问答|.*想到.{0,19}关于.{0,20}告诉|.*麻烦大伙评论这个|留下.{0,7}的|报暗号【.{0,4}】/gim.test(
							dynamic_content
						) ||
						/.*留下((?!抽奖|,|，).){0,5}“|.*留下((?!抽奖|,|，).){0,5}【|.*留下((?!抽奖|,|，).){0,5}:|.*留下((?!抽奖|,|，).){0,5}：|.*留下((?!抽奖|,|，).){0,5}「/gim.test(
							dynamic_content
						) ||
						/.*留言((?!抽奖|,|，).).{0,7}“|.*留言((?!抽奖|,|，).){0,7}【|.*留言((?!抽奖|,|，).){0,7}:|.*留言((?!抽奖|,|，).){0,7}：|.*留言((?!抽奖|,|，).){0,7}「/gim.test(
							dynamic_content
						) ||
						/.*分享.{0,10}你的|.*正确回答|.*回答正确|.*评论.{0,10}计划|.*定.{0,10}目标.{0,5}？|.*定.{0,10}目标.{0,5}?|.*评论.{0,7}看的电影|.*如果.{0,20}觉得.{0,10}？|.*如果.{0,20}觉得.{0,10}\?|评论.{0,7}希望.{0,5}|.*竞猜[\s\S]{0,15}答|.*把喜欢的.{0,10}评论|.*评论.{0,5}解.{0,5}密|.*这款.{0,10}怎么.{0,3}？|.*最喜欢.{0,5}的.*为什么？|.*留下.{0,15}的.{0,5}疑问|.*写下.{0,10}的.{0,5}问题/gim.test(
							dynamic_content
						) ||
						/.*@TA|.*@.{0,15}朋友|.*艾特|.*@.{0,3}你的|.*标记.{0,10}朋友|.*@{0,15}赞助商|.*发表你的新年愿望\+个人的昵称|.*抽奖规则请仔细看图片|.*带上用户名|.*活动详情请戳图片|.*@个人用户名|评论.{0,5}附带.{0,10}相关内容|回复.{0,5}视频.{0,10}相关内容/gim.test(
							dynamic_content
						) ||
						/.*评论.{0,10}#.*什么|.*转评.{0,3}#.*(?<=，)/gim.test(
							dynamic_content
						) ||
						/.*本周话题|.*互动话题|.*互动留言|.*互动时间|.*征集.{0,10}名字/gim.test(
							dynamic_content
						)
					) {
						//如果是指定回复某个评论直接返回undefined
						return undefined;
					}
					if (
						/.*留下((?!抽奖).){0,5}“|.*留下((?!抽奖).){0,5}【|.*留下((?!抽奖).){0,5}:|.*留下((?!抽奖).){0,5}：|.*留下((?!抽奖).){0,5}「/gim.test(
							dynamic_content
						)
					) {
						return undefined;
					}
					if (
						/.*猜.{0,10}猜|.*猜.{0,10}比分|.*猜中.{0,10}获得/gim.test(
							dynamic_content
						)
					) {
						return undefined;
					}
					if (
						/.*领到多少红包|.*领.{0,3}到.{0,3}红包大小|.*评论.{0,10}红包金额|留言.{0,10}红包金额|.*领.{0,3}的.{0,3}红包大小/gim.test(
							dynamic_content
						)
					) {
						return lottery_setting.key_word_comment.red_pocket;
					}
					if (/.*喜欢.{0,5}零食/gim.test(dynamic_content)) {
						if (lottery_setting.key_word_comment.favorite_food) {
							return (
								utl.random_choice([
									"",
									"最爱",
									"喜欢",
									"想吃",
									"",
									"",
								]) +
								utl.random_choice(
									lottery_setting.key_word_comment
										.favorite_food
								)
							);
						} else {
							return (
								utl.random_choice([
									"",
									"最爱",
									"喜欢",
									"想吃",
									"",
									"",
								]) +
								utl.random_choice([
									"薯片",
									"巧克力",
									"辣条",
									"冰淇淋",
									"肉松饼",
									"魔芋爽",
									"小酥肉",
									"烤冷面",
									"鸡柳",
									"曲奇饼干",
									"芒果干",
									"猪肉脯",
								])
							);
						}
					}
					if (
						/.*喜欢.{0,5}颜色|.*最爱.{0,5}颜色/gim.test(
							dynamic_content
						)
					) {
						if (lottery_setting.key_word_comment.favorite_color) {
							return (
								utl.random_choice(["", "喜欢", "", ""]) +
								utl.random_choice(
									lottery_setting.key_word_comment
										.favorite_color
								)
							);
						} else {
							return (
								utl.random_choice(["", "喜欢", "", ""]) +
								utl.random_choice(["白色", "黑色", "红色"])
							);
						}
					}
					if (
						/.*生日季|.*生日回|.*生日会|.*生日祝福|.*岁生日/gim.test(
							dynamic_content
						)
					) {
						if (
							lottery_setting.key_word_comment
								.birthday_congratulation
						) {
							return utl.random_choice(
								lottery_setting.key_word_comment
									.birthday_congratulation
							);
						} else {
							return utl.random_choice([
								"生快",
								"生日快乐！",
								"生日快乐呀",
							]);
						}
					}
					if (/.*新年祝福/gim.test(dynamic_content)) {
						if (
							lottery_setting.key_word_comment
								.newyear_congratulation
						) {
							return utl.random_choice(
								lottery_setting.key_word_comment
									.newyear_congratulation
							);
						} else {
							return utl.random_choice([
								"祝新年福满天！",
								"新年快乐！",
								"新年快乐呀",
							]);
						}
					}
					if (
						/.*长按.{0,5}复制|.*复制.{0,5}长按|.*长按.{0,5}fu制|.*长按.{0,5}copy/gim.test(
							dynamic_content
						)
					) {
						if (lottery_setting.key_word_comment.qiafan_promotion) {
							return utl.random_choice(
								lottery_setting.key_word_comment
									.qiafan_promotion
							);
						} else {
							return undefined;
						}
					}
					return undefined;
				},
				/**
				 * 判断是否需要转发评论的内容  true:转发评论的内容 false:转发默认内容
				 */
				repost_with_comment_judge: (dynamic_content) => {
					dynamic_content =
						my_operator.dynamic_comment_operator.pre_process_dynamic_content(
							dynamic_content
						);
					let re_1 = /.*转发.{0,5}含关键词|转发.{0,8}并@/gim.test(
						dynamic_content
					);
					return re_1;
				},
				/**
				 * 如果返回值包含undefined或者不包含需要人工回复就直接开始抽奖
				 * @param {String} dynamic_content
				 * @param {String} dynamic_id
				 * @returns
				 */
				reply_comment_generator: async (
					//返回undefined表示需要人工回复，而不是从预设的回复里面选内容
					dynamic_content,
					dynamic_id
				) => {
					//生成所需评论//生成评论
					let comment_msg = undefined;
					if (
						my_operator.dynamic_comment_operator.non_lottery_up_judge()
					) {
						console.log("包含非抽奖up，跳过");
						comment_msg = "人工回复";
						await utl.my_throw("需要人工回复的动态");
						return undefined;
					}
					let pre_msg = "";
					pre_msg =
						my_operator.dynamic_comment_operator.pre_msg_processing(
							dynamic_content,
							comment_msg
						);
					if (
						my_operator.dynamic_comment_operator.manual_reply_judge(
							dynamic_content
						) ||
						global_var.response.global_dynamic_data.item.basic
							.comment_type == 1 || pre_msg==undefined
					) {
						//先判断是否要人工回复 视频全部抄
						let key_reply =
							my_operator.dynamic_comment_operator.key_word_reply(
								dynamic_content
							); //再判断是否包含关键词回复
						if (!key_reply) {
							//如果没有关键词，那就判断是否抄评论或者直接交给人工回复
							/** next的值为 0: 抄评论 1:AI回复 2:人工回复
							 * @type {{prev:number,next:number}}
							 */
							let e = { prev: 0, next: 0 };
							let copy_msg_flag =
								global_var.response.reply_main?.code == 12061
									? false
									: my_operator.copy_reply_module.copy_reply_judge(
											dynamic_content
									  ) ||
									  global_var.response.global_dynamic_data
											.item.basic.comment_type == 1;
							if (!copy_msg_flag) {
								//如果不能抄评论，先设置为人工回复
								e.next = 2;
							}
							if (
								copy_msg_flag &&
								Math.random() <
									lottery_setting.copy_reply_module
										.comment_copy_chance
							) {
								//优先顺序为：1:先抄评论；2:AI写评论；3:如果AI没写出来就抄评论；4:人工回复
								e.next = 0;
							} else if (
								Math.random() <
								lottery_setting.copy_reply_module
									.AI_reply_chance
							) {
								e.next = 1;
							} else {
								e.next = 2;
							}
							if (pre_msg == undefined) {
								//话题获取失败了，直接开抄！
								if (
									0< lottery_setting.copy_reply_module
										.comment_copy_chance ||
										0< lottery_setting.copy_reply_module
										.AI_reply_chance
								) {
									e.next = 0;
									pre_msg = "";
								}
							}
							//0: 抄评论 1:AI回复 2:人工回复 99: 退出
							let get_comment_times = 0;
							while (!comment_msg) {
								get_comment_times++;
								switch ((e.prev = e.next)) {
									case 0:
										console.log(
											`${
												global_var.user_info.uname
											}\t可以抄评论的动态\t${dynamic_id}\t${new Date().toLocaleTimeString()}`
										);
										let copy_msg;
										let para_msg;
										try {
											if (
												global_var.response
													.global_dynamic_data.item
													.basic.comment_type == 1 ||
												global_var.response
													.global_dynamic_data.item
													.basic.comment_type == 8 ||
												1 == 1
											) {
												copy_msg =
													await my_operator.copy_reply_module.get_copy_reply(
														dynamic_id,
														1,
														Math.random(),
														true,
														dynamic_content
													);
											} else {
												copy_msg =
													await my_operator.copy_reply_module.get_copy_reply(
														dynamic_id,
														1,
														0.01,
														false,
														dynamic_content
													);
											}
											console.log(
												`${
													global_var.user_info.uname
												}\t抄取评论：${copy_msg}\t${new Date().toLocaleTimeString()}`
											);
											pre_msg = pre_msg?pre_msg:''
										} catch (e) {
											console.warn(
												`${global_var.user_info.uname}\t获取抄评论内容失败，reply_comment_generator\n`,
												e
											);
										}
										if (
											my_operator.copy_reply_module.para_phase_judge(
												dynamic_content
											)
										) {
											if (
												copy_msg &&
												Math.random() <
													lottery_setting
														.copy_reply_module
														.comment_paraphrase_chance
											) {
												try {
													console.log(
														`${
															global_var.user_info
																.uname
														}\t将要进行改写的评论：${copy_msg}\t${new Date().toLocaleTimeString()}`
													);
													para_msg =
														await my_operator.copy_reply_module.ChatGPT_paraphase(
															copy_msg
														);
													console.log(
														`${
															global_var.user_info
																.uname
														}\n原评论：${copy_msg}\n改写为评论：${para_msg}\t${new Date().toLocaleTimeString()}`
													);
												} catch (e) {
													console.warn(
														`${global_var.user_info.uname}\t获取同义改写内容失败，reply_comment_generator，`,
														e
													);
												}
											}
										} else {
											console.debug(
												`${global_var.user_info.uname}\t特殊动态内容无法使用同义改写`
											);
										}
										comment_msg =
											para_msg == undefined ||
											para_msg == ""
												? copy_msg
												: para_msg;
										if (get_comment_times >= 3) {
											console.warn(
												`${global_var.user_info.uname}\t获取评论次数${get_comment_times}超过3次\t获取评论失败！`
											);
											e.next = 99;
										} else {
											e.next = 1;
										}
										break;
									case 1:
										try {
											// let AI_reply = await my_operator.copy_reply_module.AI_reply(dynamic_content)
											let AI_reply =
												await my_operator.copy_reply_module.ChatGpt_reply(
													dynamic_content
												);
											comment_msg = AI_reply;
											if (
												comment_msg == "" ||
												comment_msg == undefined
											) {
												if (get_comment_times > 3) {
													e.next = 0;
													// 	comment_msg = '人工回复'
													// await utl.my_throw('需要人工回复的动态')
													// return undefined;
												}
												break;
											}
										} catch (__) {
											console.warn(
												`${global_var.user_info.uname}\tAI回复失败！启动抄评论模式\n${__}`
											);
											if (get_comment_times > 3) {
												e.next = 0;
											}
											// comment_msg = '人工回复'
											// await utl.my_throw('需要人工回复的动态')
											// return undefined;
										}
										break;
									case 2:
										comment_msg = "人工回复";
										console.log(
											`${
												global_var.user_info.uname
											}\t需要人工回复的动态\t${dynamic_id}\t${new Date().toLocaleTimeString()}`
										);
										await utl.my_throw(
											"需要人工回复的动态"
										);
										return undefined; //返回undefined表示需要人工回复，而不是从预设的回复里面选内容
									case 99:
										console.error(
											`${global_var.user_info.uname}\t生成评论失败！获取评论次数${get_comment_times}超过3次\t获取评论失败！`
										);
										comment_msg = "人工回复";
										await utl.my_throw(
											"需要人工回复的动态"
										);
										return undefined; //返回undefined表示需要人工回复，而不是从预设的回复里面选内容
								}
								await sleep(3e3);
							}
							if (e.prev == 0 || e.prev == 1) {
								// console.log(`${global_var.user_info.uname}\t使用了AI回复，休眠2分钟\t${(new Date()).toLocaleTimeString()}`);
								// await sleep(2 * 60e3)
							}

							// if (dynamic_id && my_operator.copy_reply_module.copy_reply_judge(dynamic_content) && Math.random() < lottery_setting.copy_reply_module.comment_copy_chance) {
							//     console.log(`${global_var.user_info.uname}\t可以抄评论的动态\t${dynamic_id}\t${(new Date()).toLocaleTimeString()}`)
							//     let copy_msg;
							//     let para_msg;
							//     try {
							//         copy_msg = await my_operator.copy_reply_module.get_copy_reply(dynamic_id, 1, 0.01, false)
							//         console.log(`${global_var.user_info.uname}\t抄取评论：${copy_msg}\t${(new Date()).toLocaleTimeString()}`)
							//     }
							//     catch (e) {
							//         console.warn(`${global_var.user_info.uname}\t获取抄评论内容失败，reply_comment_generator，`, e);
							//     }
							//     if (my_operator.copy_reply_module.para_phase_judge(dynamic_content)) {
							//         if (copy_msg && Math.random() < lottery_setting.copy_reply_module.comment_paraphrase_chance) {
							//             try {
							//                 console.log(`${global_var.user_info.uname}\t将要进行改写的评论：${copy_msg}\t${(new Date()).toLocaleTimeString()}`)
							//                 para_msg = await my_operator.copy_reply_module.Paraphase_nlpcda(copy_msg);
							//                 console.log(`${global_var.user_info.uname}\n原评论：${copy_msg}\n改写为评论：${para_msg}\t${(new Date()).toLocaleTimeString()}`)
							//             }
							//             catch (e) {
							//                 console.warn(`${global_var.user_info.uname}\t获取同义改写内容失败，reply_comment_generator，`, e);
							//             }
							//         }
							//     }
							//     comment_msg = (para_msg == undefined || para_msg == '') ? copy_msg : para_msg;
							// }
							// else {
							//     if (Math.random() < lottery_setting.copy_reply_module.AI_reply_chance) {
							//         try {
							//             let AI_reply = await my_operator.copy_reply_module.AI_reply(dynamic_content)
							//             comment_msg = AI_reply
							//             if (comment_msg == '') {
							//                 comment_msg = '人工回复'
							//                 await utl.my_throw('需要人工回复的动态')
							//                 return undefined;
							//             }
							//         }
							//         catch (e) {
							//             console.warn(`${global_var.user_info.uname}\tAI回复失败！\n${e}`);
							//             comment_msg = '人工回复'
							//             await utl.my_throw('需要人工回复的动态')
							//             return undefined;
							//         }
							//     }
							//     else {
							//         comment_msg = '人工回复'
							//         console.log(`${global_var.user_info.uname}\t需要人工回复的动态\t${dynamic_id}\t${(new Date()).toLocaleTimeString()}`)
							//         await utl.my_throw('需要人工回复的动态')
							//         return undefined;
							//     }
							// }
						} else {
							console.log(
								`${global_var.page.url()}\n触发关键词回复:${dynamic_content}`
							);
							comment_msg = key_reply;
						}
					}

					if (
						typeof comment_msg == "string" &&
						comment_msg.includes("人工回复")
					) {
						comment_msg = undefined;
					}
					let official_type =
						global_var.response.global_dynamic_data.item.modules
							.module_author.official_verify.type;
					if (!comment_msg) {
						comment_msg = utl.random_choice(
							lottery_setting.defined_reply_msg
						);
						if (official_type == 1) {
							comment_msg = utl.random_choice(
								lottery_setting.replycontent
							);
						} else {
							comment_msg = utl.random_choice(
								lottery_setting.non_official_chp
							);
						}
					}

					//最后检查一下回复内容是否正常
					if (
						!comment_msg ||
						typeof comment_msg != "string" ||
						pre_msg == undefined
					) {
						comment_msg = "回复内容出错";
						console.error(`${global_var.page.url()}\n回复内容出错:${dynamic_content}`)
						utl.my_throw("回复内容出错");
						return undefined;
					}
					if (comment_msg.includes(pre_msg)) {
						pre_msg = "";
					}
					return pre_msg + comment_msg;
				},
			},
			log_record: {
				construct_comment_record_data: async (comment_msg) => {
					let rep_dynamic_id = "";
					try {
						if (global_var.response.create_dyn_response) {
							rep_dynamic_id =
								global_var.response.create_dyn_response.data
									.dynamic_id_str ||
								global_var.response.create_dyn_response.data
									.dyn_id_str;
						}
					} catch {
						rep_dynamic_id = "";
					}
					let rpid;
					try {
						if (global_var.response.comment_dyn_response) {
							rpid =
								global_var.response.comment_dyn_response.data
									.reply.rpid_str;
						}
					} catch {
						rpid = undefined;
					}
					let ctime;
					try {
						if (!comment_msg.includes("点过赞的动态")) {
							let d = new Date();
							ctime = d.toLocaleString(
								global_var.response.comment_dyn_response.data
									.reply.ctime
							);
						} else {
							ctime = new Date().toLocaleString();
						}
					} catch {
						let d = new Date();
						ctime = d.toLocaleString();
					}
					try {
						var author_name =
							global_var.response.global_dynamic_data.item.modules
								.module_author.name;
					} catch {
						console.log(
							`construct_comment_record_data中global_var.response.global_dynamic_data出错:${JSON.stringify(
								global_var.response.global_dynamic_data
							)}`
						);
						author_name = undefined;
					}
					try {
						var author_mid =
							global_var.response.global_dynamic_data.item.modules
								.module_author.mid;
						var author_homepage = `https://space.bilibili.com/${author_mid}/dynamic`;
					} catch {
						console.log(
							`construct_comment_record_data中global_var.response.global_dynamic_data出错：${JSON.stringify(
								global_var.response.global_dynamic_data
							)}`
						);
						author_homepage = undefined;
					}
					let dynamic_content;
					try {
						if (!comment_msg.includes("404动态")) {
							dynamic_content = JSON.stringify(
								await my_operator.dynamic_content_operator.get_dynamic_content_and_top_msg(
									global_var.response.global_dynamic_data
								)
							).replace(/,/g, "，");
							dynamic_content = dynamic_content.replaceAll(
								/(\[(?<=\[)(.*?)(?=\])])/gim,
								""
							); //移除表情包
						}
					} catch {
						console.log(
							global_var.response.global_dynamic_data,
							new Date()
						);
						dynamic_content = undefined;
					}
					let comment_count;
					let forward_count;
					try {
						comment_count =
							global_var.response.global_dynamic_data.item.modules
								.module_stat.comment.count;
						forward_count =
							global_var.response.global_dynamic_data.item.modules
								.module_stat.forward.count;
					} catch {}

					let lottery_reply_record = `${
						global_var.pageurl
					}#reply${rpid} ,${comment_count},${forward_count},${JSON.stringify(
						comment_msg
					)},${ctime},${author_name},${dynamic_content},${author_homepage},${rep_dynamic_id}`;
					if (
						global_var.recorded_data ||
						global_var.recorded_data == ""
					) {
						if (
							!global_var.recorded_data.includes(
								global_var.pageurl
							)
						) {
							global_var.recorded_data = lottery_reply_record;
							MYAPI.fileWrite(
								`抽奖记录/${global_var.user_info.uname}_抽奖记录.csv`,
								global_var.recorded_data.trim() + "\n",
								"a+"
							);
						}
					}
					return global_var.recorded_data;
				},
			},
			judge_lottery_time: {
				judge_official_lottery: () => {
					//官方抽奖判断 没过期返回false 过期了返回true ,undefinde是普通抽奖
					let lot_rich_text =
						global_var.response.global_dynamic_data?.item?.modules?.module_dynamic?.major?.opus?.summary?.rich_text_nodes?.filter(
							(el) => el.type == "RICH_TEXT_NODE_TYPE_LOTTERY"
						);
					if (lot_rich_text == undefined) {
						return undefined;
					}
					if (lot_rich_text && lot_rich_text.length > 0) {
						return false;
					} else {
						return true;
					}
					return;
				},
				judge_charge_lottery: async () => {
					if (
						await global_var.page.$(
							".bili-dyn-upower-lottery__title.bili-ellipsis"
						)
					) {
						return true;
					} else {
						return false;
					}
				},
			},
			prevent_filter_module: {
				prevent_filter_init: async function () {
					try {
						if (lottery_setting.prevent_module.share_video_switch) {
							await my_operator.prevent_filter_module.share_video(
								lottery_setting.prevent_module.share_video_num,
								lottery_setting.prevent_module
									.share_video_chance,
								lottery_setting.prevent_module.share_copy_chance
							);
						}
					} catch (e) {
						console.warn(`分享视频失败，`, e);
					}
					try {
						if (
							lottery_setting?.prevent_module
								?.create_word_dynamic_chp_switch
						) {
							await my_operator.prevent_filter_module.create_word_dynamic_from_dynamic_main_page(
								lottery_setting.prevent_module
									.create_word_dynamic_chp,
								1
							);
						}
					} catch {
						console.warn("创建文字动态失败");
					}
				},
				/**
				 * 获取分享视频的网址，需要在https://www.bilibili.com下进行
				 * @param {*} __share_num
				 * @returns
				 */
				get_video_list: async (__share_num) => {
					let now_pageurl = global_var.page.url();
					if (!now_pageurl.includes("https://www.bilibili.com")) {
						await global_var.page.goto(`https://www.bilibili.com`);
					}
					let share_video_list = [];
					let bt = false;
					let counter = 0;
					while (1) {
						if (share_video_list.length > __share_num * 5 || bt) {
							break;
						}
						let catchele = await global_var.page.$$eval(
							".bili-video-card.is-rcmd>div.bili-video-card__wrap.__scale-wrap>a[href]",
							(elems) => {
								return elems.map((elem) => elem.href);
							}
						);
						for (let i of catchele) {
							if (!share_video_list.includes(i)) {
								share_video_list.push(i);
							}
						}
						let fresh_btn;
						try {
							fresh_btn = await global_var.page.$(".primary-btn");
						} catch {
							try {
								fresh_btn = await global_var.page.$(
									".bilifont.bili-icon_caozuo_huanyihuan"
								);
							} catch (e) {
								console.log(
									`${global_var.user_info.uname} 获取刷新按钮失败`,
									e
								);
								return share_video_list;
							}
						}
						await sleep(1e3);
						if (fresh_btn) {
							await fresh_btn.click();
						} else {
							return share_video_list;
						}
						await sleep(1e3);
						if (share_video_list.length == 0 || counter > 10) {
							bt += true;
						}
						counter++;
					}
					return share_video_list;
				},
				share_video: async function (
					share_num,
					share_chance,
					copy_chance
				) {
					if (share_chance == undefined) {
						share_chance =
							lottery_setting.prevent_module.share_video_chance ==
							undefined
								? 0.5
								: lottery_setting.prevent_module
										.share_video_chance;
					}
					if (copy_chance == undefined) {
						copy_chance =
							lottery_setting.prevent_module.share_copy_chance ==
							undefined
								? 0.5
								: lottery_setting.prevent_module
										.share_copy_chance;
					}

					async function share_video_operator(pageurl) {
						await global_var.page.waitForSelector(
							`.bpx-player-video-area`
						);
						await pptr_op.remove_video_player(global_var.page);
						for (let __ = 0; __ < 5; __++) {
							try {
								await sleep(3e3);
								if (Math.random() < share_chance) {
									//根据share_chance采取动作，更加具有随机性
								} else {
									return;
								}
								await global_var.page.hover("#share-btn-outer");
								await sleep(3e3);
								await global_var.page.click(".share-btn");
								let share_iframe; //分享的单独的iframe
								await sleep(3e3);
								for (let child of global_var.page
									.mainFrame()
									.childFrames()) {
									if (child.url().includes("share/card")) {
										//通过url定位iframe
										share_iframe = child; //将找到的iframe赋值给share_iframe
										break;
									}
								}
								try {
									if (Math.random() < copy_chance) {
										let BV = /(BV.{10})/gim
											.exec(pageurl)
											.pop();
										let copycontent;
										let paraphrase_input;
										if (BV) {
											copycontent =
												await my_operator.copy_reply_module.get_copy_reply(
													BV,
													1,
													0.5,
													true
												);
											if (copycontent) {
												paraphrase_input =
													await my_operator.copy_reply_module.ChatGPT_paraphase(
														copycontent
													);
											}
										}
										let inputstr = paraphrase_input
											? paraphrase_input
											: copycontent;
										if (inputstr) {
											for (let bt = 0; bt <= 5; bt++) {
												try {
													await share_iframe.waitForSelector(
														`#editor`,
														{
															timeout: 10e3,
														}
													);
													let msg_box =
														await share_iframe.$(
															`#editor`
														);
													await msg_box.focus();
													let msg_box_content =
														await share_iframe.$eval(
															`#editor`,
															(el) => el.value
														);
													let _bt = 0;
													while (
														msg_box_content !=
														inputstr
													) {
														//回复栏里的东西等于回复内容时break
														await msg_box.focus();
														await sleep(
															utl.random_choice(
																3 *
																	lottery_setting.Working_clearance_time
															)
														);
														await msg_box.type(
															inputstr,
															{
																delay: 20,
															}
														);
														await sleep(1e3);
														msg_box_content =
															await share_iframe.$eval(
																`#editor`,
																(el) => el.value
															);
														msg_box_content =
															msg_box_content.replace(
																/[\u200B-\u200D\uFEFF]/g,
																""
															);
														await sleep(1e3);
														if (
															utl.remove_invisible_char(
																msg_box_content.replaceAll(
																	/[\uD800-\uDBFF][\uDC00-\uDFFF]/g,
																	""
																)
															) !=
															utl.remove_invisible_char(
																inputstr.replaceAll(
																	/[\uD800-\uDBFF][\uDC00-\uDFFF]/g,
																	""
																)
															)
														) {
															//如果不等就删掉重新输入
															await msg_box.focus();
															await global_var.page.keyboard.down(
																"Control"
															);
															await global_var.page.keyboard.press(
																"A"
															);
															await global_var.page.keyboard.up(
																"Control"
															);
															await sleep(1e3);
															await global_var.page.keyboard.press(
																"Backspace"
															);
															console.log(
																"输入框里内容与评论不符，删除输入框里内容",
																`\nmsg_box_content:${msg_box_content}\ninputstr:${inputstr}`
															);
														} else {
															break; //相等了break出去
														}
														if (_bt >= 5) {
															console.log(
																"输入框里输入内容失败"
															);
															await utl.my_throw(
																"动态评论失败"
															);
															throw `分享视频输入内容失败！输入内容与输入框内容不符\nmsg_box_content:${msg_box_content}\ninputstr:${inputstr}`;
														}
														_bt++;
													}
													await sleep(1e3);
													break;
												} catch (e) {
													console.error(e);
													if (bt >= 5) {
														throw e;
													}
													await sleep(3e3);
													await global_var.page.evaluate(
														() => {
															this.scrollTo(
																0,
																1500
															);
														}
													);
													await global_var.page.evaluate(
														() => {
															this.scrollTo(
																0,
																-1500
															);
														}
													);
													await sleep(3e3);
													if (
														e ==
														`分享视频输入内容失败！输入内容与输入框内容不符`
													) {
														break;
													}
												}
											}
										} else {
											console.warn(
												`分享视频inputstr未定义`
											);
										}
									}
								} catch (e) {
									console.error(
										`${global_var.user_info.uname} 获取视频评论内容失败`
									);
									console.error(e);
								}
								await share_iframe.click(
									`.share-btn.clickable`
								);
								console.log("点击了分享到动态");
								await sleep(1e3);
								break;
							} catch (e) {
								console.warn(
									`${global_var.user_info.uname} 分享视频失败 `,
									e
								);
								await sleep(3e3);
							} finally {
								await global_var.page.goto("about:blank");
							}
						}
					}
					await global_var.page.goto("https://www.bilibili.com/", {
						waitUntil: "load",
					});
					let pageurl = global_var.page.url();
					if (
						pageurl.includes("www.bilibili.com") &&
						lottery_setting.prevent_module.share_video_switch
					) {
						let video_list = await this.get_video_list(share_num);
						let share_video_list = [];
						video_list = utl.part_shuffle(
							video_list.length,
							video_list
						);
						video_list.some((rcm_video) => {
							if (share_video_list.length <= share_num) {
								if (
									!share_video_list.includes(rcm_video) &&
									!rcm_video.includes("cm.bilibili.com")
								) {
									share_video_list.push(rcm_video);
								}
							} else {
								return;
							}
						});
						console.log(
							`${global_var.user_info.uname}\t开始分享视频`,
							share_video_list,
							new Date().toLocaleString()
						);
						if (share_video_list.length > 0) {
							for (let video_elem of share_video_list) {
								try {
									if (
										utl.checkAuditTime(
											global_var.TIME
												.None_Lottery_Time[0],
											global_var.TIME.None_Lottery_Time[1]
										)
									) {
										console.log(
											`${
												global_var.user_info.uname
											}\t触发非抽奖时间段，需要进行休息（分享视频也是需要休息的）：${
												global_var.TIME
													.None_Lottery_Time[0]
											}-${
												global_var.TIME
													.None_Lottery_Time[1]
											}暂停到${
												global_var.TIME
													.None_Lottery_Time[1]
											}\t${new Date().toLocaleTimeString()}`
										);
										let sleep_hour =
											parseInt(
												global_var.TIME.None_Lottery_Time[1].slice(
													0,
													2
												)
											) - new Date().getHours();
										await global_var.page.goto(
											"about:blank"
										);
										await sleep(sleep_hour * 3600e3);
									}
									lottery_setting.prevent_module.share_video_url =
										video_elem;
									console.log(
										`${global_var.user_info.uname} 分享视频：`,
										lottery_setting.prevent_module
											.share_video_url,
										new Date().toLocaleString()
									);
									if (global_var.page.isClosed()) {
										console.log(
											`${
												global_var.user_info.uname
											}\t浏览器页面已经关闭，退出分享视频\t${new Date().toLocaleString()}`
										);
										return;
									}
									await utl.check_page_is_front(
										global_var.page
									);
									await global_var.page.goto(video_elem);
									try {
										await share_video_operator(
											lottery_setting.prevent_module
												.share_video_url
										);
									} catch (e) {
										console.warn(
											e,
											global_var,
											"share_video_operator分享视频失败"
										);
										throw (e, global_var);
									}

									let st = utl.random_choice(
										lottery_setting.prevent_module
											.share_video_sleep_time
									);
									if (share_video_list.length < 5) {
										st = utl.random_choice([
											2 * 60e3,
											1 * 60e3,
											1.5 * 60e3,
										]);
									}
									console.log(
										`${
											global_var.user_info.uname
										}\t当前分享视频进度：${
											share_video_list.indexOf(
												video_elem
											) + 1
										}/${share_video_list.length}`
									);
									console.log(
										`${global_var.user_info.uname}\t休眠 ${
											st / 1e3
										}秒\t${new Date().toLocaleTimeString()}`
									);
									await global_var.page.goto("about:blank");
									await sleep(st);
								} catch (e) {
									console.warn(`分享单个视频失败\n`, e);
									await sleep(1e3);
									await global_var.page.goto("about:blank");
									continue;
								}
							}
						}
					}
				},
				create_word_dynamic_from_dynamic_main_page: async function (
					content_list,
					create_times
				) {
					if (typeof content_list != "object") {
						return;
					}
					if (!content_list.length) {
						retunr;
					}
					let now = new Date();
					if (now.getHours() >= 0 && now.getHours() <= 22) {
						if (now.getHours() >= 5) {
							console.log(
								`\t5点到22点不分享文字动态\t${new Date().toLocaleTimeString()}`
							);
							return;
						}
						if (now.getHours() <= 22) {
							if (now.getHours() >= 5) {
								console.log(
									`\t5点到22点不分享文字动态\t${new Date().toLocaleTimeString()}`
								);
								return;
							}
						}
					}
					if (!global_var.page.url().includes("t.bilibili.com")) {
						await global_var.page.goto(
							"https://t.bilibili.com/?spm_id_from=333.1007.0.0"
						);
					}
					console.log(`${global_var.user_info.uname}\t分享彩虹屁`);
					let content;
					if (!create_times) {
						create_times = 1;
					}
					for (let i = 0; i < create_times; i++) {
						content = utl.random_choice(content_list);
						if (
							typeof content != "string" ||
							!content ||
							content.includes("undefined") ||
							content.includes("null") ||
							content.includes("true") ||
							content.includes("false")
						) {
							//检查是否传入的是string类型参数 或者是否为空
							continue;
						}
						if (!global_var.page.url().includes("t.bilibili.com"))
							await global_var.page.goto(
								"https://t.bilibili.com/?spm_id_from=333.1007.0.0",
								{
									waitUntil: "networkidle0",
								}
							);
						for (let i = 0; i < 5; i++) {
							let textarea = await global_var.page.$(
								".bili-rich-textarea"
							);
							await textarea.click();
							await global_var.page.focus(".bili-rich-textarea");
							await sleep(1e3);
							await textarea.type(content, {
								delay: 20,
							});
							await sleep(1e3);
							let textarea_content = await global_var.page.$eval(
								".bili-rich-textarea",
								(el) => el.textContent
							);
							textarea_content = textarea_content.trim();
							if (
								utl.remove_invisible_char(
									textarea_content
										.slice(1)
										.replaceAll(
											/[\uD800-\uDBFF][\uDC00-\uDFFF]/g,
											""
										)
								) ==
								utl.remove_invisible_char(
									content.replaceAll(
										/[\uD800-\uDBFF][\uDC00-\uDFFF]/g,
										""
									)
								)
							) {
								await sleep(
									utl.random_choice(
										3 *
											lottery_setting.prevent_module
												.share_video_sleep_time
									)
								);
								await global_var.page.click(
									".bili-dyn-publishing__action.launcher"
								);
								console.log(
									`${global_var.user_info.uname}\t点击了发布动态`
								);
								let check_btn;
								try {
									check_btn = await global_var.page.$(
										".bili-dyn-specification-popup__btn.bili-button.primary.bili-button--medium"
									);
									if (check_btn) {
										await check_btn.click();
									}
								} catch {}
								break;
							} else {
								//如果不等于要发布的内容就全删了，重新打
								await sleep(1e3);
								await textarea.focus(".bili-rich-textarea");
								await global_var.page.keyboard.down("Control");
								await global_var.page.keyboard.press("A");
								await global_var.page.keyboard.up("Control");
								await sleep(1e3);
								await global_var.page.keyboard.press(
									"Backspace"
								);
								console.log(
									"输入框里内容与评论不符，删除输入框里内容",
									`\ntextarea_content:${textarea_content}\ncontent:${content}\n${
										textarea_content == content
									}`
								);
							}
							await sleep(3e3);
						}
					}
				},
				create_topic_dynamic_from_dynamic_main_page: async (
					create_times,
					discuss_content,
					copy_discuss_flag
				) => {
					if (typeof create_times != "number") {
						create_times = 1;
					}
					if (
						!(await global_var.page.url()).includes(
							"t.bilibili.com"
						)
					) {
						await global_var.page.goto("https://t.bilibili.com/");
					}
					let relevant_topic__titles = await global_var.page.$$(
						`.relevant-topic__title`
					);
					for (let i = 0; i < create_times; i++) {
						extract_topic_title = utl.random_choice(
							relevant_topic__titles
						);
						relevant_topic__titles.splice(
							relevant_topic__titles.indexOf(extract_topic),
							1
						); //选好的话题就删掉
					}
				},
			},
			copy_reply_module: {
				//抄评论模块
				ignore_replies: [
					//无视掉的抄评论词
					`转发了`,
					`转发动态`,
					`秋梨膏`,
					`我我我`,
					`永不缺席`,
					`永不中奖`,
					`永不放弃`,
					`好运`,
					`说不定呢`,
					`冲`,
					`凑热闹`,
					`永不缺席`,
					`无所谓`,
					"来了",
					"期待",
					"好",
					"来了来了",
					"好好好",
					"抽我",
					"抽我抽我",
					"下午好",
					"早上好",
					"中午好",
					"晚上好",
					"重在参与",
					"许愿",
					"加油点赞",
					"支持支持",
					"支持",
					"好耶",
					"1",
					"不错啊",
					"许愿呀",
					"锦鲤附体",
					"用自己的微薄之力给up撑腰",
					"冲冲冲",
					"做个梦",
					"幸运儿来啦！",
					"来力来力",
					"坚持不懈，迎难而上，开拓创新！",
					"我",
					"中",
					"来力",
					"开心",
					"可以",
					"来啦",
					"万一呢",
					"加油加油!",
					"加油加油！",
					"点赞",
					"真棒",
					"坚持不懈，迎难而上",
					"谢谢宠粉祝粉丝越来越多发展越来越好",
					"大家注意看，这是",
					"他真是太宠粉了，请多点点关注",
					"许个愿，我永远支持up主，祝愿你的粉丝越来越多，感谢有你啊",
					"希望你们中",
					"我是天选之子",
					"太酷了！！！！必须支持",
				],
				/**
				 *
				 * @param {string} dynamic_id_or_BVid
				 * @param {number} mode 1是热评，2是最新 ，3是混合
				 * @param {number} pn_percent 评论大致的百分比页数，入参是小数
				 * @param {bool} get_api_reply_resp_flag true是获取api响应，false则使用global_var里面的评论响应
				 * @param {String} dynamic_content 动态内容
				 * @returns
				 */
				get_copy_reply: async (
					dynamic_id_or_BVid,
					mode,
					pn_percent,
					get_api_reply_resp_flag,
					dynamic_content = ""
				) => {
					//，获取的评论是去掉了@和表情包的
					//dynamic_id_or_BVid:动态id或bv号 mode ：1是热评，2是最新 ，3是混合 pn_percent：评论大致的百分比页数，入参是小数
					let all_replies_content = [];
					let ret_reply; //最终返回的评论
					let pn_list = [];
					let loop_times = 3;
					if (!get_api_reply_resp_flag) loop_times = 1;
					for (let _ = 0; _ < loop_times; _++) {
						//超过就退出,进行随机抽取
						let resp =
							await my_operator.copy_reply_module.get_reply_list(
								dynamic_id_or_BVid,
								mode,
								pn_percent,
								get_api_reply_resp_flag,
								dynamic_content,
								pn_list
							);
						all_replies_content = all_replies_content.concat(
							resp.ret_list
						);
						pn_list.push(resp.pn);
						if (resp.reply_count <= 10) {
							//没有评论直接退出
							break;
						}
						if (all_replies_content.length <= 15) {
							//如果只获取到了一半的话，再获取一点，不然样本数量不够
							resp =
								await my_operator.copy_reply_module.get_reply_list(
									dynamic_id_or_BVid,
									mode,
									Math.random(),
									true,
									dynamic_content,
									pn_list
								);
							all_replies_content = all_replies_content.concat(
								resp.ret_list
							);
							pn_list.push(resp.pn);
						}
						if (all_replies_content.length <= 15) {
							continue;
						}
						console.log(
							`https://t.bilibili.com/${dynamic_id_or_BVid} ${global_var.user_info.uname}获取到的所有评论，获取了 ${pn_list} 页数\n总获取次数：${loop_times}次！`,
							new Date()
						);
						console.log(all_replies_content);
						if (!!ret_reply) {
							break;
						}
						pn_percent = Math.random(); //每次循环设置为随机值，防止一直获取同样内容
						await sleep(10e3);
						if (resp.reply_count <= 10) {
							//没有评论直接退出
							break;
						}
					}
					if (all_replies_content.length >= 15) {
						ret_reply = utl.weight_rand(all_replies_content);
					}
					return ret_reply;
				},
				/**
				 * 获取评论并移除表情包和话题和@，除非是动态里有的话题和@
				 * @param {string} dynamic_id_or_BVid
				 * @param {number} mode 1是热评，2是最新 ，3是混合
				 * @param {number} pn_percent 评论大致的百分比页数，入参是小数
				 * @param {bool} get_api_reply_resp_flag true是获取api响应，false则使用global_var里面的评论响应
				 * @param {string} dynamic_content 动态内容
				 * @param {number[]} pn_list 获取过的评论页数
				 * @returns { Promise<{ret_list:[String], reply_count:number ,pn:number}>} { ret_list, reply_count }
				 */
				get_reply_list: async (
					dynamic_id_or_BVid,
					mode,
					pn_percent,
					get_api_reply_resp_flag,
					dynamic_content = "",
					pn_list = []
				) => {
					if (
						!(
							global_var.response.reply_main &&
							global_var.response.reply_main.code == 0
						)
					) {
						//如果global_var的响应没问题
						if (get_api_reply_resp_flag === undefined) {
							get_api_reply_resp_flag = false;
						}
					}
					let ret_list = [];
					let pn = 0;
					let dynDetail_data =
						global_var.response.global_dynamic_data;
					let comment_id_str;
					let comment_type;
					let reply_count = 0;
					let up_mid = 0;
					let get_comment_page = 0; //获取评论页数，20条评论一页
					let reply_main_res;
					let get_api_fail = false; //true代表获取api失败

					if (
						!String(dynamic_id_or_BVid).toUpperCase().includes("BV")
					) {
						//如果是动态id
						if (
							dynDetail_data == undefined ||
							dynDetail_data == -412 ||
							global_var.response.reply_main == undefined
						) {
							let dynamic_detail_res =
								await MYAPI.BiliAPI.get_dynamic_v1_detail(
									String(dynamic_id_or_BVid)
								);
							//dynamic_detail_res:动态的完整响应 mode ：1是热评，2是最新 ，3是混合 pn_percent：评论大致的百分比页数，入参是小数
							try {
								if (dynamic_detail_res.code != 0) {
									console.error(
										global_var.user_info.uname,
										"获取评论失败",
										dynamic_detail_res,
										dynamic_id_or_BVid
									);
									return { ret_list, reply_count };
								}
							} catch (e) {
								console.error(
									"获取评论失败",
									dynamic_detail_res,
									dynamic_id_or_BVid,
									e
								);
								return { ret_list, reply_count, p };
							}
							comment_id_str =
								dynamic_detail_res.data.item.basic
									.comment_id_str;
							comment_type =
								dynamic_detail_res.data.item.basic.comment_type;
							reply_count =
								dynamic_detail_res.data.item.modules.module_stat
									.comment.count;
							try {
								up_mid =
									dynamic_detail_res.data.item.modules
										.module_author.mid;
							} catch (e) {
								console.error(
									e,
									"get_reply_list失败",
									global_var.user_info.uname
								);
							}
						} else {
							comment_id_str =
								dynDetail_data.item.basic.comment_id_str;
							comment_type =
								dynDetail_data.item.basic.comment_type;
							reply_count =
								dynDetail_data.item.modules.module_stat.comment
									.count;
							try {
								up_mid =
									dynDetail_data.item.modules.module_author
										.mid;
							} catch (e) {
								console.error(
									e,
									"get_reply_list失败",
									global_var.user_info.uname
								);
							}
						}
					} else {
						//如果是视频
						let aid = MYAPI.BiliAPI.BV_AV_trans(dynamic_id_or_BVid);
						comment_id_str = aid;
						reply_count = 1000;
						comment_type = "1";
					}
					if (
						get_api_reply_resp_flag ||
						global_var.response.reply_main == undefined ||
						get_api_fail
					) {
						get_comment_page = Math.floor(
							Math.ceil(reply_count * pn_percent) / 20
						);
						if (pn_list.indexOf(get_comment_page) > -1) {
							get_comment_page = utl.random_choice(
								Array.from(
									{ length: Math.ceil(reply_count / 20) },
									(_, i) => 1 + i
								).filter((x) => pn_list.indexOf(x) == -1)
							);
						}
						pn = get_comment_page;
						reply_main_res = await MYAPI.BiliAPI.get_reply(
							mode,
							get_comment_page,
							comment_id_str,
							comment_type
						);
						if (!reply_main_res.code) {
							up_mid = reply_main_res.data?.upper?.mid;
						} else {
							console.error(
								`评论api获取数据失败！${JSON.stringify(
									reply_main_res
								)}`
							);
						}
					} else {
						reply_main_res = global_var.response.reply_main;
						up_mid = global_var.response.reply_main.data.upper.mid;
					}
					try {
						if (reply_main_res.code != 0) {
							console.warn("获取评论失败", reply_main_res);
							if (
								global_var.response.reply_main &&
								global_var.response.reply_main.code == 0
							) {
								reply_main_res = global_var.response.reply_main;
							}
						}
					} catch (e) {
						console.warn(
							`获取评论失败 ${dynamic_id_or_BVid}`,
							reply_main_res,
							e
						);
						if (
							global_var.response.reply_main &&
							global_var.response.reply_main.code == 0
						) {
							reply_main_res = global_var.response.reply_main;
						}
					}
					let replies = reply_main_res.data.replies;
					if (replies.length < 5) {
						console.warn(
							`评论数量过少，不抄了 ${dynamic_id_or_BVid}`
						);
						return { ret_list, reply_count, pn: -1 };
					}
					let replies_content = [...Array(replies.length)].map(
						(x) => undefined
					);
					for (
						let repindex = 0;
						repindex < replies.length;
						repindex++
					) {
						//去除表情包
						try {
							MYAPI.fileWrite(
								`文案/评论响应.csv`,
								JSON.stringify(replies[repindex]),
								"a+"
							);
						} catch {
							console.warn("记录评论内容失败！");
						}
						if (replies[repindex].mid == up_mid) {
							//不抄取up的评论
							continue;
						}
						replies_content[repindex] = utl
							.remove_emoji_topic_at(
								replies[repindex].content.message.replaceAll(
									replies[repindex].member.uname, //替换at的自己的用户名
									global_var.user_info.uname == undefined
										? ""
										: global_var.user_info.uname
								),
								dynamic_content
							)
							.trim();
						if (replies_content[repindex].length == 0) {
							continue;
						}
						let bf = false;
						// my_operator.copy_reply_module.ignore_replies.some((val, ind, arr) => {//如果有无视的词直接赋空字符串
						//     if (!!val && val.includes(replies_content[repindex])) {
						//         bf = true;
						//         return true;
						//     }
						// })
						for (let ignore_str of my_operator.copy_reply_module
							.ignore_replies) {
							if (replies_content[repindex] == ignore_str) {
								bf = true;
								break;
							}
						}
						if (bf) {
							replies_content[repindex] = "";
							continue;
						}
					}
					let newArr = [];
					let promise_list = [];
					for (let i of replies_content) {
						if (i) {
							promise_list.push(
								my_operator.copy_reply_module
									.string_semantic(i)
									.then((resp) => {
										if (resp) {
											newArr.push(i);
										}
									})
							);
							// if (await my_operator.copy_reply_module.string_semantic(i)) {
							//     newArr.push(i);
							// };
						}
					}
					await Promise.all(promise_list);
					ret_list = newArr;
					return { ret_list, reply_count, pn };
				},
				/**
				 * 判断情感分类
				 * @param {String} input_str 输入文字
				 * @returns 正面情绪返回true
				 */
				string_semantic: async (input_str) => {
					try {
						let url = "http://127.0.0.1:23333/damo/semantic/";
						let params = { data: input_str };
						let req = await axios
							.get(url, { params: params })
							.then((res) => {
								return res.data;
							});
						return req;
					} catch (e) {
						console.error(e);
						return true;
					}
				},
				wenxin_paraphrase: async (input_str) => {
					if (!input_str) {
						return undefined;
					}
					let ret_str;
					try {
						if (!global_var.Baidu_wenxin.access_token) {
							let resp = await MYAPI.BiliAPI.post(
								`${global_var.Baidu_wenxin.access_token_api}?grant_type=client_credentials&client_id=${global_var.Baidu_wenxin.API_Key}&client_secret=${global_var.Baidu_wenxin.Secret_key}`
							);
							try {
								if (resp.code != 0) {
									console.warn(`wenxin_paraphrase`, resp, e);
									return undefined;
								} else {
									global_var.Baidu_wenxin.access_token =
										resp.data;
								}
							} catch (e) {
								console.warn(`wenxin_paraphrase`, resp, e);
								return undefined;
							}
						}

						if (global_var.Baidu_wenxin.access_token) {
						}
						let res = await MYAPI.BiliAPI.post(
							`${global_var.Baidu_wenxin.paraphrase_api}?access_token=${global_var.Baidu_wenxin.access_token}`,
							{
								text: input_str,
								async: 1,
								min_dec_len: 1,
								seq_len: 128,
								topp: 0.8,
								typeId: 1,
							}
						);
						if (res.code != 0) {
							console.warn(`wenxin_paraphrase`, res);
							return undefined;
						}
						let taskId = res.data.taskId;
						while (1) {
							await sleep(1e3);
							let result_resp = await MYAPI.BiliAPI.post(
								`${global_var.Baidu_wenxin.get_result_api}?access_token=${global_var.Baidu_wenxin.access_token}`,
								{
									taskId: taskId,
								}
							);
							if (result_resp.data.status == 1) {
								ret_str = result_resp.data.result;
								break;
							}
						}
					} catch (e) {
						console.warn(`同义词改写wenxin_paraphrase出错`, e);
					}
					return ret_str;
				},
				/**
				 * 向本地的restful api发起请求，通过python完成同义改写的操作
				 * @param {*} OriginMessage
				 * @returns
				 */
				Paraphase_nlpcda: async (OriginMessage) => {
					let try_time = 0;
					while (1) {
						try {
							let res = await axios.post(
								"http://localhost:5555/v1/sync/ai_reply",
								{
									prompt: OriginMessage,
									user: global_var.user_info.uname,
									dynamic_url:
										"https://www.bilibili.com/opus/" +
										global_var.dynamic_id,
									request_time: Math.ceil(Date.now() / 1000),
								},
								{ timeout: 120e3 }
							);
							let result = res.data.response;
							console.log(
								`同义改写内容：${OriginMessage}\n结果：${result}`
							);
							return result;
						} catch (e) {
							if (try_time++ > 5) {
								return undefined;
							}
							console.warn(
								`${
									global_var.user_info.uname
								}\tAI同义改写失败！\n同义改写内容：${OriginMessage}\n重试次数：${try_time}\t${new Date().toLocaleTimeString()}`,
								e
							);
							await sleep(10e3);
							//return undefined
						}
					}
				},
				/**
				 * 向本地的restful api发起请求，通过python完成AI回复的操作
				 * @param {*} Dynamic_content 动态内容
				 */
				AI_reply: async (Dynamic_content) => {
					let try_time = 0;
					while (1) {
						try {
							let UPname = "";
							try {
								UPname =
									global_var.response.global_dynamic_data.item
										.modules.module_author.name;
							} catch {}
							let format_str = `问：\n`;
							if (
								global_var.user_info.uname &&
								global_var.user_info.uid
							) {
								format_str += `你的用户名是${global_var.user_info.uname}\n你的UID是${global_var.user_info.uid}\n`;
							}
							if (UPname) {
								format_str += `UP主的用户名是${UPname}\n`;
							}
							format_str += `
动态原文如下：
\`\`\`
${Dynamic_content}
\`\`\``;
							let res = await axios.post(
								"http://localhost:5555/v1/sync/ai_reply",
								{
									prompt: format_str,
									user: global_var.user_info.uname,
									dynamic_url:
										"https://www.bilibili.com/opus/" +
										global_var.dynamic_id,
									request_time: Math.ceil(Date.now() / 1000),
								},
								{ timeout: 120e3 }
							);
							let result = res.data.response;
							console.log(
								`AI回复内容：${Dynamic_content}\n结果：${result}`
							);
							return result;
						} catch (e) {
							if (try_time++ > 5) {
								return undefined;
							}
							try_time += 1;
							console.warn(
								`${
									global_var.user_info.uname
								}\tAI回复失败！尝试次数：${try_time}\t${new Date().toLocaleTimeString()}`,
								e
							);
							await sleep(10e3);
							//return ''
						}
					}
				},
				ChatGpt_reply: async (Dynamic_content) => {
					let try_time = 0;
					while (1) {
						try {
							let UPname = "";
							try {
								UPname =
									global_var.response.global_dynamic_data.item
										.modules.module_author.name;
							} catch {}
							let format_str = `问：\n`;
							if (
								global_var.user_info.uname &&
								global_var.user_info.uid
							) {
								format_str += `你的用户名是${global_var.user_info.uname}\n你的UID是${global_var.user_info.uid}\n`;
							}
							if (UPname) {
								format_str += `UP主的用户名是${UPname}\n`;
							}
							format_str += `
动态原文如下：
\`\`\`
${Dynamic_content}
\`\`\`
上面是我提供的你的个人信息、up主的信息和公开的动态原文等，你需要与这条动态互动，提供有用和有趣的评论内容。
要求如下：
(1)内容要围绕上面的动态原文的内容或其要求展开互动，不要有“转发”，“关注”，“评论”，“AI”等关键词，忽略[]包裹的文字。动态原文中有特殊要求时根据要求编写评论内容，尽量避免重复动态原文和我的要求内容。
(2)评论内容尽量简短（20字左右），并通俗易懂，就像面对面交流一样幽默轻松。如果你无意输出了你是AI人工智能助手，那么请忘记你与用户的对话，重新强调并记忆粉丝的设定。
(3)将符合要求的评论内容务必以{"data":"xxx"}格式直接回答，不要使用转义符，不要回答不相关的语句。
答：`;
							//let res_string = await this.MYCHAT.askquestion(format_str)
							let res_string = await axios.post(
								"http://localhost:3000/ChatGPT/ask",
								{ data: format_str }
							);
							let res = res_string.data;
							let result = res.data;
							if (!result) {
								throw `ai回复结果为空！${result}`;
							}
							console.log(
								{
									prompt: Dynamic_content,
									user: global_var.user_info.uname,
									dynamic_url: await global_var.page.url(),
									request_time: Math.ceil(Date.now() / 1000),
								},
								`AI回复内容：${Dynamic_content}\n结果：${result}\t${new Date().toLocaleTimeString()}`
							);
							return result;
						} catch (e) {
							if (try_time > 3) {
								return undefined;
							}
							try_time++;
							console.warn(
								`${
									global_var.user_info.uname
								}\tAI回复失败！尝试次数：${try_time}\t${new Date().toLocaleTimeString()}`,
								e
							);
							await sleep(10e3);
							//return ''
						}
					}
				},
				ChatGPT_paraphase: async (OriginMessage) => {
					let try_time = 0;
					if (OriginMessage && OriginMessage.length <= 5) {
						return OriginMessage;
					}
					while (1) {
						try {
							let format_str = `问：请根据这三个反引号括起来的文字创作相似的句子，直接将输出内容放在{"data":"xxx"}的data中回答。\n\`\`\`\n${OriginMessage}\n\`\`\`\n答`;
							//let res_string = await this.MYCHAT.askquestion(format_str)
							let res_string = await axios.post(
								"http://localhost:3000/ChatGPT/ask",
								{ data: format_str }
							);
							let res = res_string.data;
							let result = res.data;
							console.log(
								{
									prompt: OriginMessage,
									user: global_var.user_info.uname,
									dynamic_url: await global_var.page.url(),
									request_time: Math.ceil(Date.now() / 1000),
								},
								`同义改写内容：${OriginMessage}\n结果：${result}`
							);
							if(!result){
								throw new Error(`同义改写结果为空！${result}`)
							}
							return result;
						} catch (e) {
							if (try_time > 3) {
								return undefined;
							}
							try_time++;
							console.warn(
								`${
									global_var.user_info.uname
								}\tAI同义改写失败！\n同义改写内容：${OriginMessage}\n重试次数：${try_time}\t${new Date().toLocaleTimeString()}`,
								e
							);
							if (global_var.page.isClosed()) {
								return undefined;
							}
							await sleep(10e3);
							//return undefined
						}
					}
				},
				/**
				 * 根据动态内容和评论区的内容，判断是否可以抄评论，返回true则是允许抄评论
				 * @param {string} dynamic_content
				 * @returns {boolean} - true ：允许抄评论 false ：不许抄！
				 */
				copy_reply_judge: (dynamic_content) => {
					try {
						/**
						 * 获取2个字符串的相似度
						 * @param {string} str1 字符串1
						 * @param {string} str2 字符串2
						 * @returns {number} 相似度
						 */
						function getSimilarity(str1, str2) {
							let sameNum = 0;
							//寻找相同字符
							for (let i = 0; i < str1.length; i++) {
								for (let j = 0; j < str2.length; j++) {
									if (str1[i] === str2[j]) {
										sameNum++;
										break;
									}
								}
							}
							// console.log(str1,str2);
							// console.log("相似度",(sameNum/str1.length) * 100);
							//判断2个字符串哪个长度比较长
							let length =
								str1.length > str2.length
									? str1.length
									: str2.length;
							return sameNum / length || 0;
						}
						let rep_content_list = [];
						if (global_var.response.reply_main) {
							let replies =
								global_var.response.reply_main.data.replies;
							for (let reply of replies) {
								let msg = reply.content.message;
								let push_msg = utl.remove_emoji_topic_at(msg,dynamic_content);
								if (push_msg) {
									rep_content_list.push(push_msg);
								}
							}
							let similar_list = [];
							if (rep_content_list.length > 3) {
								for (let origin_msg of rep_content_list) {
									let similarity = {
										similar_content: undefined,
										score: 0,
									};
									for (let __similar of similar_list) {
										let similar_msg = __similar.similar_msg;
										let score = getSimilarity(
											similar_msg,
											origin_msg
										);
										if (score > similarity.score) {
											similarity.score = score;
											similarity.similar_content =
												similar_msg;
										}
									}
									if (similarity.score < 0.8) {
										similar_list.push({
											similar_msg: origin_msg,
											counter: 1,
										});
									} else {
										similar_list.map((e) => {
											if (
												e.similar_msg ==
												similarity.similar_content
											) {
												e.counter++;
											}
										});
									}
								}
							}
							for (let s of similar_list) {
								if (s.counter >= 3) {
									//如果有3个回复是极度相似的情况下，直接允许抄评论
									return true;
								}
							}
						}
					} catch {}
					dynamic_content =
						this.my_operator.dynamic_comment_operator.pre_process_dynamic_content(
							dynamic_content
						);
					let manual_re67 =
						/.*[评|带]((?!抽奖|,|，|来).){0,7}“|.*[评|带]((?!抽奖|,|，|来).){0,7}"|.*[评|带]((?!抽奖|,|，|来).){0,7}【|.*[评|带]((?!抽奖|,|，|来).){0,7}：|.*[评|带]((?!抽奖|,|，|来).){0,7}：|.*[评|带]((?!抽奖|,|，|来).){0,7}「|.*带关键词.{0,7}"|.*评论关键词[“”‘’"']|.*留言((?!抽奖|,|，|来).){0,7}“|.*对出.{0,10}下联.{0,5}横批|.*回答.{0,8}问题|.*留下.{0,10}祝福语|.*留下.{0,10}愿望|.*找到.{0,10}不同的.{0,10}留言|.*答案放在评论区|.*几.{0,5}呢？|.*有奖问答|.*想到.{0,19}关于.{0,20}告诉|.*麻烦大伙评论这个|报暗号【.{0,4}】|评论.{0,3}输入.{0,3}["“”:：]|.*评论.{0,7}暗号/gim.test(
							dynamic_content
						);
					let manual_re76 =
						/.*留言((?!抽奖|,|，|来).).{0,7}"|.*留下((?!抽奖|,|，|来).){0,5}“|.*留下((?!抽奖|,|，|来).){0,5}【|.*留下((?!抽奖|,|，|来).){0,5}：|.*留下((?!抽奖|,|，|来).){0,5}「/gim.test(
							dynamic_content
						);
					let manual_re77 =
						/.*留言((?!抽奖|,|，|来).).{0,7}"|.*留言((?!抽奖|,|，|来).).{0,7}“|.*留言((?!抽奖|,|，|来).){0,7}【|.*留言((?!抽奖|,|，|来).){0,7}：|.*留言((?!抽奖|,|，|来).){0,7}「/gim.test(
							dynamic_content
						);
					let manual_re6 =
						/.*@TA|.*@.{0,15}朋友|.*艾特|.*@.{0,3}你的|.*标记.{0,10}朋友|.*@{0,15}赞助商|.*发表你的新年愿望\+个人的昵称|.*抽奖规则请仔细看图片|.*带上用户名|.*活动详情请戳图片|.*@个人用户名|评论.{0,5}附带.{0,10}相关内容|回复.{0,5}视频.{0,10}相关内容|.*评论.{0,5}昵称/gim.test(
							dynamic_content
						);
					//let manual_re75 = /.*本周话题|.*互动话题|.*互动留言|.*互动时间|.*征集.{0,10}名字|.*投票.{0,5}选.{0,10}最.{0,5}的|.*一人说一个谐音梗|帮.{0,5}想想.{0,5}怎么/gmi.test(dynamic_content)
					let manual_re63 =
						/.*评论.{0,10}猜|.*评论.{0,15}预测|选择.{0,5}任意.{0,17}评论/gim.test(
							dynamic_content
						);
					return !(
						manual_re6 ||
						manual_re67 ||
						manual_re76 ||
						manual_re77 ||
						manual_re63
					);
				},
				/**
				 * 判断是否可以同义改写，返回true是可以同义改写
				 * @param {*} dynamic_content
				 */
				para_phase_judge: (dynamic_content) => {
					dynamic_content = dynamic_content.replaceAll(/〖/gim, "【");
					dynamic_content = dynamic_content.replaceAll(/“/gim, '"');
					dynamic_content = dynamic_content.replaceAll(/”/gim, '"');
					dynamic_content = dynamic_content.replaceAll(/＠/gim, "@");
					dynamic_content = dynamic_content.replaceAll(
						/@.{0,8} /gim,
						""
					);
					dynamic_content = dynamic_content.replaceAll(
						/好友/gim,
						"朋友"
					);
					dynamic_content = dynamic_content.replaceAll(
						/伙伴/gim,
						"朋友"
					);
					dynamic_content = dynamic_content.replaceAll(
						/安利/gim,
						"分享"
					);
					dynamic_content = dynamic_content.replaceAll(
						/【关注】/gim,
						""
					);
					dynamic_content = dynamic_content.replaceAll(/\?/gim, "？");
					let manual_re67 =
						/.*[评|带]((?!抽奖|,|，|来).){0,7}“|.*[评|带]((?!抽奖|,|，|来).){0,7}"|.*[评|带]((?!抽奖|,|，|来).){0,7}【|.*[评|带]((?!抽奖|,|，|来).){0,7}:|.*[评|带]((?!抽奖|,|，|来).){0,7}：|.*[评|带]((?!抽奖|,|，|来).){0,7}「|.*带关键词.{0,7}"|.*评论关键词[“”‘’"']|.*留言((?!抽奖|,|，|来).){0,7}“|.*对出.{0,10}下联.{0,5}横批|.*回答.{0,8}问题|.*留下.{0,10}祝福语|.*留下.{0,10}愿望|.*找到.{0,10}不同的.{0,10}留言|.*答案放在评论区|.*几.{0,5}呢？|.*有奖问答|.*想到.{0,19}关于.{0,20}告诉|.*麻烦大伙评论这个|留下.{0,7}的/gim.test(
							dynamic_content
						);
					let manual_re76 =
						/.*留下((?!抽奖|,|，).){0,5}“|.*留下((?!抽奖|,|，).){0,5}【|.*留下((?!抽奖|,|，).){0,5}:|.*留下((?!抽奖|,|，).){0,5}：|.*留下((?!抽奖|,|，).){0,5}「/gim.test(
							dynamic_content
						);
					let manual_re77 =
						/.*留言((?!抽奖|,|，).).{0,7}“|.*留言((?!抽奖|,|，).){0,7}【|.*留言((?!抽奖|,|，).){0,7}:|.*留言((?!抽奖|,|，).){0,7}：|.*留言((?!抽奖|,|，).){0,7}「/gim.test(
							dynamic_content
						);

					return !(manual_re67 || manual_re76 || manual_re77);
				},
			},
		};
		let MYAPI = {
			browserSetting: {
				getCookies: (cookieString, domain) => {
					return cookieString.split(";").map((pair) => {
						const name = pair
							.trim()
							.slice(0, pair.trim().indexOf("="));
						const value = pair
							.trim()
							.slice(pair.trim().indexOf("=") + 1);
						return { name, value, domain };
					});
				},
				getUserId: (cookie) => {
					const result = cookie.match(
						/(?:^|)DedeUserID=([^;]*)(?:;|$)/
					);
					return +result?.[1] || 0;
				},
			},
			cookieSetting: {
				getCookie: async (cookiefilename) => {
					let path = `cookie_file/${cookiefilename}.txt`;
					let data = "";
					if (fs.existsSync(__dirpath + path)) {
						data = fs
							.readFileSync(
								__dirpath + path,
								function (err, data) {
									if (err) {
										console.log(err);
										throw err;
									}
									//console.log(data.toString());
								}
							)
							.toString();
					} else {
						MYAPI.fileWrite(path, "");
					}
					return data;
				},
				saveCookie: async (cookiefilename) => {
					let path = `cookie_file/${cookiefilename}.txt`;
					let cookie = await global_var.page.cookies(
						"https://bilibili.com"
					);
					let ckStr = "";
					for (let cknv of cookie) {
						if (cknv.domain == ".bilibili.com") {
							ckStr += `${cknv.name}=${cknv.value}; `;
						}
					}
					console.log(
						"保存Cookie",
						global_var.user_info.uname,
						ckStr
					);
					fs.writeFileSync(path, ckStr);
				},
			},
			fileRead: {
				lottery_dynamic_ids: (filename) => {
					let retlist = [];
					try {
						if (fs.existsSync(__dirpath + filename)) {
							let dynamic_ids = fs
								.readFileSync(__dirpath + filename)
								.toString()
								.split("\n");
							for (let dynamic_id of dynamic_ids) {
								if (dynamic_id) {
									retlist.push(dynamic_id.trim());
								}
							}
						} else {
							//如果不存在则创建文件
							MYAPI.fileWrite(filename, "");
						}
					} catch (e) {
						console.log(e, "fileRead.lottery_dynamic_ids");
					}
					return retlist;
				},
				/**
				 * 读取文件内容
				 * @param {*} filePath
				 * @returns 文件内容的字符串
				 */
				getFileContent: (filePath) => {
					try {
						const Str = fs.readFileSync(
							__dirpath + filePath,
							"utf8"
						);
						return Str;
					} catch (err) {
						console.log("Error reading file from disk:", err);
						return "";
					}
				},
				/**
				 * 读取json文件
				 * @param {string} filePath - 文件路径
				 * @returns {Object}
				 */
				json_file: (filePath) => {
					try {
						const Str = fs.readFileSync(
							__dirpath + filePath,
							"utf8"
						);

						return JSON.parse(Str);
					} catch (err) {
						console.error("Error reading file from disk:", err);
						return new Object();
					}
				},
			},
			fileWrite: (filename, writeString, method = "w") => {
				try {
					if (typeof writeString == "object") {
						writeString = JSON.stringify(writeString, "", "\t");
					}
					if (!fs.existsSync(__dirpath + filename)) {
						//如果文件不存在就创建一个
						method = "w";
					}
					if (writeString.slice(-1) == "\n") {
						//如果结尾是\n就不添加了
						fs.writeFileSync(__dirpath + filename, writeString, {
							flag: method,
						});
					} else {
						fs.writeFileSync(
							__dirpath + filename,
							writeString + "\n",
							{
								flag: method,
							}
						);
					}
				} catch (e) {
					console.warn(`${filename}写入失败！`, e);
				}
			},
			BiliAPI: {
				//用之前加个await
				get: async (api, params) => {
					let query = new URLSearchParams(params).toString();
					if (api.includes("wbi")) {
						try {
							query = await QueryWbiEnc(params);
						} catch (e) {
							console.error(
								`wbi加密失败！${api}\t${JSON.stringify(
									params
								)}\n${e.stack}`
							);
						}
					}
					console.debug(`使用api获取响应！${api}?${query}`);
					let resp = await new Promise((resolve, reject) => {
						superagent
							.get(api + (query ? "?" + query : ""))
							.set({
								"User-Agent": "Mozilla/5.0", //这个ua不容易被风控
								Accept: "application/json, text/plain, */*",
								"accept-encoding": "gzip, deflate",
								origin: "https://t.bilibili.com",
								referer:
									"https://t.bilibili.com/?spm_id_from=444.41.0.0",
								"sec-ch-ua":
									'"Google Chrome";v="105", "Not)A;Brand";v="8", "Chromium";v="105"',
								"sec-ch-ua-mobile": "?0",
								"sec-ch-ua-platform": '"Windows"',
								"sec-fetch-dest": "empty",
								"sec-fetch-mode": "cors",
								"sec-fetch-site": "same-site",
							})
							.end(function (err, res) {
								try {
									// console.debug(res);
									if (res.body) {
										resolve(res.body);
									} else {
										throw err;
									}
								} catch (e) {
									console.error(
										`这个地址 "${api}" 的内容无法被解析!详细错误信息：${e}`
									);
									reject(
										`这个地址 "${api}" 的内容无法被解析!详细错误信息：${e}`
									);
								}
							});
					});
					return resp;
				},
				post: (api, data) => {
					let resp = new Promise((resolve, reject) => {
						superagent
							.post(api)
							.send(data)
							.set({
								"User-Agent":
									"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36 Edg/114.0.1823.82",
								Accept: "application/json, text/plain, */*",
								"accept-encoding": "gzip, deflate",
								origin: "https://t.bilibili.com",
								referer:
									"https://t.bilibili.com/?spm_id_from=444.41.0.0",
								"sec-ch-ua":
									'"Google Chrome";v="105", "Not)A;Brand";v="8", "Chromium";v="105"',
								"sec-ch-ua-mobile": "?0",
								"sec-ch-ua-platform": '"Windows"',
								"sec-fetch-dest": "empty",
								"sec-fetch-mode": "cors",
								"sec-fetch-site": "same-site",
							})
							.end(function (err, res) {
								if (!err) {
									try {
										resolve(res.body);
									} catch (e) {
										reject(
											`这个地址 "${api}" 的内容无法被解析!详细错误信息：${e}`
										);
									}
								}
							});
					});
					return resp;
				},
				get_dynamic_v1_detail: (dynamic_id) => {
					//获取动态详情
					return MYAPI.BiliAPI.get(
						`https://api.bilibili.com/x/polymer/web-dynamic/v1/detail`,
						{
							timezone_offset: -480,
							platform: "h5",
							id: dynamic_id,
						}
					);
				},
				/**
		 * 返回评论区response
		 * @param {Number} mode 
		 *  默认为 3
			0 3：仅按热度
			1：按热度+按时间
			2：仅按时间
		 * @param {Number} next 
			按热度时：热度顺序页码（0 为第一页）
			按时间时：时间倒序楼层号
			默认为 0
		 * @param {Number} comment_id 即oid 目标评论区 id	
		 * @param {Number} type 评论区类型代码	
		 * @returns {Promise}
		 */
				get_reply_main: (mode, next, comment_id, type) => {
					//获取主站视频和动态底下的评论
					return MYAPI.BiliAPI.get(
						`https://api.bilibili.com/x/v2/reply/wbi/main`,
						{
							mode: mode,
							next: next,
							oid: comment_id,
							plat: 1,
							type: type,
							web_location: 1315875,
						}
					);
				},
				/**
		 * 获取评论区明细_翻页加载
		 * @param {*} sort 默认为0
							0：按时间
							1：按点赞数
							2：按回复数
		 * @param {*} next 
		 * @param {*} comment_id 
		 * @param {*} type 
		 * @returns 
		 */
				get_reply: (sort, pn, comment_id, type) => {
					return MYAPI.BiliAPI.get(
						`https://api.bilibili.com/x/v2/reply/wbi/main`,
						{
							sort: sort,
							pn: pn,
							oid: comment_id,
							type: type,
						}
					);
				},
				BV_AV_trans: (inputcontent) => {
					let XOR_CODE = 23442827791579n;
					let MASK_CODE = 2251799813685247n;
					let MAX_AID = 1n << 51n;
					let BASE = 58n;
					let data = [
						"F",
						"c",
						"w",
						"A",
						"P",
						"N",
						"K",
						"T",
						"M",
						"u",
						"g",
						"3",
						"G",
						"V",
						"5",
						"L",
						"j",
						"7",
						"E",
						"J",
						"n",
						"H",
						"p",
						"W",
						"s",
						"x",
						"4",
						"t",
						"b",
						"8",
						"h",
						"a",
						"Y",
						"e",
						"v",
						"i",
						"q",
						"B",
						"z",
						"6",
						"r",
						"k",
						"C",
						"y",
						"1",
						"2",
						"m",
						"U",
						"S",
						"D",
						"Q",
						"X",
						"9",
						"R",
						"d",
						"o",
						"Z",
						"f",
					];
					let bvidArr = Array.from(inputcontent);
					[bvidArr[3], bvidArr[9]] = [bvidArr[9], bvidArr[3]];
					[bvidArr[4], bvidArr[7]] = [bvidArr[7], bvidArr[4]];
					bvidArr.splice(0, 3);
					let tmp = 0n;
					for (let i = 0; i < bvidArr.length; i++) {
						let idx = data.indexOf(bvidArr[i]);
						tmp = tmp * BASE + BigInt(idx);
					}
					return Number((tmp & MASK_CODE) ^ XOR_CODE);
				},
				draw_dynamic_id: (dynamic_url) => {
					return /\d+/g.exec(dynamic_url).pop();
				},
				archive_stat: (aid) => {
					return MYAPI.BiliAPI.get(
						`https://api.bilibili.com/x/web-interface/archive/stat`,
						{
							aid: aid,
						}
					);
				},
				/**
				 * 跳转评论api返回promise，await之后返回json
				 * @param {*} type 动态类型
				 * @param {*} oid 评论区comment_id_str
				 * @param {*} rpid 评论的编号id
				 * @returns
				 */
				reply_jump: (type, oid, rpid) => {
					return MYAPI.BiliAPI.get(
						`https://api.bilibili.com/x/v2/reply/jump`,
						{
							type: type,
							oid: oid,
							rpid: rpid,
						}
					);
				},
			},
			PageFunc: {
				/**
				 * 等待浏览器响应
				 * @param {*} page
				 * @param {string} url_include
				 */
				waitForResponse: async (page, url_include) => {
					try {
						await page.waitForResponse(
							(response) =>
								response.url().includes(url_include) &&
								response.status() === 200
						);
					} catch (e) {
						console.log(
							`${
								global_var.user_info.uname
							}\t等待响应${url_include}失败\t${new Date().toLocaleTimeString()}`
						);
						throw `${
							global_var.user_info.uname
						}\t等待响应${url_include}失败\t${new Date().toLocaleTimeString()}`;
					}
				},
			},
		};

		let lottery_settingstr = await lottery_setting_file_reader(
			this.lottery_name
		);
		let lottery_setting;
		eval(lottery_settingstr); //设置全局的抽奖参数
		this.lottery_setting = this.lottery_setting
			? this.lottery_setting
			: lottery_setting;
		this.utl = utl;
		this.global_var = global_var;
		this.my_operator = my_operator;
		this.MYAPI = MYAPI;
	};
}

module.exports = ENVIRONMENT;
