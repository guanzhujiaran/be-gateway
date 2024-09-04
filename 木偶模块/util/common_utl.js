/*
 * @Author: 星瞳 1944637830@qq.com
 * @Date: 2023-11-08 13:34:47
 * @LastEditors: 星瞳 1944637830@qq.com
 * @LastEditTime: 2024-05-30 15:13:12
 * @FilePath: \tampermonkey\木偶模块\util\common_utl.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
const {Page} = require("puppeteer-core");
let axios = require("axios");
const {AccountService} = require("@/ExpressServerEnd/Service/account_module/account_service");

function sleep(ms) {
    return new Promise((resolve) => setTimeout(() => resolve(sleep), ms));
}

const pptr_op = {
    /**
     * 将页面切换至前台，如果无法切换，可能是页面或者浏览器关了，返回false
     * @param {Page} pg
     * @returns {Promise<boolean>}
     */
    check_page_is_front: async (pg) => {
        let is_front = false;
        let bk = 0;
        while (bk <= 5) {
            try {
                if (pg && pg.isClosed()) {
                    return;
                }
                is_front = await pg.evaluate(
                    () => document.visibilityState
                ) === "visible";
                if (!is_front) {
                    await pg.bringToFront();
                    is_front = true;
                }
                break;
            } catch (e) {
                console.error(`将浏览器切换至前台失败！${e}\n${e.stack}`);
                bk++;
                await sleep(3e3);
            }
        }
        return is_front;
    },
    /**
     * 获取浏览器的b站中存储的csrf值
     * @param {Page} pg
     * @returns {Promise<string>} - bili_cjt 也就是csrf_token和csrf
     */
    get_bili_cjt: async (pg) => {
        if (pg && pg.isClosed()) {
            return;
        }
        let cks = await pg.cookies("https://www.bilibili.com");
        return cks.find((el) => el.name == "bili_jct").value;
    },
    get_uid: async (pg) => {
        if (pg && pg.isClosed()) {
            return;
        }
        let cks = await pg.cookies("https://www.bilibili.com");
        return cks.find((el) => el.name == "DedeUserID").value;
    },
    /**
     *    将函数列表和需要运行的时间丢进去，可以等间隔的时间运行
     * @param {Array<CallableFunction>} async_func_list
     * @param {any} args
     * @param {number} total_ms
     * @returns {Array<any>} 返回函数的结果
     */
    do_promise_func_in_sep_ms: async (async_func_list, args, total_ms) => {
        let promise_list = [];
        let sep_ms = Math.ceil(total_ms / async_func_list.length);
        for (let async_func of async_func_list) {
            promise_list.push(async_func(args));
            await sleep(sep_ms);
        }
        return promise_list;
    },
    /**
     * 移除视频播放器
     * @param {Page} pg
     */
    remove_video_player: async (pg) => {
        try {
            if (pg && pg.isClosed()) {
                return;
            }
            // await pg.evaluate((selector) => {
            // 	const elementToRemove = document.querySelector(selector);
            // 	if (elementToRemove) {
            // 		elementToRemove.remove();
            // 	}
            // }, `.bpx-player-primary-area`); //移除播放器
        } catch (e) {
            console.error(`${e}\n${e.stack}\n移除直播间的播放器元素失败！`);
        }
    },
    hook_teck_logdata: async (pg) => {
        await pg.setBypassCSP(true);
        await pg.setRequestInterception(true);
        pg.on("request", async (req) => {
            try {
                if (req.method().toLowerCase() == "post") {
                    if (
                        req
                            .url()
                            .includes("data.bilibili.com/log/web?013324") ||
                        req
                            .url()
                            .includes("data.bilibili.com/log/web?000527") ||
                        req
                            .url()
                            .includes("data.bilibili.com/log/web?000017") ||
                        req
                            .url()
                            .includes("data.bilibili.com/log/web?001111") ||
                        req
                            .url()
                            .includes(
                                "data.bilibili.com/log/web?web_location"
                            ) ||
                        req
                            .url()
                            .includes(
                                "data.bilibili.com/log/web?content_type"
                            ) ||
                        req.url().includes("cm.bilibili.com/cm/api/fees/pc")
                        // ||
                        // req.url().includes(`data.bilibili.com/v2/log/web`)
                    ) {
                        //如果是浏览器要发起检测到作弊的请求，就拦截下来，不让它发出去！
                        return req.respond({
                            status: 200,
                            contentType: "text/plain; charset=utf-8",
                            body: "ok",
                        });
                        //console.log(`成功拦截科技识别请求：${interceptedRequest.url()}`);
                    }
                }
                if (
                    req
                        .url()
                        .includes(
                            "api.bilibili.com/x/internal/gaia-gateway/ExClimbWuzhi"
                        ) &&
                    req.method().toLowerCase() == "post"
                ) {
                    return req.respond({
                        status: 200,
                        contentType:
                            "application/json; text/plain; charset=UTF-8",
                        body: JSON.stringify({
                            code: 0,
                            data: {},
                            message: "0",
                            ttl: 1,
                        }),
                    });
                }
                if (
                    req.url().includes(".bilivideo.com") || // 拦截直播流
                    req.url().includes(".bilivideo.cn") ||
                    req.url().includes("web-frontend/data/collector") // 前端检测设备的请求，发送多了会触发验证码
                ) {
                    return req.respond({
                        status: 200,
                        contentType: "application/octet-stream",
                        body: "",
                    });
                }
                if (req.url().includes("player/wbi/playurl")) {
                    // 拦截播放列表
                    return req.respond({
                        status: 200,
                        contentType:
                            "application/json; text/plain; charset=utf-8",
                        body: JSON.stringify({
                            code: -412,
                            message: "0",
                            data: null,
                            ttl: 1,
                        }),
                    });
                }
                // if (new URL(req.url()).origin.includes(".geetest.com")) {
                //     // 放行极验的请求
                //     return req.continue();
                // }
                // if (
                // 	req.resourceType() == "image" ||
                // 	req.resourceType() == "media"
                // ) {
                // 	return req.abort();
                // }

                req.continue();
            } catch (e) {
                console.warn(`拦截请求：${req.url()}失败\n${e.stack}`, e);
            }
        });
        pg.on('response', resp => {
            let hdr = resp.headers();
            if (hdr['x-bili-gaia-vvoucher']) {
                console.error(`触发验证码！`)
            }
        })
    },
    /**
     * 通过b站前端的__BiliUser__.isLogin判断是否账号的登录状态还在
     * @param {Page} pg
     * @returns
     *  - true:登录
     *  - false:登录失效
     */
    check_bili_login: async (pg) => {
        let url = pg.url();
        if (!url.includes(`bilibili`)) {
            await pg.goto(`https://message.bilibili.com/?spm_id_from=333.1007.0.0#/love`);
        }
        let isLogin = await pg.evaluate(() => window.__BiliUser__?.isLogin);
        pg.url() == url ? {} : await pg.goto(url);
        return isLogin;
    },
    my_send_notify: {
        __push_key: {
            //专门存放token的地方
            pushme: "T1cBRRgooZyhfIJMYPjR", //pushme的token
            push_plus: "044b3325295b47228409452e0e7aeef7",
        },
        /**
         * pushme推送消息
         * @param {String} title 标题
         * @param {String} msg 内容
         */
        push_me: async function (title, msg) {
            try {
                let resp = await axios.post("https://push.i-i.me", {
                    push_key: this.__push_key.pushme,
                    title: title,
                    content: msg,
                });
                if (resp.data != "success") {
                    console.error(`推送失败！原因：${resp.data}`);
                }
            } catch (e) {
                console.warn(
                    e,
                    `消息${(title, msg)}推送失败！\n尝试使用push_plus再次推送！`
                );
                await this.push_plus(title, msg);
            }
        },
        push_plus: async function (title, msg) {
            try {
                let resp = await axios.post("http://www.pushplus.plus/send", {
                    token: this.__push_key.push_plus,
                    title: title,
                    content: msg,
                    template: "txt",
                });
                if (resp.code != 200) {
                    console.error(
                        `推送${(title, msg)}失败！原因：${JSON.stringify(
                            resp.data
                        )}`
                    );
                }
            } catch (e) {
                console.warn(e, `${(title, msg)}消息推送失败！`);
            }
        },
    },
};

const utl = {
    /**
     * 获取抽奖设置
     * @param account_name
     * @param uid
     * @return {Promise<AccountLotterySettingModel|*>}
     */
    get_lottery_setting: async (account_name, uid) => {
        let lottery_setting_resp = await AccountService.get_lottery_setting_by_account_name_and_uid(account_name, uid);
        return lottery_setting_resp.info.settings.lottery_setting;
    },
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
                eval(`const_data.${k} = origin_data.${k}`);
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
                    weight_list.push({content: e, count: 1});
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
     * @param {Page} opus_page
     * @return {Promise<{item: {visible: boolean, id_str: undefined, basic: {}, type: undefined, modules: {module_dynamic: {major: {opus: {}}}, module_author: {}, module_stat: {}}}}>}
     * @constructor
     */
    Get_Opus_Dynamic_Data: async function (opus_page) {
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
                opus_init_detail = await opus_page.evaluate(
                    `window.__INITIAL_STATE__`
                );
                if (opus_init_detail?.length) {
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
                        if (paragraph.para_type === 1) {
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
};


module.exports = {
    sleep,
    pptr_op,
    utl
};
