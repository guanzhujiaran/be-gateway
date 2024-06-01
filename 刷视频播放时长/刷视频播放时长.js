const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())
const fs = require('fs');
const { TIMEOUT } = require('dns');
const { stringify } = require('querystring');
const { pptr_op } = require('../木偶模块/util/common_utl');
//导入包
const __dirpath = './刷视频播放时长/';
if (!fs.existsSync(__dirpath)) {
    //创建文件目录
    fs.mkdirSync(__dirpath);
}

if (!fs.existsSync(__dirpath + 'cookie_file')) {
    //创建文件目录
    fs.mkdirSync(__dirpath + 'cookie_file');
}
// if (!fs.existsSync(__dirpath + 'log')) {
//     //创建文件目录
//     fs.mkdirSync(__dirpath + 'log');
// }
// if (!fs.existsSync(__dirpath + '抽奖记录')) {
//     //创建文件目录
//     fs.mkdirSync(__dirpath + '抽奖记录');
// }
// if (!fs.existsSync(__dirpath + '抽奖记录/官方抽奖记录')) {
//     //创建文件目录
//     fs.mkdirSync(__dirpath + '抽奖记录/官方抽奖记录');
// }
// if (!fs.existsSync(__dirpath + '抽奖记录/必抽的大奖记录')) {
//     //创建文件目录
//     fs.mkdirSync(__dirpath + '抽奖记录/必抽的大奖记录');
// }

//设置项目路径和必要的文件夹
function sleep(ms) {
    return new Promise(resolve => setTimeout(() => resolve(sleep), ms));
}
let watch_video_launch = async (lottery_setting_string, broswer_mode) => {
    const global_var = {//全局变量
        page: undefined,//创建的网页
        pagelist: [],
        browser: undefined,//创建的浏览器
        pageurl: '',//抽奖网址
        response: {
            global_dynamic_data: undefined,//全局的动态数据
            create_dyn_response: undefined,//创建或转发动态的响应
            comment_dyn_response: undefined,//自己评论动态的响应
            relation_modify_response: undefined,//关注响应
            dynamic_thumb_response: undefined,//点赞动态响应
        },

        reply_main: undefined,//评论区响应
        user_nav: undefined,
        fengkong_flag: false,//风控标志
        recorded_data: '',//抽奖反馈信息
        user_info: {
            uid: undefined,
            uname: undefined,
        },
        Pause: false,//抽奖暂停标志
        Baidu_wenxin: {
            access_token: undefined,//百度文心的access_token
            API_Key: `Pqu42f2I0OGa5fdyf280FIULvn04DYEA`,
            Secret_key: `KdgUQdnByOtwjd6dwaImo5ckNbHxqRnv`,
            access_token_api: `https://wenxin.baidu.com/moduleApi/portal/api/oauth/token`,
            paraphrase_api: `https://wenxin.baidu.com/moduleApi/portal/api/rest/1.0/ernie/3.0.20/zeus`,
            get_result_api: `https://wenxin.baidu.com/moduleApi/portal/api/rest/1.0/ernie/v1/getResult`
        }
    }
    //整合常用本地工具
    const utl = {
        downFile: function (fileName, fileContent) {//下载文件
            let csvString = "data:text/csv;charset=utf-8,\ufeff" + encodeURIComponent(fileContent);
            let link = document.createElement('a');
            link.href = csvString;
            //对下载的文件命名
            link.download = fileName;
            document.body.appendChild(link);
            utl.simulate(link, 'click')
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
            return arr.filter(item => item % step == 0);
        },
        random_choice: function (input_list) {
            let index = Math.floor((Math.random() * input_list.length));
            return input_list[index];
        },
        part_shuffle: function (shuffle_num, shuffle_list) {//打乱部分顺序
            if (shuffle_num > shuffle_list.length) { shuffle_num = shuffle_list.length }
            for (var i = 0; i < shuffle_num; i++) {
                var rdm = Math.floor(Math.random() * shuffle_list.length)
                shuffle_list.push(shuffle_list[rdm])
                shuffle_list.splice(rdm, 1)
            }
            return shuffle_list
        },
        my_throw: async function (err_msg) {
            await my_operator.log_record.construct_comment_record_data(err_msg)
            return global_var.recorded_data
        },
        simulate: function (element, eventName) {//模拟操作
            try {
                function extend(destination, source) {
                    for (var property in source)
                        destination[property] = source[property];
                    return destination;
                }

                var eventMatchers = {
                    'HTMLEvents': /^(?:load|unload|abort|error|select|change|submit|reset|focus|blur|resize|scroll)$/,
                    'MouseEvents': /^(?:click|dblclick|mouse(?:down|up|over|move|out))$/
                }
                function getElemPos(elem) {
                    var eTop = 0,
                        eLeft = 0;
                    while (elem !== null) {
                        eTop += elem.offsetTop;
                        eLeft += elem.offsetLeft;
                        elem = elem.offsetParent;
                    }
                    eTop += Math.ceil(10 * Math.random());
                    eLeft += Math.ceil(20 * Math.random());
                    return {
                        x: eLeft,
                        y: eTop
                    };
                }
                var defaultOptions = {
                    pointerX: getElemPos(element).x,
                    pointerY: getElemPos(element).y,
                    button: 0,
                    ctrlKey: false,
                    altKey: false,
                    shiftKey: false,
                    metaKey: false,
                    bubbles: true,
                    cancelable: true
                }
                var options = extend(defaultOptions, arguments[2] || {});
                var oEvent, eventType = null;
                for (var name in eventMatchers) {
                    if (eventMatchers[name].test(eventName)) { eventType = name; break; }
                }
                if (!eventType)
                    throw new SyntaxError('Only HTMLEvents and MouseEvents interfaces are supported');
                if (document.createEvent) {
                    oEvent = document.createEvent(eventType);
                    if (eventType == 'HTMLEvents') {
                        oEvent.initEvent(eventName, options.bubbles, options.cancelable);
                    }
                    else {
                        oEvent.initMouseEvent(eventName, options.bubbles, options.cancelable, document.defaultView,
                            options.button, options.pointerX, options.pointerY, options.pointerX, options.pointerY,
                            options.ctrlKey, options.altKey, options.shiftKey, options.metaKey, options.button, element);
                    }
                    element.dispatchEvent(oEvent);
                }
                else {
                    options.clientX = options.pointerX;
                    options.clientY = options.pointerY;
                    var evt = document.createEventObject();
                    oEvent = extend(evt, options);
                    element.fireEvent('on' + eventName, oEvent);
                }
                return element;
            }
            catch {
                return utl.my_throw('模拟点击失败')
            }
        },
        const_object_remake: function (origin_data, const_data) {//从origin_data中重新读取设置的参数const_data是需要修改的数据
            for (let k of Object.keys(origin_data)) {
                if (typeof eval(`origin_data.${k}`) == 'object' && eval(`origin_data.${k}.length`) == undefined) {
                    this.const_object_remake(eval(`origin_data.${k}`), eval(`const_data.${k}`))
                }
                else {
                    eval(`const_data.${k}=origin_data.${k}`)
                }
            }
        },
        checkNewDay: (ts) => {//判断新的一天
            if (ts === 0)
                return true;
            let t = new Date(ts);
            let d = new Date();
            let td = t.getDate();
            let dd = d.getDate();
            return (dd !== td);
        },
        dateNow: () => Date.now(),
        remove_emoji_topic_at: (origin_str) => {//移除表情包和话题和@
            origin_str = origin_str.replaceAll(/＠/gmi, '@')
            origin_str = origin_str.replaceAll(/@.{0,12} /gmi, '')
            origin_str = origin_str.replaceAll('＃', '#')
            return origin_str.replaceAll(/(\[(?<=\[)(.*?)(?=\])])/gmi, "").replaceAll(/(\#(?<=#)(.*?)(?=#)#)/gmi, '').replaceAll(/(@.*)/gmi, '')
        },
        weight_rand: (input_list) => {//根据输入列表的次数的平方设置权重抽取
            let weight_list = [];
            let havedone_list = [];
            input_list.map((e) => {
                if (havedone_list.includes(e)) {
                    weight_list.find((currentValue, index, arr) => {
                        if (currentValue.content == e) {
                            arr[index].count += 1
                        }
                    })
                }
                else {
                    weight_list.push({ content: e, count: 1 });
                    havedone_list.push(e);
                }
            })
            weight_list = weight_list.map((e) => {
                return { content: e.content, weight: Math.pow(e.count, 2) }//用遇见次数的2幂次决定权重
            })//加完权重了
            let totalWeight = weight_list.reduce(function (pre, cur, index) {
                cur.startW = pre;
                return cur.endW = pre + cur.weight
            }, 0)
            let random = Math.ceil(Math.random() * totalWeight)
            let selectElement = weight_list.find(element => element.startW < random && element.endW >= random)
            return selectElement.content
        },
    }
    let superagent = require('superagent')
    let MYAPI = {
        browserSetting: {
            getCookies: function (cookieString, domain) {
                return cookieString.split(';').map((pair) => {
                    const name = pair.trim().slice(0, pair.trim().indexOf('='));
                    const value = pair.trim().slice(pair.trim().indexOf('=') + 1);
                    return { name, value, domain };
                });
            },
            getUserId: function (cookie) {
                const result = cookie.match(/(?:^|)DedeUserID=([^;]*)(?:;|$)/);
                return +result?.[1] || 0;
            }
        },
        cookieSetting: {
            getCookie: async (cookiefilename) => {
                let path = `${__dirpath}cookie_file/${cookiefilename}.txt`
                let data = '';
                if (fs.existsSync(path)) {
                    data = fs.readFileSync(path, function (err, data) {
                        if (err) {
                            console.log(err);
                            throw (err);
                        }
                        //console.log(data.toString());
                    }).toString()
                }
                else {
                    MYAPI.fileWrite(path, "")
                }
                return data
            },
            saveCookie: async (cookiefilename) => {
                let path = `${__dirpath}cookie_file/${cookiefilename}.txt`
                let cookie = await global_var.page.cookies('https://bilibili.com')
                let ckStr = ''
                for (let cknv of cookie) {
                    if (cknv.domain == '.bilibili.com') {
                        ckStr += `${cknv.name}=${cknv.value}; `
                    }
                }
                console.log("保存Cookie", global_var.user_info.uname, ckStr);
                fs.writeFileSync(path, ckStr)
            }
        },
        fileRead: {
            lottery_dynamic_ids: function (filename) {
                retlist = []
                try {
                    if (fs.existsSync(__dirpath + filename)) {
                        let dynamic_ids = fs.readFileSync(__dirpath + filename).toString().split('\n')
                        for (let dynamic_id of dynamic_ids) {
                            if (dynamic_id) { retlist.push(dynamic_id.trim()) }
                        }
                    }
                    else {//如果不存在则创建文件
                        MYAPI.fileWrite(__dirpath + filename, "")
                    }
                }
                catch (e) {
                    console.log(e, "fileRead.lottery_dynamic_ids");
                }
                return retlist
            }
        },
        fileWrite: function (filename, writeString, method = 'w') {
            if (typeof writeString == 'object') {
                writeString = JSON.stringify(writeString);
            }
            if (writeString) {
                if (writeString.slice(-1) == '\n') {//如果结尾是\n就不添加了
                    fs.writeFileSync(__dirpath + filename, writeString, { flag: method })
                }
                else {
                    fs.writeFileSync(__dirpath + filename, writeString + '\n', { flag: method })
                }
            }
        },
        BiliAPI: {//用之前加个await
            get: (api, params) => {
                return new Promise((resolve, reject) => {
                    superagent.get(api)
                        .query(params)
                        .set({
                            'User-Agent': '',
                            'Accept': 'application/json, text/plain, */*',
                            'accept-encoding': 'gzip, deflate',
                            'origin': 'https://t.bilibili.com',
                            'referer': 'https://t.bilibili.com/?spm_id_from=444.41.0.0',
                            'sec-ch-ua': "\"Google Chrome\";v=\"105\", \"Not)A;Brand\";v=\"8\", \"Chromium\";v=\"105\"",
                            'sec-ch-ua-mobile': '?0',
                            'sec-ch-ua-platform': "\"Windows\"",
                            'sec-fetch-dest': 'empty',
                            'sec-fetch-mode': 'cors',
                            'sec-fetch-site': 'same-site',
                        }).end(function (err, res) {
                            if (!err) {
                                try {
                                    resolve(res.body)
                                }
                                catch (e) {
                                    reject(`这个地址 "${api}" 的内容无法被解析!详细错误信息：${e}`);
                                }
                            }
                        });
                });
            },
            post: (api, data) => {
                return new Promise((resolve, reject) => {
                    superagent.post(api)
                        .send(data)
                        .set({
                            'User-Agent': '',
                            'Accept': 'application/json, text/plain, */*',
                            'accept-encoding': 'gzip, deflate',
                            'origin': 'https://t.bilibili.com',
                            'referer': 'https://t.bilibili.com/?spm_id_from=444.41.0.0',
                            'sec-ch-ua': "\"Google Chrome\";v=\"105\", \"Not)A;Brand\";v=\"8\", \"Chromium\";v=\"105\"",
                            'sec-ch-ua-mobile': '?0',
                            'sec-ch-ua-platform': "\"Windows\"",
                            'sec-fetch-dest': 'empty',
                            'sec-fetch-mode': 'cors',
                            'sec-fetch-site': 'same-site',
                        }).end(function (err, res) {
                            if (!err) {
                                try {
                                    resolve(res.body)
                                }
                                catch (e) {
                                    reject(`这个地址 "${api}" 的内容无法被解析!详细错误信息：${e}`);
                                }
                            }
                        });
                });
            },
            get_dynamic_v1_detail: (dynamic_id) => {//获取动态详情
                return MYAPI.BiliAPI.get(`https://api.bilibili.com/x/polymer/web-dynamic/v1/detail`,
                    {
                        timezone_offset: -480,
                        id: dynamic_id
                    })
            },
            get_reply_main: (mode, next, comment_id, type) => {//获取主站视频和动态底下的评论 
                return MYAPI.BiliAPI.get(`https://api.bilibili.com/x/v2/reply/main`,
                    {
                        'mode': mode,
                        'next': next,
                        'oid': comment_id,
                        'plat': 1,
                        'seek_rpid': "",
                        'type': type,
                    }
                )
            },
            BV_AV_trans: (inputcontent) => {//bvav互转
                var table = "fZodR9XQDSUm21yCkr6zBqiveYah8bt4xsWpHnJE7jL5VG3guMTKNPAwcF";
                var tr = {};
                for (let i = 0; i < 58; i++) {
                    tr[table[i]] = i;
                }
                var s = [11, 10, 3, 8, 4, 6];
                var xor = 177451812,
                    add = 8728348608;

                function dec(x) {
                    var r = 0;
                    for (let i = 0; i < 6; i++) {
                        r += tr[x[s[i]]] * Math.pow(58, i);
                    }
                    return (r - add) ^ xor;
                }

                function enc(x) {
                    x = (x ^ xor) + add;
                    var r = "BV1  4 1 7  ".split("");
                    for (let i = 0; i < 6; i++) {
                        r[s[i]] = table[Math.floor(x / Math.pow(58, i)) % 58];
                    }
                    return r.join("");
                }
                inputcontent = String(inputcontent);
                if (inputcontent.toUpperCase().includes('BV')) {//bv2av
                    return dec(inputcontent)
                }
                else {
                    return enc(inputcontent)
                }
            },
            draw_dynamic_id: (dynamic_url) => {
                return /\d+/g.exec(dynamic_url).pop()
            },
            archive_stat: (aid) => {
                return MYAPI.BiliAPI.get(`https://api.bilibili.com/x/web-interface/archive/stat`,
                    {
                        aid: aid
                    }
                )
            }
        },
    }
    let my_operator = {
        basic_operator: {
            check_reply: async function (response_json) {
                try {
                    let api = "https://api.bilibili.com/x/v2/reply/jump";
                    let type = response_json.data.reply.type;
                    let oid = global_var.response.global_dynamic_data.item.basic.comment_id_str
                    let rpid = response_json.data.reply.rpid;
                    let url = `${api}?type=${type}&oid=${oid}&rpid=${rpid}`;
                    let flags = await new Promise((resolve, reject) => {
                        fetch(url, {
                            method: 'GET',
                        }).then(res => res.json()).then(res => {
                            console.log(res)
                            var temp = false
                            res.data.replies.forEach(reply => {
                                if (reply.rpid == rpid) temp = true;
                                else if (reply.replies != null) {
                                    reply.replies.forEach(reply => {
                                        if (reply.rpid == rpid) temp = true;
                                    })
                                }
                            })
                            resolve(temp);
                        })
                    });
                    return flags;
                }
                catch (e) {
                    console.log(e)
                    return false
                }
            },
            dynamic_thumb: async function () {//动态点赞
                await sleep(2e3)
                await global_var.page.click('.bili-dyn-action.like')
                await sleep(1e3)
                console.log('动态点赞成功')
                await sleep(utl.random_choice(lottery_setting.Working_clearance_time))
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
            dynamic_repost: async function () {//点击转发
                await sleep(3e3);
                try {
                    let repost_btn = await global_var.page.$('.bili-dyn-forward-publishing__action__btn')
                    if (repost_btn) {
                    }
                    else {//如果没有等待元素，则尝试前往转发页面
                        await global_var.page.click(`.bili-dyn-action.forward`)
                        await sleep(1e3);
                        repost_btn = await global_var.page.$('.bili-dyn-forward-publishing__action__btn')
                    }

                    await sleep(1e3);
                    await repost_btn.click('.bili-dyn-forward-publishing__action__btn')
                    // let bt = 0
                    // while (!global_var.response.create_dyn_response) {
                    //     if (bt > 5) { break }
                    //     await sleep(1e3)
                    //     bt += 1
                    // }
                    // try {
                    //     if (global_var.response.create_dyn_response.code != 0) {
                    //         console.log(`动态转发失败，create_dyn_response.code`, global_var.response.create_dyn_response)
                    //         global_var.fengkong_flag = true//可能触发风控，停一个小时
                    //         return await utl.my_throw(`动态转发失败，create_dyn_response.code`)
                    //     }
                    //     else {
                    //         console.log('动态转发成功');
                    //     }
                    // }
                    // catch (e) {
                    //     if (!e.includes(`Error: Node is either not clickable or not an HTMLElement`)) {
                    //         global_var.fengkong_flag = true
                    //     }//可能触发风控，停一个小时
                    //     await utl.my_throw(`动态转发失败，dynamic_repost，${e}`)
                    //     throw (`动态转发失败，dynamic_repost，${e}`)
                    // }

                }
                catch (e) {
                    console.warn(`动态转发失败，dynamic_repost，${e}`)
                    await utl.my_throw(`动态转发失败，dynamic_repost，${e}`)
                    throw (`动态转发失败，dynamic_repost，${e}`)
                    //return 
                }
            },
            comment_submit: async function (comment_msg) {//点击回复
                if (typeof comment_msg != 'string' || !comment_msg || comment_msg.includes('undefined') || comment_msg.includes('null') || comment_msg.includes('true') || comment_msg.includes('false')) {//检查是否传入的是string类型参数 或者是否为空
                    return await utl.my_throw('动态评论内容出错')
                }
                await sleep(1e3);
                let msg_box
                for (let bt = 0; bt <= 5; bt++) {
                    try {
                        await global_var.page.waitForSelector(`[name=msg]`, { timeout: 10e3 })
                        msg_box = await global_var.page.$(`[name=msg]`)
                        await msg_box.focus()
                        let msg_box_content = await global_var.page.$eval(`[name=msg]`, el => el.value)
                        let _bt = 0
                        while (msg_box_content != comment_msg) {//回复栏里的东西等于回复内容时break
                            await msg_box.focus()
                            await sleep(utl.random_choice(3 * lottery_setting.Working_clearance_time))
                            await msg_box.type(comment_msg, { delay: 0 })
                            await sleep(1e3)
                            msg_box_content = await global_var.page.$eval(`[name=msg]`, el => el.value)
                            if (msg_box_content != comment_msg) {//如果不等就删掉重新输入
                                await msg_box.focus()
                                await global_var.page.keyboard.down('Control');
                                await global_var.page.keyboard.press('A');
                                await global_var.page.keyboard.up('Control');
                                await sleep(1e3)
                                await global_var.page.keyboard.press('Backspace');
                                console.log('输入框里内容与评论不符，删除输入框里内容', `\nmsg_box_content:${msg_box_content}\tcomment_msg:${comment_msg}`);
                            }
                            if (_bt >= 5) {
                                console.log('输入框里输入内容失败');
                                await utl.my_throw('动态评论失败')
                                throw (`动态评论失败`)
                            }
                            _bt += 1
                        }
                        await sleep(1e3)
                        await global_var.page.click(`.comment-submit`)



                        // let _ = 0;
                        // while (global_var.response.comment_dyn_response == undefined) {
                        //     await sleep(1e3)
                        //     _ += 1;
                        //     if (_ >= 5) {
                        //         break
                        //     }
                        // }
                        ////////////先暂时不判断响应
                        // if (global_var.response.comment_dyn_response.code != 0) {
                        //     console.log('动态评论失败')
                        //     if (global_var.response.comment_dyn_response.code == 12064) {//不可发送单个标点符号
                        //         if (bt < 3) {
                        //             await sleep(1e3)
                        //             continue
                        //         } else {
                        //             await utl.my_throw('动态评论失败')
                        //             throw (`动态评论失败`)
                        //         }
                        //     }
                        //     global_var.fengkong_flag = true //可能触发风控，停一个小时
                        //     await utl.my_throw('动态评论失败')
                        //     throw (`动态评论失败`)
                        // } else {
                        //     await sleep(1e3)
                        //     break
                        // }
                        break;
                    }
                    catch (e) {
                        if (bt >= 5) {
                            throw (e)
                        }
                        await sleep(3e3);
                        await global_var.page.evaluate(() => {
                            this.scrollTo(0, 3000)
                        });
                        await global_var.page.evaluate(() => {
                            this.scrollTo(0, 3000)
                        })
                        await sleep(3e3);

                    }
                }
                let captcha;//检查验证码
                try { captcha = await global_var.page.$(`.comment-captcha`) }
                catch (e) {
                    console.warn('无需验证码', e);
                }
                if (captcha) {
                    await utl.my_throw('动态评论失败，需要验证码')
                    throw (`动态评论失败，需要验证码`)
                }
                // let comment_flag = await my_operator.basic_operator.check_reply(global_var.response.comment_dyn_response)
                // if (comment_flag === true) {
                //     console.log('评论显示正常')
                // }
                // else {
                //     return await utl.my_throw('评论被阿瓦隆吞掉了')
                // }//逻辑改了，现在评论需要审核，不太方便判断是否被吞
                //评论点赞部分
                try {
                    if (Math.random() < lottery_setting.comment_thumb_chance) {
                        await my_operator.basic_operator.comment_thumb()
                        await sleep(utl.random_choice(lottery_setting.Working_clearance_time))
                    }
                } catch {
                }
            },
            comment_thumb: async function () {
                try {
                    let uname = global_var.user_info.uname;
                    await sleep(3e3);
                    let comment_user_index = await global_var.page.$$eval(`.user`, (els, uname) => {
                        let comment_con
                        let j
                        for (el of els) {
                            if (el.children[0].text == uname) {
                                comment_con = el.parentElement.children
                                for (j = 0; j < comment_con.length; j++) {
                                    if (comment_con[j].className == 'info') {
                                        return els.indexOf(el)
                                    }
                                }
                            }
                        }
                    }, uname)
                    let my_comment_thumb;
                    try {
                        my_comment_thumb = (await global_var.page.$$(`span.like.like`))[comment_user_index]
                    }
                    catch (e) {
                        console.warn(`my_comment_thumb，`, e);
                        throw (`my_comment_thumb，`, e)
                    }
                    //console.log(`点赞第${comment_user_index}个评论条数`);
                    if (my_comment_thumb) {
                        await my_comment_thumb.click()
                    } else {
                        console.log('获取评论框元素失败评论点赞失败')
                        return await utl.my_throw('评论点赞失败')
                    }
                    if (!(await global_var.page.waitForSelector(`span.like.liked`, { timeout: 10e3 }))) {
                        console.log('评论点赞失败')
                        return await utl.my_throw('评论点赞失败')
                    }
                    else {
                        console.log('评论点赞成功')
                    }
                }
                catch (e) {
                    console.log(e)
                    console.log(`评论点赞失败，comment_thumb`, e)
                    await utl.my_throw(`评论点赞失败，comment_thumb，${e}`)
                    throw (`评论点赞失败，comment_thumb，${e}`);
                }

            }
        },
        fast_repost: async function () {//直接转发
            try {//直接点转发
                await sleep(1e3)
                await my_operator.basic_operator.dynamic_repost()
                //最后点赞
                await my_operator.basic_operator.dynamic_thumb()
            }
            catch {
                try {
                    await sleep(utl.random_choice(lottery_setting.Working_clearance_time))
                    await global_var.page.click('.bili-dyn-action.forward')//前往转发子页面
                    await sleep(1e3)
                    await my_operator.basic_operator.dynamic_repost()
                    //最后点赞
                    await my_operator.basic_operator.dynamic_thumb()
                }
                catch {
                    console.log(global_var.response.global_dynamic_data)
                    global_var.fengkong_flag = true//可能触发风控，停一个小时
                    return await utl.my_throw(`转发失败，fast_repost`)
                }
            }
        },
        comment_repost_dynamic_with_content: async function (comment_msg) {//转评带上回复内容
            try {
                let bt = 0
                while (1) {
                    if (bt > 5) {//多次尝试点击勾选，超过次数则退出
                        break
                    }
                    try {
                        await global_var.page.waitForSelector(`input.dynamic-repost-checkbox`, { timeout: 5e3 }).then(async checkbox => { await checkbox.click() })//勾选同时转发到我的动态
                        //  await global_var.page.click('.dynamic-repost-checkbox')
                        await sleep(1e3)
                        if ((await global_var.page.$eval('input.dynamic-repost-checkbox', el => el.checked))) {
                            await sleep(3e3)
                            break
                        }
                    }
                    catch (e) {
                        await sleep(1e3)
                        await global_var.page.reload();
                        await sleep(3e3)
                        await global_var.page.evaluate(() => {
                            this.scrollTo(0, 3000)
                        })

                    }
                    bt += 1;
                }
                if ((await global_var.page.$eval('input.dynamic-repost-checkbox', el => el.checked))) {
                    await sleep(1e3)
                }
                else {
                    console.log('勾选同时转发到我的动态转发失败')
                    await utl.my_throw('勾选同时转发到我的动态转发失败')
                    throw (`勾选同时转发到我的动态转发失败，comment_repost_dynamic_with_content，${e}`)
                }
                if (comment_msg != null && comment_msg != undefined) {
                    await my_operator.basic_operator.comment_submit(comment_msg)
                }
                else {
                    console.log('评论获取失败，comment_repost_dynamic_with_content')
                    return await utl.my_throw('评论获取失败，comment_repost_dynamic_with_content')
                }
                //检查转发是否成功
                try {
                    let bt = 0;
                    while (global_var.response.create_dyn_response == undefined) {
                        if (bt >= 10) {
                            break;
                        }
                        await sleep(1e3)
                        bt += 1
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
                }
                catch (e) {
                    global_var.fengkong_flag = true//可能触发风控，停一个小时
                    await utl.my_throw(`动态转发失败，comment_repost_dynamic_with_content，${e}`)
                    throw (`动态转发失败，comment_repost_dynamic_with_content，${e}`)
                }

                //动态点赞
                await sleep(3e3);
                await my_operator.basic_operator.dynamic_thumb()
            }
            catch (e) {
                console.log(global_var.response.global_dynamic_data)
                return await utl.my_throw(`转发失败，comment_repost_dynamic_with_content，${e}`)
            }
        },
        comment_repost_dynamic_without_content: async function (comment_msg) { //转评不带回复内容
            //先评论
            try {
                if (comment_msg != null && comment_msg != undefined) {
                    await my_operator.basic_operator.comment_submit(comment_msg)
                }
                else {
                    console.log('评论获取失败')
                    return await utl.my_throw('评论获取失败， comment_repost_dynamic_without_content')
                }
                //再转发
                await sleep(1e3)
                await global_var.page.click('.bili-dyn-action.forward')//前往转发子页面
                await sleep(1e3)
                await my_operator.basic_operator.dynamic_repost()
                //最后点赞
                await my_operator.basic_operator.dynamic_thumb()
            }
            catch (e) {
                console.warn(global_var.response.create_dyn_response)
                return await utl.my_throw(`评论转发失败，comment_repost_dynamic_without_content，${e}`)
            }
        },
        only_comment: async function (comment_msg) {//只评论
            try {
                if (comment_msg != null && comment_msg != undefined) {
                    await my_operator.basic_operator.comment_submit(comment_msg)
                }
                else {
                    console.log('评论获取失败')
                    return
                }
                await sleep(1e3)
                await my_operator.basic_operator.dynamic_thumb()
            }
            catch (e) {
                console.log(global_var.response.global_dynamic_data)
                return await utl.my_throw(`评论获取失败， only_comment，${e}`)
            }
        },
        dynamic_content_operator: {//获取动态信息相关操作
            get_dynamic_content_and_top_msg: async function (dynamic_data) {//获取动态内容和up置顶的回复
                async function get_top_msg() {
                    try {
                        if (global_var.reply_main != undefined) {
                            try {
                                1
                                let ret_msg = ''
                                let upper_mid = global_var.reply_main.data.upper.mid
                                let replies = global_var.reply_main.data.replies
                                let top = global_var.reply_main.data.top.upper
                                if (top != null) {
                                    ret_msg += top.content.message
                                    if (top.replies) {
                                        for (let rp of top.replies) {
                                            if (rp.mid == upper_mid) {
                                                ret_msg += rp.content.message
                                            }
                                        }
                                    }
                                }
                                for (let i = 0; i < replies.length; i++) {
                                    let replies_content = replies[i].content.message
                                    let replies_mid = replies[i].content.message.mid
                                    if (replies_mid == upper_mid) {
                                        ret_msg += replies_content
                                    }
                                }
                                return ret_msg
                            }
                            catch {
                                console.log('up置顶的回复获取失败')
                                await utl.my_throw('up置顶的回复获取失败')
                                return ''
                            }
                        }
                        else {
                            console.log('未拦截到评论API内容')
                            await utl.my_throw('获取置顶评论失败')
                            return ''
                        }
                    }
                    catch (e) {
                        console.log('up置顶的回复获取失败')
                        await utl.my_throw('up置顶的回复获取失败')
                        return ''
                    }
                }
                try {
                    let top_msg = ''
                    if (global_var.reply_main != undefined) {
                        top_msg = await get_top_msg()
                    }
                    let dynmaic_content = ''
                    let dynamic_type = dynamic_data.item.type
                    if (dynamic_type == 'DYNAMIC_TYPE_AV') {
                        let dynamic_content1
                        let dynamic_content2
                        try {
                            dynamic_content1 = dynamic_data.item.modules.module_dynamic.desc.text
                        }
                        catch { dynamic_content1 = '' }
                        try {
                            dynamic_content2 = dynamic_data.item.modules.module_dynamic.major.archive.desc
                        }
                        catch {
                            dynamic_content2 = ''
                        }
                        if (dynamic_content1 != undefined && dynamic_content1 != null) { dynmaic_content += dynamic_content1 }
                        if (dynamic_content2 != undefined && dynamic_content2 != null) { dynmaic_content += dynamic_content2 }
                    }
                    else if (dynamic_type == "DYNAMIC_TYPE_ARTICLE") {
                        let dynamic_content1
                        let dynamic_content2
                        let dynamic_content3
                        try { dynamic_content1 = dynamic_data.item.modules.module_dynamic.desc.text }
                        catch {
                            dynamic_content1 = ''
                        }
                        try {
                            dynamic_content2 = dynamic_data.item.modules.module_dynamic.desc.additional
                        }
                        catch {
                            dynamic_content2 = ''
                        }
                        try {
                            dynamic_content3 = dynamic_data.item.modules.module_dynamic.major.article.desc
                        }
                        catch {
                            dynamic_content3 = ''
                        }
                        if (dynamic_content1 != undefined && dynamic_content1 != null) { dynmaic_content += dynamic_content1 }
                        if (dynamic_content2 != undefined && dynamic_content2 != null) { dynmaic_content += dynamic_content2 }
                        if (dynamic_content3 != undefined && dynamic_content3 != null) { dynmaic_content += dynamic_content3 }

                    }
                    else {
                        let dynamic_content1
                        let dynamic_content2
                        let dynamic_content3
                        try {
                            dynamic_content1 = dynamic_data.item.modules.module_dynamic.desc.text
                        }
                        catch { dynamic_content1 = '' }
                        try {
                            dynamic_content2 = dynamic_data.item.modules.module_dynamic.topic
                        }
                        catch {
                            dynamic_content2 = ''
                        }
                        try {
                            dynamic_content3 = dynamic_data.item.modules.module_dynamic.additional
                        }
                        catch {
                            dynamic_content3 = ''
                        }
                        if (dynamic_content1 != undefined && dynamic_content1 != null) { dynmaic_content += dynamic_content1 }
                        if (dynamic_content2 != undefined && dynamic_content2 != null) { dynmaic_content += dynamic_content2 }
                        if (dynamic_content3 != undefined && dynamic_content3 != null) { dynmaic_content += dynamic_content3 }
                    }
                    return (dynmaic_content + '\n' + top_msg.toString()).trim();
                }
                catch (e) {
                    console.warn(`get_dynamic_content_and_top_msg`, e);
                    return JSON.stringify(dynamic_data);
                }
            },
        },
        dynamic_comment_operator: {//回复内容相关操作
            pre_msg_processing: function (dynamic_content) {
                let premsg = ''//判断是否需要@或者带话题
                let msg = undefined
                dynamic_content = dynamic_content.replaceAll(/＠/gmi, '@')
                dynamic_content = dynamic_content.replaceAll(/@([^ ]{0,10}) /gmi, '')
                dynamic_content = dynamic_content.replaceAll('转发话题', '带话题')
                dynamic_content = dynamic_content.replaceAll('＃', '#')

                let topobj_6 = /.*@.{0,3}位.*|.*@.{0,3}名.*/gmi.exec(dynamic_content)
                let topobj_5 = /.*@.{0,3}1位.*|.*@.{0,3}1名.*/gmi.exec(dynamic_content)
                let topobj_4 = /.*@.{0,3}一位.*|.*@.{0,3}一名.*/img.exec(dynamic_content)
                let topobj_3 = /.*@.{0,3}一位好友.*|.*@.{0,3}你的|.*@.{0,3}一名好友.*/img.exec(dynamic_content)
                let topobj_2 = /.*艾特.{0,3}位好友.*|.*艾特.{0,3}名好友.*/img.exec(dynamic_content)
                let topobj_1 = /.*@你想祝福的人.*/img.exec(dynamic_content)
                let topobj0 = /.*@{0,3}位胖友.*|.*@{0,3}名胖友.*/img.exec(dynamic_content)
                let topobj1 = /.*圈.{0,3}位你的伙伴.*|.*圈.{0,3}名你的伙伴.*/img.exec(dynamic_content)
                let topobj2 = /.*带tag#.{0,30}#.*/img.exec(dynamic_content)
                let topobj3 = /.*带话题.{0,15}#.{0,30}#((?!投稿).)*$/img.exec(dynamic_content)
                let topobj4 = /.*带上tag#.{0,30}#((?!投稿).)*$/img.exec(dynamic_content)
                let topobj5 = /.*带#.{0,30}#.{0,10}话题((?!投稿).)*$/img.exec(dynamic_content)
                let topobj6 = /.*艾特好友.*/img.exec(dynamic_content)
                let topobj7 = /.*@.{0,3}名好友.*|.*@.{0,3}位好友.*/img.exec(dynamic_content)
                let topobj8 = /.*@你的.{0,3}个小伙伴.*/img.exec(dynamic_content)
                let topobj9 = /.*@两位好友.*|.*@两名好友.*/img.exec(dynamic_content)
                let topobj10 = /.*带#.{0,30}#((?!投稿).)*$/img.exec(dynamic_content)
                let topobj11 = /.*@.{0,5}你的.{0,3}个好友.*/img.exec(dynamic_content)
                let topobj12 = /.*带[^来】看懂]{0,5}#.{0,30}#((?!投稿).)*$/gmi.exec(dynamic_content)
                let topobj13 = /.*加话题#.{0,30}#((?!投稿).)*$/img.exec(dynamic_content)
                let topobj14 = /.*带标签#.{0,30}#((?!投稿).)*$/img.exec(dynamic_content)
                if (topobj_6 != null || topobj6 != null || topobj_5 != null || topobj_4 != null || topobj_3 != null || topobj_2 != null || topobj_1 != null || topobj0 != null || topobj1 != null
                    || topobj7 != null || topobj8 != null || topobj11 != null) {
                    premsg = '@' + utl.random_choice(lottery_setting.at_member)
                }
                else if (topobj9 != null) { premsg = `@${utl.random_choice(self.at_member)} @${utl.random_choice(self.at_member)} ` }
                else if (topobj2 != null) {
                    msg = /.*带tag#(.{0,20})#.*/img.exec(dynamic_content).slice(1)
                    for (let _ = 0; _ < msg.length; _++) {
                        if (msg[_] != null && msg[_] != undefined) { premsg += '#' + msg[_] + '#' }
                    }
                }
                else if (topobj3 != null) {
                    msg = /.*带话题.*?#(.{0,30})#.*/img.exec(dynamic_content).slice(1)
                    for (let _ = 0; _ < msg.length; _++) {
                        if (msg[_] != null && msg[_] != undefined) { premsg += '#' + msg[_] + '#' }
                    }
                }
                else if (topobj4 != null) {
                    msg = /.*带上tag#(.{0,30})#.*/img.exec(dynamic_content).slice(1)
                    for (let _ = 0; _ < msg.length; _++) {
                        if (msg[_] != null && msg[_] != undefined) { premsg += '#' + msg[_] + '#' }
                    }
                }
                else if (topobj5 != null) {
                    msg = /.*带#(.{0,30})#.{0,10}话题.*/img.exec(dynamic_content).slice(1)
                    for (let _ = 0; _ < msg.length; _++) {
                        if (msg[_] != null && msg[_] != undefined) { premsg += '#' + msg[_] + '#' }
                    }
                }
                else if (topobj10 != null) {
                    msg = /.*带#(.{0,30})#.*/img.exec(dynamic_content).slice(1)
                    for (let _ = 0; _ < msg.length; _++) {
                        if (msg[_] != null && msg[_] != undefined) { premsg += '#' + msg[_] + '#' }
                    }
                }
                else if (topobj12 != null) {
                    msg = /.*带.{0,5}#(.{0,30})#.*/img.exec(dynamic_content).slice(1)
                    for (let _ = 0; _ < msg.length; _++) {
                        if (msg[_] != null && msg[_] != undefined) { premsg += '#' + msg[_] + '#' }
                    }
                }
                else if (topobj13 != null) {
                    msg = /.*加话题#(.{0,30})#.*/img.exec(dynamic_content).slice(1)
                    for (let _ = 0; _ < msg.length; _++) {
                        if (msg[_] != null && msg[_] != undefined) { premsg += '#' + msg[_] + '#' }
                    }
                }
                else if (topobj14 != null) {
                    msg = /.*带标签#(.{0,30})#.*/img.exec(dynamic_content).slice(1)
                    for (let _ = 0; _ < msg.length; _++) {
                        if (msg[_] != null && msg[_] != undefined) { premsg += '#' + msg[_] + '#' }
                    }
                }
                if (premsg.indexOf('#') > -1) {
                    let tpremsg = ''
                    for (let _ = 0; _ < premsg.split('#').length; _++) {
                        if (premsg.split('#')[_] != '' && premsg.split('#')[_] != ' ' && premsg.split('#')[_] != '  ' && premsg.split('#')[_] != '和') {
                            if (tpremsg.length < 18) {
                                tpremsg += '#' + premsg.split('#')[_] + '#'
                            }
                        }
                    }
                    premsg = tpremsg
                }
                if (/.*带话题#.*#((?!投稿).)*$/gmi.test(dynamic_content) || topobj2 || topobj3 || topobj4 || topobj5 || topobj10 || topobj12 || topobj13 || topobj14) {
                    if (!premsg.includes('#')) {
                        utl.my_throw('话题获取失败')
                        return undefined
                    }
                }
                return premsg
            }
            ,
            manual_reply_judge: function (dynamic_content) {
                //判断是否需要人工回复 返回true需要人工判断  返回null不需要人工判断
                //64和67用作判断是否能使用关键词回复
                dynamic_content = dynamic_content.replaceAll(/＠/gmi, '@')
                dynamic_content = dynamic_content.replaceAll(/@.{0,10} /gmi, '')
                dynamic_content = dynamic_content.replaceAll(/好友/gmi, '朋友')
                dynamic_content = dynamic_content.replaceAll(/伙伴/gmi, '朋友')
                dynamic_content = dynamic_content.replaceAll(/安利/gmi, '分享')
                let manual_re1 = /.*评论.{0,20}告诉|.*有关的评论|.*告诉.{0,20}留言/gmi.test(dynamic_content)
                let manual_re2 = /.*评论.{0,20}理由|.*参与投稿.{0,30}有机会获得/gmi.test(dynamic_content)
                let manual_re3 = /.*评论.{0,10}对|.*造.{0,3}句子/gmi.test(dynamic_content)
                let manual_re4 = /.*猜赢|.*猜对|.*答对/gmi.test(dynamic_content)
                let manual_re5 = /.*说.{0,10}说|.*谈.{0,10}谈|评论.{0,10}写.{0,10}写/gmi.test(dynamic_content)
                let manual_re7 = /.*最先猜中|.*带文案|.*许.{0,5}愿望/gmi.test(dynamic_content)
                let manual_re8 = /.*新衣回/gmi.test(dynamic_content)
                let manual_re9 = /.*留言.{0,10}建议|.*评论.{0,10}答|.*一句话证明|.*留言.{0,10}得分|.*有趣.{0,3}留言|.*有趣.{0,3}评论|.*留言.{0,3}晒出|.*评论.{0,3}晒出/gmi.test(dynamic_content)
                let manual_re11 = /.*评论.{0,10}祝福|.*评论.{0,10}意见|.*意见.{0,10}评论|.*留下.{0,10}意见|.*意见.{0,10}留下/gmi.test(dynamic_content)
                let manual_re12 = /.*评论.{0,10}讨论|.*话题.{0,10}讨论|.*参与.{0,5}讨论/gmi.test(dynamic_content)
                let manual_re14 = /.*评论.{0,10}说出/gmi.test(dynamic_content)
                let manual_re15 = /.*评论.{0,20}分享|.*评论.{0,20}互动((?!抽奖|,|，).)*$|.*评论.{0,20}提问|.*想问.{0,20}评论|.*想说.{0,20}评论|.*想问.{0,20}留言|.*想说.{0,20}留言/gmi.test(dynamic_content)
                let manual_re16 = /.*评论.{0,10}聊.{0,10}聊/gmi.test(dynamic_content)
                let manual_re17 = /.*评.{0,10}接力/gmi.test(dynamic_content)
                let manual_re18 = /.*聊.{0,10}聊/gmi.test(dynamic_content)
                let manual_re19 = /.*评论.{0,10}扣|.*评论.{0,5}说.{0,3}下/gmi.test(dynamic_content)
                let manual_re20 = /.*转发.{0,10}分享/gmi.test(dynamic_content)
                let manual_re21 = /.*评论.{0,10}告诉/gmi.test(dynamic_content)
                let manual_re22 = /.*评论.{0,10}唠.{0,10}唠/gmi.test(dynamic_content)
                let manual_re23 = /.*今日.{0,5}话题|.*参与.{0,5}话题|.*参与.{0,5}答题/gmi.test(dynamic_content)
                let manual_re24 = /.*说.*答案|.*评论.{0,15}答案/gmi.test(dynamic_content)
                let manual_re25 = /.*说出/gmi.test(dynamic_content)
                let manual_re26 = /.*为.{0,10}加油/gmi.test(dynamic_content)
                let manual_re27 = /.*评论.{0,10}话|.*你中意的|.*评.{0,10}你.{0,5}的|.*写上.{0,10}你.{0,5}的|.*写下.{0,10}你.{0,5}的/gmi.test(dynamic_content)
                let manual_re28 = /.*评论.{0,15}最想做7的事|.*评.{0,7}最喜欢|.*评.{0,15}最.{0,7}的事/gmi.test(dynamic_content)
                let manual_re29 = /.*分享.{0,20}经历|.*经历.{0,20}分享/gmi.test(dynamic_content)
                let manual_re30 = /.*分享.{0,20}心情/gmi.test(dynamic_content)
                let manual_re31 = /.*评论.{0,10}句/gmi.test(dynamic_content)
                let manual_re32 = /.*转关评下方视频/gmi.test(dynamic_content)
                let manual_re33 = /.*分享.{0,10}美好/gmi.test(dynamic_content)
                let manual_re34 = /.*视频.{0,10}弹幕/gmi.test(dynamic_content)
                let manual_re35 = /.*生日快乐/gmi.test(dynamic_content)
                let manual_re36 = /.*一句话形容/gmi.test(dynamic_content)
                let manual_re38 = /.*分享.{0,10}喜爱/gmi.test(dynamic_content)
                let manual_re39 = /.*分享.{0,10}最|.*评论.{0,10}最/gmi.test(dynamic_content)
                let manual_re40 = /.*带话题.{0,15}晒|.*带话题.{0,15}讨论/gmi.test(dynamic_content)
                let manual_re41 = /.*分享.{0,15}事/gmi.test(dynamic_content)
                let manual_re42 = /.*送出.{0,15}祝福/gmi.test(dynamic_content)
                let manual_re43 = /.*评论.{0,30}原因/gmi.test(dynamic_content)
                let manual_re46 = /.*给.{0,10}推荐/gmi.test(dynamic_content)
                let manual_re47 = /.*答案.{0,10}参与/gmi.test(dynamic_content)
                let manual_re48 = /.*唠.{0,5}唠/gmi.test(dynamic_content)
                let manual_re49 = /.*分享一下/gmi.test(dynamic_content)
                let manual_re50 = /.*评论.{0,30}故事/gmi.test(dynamic_content)
                let manual_re51 = /.*告诉.{0,30}什么|.*告诉.{0,30}最/gmi.test(dynamic_content)
                let manual_re53 = /.*发布.{0,20}图.{0,5}动态/gmi.test(dynamic_content)
                let manual_re54 = /.*视频.{0,20}评论/gmi.test(dynamic_content)
                let manual_re55 = /.*复zhi|.*长按/gmi.test(dynamic_content)
                let manual_re56 = /.*多少.{0,10}合适/gmi.test(dynamic_content)
                let manual_re57 = /.*喜欢.{0,5}哪/gmi.test(dynamic_content)
                let manual_re58 = /.*多少.{0,15}？|.*多少.{0,15}\?|.*有没有.{0,15}？|.*有没有.{0,15}\?|.*是什么.{0,15}？|.*是什么.{0,15}\?/gmi.test(dynamic_content)
                let manual_re59 = /.*哪.{0,15}？|.*哪.{0,15}？|.*那些.{0,15}？|.*那些.{0,15}？/gmi.test(dynamic_content)
                let manual_re61 = /.*看.{0,10}猜/gmi.test(dynamic_content)
                let manual_re63 = /.*评论.{0,10}猜|.*评论.{0,15}预测/gmi.test(dynamic_content)
                let manual_re65 = /.*老规矩你们懂的/gmi.test(dynamic_content)
                let manual_re67 = /.*评((?!抽奖|,|，).){0,7}“|.*评((?!抽奖|,|，).){0,7}【|.*评((?!抽奖|,|，).){0,7}:|.*评((?!抽奖|,|，).){0,7}：|.*评((?!抽奖|,|，).){0,7}「|.*带关键词.{0,7}"|.*留言((?!抽奖|,|，).){0,7}“|.*对出.{0,10}下联.{0,5}横批|.*回答.{0,8}问题|.*留下.{0,10}祝福语|.*留下.{0,10}愿望|.*找到.{0,10}不同的.{0,10}留言|.*答案放在评论区|.*几.{0,5}呢？|.*有奖问答|.*想到.{0,19}关于.{0,20}告诉|.*麻烦大伙评论这个|留下.{0,7}的/gmi.test(dynamic_content)
                let manual_re76 = /.*留下((?!抽奖|,|，).){0,5}“|.*留下((?!抽奖|,|，).){0,5}【|.*留下((?!抽奖|,|，).){0,5}:|.*留下((?!抽奖|,|，).){0,5}：|.*留下((?!抽奖|,|，).){0,5}「/gmi.test(dynamic_content)
                let manual_re77 = /.*留言((?!抽奖|,|，).).{0,7}“|.*留言((?!抽奖|,|，).){0,7}【|.*留言((?!抽奖|,|，).){0,7}:|.*留言((?!抽奖|,|，).){0,7}：|.*留言((?!抽奖|,|，).){0,7}「/gmi.test(dynamic_content)
                let manual_re64 = /.*分享.{0,10}的|.*正确回答|.*回答正确|.*评论.{0,10}计划|.*定.{0,10}目标.{0,5}？|.*定.{0,10}目标.{0,5}?|.*评论.{0,7}看的电影|.*如果.{0,20}觉得.{0,10}？|.*如果.{0,20}觉得.{0,10}\?|评论.{0,7}希望.{0,5}|.*竞猜[\s\S]{0,15}答|.*把喜欢的.{0,10}评论|.*评论.{0,5}解出.{0,5}密文/gmi.test(dynamic_content)
                let manual_re6 = /.*@.{0,15}朋友|.*艾特|.*@.{0,3}你的|.*标记.{0,10}朋友|.*@{0,15}赞助商|.*发表你的新年愿望\+个人的昵称|.*抽奖规则请仔细看图片|.*带上用户名|.*此视频|.*视频评论区|.*活动详情请戳图片/gmi.test(dynamic_content)
                let manual_re62 = /.*评论.{0,10}#.*什么|.*转评.{0,3}#.*(?<=，)/gmi.test(dynamic_content)
                let manual_re68 = /.*将.{0,10}内容.{0,10}评/gmi.test(dynamic_content)
                let manual_re70 = /.*会不会.{0,20}？|.*会不会.{0,20}\?|如何.{0,20}？|如何.{0,20}\?/gmi.test(dynamic_content)
                let manual_re71 = /.*猜.{0,10}猜|.*猜.{0,10}比分|.*猜中.{0,10}获得/gmi.test(dynamic_content)
                let manual_re72 = /.*生日|.*新年祝福/gmi.test(dynamic_content)
                let manual_re73 = /.*知道.{0,15}什么.{0,15}？|.*知道.{0,15}什么.{0,15}\?|.*用什么|.*评.{0,10}收.{0,5}什么.{0.7}\?|.*评.{0,10}收.{0,5}什么.{0,7}？/gmi.test(dynamic_content)
                let manual_re74 = /.*领.{0,10}红包.{0,5}大小|.*领.{0,10}多少.{0,10}红包|.*红包金额/gmi.test(dynamic_content)
                let manual_re75 = /.*互动话题|.*互动留言|.*互动时间/gmi.test(dynamic_content)

                return manual_re1 || manual_re2 || manual_re3 || manual_re4 || manual_re5 || manual_re6 || manual_re7 || manual_re8 || manual_re9 ||
                    manual_re11 || manual_re12 || manual_re14 || manual_re15 || manual_re16 || manual_re17 || manual_re18 || manual_re19 || manual_re20 || manual_re21 || manual_re22 || manual_re23 || manual_re24 || manual_re25 ||
                    manual_re26 || manual_re27 || manual_re28 || manual_re29 || manual_re30 ||
                    manual_re31 || manual_re32 || manual_re33 || manual_re34 || manual_re35 ||
                    manual_re36 || manual_re38 || manual_re39 || manual_re40 ||
                    manual_re41 || manual_re42 || manual_re43 || manual_re46 ||
                    manual_re47 || manual_re48 || manual_re49 || manual_re50 || manual_re51 ||
                    manual_re53 || manual_re54 || manual_re58 || manual_re59 || manual_re55 || manual_re56 ||
                    manual_re57 || manual_re61 || manual_re62 || manual_re63 || manual_re64 ||
                    manual_re65 || manual_re67 || manual_re68 || manual_re70 || manual_re71 || manual_re72 || manual_re73 ||
                    manual_re74 || manual_re75 || manual_re77 || manual_re77
            },
            key_word_reply: function (dynamic_content) {
                if (
                    /.*评((?!抽奖|,|，).){0,7}“|.*评((?!抽奖|,|，).){0,7}【|.*评((?!抽奖|,|，).){0,7}:|.*评((?!抽奖|,|，).){0,7}：|.*评((?!抽奖|,|，).){0,7}「|.*带关键词.{0,7}"|.*留言((?!抽奖|,|，).){0,7}“|.*对出.{0,10}下联.{0,5}横批|.*回答.{0,8}问题|.*留下.{0,10}祝福语|.*留下.{0,10}愿望|.*找到.{0,10}不同的.{0,10}留言|.*答案放在评论区|.*几.{0,5}呢？|.*有奖问答|.*想到.{0,19}关于.{0,20}告诉|.*麻烦大伙评论这个|留下.{0,7}的/gmi.test(dynamic_content)
                    || /.*留下((?!抽奖|,|，).){0,5}“|.*留下((?!抽奖|,|，).){0,5}【|.*留下((?!抽奖|,|，).){0,5}:|.*留下((?!抽奖|,|，).){0,5}：|.*留下((?!抽奖|,|，).){0,5}「/gmi.test(dynamic_content)
                    || /.*留言((?!抽奖|,|，).).{0,7}“|.*留言((?!抽奖|,|，).){0,7}【|.*留言((?!抽奖|,|，).){0,7}:|.*留言((?!抽奖|,|，).){0,7}：|.*留言((?!抽奖|,|，).){0,7}「/gmi.test(dynamic_content)
                    || /.*分享.{0,10}的|.*正确回答|.*回答正确|.*评论.{0,10}计划|.*定.{0,10}目标.{0,5}？|.*定.{0,10}目标.{0,5}?|.*评论.{0,7}看的电影|.*如果.{0,20}觉得.{0,10}？|.*如果.{0,20}觉得.{0,10}\?|评论.{0,7}希望.{0,5}|.*竞猜[\s\S]{0,15}答|.*把喜欢的.{0,10}评论|.*评论.{0,5}解出.{0,5}密文/gmi.test(dynamic_content)
                    || /.*@.{0,15}朋友|.*艾特|.*@.{0,3}你的|.*标记.{0,10}朋友|.*@{0,15}赞助商|.*发表你的新年愿望\+个人的昵称|.*抽奖规则请仔细看图片|.*带上用户名|.*此视频|.*视频评论区|.*活动详情请戳图片/gmi.test(dynamic_content)
                    || /.*评论.{0,10}#.*什么|.*转评.{0,3}#.*(?<=，)/gmi.test(dynamic_content)
                ) {//如果是指定回复某个评论直接返回undefined
                    return undefined
                }
                if (/.*留下((?!抽奖).){0,5}“|.*留下((?!抽奖).){0,5}【|.*留下((?!抽奖).){0,5}:|.*留下((?!抽奖).){0,5}：|.*留下((?!抽奖).){0,5}「/gmi.test(dynamic_content)
                ) {
                    return undefined

                }
                if (/.*猜.{0,10}猜|.*猜.{0,10}比分|.*猜中.{0,10}获得/gmi.test(dynamic_content)
                ) {
                    return undefined
                }
                if (/.*领到多少红包|.*领.{0,3}到.{0,3}红包大小|.*评论.{0,10}红包金额|留言.{0,10}红包金额|.*领.{0,3}的.{0,3}红包大小/gmi.test(dynamic_content)) {
                    return lottery_setting.key_word_comment.red_pocket
                }
                if (/.*喜欢.{0,5}零食/gmi.test(dynamic_content)) {
                    if (lottery_setting.key_word_comment.favorite_food) {
                        return utl.random_choice(['', '最爱', '喜欢', '想吃', '', '']) + utl.random_choice(lottery_setting.key_word_comment.favorite_food)
                    }
                    else {
                        return utl.random_choice(['', '最爱', '喜欢', '想吃', '', '']) + utl.random_choice(['薯片', '巧克力', '辣条', '冰淇淋', '肉松饼', '魔芋爽', '小酥肉', '烤冷面', '鸡柳', '曲奇饼干', '芒果干', '猪肉脯'])
                    }
                }
                if (/.*喜欢.{0,5}颜色|.*最爱.{0,5}颜色/gmi.test(dynamic_content)) {
                    if (lottery_setting.key_word_comment.favorite_color) {
                        return utl.random_choice(['', '喜欢', '', '']) + utl.random_choice(lottery_setting.key_word_comment.favorite_color)
                    }
                    else {
                        return utl.random_choice(['', '喜欢', '', '']) + utl.random_choice(['白色', '黑色', '红色'])
                    }
                }
                if (/.*生日季|.*生日回|.*生日会|.*生日祝福/gmi.test(dynamic_content)) {
                    if (lottery_setting.key_word_comment.birthday_congratulation) {
                        return utl.random_choice(lottery_setting.key_word_comment.birthday_congratulation)
                    }
                    else {
                        return utl.random_choice(['生快', '生日快乐！', '生日快乐呀'])
                    }
                }
                if (/.*新年祝福/gmi.test(dynamic_content)) {
                    if (lottery_setting.key_word_comment.birthday_congratulation) {
                        return utl.random_choice(lottery_setting.key_word_comment.newyear_congratulation)
                    }
                    else {
                        return utl.random_choice(['祝新年福满天！', '新年快乐！', '新年快乐呀'])
                    }
                }
                if (/.*复制|.*长按/gmi.test(dynamic_content)) {
                    if (lottery_setting.key_word_comment.qiafan_promotion) {
                        return utl.random_choice(lottery_setting.key_word_comment.qiafan_promotion)
                    }
                    else {
                        return undefined
                    }

                }
                return undefined
            },
            reply_comment_generator: async function (dynamic_content, dynamic_id) {
                //生成所需评论
                let comment_msg
                if (my_operator.dynamic_comment_operator.manual_reply_judge(dynamic_content)) {
                    let key_reply = my_operator.dynamic_comment_operator.key_word_reply(dynamic_content)
                    if (!key_reply) {
                        console.log('需要人工回复的动态')
                        if (dynamic_id && my_operator.copy_reply_module.copy_reply_judge(dynamic_content) && Math.random() < lottery_setting.copy_reply_module.comment_copy_chance) {
                            let copy_msg;
                            let para_msg;
                            try {
                                copy_msg = await my_operator.copy_reply_module.get_copy_reply(dynamic_id, 1, 0.4)
                            }
                            catch (e) {
                                console.warn(`${global_var.user_info.uname} 获取抄评论内容失败，reply_comment_generator，`, e);
                            }
                            if (copy_msg && Math.random() < lottery_setting.copy_reply_module.comment_paraphrase_chance) {
                                try { para_msg = await my_operator.copy_reply_module.wenxin_paraphrase(copy_msg); }
                                catch (e) {
                                    console.warn(`${global_var.user_info.uname} 获取同义改写内容失败，reply_comment_generator，`, e);
                                }
                            }
                            comment_msg = copy_msg == undefined ? para_msg : copy_msg;
                        }
                        else {
                            comment_msg = '人工回复'
                            await utl.my_throw('需要人工回复的动态')
                            return undefined
                        }
                    }
                    else {
                        console.log('触发关键词回复')
                        comment_msg = key_reply
                    }
                }
                let pre_msg = ''
                if (typeof comment_msg == "string" && comment_msg.includes('人工回复')) {
                    comment_msg = undefined;
                }
                pre_msg = my_operator.dynamic_comment_operator.pre_msg_processing(dynamic_content)
                let official_type = global_var.response.global_dynamic_data.item.modules.module_author.official_verify.type
                if (!comment_msg) {
                    comment_msg = utl.random_choice(lottery_setting.defined_reply_msg)
                    if (official_type == 1) {
                        comment_msg = utl.random_choice(lottery_setting.replycontent)
                    }
                    else {
                        comment_msg = utl.random_choice(lottery_setting.non_official_chp)
                    }
                }


                if (!comment_msg || typeof comment_msg != 'string' || pre_msg == undefined) {
                    comment_msg = '回复内容出错'
                    utl.my_throw('回复内容出错')
                    return
                }

                return pre_msg + comment_msg
            }
        },
        log_record: {
            construct_comment_record_data: async function (comment_msg) {
                try { var rpid = global_var.response.comment_dyn_response.data.reply.rpid_str }
                catch { rpid = undefined }
                try {
                    let d = new Date()
                    var ctime = d.toLocaleString(global_var.response.comment_dyn_response.data.reply.ctime)

                }
                catch {
                    let d = new Date()
                    ctime = d.toLocaleString()
                }
                try {
                    var author_name = global_var.response.global_dynamic_data.item.modules.module_author.name
                }
                catch {
                    console.log(global_var.response.global_dynamic_data);
                    author_name = undefined
                }
                try {
                    var author_mid = global_var.response.global_dynamic_data.item.modules.module_author.mid
                    var author_homepage = `https://space.bilibili.com/${author_mid}/dynamic`
                }
                catch {
                    console.log(global_var.response.global_dynamic_data);
                    author_homepage = undefined
                }
                try {
                    var dynamic_content = JSON.stringify(await my_operator.dynamic_content_operator.get_dynamic_content_and_top_msg(global_var.response.global_dynamic_data)).replace(/,/g, '，')
                }
                catch {
                    console.log(global_var.response.global_dynamic_data, new Date());
                    dynamic_content = undefined
                }
                let lottery_reply_record = `${global_var.pageurl}#${rpid} ,${JSON.stringify(comment_msg)},${ctime},${author_name},${dynamic_content},${author_homepage}`
                if (global_var.recorded_data || global_var.recorded_data == '') {
                    if (!global_var.recorded_data.includes(global_var.pageurl)) {
                        global_var.recorded_data = lottery_reply_record
                        MYAPI.fileWrite(`抽奖记录/${global_var.user_info.uname}_抽奖记录.csv`, global_var.recorded_data.trim() + '\n', 'a+')
                    }
                }
                return global_var.recorded_data
            }
        },
        judge_lottery_time: {
            judge_official_lottery: async function () {//官方抽奖判断 没过期返回false 过期了返回true
                if ((await global_var.page.$('.bili-rich-text-module.lottery')) && JSON.stringify(global_var.response.global_dynamic_data.item.modules.module_dynamic.desc).includes('RICH_TEXT_NODE_TYPE_LOTTERY')) {//选取互动抽奖蓝标
                    if (lottery_setting.official_lottery_switch) { }
                    else {
                        return true
                    }
                    //utl.simulate(document.getElementsByClassName('bili-rich-text-module lottery')[0], 'click')
                    //await sleep(2 * utl.random_choice(lottery_setting.Working_clearance_time))
                    try {
                        if (1) {//document.getElementsByClassName('bili-popup__content__browser')[0].contentWindow.document.getElementsByClassName('countdown')[0]) {//没过期
                            //await sleep(utl.random_choice(lottery_setting.Working_clearance_time))
                            //utl.simulate(document.getElementsByClassName('bili-popup__header__close')[0], 'click')
                            //await sleep(utl.random_choice(lottery_setting.Working_clearance_time))//暂时不判断官方抽奖是否过期
                            return false
                        }
                        else {
                            await utl.my_throw('过期的官方抽奖')
                            return true
                        }
                    }
                    catch {
                        await utl.my_throw('官抽信息获取失败或者过期')
                        return true
                    }
                }
                else {
                    return undefined
                }
            }
        },
        prevent_filter_module: {
            prevent_filter_init: async function () {
                try {
                    if (lottery_setting.prevent_module.share_video_switch) {
                        await my_operator.prevent_filter_module.share_video(lottery_setting.prevent_module.share_video_num)
                    }
                } catch (e) {
                    console.warn(`分享视频失败，`, e)
                }
                try {
                    if (lottery_setting.prevent_module.create_word_dynamic_chp_switch) {
                        await my_operator.prevent_filter_module.create_word_dynamic(lottery_setting.prevent_module.create_word_dynamic_chp, 1)
                    }
                } catch {
                    console.warn('创建文字动态失败');
                }
            },
            share_video: async function (share_num) {
                let share_chance = lottery_setting.prevent_module.share_video_chance == undefined ? 0.5 : lottery_setting.prevent_module.share_video_chance//默认值为0.5
                async function get_video_list(__share_num) {
                    let share_video_list = []
                    let bt = false
                    let counter = 0
                    while (1) {
                        if (share_video_list.length > __share_num * 5 || bt) {
                            break
                        }
                        let catchele = (await global_var.page.$$eval('.bili-video-card.is-rcmd>div.bili-video-card__wrap.__scale-wrap>a[href]', elems => {
                            return elems.map(elem => elem.href)
                        }))
                        for (let i of catchele) {
                            share_video_list.push(i);
                        }
                        await sleep(1e3)
                        await global_var.page.click('.primary-btn')
                        await sleep(1e3)
                        if (share_video_list.length == 0 || counter > 10) {
                            bt += true
                        }
                        counter++
                    }
                    return share_video_list
                }
                async function share_video_operator(pageurl) {
                    console.log('开始点击分享')
                    await global_var.page.waitForSelector(`.bpx-player-video-area`)
                    await sleep(3e3)
                    console.log(`点击了暂停视频`);
                    await global_var.page.click(`.bpx-player-video-area`)
                    for (let __ = 0; __ < 5; __++) {
                        try {
                            await sleep(3e3)
                            if (Math.random() < share_chance) {//根据share_chance采取动作，更加具有随机性
                            }
                            else {
                                return;
                            }
                            await global_var.page.hover('#share-btn-outer')
                            await sleep(3e3)
                            await global_var.page.click('.share-btn')
                            let share_iframe;//分享的单独的iframe
                            await sleep(3e3);
                            for (let child of await global_var.page.mainFrame().childFrames()) {
                                if ((await child.url()).includes('share/card')) {//通过url定位iframe
                                    share_iframe = child;//将找到的iframe赋值给share_iframe
                                    break;
                                }
                            }
                            try {
                                if (Math.random() < lottery_setting.prevent_module.share_copy_chance) {
                                    let BV = /(BV.{10})/gmi.exec(pageurl).pop();
                                    let copycontent;
                                    let paraphrase_input;
                                    if (BV) {
                                        copycontent = await my_operator.copy_reply_module.get_copy_reply(BV, 1, 0.5);
                                        paraphrase_input = await my_operator.copy_reply_module.wenxin_paraphrase(copycontent);
                                    }
                                    let inputstr = paraphrase_input ? paraphrase_input : copycontent;
                                    if (inputstr) {
                                        for (let bt = 0; bt <= 5; bt++) {
                                            try {
                                                await share_iframe.waitForSelector(`#editor`, { timeout: 10e3 })
                                                let msg_box = await share_iframe.$(`#editor`)
                                                await msg_box.focus()
                                                let msg_box_content = await share_iframe.$eval(`#editor`, el => el.value)
                                                let _bt = 0
                                                while (msg_box_content != inputstr) {//回复栏里的东西等于回复内容时break
                                                    await msg_box.focus()
                                                    await sleep(utl.random_choice(3 * lottery_setting.Working_clearance_time))
                                                    await msg_box.type(inputstr, { delay: 0 })
                                                    await sleep(1e3)
                                                    msg_box_content = await share_iframe.$eval(`#editor`, el => el.value);
                                                    msg_box_content = msg_box_content.replace(/[\u200B-\u200D\uFEFF]/g, '');
                                                    await sleep(1e3);
                                                    if (msg_box_content != inputstr) {//如果不等就删掉重新输入
                                                        await msg_box.focus()
                                                        await global_var.page.keyboard.down('Control');
                                                        await global_var.page.keyboard.press('A');
                                                        await global_var.page.keyboard.up('Control');
                                                        await sleep(1e3)
                                                        await global_var.page.keyboard.press('Backspace');
                                                        console.log('输入框里内容与评论不符，删除输入框里内容', `\nmsg_box_content:${msg_box_content}\ninputstr:${inputstr}`);
                                                    }
                                                    if (_bt >= 5) {
                                                        console.log('输入框里输入内容失败');
                                                        await utl.my_throw('动态评论失败')
                                                        throw (`动态评论失败`)
                                                    }
                                                    _bt += 1
                                                }
                                                await sleep(1e3)
                                                break;
                                            }
                                            catch (e) {
                                                if (bt >= 5) {
                                                    throw (e)
                                                }
                                                await sleep(3e3);
                                                await global_var.page.evaluate(() => {
                                                    this.scrollTo(0, 3000)
                                                });
                                                await global_var.page.evaluate(() => {
                                                    this.scrollTo(0, 3000)
                                                })
                                                await sleep(3e3);
                                            }
                                        }
                                    }
                                    else {
                                        console.warn(`分享视频inputstr未定义`);
                                    }
                                }
                            } catch (e) {
                                console.log(`${global_var.user_info.uname} 获取视频评论内容失败`, e);
                            }
                            await share_iframe.click(`.share-btn.clickable`)
                            console.log('点击了分享到动态');
                            await sleep(1e3);
                            break;
                        }
                        catch (e) {
                            console.warn(`${global_var.user_info.uname} 分享视频失败 `, e)
                            await sleep(3e3)
                        }
                    }
                }
                await global_var.page.goto('https://www.bilibili.com/', { waitUntil: 'load' })
                let pageurl = await global_var.page.url()
                if (pageurl == 'https://www.bilibili.com/' && lottery_setting.prevent_module.share_video_switch) {
                    let video_list = await get_video_list(share_num)
                    let share_video_list = []
                    video_list = utl.part_shuffle(video_list.length, video_list)
                    video_list.some((rcm_video) => {
                        if (share_video_list.length < share_num) {
                            if (!share_video_list.includes(rcm_video) && !rcm_video.includes('cm.bilibili.com')) {
                                share_video_list.push(rcm_video)
                            }
                        }
                        else {
                            return
                        }
                    })
                    console.log('开始分享视频', share_video_list)
                    for (let video_elem of share_video_list) {
                        try {
                            lottery_setting.prevent_module.share_video_url = video_elem
                            console.log('分享视频：', lottery_setting.prevent_module.share_video_url)
                            await global_var.page.goto(video_elem, { waitUntil: 'networkidle0' })
                            try {
                                await share_video_operator(lottery_setting.prevent_module.share_video_url)
                            }
                            catch (e) {
                                console.warn(e, global_var);
                                throw (e, global_var)
                            }
                            let st = utl.random_choice(lottery_setting.prevent_module.share_video_sleep_time)
                            console.log(`${global_var.user_info.uname}\t当前进度：${share_video_list.indexOf(video_elem)}/${share_video_list.length}`);
                            console.log('休眠', st / 1000, '秒');
                            await sleep(st)
                        }
                        catch (e) {
                            console.warn(`分享单个视频失败，`, e);
                            await sleep(1e3)
                            continue;
                        }
                    }

                }
            },
            create_word_dynamic: async function (content_list, create_times) {
                console.log(`${global_var.user_info.uname}\t分享彩虹屁`)
                let content
                if (!create_times) { create_times = 1 }
                for (let i = 0; i < create_times; i++) {
                    content = utl.random_choice(content_list)
                    if (typeof content != 'string' || !content || content.includes('undefined') || content.includes('null') || content.includes('true') || content.includes('false')) {//检查是否传入的是string类型参数 或者是否为空
                        continue
                    }
                    await global_var.page.goto('https://t.bilibili.com', { waitUntil: 'networkidle0' })
                    for (i = 0; i < 5; i++) {
                        let textarea = await global_var.page.$('.bili-rich-textarea')
                        await textarea.click()
                        await global_var.page.focus('.bili-rich-textarea')
                        await textarea.type(content)
                        await sleep(1e3)
                        let textarea_content = await global_var.page.$eval('.bili-rich-textarea', el => el.textContent)
                        textarea_content = textarea_content.trim()
                        if (textarea_content.slice(1) == content) {
                            await sleep(utl.random_choice(3 * lottery_setting.prevent_module.share_video_sleep_time))
                            await global_var.page.click('.bili-dyn-publishing__action.launcher')
                            console.log(`${global_var.user_info.uname}\t点击了发布动态`);
                            break;
                        }
                        else {//如果不等于要发布的内容就全删了，重新打
                            await global_var.page.focus('.bili-rich-textarea')
                            await global_var.page.keyboard.down('Control');
                            await global_var.page.keyboard.press('A');
                            await global_var.page.keyboard.up('Control');
                            await sleep(1e3)
                            await global_var.page.keyboard.press('Backspace');
                            console.log('输入框里内容与评论不符，删除输入框里内容', `\ntextarea_content:${textarea_content}\ncontent:${content}\n${textarea_content == content}`);
                        }

                        await sleep(3e3);

                    }
                }
            }
        },
        copy_reply_module: {//抄评论模块
            ignore_replies: [//无视掉的抄评论词
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
                `@`,
                `＠`,
            ],
            get_copy_reply: async (dynamic_id_or_BVid, mode, pn_percent) => {
                //dynamic_id_or_BVid:动态id或bv号 mode ：1是热评，2是最新 ，3是混合 pn_percent：评论大致的百分比页数，入参是小数
                let all_replies_content = []
                let ret_reply;//最终返回的评论
                for (let _ = 0; _ <= 3; _++) {
                    //超过就退出,进行随机抽取
                    let reps = await my_operator.copy_reply_module.get_reply_list(dynamic_id_or_BVid, mode, pn_percent);
                    all_replies_content = all_replies_content.concat(reps);
                    if (reps.length <= 10) {//如果只获取到了一半的话，再获取一点，不然样本数量不够
                        reps = await my_operator.copy_reply_module.get_reply_list(dynamic_id_or_BVid, mode, Math.random());
                        all_replies_content = all_replies_content.concat(reps);
                    }
                    ret_reply = utl.weight_rand(all_replies_content);
                    if (!!ret_reply) {
                        break
                    }
                    pn_percent = Math.random()//每次循环设置为随机值，防止一直获取同样内容
                }
                return ret_reply;
            },
            get_reply_list: async (dynamic_id_or_BVid, mode, pn_percent) => {
                let comment_id_str;
                let comment_type;
                let reply_count;
                let up_mid = 0;
                if (!String(dynamic_id_or_BVid).toUpperCase().includes('BV')) {
                    let dynamic_detail_res = await MYAPI.BiliAPI.get_dynamic_v1_detail(String(dynamic_id_or_BVid))
                    //dynamic_detail_res:动态的完整响应 mode ：1是热评，2是最新 ，3是混合 pn_percent：评论大致的百分比页数，入参是小数
                    try {
                        if (dynamic_detail_res.code != 0) {
                            console.warn("获取评论失败", dynamic_detail_res);
                            return []
                        }
                    }
                    catch (e) {
                        console.warn("获取评论失败", dynamic_detail_res, e);
                        return []
                    }
                    comment_id_str = dynamic_detail_res.data.item.basic.comment_id_str
                    comment_type = dynamic_detail_res.data.item.basic.comment_type
                    reply_count = dynamic_detail_res.data.item.modules.module_stat.comment.count
                    try { up_mid = dynamic_detail_res.data.item.modules.module_author.mid }
                    catch (e) { console.warn(e); }
                }
                else {
                    let aid = MYAPI.BiliAPI.BV_AV_trans(dynamic_id_or_BVid);
                    let av_stat = await MYAPI.BiliAPI.archive_stat(aid);
                    try {
                        if (av_stat.code != 0) {
                            console.warn("获取评论失败", dynamic_detail_res);
                            return []
                        }
                    }
                    catch (e) {
                        console.warn("获取评论失败", av_stat, e);
                        return []
                    }
                    comment_id_str = av_stat.data.aid
                    comment_type = '1'
                    reply_count = av_stat.data.reply
                }
                if (reply_count <= 10)//如果10条评论以下就不抄了
                {
                    return []
                }
                let get_comment_range = utl.random_choice(utl.generater_step_Array(parseInt(0.7 * pn_percent * reply_count), parseInt(pn_percent * reply_count), parseInt(0.1 * reply_count) > 0 ? parseInt(0.1 * reply_count) : 1))
                let reply_main_res = await MYAPI.BiliAPI.get_reply_main(mode, get_comment_range, comment_id_str, comment_type)
                try {
                    if (reply_main_res.code != 0) {
                        console.warn("获取评论失败", res);
                        return []
                    }
                }
                catch (e) {
                    console.warn("获取评论失败", reply_main_res, e);
                    return []
                }
                let replies = reply_main_res.data.replies
                let replies_content = [...Array(replies.length)].map(x => undefined);
                for (let repindex = 0; repindex < replies.length; repindex++) {//去除表情包
                    try {
                        MYAPI.fileWrite(`文案/评论响应.csv`, JSON.stringify(replies[repindex]), 'a+')
                    }
                    catch {
                        MYAPI.fileWrite(`文案/评论响应.csv`, JSON.stringify(replies[repindex]), 'w')
                    }
                    if (replies.mid == up_mid) {
                        continue;
                    }
                    replies_content[repindex] = utl.remove_emoji_topic_at(replies[repindex].content.message.replaceAll(replies[repindex].member.uname, global_var.user_info.uname == undefined ? "" : global_var.user_info.uname))
                    //替换内容中包含的用户名
                    if (replies_content[repindex].length == 0) {
                        continue
                    }
                    let bf = false;
                    my_operator.copy_reply_module.ignore_replies.some((val, ind, arr) => {//如果有无视的词直接赋空字符串
                        if (!!val && val.includes(replies_content[repindex])) {
                            bf = true;
                            return true;
                        }
                    })
                    if (bf) {
                        replies_content[repindex] = ""
                        continue;
                    }

                }
                let newArr = [];
                for (let i of replies_content) {
                    if (i) {
                        newArr.push(i);
                    }
                }
                return newArr
            },
            wenxin_paraphrase: async (input_str) => {
                if (!input_str) {
                    return undefined
                }
                let ret_str;
                try {
                    if (!global_var.Baidu_wenxin.access_token) {
                        let resp = await MYAPI.BiliAPI.post(`${global_var.Baidu_wenxin.access_token_api}?grant_type=client_credentials&client_id=${global_var.Baidu_wenxin.API_Key}&client_secret=${global_var.Baidu_wenxin.Secret_key}`)
                        try {
                            if (resp.code != 0) {
                                console.warn(`wenxin_paraphrase`, resp, e);
                                return undefined;
                            }
                            else {
                                global_var.Baidu_wenxin.access_token = resp.data;
                            }
                        }
                        catch (e) {
                            console.warn(`wenxin_paraphrase`, resp, e);
                            return undefined;
                        }
                    }

                    if (global_var.Baidu_wenxin.access_token) { }
                    let res = await MYAPI.BiliAPI.post(`${global_var.Baidu_wenxin.paraphrase_api}?access_token=${global_var.Baidu_wenxin.access_token}`, {
                        text: input_str,
                        async: 1,
                        min_dec_len: 1,
                        seq_len: 128,
                        topp: 0.8,
                        typeId: 1,
                    })
                    if (res.code != 0) {
                        console.warn(`wenxin_paraphrase`, res);
                        return undefined;
                    }
                    let taskId = res.data.taskId
                    while (1) {
                        await sleep(1e3);
                        let result_resp = await MYAPI.BiliAPI.post(`${global_var.Baidu_wenxin.get_result_api}?access_token=${global_var.Baidu_wenxin.access_token}`, {
                            taskId: taskId
                        })
                        if (result_resp.data.status == 1) {
                            ret_str = result_resp.data.result;
                            break;
                        }
                    }
                }
                catch (e) {
                    console.warn(`同义词改写wenxin_paraphrase出错`, e);
                }
                return ret_str;
            },
            copy_reply_judge: (dynamic_content) => {
                let manual_re67 = /.*评((?!抽奖|,|，).){0,7}“|.*评((?!抽奖|,|，).){0,7}【|.*评((?!抽奖|,|，).){0,7}:|.*评((?!抽奖|,|，).){0,7}：|.*评((?!抽奖|,|，).){0,7}「|.*带关键词.{0,7}"|.*留言((?!抽奖|,|，).){0,7}“|.*对出.{0,10}下联.{0,5}横批|.*回答.{0,8}问题|.*留下.{0,10}祝福语|.*留下.{0,10}愿望|.*找到.{0,10}不同的.{0,10}留言|.*答案放在评论区|.*几.{0,5}呢？|.*有奖问答|.*想到.{0,19}关于.{0,20}告诉|.*麻烦大伙评论这个|留下.{0,7}的/gmi.test(dynamic_content)
                let manual_re76 = /.*留下((?!抽奖|,|，).){0,5}“|.*留下((?!抽奖|,|，).){0,5}【|.*留下((?!抽奖|,|，).){0,5}:|.*留下((?!抽奖|,|，).){0,5}：|.*留下((?!抽奖|,|，).){0,5}「/gmi.test(dynamic_content)
                let manual_re77 = /.*留言((?!抽奖|,|，).).{0,7}“|.*留言((?!抽奖|,|，).){0,7}【|.*留言((?!抽奖|,|，).){0,7}:|.*留言((?!抽奖|,|，).){0,7}：|.*留言((?!抽奖|,|，).){0,7}「/gmi.test(dynamic_content)
                let manual_re6 = /.*@.{0,15}朋友|.*艾特|.*@.{0,3}你的|.*标记.{0,10}朋友|.*@{0,15}赞助商|.*发表你的新年愿望\+个人的昵称|.*抽奖规则请仔细看图片|.*带上用户名|.*此视频|.*视频评论区/gmi.test(dynamic_content)
                let manual_re75 = /.*互动话题|.*互动留言|.*互动时间|.*认真答题/gmi.test(dynamic_content)

                return !(manual_re6 || manual_re67 || manual_re75 || manual_re76 || manual_re77)
            }
        },
    };

    async function account_init() {
        let cookieStr = await MYAPI.cookieSetting.getCookie(lottery_setting.CONFIG.COOKIENAME)
        //let ext1 = 'C:/Users/Acer/AppData/Local/Google/Chrome/User Data/Default/Extensions/lanfdkkpgfjfdikkncbnojekcppdebfp/0.2.0_1';
        let useragent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36"
        let browser;
        for (let retry = 0; retry <= 5; retry++) {//五次重试启动浏览器的机会
            try {
                if (lottery_setting.CONFIG.UserDataDir) {
                    browser = await puppeteer.launch(
                        {
                            executablePath: `C:\\Users\\Acer\\AppData\\Local\\Google\\Chrome SxS\\Application\\chrome.exe`,//浏览器路径
                            //executablePath:`C:\\Program Files\\Google\\Chrome Dev\\Application\\chrome.exe`,
                            headless: true,//false为显示浏览器界面
                            defaultViewport: {
                                width: 2560,
                                height: 1440,
                            },
                            args: [
                                `--start-stack-profiler`,
                                //`--load-extension=${ext1}`,
                                '--disable-notifications=true',
                                '--no-sandbox',
                                '--disable-infobars',
                                '--disable-session-crashed-bubble',
                                '--disable-setuid-sandbox',
                                '--disable-web-security',
                                '--disable-gpu',
                                '--disable-dev-shm-usage',
                                '--no-first-run',
                                '--mute-audio',
                                '--no-zygote',
                                //'--single-process',
                                `--profile-directory=${lottery_setting.CONFIG.ProfileDir}`,
                                "--disable-features=IsolateOrigins,site-per-process",
                                `--start-maximized`,
                            ],
                            userDataDir: "UserData\\" + lottery_setting.CONFIG.COOKIENAME,
                            ignoreDefaultArgs: [
                                '--enable-automation',
                                '--disable-extensions'
                            ],
                            dumpio:true,
                            timeout:60000,
                            ignoreHTTPSErrors: true,
                        });
                    global_var.browser = browser
                    let page = await browser.newPage();
                    global_var.page = page
                    //await global_var.page.setUserAgent(useragent);
                }
                else {
                    browser = await puppeteer.launch(
                        {
                            executablePath: "C:/Users/Acer/AppData/Local/Google/Chrome SxS/Application/chrome.exe",//浏览器路径
                            headless: false,//false为显示浏览器界面
                            defaultViewport: {
                                width: 2560,
                                height: 1440,
                            },
                            args: [
                                `--start-stack-profiler`,
                                //`--load-extension=${ext1}`,
                                '--disable-notifications=true',
                                '--no-sandbox',
                                '--disable-infobars',
                                '--disable-session-crashed-bubble',
                                '--disable-setuid-sandbox',
                                '--disable-web-security',
                                '--disable-gpu',
                                '--disable-dev-shm-usage',
                                '--no-first-run',
                                '--mute-audio',
                                '--no-zygote',
                                //'--single-process',
                                `--profile-directory=${lottery_setting.CONFIG.ProfileDir}`,
                                "--disable-features=IsolateOrigins,site-per-process",
                                `--start-maximized`,
                            ],
                            ignoreDefaultArgs: [
                                '--enable-automation',
                                '--disable-extensions',
                            ],
                            dumpio:true,
                            timeout:60000,
                            ignoreHTTPSErrors: true,
                        });
                    global_var.browser = browser
                    let page = await browser.newPage();
                    global_var.page = page
                    //await global_var.page.setUserAgent(useragent);
                    let ck = MYAPI.browserSetting.getCookies(cookieStr, '.bilibili.com')
                    for (let singleck of ck) {
                        if (singleck.name != '') { await global_var.page.setCookie(singleck); }
                    }
                }
                break;
            }
            catch (e) {
                console.log(lottery_setting.CONFIG.COOKIENAME, "浏览器启动失败");
                console.warn(e);
                await sleep(10e3);
                continue
            }
        }
        global_var.page.on('response', async response => {//拦截响应的响应
            let url = response.url();
            try {
                if (url.includes(`/x/polymer/web-dynamic/v1/detail?`)) {
                    try {
                        global_var.response.global_dynamic_data = (await response.json()).data
                    }
                    catch (e) {
                        global_var.response.global_dynamic_data = undefined;
                        throw (`global_dynamic_data', ${e}, ${global_var.user_info.uname}`);
                    }
                }
                if (url.includes("/x/dynamic/feed/create/dyn") || url.includes("/v1/dynamic_repost/reply")) {
                    let req = await response.request();
                    if ((await req.method()).toLowerCase() != "post") {
                        console.log(await (await response.request()).method());
                        return;
                    }
                    try {
                        console.log(`转发动态response：\t${await response.text()}`);
                        global_var.response.create_dyn_response = JSON.parse(await response.text())
                    }
                    catch (e) {
                        console.warn(`抓取转发动态response失败：\n${e}\n${await response.text()}`);
                        //global_var.response.create_dyn_response = undefined;
                        throw (`create_dyn_response, ${e}, ${global_var.user_info.uname}`);
                    }
                    //console.log('动态转发响应',global_var.response.comment_dyn_response);
                }
                if (url.includes("/x/v2/reply/add")) {
                    try {
                        global_var.response.comment_dyn_response = await response.json()
                    }
                    //console.log('动态评论响应',global_var.response.comment_dyn_response);
                    catch (e) {
                        console.warn(`抓取评论动态response失败：\n${e}\n${await response.text()}`);
                        //global_var.response.create_dyn_response = undefined;
                        throw (`comment_dyn_response, ${e}, ${global_var.user_info.uname}`);
                    }
                }
                if (url.includes("/x/v2/reply/main")) {
                    try {
                        global_var.reply_main = JSON.parse(await response.text())
                    }
                    catch {
                        try {
                            global_var.reply_main = JSON.parse(/.*?\((.*)\)/gmi.exec(await response.text()).slice(1).join(''))
                        } catch (e) {
                            throw (`reply_main, ${await response.text()}, ${e}`);
                        }
                    }
                    //console.log(`获取评论响应：`, global_var.reply_main);
                }
                if (url.includes("/x/web-interface/nav")) {
                    if (await response.text()) {
                        global_var.user_nav = JSON.parse(await response.text())
                    }
                    try {
                        global_var.user_info.uid = global_var.user_nav.data.mid
                        global_var.user_info.uname = global_var.user_nav.data.uname
                    }
                    catch {
                        global_var.user_info.uid = undefined
                        global_var.user_info.uname = undefined
                        console.warn(global_var.user_nav, `获取登陆信息失败，cookie可能过期`)
                    }
                }
                if (url.includes("/x/relation/modify")) {
                    try {
                        global_var.response.relation_modify_response = await response.json()
                    }
                    //console.log('关注响应',global_var.response.relation_modify_response);
                    catch (e) {
                        global_var.response.relation_modify_response = undefined;
                        throw (`relation_modify_response, ${e}, ${global_var.user_info.uname}`);
                    }

                }
                if (url.includes("/dynamic_like/v1/dynamic_like/thumb")) {
                    try {
                        global_var.response.dynamic_thumb_response = await response.json()
                    }
                    //console.log('动态点赞响应',global_var.response.dunamic_thumb_response);
                    catch (e) {
                        global_var.response.dynamic_thumb_response = undefined;
                        throw (`global_dynamic_data, ${e}, ${global_var.user_info.uname}`);
                    }
                }
            }
            catch (e) {
                console.warn(e)
            }

        })
        await global_var.page.goto('https://www.bilibili.com')

        for (let i = 0; i < 5; i++) {
            if (global_var.user_info.uname) {
                console.log(global_var.user_info.uname, "账号初始化完成");
                global_var.pagelist.push(global_var.page)
                return;
            }
            await sleep(1e3)
        }

        if (global_var.user_info.uname) {
            console.log(global_var.user_info.uid, global_var.user_info.uname, "登陆成功！");
        }
        else {
            throw (`${lottery_setting.CONFIG.COOKIENAME}登陆信息获取失败`)
        }
    }




    ///////////////////////////////////////////////////////////////
    let lottery_setting;
    eval(lottery_setting_string);//设置全局的抽奖参数
    ///////////////////////////////////////////////////////////////
    (async () => {

        async function browser_Disconnected(br) {//浏览器断开连接时返回false
            while (1) {
                if (!br.disconnect()) {
                    return false
                }
                await sleep(100e3)
            }
        }
        let loop_play = async function (page) {
            for (let i = 0; i < 5; i++) {
                try {
                    await sleep(3e3);
                    let bpx_player_ctrl_setting = await page.$(`.bpx-player-ctrl-btn.bpx-player-ctrl-setting`)
                    for (let j = 0; j < 5; j++) {
                        try {
                            await bpx_player_ctrl_setting.hover();
                            let loop_btn = await page.$(`.bui-switch-input[aria-label="洗脑循环"]`)
                            if ((await page.$eval(`.bui-switch-input[aria-label="洗脑循环"]`, el => el.checked))) {
                                console.log(`${global_var.user_info.uname} ${await page.url()} 已开启自动循环`);

                                let video =await page.$(`video`)
                                let t1 = await page.$eval(`video`, el => el.currentTime);
                                await sleep(3e3);
                                let t2 = await page.$eval(`video`, el => el.currentTime);
                                if (t2-t1<3) {
                                    await video.click();
                                }
                                return;
                            }
                            else {
                                await loop_btn.click();
                            }
                        }
                        catch(e){
                            console.warn(`${global_var.user_info.uname} ${await page.url()} 点击洗脑循环开关失败，大概率是因为没有hover显示出相应的按钮`);
                            await sleep(1e3);
                        }
                    }
                }
                catch (e) {
                    console.warn(`${global_var.user_info.uname} ${await page.url()} 视频循环播放失败`, e);
                    await sleep(3e3);
                }
            }
        }
        let watch_video = async function () {
            let urllist = await MYAPI.fileRead.lottery_dynamic_ids(`浏览视频网址.csv`);
            for (let i = 0; i < urllist.length - 1; i++) {
                global_var.pagelist.push(await global_var.browser.newPage())
            }
            for (let i in global_var.pagelist) {
                let temppage = global_var.pagelist[i]
                await temppage.bringToFront();
                await temppage.goto(urllist[i], { 'waitUntil': 'networkidle2' })
                await loop_play(temppage);
            }
            // let i=0
            // for (let page of global_var.pagelist){
            //     await page.pdf({path: `${__dirpath}page${i}.pdf`,width:1440});
            //     i++
            // }
        }

        async function Init() {
            //await sleep(3600e3)

            try {
                await account_init()
            }
            catch (e) {
                console.log(e, "account_init");
            }
            if (broswer_mode) { return; }//如果是打开浏览器模式则直接退出抽奖
            if (!global_var.user_info.uname) { return }//如果登陆信息获取失败直接退出
            await watch_video()
            await browser_Disconnected(global_var.browser);
        }
        await Init()
    })()
};

let lottery_setting_file_reader = async function (filename) {
    let path = `${__dirpath}lottery_setting/${filename}.txt`
    let data = fs.readFileSync(path, function (err) {
        if (err) {
            console.log(err);
            throw (err);
        }
        //console.log(data.toString());
    }).toString()
    return data
};

let mainFunc = async function (lottery_setting_filename, broswer_mode = false) {
    try {
        let lottery_settingstr = await lottery_setting_file_reader(lottery_setting_filename)
        await watch_video_launch(lottery_settingstr, broswer_mode)
    }
    catch (e) {
        console.log(e, lottery_setting_filename, Date());
    }
};




(async function () {
    let lottery_setting_filename_list = [
        'lottery_setting3',//抽奖设置的名称
        //'lottery_setting2',
        //'lottery_setting5',
        //'lottery_setting6',
    ]
    let broswer_mode = false;//是否只打开浏览器，不进行抽奖
    for (let i of lottery_setting_filename_list) {
        console.log(i);
        if (!broswer_mode) {
            if (i != lottery_setting_filename_list.slice(-1)) {
                mainFunc(i, broswer_mode);
            }
            else {
                await mainFunc(i, broswer_mode);
            }
        }
        else {
            mainFunc(i, broswer_mode);
            await sleep(3e3);
        }
    }
})();
