const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const stealth = StealthPlugin();
stealth.enabledEvasions.delete('user-agent-override');
puppeteer.use(StealthPlugin());
const superagent = require('superagent');
let HTMLOP = require('./util/HTMLop')
const fs = require('fs');
const axios = require('axios');
const unfollow_op = require('./取关脚本/unfollow');
const QueryWbiEnc = require('../lib/helper/encbiliWbiQuery');
const { string } = require('synonyms/dictionary');
//导入包
const __dirpath = './木偶模块/';
if (!fs.existsSync(__dirpath)) {
    //创建文件目录
    fs.mkdirSync(__dirpath);
}
if (!fs.existsSync(__dirpath + 'cookie_file')) {
    //创建文件目录
    fs.mkdirSync(__dirpath + 'cookie_file');
}
if (!fs.existsSync(__dirpath + 'log')) {
    //创建文件目录
    fs.mkdirSync(__dirpath + 'log');
}
if (!fs.existsSync(__dirpath + '抽奖记录')) {
    //创建文件目录
    fs.mkdirSync(__dirpath + '抽奖记录');
}
if (!fs.existsSync(__dirpath + '抽奖记录/官方抽奖记录')) {
    //创建文件目录
    fs.mkdirSync(__dirpath + '抽奖记录/官方抽奖记录');
}
if (!fs.existsSync(__dirpath + '抽奖记录/必抽的大奖记录')) {
    //创建文件目录
    fs.mkdirSync(__dirpath + '抽奖记录/必抽的大奖记录');
}
if (!fs.existsSync(__dirpath + '抽奖记录/必抽的预约抽奖记录')) {
    //创建文件目录
    fs.mkdirSync(__dirpath + '抽奖记录/必抽的预约抽奖记录');
}
if (!fs.existsSync(__dirpath + 'JsonData')) {
    //创建文件目录
    fs.mkdirSync(__dirpath + 'JsonData');
}
//设置项目路径和必要的文件夹
function sleep(ms) {
    return new Promise(resolve => setTimeout(() => resolve(sleep), ms));
}
/**
 * 初始化账号，开启抽奖
 * @param {*} lottery_setting_string 
 * @param {*} broswer_mode 
 */


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


class DO_Lottery {
    /**
     * 
     * @param {String} lottery_name 
     * @param {number} broswer_mode 
     * @param {boolean} opus动态标志 
     */
    constructor(lottery_name, broswer_mode, opus动态标志) {
        this.lottery_name = lottery_name;
        this.broswer_mode = broswer_mode;
        this.opus动态标志 = opus动态标志;
        this.global_page;
        this.lotFlag;
    }

    _setGlobalPage = (pageHandler) => {
        this.global_page = pageHandler;
    }
    /**
     * true代表正在抽奖中，false代表抽完了
     * @param {boolean} lotFlag - true代表正在抽奖中，false代表抽完了
     */
    _setLotFlag = (lotFlag) => {
        this.lotFlag = lotFlag;
    }
    unfollow_module = async () => {
        const global_var = {
            page: undefined,//创建的网页
            browser: undefined,//创建的浏览器
            pageurl: '',//抽奖网址
            dynamic_id: 0,
            TIME: {
                Init_Time: new Date(Date.now()),
                /**@property 非抽奖时间段*/
                None_Lottery_Time: ["2:00", "9:00"],
                /**@property 参加x秒以内必须参加的预约抽奖 */
                Reserve_Lottery_time: 7 * 3600 * 24,
            },
            /**@property 所有的响应类 */
            response: {
                /**@property 全局的动态数据 */
                global_dynamic_data: undefined,//全局的动态数据
                /**@property 创建或转发动态的响应 */
                create_dyn_response: undefined,//创建或转发动态的响应
                /**@property 自己评论动态的响应 */
                comment_dyn_response: undefined,//自己评论动态的响应
                /**@property 关注响应 */
                relation_modify_response: undefined,//关注响应
                /**@property 点赞动态响应 */
                dynamic_thumb_response: undefined,//点赞动态响应
                /**@property 空间预约响应 */
                space_reservation: undefined,//空间预约响应
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
        let utl = {
            /**
             * 检查是否在时间段内
             * @param {string} beginTime xx:xx格式的开始时间
             * @param {string} endTime xx:xx格式的结束时间
             * @returns 
             */
            checkAuditTime: function (beginTime, endTime) {
                var nowDate = new Date();
                var beginDate = new Date(nowDate);
                var endDate = new Date(nowDate);

                var beginIndex = beginTime.lastIndexOf("\:");
                var beginHour = beginTime.substring(0, beginIndex);
                var beginMinue = beginTime.substring(beginIndex + 1, beginTime.length);
                beginDate.setHours(beginHour, beginMinue, 0, 0);

                var endIndex = endTime.lastIndexOf("\:");
                var endHour = endTime.substring(0, endIndex);
                var endMinue = endTime.substring(endIndex + 1, endTime.length);
                endDate.setHours(endHour, endMinue, 0, 0);
                return nowDate.getTime() - beginDate.getTime() >= 0 && nowDate.getTime() <= endDate.getTime();
            },
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
            /**
             * 移除表情包和话题和@，之后重新添加获取到的话题
             * @param {String} origin_str 
             * @returns {String} 
             */
            remove_emoji_topic_at: (origin_str) => {
                if (origin_str) {
                    origin_str = origin_str.replaceAll(/＠/gmi, '@')
                    origin_str = origin_str.replaceAll(/【/gmi, '[')
                    origin_str = origin_str.replaceAll(/】/gmi, ']')
                    let at_re = new RegExp(`@${global_var.user_info.uname}`, 'gmi')
                    if (!at_re.test(origin_str)) {//如果没有@自己的尝试将@后面内容替换
                        origin_str = origin_str.replace(/@.{0,12}? |@.{0,12}$/gmi, function (match) {
                            return '@' + utl.random_choice(lottery_setting.at_member) + ' '
                        })
                    }
                    origin_str = origin_str.replaceAll('＃', '#')
                    return origin_str.replaceAll(/(\[(?<=\[)(.*?)(?=\])])/gmi, "").replaceAll(/(\#(?<=#)(.*?)(?=#)#)/gmi, '')
                }
                else {
                    console.warn(`${global_var.user_info.uname}\t提取@和表情出错\t${origin_str}`)
                    return origin_str
                }
            },
            weight_rand: (input_list) => {//根据输入列表的次数的平方设置权重抽取
                try {
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
                }
                catch (e) {
                    return undefined
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
                            module_dynamic: {},
                            module_stat: {}
                        },
                        type: undefined,
                        visible: true
                    }
                }
                let opus_init_detail
                for (let i = 0; i < 3; i++) {
                    try {
                        opus_init_detail = await global_var.page.evaluate(`window.__INITIAL_STATE__`)
                        if (opus_init_detail) {
                            break;
                        }
                        else {
                            await sleep(10e3)
                        }
                    }
                    catch (e) {
                        console.warn(e);
                        await sleep(10e3)
                    }
                }

                polymer_detail_data.item.basic = opus_init_detail.detail.basic;
                polymer_detail_data.item.id_str = opus_init_detail.detail.id_str;
                for (let opus_init of opus_init_detail.detail.modules) {
                    switch (opus_init.module_type) {
                        case "MODULE_TYPE_AUTHOR": {
                            polymer_detail_data.item.modules.module_author = opus_init.module_author;
                            polymer_detail_data.item.modules.module_author.official_verify = opus_init.module_author.official;
                            break;
                        }
                        case "MODULE_TYPE_CONTENT": {
                            let text = [];
                            for (let node of opus_init.module_content.paragraphs[0].text.nodes) {
                                switch (node.type) {
                                    case "TEXT_NODE_TYPE_WORD": {
                                        text.push(node.word.words)
                                        break;
                                    }
                                    case "TEXT_NODE_TYPE_RICH": {
                                        text.push(node.rich.text)
                                        break;
                                    }
                                }
                            }
                            // polymer_detail_data.item.modules.module_dynamic.desc = {
                            //     rich_text_nodes: opus_init.module_content.paragraphs[0].text.nodes,
                            //     text: text.join('')
                            // };
                            polymer_detail_data.item.modules.module_dynamic.major = {
                                opus: {
                                    summary: {
                                        rich_text_nodes: opus_init.module_content.paragraphs[0].text.nodes,
                                        text: text.join('')
                                    }
                                }
                            }
                            break;
                        }
                        case "MODULE_TYPE_STAT": {
                            polymer_detail_data.item.modules.module_stat = opus_init.module_stat;
                            break;
                        }
                    }
                }
                return polymer_detail_data
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
                            newArr.push(arr[i])
                        }
                    }
                    return newArr
                }
                catch (e) {
                    console.warn(e, `${global_var.user_info.uname}\tnoRepeat`);
                }
                return newArr
            },
            /**
             * 去除所有不可见字符
             * @param {*} origin_str 
             * @returns 
             */
            remove_invisible_char(origin_str) {
                let reg = /[\0-\x1F\x7F-\x9F\xAD\u0378\u0379\u037F-\u0383\u038B\u038D\u03A2\u0528-\u0530\u0557\u0558\u0560\u0588\u058B-\u058E\u0590\u05C8-\u05CF\u05EB-\u05EF\u05F5-\u0605\u061C\u061D\u06DD\u070E\u070F\u074B\u074C\u07B2-\u07BF\u07FB-\u07FF\u082E\u082F\u083F\u085C\u085D\u085F-\u089F\u08A1\u08AD-\u08E3\u08FF\u0978\u0980\u0984\u098D\u098E\u0991\u0992\u09A9\u09B1\u09B3-\u09B5\u09BA\u09BB\u09C5\u09C6\u09C9\u09CA\u09CF-\u09D6\u09D8-\u09DB\u09DE\u09E4\u09E5\u09FC-\u0A00\u0A04\u0A0B-\u0A0E\u0A11\u0A12\u0A29\u0A31\u0A34\u0A37\u0A3A\u0A3B\u0A3D\u0A43-\u0A46\u0A49\u0A4A\u0A4E-\u0A50\u0A52-\u0A58\u0A5D\u0A5F-\u0A65\u0A76-\u0A80\u0A84\u0A8E\u0A92\u0AA9\u0AB1\u0AB4\u0ABA\u0ABB\u0AC6\u0ACA\u0ACE\u0ACF\u0AD1-\u0ADF\u0AE4\u0AE5\u0AF2-\u0B00\u0B04\u0B0D\u0B0E\u0B11\u0B12\u0B29\u0B31\u0B34\u0B3A\u0B3B\u0B45\u0B46\u0B49\u0B4A\u0B4E-\u0B55\u0B58-\u0B5B\u0B5E\u0B64\u0B65\u0B78-\u0B81\u0B84\u0B8B-\u0B8D\u0B91\u0B96-\u0B98\u0B9B\u0B9D\u0BA0-\u0BA2\u0BA5-\u0BA7\u0BAB-\u0BAD\u0BBA-\u0BBD\u0BC3-\u0BC5\u0BC9\u0BCE\u0BCF\u0BD1-\u0BD6\u0BD8-\u0BE5\u0BFB-\u0C00\u0C04\u0C0D\u0C11\u0C29\u0C34\u0C3A-\u0C3C\u0C45\u0C49\u0C4E-\u0C54\u0C57\u0C5A-\u0C5F\u0C64\u0C65\u0C70-\u0C77\u0C80\u0C81\u0C84\u0C8D\u0C91\u0CA9\u0CB4\u0CBA\u0CBB\u0CC5\u0CC9\u0CCE-\u0CD4\u0CD7-\u0CDD\u0CDF\u0CE4\u0CE5\u0CF0\u0CF3-\u0D01\u0D04\u0D0D\u0D11\u0D3B\u0D3C\u0D45\u0D49\u0D4F-\u0D56\u0D58-\u0D5F\u0D64\u0D65\u0D76-\u0D78\u0D80\u0D81\u0D84\u0D97-\u0D99\u0DB2\u0DBC\u0DBE\u0DBF\u0DC7-\u0DC9\u0DCB-\u0DCE\u0DD5\u0DD7\u0DE0-\u0DF1\u0DF5-\u0E00\u0E3B-\u0E3E\u0E5C-\u0E80\u0E83\u0E85\u0E86\u0E89\u0E8B\u0E8C\u0E8E-\u0E93\u0E98\u0EA0\u0EA4\u0EA6\u0EA8\u0EA9\u0EAC\u0EBA\u0EBE\u0EBF\u0EC5\u0EC7\u0ECE\u0ECF\u0EDA\u0EDB\u0EE0-\u0EFF\u0F48\u0F6D-\u0F70\u0F98\u0FBD\u0FCD\u0FDB-\u0FFF\u10C6\u10C8-\u10CC\u10CE\u10CF\u1249\u124E\u124F\u1257\u1259\u125E\u125F\u1289\u128E\u128F\u12B1\u12B6\u12B7\u12BF\u12C1\u12C6\u12C7\u12D7\u1311\u1316\u1317\u135B\u135C\u137D-\u137F\u139A-\u139F\u13F5-\u13FF\u169D-\u169F\u16F1-\u16FF\u170D\u1715-\u171F\u1737-\u173F\u1754-\u175F\u176D\u1771\u1774-\u177F\u17DE\u17DF\u17EA-\u17EF\u17FA-\u17FF\u180F\u181A-\u181F\u1878-\u187F\u18AB-\u18AF\u18F6-\u18FF\u191D-\u191F\u192C-\u192F\u193C-\u193F\u1941-\u1943\u196E\u196F\u1975-\u197F\u19AC-\u19AF\u19CA-\u19CF\u19DB-\u19DD\u1A1C\u1A1D\u1A5F\u1A7D\u1A7E\u1A8A-\u1A8F\u1A9A-\u1A9F\u1AAE-\u1AFF\u1B4C-\u1B4F\u1B7D-\u1B7F\u1BF4-\u1BFB\u1C38-\u1C3A\u1C4A-\u1C4C\u1C80-\u1CBF\u1CC8-\u1CCF\u1CF7-\u1CFF\u1DE7-\u1DFB\u1F16\u1F17\u1F1E\u1F1F\u1F46\u1F47\u1F4E\u1F4F\u1F58\u1F5A\u1F5C\u1F5E\u1F7E\u1F7F\u1FB5\u1FC5\u1FD4\u1FD5\u1FDC\u1FF0\u1FF1\u1FF5\u1FFF\u200B-\u200F\u202A-\u202E\u2060-\u206F\u2072\u2073\u208F\u209D-\u209F\u20BB-\u20CF\u20F1-\u20FF\u218A-\u218F\u23F4-\u23FF\u2427-\u243F\u244B-\u245F\u2700\u2B4D-\u2B4F\u2B5A-\u2BFF\u2C2F\u2C5F\u2CF4-\u2CF8\u2D26\u2D28-\u2D2C\u2D2E\u2D2F\u2D68-\u2D6E\u2D71-\u2D7E\u2D97-\u2D9F\u2DA7\u2DAF\u2DB7\u2DBF\u2DC7\u2DCF\u2DD7\u2DDF\u2E3C-\u2E7F\u2E9A\u2EF4-\u2EFF\u2FD6-\u2FEF\u2FFC-\u2FFF\u3040\u3097\u3098\u3100-\u3104\u312E-\u3130\u318F\u31BB-\u31BF\u31E4-\u31EF\u321F\u32FF\u4DB6-\u4DBF\u9FCD-\u9FFF\uA48D-\uA48F\uA4C7-\uA4CF\uA62C-\uA63F\uA698-\uA69E\uA6F8-\uA6FF\uA78F\uA794-\uA79F\uA7AB-\uA7F7\uA82C-\uA82F\uA83A-\uA83F\uA878-\uA87F\uA8C5-\uA8CD\uA8DA-\uA8DF\uA8FC-\uA8FF\uA954-\uA95E\uA97D-\uA97F\uA9CE\uA9DA-\uA9DD\uA9E0-\uA9FF\uAA37-\uAA3F\uAA4E\uAA4F\uAA5A\uAA5B\uAA7C-\uAA7F\uAAC3-\uAADA\uAAF7-\uAB00\uAB07\uAB08\uAB0F\uAB10\uAB17-\uAB1F\uAB27\uAB2F-\uABBF\uABEE\uABEF\uABFA-\uABFF\uD7A4-\uD7AF\uD7C7-\uD7CA\uD7FC-\uF8FF\uFA6E\uFA6F\uFADA-\uFAFF\uFB07-\uFB12\uFB18-\uFB1C\uFB37\uFB3D\uFB3F\uFB42\uFB45\uFBC2-\uFBD2\uFD40-\uFD4F\uFD90\uFD91\uFDC8-\uFDEF\uFDFE\uFDFF\uFE1A-\uFE1F\uFE27-\uFE2F\uFE53\uFE67\uFE6C-\uFE6F\uFE75\uFEFD-\uFF00\uFFBF-\uFFC1\uFFC8\uFFC9\uFFD0\uFFD1\uFFD8\uFFD9\uFFDD-\uFFDF\uFFE7\uFFEF-\uFFFB\uFFFE\uFFFF]/g
                return origin_str.replaceAll(reg, '');
            }
        }

        let lottery_settingstr = await lottery_setting_file_reader(this.lottery_name)
        let lottery_setting;
        eval(lottery_settingstr);//设置全局的抽奖参数

        async function account_init() {
            let cookieStr;
            try {
                cookieStr = await MYAPI.cookieSetting.getCookie(lottery_setting.CONFIG.COOKIENAME)
            } catch {
            }
            //let ext1 = 'C:/Users/Acer/AppData/Local/Google/Chrome/User Data/Default/Extensions/lanfdkkpgfjfdikkncbnojekcppdebfp/0.2.0_1';
            let useragent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36"
            let browser;
            let __args = []
            if (lottery_setting.CONFIG.proxy) {
                __args.push(`--proxy-server=${lottery_setting.CONFIG.proxy}`)
            }
            __args.push(
                `--start-stack-profiler`,
                //`--load-extension=${ext1}`,
                '--disable-notifications=true',
                // '--no-sandbox',
                '-–ignore-certificate-errors',
                '--disable-infobars',
                '--disable-session-crashed-bubble',
                // '--disable-web-security',
                '--disable-gpu',
                '--disable-dev-shm-usage',
                '--no-first-run',
                //'--mute-audio',
                '--disable-extensions',
                '--no-zygote',
                "--disable-xss-auditor",
                '--disable-popup-blocking',
                // '--disable-setuid-sandbox',
                //'--disable-accelerated-2d-canvas',
                // '--single-process',
                `--profile-directory=${lottery_setting.CONFIG.ProfileDir}`,
                // "--disable-features=IsolateOrigins,site-per-process",
                `--start-maximized`,
                '--disable-infobars',
                '--window-position=0,0',
                '--ignore-certifcate-errors',
                '--ignore-certifcate-errors-spki-list',
            )
            for (let retry = 0; retry <= 5; retry++) {//五次重试启动浏览器的机会
                try {
                    if (lottery_setting.CONFIG.UserDataDir) {
                        browser = await puppeteer.launch(
                            {
                                executablePath: `C:\\Users\\Acer\\AppData\\Local\\Google\\Chrome SxS\\Application\\chrome.exe`,//浏览器路径
                                //executablePath:`C:\\Program Files\\Google\\Chrome Dev\\Application\\chrome.exe`,
                                headless: false,//false为显示浏览器界面
                                defaultViewport: {//分辨率
                                    width: 1920,
                                    height: 1080,
                                },
                                args: __args,
                                userDataDir: "UserData\\" + lottery_setting.CONFIG.COOKIENAME,
                                ignoreDefaultArgs: [
                                    '--enable-automation',
                                    '--disable-extensions',
                                    '--disable-client-side-phishing-detection',
                                    '--disable-sync',
                                ],
                                ignoreHTTPSErrors: true,
                            });
                        global_var.browser = browser
                        let page = await browser.newPage();
                        global_var.page = page;
                        //await global_var.page.setUserAgent(useragent);
                    }
                    else {
                        browser = await puppeteer.launch(
                            {
                                executablePath: "C:/Users/Acer/AppData/Local/Google/Chrome SxS/Application/chrome.exe",//浏览器路径
                                headless: false,//false为显示浏览器界面
                                defaultViewport: {
                                    width: 1920,
                                    height: 1080,
                                },
                                args: [
                                    `--start-stack-profiler`,
                                    //`--load-extension=${ext1}`,
                                    '--disable-notifications=true',
                                    // '--no-sandbox',
                                    '-–ignore-certificate-errors',
                                    '--disable-infobars',
                                    '--disable-session-crashed-bubble',
                                    // '--disable-web-security',
                                    '--disable-gpu',
                                    '--disable-dev-shm-usage',
                                    '--no-first-run',
                                    //'--mute-audio',
                                    '--no-zygote',
                                    // '--single-process',
                                    `--profile-directory=${lottery_setting.CONFIG.ProfileDir}`,
                                    // "--disable-features=IsolateOrigins,site-per-process",
                                    `--start-maximized`,
                                ],
                                ignoreDefaultArgs: [
                                    '--enable-automation',
                                    '--disable-extensions',
                                    '--disable-client-side-phishing-detection',
                                    '--disable-sync',
                                ],
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
            await global_var.page.setRequestInterception(true);
            global_var.page.on('response', async response => {//拦截响应的响应
                let url = response.url();
                try {
                    if (url.includes(`/x/polymer/web-dynamic/v1/detail?`)) {
                        try {
                            global_var.response.global_dynamic_data = (await response.json()).data
                        }
                        catch (e) {
                            global_var.response.global_dynamic_data = undefined;
                            throw (`${global_var.user_info.uname}\t${url}\tglobal_dynamic_data\n${e}`);
                        }
                    }
                    if (url.includes("/x/dynamic/feed/create/dyn") || url.includes("dynamic_repost/reply")) {
                        let req = await response.request();
                        if ((await req.method()).toLowerCase() != "post") {
                            console.log(await (await response.request()).method());
                            return;
                        }
                        try {
                            global_var.response.create_dyn_response = JSON.parse(await response.text())
                            console.log(`${global_var.user_info.uname}\t转发动态response：\n${JSON.stringify(global_var.response.create_dyn_response)}\n转发生成的动态链接：https://t.bilibili.com/${global_var.response.create_dyn_response.data.dynamic_id_str || global_var.response.create_dyn_response.data.dyn_id_str}`);
                        }
                        catch (e) {
                            console.warn(`${global_var.user_info.uname}\t抓取转发动态response失败：\n${e}\n${await response.text()}`);
                            //global_var.response.create_dyn_response = undefined;
                            throw (`${global_var.user_info.uname}\tcreate_dyn_response, ${e}, ${global_var.user_info.uname}`);
                        }
                    }
                    if (url.includes("/x/v2/reply/add")) {
                        try {
                            let response_json = await response.json();
                            global_var.response.comment_dyn_response = response_json;
                            global_var.FLAG.评论响应标志 = true
                            let oid;
                            let type;
                            let rpid;
                            try {
                                type = response_json.data.reply.type
                            }
                            catch {
                                throw (`评论响应type获取出错`)
                            }
                            try {
                                oid = response_json.data.reply.oid
                            }
                            catch {
                                try {
                                    oid = global_var.response.global_dynamic_data.item.basic.comment_id_str
                                }
                                catch {
                                    //throw (`评论响应oid获取出错`)
                                }
                            }
                            try {
                                rpid = response_json.data.reply.rpid_str
                            }
                            catch {
                                //throw (`评论响应rpid获取出错`)
                            }
                            console.log(`${global_var.user_info.uname}\t获取到评论响应：\t${(new Date()).toLocaleTimeString()}\n`,
                                `检查阿瓦隆链接：https://api.bilibili.com/x/v2/reply/jump?type=${type}&oid=${oid}&rpid=${rpid}`
                            )
                        }
                        //console.log('动态评论响应',global_var.response.comment_dyn_response);
                        catch (e) {
                            global_var.FLAG.评论响应标志 = false;
                            console.warn(`${global_var.user_info.uname}\t抓取评论动态response失败：\n${e}\n${await response.text()}`);
                            //global_var.response.create_dyn_response = undefined;
                            throw (`${url}\t${global_var.user_info.uname}\tcomment_dyn_response, ${e}, ${global_var.user_info.uname}`);
                        }
                    }
                    if (url.includes("/x/v2/reply/main")) {
                        try {
                            let response_json = await response.text()
                            global_var.response.reply_main = JSON.parse(response_json)
                            if (response_json.code == 0) {
                                let replies = response_json.data.replies
                                for (let repindex = 0; repindex < replies.length; repindex++) {
                                    try {
                                        MYAPI.fileWrite(`文案/评论响应.csv`, JSON.stringify(replies[repindex]), 'a+')
                                    }
                                    catch {
                                        console.warn('记录评论内容失败！');
                                    }
                                }
                            }
                        }
                        catch (e) {
                            try {
                                let response_json = await response.text()
                                global_var.response.reply_main = JSON.parse(/.*?\((.*)\)/gmi.exec(response_json).slice(1).join(''))
                            } catch (e) {
                                throw (`${global_var.user_info.uname}\treply_main, ${await response.text()},`, e);
                            }
                        }
                        //console.log(`获取评论响应：`, global_var.reply_main);
                    }
                    if (url.includes("/x/web-interface/nav")) {
                        if (!global_var.user_info.uname) {
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
                            throw (`${global_var.user_info.uname}\tglobal_dynamic_data, ${e}, ${global_var.user_info.uname}`);
                        }
                    }
                    if (url.includes("space/reservation")) {
                        try {
                            global_var.response.space_reservation = await response.json()
                            console.log(`${global_var.user_info.uname}\t空间预约响应：\n${JSON.stringify(global_var.response.space_reservation)}`);
                        }
                        catch (e) {
                            global_var.response.space_reservation = undefined;
                            throw (`${global_var.user_info.uname}\nreservation, ${e}`);
                        }
                    }
                    if (url.includes("msgfeed/unread")) {
                        try {
                            let resp_josn = await response.json()
                            if (!resp_josn.code) {
                                global_var.response.msgfeed_unread = resp_josn
                                // console.log(`${global_var.user_info.uname}\t我的消息响应：\n${JSON.stringify(global_var.response.msgfeed_unread)}`);
                            }
                        }
                        catch (e) {
                            global_var.response.space_reservation = undefined;
                            //throw (`${global_var.user_info.uname}\t我的消息响应获取失败msgfeed/unread, ${e}`);
                        }
                    }
                    if (url.includes("data.bilibili.com/log/web")) {
                        if (url.includes('risk')) {
                            MYAPI.fileWrite('log/log_report.txt', url, 'a+')
                        }
                    }
                }
                catch (e) {
                    console.warn(`${global_var.user_info.uname}\t${url}\n${e}\n${JSON.stringify(response)}`)
                }

            })
            global_var.page.on('request', async interceptedRequest => {
                try {
                    if (interceptedRequest.method().toLowerCase() == 'post') {
                        if (interceptedRequest.url().includes('data.bilibili.com/log/web?013324')) {//如果是浏览器要发起检测到作弊的请求，就拦截下来，不让它发出去！
                            interceptedRequest.abort()
                            //console.log(`成功拦截科技识别请求：${interceptedRequest.url()}`);
                        } else {
                            interceptedRequest.continue()
                        }
                    }
                    else {
                        interceptedRequest.continue()
                    }
                }
                catch (e) {
                    console.warn(`拦截请求：${interceptedRequest.url()}失败`, e);
                }
            })
            for (let i = 0; i < 5; i++) {
                try {
                    await global_var.page.goto('https://www.bilibili.com')
                    break;
                }
                catch {
                    await sleep(3e3)
                }
            }

            for (let i = 0; i < 5; i++) {
                if (global_var.user_info.uname) {
                    console.log(lottery_setting.CONFIG.COOKIENAME, global_var.user_info.uname, "账号初始化完成");
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

        await account_init();
        await unfollow_op(global_var.page);
    }
    main = async () => {
        await this.mainFunc(this.lottery_name, this.broswer_mode, this.opus动态标志)
    };
    launch_lottery = async (lottery_setting_string, broswer_mode, opus动态标志) => {
        /**
         * @static 全局变量
         */
        const global_var = {
            page: undefined,//创建的网页
            browser: undefined,//创建的浏览器
            pageurl: '',//抽奖网址
            dynamic_id: 0,
            TIME: {
                Init_Time: new Date(Date.now()),
                /**@property 非抽奖时间段*/
                None_Lottery_Time: ["2:00", "9:00"],
                /**@property 参加x秒以内必须参加的预约抽奖 */
                Reserve_Lottery_time: 7 * 3600 * 24,
            },
            /**@property 所有的响应类 */
            response: {
                /**@property 全局的动态数据 */
                global_dynamic_data: undefined,//全局的动态数据
                /**@property 创建或转发动态的响应 */
                create_dyn_response: undefined,//创建或转发动态的响应
                /**@property 自己评论动态的响应 */
                comment_dyn_response: undefined,//自己评论动态的响应
                /**@property 关注响应 */
                relation_modify_response: undefined,//关注响应
                /**@property 点赞动态响应 */
                dynamic_thumb_response: undefined,//点赞动态响应
                /**@property 空间预约响应 */
                space_reservation: undefined,//空间预约响应
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
            },
            Getter: {
                check_login_status: () => {
                    if (!global_var.user_info.uname) {
                        console.warn(`登陆失败\n${lottery_setting.CONFIG.COOKIENAME}`)
                        throw ('登陆失败')
                    }
                }
            }
        }
        /**
         * @static 常用的静态方法
         */
        let utl = {
            /**
             * 检查是否在时间段内，加上一点随机数[doge]
             * @param {string} beginTime xx:xx格式的开始时间
             * @param {string} endTime xx:xx格式的结束时间
             * @returns 
             */
            checkAuditTime: function (beginTime, endTime) {
                var nowDate = new Date();
                var beginDate = new Date(nowDate);
                var endDate = new Date(nowDate);

                var beginIndex = beginTime.lastIndexOf("\:");
                var beginHour = beginTime.substring(0, beginIndex);
                var beginMinue = beginTime.substring(beginIndex + 1, beginTime.length);
                beginDate.setHours(beginHour, beginMinue, 0, 0);

                var endIndex = endTime.lastIndexOf("\:");
                var endHour = endTime.substring(0, endIndex);
                var endMinue = endTime.substring(endIndex + 1, endTime.length);
                endDate.setHours(endHour, endMinue, 0, 0);
                return nowDate.getTime() - beginDate.getTime() >= (-1800e3 * Math.random()) && nowDate.getTime() <= endDate.getTime();
            },
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
            /**
             * 移除表情包和话题和@，之后重新添加获取到的话题
             * @param {String} origin_str 
             * @param {String} dynamic_content
             * @returns {String} 
             */
            remove_emoji_topic_at: (origin_str, dynamic_content = '') => {//移除表情包和话题和@
                if (origin_str) {
                    origin_str = origin_str.replaceAll(/＠/gmi, '@')
                    origin_str = origin_str.replaceAll(/【/gmi, '[')
                    origin_str = origin_str.replaceAll(/】/gmi, ']')
                    let at_re = new RegExp(`@${global_var.user_info.uname}`, 'gmi')
                    if (!at_re.test(origin_str)) {//如果没有@自己的尝试将@后面内容替换
                        origin_str = origin_str.replace(/@.{0,12}? |@.{0,12}$/gmi, function (match) {
                            if (dynamic_content.includes(match.slice(1, -1))) {
                                return match
                            }
                            return '@' + utl.random_choice(lottery_setting.at_member) + ' '
                        })
                    }
                    origin_str = origin_str.replaceAll('＃', '#')
                    return origin_str.replaceAll(/(\[(?<=\[)(.*?)(?=\])])/gmi, "").replaceAll(/(\#(?<=#)(.*?)(?=#)#)/gmi, '')
                }
                else {
                    console.warn(`${global_var.user_info.uname}\t提取@和表情出错\t${origin_str}`)
                    return origin_str
                }
            },
            weight_rand: (input_list) => {//根据输入列表的次数的5次方设置权重抽取
                try {
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
                        return { content: e.content, weight: Math.pow(e.count, 5) }//用遇见次数的5次幂决定权重
                    })//加完权重了
                    let totalWeight = weight_list.reduce(function (pre, cur, index) {
                        cur.startW = pre;
                        return cur.endW = pre + cur.weight
                    }, 0)
                    let random = Math.ceil(Math.random() * totalWeight)
                    let selectElement = weight_list.find(element => element.startW < random && element.endW >= random)
                    return selectElement.content
                }
                catch (e) {
                    return undefined
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
                            module_dynamic: {},
                            module_stat: {}
                        },
                        type: undefined,
                        visible: true
                    }
                }
                let opus_init_detail;
                for (let i = 0; i < 3; i++) {
                    try {
                        opus_init_detail = await global_var.page.evaluate(`window.__INITIAL_STATE__`)
                        if (opus_init_detail) {
                            break;
                        }
                        else {
                            await sleep(10e3)
                        }
                    }
                    catch (e) {
                        console.warn(e);
                        await sleep(10e3)
                    }
                }

                polymer_detail_data.item.basic = opus_init_detail.detail.basic;
                polymer_detail_data.item.id_str = opus_init_detail.detail.id_str;
                for (let m of opus_init_detail.detail.modules) {
                    switch (m.module_type) {
                        case "MODULE_TYPE_AUTHOR": {
                            polymer_detail_data.item.modules.module_author = m.module_author;
                            polymer_detail_data.item.modules.module_author.official_verify = m.module_author.official;
                            break;
                        }
                        case "MODULE_TYPE_CONTENT": {
                            let text = [];
                            for (let paragraph of m.module_content.paragraphs) {
                                if (paragraph.para_type == 1) {
                                    for (let node of paragraph.text.nodes) {
                                        switch (node.type) {
                                            case "TEXT_NODE_TYPE_WORD": {
                                                text.push(node.word.words)
                                                break;
                                            }
                                            case "TEXT_NODE_TYPE_RICH": {
                                                text.push(node.rich.text)
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                            polymer_detail_data.item.modules.module_dynamic.desc = {
                                rich_text_nodes: m.module_content.paragraphs.filter(el => { return el?.text }).map(el => { return el.text.nodes }).reduce((acc, curr) => acc.concat(curr)),
                                text: text.join('')
                            };

                            break;
                        }
                        case "MODULE_TYPE_STAT": {
                            polymer_detail_data.item.modules.module_stat = m.module_stat;
                            break;
                        }
                    }
                }
                polymer_detail_data.item.type = opus_init_detail.detail.type
                return polymer_detail_data
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
                            newArr.push(arr[i])
                        }
                    }
                    return newArr
                }
                catch (e) {
                    console.warn(e, `${global_var.user_info.uname}\tnoRepeat`);
                }
                return newArr
            },
            /**
             * 去除所有不可见字符
             * @param {*} origin_str 
             * @returns 
             */
            remove_invisible_char(origin_str) {
                let reg = /[\0-\x1F\x7F-\x9F\xAD\u0378\u0379\u037F-\u0383\u038B\u038D\u03A2\u0528-\u0530\u0557\u0558\u0560\u0588\u058B-\u058E\u0590\u05C8-\u05CF\u05EB-\u05EF\u05F5-\u0605\u061C\u061D\u06DD\u070E\u070F\u074B\u074C\u07B2-\u07BF\u07FB-\u07FF\u082E\u082F\u083F\u085C\u085D\u085F-\u089F\u08A1\u08AD-\u08E3\u08FF\u0978\u0980\u0984\u098D\u098E\u0991\u0992\u09A9\u09B1\u09B3-\u09B5\u09BA\u09BB\u09C5\u09C6\u09C9\u09CA\u09CF-\u09D6\u09D8-\u09DB\u09DE\u09E4\u09E5\u09FC-\u0A00\u0A04\u0A0B-\u0A0E\u0A11\u0A12\u0A29\u0A31\u0A34\u0A37\u0A3A\u0A3B\u0A3D\u0A43-\u0A46\u0A49\u0A4A\u0A4E-\u0A50\u0A52-\u0A58\u0A5D\u0A5F-\u0A65\u0A76-\u0A80\u0A84\u0A8E\u0A92\u0AA9\u0AB1\u0AB4\u0ABA\u0ABB\u0AC6\u0ACA\u0ACE\u0ACF\u0AD1-\u0ADF\u0AE4\u0AE5\u0AF2-\u0B00\u0B04\u0B0D\u0B0E\u0B11\u0B12\u0B29\u0B31\u0B34\u0B3A\u0B3B\u0B45\u0B46\u0B49\u0B4A\u0B4E-\u0B55\u0B58-\u0B5B\u0B5E\u0B64\u0B65\u0B78-\u0B81\u0B84\u0B8B-\u0B8D\u0B91\u0B96-\u0B98\u0B9B\u0B9D\u0BA0-\u0BA2\u0BA5-\u0BA7\u0BAB-\u0BAD\u0BBA-\u0BBD\u0BC3-\u0BC5\u0BC9\u0BCE\u0BCF\u0BD1-\u0BD6\u0BD8-\u0BE5\u0BFB-\u0C00\u0C04\u0C0D\u0C11\u0C29\u0C34\u0C3A-\u0C3C\u0C45\u0C49\u0C4E-\u0C54\u0C57\u0C5A-\u0C5F\u0C64\u0C65\u0C70-\u0C77\u0C80\u0C81\u0C84\u0C8D\u0C91\u0CA9\u0CB4\u0CBA\u0CBB\u0CC5\u0CC9\u0CCE-\u0CD4\u0CD7-\u0CDD\u0CDF\u0CE4\u0CE5\u0CF0\u0CF3-\u0D01\u0D04\u0D0D\u0D11\u0D3B\u0D3C\u0D45\u0D49\u0D4F-\u0D56\u0D58-\u0D5F\u0D64\u0D65\u0D76-\u0D78\u0D80\u0D81\u0D84\u0D97-\u0D99\u0DB2\u0DBC\u0DBE\u0DBF\u0DC7-\u0DC9\u0DCB-\u0DCE\u0DD5\u0DD7\u0DE0-\u0DF1\u0DF5-\u0E00\u0E3B-\u0E3E\u0E5C-\u0E80\u0E83\u0E85\u0E86\u0E89\u0E8B\u0E8C\u0E8E-\u0E93\u0E98\u0EA0\u0EA4\u0EA6\u0EA8\u0EA9\u0EAC\u0EBA\u0EBE\u0EBF\u0EC5\u0EC7\u0ECE\u0ECF\u0EDA\u0EDB\u0EE0-\u0EFF\u0F48\u0F6D-\u0F70\u0F98\u0FBD\u0FCD\u0FDB-\u0FFF\u10C6\u10C8-\u10CC\u10CE\u10CF\u1249\u124E\u124F\u1257\u1259\u125E\u125F\u1289\u128E\u128F\u12B1\u12B6\u12B7\u12BF\u12C1\u12C6\u12C7\u12D7\u1311\u1316\u1317\u135B\u135C\u137D-\u137F\u139A-\u139F\u13F5-\u13FF\u169D-\u169F\u16F1-\u16FF\u170D\u1715-\u171F\u1737-\u173F\u1754-\u175F\u176D\u1771\u1774-\u177F\u17DE\u17DF\u17EA-\u17EF\u17FA-\u17FF\u180F\u181A-\u181F\u1878-\u187F\u18AB-\u18AF\u18F6-\u18FF\u191D-\u191F\u192C-\u192F\u193C-\u193F\u1941-\u1943\u196E\u196F\u1975-\u197F\u19AC-\u19AF\u19CA-\u19CF\u19DB-\u19DD\u1A1C\u1A1D\u1A5F\u1A7D\u1A7E\u1A8A-\u1A8F\u1A9A-\u1A9F\u1AAE-\u1AFF\u1B4C-\u1B4F\u1B7D-\u1B7F\u1BF4-\u1BFB\u1C38-\u1C3A\u1C4A-\u1C4C\u1C80-\u1CBF\u1CC8-\u1CCF\u1CF7-\u1CFF\u1DE7-\u1DFB\u1F16\u1F17\u1F1E\u1F1F\u1F46\u1F47\u1F4E\u1F4F\u1F58\u1F5A\u1F5C\u1F5E\u1F7E\u1F7F\u1FB5\u1FC5\u1FD4\u1FD5\u1FDC\u1FF0\u1FF1\u1FF5\u1FFF\u200B-\u200F\u202A-\u202E\u2060-\u206F\u2072\u2073\u208F\u209D-\u209F\u20BB-\u20CF\u20F1-\u20FF\u218A-\u218F\u23F4-\u23FF\u2427-\u243F\u244B-\u245F\u2700\u2B4D-\u2B4F\u2B5A-\u2BFF\u2C2F\u2C5F\u2CF4-\u2CF8\u2D26\u2D28-\u2D2C\u2D2E\u2D2F\u2D68-\u2D6E\u2D71-\u2D7E\u2D97-\u2D9F\u2DA7\u2DAF\u2DB7\u2DBF\u2DC7\u2DCF\u2DD7\u2DDF\u2E3C-\u2E7F\u2E9A\u2EF4-\u2EFF\u2FD6-\u2FEF\u2FFC-\u2FFF\u3040\u3097\u3098\u3100-\u3104\u312E-\u3130\u318F\u31BB-\u31BF\u31E4-\u31EF\u321F\u32FF\u4DB6-\u4DBF\u9FCD-\u9FFF\uA48D-\uA48F\uA4C7-\uA4CF\uA62C-\uA63F\uA698-\uA69E\uA6F8-\uA6FF\uA78F\uA794-\uA79F\uA7AB-\uA7F7\uA82C-\uA82F\uA83A-\uA83F\uA878-\uA87F\uA8C5-\uA8CD\uA8DA-\uA8DF\uA8FC-\uA8FF\uA954-\uA95E\uA97D-\uA97F\uA9CE\uA9DA-\uA9DD\uA9E0-\uA9FF\uAA37-\uAA3F\uAA4E\uAA4F\uAA5A\uAA5B\uAA7C-\uAA7F\uAAC3-\uAADA\uAAF7-\uAB00\uAB07\uAB08\uAB0F\uAB10\uAB17-\uAB1F\uAB27\uAB2F-\uABBF\uABEE\uABEF\uABFA-\uABFF\uD7A4-\uD7AF\uD7C7-\uD7CA\uD7FC-\uF8FF\uFA6E\uFA6F\uFADA-\uFAFF\uFB07-\uFB12\uFB18-\uFB1C\uFB37\uFB3D\uFB3F\uFB42\uFB45\uFBC2-\uFBD2\uFD40-\uFD4F\uFD90\uFD91\uFDC8-\uFDEF\uFDFE\uFDFF\uFE1A-\uFE1F\uFE27-\uFE2F\uFE53\uFE67\uFE6C-\uFE6F\uFE75\uFEFD-\uFF00\uFFBF-\uFFC1\uFFC8\uFFC9\uFFD0\uFFD1\uFFD8\uFFD9\uFFDD-\uFFDF\uFFE7\uFFEF-\uFFFB\uFFFE\uFFFF]/g
                return origin_str.replaceAll(reg, '');
            }
        }
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
                    let path = `cookie_file/${cookiefilename}.txt`
                    let data = '';
                    if (fs.existsSync(__dirpath + path)) {
                        data = fs.readFileSync(__dirpath + path, function (err, data) {
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
                    let path = `cookie_file/${cookiefilename}.txt`
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
                    let retlist = []
                    try {
                        if (fs.existsSync(__dirpath + filename)) {
                            let dynamic_ids = fs.readFileSync(__dirpath + filename).toString().split('\n')
                            for (let dynamic_id of dynamic_ids) {
                                if (dynamic_id) { retlist.push(dynamic_id.trim()) }
                            }
                        }
                        else {//如果不存在则创建文件
                            MYAPI.fileWrite(filename, "")
                        }
                    }
                    catch (e) {
                        console.log(e, "fileRead.lottery_dynamic_ids");
                    }
                    return retlist
                },
                /**
                 * 读取文件内容
                 * @param {*} filePath 
                 * @returns 文件内容的字符串
                 */
                getFileContent: function (filePath) {
                    try {
                        const Str = fs.readFileSync(__dirpath + filePath, 'utf8');
                        return Str;
                    } catch (err) {
                        console.log('Error reading file from disk:', err);
                        return '';
                    }
                }
            },
            fileWrite: function (filename, writeString, method = 'w') {
                try {
                    if (typeof writeString == 'object') {
                        writeString = JSON.stringify(writeString, '', '\t');
                    }
                    if (!fs.existsSync(__dirpath + filename)) {//如果文件不存在就创建一个
                        method = 'w'
                    }
                    if (writeString.slice(-1) == '\n') {//如果结尾是\n就不添加了
                        fs.writeFileSync(__dirpath + filename, writeString, { flag: method })
                    }
                    else {
                        fs.writeFileSync(__dirpath + filename, writeString + '\n', { flag: method })
                    }
                }
                catch (e) {
                    console.warn(`${filename}写入失败！`, e);
                }
            },
            BiliAPI: {//用之前加个await
                get: async (api, params) => {
                    let query = new URLSearchParams(params).toString();
                    if (api.includes('wbi')) {
                        query = await QueryWbiEnc(params);
                    }
                    console.debug(`使用api获取响应！${api}?${query}`);
                    return await new Promise((resolve, reject) => {
                        superagent.get(api + (query ? '?' + query : ''))
                            .set({
                                'User-Agent': "Mozilla/5.0",//这个ua不容易被风控
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
                                try {
                                    // console.debug(res);
                                    if (res.body) {
                                        resolve(res.body);
                                    }
                                    else {
                                        throw (err)
                                    }
                                }
                                catch (e) {
                                    console.error(`这个地址 "${api}" 的内容无法被解析!详细错误信息：${e}`)
                                    reject(`这个地址 "${api}" 的内容无法被解析!详细错误信息：${e}`);
                                }
                            });
                    });
                },
                post: (api, data) => {
                    return new Promise((resolve, reject) => {
                        superagent.post(api)
                            .send(data)
                            .set({
                                'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36 Edg/114.0.1823.82",
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
                            platform: 'h5',
                            id: dynamic_id
                        })
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
                get_reply_main: (mode, next, comment_id, type) => {//获取主站视频和动态底下的评论 
                    return MYAPI.BiliAPI.get(`https://api.bilibili.com/x/v2/reply/wbi/main`,
                        {
                            'mode': mode,
                            'next': next,
                            'oid': comment_id,
                            'plat': 1,
                            'type': type,
                            'web_location': 1315875,
                        }
                    )
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
                    return MYAPI.BiliAPI.get(`https://api.bilibili.com/x/v2/reply/wbi/main`,
                        {
                            'sort': sort,
                            'pn': pn,
                            'oid': comment_id,
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
                },
                /**
                 * 跳转评论api返回promise，await之后返回json
                 * @param {*} type 动态类型
                 * @param {*} oid 评论区comment_id_str
                 * @param {*} rpid 评论的编号id
                 * @returns 
                 */
                reply_jump: (type, oid, rpid) => {
                    return MYAPI.BiliAPI.get(`https://api.bilibili.com/x/v2/reply/jump`, {
                        type: type,
                        oid: oid,
                        rpid: rpid
                    })
                }
            },
            PageFunc: {
                /**
                 * 等待浏览器响应
                 * @param {*} page 
                 * @param {string} url_include 
                 */
                waitForResponse: async function (page, url_include) {
                    try {
                        await page.waitForResponse(
                            response =>
                                response.url().includes(url_include) && response.status() === 200
                        );
                    }
                    catch (e) {
                        console.log(`${global_var.user_info.uname}\t等待响应${url_include}失败\t${(new Date()).toLocaleTimeString()}`);
                        throw (`${global_var.user_info.uname}\t等待响应${url_include}失败\t${(new Date()).toLocaleTimeString()}`);
                    }
                }
            }
        }
        let my_operator = {
            basic_operator: {
                /**
                 * 返回一个bool判断是否评论存在 true:存在；false：不存在，被隐藏了
                 * @param {json} response_json 评论的响应
                 * @param {} dynamic_id 动态ID
                 * @returns 
                 */
                check_reply: async function (response_json, dynamic_id) {
                    if (response_json) {
                        try {
                            let type = response_json.data.reply.type;
                            let oid = global_var.response.global_dynamic_data.item.basic.comment_id_str
                            let rpid = response_json.data.reply.rpid;
                            let check_flag = false;
                            let reply_jump_resp = await MYAPI.BiliAPI.reply_jump(type, oid, rpid);
                            await reply_jump_resp.data.replies.forEach(reply => {
                                if (reply.rpid == rpid) { check_flag = true; }
                                else if (reply.replies != null) {
                                    reply.replies.forEach(reply => {
                                        if (reply.rpid == rpid) { check_flag = true; }
                                    })
                                }
                            })
                            return check_flag;
                        }
                        catch (e) {
                            console.warn(e)
                            return false
                        }
                    }
                    if (dynamic_id) {
                        let dynamic_detail_res_data = global_var.response.global_dynamic_data;
                        if (!global_var.response.global_dynamic_data) {
                            let dynamic_detail_res = await MYAPI.BiliAPI.get_dynamic_v1_detail(String(dynamic_id))
                            if (dynamic_detail_res.code) {
                                console.warn("获取评论失败", dynamic_detail_res);
                                return false
                            }
                            dynamic_detail_res_data = dynamic_detail_res.data
                        }
                        let comment_id_str = dynamic_detail_res_data.item.basic.comment_id_str
                        let comment_type = dynamic_detail_res_data.item.basic.comment_type
                        let reply_res = await MYAPI.BiliAPI.get_reply(2, 0, comment_id_str, comment_type)
                        if (reply_res.code) {
                            console.warn("获取评论失败", reply_res);
                            return false
                        }
                        else {
                            let replies = reply_res.data.replies;
                            let find_reply = await replies.find(element => element.member.uname == global_var.user_info.uname)
                            if (find_reply) {
                                return true
                            }
                            else {
                                return false
                            }
                        }
                    }
                    else {
                        return false
                    }
                },
                /**
                 * 获取opus动态的转发框里的内容
                 * @param {*} msg_box_node 
                 */
                get_opus_dynamic_repost_area_content: async function (msg_box_node) {
                    return (await msg_box_node.$eval(`.bili-rich-textarea__inner`, async function pagefnc(el) {
                        let ret_msg = '';
                        for (let i of el.childNodes) {
                            if (i.data) {
                                ret_msg += i.data
                            } else {
                                let emoji_data = JSON.parse(i.dataset.data)
                                ret_msg += emoji_data.text
                            }
                        }
                        return ret_msg
                    })).slice(1, -1)
                },
                /**
                 * 点赞动态
                 * @param {*} opus_dynamic 是否通过opus动态操作
                 */
                dynamic_thumb: async function (opus_dynamic = false) {//动态点赞
                    global_var.Getter.check_login_status();
                    try {
                        if (typeof global_var.recorded_data == string) {
                            if (global_var.recorded_data.includes('动态评论失败，评论被隐藏')) {
                                console.log(`${global_var.user_info.uname}\t动态评论失败，评论被隐藏，不进行动态点赞！\t${(new Date()).toLocaleTimeString()}`);
                                return;
                            }
                        }
                        let pageurl = await global_var.page.url();
                        if (pageurl.includes('opus')) {
                            opus_dynamic = true
                        }
                        else {
                            opus_dynamic = false
                        }

                        if (opus_dynamic) {
                            await sleep(2e3)
                            await global_var.page.click(`.side-toolbar__action.like`)
                            await sleep(1e3)
                            for (let i = 0; i < 5; i++) {
                                if (await global_var.page.$(`.side-toolbar__action.like.is-active`)) {
                                    console.log(`${global_var.user_info.uname}\t${pageurl}\t动态点赞成功`)
                                    await sleep(utl.random_choice(lottery_setting.Working_clearance_time))
                                    break;
                                }
                                else {
                                    console.warn(`${global_var.user_info.uname}\t${global_var.pageurl}\t动态点赞失败`)
                                    await sleep(2e3)
                                    await global_var.page.click(`.side-toolbar__action.like`)
                                    await sleep(1e3)
                                    break;
                                }
                            }
                        }
                        else {
                            await sleep(2e3)
                            await global_var.page.click('.bili-dyn-action.like')
                            await sleep(1e3)
                            console.log(`${global_var.user_info.uname}\t${global_var.pageurl}\t动态点赞成功`)
                            await sleep(utl.random_choice(lottery_setting.Working_clearance_time))
                        }
                    } catch (e) {
                        console.warn(`${global_var.user_info.uname}\t${global_var.pageurl}\t动态点赞失败`, e)
                        await utl.my_throw(`${global_var.user_info.uname}\t${global_var.pageurl}\t动态点赞失败`)
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
                 * @param {*} opus_dynamic 是否通过opus动态操作
                 */
                dynamic_repost: async function (opus_dynamic = false, repost_content = '') {//点击转发
                    global_var.Getter.check_login_status();
                    let pageurl = await global_var.page.url();
                    if (pageurl.includes('opus')) {
                        opus_dynamic = true
                    }
                    else {
                        opus_dynamic = false
                    }

                    await sleep(3e3);
                    try {
                        if (opus_dynamic) {
                            let repost_btn = await global_var.page.$(`.side-toolbar__action.forward`)
                            await repost_btn.click();
                            await sleep(3e3)
                            if (repost_content) {
                                let msg_box
                                for (let bt = 0; bt <= 5; bt++) {
                                    try {
                                        if (!(await global_var.page.$(`.bili-rich-textarea`))) {
                                            await repost_btn.click();
                                        }
                                        await global_var.page.waitForSelector(`.bili-rich-textarea`, { timeout: 10e3 })
                                        msg_box = await global_var.page.$(`.bili-rich-textarea`)
                                        await msg_box.focus()
                                        let msg_box_content = await my_operator.basic_operator.get_opus_dynamic_repost_area_content(msg_box)
                                        let _bt = 0

                                        while (msg_box_content != repost_content) {//回复栏里的东西等于回复内容时break
                                            await msg_box.focus()
                                            await sleep(utl.random_choice(3 * lottery_setting.Working_clearance_time))
                                            await msg_box.type(repost_content, { delay: 20 })
                                            await sleep(1e3)
                                            msg_box_content = await my_operator.basic_operator.get_opus_dynamic_repost_area_content(msg_box)
                                            if (msg_box_content != repost_content) {//如果不等就删掉重新输入
                                                await global_var.page.mouse.click(10, 10)
                                                await sleep(3e3)
                                                await repost_btn.click();
                                                msg_box = await global_var.page.$(`.bili-rich-textarea`)
                                                console.log('转发框里内容与转发内容不符，删除转发框里内容', `\nmsg_box_content:${msg_box_content}\repost_content:${repost_content}`);
                                            }
                                            if (_bt >= 5) {
                                                console.log('转发框里输入内容失败');
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
                                            this.scrollTo(0, 1500)
                                        });
                                        await global_var.page.evaluate(() => {
                                            this.scrollTo(0, -1500)
                                        })
                                        await sleep(3e3);
                                    }
                                }
                            }
                            let repost_launcher = await global_var.page.$(`.bili-dyn-share-publishing__action.launcher`)
                            await repost_launcher.click();
                            await sleep(6e3)
                        }
                        else {
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
                    }
                    catch (e) {
                        console.warn(`动态转发失败，dynamic_repost，${e}`)
                        await utl.my_throw(`动态转发失败，dynamic_repost，${e}`)
                        //return 
                    }
                },
                /**
                 * 点击回复按钮
                 * @param {String} comment_msg 回复内容
                 * @returns {}
                 */
                comment_submit: async function (comment_msg, opus_dynamic = false) {//点击回复
                    /**
                     * 检查评论是否被风控
                     */
                    async function CheckRisk() {
                        let comment_dyn_response_code = 0;
                        try {
                            if (global_var.response.comment_dyn_response) {
                                comment_dyn_response_code = global_var.response.comment_dyn_response.code;
                            } else {
                                console.warn(`${global_var.user_info.uname}\t检查是否评论被风控时未获取到响应！`);
                                throw (`${global_var.user_info.uname}\t检查是否评论被风控时未获取到响应！`)
                            }
                        } catch {
                            throw (`${global_var.user_info.uname}\t检查是否评论被风控时未获取到响应！`)
                        }
                        let captcha;//检查验证码
                        try { captcha = await global_var.page.$(`.comment-captcha`) }
                        catch (e) {
                            console.warn('无需验证码', e);
                        }
                        if (captcha || comment_dyn_response_code) {
                            await utl.my_throw('动态评论失败，需要验证码')
                            console.warn(`${global_var.user_info.uname}\t动态${await this.global_var.page.url()} 评论失败，需要验证码，休眠4小时！\t${(new Date()).toLocaleTimeString()}`)
                            await sleep(4 * 3600e3)
                            throw (`动态评论失败，需要验证码`)
                        }
                        await sleep(3e3)
                    }


                    global_var.Getter.check_login_status();
                    let pageurl = await global_var.page.url();
                    if (pageurl.includes('opus')) {
                        opus_dynamic = true
                    }
                    else {
                        opus_dynamic = false
                    }

                    if (pageurl.includes('read/cv')) {
                        opus_dynamic = false
                        await global_var.page.goto(`https://t.bilibili.com/${global_var.dynamic_id}`)
                    }
                    global_var.FLAG.评论响应标志 = false;
                    if (typeof comment_msg != 'string' || !comment_msg || comment_msg.includes('undefined') || comment_msg.includes('null') || comment_msg.includes('true') || comment_msg.includes('false')) {//检查是否传入的是string类型参数 或者是否为空
                        return await utl.my_throw('动态评论内容出错')
                    }
                    await sleep(1e3);





                    for (let i = 0; i < 3; i++) {
                        let bt = 0

                        try {

                            if (opus_dynamic) {
                                let msg_box;
                                await global_var.page.waitForSelector(`.reply-box-textarea`, { timeout: 10e3 })
                                msg_box = await global_var.page.$(`.reply-box-textarea`)
                                await msg_box.click()
                                let msg_box_content = await global_var.page.$eval(`.reply-box-textarea`, el => el.value)
                                let _bt = 0
                                while (msg_box_content != comment_msg) {//回复栏里的东西等于回复内容时break
                                    await msg_box.click()
                                    await sleep(utl.random_choice(3 * lottery_setting.Working_clearance_time))
                                    await msg_box.type(comment_msg, { delay: 20 })
                                    await sleep(1e3)
                                    msg_box_content = await global_var.page.$eval(`.reply-box-textarea`, el => el.value)
                                    if (utl.remove_invisible_char(msg_box_content.replaceAll(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "")) != utl.remove_invisible_char(comment_msg.replaceAll(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, ""))) {//如果不等就删掉重新输入
                                        await sleep(1e3)
                                        await msg_box.click()
                                        await global_var.page.keyboard.down('Control');
                                        await global_var.page.keyboard.press('A');
                                        await global_var.page.keyboard.up('Control');
                                        await sleep(1e3)
                                        await global_var.page.keyboard.press('Backspace');
                                        console.log('输入框里内容与评论不符，删除输入框里内容', `\nmsg_box_content:${msg_box_content}\ncomment_msg:${comment_msg}`);
                                    }
                                    else {
                                        //相等了break出去
                                        break;
                                    }
                                    if (_bt >= 5) {
                                        console.log('输入框里输入内容失败');
                                        await utl.my_throw('动态评论失败')
                                        throw (`动态评论失败`)
                                    }
                                    _bt += 1
                                }
                                await sleep(1e3)
                                await global_var.page.click(`.send-text`)
                                await MYAPI.PageFunc.waitForResponse(global_var.page, 'reply/add')
                                await sleep(1e3)

                                await CheckRisk();


                            }
                            else {//老版动态评论
                                let msg_box;
                                let comment_box_jquery = `textarea[name=msg]`
                                try {
                                    await global_var.page.waitForSelector(`.reply-box-textarea`, { timeout: 10e3 })
                                    comment_box_jquery = `.reply-box-textarea`
                                }
                                catch {
                                    comment_box_jquery = `textarea[name=msg]`
                                }
                                msg_box = await global_var.page.$(comment_box_jquery)
                                await msg_box.focus()
                                let msg_box_content = await global_var.page.$eval(comment_box_jquery, el => el.value)
                                let _bt = 0
                                while (msg_box_content != comment_msg) {//回复栏里的东西等于回复内容时break
                                    await msg_box.focus()
                                    await sleep(utl.random_choice(3 * lottery_setting.Working_clearance_time))
                                    await msg_box.type(comment_msg, { delay: 20 })
                                    await sleep(1e3)
                                    msg_box_content = await global_var.page.$eval(comment_box_jquery, el => el.value)
                                    if (utl.remove_invisible_char(msg_box_content.replaceAll(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "")) != utl.remove_invisible_char(comment_msg.replaceAll(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, ""))) {//如果不等就删掉重新输入
                                        await sleep(1e3)
                                        await msg_box.focus()
                                        await global_var.page.keyboard.down('Control');
                                        await global_var.page.keyboard.press('A');
                                        await global_var.page.keyboard.up('Control');
                                        await sleep(1e3)
                                        await global_var.page.keyboard.press('Backspace');
                                        console.log('输入框里内容与评论不符，删除输入框里内容', `\nmsg_box_content:${msg_box_content}\ncomment_msg:${comment_msg}`);
                                    }
                                    else {
                                        //相等了就break出去
                                        break;
                                    }
                                    if (_bt >= 5) {
                                        console.log('输入框里输入内容失败');
                                        await utl.my_throw('动态评论失败')
                                        throw (`动态评论失败`)
                                    }
                                    _bt += 1
                                }
                                await sleep(1e3)
                                let comment_submit_jquert = `.comment-submit`
                                try {
                                    if (await global_var.page.$(`.reply-box-send`)) { comment_submit_jquert = `.reply-box-send` }
                                    else {
                                        comment_submit_jquert = `.comment-submit`
                                    }
                                }
                                catch {
                                    comment_submit_jquert = `.comment-submit`
                                }
                                await global_var.page.click(comment_submit_jquert)
                                await MYAPI.PageFunc.waitForResponse(global_var.page, 'reply/add')
                                await sleep(1e3)
                            }
                            break;
                        }

                        catch (e) {
                            bt++;
                            console.error(e);
                            if (bt >= 5) {
                                throw (e)
                            }
                            await global_var.page.reload();
                            await sleep(3e3);
                            await global_var.page.evaluate(() => {
                                this.scrollTo(0, 1500)
                            });
                            await global_var.page.evaluate(() => {
                                this.scrollTo(0, -1500)
                            })
                            await sleep(3e3);
                        }
                    }


                    //无论新版还是旧版动态都在最后再检查一次评论是否成功
                    await CheckRisk();
                    for (let i = 0; i < 10; i++) {
                        if (global_var.response.comment_dyn_response) {
                            console.log(`${global_var.user_info.uname}\t${pageurl}\t检查评论是否被阿瓦隆中${(new Date()).toLocaleString()}`)
                            let check_reply_result = await my_operator.basic_operator.check_reply(global_var.response.comment_dyn_response, MYAPI.BiliAPI.draw_dynamic_id(pageurl))
                            if (check_reply_result) {
                                console.log(`${global_var.user_info.uname}\t${await global_var.page.url()}\t评论成功，躲过阿瓦隆\t${(new Date()).toLocaleString()}`)
                                break;
                            }
                            else {
                                await utl.my_throw('动态评论失败，评论被隐藏')
                                break;
                            }
                        }
                        else {
                            if (i == 9) {
                                await utl.my_throw(`动态评论失败，获取评论响应失败${(new Date()).toLocaleString()}`)
                            }
                        }
                        await sleep(2e3)
                    }

                    try {
                        if (Math.random() < lottery_setting.comment_thumb_chance) {
                            await my_operator.basic_operator.comment_thumb(opus_dynamic)
                            await sleep(utl.random_choice(lottery_setting.Working_clearance_time))
                        }
                    } catch (e) {
                        throw (e)
                    }
                },
                comment_thumb: async function (opus_dynamic = false) {
                    global_var.Getter.check_login_status();
                    let pageurl = await global_var.page.url();
                    if (pageurl.includes('opus')) {
                        opus_dynamic = true
                    }
                    else {
                        opus_dynamic = false
                    }

                    if (opus_dynamic) {
                        try {
                            let uname = global_var.user_info.uname;
                            await sleep(3e3);
                            let comment_user_index = await global_var.page.$$eval(`.user-name`, (els, uname) => {
                                for (let j = 0; j < els.length; j++) {
                                    if (els[j].textContent == uname) {
                                        return j;
                                    }
                                }
                            }, uname)
                            let my_comment_thumb;
                            try {
                                my_comment_thumb = (await global_var.page.$$(`.reply-like`))[comment_user_index]
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
                            if (!(await global_var.page.waitForSelector(`.svg-icon.liked.use-color.like-icon.liked`, { timeout: 10e3 }))) {
                                console.warn('评论点赞失败')
                                return await utl.my_throw('评论点赞失败')
                            }
                            else {
                                console.log('评论点赞成功')
                            }
                        }
                        catch (e) {
                            console.log(e)
                            console.warn(`评论点赞失败，comment_thumb`, e)
                            await utl.my_throw(`评论点赞失败，comment_thumb，${e}`)
                            throw (`评论点赞失败，comment_thumb，${e}`);
                        }
                    }


                    else {
                        try {
                            let uname = global_var.user_info.uname;
                            await sleep(3e3);
                            let comment_user_index = await global_var.page.$$eval(`.user-name`, (els, uname) => {
                                for (let j = 0; j < els.length; j++) {
                                    if (els[j].textContent == uname) {
                                        return j;
                                    }
                                }
                            }, uname)
                            let my_comment_thumb;
                            try {
                                my_comment_thumb = (await global_var.page.$$(`.reply-like`))[comment_user_index]
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
                            if (!(await global_var.page.waitForSelector(`.svg-icon.liked.use-color.like-icon.liked`, { timeout: 10e3 }))) {
                                console.warn('评论点赞失败')
                                return await utl.my_throw('评论点赞失败')
                            }
                            else {
                                console.log('评论点赞成功')
                            }
                        }
                        catch (e) {
                            console.log(e)
                            console.warn(`评论点赞失败，comment_thumb`, e)
                            await utl.my_throw(`评论点赞失败，comment_thumb，${e}`)
                            throw (`评论点赞失败，comment_thumb，${e}`);
                        }
                    }
                }
            },
            /**
             * 操作视频的方法
             */
            video_operator: {
                goto_video_page: async function (pageurl) {
                    await global_var.page.goto(pageurl, { "waitUntil": "networkidle2" })
                    await global_var.page.waitForSelector(`.bpx-player-video-area`)
                    await sleep(3e3)
                    await global_var.page.click(`.bpx-player-video-area`)
                    console.log(`点击了暂停视频`);
                },
                sanlian: async function (pageurl) {
                    let thumb_btn = await global_var.page.$(`.video-like.video-toolbar-left-item`)
                    await thumb_btn.click({ "delay": 10e3 })
                    let coin_btn = await global_var.page.$(`.video-coin.video-toolbar-left-item`)
                    let coin_btn_title = await coin_btn.evaluate(el => el.title, coin_btn)
                    if (coin_btn_title == '对本稿件的投币枚数已用完') {
                        console.log(`${global_var.user_info.uname}\t${pageurl}\t三连成功\t${(new Date()).toLocaleTimeString()}`);
                    }
                    else {
                        console.warn(`${global_var.user_info.uname}\t${pageurl}\t三连失败，尝试单独投币\t${(new Date()).toLocaleTimeString()}`)
                        await this.toubi(2, pageurl);
                    }
                },
                toubi: async function (coin_num, pageurl) {
                    let coin_btn = await global_var.page.$(`.video-coin.video-toolbar-left-item`)
                    await coin_btn.click()
                    if (coin_num == 1) {
                        let one_coin_box = await global_var.page.$(`.mc-box.left-con`)
                        await one_coin_box.click();
                    }
                    let coin_confirm_btn = await global_var.page.$(`.coin-bottom>.bi-btn`);
                    await coin_confirm_btn.click();
                    let coin_btn_title = await coin_btn.evaluate(el => el.title, coin_btn)
                    if (coin_btn_title == '投币（W）') {
                        console.log(`${global_var.user_info.uname}\t${pageurl}\t投币成功\t${(new Date()).toLocaleTimeString()}`);
                    }
                    else {
                        console.warn(`${global_var.user_info.uname}\t${pageurl}\t投币成功\t${(new Date()).toLocaleTimeString()}`)
                    }
                    await sleep(3e3)
                }
            },
            fast_repost: async function (opus_dynamic) {//直接转发
                try {//直接点转发
                    await sleep(1e3)
                    await my_operator.basic_operator.dynamic_repost(opus_dynamic)
                    //最后点赞
                    await my_operator.basic_operator.dynamic_thumb(opus_dynamic)
                }
                catch {
                    try {
                        await sleep(utl.random_choice(lottery_setting.Working_clearance_time))
                        await global_var.page.click('.bili-dyn-action.forward')//前往转发子页面
                        await sleep(1e3)
                        await my_operator.basic_operator.dynamic_repost(opus_dynamic)
                        //最后点赞
                        await my_operator.basic_operator.dynamic_thumb(opus_dynamic)
                    }
                    catch {
                        console.log(global_var.response.global_dynamic_data)
                        global_var.fengkong_flag = true//可能触发风控，停一个小时
                        return await utl.my_throw(`转发失败，fast_repost`)
                    }
                }
            },
            /**
             * 勾选同时转发到我的动态
             * @param {*} comment_msg 
             * @returns 
             */
            comment_repost_dynamic_with_content: async function (comment_msg, opus_dynamic = false) {//转评带上回复内容
                let pageurl = await global_var.page.url();
                if (pageurl.includes('opus')) {
                    opus_dynamic = true
                }
                else {
                    opus_dynamic = false
                }

                if (opus_dynamic) {
                    try {
                        await my_operator.basic_operator.comment_submit(comment_msg, opus_dynamic);
                        await sleep(3e3)
                        await my_operator.basic_operator.dynamic_repost(opus_dynamic, comment_msg);
                        await sleep(3e3)
                        await my_operator.basic_operator.dynamic_thumb(opus_dynamic)
                    }
                    catch (e) {
                        console.log(`转发失败，comment_repost_dynamic_with_content，${e}\n${pageurl}\t${global_var.user_info.uname}`)
                        return await utl.my_throw(`转发失败，comment_repost_dynamic_with_content，${e}\n${pageurl}\t${global_var.user_info.uname}`)
                    }
                }

                else {
                    try {
                        let bt = 0
                        while (1) {
                            if (bt > 5) {//多次尝试点击勾选，超过次数则退出
                                break
                            }
                            try {
                                await global_var.page.click(`.reply-box-textarea`)
                                await global_var.page.waitForSelector(`.forward-input`, { timeout: 5e3 }).then(async checkbox => { await checkbox.click() })//勾选同时转发到我的动态
                                //  await global_var.page.click('.dynamic-repost-checkbox')
                                await sleep(1e3)
                                if ((await global_var.page.$eval('.forward-input', el => el.checked))) {
                                    await sleep(3e3)
                                    break
                                }
                            }
                            catch (e) {
                                await sleep(1e3)
                                await global_var.page.reload();
                                await sleep(3e3)
                                await global_var.page.evaluate(() => {
                                    this.scrollTo(0, 1500)
                                })

                            }
                            bt += 1;
                        }
                        if ((await global_var.page.$eval('.forward-input', el => el.checked))) {
                            await sleep(1e3)
                        }
                        else {
                            console.log(`勾选同时转发到我的动态转发失败\t${global_var.pageurl}\t${global_var.user_info.uname}`)
                            await utl.my_throw('勾选同时转发到我的动态转发失败')
                            throw (`勾选同时转发到我的动态转发失败，comment_repost_dynamic_with_content，${e}`)
                        }
                        if (comment_msg != null && comment_msg != undefined) {
                            await my_operator.basic_operator.comment_submit(comment_msg, opus_dynamic)
                        }
                        else {
                            console.log(`评论获取失败，comment_repost_dynamic_with_content\t${global_var.pageurl}\t${global_var.user_info.uname}`)
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
                            throw (`动态转发失败，comment_repost_dynamic_with_content，${e}\n${global_var.pageurl}\t${global_var.user_info.uname}`)
                        }

                        //动态点赞
                        await sleep(3e3);
                        await my_operator.basic_operator.dynamic_thumb(opus_dynamic)
                    }
                    catch (e) {
                        console.log(`转发失败，comment_repost_dynamic_with_content，${e}\n${pageurl}\t${global_var.user_info.uname}`)
                        return await utl.my_throw(`转发失败，comment_repost_dynamic_with_content，${e}\n${pageurl}\t${global_var.user_info.uname}`)
                    }
                }
            },
            /**
             * 先评论再点击转发，转发内容为自动生成内容
             * @param {*} comment_msg 
             * @returns 
             */
            comment_repost_dynamic_without_content: async function (comment_msg, opus_dynamic) { //转评不带回复内容
                let pageurl = await global_var.page.url();
                if (pageurl.includes('opus')) {
                    opus_dynamic = true
                }
                else {
                    opus_dynamic = false
                }

                if (opus_dynamic) {
                    try {
                        await my_operator.basic_operator.comment_submit(comment_msg, opus_dynamic);
                        await sleep(3e3)
                        await my_operator.basic_operator.dynamic_repost(opus_dynamic, '');
                        await sleep(3e3)
                        await my_operator.basic_operator.dynamic_thumb(opus_dynamic)
                    }
                    catch (e) {
                        console.warn(`${global_var.response.create_dyn_response}\t评论转发失败，comment_repost_dynamic_without_content,\t${pageurl}\t${global_var.user_info.uname}\n`, e)
                        return await utl.my_throw(`评论转发失败，comment_repost_dynamic_without_content，${e}`)
                    }
                }


                else {
                    //先评论
                    try {
                        if (comment_msg != null && comment_msg != undefined) {
                            await my_operator.basic_operator.comment_submit(comment_msg, opus_dynamic)
                        }
                        else {
                            console.warn(`评论获取失败\t${pageurl}\t${global_var.user_info.uname}`)
                            return await utl.my_throw('评论获取失败， comment_repost_dynamic_without_content')
                        }
                        //再转发
                        await sleep(1e3)
                        await global_var.page.click('.bili-dyn-action.forward')//前往转发子页面
                        await sleep(1e3)
                        await my_operator.basic_operator.dynamic_repost(opus_dynamic)
                        //最后点赞
                        await my_operator.basic_operator.dynamic_thumb(opus_dynamic)
                    }
                    catch (e) {
                        console.warn(`${global_var.response.create_dyn_response}\t评论转发失败，comment_repost_dynamic_without_content,\t${pageurl}\t${global_var.user_info.uname}\n`, e)
                        return await utl.my_throw(`评论转发失败，comment_repost_dynamic_without_content，${e}`)
                    }
                }
            },
            only_comment: async function (comment_msg, opus_dynamic) {//只评论
                let pageurl = await global_var.page.url();
                if (pageurl.includes('opus')) {
                    opus_dynamic = true
                }
                else {
                    opus_dynamic = false
                }
                if (opus_dynamic) {
                    try {
                        if (comment_msg != null && comment_msg != undefined) {
                            await my_operator.basic_operator.comment_submit(comment_msg, opus_dynamic)
                        }
                        else {
                            console.warn(`评论获取失败\n${pageurl}\t${global_var.user_info.uname}`)
                            return
                        }
                        await sleep(1e3)
                        await my_operator.basic_operator.dynamic_thumb(opus_dynamic)
                    }
                    catch (e) {
                        console.warn(`评论获取失败\n${global_var.response.global_dynamic_data}\t${pageurl}\t${global_var.user_info.uname}`)
                        return await utl.my_throw(`评论获取失败， only_comment，${e}`)
                    }
                }
                else {


                    try {
                        if (comment_msg != null && comment_msg != undefined) {
                            await my_operator.basic_operator.comment_submit(comment_msg, opus_dynamic)
                        }
                        else {
                            console.warn(`评论获取失败\n${pageurl}\t${global_var.user_info.uname}`)
                            return
                        }
                        await sleep(1e3)
                        await my_operator.basic_operator.dynamic_thumb(opus_dynamic)
                    }
                    catch (e) {
                        console.warn(`评论获取失败\n${JSON.stringify(global_var.response.global_dynamic_data)}\t${pageurl}\t${global_var.user_info.uname}`)
                        return await utl.my_throw(`评论获取失败， only_comment，${e}`)
                    }
                }
            },
            dynamic_content_operator: {//获取动态信息相关操作
                get_dynamic_content_and_top_msg: async function (dynamic_data) {//获取动态内容和up置顶的回复
                    async function get_top_msg() {
                        try {
                            if (global_var.response.reply_main != undefined) {
                                try {
                                    if (global_var.response.reply_main.code == 12061) {
                                        // code:
                                        // 12061
                                        // message:
                                        // 'UP主已关闭评论区'
                                        return ''
                                    }
                                    let ret_msg = ''
                                    let upper_mid = global_var.response.reply_main.data.upper.mid
                                    let replies = global_var.response.reply_main.data.replies
                                    let top = global_var.response.reply_main.data.top.upper
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
                        if (!dynamic_data) {
                            dynamic_data = (await MYAPI.BiliAPI.get_dynamic_v1_detail(MYAPI.BiliAPI.draw_dynamic_id(await global_var.page.url()))).data
                            global_var.response.global_dynamic_data = dynamic_data
                        }
                        let top_msg = ''
                        if (global_var.response.reply_main != undefined) {
                            top_msg = await get_top_msg()
                        }
                        let dynmaic_content = ''
                        let dynamic_type = dynamic_data.item.type
                        if (dynamic_type == 'DYNAMIC_TYPE_AV') {
                            let dynamic_content1;
                            let dynamic_content2;
                            let dynamic_content3;
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
                            try {
                                dynamic_content3 = dynamic_data.item.modules.module_dynamic.major.archive.title
                            }
                            catch {
                                dynamic_content3 = ''
                            }

                            if (dynamic_content1 != undefined && dynamic_content1 != null) { dynmaic_content += dynamic_content1 }
                            if (dynamic_content2 != undefined && dynamic_content2 != null) { dynmaic_content += dynamic_content2 }
                            if (dynamic_content3 != undefined && dynamic_content3 != null) { dynmaic_content += dynamic_content3 }

                        }
                        else if (dynamic_type == "DYNAMIC_TYPE_ARTICLE") {
                            let dynamic_content1;
                            let dynamic_content2;
                            let dynamic_content3;
                            let dynamic_content4;
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
                            try {
                                dynamic_content4 = dynamic_data.item.modules.module_dynamic.major.opus.summary.text
                            }
                            catch {
                                dynamic_content4 = ''
                            }

                            if (dynamic_content1 != undefined && dynamic_content1 != null) { dynmaic_content += dynamic_content1 }
                            if (dynamic_content2 != undefined && dynamic_content2 != null) { dynmaic_content += dynamic_content2 }
                            if (dynamic_content3 != undefined && dynamic_content3 != null) { dynmaic_content += dynamic_content3 }
                            if (dynamic_content4 != undefined && dynamic_content4 != null) { dynmaic_content += dynamic_content4 }
                        }
                        else {
                            let dynamic_content1;
                            let dynamic_content2;
                            let dynamic_content3;
                            try {
                                dynamic_content1 = dynamic_data.item.modules.module_dynamic.major?.opus?.summary?.rich_text_nodes?.map(el => el.text).join('')
                            }
                            catch { dynamic_content1 = '' }
                            try {
                                dynamic_content2 = dynamic_data.item.modules.module_dynamic.topic
                            }
                            catch {
                                dynamic_content2 = ''
                            }
                            try {
                                dynamic_content3 = dynamic_data.item.modules.module_dynamic?.desc?.text
                            }
                            catch {
                                dynamic_content3 = ''
                            }
                            if (dynamic_content1 != undefined && dynamic_content1 != null) { dynmaic_content += dynamic_content1 }
                            if (dynamic_content2 != undefined && dynamic_content2 != null) { dynmaic_content += dynamic_content2 }
                            if (dynamic_content3 != undefined && dynamic_content3 != null) { dynmaic_content += dynamic_content3 }
                        }
                        let ret_dynamic_content = (dynmaic_content + '\n' + top_msg.toString()).trim();
                        return ret_dynamic_content
                    }
                    catch (e) {
                        console.warn(dynamic_data, '\n', global_var.user_info.uname, `get_dynamic_content_and_top_msg\n`, e, dynamic_data, global_var.response.global_dynamic_data);
                        return JSON.stringify(dynamic_data);
                    }
                },
            },
            dynamic_comment_operator: {//回复内容相关操作
                /**
                 * 预回复内容
                 * @param {*} dynamic_content 
                 * @returns 
                 */
                pre_msg_processing: function (dynamic_content, reply_msg) {
                    if (!reply_msg) {
                        reply_msg = ''
                    }
                    let premsg = ''//判断是否需要@或者带话题
                    let msg = undefined
                    dynamic_content = dynamic_content.replaceAll(/＠/gmi, '@')
                    dynamic_content = dynamic_content.replaceAll(/@((?! ).){1,10} /gmi, '')
                    dynamic_content = dynamic_content.replaceAll('转发话题', '带话题')
                    dynamic_content = dynamic_content.replaceAll('＃', '#')
                    let non_topic_content = dynamic_content.replaceAll(/(?<=#)(.{0,10})(?=#)/gmi, '')
                    let topobj_6 = /.*@.{0,3}位.*|.*@.{0,3}名.*/gmi.exec(non_topic_content)
                    let topobj_5 = /.*@.{0,3}1位.*|.*@.{0,3}1名.*/gmi.exec(non_topic_content)
                    let topobj_4 = /.*@.{0,3}一位.*|.*@.{0,3}一名.*/img.exec(non_topic_content)
                    let topobj_3 = /.*@.{0,3}一位好友.*|.*@.{0,3}你的|.*@.{0,3}一名好友.*/img.exec(non_topic_content)
                    let topobj_2 = /.*艾特.{0,3}位好友.*|.*艾特.{0,3}名好友.*/img.exec(non_topic_content)
                    let topobj_1 = /.*@你想祝福的人.*/img.exec(non_topic_content)
                    let topobj0 = /.*@{0,3}位胖友.*|.*@{0,3}名胖友.*/img.exec(non_topic_content)
                    let topobj1 = /.*圈.{0,3}位你的伙伴.*|.*圈.{0,3}名你的伙伴.*/img.exec(non_topic_content)
                    let topobj2 = /.*带tag#.{0,30}#.*/img.exec(non_topic_content)
                    let topobj3 = /.*带话题.{0,15}#.{0,30}#((?!投稿).)*$/img.exec(non_topic_content)
                    let topobj4 = /.*带上tag#.{0,30}#((?!投稿).)*$/img.exec(non_topic_content)
                    let topobj5 = /.*带#.{0,30}#.{0,10}话题((?!投稿).)*$/img.exec(non_topic_content)
                    let topobj6 = /.*艾特好友.*/img.exec(non_topic_content)
                    let topobj7 = /.*@.{0,4}名好友.*|.*@.{0,4}位好友.*/img.exec(non_topic_content)
                    let topobj8 = /.*@你的.{0,3}个小伙伴.*/img.exec(non_topic_content)
                    let topobj9 = /.*@两位好友.*|.*@两名好友.*/img.exec(non_topic_content)
                    let topobj10 = /.*带#.{0,30}#((?!投稿).)*$/img.exec(non_topic_content)
                    let topobj11 = /.*@.{0,5}你的.{0,3}个好友.*/img.exec(non_topic_content)
                    let topobj12 = /.*带[^来】看懂]{0,5}#.{0,30}#((?!投稿).)*$/gmi.exec(non_topic_content)
                    let topobj13 = /.*加话题#.{0,30}#((?!投稿).)*$/img.exec(non_topic_content)
                    let topobj14 = /.*带标签#.{0,30}#((?!投稿).)*$/img.exec(non_topic_content)
                    let topobj15 = /.*@三位好友.*|.*@三名好友.*/img.exec(non_topic_content)
                    if (topobj_6 != null || topobj6 != null || topobj_5 != null || topobj_4 != null || topobj_3 != null || topobj_2 != null || topobj_1 != null || topobj0 != null || topobj1 != null
                        || topobj7 != null || topobj8 != null || topobj11 != null) {
                        premsg = '@' + utl.random_choice(lottery_setting.at_member) + ' '
                    }
                    else if (topobj9 != null) { premsg = `@${utl.random_choice(lottery_setting.at_member)} @${utl.random_choice(lottery_setting.at_member)} ` }
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
                    else if (topobj15 != null) {
                        premsg = `@${utl.random_choice(lottery_setting.at_member)} @${utl.random_choice(lottery_setting.at_member)} @${utl.random_choice(lottery_setting.at_member)} `
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
                    if (/.*带话题#.*#((?!投稿).)*$/gmi.test(non_topic_content) || /.*带((?!】|来|看懂)).{0,5}#/.test(non_topic_content) || topobj2 || topobj3 || topobj4 || topobj5 || topobj10 || topobj12 || topobj13 || topobj14) {
                        if (!(premsg.includes('#') || reply_msg.includes('#'))) {
                            utl.my_throw('话题获取失败')
                            return undefined
                        }
                    }
                    return premsg
                },
                manual_reply_judge: function (dynamic_content) {
                    //判断是否需要人工回复 返回true需要人工判断  返回null不需要人工判断
                    //64和67用作判断是否能使用关键词回复
                    let none_lottery_word1 = /.*测试.{0,5}gua/gmi.test(dynamic_content)
                    if (none_lottery_word1) {
                        return true
                    }
                    dynamic_content = dynamic_content.replaceAll(/〖/gmi, '【')
                    dynamic_content = dynamic_content.replaceAll(/“/gmi, '"')
                    dynamic_content = dynamic_content.replaceAll(/”/gmi, '"')
                    dynamic_content = dynamic_content.replaceAll(/＠/gmi, '@')
                    dynamic_content = dynamic_content.replaceAll(/@.{0,8} /gmi, '')
                    dynamic_content = dynamic_content.replaceAll(/好友/gmi, '朋友')
                    dynamic_content = dynamic_content.replaceAll(/伙伴/gmi, '朋友')
                    dynamic_content = dynamic_content.replaceAll(/安利/gmi, '分享')
                    dynamic_content = dynamic_content.replaceAll(/【关注】/gmi, '')
                    dynamic_content = dynamic_content.replaceAll(/\?/gmi, '？')
                    let manual_re1 = /.*评论.{0,20}告诉|.*有关的评论|.*告诉.{0,20}留言/gmi.test(dynamic_content)
                    let manual_re2 = /.*评论.{0,20}理由|.*参与投稿.{0,30}有机会获得/gmi.test(dynamic_content)
                    let manual_re3 = /.*评论.{0,10}对|.*造.{0,3}句子/gmi.test(dynamic_content)
                    let manual_re4 = /.*猜赢|.*猜对|.*答对|.*猜到.{0,5}答案/gmi.test(dynamic_content)
                    let manual_re5 = /.*说.{0,10}说|.*谈.{0,10}谈|.*夸.{0,10}夸|评论.{0,10}写.{0,10}写|.*写下.{0,5}假如.{0,5}是|.*讨论.{0,10}怎么.{0,10}？/gmi.test(dynamic_content)
                    let manual_re7 = /.*最先猜中|.*带文案|.*许.{0,5}愿望/gmi.test(dynamic_content)
                    let manual_re8 = /.*新衣回/gmi.test(dynamic_content)
                    let manual_re9 = /.*留言.{0,10}建议|.*评论.{0,10}答|.*一句话证明|.*留言.{0,10}得分|.*有趣.{0,3}留言|.*有趣.{0,3}评论|.*留言.{0,3}晒出|.*评论.{0,3}晒出/gmi.test(dynamic_content)
                    let manual_re11 = /.*评论.{0,10}祝福|.*评论.{0,10}意见|.*意见.{0,10}评论|.*留下.{0,10}意见|.*留下.{0,15}印象|.*意见.{0,10}留下/gmi.test(dynamic_content)
                    let manual_re12 = /.*评论.{0,10}讨论|.*话题.{0,10}讨论|.*参与.{0,5}讨论/gmi.test(dynamic_content)
                    let manual_re14 = /.*评论.{0,10}说出|,*留言.{0,5}身高/gmi.test(dynamic_content)
                    let manual_re15 = /.*评论.{0,20}分享|.*评论.{0,20}互动((?!抽奖|,|，|来).)*$|.*评论.{0,20}提问|.*想问.{0,20}评论|.*想说.{0,20}评论|.*想问.{0,20}留言|.*想说.{0,20}留言/gmi.test(dynamic_content)
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
                    let manual_re28 = /.*评论.{0,15}最想做7的事|.*评.{0,15}最喜欢|.*评.{0,15}最.{0,7}的事|.*最想定制的画面|最想.{0,20}\?|最想.{0,20}？/gmi.test(dynamic_content)
                    let manual_re29 = /.*分享.{0,20}经历|.*经历.{0,20}分享/gmi.test(dynamic_content)
                    let manual_re30 = /.*分享.{0,20}心情/gmi.test(dynamic_content)
                    let manual_re31 = /.*评论.{0,10}句/gmi.test(dynamic_content)
                    let manual_re32 = /.*转关评下方视频/gmi.test(dynamic_content)
                    let manual_re33 = /.*分享.{0,10}美好|.*分享.{0,10}期待/gmi.test(dynamic_content)
                    let manual_re34 = /.*视频.{0,10}弹幕/gmi.test(dynamic_content)
                    let manual_re35 = /.*生日快乐/gmi.test(dynamic_content)
                    let manual_re36 = /.*一句话形容/gmi.test(dynamic_content)
                    let manual_re38 = /.*分享.{0,10}喜爱|.*分享.{0,10}最爱|.*推荐.{0,10}最爱|.*推荐.{0,10}喜爱/gmi.test(dynamic_content)
                    let manual_re39 = /.*分享((?!,|，).){0,10}最|.*评论((?!,|，).){0,10}最/gmi.test(dynamic_content)
                    let manual_re40 = /.*带话题.{0,15}晒|.*带话题.{0,15}讨论/gmi.test(dynamic_content)
                    let manual_re41 = /.*分享.{0,15}事|点赞.{0,3}数.{0,3}前/gmi.test(dynamic_content)
                    let manual_re42 = /.*送出.{0,15}祝福/gmi.test(dynamic_content)
                    let manual_re43 = /.*评论.{0,30}原因/gmi.test(dynamic_content)
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
                    let manual_re61 = /.*看.{0,10}猜/gmi.test(dynamic_content)
                    let manual_re63 = /.*评论.{0,10}猜|.*评论.{0,15}预测/gmi.test(dynamic_content)
                    let manual_re65 = /.*老规矩你们懂的/gmi.test(dynamic_content)
                    let manual_re67 = /.*[评|带]((?!抽奖|,|，|来).){0,7}“|.*[评|带]((?!抽奖|,|，|来).){0,7}"|.*[评|带]((?!抽奖|,|，|来).){0,7}【|.*[评|带]((?!抽奖|,|，|来).){0,7}:|.*[评|带]((?!抽奖|,|，|来).){0,7}：|.*[评|带]((?!抽奖|,|，|来).){0,7}「|.*带关键词.{0,7}"|.*评论关键词[“”‘’"']|.*留言((?!抽奖|,|，|来).){0,7}“|.*对出.{0,10}下联.{0,5}横批|.*回答.{0,8}问题|.*留下.{0,10}祝福语|.*留下.{0,10}愿望|.*找到.{0,10}不同的.{0,10}留言|.*答案放在评论区|.*几.{0,5}呢？|.*有奖问答|.*想到.{0,19}关于.{0,20}告诉|.*麻烦大伙评论这个|报暗号【.{0,4}】|评论.{0,3}输入.{0,3}["“”:：]|.*评论.{0,7}暗号/gmi.test(dynamic_content)
                    let manual_re76 = /.*留言((?!抽奖|,|，|来).).{0,7}"|.*留下((?!抽奖|,|，|来).){0,5}“|.*留下((?!抽奖|,|，|来).){0,5}【|.*留下((?!抽奖|,|，|来).){0,5}:|.*留下((?!抽奖|,|，|来).){0,5}：|.*留下((?!抽奖|,|，|来).){0,5}「/gmi.test(dynamic_content)
                    let manual_re77 = /.*留言((?!抽奖|,|，|来).).{0,7}"|.*留言((?!抽奖|,|，|来).).{0,7}“|.*留言((?!抽奖|,|，|来).){0,7}【|.*留言((?!抽奖|,|，|来).){0,7}:|.*留言((?!抽奖|,|，|来).){0,7}：|.*留言((?!抽奖|,|，|来).){0,7}「/gmi.test(dynamic_content)
                    let manual_re64 = /和.{0,5}分享.{0,5}的|.*分享.{0,10}你的|.*正确回答|.*回答正确|.*评论.{0,10}计划|.*定.{0,10}目标.{0,5}？|.*定.{0,10}目标.{0,5}?|.*评论.{0,7}看的电影|.*如果.{0,20}觉得.{0,10}？|.*如果.{0,20}觉得.{0,10}\?|评论.{0,7}希望.{0,5}|.*竞猜[\s\S]{0,15}[答评]|.*把喜欢的.{0,10}评论|.*评论.{0,5}解.{0,5}密|.*这款.{0,10}怎么.{0,3}？|.*最喜欢.{0,5}的.*为什么？|.*留下.{0,15}的.{0,5}疑问|.*写下.{0,10}的.{0,5}问题/gmi.test(dynamic_content)
                    let manual_re6 = /.*@TA|.*@.{0,15}朋友|.*艾特|.*@.{0,3}你的|.*标记.{0,10}朋友|.*@{0,15}赞助商|.*发表你的新年愿望\+个人的昵称|.*抽奖规则请仔细看图片|.*带上用户名|.*活动详情请戳图片|.*@个人用户名|评论.{0,5}附带.{0,10}相关内容|回复.{0,5}视频.{0,10}相关内容|.*评论.{0,5}昵称/gmi.test(dynamic_content)
                    let manual_re62 = /.*评论.{0,10}#.*什么|.*转评.{0,3}#.*(?<=，)/gmi.test(dynamic_content)
                    let manual_re68 = /.*将.{0,10}内容.{0,10}评|.*打几分？/gmi.test(dynamic_content)
                    let manual_re70 = /.*会不会.{0,20}？|.*会不会.{0,20}\?|如何.{0,20}？|如何.{0,20}\?/gmi.test(dynamic_content)
                    let manual_re71 = /.*猜.{0,10}猜|.*猜.{0,10}比分|.*猜中.{0,10}获得|.*猜中.{0,10}送出/gmi.test(dynamic_content)
                    let manual_re72 = /.*生日|.*新年祝福/gmi.test(dynamic_content)
                    let manual_re73 = /.*知道.{0,15}什么.{0,15}？|.*知道.{0,15}什么.{0,15}\?|.*用什么|.*评.{0,10}收.{0,5}什么.{0.7}\?|.*评.{0,10}收.{0,5}什么.{0,7}？/gmi.test(dynamic_content)
                    let manual_re74 = /.*领.{0,10}红包.{0,5}大小|.*领.{0,10}多少.{0,10}红包|.*红包金额/gmi.test(dynamic_content)
                    let manual_re75 = /.*本周话题|.*互动话题|.*互动留言|.*互动时间|.*征集.{0,10}名字|.*投票.{0,5}选.{0,10}最.{0,5}的|.*一人说一个谐音梗|帮.{0,5}想想.{0,5}怎么|评论.{0,5}想给.{0,7}的/gmi.test(dynamic_content)

                    return manual_re1 || manual_re2 || manual_re3 || manual_re4 || manual_re5 || manual_re6 || manual_re7 || manual_re8 || manual_re9 ||
                        manual_re11 || manual_re12 || manual_re14 || manual_re15 || manual_re16 || manual_re17 || manual_re18 || manual_re19 || manual_re20 || manual_re21 || manual_re22 || manual_re23 || manual_re24 || manual_re25 ||
                        manual_re26 || manual_re27 || manual_re28 || manual_re29 || manual_re30 ||
                        manual_re31 || manual_re32 || manual_re33 || manual_re34 || manual_re35 ||
                        manual_re36 || manual_re38 || manual_re39 || manual_re40 ||
                        manual_re41 || manual_re42 || manual_re43 || manual_re76 ||
                        manual_re47 || manual_re48 || manual_re49 || manual_re50 || manual_re51 ||
                        manual_re53 || manual_re54 || manual_re58 || manual_re55 || manual_re56 ||
                        manual_re57 || manual_re61 || manual_re62 || manual_re63 || manual_re64 ||
                        manual_re65 || manual_re67 || manual_re68 || manual_re70 || manual_re71 || manual_re72 || manual_re73 ||
                        manual_re74 || manual_re75 || manual_re77 || manual_re77
                },
                /**
                 * 返回true代表这个动态不是抽奖up的动态，不能转发评论
                 * @returns 
                 */
                non_lottery_up_judge: function () {
                    try {
                        let non_lottery_up_mids = ['391464745', '14064125', '332793152', '54790268', '46880349', '294887687', '3493120108923438', '3537106980833281', '3532811', '1508263674']
                        let up_mid = global_var.response.global_dynamic_data.item.modules.module_author.mid.toString()
                        if (non_lottery_up_mids.includes(up_mid)) {
                            return true
                        }
                        else {
                            return false
                        }
                    }
                    catch (e) {
                        console.warn(`Error\tnon_lottery_up_judge\n`, e);
                    }
                },
                key_word_reply: function (dynamic_content) {
                    if (
                        /.*[评|带]((?!抽奖|,|，|来).){0,7}“|.*[评|带]((?!抽奖|,|，|来).){0,7}"|.*[评|带]((?!抽奖|,|，|来).){0,7}【|.*[评|带]((?!抽奖|,|，|来).){0,7}:|.*[评|带]((?!抽奖|,|，|来).){0,7}：|.*[评|带]((?!抽奖|,|，|来).){0,7}「|.*带关键词.{0,7}"|.*评论关键词[“”‘’"']|.*留言((?!抽奖|,|，|来).){0,7}“|.*对出.{0,10}下联.{0,5}横批|.*回答.{0,8}问题|.*留下.{0,10}祝福语|.*留下.{0,10}愿望|.*找到.{0,10}不同的.{0,10}留言|.*答案放在评论区|.*几.{0,5}呢？|.*有奖问答|.*想到.{0,19}关于.{0,20}告诉|.*麻烦大伙评论这个|留下.{0,7}的|报暗号【.{0,4}】/gmi.test(dynamic_content)
                        || /.*留下((?!抽奖|,|，).){0,5}“|.*留下((?!抽奖|,|，).){0,5}【|.*留下((?!抽奖|,|，).){0,5}:|.*留下((?!抽奖|,|，).){0,5}：|.*留下((?!抽奖|,|，).){0,5}「/gmi.test(dynamic_content)
                        || /.*留言((?!抽奖|,|，).).{0,7}“|.*留言((?!抽奖|,|，).){0,7}【|.*留言((?!抽奖|,|，).){0,7}:|.*留言((?!抽奖|,|，).){0,7}：|.*留言((?!抽奖|,|，).){0,7}「/gmi.test(dynamic_content)
                        || /.*分享.{0,10}你的|.*正确回答|.*回答正确|.*评论.{0,10}计划|.*定.{0,10}目标.{0,5}？|.*定.{0,10}目标.{0,5}?|.*评论.{0,7}看的电影|.*如果.{0,20}觉得.{0,10}？|.*如果.{0,20}觉得.{0,10}\?|评论.{0,7}希望.{0,5}|.*竞猜[\s\S]{0,15}答|.*把喜欢的.{0,10}评论|.*评论.{0,5}解.{0,5}密|.*这款.{0,10}怎么.{0,3}？|.*最喜欢.{0,5}的.*为什么？|.*留下.{0,15}的.{0,5}疑问|.*写下.{0,10}的.{0,5}问题/gmi.test(dynamic_content)
                        || /.*@TA|.*@.{0,15}朋友|.*艾特|.*@.{0,3}你的|.*标记.{0,10}朋友|.*@{0,15}赞助商|.*发表你的新年愿望\+个人的昵称|.*抽奖规则请仔细看图片|.*带上用户名|.*活动详情请戳图片|.*@个人用户名|评论.{0,5}附带.{0,10}相关内容|回复.{0,5}视频.{0,10}相关内容/gmi.test(dynamic_content)
                        || /.*评论.{0,10}#.*什么|.*转评.{0,3}#.*(?<=，)/gmi.test(dynamic_content)
                        || /.*本周话题|.*互动话题|.*互动留言|.*互动时间|.*征集.{0,10}名字/gmi.test(dynamic_content)

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
                    if (/.*生日季|.*生日回|.*生日会|.*生日祝福|.*岁生日/gmi.test(dynamic_content)) {
                        if (lottery_setting.key_word_comment.birthday_congratulation) {
                            return utl.random_choice(lottery_setting.key_word_comment.birthday_congratulation)
                        }
                        else {
                            return utl.random_choice(['生快', '生日快乐！', '生日快乐呀'])
                        }
                    }
                    if (/.*新年祝福/gmi.test(dynamic_content)) {
                        if (lottery_setting.key_word_comment.newyear_congratulation) {
                            return utl.random_choice(lottery_setting.key_word_comment.newyear_congratulation)
                        }
                        else {
                            return utl.random_choice(['祝新年福满天！', '新年快乐！', '新年快乐呀'])
                        }
                    }
                    if (/.*长按.{0,5}复制|.*复制.{0,5}长按|.*长按.{0,5}fu制|.*长按.{0,5}copy/gmi.test(dynamic_content)) {
                        if (lottery_setting.key_word_comment.qiafan_promotion) {
                            return utl.random_choice(lottery_setting.key_word_comment.qiafan_promotion)
                        }
                        else {
                            return undefined
                        }

                    }
                    return undefined
                },
                /**
                 * 如果返回值包含undefined或者不包含需要人工回复就直接开始抽奖
                 * @param {String} dynamic_content 
                 * @param {String} dynamic_id 
                 * @returns 
                 */
                reply_comment_generator: async function (dynamic_content, dynamic_id) {
                    //生成所需评论//生成评论
                    let comment_msg = undefined
                    if (my_operator.dynamic_comment_operator.non_lottery_up_judge()) {
                        console.log('包含非抽奖up，跳过')
                        comment_msg = '人工回复'
                        await utl.my_throw('需要人工回复的动态')
                        return undefined
                    }
                    if (my_operator.dynamic_comment_operator.manual_reply_judge(dynamic_content) || global_var.response.global_dynamic_data.item.basic.comment_type == 1) {//先判断是否要人工回复 视频全部抄
                        let key_reply = my_operator.dynamic_comment_operator.key_word_reply(dynamic_content)//再判断是否包含关键词回复
                        if (!key_reply) {//如果没有关键词，那就判断是否抄评论或者直接交给人工回复
                            let e = { prev: 0, next: 0 };
                            let copy_msg_flag = my_operator.copy_reply_module.copy_reply_judge(dynamic_content) || global_var.response.global_dynamic_data.item.basic.comment_type == 1
                            if (!copy_msg_flag) {//如果不能抄评论，先设置为人工回复
                                e.next = 2
                            }
                            if (copy_msg_flag && Math.random() < lottery_setting.copy_reply_module.comment_copy_chance) {//优先顺序为：1:先抄评论；2:AI写评论；3:如果AI没写出来就抄评论；4:人工回复
                                e.next = 0;
                            }
                            else if (Math.random() < lottery_setting.copy_reply_module.AI_reply_chance) {
                                e.next = 1;
                            } else {
                                e.next = 2;
                            }
                            //0: 抄评论 1:AI回复 2:人工回复
                            let get_comment_times = 0;
                            while (!comment_msg) {
                                get_comment_times++;
                                switch (e.prev = e.next) {
                                    case 0:
                                        console.log(`${global_var.user_info.uname}\t可以抄评论的动态\t${dynamic_id}\t${(new Date()).toLocaleTimeString()}`)
                                        let copy_msg;
                                        let para_msg;
                                        try {
                                            if (global_var.response.global_dynamic_data.item.basic.comment_type == 1 || global_var.response.global_dynamic_data.item.basic.comment_type == 8) {
                                                copy_msg = await my_operator.copy_reply_module.get_copy_reply(dynamic_id, 1, Math.random(), true, dynamic_content)
                                            }
                                            else {
                                                copy_msg = await my_operator.copy_reply_module.get_copy_reply(dynamic_id, 1, 0.01, false, dynamic_content)
                                            }
                                            console.log(`${global_var.user_info.uname}\t抄取评论：${copy_msg}\t${(new Date()).toLocaleTimeString()}`)
                                        }
                                        catch (e) {
                                            console.warn(`${global_var.user_info.uname}\t获取抄评论内容失败，reply_comment_generator，`, e);
                                        }
                                        if (my_operator.copy_reply_module.para_phase_judge(dynamic_content)) {
                                            if (copy_msg && Math.random() < lottery_setting.copy_reply_module.comment_paraphrase_chance) {
                                                try {
                                                    console.log(`${global_var.user_info.uname}\t将要进行改写的评论：${copy_msg}\t${(new Date()).toLocaleTimeString()}`)
                                                    para_msg = await my_operator.copy_reply_module.ChatGPT_paraphase(copy_msg);
                                                    console.log(`${global_var.user_info.uname}\n原评论：${copy_msg}\n改写为评论：${para_msg}\t${(new Date()).toLocaleTimeString()}`)
                                                }
                                                catch (e) {
                                                    console.warn(`${global_var.user_info.uname}\t获取同义改写内容失败，reply_comment_generator，`, e);
                                                }
                                            }
                                        } else {
                                            console.debug(`${global_var.user_info.uname}\t特殊动态内容无法使用同义改写`)
                                        }
                                        comment_msg = (para_msg == undefined || para_msg == '') ? copy_msg : para_msg;
                                        if (e.prev == 1) {
                                            if (get_comment_times > 3) {
                                                e.next = 2;
                                            }
                                        }
                                        else {
                                            e.next = 1;
                                        }
                                        break;
                                    case 1:
                                        try {
                                            // let AI_reply = await my_operator.copy_reply_module.AI_reply(dynamic_content)
                                            let AI_reply = await my_operator.copy_reply_module.ChatGpt_reply(dynamic_content)
                                            comment_msg = AI_reply
                                            if (comment_msg == '' || comment_msg == undefined) {
                                                if (get_comment_times > 3) {
                                                    e.next = 0;
                                                }
                                                break;
                                                // comment_msg = '人工回复'
                                                // await utl.my_throw('需要人工回复的动态')
                                                // return undefined;
                                            }
                                        }
                                        catch (__) {
                                            console.warn(`${global_var.user_info.uname}\tAI回复失败！启动抄评论模式\n${__}`);
                                            if (get_comment_times > 3) {
                                                e.next = 0;
                                            }
                                            // comment_msg = '人工回复'
                                            // await utl.my_throw('需要人工回复的动态')
                                            // return undefined;
                                        }
                                        break;
                                    case 2:
                                        comment_msg = '人工回复'
                                        console.log(`${global_var.user_info.uname}\t需要人工回复的动态\t${dynamic_id}\t${(new Date()).toLocaleTimeString()}`)
                                        await utl.my_throw('需要人工回复的动态')
                                        return undefined;//返回undefined表示需要人工回复，而不是从预设的回复里面选内容

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
                        }
                        else {
                            console.log(`${await global_var.page.url()}\n触发关键词回复:${dynamic_content}`)
                            comment_msg = key_reply;
                        }
                    }
                    let pre_msg = ''

                    if (typeof comment_msg == "string" && comment_msg.includes('人工回复')) {
                        comment_msg = undefined;
                    }


                    pre_msg = my_operator.dynamic_comment_operator.pre_msg_processing(dynamic_content, comment_msg)
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

                    //最后检查一下回复内容是否正常
                    if (!comment_msg || typeof comment_msg != 'string' || pre_msg == undefined) {
                        comment_msg = '回复内容出错'
                        utl.my_throw('回复内容出错')
                        return undefined
                    }
                    if (comment_msg.includes(pre_msg)) {
                        pre_msg = ''
                    }
                    return pre_msg + comment_msg
                }
            },
            log_record: {
                construct_comment_record_data: async function (comment_msg) {
                    let rep_dynamic_id = ''
                    try {
                        if (global_var.response.create_dyn_response) {
                            rep_dynamic_id = global_var.response.create_dyn_response.data.dynamic_id_str || global_var.response.create_dyn_response.data.dyn_id_str
                        }
                    } catch {
                        rep_dynamic_id = ''
                    }
                    let rpid
                    try {
                        if (global_var.response.comment_dyn_response) {
                            rpid = global_var.response.comment_dyn_response.data.reply.rpid_str
                        }
                    }
                    catch { rpid = undefined }
                    let ctime;
                    try {
                        if (!comment_msg.includes('点过赞的动态')) {
                            let d = new Date()
                            ctime = d.toLocaleString(global_var.response.comment_dyn_response.data.reply.ctime)
                        }
                        else {
                            ctime = (new Date()).toLocaleString()
                        }
                    }
                    catch {
                        let d = new Date()
                        ctime = d.toLocaleString()
                    }
                    try {
                        var author_name = global_var.response.global_dynamic_data.item.modules.module_author.name
                    }
                    catch {
                        console.log(`construct_comment_record_data中global_var.response.global_dynamic_data出错:${JSON.stringify(global_var.response.global_dynamic_data)}`);
                        author_name = undefined
                    }
                    try {
                        var author_mid = global_var.response.global_dynamic_data.item.modules.module_author.mid
                        var author_homepage = `https://space.bilibili.com/${author_mid}/dynamic`
                    }
                    catch {
                        console.log(`construct_comment_record_data中global_var.response.global_dynamic_data出错：${JSON.stringify(global_var.response.global_dynamic_data)}`);
                        author_homepage = undefined
                    }
                    try {
                        if (!comment_msg.includes("404动态")) {
                            var dynamic_content = JSON.stringify(await my_operator.dynamic_content_operator.get_dynamic_content_and_top_msg(global_var.response.global_dynamic_data)).replace(/,/g, '，')
                            dynamic_content = dynamic_content.replaceAll(/(\[(?<=\[)(.*?)(?=\])])/gmi, "")//移除表情包
                        }
                    }
                    catch {
                        console.log(global_var.response.global_dynamic_data, new Date());
                        dynamic_content = undefined
                    }
                    let comment_count;
                    let forward_count;
                    try {
                        comment_count = global_var.response.global_dynamic_data.item.modules.module_stat.comment.count
                        forward_count = global_var.response.global_dynamic_data.item.modules.module_stat.forward.count
                    } catch { }

                    let lottery_reply_record = `${global_var.pageurl}#reply${rpid} ,${comment_count},${forward_count},${JSON.stringify(comment_msg)},${ctime},${author_name},${dynamic_content},${author_homepage},${rep_dynamic_id}`
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
                    if ((await global_var.page.$('.bili-rich-text-module.lottery') || await global_var.page.$(`.opus-text-rich-hl.lottery`)) &&
                        JSON.stringify(global_var.response.global_dynamic_data.item.modules.module_dynamic.desc).includes('RICH_TEXT_NODE_TYPE_LOTTERY')) {//选取互动抽奖蓝标
                        if (lottery_setting.official_lottery_switch) {

                        }
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
                },
                judge_charge_lottery: async function () {
                    if (await global_var.page.$('.bili-dyn-upower-lottery__title.bili-ellipsis')) {
                        return true
                    }
                    else {
                        return false
                    }
                },
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
                            await my_operator.prevent_filter_module.create_word_dynamic_from_dynamic_main_page(lottery_setting.prevent_module.create_word_dynamic_chp, 1)
                        }
                    } catch {
                        console.warn('创建文字动态失败');
                    }
                },
                /**
                 * 获取分享视频的网址，需要在https://www.bilibili.com下进行
                 * @param {*} __share_num 
                 * @returns 
                 */
                get_video_list: async function (__share_num) {
                    let now_pageurl = await global_var.page.url();
                    if (!now_pageurl.includes('https://www.bilibili.com')) {
                        await global_var.page.goto(`https://www.bilibili.com`)
                    }
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
                            if (!share_video_list.includes(i)) {
                                share_video_list.push(i);
                            }
                        }
                        let fresh_btn;
                        try {
                            fresh_btn = await global_var.page.$('.primary-btn');
                        }
                        catch {
                            try {
                                fresh_btn = await global_var.page.$('.bilifont.bili-icon_caozuo_huanyihuan')
                            } catch (e) {
                                console.log(`${global_var.user_info.uname} 获取刷新按钮失败`, e);
                                return share_video_list;
                            }
                        }
                        await sleep(1e3)
                        if (fresh_btn) {
                            await fresh_btn.click();
                        }
                        else {
                            return share_video_list;
                        }
                        await sleep(1e3)
                        if (share_video_list.length == 0 || counter > 10) {
                            bt += true
                        }
                        counter++
                    }
                    return share_video_list
                },
                share_video: async function (share_num, share_chance, copy_chance) {
                    if (share_chance == undefined) {
                        share_chance = lottery_setting.prevent_module.share_video_chance == undefined ? 0.5 : lottery_setting.prevent_module.share_video_chance
                    }
                    if (copy_chance == undefined) {
                        copy_chance = lottery_setting.prevent_module.share_copy_chance == undefined ? 0.5 : lottery_setting.prevent_module.share_copy_chance
                    }

                    async function share_video_operator(pageurl) {
                        await global_var.page.waitForSelector(`.bpx-player-video-area`)
                        await sleep(3e3)
                        await global_var.page.click(`.bpx-player-video-area`)
                        console.log(`点击了暂停视频`);
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
                                    if (Math.random() < copy_chance) {
                                        let BV = /(BV.{10})/gmi.exec(pageurl).pop();
                                        let copycontent;
                                        let paraphrase_input;
                                        if (BV) {
                                            copycontent = await my_operator.copy_reply_module.get_copy_reply(BV, 1, 0.5);
                                            if (copycontent) {
                                                paraphrase_input = await my_operator.copy_reply_module.ChatGPT_paraphase(copycontent);
                                            }
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
                                                        await msg_box.type(inputstr, { delay: 20 })
                                                        await sleep(1e3)
                                                        msg_box_content = await share_iframe.$eval(`#editor`, el => el.value);
                                                        msg_box_content = msg_box_content.replace(/[\u200B-\u200D\uFEFF]/g, '');
                                                        await sleep(1e3);
                                                        if (utl.remove_invisible_char(msg_box_content.replaceAll(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "")) != utl.remove_invisible_char(inputstr.replaceAll(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, ""))) {//如果不等就删掉重新输入
                                                            await msg_box.focus()
                                                            await global_var.page.keyboard.down('Control');
                                                            await global_var.page.keyboard.press('A');
                                                            await global_var.page.keyboard.up('Control');
                                                            await sleep(1e3)
                                                            await global_var.page.keyboard.press('Backspace');
                                                            console.log('输入框里内容与评论不符，删除输入框里内容', `\nmsg_box_content:${msg_box_content}\ninputstr:${inputstr}`);
                                                        }
                                                        else {
                                                            break;//相等了break出去
                                                        }
                                                        if (_bt >= 5) {
                                                            console.log('输入框里输入内容失败');
                                                            await utl.my_throw('动态评论失败')
                                                            throw (`分享视频输入内容失败！输入内容与输入框内容不符\nmsg_box_content:${msg_box_content}\ninputstr:${inputstr}`)
                                                        }
                                                        _bt++;
                                                    }
                                                    await sleep(1e3)
                                                    break;
                                                }
                                                catch (e) {
                                                    console.error(e);
                                                    if (bt >= 5) {
                                                        throw (e)
                                                    }
                                                    await sleep(3e3);
                                                    await global_var.page.evaluate(() => {
                                                        this.scrollTo(0, 1500)
                                                    });
                                                    await global_var.page.evaluate(() => {
                                                        this.scrollTo(0, -1500)
                                                    })
                                                    await sleep(3e3);
                                                    if (e == `分享视频输入内容失败！输入内容与输入框内容不符`) {
                                                        break;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            console.warn(`分享视频inputstr未定义`);
                                        }
                                    }
                                } catch (e) {
                                    console.error(`${global_var.user_info.uname} 获取视频评论内容失败`);
                                    console.error(e)
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
                    if (pageurl == 'https://www.bilibili.com/' && lottery_setting.prevent_module.share_video_switch && lottery_setting.FLAG.share_flag) {
                        let video_list = await this.get_video_list(share_num)
                        let share_video_list = []
                        video_list = utl.part_shuffle(video_list.length, video_list)
                        video_list.some((rcm_video) => {
                            if (share_video_list.length <= share_num) {
                                if (!share_video_list.includes(rcm_video) && !rcm_video.includes('cm.bilibili.com')) {
                                    share_video_list.push(rcm_video)
                                }
                            }
                            else {
                                return
                            }
                        })
                        console.log(`${global_var.user_info.uname}\t开始分享视频`, share_video_list, (new Date()).toLocaleString())
                        if (share_video_list.length > 0) {
                            for (let video_elem of share_video_list) {
                                try {
                                    if (utl.checkAuditTime(global_var.TIME.None_Lottery_Time[0], global_var.TIME.None_Lottery_Time[1])) {
                                        console.log(`${global_var.user_info.uname}\t触发非抽奖时间段，需要进行休息（分享视频也是需要休息的）：${global_var.TIME.None_Lottery_Time[0]}-${global_var.TIME.None_Lottery_Time[1]}暂停到${global_var.TIME.None_Lottery_Time[1]}\t${(new Date()).toLocaleTimeString()}`);
                                        let sleep_hour = parseInt(global_var.TIME.None_Lottery_Time[1].slice(0, 2)) - (new Date()).getHours()
                                        await sleep(sleep_hour * 3600e3)
                                    }
                                    lottery_setting.prevent_module.share_video_url = video_elem
                                    console.log(`${global_var.user_info.uname} 分享视频：`, lottery_setting.prevent_module.share_video_url, (new Date()).toLocaleString())
                                    if (await global_var.page.isClosed()) {
                                        console.log(`${global_var.user_info.uname}\t浏览器页面已经关闭，退出分享视频\t${(new Date()).toLocaleString()}`);
                                        return;
                                    }
                                    await global_var.page.goto(video_elem)
                                    await sleep(10e3)
                                    try {
                                        await share_video_operator(lottery_setting.prevent_module.share_video_url)
                                    }
                                    catch (e) {
                                        console.warn(e, global_var, 'share_video_operator分享视频失败');
                                        throw (e, global_var)
                                    }

                                    let st = utl.random_choice(lottery_setting.prevent_module.share_video_sleep_time);
                                    if (share_video_list.length < 5) {
                                        st = utl.random_choice([2 * 60e3, 1 * 60e3, 1.5 * 60e3])
                                    }
                                    console.log(`${global_var.user_info.uname}\t当前分享视频进度：${share_video_list.indexOf(video_elem) + 1}/${share_video_list.length}`);
                                    console.log(`${global_var.user_info.uname}\t休眠 ${st / 1e3}秒\t${(new Date()).toLocaleTimeString()}`);
                                    await sleep(st)
                                }
                                catch (e) {
                                    console.warn(`分享单个视频失败\n`, e);
                                    await sleep(1e3)
                                    continue;
                                }
                            }
                        }

                        lottery_setting.FLAG.share_flag = false
                    }
                },
                create_word_dynamic_from_dynamic_main_page: async function (content_list, create_times) {
                    let now = new Date();
                    if (now.getHours() >= 0 && now.getHours() <= 22) {
                        if (now.getHours() >= 5) {
                            console.log(`\t5点到22点不分享文字动态\t${(new Date()).toLocaleTimeString()}`)
                            return
                        }
                        if (now.getHours() <= 22) {
                            if (now.getHours() >= 5) {
                                console.log(`\t5点到22点不分享文字动态\t${(new Date()).toLocaleTimeString()}`)
                                return
                            }

                        }
                    }
                    if (!((await global_var.page.url()).includes('t.bilibili.com'))) {
                        await global_var.page.goto('https://t.bilibili.com/');
                    }
                    console.log(`${global_var.user_info.uname}\t分享彩虹屁`)
                    let content
                    if (!create_times) { create_times = 1 }
                    for (let i = 0; i < create_times; i++) {
                        content = utl.random_choice(content_list)
                        if (typeof content != 'string' || !content || content.includes('undefined') || content.includes('null') || content.includes('true') || content.includes('false')) {//检查是否传入的是string类型参数 或者是否为空
                            continue
                        }
                        await global_var.page.goto('https://t.bilibili.com', { waitUntil: 'networkidle0' })
                        for (let i = 0; i < 5; i++) {
                            let textarea = await global_var.page.$('.bili-rich-textarea')
                            await textarea.click()
                            await global_var.page.focus('.bili-rich-textarea')
                            await sleep(1e3)
                            await textarea.type(content, { delay: 20 })
                            await sleep(1e3)
                            let textarea_content = await global_var.page.$eval('.bili-rich-textarea', el => el.textContent)
                            textarea_content = textarea_content.trim()
                            if (utl.remove_invisible_char(textarea_content.slice(1).replaceAll(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "")) == utl.remove_invisible_char(content.replaceAll(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, ""))) {
                                await sleep(utl.random_choice(3 * lottery_setting.prevent_module.share_video_sleep_time))
                                await global_var.page.click('.bili-dyn-publishing__action.launcher')
                                console.log(`${global_var.user_info.uname}\t点击了发布动态`);
                                let check_btn;
                                try {
                                    check_btn = await global_var.page.$('.bili-dyn-specification-popup__btn.bili-button.primary.bili-button--medium')
                                    if (check_btn) {
                                        await check_btn.click();
                                    }
                                }
                                catch {
                                }
                                break;
                            }
                            else {//如果不等于要发布的内容就全删了，重新打
                                await sleep(1e3)
                                await textarea.focus('.bili-rich-textarea')
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
                },
                create_topic_dynamic_from_dynamic_main_page: async function (create_times, discuss_content, copy_discuss_flag) {
                    if (typeof create_times != 'number') {
                        create_times = 1;
                    }
                    if (!((await global_var.page.url()).includes('t.bilibili.com'))) {
                        await global_var.page.goto('https://t.bilibili.com/');
                    }
                    let relevant_topic__titles = await global_var.page.$$(`.relevant-topic__title`)
                    for (let i = 0; i < create_times; i++) {
                        extract_topic_title = utl.random_choice(relevant_topic__titles)
                        relevant_topic__titles.splice(relevant_topic__titles.indexOf(extract_topic), 1)//选好的话题就删掉
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
                    '来了',
                    '期待',
                    '好',
                    '来了来了',
                    '好好好',
                    '抽我',
                    '抽我抽我',
                    '下午好',
                    '早上好',
                    '中午好',
                    '晚上好',
                    '重在参与',
                    '许愿',
                    '加油点赞',
                    '支持支持',
                    '支持',
                    '好耶',
                    '1',
                    '不错啊',
                    '许愿呀',
                    '锦鲤附体',
                    '用自己的微薄之力给up撑腰',
                    '冲冲冲',
                    '做个梦',
                    '幸运儿来啦！',
                    '来力来力',
                    '坚持不懈，迎难而上，开拓创新！',
                    '我',
                    '中',
                    '来力',
                    '开心',
                    '可以',
                    '来啦',
                    '万一呢',
                    '加油加油!',
                    '加油加油！',
                    '点赞',
                    '真棒',
                    '坚持不懈，迎难而上',
                    '谢谢宠粉祝粉丝越来越多发展越来越好'
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
                get_copy_reply: async (dynamic_id_or_BVid, mode, pn_percent, get_api_reply_resp_flag, dynamic_content = '') => {//，获取的评论是去掉了@和表情包的
                    //dynamic_id_or_BVid:动态id或bv号 mode ：1是热评，2是最新 ，3是混合 pn_percent：评论大致的百分比页数，入参是小数
                    let all_replies_content = []
                    let ret_reply;//最终返回的评论
                    for (let _ = 0; _ < 3; _++) {
                        //超过就退出,进行随机抽取
                        let reps = await my_operator.copy_reply_module.get_reply_list(dynamic_id_or_BVid, mode, pn_percent, get_api_reply_resp_flag, dynamic_content);
                        all_replies_content = all_replies_content.concat(reps.ret_list);
                        if (reps.reply_count <= 10) {//没有评论直接退出
                            break;
                        }
                        if (all_replies_content.length <= 15) {//如果只获取到了一半的话，再获取一点，不然样本数量不够
                            reps = await my_operator.copy_reply_module.get_reply_list(dynamic_id_or_BVid, mode, Math.random(), true, dynamic_content);
                            all_replies_content = all_replies_content.concat(reps.ret_list);
                        }
                        if (all_replies_content.length <= 15) {
                            continue;
                        }
                        console.log('获取到的所有评论', all_replies_content);
                        if (!!ret_reply) {
                            break
                        }
                        pn_percent = Math.random()//每次循环设置为随机值，防止一直获取同样内容
                        await sleep(10e3)
                        if (reps.reply_count <= 10) {//没有评论直接退出
                            break;
                        }
                    }
                    if (all_replies_content.length >= 15) {
                        ret_reply = utl.weight_rand(all_replies_content);
                    }
                    return ret_reply;
                },
                /**
                 * 
                 * @param {string} dynamic_id_or_BVid 
                 * @param {number} mode 1是热评，2是最新 ，3是混合
                 * @param {number} pn_percent 评论大致的百分比页数，入参是小数
                 * @param {bool} get_api_reply_resp_flag true是获取api响应，false则使用global_var里面的评论响应
                 * @returns { {ret_list:[String], reply_count:number }} { ret_list, reply_count }
                 */
                get_reply_list: async (dynamic_id_or_BVid, mode, pn_percent, get_api_reply_resp_flag, dynamic_content = '') => {
                    if (!(global_var.response.reply_main && global_var.response.reply_main.code == 0)) {//如果global_var的响应没问题
                        if (get_api_reply_resp_flag === undefined) {
                            get_api_reply_resp_flag = false;
                        }
                    }
                    let ret_list = [];
                    let dynDetail_data = global_var.response.global_dynamic_data;
                    let comment_id_str;
                    let comment_type;
                    let reply_count = 0;
                    let up_mid = 0;
                    let get_comment_page = 0;//获取评论页数，20条评论一页
                    let reply_main_res;
                    let get_api_fail = false//true代表获取api失败


                    if (!String(dynamic_id_or_BVid).toUpperCase().includes('BV')) {//如果是动态id
                        if (dynDetail_data == undefined || dynDetail_data == -412 || global_var.response.reply_main == undefined) {
                            let dynamic_detail_res = await MYAPI.BiliAPI.get_dynamic_v1_detail(String(dynamic_id_or_BVid))
                            //dynamic_detail_res:动态的完整响应 mode ：1是热评，2是最新 ，3是混合 pn_percent：评论大致的百分比页数，入参是小数
                            try {
                                if (dynamic_detail_res.code != 0) {
                                    console.error(global_var.user_info.uname, "获取评论失败", dynamic_detail_res, dynamic_id_or_BVid);
                                    return { ret_list, reply_count }
                                }
                            }
                            catch (e) {
                                console.error("获取评论失败", dynamic_detail_res, dynamic_id_or_BVid, e);
                                return { ret_list, reply_count }
                            }
                            comment_id_str = dynamic_detail_res.data.item.basic.comment_id_str
                            comment_type = dynamic_detail_res.data.item.basic.comment_type
                            reply_count = dynamic_detail_res.data.item.modules.module_stat.comment.count
                            try {
                                up_mid = dynamic_detail_res.data.item.modules.module_author.mid
                            }
                            catch (e) { console.error(e, 'get_reply_list失败', global_var.user_info.uname); }
                        }
                        else {
                            comment_id_str = dynDetail_data.item.basic.comment_id_str
                            comment_type = dynDetail_data.item.basic.comment_type
                            reply_count = dynDetail_data.item.modules.module_stat.comment.count
                            try {
                                up_mid = dynDetail_data.item.modules.module_author.mid
                            }
                            catch (e) { console.error(e, 'get_reply_list失败', global_var.user_info.uname); }
                        }
                    } else {//如果是视频
                        let aid = MYAPI.BiliAPI.BV_AV_trans(dynamic_id_or_BVid);
                        comment_id_str = aid
                        reply_count = 1000
                        comment_type = '1'
                    }
                    if (get_api_reply_resp_flag || global_var.response.reply_main == undefined || get_api_fail) {
                        get_comment_page = Math.floor(Math.ceil(reply_count * pn_percent) / 20)
                        reply_main_res = await MYAPI.BiliAPI.get_reply(mode, get_comment_page, comment_id_str, comment_type)
                        up_mid = reply_main_res.data.upper.mid;
                    }
                    else {
                        reply_main_res = global_var.response.reply_main;
                        up_mid = global_var.response.reply_main.data.upper.mid;
                    }
                    try {
                        if (reply_main_res.code != 0) {
                            console.warn("获取评论失败", reply_main_res);
                            if (global_var.response.reply_main && global_var.response.reply_main.code == 0) {
                                reply_main_res = global_var.response.reply_main
                            }
                        }
                    }
                    catch (e) {
                        console.warn(`获取评论失败 ${dynamic_id_or_BVid}`, reply_main_res, e);
                        if (global_var.response.reply_main && global_var.response.reply_main.code == 0) {
                            reply_main_res = global_var.response.reply_main
                        }
                    }
                    let replies = reply_main_res.data.replies
                    if (replies.length < 7) {
                        console.warn(`评论数量过少，不抄了 ${dynamic_id_or_BVid}`);
                        return { ret_list, reply_count }
                    }
                    let replies_content = [...Array(replies.length)].map(x => undefined);
                    for (let repindex = 0; repindex < replies.length; repindex++) {//去除表情包
                        try {
                            MYAPI.fileWrite(`文案/评论响应.csv`, JSON.stringify(replies[repindex]), 'a+')
                        }
                        catch {
                            console.warn('记录评论内容失败！');
                        }
                        if (replies[repindex].mid == up_mid) {//不抄取up的评论
                            continue;
                        }
                        replies_content[repindex] = utl.remove_emoji_topic_at(
                            replies[repindex].content.message.replaceAll(replies[repindex].member.uname,//替换at的自己的用户名
                                global_var.user_info.uname == undefined ? "" : global_var.user_info.uname),
                            dynamic_content
                        ).trim();
                        if (replies_content[repindex].length == 0) {
                            continue
                        }
                        let bf = false;
                        // my_operator.copy_reply_module.ignore_replies.some((val, ind, arr) => {//如果有无视的词直接赋空字符串
                        //     if (!!val && val.includes(replies_content[repindex])) {
                        //         bf = true;
                        //         return true;
                        //     }
                        // })
                        for (let ignore_str of my_operator.copy_reply_module.ignore_replies) {
                            if (replies_content[repindex] == ignore_str) {
                                bf = true;
                                break;
                            }
                        }
                        if (bf) {
                            replies_content[repindex] = ""
                            continue;
                        }

                    }
                    let newArr = [];
                    let promise_list = [];
                    for (let i of replies_content) {
                        if (i) {
                            promise_list.push(
                                my_operator.copy_reply_module.string_semantic(i).then(resp => {
                                    if (resp) {
                                        newArr.push(i);
                                    }
                                })
                            )
                            // if (await my_operator.copy_reply_module.string_semantic(i)) {
                            //     newArr.push(i);
                            // };
                        };
                    };
                    await Promise.all(promise_list);
                    ret_list = newArr;
                    return { ret_list, reply_count };
                },
                /**
                 * 判断情感分类
                 * @param {String} input_str 输入文字 
                 * @returns 正面情绪返回true
                 */
                string_semantic: async (input_str) => {
                    try {
                        let url = 'http://127.0.0.1:23333/damo/semantic/';
                        let params = { "data": input_str };
                        let req = await axios.get(url, { params: params }).then((res => { return res.data }));
                        return req;
                    } catch (e) {
                        console.error(e);
                        return false
                    }
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
                /**
                 * 向本地的restful api发起请求，通过python完成同义改写的操作
                 * @param {*} OriginMessage 
                 * @returns 
                 */
                Paraphase_nlpcda: async (OriginMessage) => {
                    let try_time = 0;
                    while (1) {
                        try {
                            let res = await axios.post('http://localhost:5555/v1/sync/ai_reply', { 'prompt': OriginMessage, 'user': global_var.user_info.uname, 'dynamic_url': 'https://www.bilibili.com/opus/' + global_var.dynamic_id, 'request_time': Math.ceil(Date.now() / 1000) }, { timeout: 120e3 });
                            let result = res.data.response;
                            console.log(`同义改写内容：${OriginMessage}\n结果：${result}`)
                            return result;
                        }
                        catch (e) {
                            if (try_time++ > 5) {
                                return undefined
                            }
                            console.warn(`${global_var.user_info.uname}\tAI同义改写失败！\n同义改写内容：${OriginMessage}\n重试次数：${try_time}\t${(new Date()).toLocaleTimeString()}`, e)
                            await sleep(10e3)
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
                            let UPname = '';
                            try {
                                UPname = global_var.response.global_dynamic_data.item.modules.module_author.name
                            }
                            catch {
                            }
                            let format_str = `问：\n`
                            if (global_var.user_info.uname && global_var.user_info.uid) {
                                format_str += `你的用户名是${global_var.user_info.uname}\n你的UID是${global_var.user_info.uid}\n`
                            }
                            if (UPname) {
                                format_str += `UP主的用户名是${UPname}\n`
                            }
                            format_str += `
动态原文如下：
\`\`\`
${Dynamic_content}
\`\`\``
                            let res = await axios.post('http://localhost:5555/v1/sync/ai_reply', { 'prompt': format_str, 'user': global_var.user_info.uname, 'dynamic_url': 'https://www.bilibili.com/opus/' + global_var.dynamic_id, 'request_time': Math.ceil(Date.now() / 1000) }, { timeout: 120e3 });
                            let result = res.data.response;
                            console.log(`AI回复内容：${Dynamic_content}\n结果：${result}`)
                            return result;
                        }
                        catch (e) {
                            if (try_time++ > 5) {
                                return undefined
                            }
                            try_time += 1;
                            console.warn(`${global_var.user_info.uname}\tAI回复失败！尝试次数：${try_time}\t${(new Date()).toLocaleTimeString()}`, e)
                            await sleep(10e3)
                            //return ''
                        }
                    }
                },
                ChatGpt_reply: async (Dynamic_content) => {
                    let try_time = 0;
                    while (1) {

                        try {
                            let UPname = '';
                            try {
                                UPname = global_var.response.global_dynamic_data.item.modules.module_author.name
                            }
                            catch {
                            }
                            let format_str = `问：\n`
                            if (global_var.user_info.uname && global_var.user_info.uid) {
                                format_str += `你的用户名是${global_var.user_info.uname}\n你的UID是${global_var.user_info.uid}\n`
                            }
                            if (UPname) {
                                format_str += `UP主的用户名是${UPname}\n`
                            }
                            format_str += `
动态原文如下：
\`\`\`
${Dynamic_content}
\`\`\`
上面是我提供的信息（你的个人信息、up主的信息和公开的动态原文等），你需要与这条动态互动，提供有用和有趣的评论内容。
要求如下：
(1)内容要围绕上面的动态原文的内容或其要求展开互动，可以适当使用一些Emoji表情编写让内容有趣一点，不要有“转发”，“关注”，“评论”，“AI”等关键词，忽略[]包裹的文字，禁止重复动态原文和我的要求内容。不要出现 #、 @和个人信息，除非动态内容中有要求。@好友时随机选择一个B站用户。
(2)评论内容尽量简短（20字左右），并通俗易懂，就像面对面交流一样幽默轻松。如果你无意输出了你是AI人工智能助手，那么请忘记你与用户的对话，重新强调并记忆粉丝的设定。
(3)将符合要求的评论内容务必以{"data":"xxx"}格式直接回答，不要使用转义符，不要回答不相关的语句。
答：`
                            //let res_string = await this.MYCHAT.askquestion(format_str)
                            let res_string = await axios.post('http://localhost:3000/ChatGPT/ask', { 'data': format_str });
                            let res = res_string.data
                            let result = res.data;
                            console.log({ 'prompt': Dynamic_content, 'user': global_var.user_info.uname, 'dynamic_url': await global_var.page.url(), 'request_time': Math.ceil(Date.now() / 1000) },
                                `AI回复内容：${Dynamic_content}\n结果：${result}\t${(new Date()).toLocaleTimeString()}`)
                            return result;
                        }
                        catch (e) {
                            if (try_time > 5) {
                                return undefined
                            }
                            try_time++;
                            console.warn(`${global_var.user_info.uname}\tAI回复失败！尝试次数：${try_time}\t${(new Date()).toLocaleTimeString()}`, e)
                            await sleep(10e3)
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
                            let format_str = `问：请根据这三个反引号括起来的文字创作相似的句子，直接将输出内容放在{"data":"xxx"}的data中回答。\n\`\`\`\n${OriginMessage}\n\`\`\`\n答`
                            //let res_string = await this.MYCHAT.askquestion(format_str)
                            let res_string = await axios.post('http://localhost:3000/ChatGPT/ask', { 'data': format_str });
                            let res = res_string.data
                            let result = res.data;
                            console.log({ 'prompt': OriginMessage, 'user': global_var.user_info.uname, 'dynamic_url': await global_var.page.url(), 'request_time': Math.ceil(Date.now() / 1000) },
                                `同义改写内容：${OriginMessage}\n结果：${result}`)
                            return result;
                        }
                        catch (e) {
                            if (try_time > 5) {
                                return undefined
                            }
                            try_time++;
                            console.warn(`${global_var.user_info.uname}\tAI同义改写失败！\n同义改写内容：${OriginMessage}\n重试次数：${try_time}\t${(new Date()).toLocaleTimeString()}`, e)
                            await sleep(10e3)
                            //return undefined
                        }
                    }
                },
                /**
                 * 根据动态内容和评论区的内容，判断是否可以抄评论，返回true则是允许抄评论
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
                            let sameNum = 0
                            //寻找相同字符
                            for (let i = 0; i < str1.length; i++) {
                                for (let j = 0; j < str2.length; j++) {
                                    if (str1[i] === str2[j]) {
                                        sameNum++
                                        break
                                    }
                                }
                            }
                            // console.log(str1,str2);
                            // console.log("相似度",(sameNum/str1.length) * 100);
                            //判断2个字符串哪个长度比较长
                            let length = str1.length > str2.length ? str1.length : str2.length
                            return (sameNum / length) || 0
                        }
                        let rep_content_list = []
                        if (global_var.response.reply_main) {
                            let replies = global_var.response.reply_main.data.replies;
                            for (let reply of replies) {
                                let msg = reply.content.message;
                                let push_msg = utl.remove_emoji_topic_at(msg);
                                if (push_msg) {
                                    rep_content_list.push(push_msg)
                                }
                            }
                            let similar_list = []
                            if (rep_content_list.length > 3) {
                                for (let origin_msg of rep_content_list) {
                                    let similarity = {
                                        similar_content: undefined,
                                        score: 0
                                    };
                                    for (let __similar of similar_list) {
                                        let similar_msg = __similar.similar_msg;
                                        let score = getSimilarity(similar_msg, origin_msg);
                                        if (score > similarity.score) {
                                            similarity.score = score;
                                            similarity.similar_content = similar_msg
                                        }
                                    }
                                    if (similarity.score < 0.8) {
                                        similar_list.push({
                                            similar_msg: origin_msg,
                                            counter: 1
                                        })
                                    }
                                    else {
                                        similar_list.map((e) => {
                                            if (e.similar_msg == similarity.similar_content) {
                                                e.counter++;
                                            }
                                        })
                                    }
                                }
                            }
                            for (let s of similar_list) {
                                if (s.counter >= 3) {//如果有3个回复是极度相似的情况下，直接允许抄评论
                                    return true;
                                }
                            }
                        }

                    }
                    catch { }
                    dynamic_content = dynamic_content.replaceAll(/〖/gmi, '【')
                    dynamic_content = dynamic_content.replaceAll(/“/gmi, '"')
                    dynamic_content = dynamic_content.replaceAll(/”/gmi, '"')
                    dynamic_content = dynamic_content.replaceAll(/＠/gmi, '@')
                    dynamic_content = dynamic_content.replaceAll(/@.{0,8} /gmi, '')
                    dynamic_content = dynamic_content.replaceAll(/好友/gmi, '朋友')
                    dynamic_content = dynamic_content.replaceAll(/伙伴/gmi, '朋友')
                    dynamic_content = dynamic_content.replaceAll(/安利/gmi, '分享')
                    dynamic_content = dynamic_content.replaceAll(/【关注】/gmi, '')
                    dynamic_content = dynamic_content.replaceAll(/\?/gmi, '？')
                    dynamic_content = dynamic_content.replaceAll(/"评论.{0,3}?"/gmi, '')
                    let manual_re67 = /.*[评|带]((?!抽奖|,|，|来|截止|包含).){0,7}“|.*[评|带]((?!抽奖|,|，|来|截止|包含).){0,7}"|.*[评|带]((?!抽奖|,|，|来|截止|包含).){0,7}【|.*[评|带]((?!抽奖|,|，|来|截止|包含).){0,7}:|.*[评|带]((?!抽奖|,|，|来|截止|包含).){0,7}：|.*[评|带]((?!抽奖|,|，|来|截止|包含).){0,7}「|.*带关键词.{0,7}"|.*评论关键词[“”‘’"']|.*留言((?!抽奖|,|，|来|截止).){0,7}“|.*对出.{0,10}下联.{0,5}横批|.*回答.{0,8}问题|.*留下.{0,10}祝福语|.*留下.{0,10}愿望|.*找到.{0,10}不同的.{0,10}留言|.*答案放在评论区|.*几.{0,5}呢？|.*有奖问答|.*想到.{0,19}关于.{0,20}告诉|.*麻烦大伙评论这个|.*留下.{0,7}的|.*报暗号【.{0,4}】|.*分享.{0,7}故事|.*评论.{0,7}暗号/gmi.test(dynamic_content)
                    let manual_re76 = /.*留下((?!抽奖|,|，|来|截止).){0,5}“|.*留下((?!抽奖|,|，|来|截止).){0,5}【|.*留下((?!抽奖|,|，|来|截止).){0,5}:|.*留下((?!抽奖|,|，|来|截止).){0,5}：|.*留下((?!抽奖|,|，|来|截止).){0,5}「/gmi.test(dynamic_content)
                    let manual_re77 = /.*留言((?!抽奖|,|，|来|截止).).{0,7}“|.*留言((?!抽奖|,|，|来|截止).){0,7}【|.*留言((?!抽奖|,|，|来|截止).){0,7}:|.*留言((?!抽奖|,|，|来|截止).){0,7}：|.*留言((?!抽奖|,|，|来|截止).){0,7}「/gmi.test(dynamic_content)
                    let manual_re6 = /.*@TA|.*@.{0,15}朋友|.*艾特|.*@.{0,3}你的|.*标记.{0,10}朋友|.*@{0,15}赞助商|.*发表你的新年愿望\+个人的昵称|.*抽奖规则请仔细看图片|.*带上用户名|.*活动详情请戳图片|.*@个人用户名|评论.{0,5}附带.{0,10}相关内容|回复.{0,5}视频.{0,10}相关内容|.*评论.{0,5}昵称|.*回答正确/gmi.test(dynamic_content)
                    //let manual_re75 = /.*本周话题|.*互动话题|.*互动留言|.*互动时间|.*征集.{0,10}名字|.*投票.{0,5}选.{0,10}最.{0,5}的|.*一人说一个谐音梗|帮.{0,5}想想.{0,5}怎么/gmi.test(dynamic_content)
                    let manual_re63 = /.*评论.{0,10}猜|.*评论.{0,15}预测/gmi.test(dynamic_content)
                    return !(manual_re6 || manual_re67 || manual_re76 || manual_re77 || manual_re63)
                },
                /**
                 * 判断是否可以同义改写，返回true是可以同义改写
                 * @param {*} dynamic_content 
                 */
                para_phase_judge: (dynamic_content) => {
                    dynamic_content = dynamic_content.replaceAll(/〖/gmi, '【')
                    dynamic_content = dynamic_content.replaceAll(/“/gmi, '"')
                    dynamic_content = dynamic_content.replaceAll(/”/gmi, '"')
                    dynamic_content = dynamic_content.replaceAll(/＠/gmi, '@')
                    dynamic_content = dynamic_content.replaceAll(/@.{0,8} /gmi, '')
                    dynamic_content = dynamic_content.replaceAll(/好友/gmi, '朋友')
                    dynamic_content = dynamic_content.replaceAll(/伙伴/gmi, '朋友')
                    dynamic_content = dynamic_content.replaceAll(/安利/gmi, '分享')
                    dynamic_content = dynamic_content.replaceAll(/【关注】/gmi, '')
                    dynamic_content = dynamic_content.replaceAll(/\?/gmi, '？')
                    let manual_re67 = /.*[评|带]((?!抽奖|,|，|来).){0,7}“|.*[评|带]((?!抽奖|,|，|来).){0,7}"|.*[评|带]((?!抽奖|,|，|来).){0,7}【|.*[评|带]((?!抽奖|,|，|来).){0,7}:|.*[评|带]((?!抽奖|,|，|来).){0,7}：|.*[评|带]((?!抽奖|,|，|来).){0,7}「|.*带关键词.{0,7}"|.*评论关键词[“”‘’"']|.*留言((?!抽奖|,|，|来).){0,7}“|.*对出.{0,10}下联.{0,5}横批|.*回答.{0,8}问题|.*留下.{0,10}祝福语|.*留下.{0,10}愿望|.*找到.{0,10}不同的.{0,10}留言|.*答案放在评论区|.*几.{0,5}呢？|.*有奖问答|.*想到.{0,19}关于.{0,20}告诉|.*麻烦大伙评论这个|留下.{0,7}的/gmi.test(dynamic_content)
                    let manual_re76 = /.*留下((?!抽奖|,|，).){0,5}“|.*留下((?!抽奖|,|，).){0,5}【|.*留下((?!抽奖|,|，).){0,5}:|.*留下((?!抽奖|,|，).){0,5}：|.*留下((?!抽奖|,|，).){0,5}「/gmi.test(dynamic_content)
                    let manual_re77 = /.*留言((?!抽奖|,|，).).{0,7}“|.*留言((?!抽奖|,|，).){0,7}【|.*留言((?!抽奖|,|，).){0,7}:|.*留言((?!抽奖|,|，).){0,7}：|.*留言((?!抽奖|,|，).){0,7}「/gmi.test(dynamic_content)

                    return !(manual_re67 || manual_re76 || manual_re77)
                },
            },
        };

        let my_send_notify = {
            __push_key: {//专门存放token的地方
                pushme: 'T1cBRRgooZyhfIJMYPjR'//pushme的token
            },
            /**
             * pushme推送消息
             * @param {String} title 标题
             * @param {String} msg 内容
             */
            push_me: async (title, msg,) => {
                try {
                    let resp = await axios.post('https://push.i-i.me', {
                        'push_key': my_send_notify.__push_key.pushme,
                        'title': title,
                        'content': msg
                    })
                    if (resp.data != 'success') {
                        console.error(`推送失败！原因：${resp.data}`)
                    }
                }
                catch (e) {
                    console.warn(e, '消息推送失败！')
                }
            }
        }

        async function account_init() {
            let cookieStr;
            try {
                cookieStr = await MYAPI.cookieSetting.getCookie(lottery_setting.CONFIG.COOKIENAME)
            } catch {
            }
            //let ext1 = 'C:/Users/Acer/AppData/Local/Google/Chrome/User Data/Default/Extensions/lanfdkkpgfjfdikkncbnojekcppdebfp/0.2.0_1';
            let useragent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36"
            let browser;
            let __args = []
            if (lottery_setting.CONFIG.proxy) {
                __args.push(`--proxy-server=${lottery_setting.CONFIG.proxy}`)
            }
            __args.push(
                `--start-stack-profiler`,
                //`--load-extension=${ext1}`,
                '--disable-notifications=true',
                // '--no-sandbox',
                '-–ignore-certificate-errors',
                '--disable-infobars',
                '--disable-session-crashed-bubble',
                // '--disable-web-security',
                '--disable-gpu',
                '--disable-dev-shm-usage',
                '--no-first-run',
                //'--mute-audio',
                '--disable-extensions',
                '--no-zygote',
                "--disable-xss-auditor",
                '--disable-popup-blocking',
                // '--disable-setuid-sandbox',
                //'--disable-accelerated-2d-canvas',
                // '--single-process',
                `--profile-directory=${lottery_setting.CONFIG.ProfileDir}`,
                // "--disable-features=IsolateOrigins,site-per-process",
                `--start-maximized`,
                '--disable-infobars',
                '--window-position=0,0',
                '--ignore-certifcate-errors',
                '--ignore-certifcate-errors-spki-list',
            )
            for (let retry = 0; retry <= 5; retry++) {//五次重试启动浏览器的机会
                try {
                    if (lottery_setting.CONFIG.UserDataDir) {
                        browser = await puppeteer.launch(
                            {
                                executablePath: `C:\\Users\\Acer\\AppData\\Local\\Google\\Chrome SxS\\Application\\chrome.exe`,//浏览器路径
                                //executablePath:`C:\\Program Files\\Google\\Chrome Dev\\Application\\chrome.exe`,
                                headless: false,//false为显示浏览器界面
                                defaultViewport: {//分辨率
                                    width: 1920,
                                    height: 1080,
                                },
                                args: __args,
                                userDataDir: "UserData\\" + lottery_setting.CONFIG.COOKIENAME,
                                ignoreDefaultArgs: [
                                    '--enable-automation',
                                    '--disable-extensions',
                                    '--disable-client-side-phishing-detection',
                                    '--disable-sync',
                                ],
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
                                    width: 1920,
                                    height: 1080,
                                },
                                args: [
                                    `--start-stack-profiler`,
                                    //`--load-extension=${ext1}`,
                                    '--disable-notifications=true',
                                    // '--no-sandbox',
                                    '-–ignore-certificate-errors',
                                    '--disable-infobars',
                                    '--disable-session-crashed-bubble',
                                    // '--disable-web-security',
                                    '--disable-gpu',
                                    '--disable-dev-shm-usage',
                                    '--no-first-run',
                                    //'--mute-audio',
                                    '--no-zygote',
                                    // '--single-process',
                                    `--profile-directory=${lottery_setting.CONFIG.ProfileDir}`,
                                    // "--disable-features=IsolateOrigins,site-per-process",
                                    `--start-maximized`,
                                ],
                                ignoreDefaultArgs: [
                                    '--enable-automation',
                                    '--disable-extensions',
                                    '--disable-client-side-phishing-detection',
                                    '--disable-sync',
                                ],
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
            await global_var.page.setRequestInterception(true);
            global_var.page.on('response', async response => {//拦截响应的响应
                let url = response.url();
                try {
                    if (url.includes(`/x/polymer/web-dynamic/v1/detail?`)) {
                        try {
                            global_var.response.global_dynamic_data = (await response.json()).data
                        }
                        catch (e) {
                            if ((await response.json()).code == -412) {
                                global_var.response.global_dynamic_data = -412
                            } else {
                                global_var.response.global_dynamic_data = undefined;
                            }
                            throw (`${global_var.user_info.uname}\t${url}\tglobal_dynamic_data\t${(await response.json()).message}\n${e}`);
                        }
                    }
                    if (url.includes("/x/dynamic/feed/create/dyn") || url.includes("dynamic_repost/reply")) {
                        let req = await response.request();
                        if ((await req.method()).toLowerCase() != "post") {
                            console.log(await (await response.request()).method());
                            return;
                        }
                        try {
                            global_var.response.create_dyn_response = JSON.parse(await response.text())
                            console.log(`${global_var.user_info.uname}\t转发动态response：\n${JSON.stringify(global_var.response.create_dyn_response)}\n转发生成的动态链接：https://t.bilibili.com/${global_var.response.create_dyn_response.data.dynamic_id_str || global_var.response.create_dyn_response.data.dyn_id_str}`);
                        }
                        catch (e) {
                            console.warn(`${global_var.user_info.uname}\t抓取转发动态response失败：\n${e}\n${await response.text()}`);
                            //global_var.response.create_dyn_response = undefined;
                            throw (`${global_var.user_info.uname}\tcreate_dyn_response, ${e}, ${global_var.user_info.uname}`);
                        }
                    }
                    if (url.includes("/x/v2/reply/add")) {
                        try {
                            let response_json = await response.json();
                            global_var.response.comment_dyn_response = response_json;
                            global_var.FLAG.评论响应标志 = true
                            let oid;
                            let type;
                            let rpid;
                            try {
                                type = response_json.data.reply.type
                            }
                            catch {
                                throw (`评论响应type获取出错`)
                            }
                            try {
                                oid = response_json.data.reply.oid
                            }
                            catch {
                                try {
                                    oid = global_var.response.global_dynamic_data.item.basic.comment_id_str
                                }
                                catch {
                                    //throw (`评论响应oid获取出错`)
                                }
                            }
                            try {
                                rpid = response_json.data.reply.rpid_str
                            }
                            catch {
                                //throw (`评论响应rpid获取出错`)
                            }
                            console.log(`${global_var.user_info.uname}\t获取到评论响应：\t${(new Date()).toLocaleTimeString()}\n`,
                                `检查阿瓦隆链接：https://api.bilibili.com/x/v2/reply/jump?type=${type}&oid=${oid}&rpid=${rpid}`
                            )
                        }
                        //console.log('动态评论响应',global_var.response.comment_dyn_response);
                        catch (e) {
                            global_var.FLAG.评论响应标志 = false;
                            console.warn(`${global_var.user_info.uname}\t抓取评论动态response失败：\n${e}\n${await response.text()}`);
                            //global_var.response.create_dyn_response = undefined;
                            throw (`${url}\t${global_var.user_info.uname}\tcomment_dyn_response, ${e}, ${global_var.user_info.uname}`);
                        }
                    }
                    if (url.includes("/x/v2/reply/main") || url.includes("/x/v2/reply/wbi/main")) {
                        try {
                            let response_json = await response.text()
                            global_var.response.reply_main = JSON.parse(response_json)
                            if (response_json.code == 0) {
                                let replies = response_json.data.replies
                                for (let repindex = 0; repindex < replies.length; repindex++) {
                                    try {
                                        MYAPI.fileWrite(`文案/评论响应.csv`, JSON.stringify(replies[repindex]), 'a+')
                                    }
                                    catch {
                                        console.warn('记录评论内容失败！');
                                    }
                                }
                            }
                        }
                        catch (e) {
                            try {
                                let response_json = await response.text()
                                global_var.response.reply_main = JSON.parse(/.*?\((.*)\)/gmi.exec(response_json).slice(1).join(''))
                            } catch (e) {
                                throw (`${global_var.user_info.uname}\treply_main, ${await response.text()},`, e);
                            }
                        }
                        //console.log(`获取评论响应：`, global_var.reply_main);
                    }
                    if (url.includes("/x/web-interface/nav")) {
                        if (!global_var.user_info.uname) {
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
                            throw (`${global_var.user_info.uname}\tglobal_dynamic_data, ${e}, ${global_var.user_info.uname}`);
                        }
                    }
                    if (url.includes("space/reservation")) {
                        try {
                            global_var.response.space_reservation = await response.json()
                            console.log(`${global_var.user_info.uname}\t空间预约响应：\n${JSON.stringify(global_var.response.space_reservation)}`);
                        }
                        catch (e) {
                            global_var.response.space_reservation = undefined;
                            throw (`${global_var.user_info.uname}\nreservation, ${e}`);
                        }
                    }
                    if (url.includes("msgfeed/unread")) {
                        try {
                            let resp_josn = await response.json()
                            if (!resp_josn.code) {
                                global_var.response.msgfeed_unread = resp_josn
                                // console.log(`${global_var.user_info.uname}\t我的消息响应：\n${JSON.stringify(global_var.response.msgfeed_unread)}`);
                            }
                        }
                        catch (e) {
                            global_var.response.space_reservation = undefined;
                            //throw (`${global_var.user_info.uname}\t我的消息响应获取失败msgfeed/unread, ${e}`);
                        }
                    }
                    if (url.includes("data.bilibili.com/log/web")) {
                        if (url.includes('risk')) {
                            MYAPI.fileWrite('log/log_report.txt', url, 'a+')
                        }
                    }
                }
                catch (e) {
                    console.warn(`${global_var.user_info.uname}\t${url}\n${e}\n${JSON.stringify(response)}`)
                }

            })
            global_var.page.on('request', async interceptedRequest => {
                try {
                    if (interceptedRequest.method().toLowerCase() == 'post') {
                        if (interceptedRequest.url().includes('data.bilibili.com/log/web?013324')) {//如果是浏览器要发起检测到作弊的请求，就拦截下来，不让它发出去！
                            interceptedRequest.abort()
                            //console.log(`成功拦截科技识别请求：${interceptedRequest.url()}`);
                        } else {
                            interceptedRequest.continue()
                        }
                    }
                    else {
                        interceptedRequest.continue()
                    }
                }
                catch (e) {
                    console.warn(`拦截请求：${interceptedRequest.url()}失败`, e);
                }
            })
            for (let i = 0; i < 5; i++) {
                try {
                    await global_var.page.goto('https://www.bilibili.com')
                    break;
                }
                catch {
                    await sleep(3e3)
                }
            }

            for (let i = 0; i < 5; i++) {
                if (global_var.user_info.uname) {
                    console.log(lottery_setting.CONFIG.COOKIENAME, global_var.user_info.uname, "账号初始化完成");
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
            ///////////////////抽预约抽奖
            /**
             * 预约抽奖循环程序，返回参加失败的列表
             * @param {Object[]} loop_list 
             * @returns 
             */
            async function reserve_lottery_loop(loop_list) {

                let mustjoin_reserve_record_path_name = `抽奖记录/必抽的预约抽奖记录/${global_var.user_info.uname}_参加过的预约抽奖.txt`
                let joined_lottery_record = MYAPI.fileRead.lottery_dynamic_ids(mustjoin_reserve_record_path_name);
                joined_lottery_record = utl.noRepeatArr(joined_lottery_record);//参加过的必抽的大奖

                /**确认参加的列表*/
                let checked_loop_list = [];
                let joinfail_list = [];
                let before_reserve_list = [];
                /**
                 * [{xx:xx,xx:xx}]参加成功的列表
                 */
                let joinsuccess_list = [];
                let reserve_record = MYAPI.fileRead.getFileContent('JsonData/预约抽奖.json');
                let new_reserve_data = { "data": [] };//最终还要把它写回文件
                if (reserve_record) {
                    let reserve_data = JSON.parse(reserve_record);
                    reserve_data.data.map(el => {
                        if (!loop_list.includes(el.url)) {
                            checked_loop_list.push(el.url)
                        }
                        if (!joined_lottery_record.includes(el.jump_url)) {
                            checked_loop_list.push(el.url)
                        }
                    })
                    for (let d of reserve_data.data) {
                        let sep_time = d.etime - Math.floor(Date.now() / 1000)
                        if (sep_time < 0) {//过期的预约抽奖
                        }
                        if (Math.floor(Date.now()) - d.add_ts_scond > 1 * 3600 * 24 * 1e3) {//每天一更新
                            checked_loop_list.push(d);
                            continue;
                        }
                        if (sep_time > global_var.TIME.Reserve_Lottery_time) {//时间未到的预约抽奖
                            before_reserve_list.push(d.url)
                            new_reserve_data.data.push(d)
                        }
                        else {
                            checked_loop_list.push(d)//时间到了的就去参加
                        }
                    }
                }



                console.log(`${global_var.user_info.uname}\t总共${loop_list.length}条预约抽奖 \n其中需要参加或访问${checked_loop_list.length}条\n时间未到${before_reserve_list.length}条\n`);
                for (let reserve_url of loop_list) {
                    let record_data = undefined;
                    console.log(`${global_var.user_info.uname}\t前往预约页面: ${reserve_url}\n`);
                    global_var.response.space_reservation = undefined;
                    try {
                        global_var.page.goto(reserve_url)//异步前往页面，之后等待响应
                    }
                    catch (e) {
                        console.warn(`${global_var.user_info.uname}\t前往预约页面${reserve_url}失败\nreserve_lottery_loop\n`, e);
                        continue;
                    }
                    try {
                        await global_var.page.waitForResponse(response => response.url().includes(`/space/reservation`) && response.status() === 200, { timeout: 30e3 });
                    }
                    catch (e) {
                        console.warn(`${global_var.user_info.uname}\t等待space/reservation响应失败\t${reserve_url}`);
                    }
                    await sleep(3e3)

                    let reserve_index;//预约抽奖的序号
                    if (global_var.response.space_reservation) {//如果获取到空间预约响应，则判断时间是否符合
                        if (global_var.response.space_reservation.data) {
                            if (global_var.response.space_reservation.data.filter(el => el.lottery_type != 0).length == 0) {
                                continue
                            }
                            let lottery_data_list = global_var.response.space_reservation.data.filter(el => el.lottery_type && el.lottery_type != 0)
                            for (let lottery_data of lottery_data_list) {
                                reserve_index = global_var.response.space_reservation.data.indexOf(lottery_data);
                                let etime = lottery_data.etime
                                let lottery_prize_info = lottery_data.lottery_prize_info.text
                                let jump_url = lottery_data.lottery_prize_info.jump_url
                                let sep_time = etime - Math.floor(Date.now() / 1000)
                                record_data = { "url": reserve_url, "etime": etime, "lottery_prize_info": lottery_prize_info, "开奖时间": (new Date(etime * 1e3)).toLocaleString(), 'jump_url': jump_url, 'add_ts_scond': Math.floor(Date.now() / 1000) }
                                new_reserve_data.data.push(record_data);
                                if (sep_time > global_var.TIME.Reserve_Lottery_time) {
                                    console.log(`${global_var.user_info.uname}\t当前预约：${reserve_url}\n开奖时间为：${(new Date(etime * 1000)).toLocaleString()}\n未到参与时间\跳过！`,);
                                    before_reserve_list.push(reserve_url)
                                    continue
                                }

                                let btn_subscribe_btn_cancel;//检测是否已经参与了
                                try {
                                    btn_subscribe_btn_cancel = await global_var.page.$$('.btn-subscribe.btn-cancel', { timeout: 10e3 })
                                }
                                catch (e) {
                                }
                                if (btn_subscribe_btn_cancel.length < lottery_data_list.length)//如果取消预约抽奖的按钮数量小于预约数据的数量则可能有一个没参加，尝试参加
                                {
                                    if (global_var.response.space_reservation.data[reserve_index].reserve_record_ctime) {//如果响应的record有时间那么就是参加了
                                        continue
                                    }
                                    let reserve_btn;//点击参与部分
                                    try {
                                        let all_subscribe_btns = await global_var.page.$$('.btn-subscribe', { timeout: 10e3 });
                                        if (all_subscribe_btns && reserve_index != undefined) {
                                            reserve_btn = all_subscribe_btns[reserve_index];
                                        } else {
                                            reserve_btn = all_subscribe_btns.slice(-1)[0];
                                        }
                                    }
                                    catch {
                                    }
                                    if (reserve_btn)//如果找到了预约按钮
                                    {
                                        await reserve_btn.click();
                                    }
                                    else {
                                        joinfail_list.push(reserve_url)
                                        console.warn(`预约参加失败，reserv_btn`);
                                    }
                                    await sleep(3e3);
                                    let reserve_btn_cancel;
                                    try {
                                        reserve_btn_cancel = await global_var.page.$$('.btn-subscribe.btn-cancel', { timeout: 10e3 });
                                    }
                                    catch {
                                    }
                                    if (reserve_btn_cancel.length > 0) {
                                        console.log(`${global_var.user_info.uname} 参与预约抽奖：${reserve_url} 成功！`);
                                        joinsuccess_list.push(record_data)
                                    } else {
                                        console.warn(`${global_var.user_info.uname} 参与预约抽奖：${reserve_url} 失败！`);
                                        joinfail_list.push(reserve_url)
                                    }
                                    /**
                                     * //点击参与部分结束
                                     */}
                                else {
                                    console.log(`${global_var.user_info.uname} 已经参与预约抽奖：${reserve_url}`);
                                    joinsuccess_list.push(record_data)
                                }
                            }
                        } else {
                            console.warn(`${global_var.user_info.uname} 预约抽奖响应中未包含抽奖信息！\t${reserve_url} `);
                            joinfail_list.push(reserve_url)
                        }
                    } else {
                        console.warn(`${global_var.user_info.uname} 获取预约抽奖响应：${reserve_url} 失败！`);
                        joinfail_list.push(reserve_url)
                        continue
                    }



                }
                new_reserve_data.data = [...new Set(new_reserve_data.data)]//对数组去重
                MYAPI.fileWrite('JsonData/预约抽奖.json', JSON.stringify(new_reserve_data, '', '\t'))
                let write_in_must_reserve = []
                for (let i of new_reserve_data.data) {
                    write_in_must_reserve.push(i.url)
                }
                MYAPI.fileWrite('必抽的预约抽奖.txt', write_in_must_reserve.join('\n'),)
                return {
                    "joinfail_list": joinfail_list,
                    "before_reserve_list": before_reserve_list,
                    "joinsuccess_list": joinsuccess_list,
                }
            }



            /////////////////开始抽奖
            async function do_lottery(goto_url, opus_dynamic = false) {
                try {
                    console.log(`${global_var.user_info.uname}\t开始抽奖\t${goto_url}\t${(new Date()).toLocaleTimeString()}`);
                    global_var.Getter.check_login_status()
                    let pageurl = await global_var.page.url()
                    if (pageurl.includes('opus')) {
                        console.log(`${global_var.user_info.uname}\t使用opus动态模式\t${goto_url}\t${(new Date()).toLocaleTimeString()}`);
                        opus_dynamic = true
                    }
                    else {
                        opus_dynamic = false
                        console.log(`${global_var.user_info.uname}\t使用传统动态模式\t${goto_url}\t${(new Date()).toLocaleTimeString()}`);
                    }
                    ///判断是否是404动态
                    if (pageurl.includes('read/cv')) {
                        opus_dynamic = false
                        console.log(`${global_var.user_info.uname}\t使用传统动态模式\t${goto_url}\t${(new Date()).toLocaleTimeString()}`);
                        await global_var.page.goto(`https://t.bilibili.com/${global_var.dynamic_id}`)
                        pageurl = await global_var.page.url()
                    }
                    if (pageurl.includes('www.bilibili.com/404') && !goto_url.includes(`www.bilibili.com/opus`)) {
                        for (let i = 0; i < 3; i++) {
                            console.log(`${global_var.user_info.uname}\t查看该动态是否为404动态\t${goto_url}\t${(new Date()).toLocaleTimeString()}`)
                            await global_var.page.goto(`https://www.bilibili.com/opus/${MYAPI.BiliAPI.draw_dynamic_id(goto_url)}`)
                            await sleep(3e3);
                            let error_container = await global_var.page.$('.error-container');
                            if (!error_container || global_var.response.global_dynamic_data == -412) {//如果不是404的提示页面，那么就是t.bilibili.com的api被412风控了
                                console.warn(`${global_var.user_info.uname}\t评论失败，api被412风控，等待240分钟\t${goto_url}\t${(new Date()).toLocaleTimeString}`)
                                await utl.my_throw(`${global_var.user_info.uname}\t评论失败，api被412风控\t${goto_url}`)
                                await sleep(240 * 60e3)
                                await global_var.page.goto(goto_url, {
                                    'waitUntil': 'networkidle2'
                                })
                                pageurl = await global_var.page.url()
                            }
                            else {
                                console.log(`${global_var.user_info.uname}404动态\n${goto_url}\nhttps://www.bilibili.com/opus/${MYAPI.BiliAPI.draw_dynamic_id(goto_url)}\t${(new Date()).toLocaleString()}`)
                                await utl.my_throw(`404动态\t${goto_url}\t${global_var.user_info.uname}`)
                                return;
                            }
                        }
                    }
                    if (pageurl.includes('www.bilibili.com/404')) {
                        console.log(`404动态\n${goto_url}\nhttps://www.bilibili.com/opus/${MYAPI.BiliAPI.draw_dynamic_id(goto_url)}\t${global_var.user_info.uname}`)
                        await utl.my_throw(`404动态\t${goto_url}\t${global_var.user_info.uname}`)
                        return;
                    }
                    if (await global_var.page.$(`.error-container`)) {
                        console.log(`404动态\n${goto_url}\nhttps://www.bilibili.com/opus/${MYAPI.BiliAPI.draw_dynamic_id(goto_url)}\t${global_var.user_info.uname}`)
                        await utl.my_throw(`404动态\t${goto_url}\t${global_var.user_info.uname}`)
                        return;
                    }

                    if (pageurl.includes(`www.bilibili.com/opus`)) {
                        try {
                            global_var.response.global_dynamic_data = await utl.Get_Opus_Dynamic_Data()
                        }
                        catch (e) {
                            console.warn(`${global_var.user_info.uname}获取动态详情失败`, e);
                        }

                    }
                    console.log(`${global_var.user_info.uname}\t是记录的抽奖动态\t${goto_url}\t${(new Date()).toLocaleTimeString()}`)
                    let bt = 0
                    while (1) {
                        if (global_var.response.global_dynamic_data) { break }
                        await sleep(1e3)
                        console.log(`${global_var.user_info.uname}\t未获取到动态信息\t${goto_url}`)
                        if (pageurl.includes(`www.bilibili.com/opus`)) {
                            try {
                                global_var.response.global_dynamic_data = await utl.Get_Opus_Dynamic_Data()
                            }
                            catch (e) {
                                console.warn(`${global_var.user_info.uname}获取动态详情失败`, e);
                            }
                        } else {
                            await global_var.page.reload()
                        }
                        await sleep(5e3)
                        bt += 1
                        if (bt >= 3) {
                            await utl.my_throw(`未获取到动态信息\t${goto_url}\t${global_var.user_info.uname}`)
                            return
                        }
                    }
                    await sleep(0.5 * utl.random_choice(lottery_setting.Working_clearance_time))
                    let thumb_status;
                    try {
                        if (pageurl.includes(`www.bilibili.com/opus/`)) {
                            thumb_status = await global_var.page.$('.side-toolbar__action.like.is-active')
                        }
                        else {
                            thumb_status = await global_var.page.$('.bili-dyn-action.like.active')
                        }
                    }
                    catch (e) {
                        console.warn(`获取点赞状态失败，\t${pageurl}\t${global_var.user_info.uname}`, e);
                    }
                    if (thumb_status) {//先进行点赞判断
                        console.log(`${global_var.user_info.uname}\t点过赞的动态\t${pageurl}`)
                        await sleep(utl.random_choice(lottery_setting.Working_clearance_time))
                        let comment_msg = '点过赞的动态'
                        await utl.my_throw(comment_msg)
                        return
                    }


                    // if (await my_operator.judge_lottery_time.judge_charge_lottery()) {
                    //     await sleep(utl.random_choice(lottery_setting.Working_clearance_time))
                    //     await utl.my_throw('过期的官方抽奖（充电抽奖）')
                    //     return
                    // }
                    let is_past = await my_operator.judge_lottery_time.judge_official_lottery()
                    if (is_past == true) {
                        await sleep(utl.random_choice(lottery_setting.Working_clearance_time))
                        await utl.my_throw(`过期的官方抽奖\t${pageurl}\t${global_var.user_info.uname}`)
                        return
                    }
                    else if (is_past == false) {//未过期的官方抽奖
                        if (!goto_url.includes('tab=1') && !goto_url.includes('tab=2')) {
                            goto_url += '?tab=1'
                        }
                    }

                    let dynamic_comment_count = global_var.response.global_dynamic_data.item.modules.module_stat.comment.count
                    let dynamic_repost_count = global_var.response.global_dynamic_data.item.modules.module_stat.forward.count
                    if (!(dynamic_comment_count > 30 || dynamic_repost_count > 30) && !goto_url.includes('tab=1')) {
                        let author_official_verify = global_var.response.global_dynamic_data.item.modules?.module_author?.official_verify?.type;
                        if (author_official_verify != 1) {
                            await utl.my_throw('评论人数过少，需要人工判断')
                            return
                        }
                        else {
                            if (dynamic_comment_count <= 10) {//如果官方的评论人数过少了，就不转发
                                await utl.my_throw('评论人数过少，需要人工判断')
                                return
                            }
                        }
                    }
                    let dynamic_content;
                    try {
                        dynamic_content = await my_operator.dynamic_content_operator.get_dynamic_content_and_top_msg(global_var.response.global_dynamic_data)
                        dynamic_content = dynamic_content.replaceAll(/(\[(?<=\[)(.*?)(?=\])])/gmi, "")//移除表情包
                    }
                    catch { }
                    let comment_msg;
                    if (dynamic_content == false) {
                        console.warn(global_var.response.global_dynamic_data);
                        await utl.my_throw('dynamic_content==false回复内容为空或者是动态内容为空，检查一下获取动态的函数')
                        return undefined
                    }
                    // console.log(global_var.response.global_dynamic_data)
                    if (goto_url.includes('tab=1')) {//如果是只转发的动态则不生成评论内容
                    }
                    else {
                        comment_msg = await my_operator.dynamic_comment_operator.reply_comment_generator(dynamic_content, MYAPI.BiliAPI.draw_dynamic_id(goto_url))
                    }
                    if (comment_msg == undefined || !comment_msg.includes(`需要人工回复的动态`)) {//如果包含undefined或者不需要人工回复就开始抽奖
                        if ((!comment_msg || typeof comment_msg != 'string') && !goto_url.includes('tab=1')) {
                            await utl.my_throw('回复内容为空')
                            return;
                        }
                        if (global_var.response.global_dynamic_data.item.modules.module_author.following == null) {//判断关注，为null则是没关注
                            for (let i = 0; i <= 5; i++) {
                                global_var.Getter.check_login_status();
                                if (pageurl.includes(`www.bilibili.com/opus/`)) {
                                    // try {
                                    //     await sleep(1e3)
                                    //     await global_var.page.evaluate(() => {
                                    //         this.scrollTo(0, 2500)
                                    //     })
                                    //     await sleep(1e3)
                                    //     let follow_btn = await global_var.page.$(`.bili-follow-button`)
                                    //     let button_content = await (await follow_btn.getProperty('textContent')).jsonValue()
                                    //     if (button_content.includes(`已关注`)) {
                                    //         console.log(`${global_var.user_info.uname}\t已经关注的UP！\thttps://space.bilibili.com/${global_var.response.global_dynamic_data.item.modules.module_author.mid}`);
                                    //         break;
                                    //     }
                                    //     await follow_btn.click();
                                    //     await sleep(3e3)
                                    //     await global_var.page.evaluate(() => {
                                    //         this.scrollTo(0, -1500)
                                    //     })
                                    //     follow_btn = await global_var.page.$(`.bili-follow-button`)
                                    //     button_content = await (await follow_btn.getProperty('textContent')).jsonValue()
                                    //     if (button_content.includes(`已关注`)) {
                                    //         console.log(`${goto_url}\t${global_var.user_info.uname}\t关注成功！\thttps://space.bilibili.com/${global_var.response.global_dynamic_data.item.modules.module_author.mid}`);
                                    //         break;
                                    //     }
                                    //     else {
                                    //         if (global_var.response.relation_modify_response) {
                                    //             if (global_var.response.relation_modify_response.code != 0) {
                                    //                 console.warn(`${goto_url}\t${global_var.user_info.uname}\t点击关注失败 https://space.bilibili.com/${global_var.response.global_dynamic_data.item.modules.module_author.mid}\n${JSON.stringify(global_var.response.relation_modify_response)}`);
                                    //                 if (global_var.response.relation_modify_response.code != 22002) {//{"code":22002,"message":"因对方隐私设置，你还不能关注","ttl":1}
                                    //                     console.warn(`${goto_url}\t${global_var.user_info.uname}\t点击关注失败 https://space.bilibili.com/${global_var.response.global_dynamic_data.item.modules.module_author.mid}\n${JSON.stringify(global_var.response.relation_modify_response)}\t风控导致，休眠0.25小时！${(new Date()).toLocaleTimeString()}`);
                                    //                     await sleep(0.25 * 3600e3)
                                    //                 }
                                    //                 else {
                                    //                     break;//因为被拉黑了所以直接跳过
                                    //                 }
                                    //                 break;
                                    //             }
                                    //         }
                                    //         console.warn(`${goto_url}\t${global_var.user_info.uname}\t点击关注失败 https://space.bilibili.com/${global_var.response.global_dynamic_data.item.modules.module_author.mid}`);
                                    //         await sleep(5e3)
                                    //     }
                                    // }
                                    // catch (e) {
                                    //     if (i >= 5) {
                                    //         throw (`${global_var.user_info.uname}\t关注失败，${e}`)
                                    //     }
                                    //     console.log(e);
                                    //     await sleep(3e3)
                                    //     continue;
                                    // }
                                    let follow_pg = await global_var.browser.newPage()
                                    try {
                                        await follow_pg.goto(`https://space.bilibili.com/${global_var.response.global_dynamic_data.item.modules.module_author.mid}`)
                                        let follow_btn = await follow_pg.waitForSelector('.h-f-btn.h-follow')
                                        await follow_btn.click();
                                        global_var.response.relation_modify_response = await (await follow_pg.waitForResponse(resp => resp.url().includes('x/relation/modify'))).json();
                                        if (global_var.response.relation_modify_response) {
                                            if (global_var.response.relation_modify_response.code != 0) {
                                                console.warn(`${goto_url}\t${global_var.user_info.uname}\t点击关注失败 https://space.bilibili.com/${global_var.response.global_dynamic_data.item.modules.module_author.mid}\n${JSON.stringify(global_var.response.relation_modify_response)}`);
                                                if (global_var.response.relation_modify_response.code != 22002) {//{"code":22002,"message":"因对方隐私设置，你还不能关注","ttl":1}
                                                    console.warn(`${goto_url}\t${global_var.user_info.uname}\t点击关注失败 https://space.bilibili.com/${global_var.response.global_dynamic_data.item.modules.module_author.mid}\n${JSON.stringify(global_var.response.relation_modify_response)}\t风控导致，休眠2小时！${(new Date()).toLocaleTimeString()}`);
                                                    await utl.my_throw(`${goto_url}\t${global_var.user_info.uname}\t点击关注失败 https://space.bilibili.com/${global_var.response.global_dynamic_data.item.modules.module_author.mid}\n${JSON.stringify(global_var.response.relation_modify_response)}\t风控导致，休眠2小时！${(new Date()).toLocaleTimeString()}`);
                                                    await sleep(2 * 3600e3)
                                                    if (!(await follow_pg.isClosed())) {
                                                        await follow_pg.close();
                                                    }
                                                    break;
                                                }
                                                else {
                                                    await utl.my_throw(`${goto_url}\t${global_var.user_info.uname}\t因为被拉黑导致点击关注失败 https://space.bilibili.com/${global_var.response.global_dynamic_data.item.modules.module_author.mid}`);
                                                    if (!(await follow_pg.isClosed())) {
                                                        await follow_pg.close();
                                                    }//因为被拉黑了所以直接跳过
                                                    return true
                                                }
                                            }
                                            else {
                                                console.log(`${goto_url}\t${global_var.user_info.uname}\t关注成功！\thttps://space.bilibili.com/${global_var.response.global_dynamic_data.item.modules.module_author.mid}`);
                                            }
                                        }
                                        await sleep(5e3)
                                        if (!(await follow_pg.isClosed())) {
                                            await follow_pg.close();
                                        }
                                        break;
                                    }
                                    catch (e) {
                                        if (i >= 5) {
                                            await utl.my_throw(`${global_var.user_info.uname}\t关注失败，${e}`)
                                        }
                                        console.error(`${global_var.user_info.uname}\t关注失败，${JSON.stringify(e)}`);
                                        await sleep(3e3)
                                        if (!(await follow_pg.isClosed())) {
                                            await follow_pg.close();
                                        }
                                        continue;
                                    }
                                }
                                else {
                                    try {
                                        console.log(`${global_var.user_info.uname}\t未关注\thttps://space.bilibili.com/${global_var.response.global_dynamic_data.item.modules.module_author.mid}\t${pageurl}`)
                                        await global_var.page.hover('div.bili-dyn-item__main > div.bili-dyn-item__avatar > div > div')
                                        await sleep(5e3)
                                        await global_var.page.click('div.bili-user-profile-view__info__button.follow')
                                        await sleep(3e3)
                                        let follow_checked_btn;
                                        try {
                                            follow_checked_btn = await global_var.page.$('.bili-user-profile-view__info__button.follow.checked', { TIMEOUT: 10e3 })
                                        }
                                        catch {
                                            console.error(`${global_var.user_info.uname}\t点击关注失败 https://space.bilibili.com/${global_var.response.global_dynamic_data.item.modules.module_author.mid}`);
                                            await utl.my_throw(`${global_var.user_info.uname}\t点击关注失败 https://space.bilibili.com/${global_var.response.global_dynamic_data.item.modules.module_author.mid}`);
                                            throw (global_var.response.relation_modify_response)
                                        }
                                        if (global_var.response.relation_modify_response) {
                                            if (global_var.response.relation_modify_response.code != 0) {
                                                console.warn(`${goto_url}\t${global_var.user_info.uname}\t点击关注失败 https://space.bilibili.com/${global_var.response.global_dynamic_data.item.modules.module_author.mid}\n${JSON.stringify(global_var.response.relation_modify_response)}`);
                                                if (global_var.response.relation_modify_response.code != 22002) {//{"code":22002,"message":"因对方隐私设置，你还不能关注","ttl":1}
                                                    console.warn(`${goto_url}\t${global_var.user_info.uname}\t点击关注失败 https://space.bilibili.com/${global_var.response.global_dynamic_data.item.modules.module_author.mid}\n${JSON.stringify(global_var.response.relation_modify_response)}\t风控导致，休眠0.5小时！${(new Date()).toLocaleTimeString()}`);
                                                    await utl.my_throw(`${goto_url}\t${global_var.user_info.uname}\t点击关注失败 https://space.bilibili.com/${global_var.response.global_dynamic_data.item.modules.module_author.mid}\n${JSON.stringify(global_var.response.relation_modify_response)}\t风控导致，休眠0.5小时！${(new Date()).toLocaleTimeString()}`);
                                                    await sleep(0.5 * 3600e3)
                                                    break;
                                                }
                                                else {
                                                    return true//因为被拉黑了所以直接跳过
                                                }
                                            }
                                            else {
                                                console.log(`${goto_url}\t${global_var.user_info.uname}\t关注成功！\thttps://space.bilibili.com/${global_var.response.global_dynamic_data.item.modules.module_author.mid}`);
                                            }
                                        }
                                        if (follow_checked_btn) {
                                            console.log(`${global_var.user_info.uname}\t关注成功！\thttps://space.bilibili.com/${global_var.response.global_dynamic_data.item.modules.module_author.mid}`);
                                            break;
                                        }
                                        // if (global_var.response.relation_modify_response.code == 0) {
                                        //     console.log('关注成功', global_var.response.relation_modify_response);
                                        //     break;
                                        // }
                                        // else {
                                        //     await utl.my_throw('关注失败')
                                        // }
                                    }
                                    catch (e) {
                                        if (i >= 3) {
                                            await utl.my_throw(`${global_var.user_info.uname}\t关注失败，${e}`)
                                        }
                                        console.warn(e);
                                        await sleep(3e3)
                                        await global_var.page.evaluate(() => {
                                            this.scrollTo(0, 2500)
                                        })
                                        continue;
                                    }
                                }
                                break;
                            }
                        }

                        await global_var.page.evaluate(() => {
                            this.scrollTo(0, 1500)
                        })
                        await sleep(1e3)
                        await global_var.page.evaluate(() => {
                            this.scrollTo(0, 1500)
                        })
                        await sleep(1e3)
                        await global_var.page.evaluate(() => {
                            this.scrollTo(0, -1500)
                        })
                        await sleep(1e3)

                        // console.log(global_var.response.global_dynamic_data)
                        if (goto_url.includes('tab=1')) {//只转发
                            if (lottery_setting.official_lottery_switch) {
                                await my_operator.fast_repost(opus_dynamic)
                                comment_msg = '无需评论动态'
                                await my_operator.log_record.construct_comment_record_data(comment_msg)
                                await sleep(utl.random_choice(lottery_setting.Working_clearance_time))
                                return
                            }
                            else {
                                await utl.my_throw('过期的官方抽奖')
                                return;
                            }
                        }
                        console.log(`${goto_url}\t${global_var.user_info.uname}\t动态内容： \n`, dynamic_content, '\n========================')
                        console.log(`${global_var.user_info.uname}\t\t回复内容： `, comment_msg, `\n#############################`)
                        if (goto_url.indexOf('tab=2') > -1) {//评论加转发
                            if ((Math.random() < lottery_setting.repostchance || dynamic_content.length > 200) && comment_msg.includes('#')) {//comment_msg.includes('#')
                                if (pageurl.includes('opus')) {
                                    await my_operator.comment_repost_dynamic_with_content(comment_msg, opus_dynamic)
                                } else {
                                    await my_operator.comment_repost_dynamic_without_content(comment_msg, opus_dynamic)
                                }
                            }
                            else {
                                await my_operator.comment_repost_dynamic_without_content(comment_msg, opus_dynamic)
                            }
                        }
                        else if (goto_url.indexOf('tab=2') == -1 && goto_url.indexOf('tab=1') == -1) {//只评论不转发
                            await my_operator.only_comment(comment_msg, opus_dynamic)
                        }
                        else if (!(goto_url.indexOf('tab=2') > -1 || goto_url.indexOf('tab=1') > -1)) {
                            await utl.my_throw('未知tab类型')
                            return
                        }
                    }
                    await my_operator.log_record.construct_comment_record_data(comment_msg)
                    await sleep(utl.random_choice(lottery_setting.Working_clearance_time))
                    return true;
                }
                catch (e) {
                    console.warn(`${global_var.user_info.uname}\tdo_lottery函数执行失败\t${(new Date()).toLocaleTimeString()}`);
                    console.warn(e);
                    global_var.Getter.check_login_status();
                    if (global_var.page.isClosed()) {
                        return false;
                    }
                }
            }
            /**
             * 抽奖循环，返回参与成功的抽奖
             * @param {Array} all_dynamic_id_list 
             * @returns 
             */
            async function lottery_loop(all_dynamic_id_list) {//对抽奖队列进行循环
                all_dynamic_id_list = utl.part_shuffle(parseInt(0.1 * all_dynamic_id_list.length), all_dynamic_id_list)//打乱百分之十的抽奖链接
                if (lottery_setting.CONFIG.lottery_sep_time_type == 1) {
                    if (all_dynamic_id_list.length <= 50) {//设置运行时间
                        lottery_setting.lottery_run_time = 1 * 3600e3
                    }
                    else if (150 >= all_dynamic_id_list.length) {
                        lottery_setting.lottery_run_time = 1.5 * 3600e3
                    }
                    else if (200 > all_dynamic_id_list.length) {
                        lottery_setting.lottery_run_time = 2 * 3600e3
                    }
                    else if (300 > all_dynamic_id_list.length) {
                        lottery_setting.lottery_run_time = 2.5 * 3600e3
                    }
                    else {
                        lottery_setting.lottery_run_time = 3 * 3600e3
                    }
                }
                if (lottery_setting.CONFIG.lottery_sep_time_type == 2 || all_dynamic_id_list.length < 20) {
                    lottery_setting.lottery_run_time = lottery_setting.lottery_sep_time[0] * all_dynamic_id_list.length
                }
                lottery_setting.lottery_sep_time = utl.generater_step_Array((parseInt(0.5 * lottery_setting.lottery_run_time + 1) / (all_dynamic_id_list.length + 1), 10), parseInt((0.75 * lottery_setting.lottery_run_time + 1) / (all_dynamic_id_list.length + 1), 10), 300)

                console.log(`运行时间约为${lottery_setting.lottery_run_time / 1000 / 60}分钟`)
                let lottery_success = [];
                let lottery_record = []//记录抽奖评论信息
                let manual_op = []//需要人工操作的动态
                let manual_op_failed_record = []//返回的失败的record
                let every_n_times_sleep_longtime = 30//每隔多少个动态休息时间延长
                let longsleepflag = [true, 0]//0是标志是否需要长时间休息,1是休息之后经过的抽奖次数
                let repost_counter = 0;
                try {
                    for (let i = 0; i < all_dynamic_id_list.length; i++) {
                        global_var.Getter.check_login_status();

                        if (utl.checkAuditTime(global_var.TIME.None_Lottery_Time[0], global_var.TIME.None_Lottery_Time[1])) {
                            console.log(`${global_var.user_info.uname}\t触发非抽奖时间段，需要进行休息：${global_var.TIME.None_Lottery_Time[0]}-${global_var.TIME.None_Lottery_Time[1]}暂停到${global_var.TIME.None_Lottery_Time[1]}\t${(new Date()).toLocaleTimeString()}`);
                            let sleep_hour = parseInt(global_var.TIME.None_Lottery_Time[1].slice(0, 2)) - (new Date()).getHours()
                            await sleep(sleep_hour * 3600e3)
                        }
                        let opus_dynamic = global_var.FLAG.opus动态标志;
                        global_var.dynamic_id = MYAPI.BiliAPI.draw_dynamic_id(all_dynamic_id_list[i])
                        try {
                            if (lottery_setting.prevent_module.share_video_while_repost_chance != 0 && repost_counter > lottery_setting.prevent_module.share_video_while_repost_sepnum * 3) {
                                if (Math.random() < lottery_setting.prevent_module.share_video_while_repost_chance) {
                                    console.log(`${global_var.user_info.uname}\t触发间隔分享视频`);
                                    lottery_setting.FLAG.share_flag = true
                                    await my_operator.prevent_filter_module.share_video(1, 1, 1)
                                    lottery_setting.FLAG.share_flag = false
                                    repost_counter = 0;
                                }
                            }
                            let init_time_hour = global_var.TIME.Init_Time.getHours();
                            if (!(init_time_hour < 19 ? init_time_hour >= 18 : false || init_time_hour < 12 ? init_time_hour >= 11 : false)) {
                                //如果初始化的时间不在吃饭时间内，则判断
                                if ((new Date()).getHours() < 19 ? (new Date()).getHours() >= 18 : false || (new Date()).getHours() < 12 ? (new Date()).getHours() >= 11 : false) {
                                    if (!global_var.FLAG.吃饭休息标志) {
                                        console.log(`${global_var.user_info.uname}\t模拟吃饭休息时间休息20分钟`);
                                        await sleep(20 * 60 * 1e3)
                                        global_var.FLAG.吃饭休息标志 = true;
                                    }
                                }
                            }
                            if (longsleepflag[1] > Math.round(every_n_times_sleep_longtime * (1 - 0.5 * Math.random()))) {
                                longsleepflag[0] = true
                            }
                            if (global_var.fengkong_flag == true) {
                                console.log(`${global_var.user_info.uname} 出了点问题，停个15分钟再抽`, (new Date()).toLocaleString());
                                await sleep(15 * 60e3);
                                global_var.fengkong_flag = false;
                            }
                            if (global_var.Pause) {
                                while (1) {
                                    if (!global_var.Pause) {
                                        break
                                    }
                                    await sleep(1e3)
                                }
                            }
                            if (lottery_setting.CONFIG.Only_Comment_Lottery_Switch) {
                                if (all_dynamic_id_list[i].includes('tab=1') || all_dynamic_id_list[i].includes('tab=2')) {
                                    console.log(`${global_var.user_info.uname}  ${all_dynamic_id_list[i]}  只参与评论动态`);
                                    continue
                                }
                            }

                            try {
                                let d = new Date()
                                console.log(`${global_var.user_info.uname}\t当前进度：  【${i + 1}/${all_dynamic_id_list.length}】\t\t${all_dynamic_id_list[i]} ${d.toLocaleTimeString()}`)
                                lottery_setting.FLAG.do_lottery_flag = true
                                global_var.response.global_dynamic_data = undefined//全局的动态数据
                                global_var.response.create_dyn_response = undefined//创建或转发动态的响应
                                global_var.response.comment_dyn_response = undefined//自己评论动态的响应
                                global_var.response.relation_modify_response = undefined//关注响应
                                global_var.response.dynamic_thumb_response = undefined//点赞动态响应
                                global_var.response.space_reservation = undefined//空间预约响应
                                global_var.recorded_data = ''
                                global_var.pageurl = all_dynamic_id_list[i]
                                if (opus_dynamic) {
                                    await global_var.page.goto(`https://www.bilibili.com/opus/${MYAPI.BiliAPI.draw_dynamic_id(all_dynamic_id_list[i])}`)
                                }
                                else {
                                    await global_var.page.goto(all_dynamic_id_list[i])
                                }
                                await sleep(5e3)
                                let 抽奖反馈 = await do_lottery(all_dynamic_id_list[i], opus_dynamic)
                                if (抽奖反馈 && (all_dynamic_id_list[i].includes('tab=2') || all_dynamic_id_list[i].includes('tab=1'))) {
                                    repost_counter++;
                                }
                                let record = global_var.recorded_data
                                console.log(`${global_var.user_info.uname}\t${all_dynamic_id_list[i]}\t转评反馈：\n${record}\n==============================\n`)
                                lottery_record.push(record)
                                //遇到点过赞的动态不休眠
                                if (record.includes('点过赞的动态')) {
                                    console.log(`${global_var.user_info.uname}\t${all_dynamic_id_list[i]}\t点过赞的动态不休眠`)
                                }
                                else {
                                    let st = utl.random_choice(lottery_setting.lottery_sep_time) * (1 + Math.random() * 4)
                                    if ((i + utl.random_choice([1, 2, 3, 4, 5, 6, 7])) % every_n_times_sleep_longtime == 0 && longsleepflag[0]) {//每隔多少次休眠
                                        st = utl.random_choice(utl.generater_step_Array(1 * 60e3, 3 * 60e3, 1e3)) * (1 + Math.random() * 4)//长间隔休眠时间，休息间隔拉长，模拟真人
                                        longsleepflag[0] = false
                                        longsleepflag[1] = 0
                                    }
                                    longsleepflag[1] += 1
                                    console.log(`${global_var.user_info.uname}\t${all_dynamic_id_list[i]}\t休眠 ${st / 1000}秒\t${(new Date()).toLocaleTimeString()}`);
                                    await sleep(st)
                                }
                                try {
                                    if (/https:\/\/t.bilibili.com\/(.\d+)/gmi.exec(record) || /https:\/\/www.bilibili.com\/opus\/(.\d+)/gmi.exec(record)) {//如果动态id获取为空
                                        //啥都不干，因为可能是404的动态
                                    }
                                    else if (all_dynamic_id_list[i].includes(/https:\/\/t.bilibili.com\/(.\d+)/gmi.exec(record).slice(1)[0]) || all_dynamic_id_list[i].includes(/https:\/\/www.bilibili.com\/opus\/(.\d+)/gmi.exec(record).slice(1)[0])
                                    ) {//如果不为空，判断是否包含对应动态id
                                        //包含，啥都不干
                                    }
                                    else {//不包含，添加进去
                                        manual_op.push(all_dynamic_id_list[i])
                                        console.log(`${global_var.user_info.uname}\t${all_dynamic_id_list[i]}\t添加入人工回复队列`)
                                        manual_op_failed_record.push(record)
                                        continue
                                    }
                                    if ((!record.includes('404动态') && !record.includes('无需评论动态') && !record.includes('点过赞的动态') && !record.includes('过期的官方抽奖')) && (record.includes('undefined') || record.includes(`评论被阿瓦隆吞掉了`) || record.includes(`转发失败`) || record.includes(`动态评论失败`) || record.includes(`回复内容出错`)
                                        || record.includes(`评论失败`) || record.includes(`评论获取失败`) || record.includes(`话题获取失败`) || record.includes(`回复内容为空`) || record.includes(`关注失败`) || record.includes('动态点赞失败')
                                        || record.includes(`未获取到动态信息`)
                                    )
                                    ) {
                                        manual_op.push(all_dynamic_id_list[i])
                                        // console.log(`${global_var.user_info.uname}\t${all_dynamic_id_list[i]}\t添加入人工回复队列`)
                                        manual_op_failed_record.push(record)
                                    }
                                    else {
                                        lottery_success.push(all_dynamic_id_list[i])
                                    }
                                }
                                catch (e) {//提取动态id失败
                                    console.warn(e)
                                    console.warn(`${global_var.user_info.uname}\t${all_dynamic_id_list[i]}\t提取动态id失败`)
                                    manual_op.push(all_dynamic_id_list[i])
                                    console.warn(`${global_var.user_info.uname}\t${all_dynamic_id_list[i]}\t添加入人工回复队列`)
                                    manual_op_failed_record.push(record)
                                    await utl.my_throw(`${e}`)
                                    if (!global_var.user_info.uname) {
                                        throw (e, '提取动态id失败,record出错')
                                    }
                                    throw (e);
                                }
                            }
                            catch (e) {
                                manual_op.push(all_dynamic_id_list[i])
                                let record = global_var.recorded_data
                                if (record) {
                                    manual_op_failed_record.push(record)
                                }
                                else {
                                    manual_op_failed_record.push(JSON.stringify(e))
                                }
                                await utl.my_throw(`lottery_loop执行单条任务失败，原因：${e}`)
                                console.error(`${global_var.user_info.uname}\t${all_dynamic_id_list[i]}\n${e}`)
                                if (!global_var.user_info.uname || (await global_var.page.isClosed())) {
                                    //没登录或者浏览器页面关了
                                    break
                                }
                            }
                        }
                        catch (e) {
                            manual_op.push(all_dynamic_id_list[i])
                            let record = await utl.my_throw(`${e}`)
                            manual_op_failed_record.push(record)
                            console.error(`${global_var.user_info.uname}\t${all_dynamic_id_list[i]}\n${e}`)
                            if (!global_var.user_info.uname || (await global_var.page.isClosed())) {
                                //没登录或者浏览器页面关了
                                break
                            }
                            if (JSON.stringify(record).toLowerCase().includes('timeout')) {
                                await sleep(2 * 60 * 1e3)
                            }
                        }
                    }
                } catch (e) {
                    console.error(`${global_var.user_info.uname}\tlottery_loop\n`, e)
                    global_var.Getter.check_login_status();

                }
                finally {
                    global_var.response.global_dynamic_data = undefined//全局的动态数据
                    global_var.response.create_dyn_response = undefined//创建或转发动态的响应
                    global_var.response.comment_dyn_response = undefined//自己评论动态的响应
                    global_var.response.relation_modify_response = undefined//关注响应
                    global_var.response.dynamic_thumb_response = undefined//点赞动态响应
                    global_var.response.space_reservation = undefined//空间预约响应
                    global_var.recorded_data = ''
                    let d = new Date()
                    if (manual_op.length != 0) {//人工判断列表非空时的操作
                        if (global_var.user_info.uname) {
                            let filepath = 'log/' + `${lottery_setting.CONFIG.COOKIENAME} ${global_var.user_info.uname} 人工判断${d.toLocaleString()}.csv`.replaceAll('/', '-').replaceAll(':', '：')
                            let write_in_content = [];
                            for (let i = 0; i < manual_op.length; i++) {
                                console.log(manual_op[i]);
                                let myDynamicId = MYAPI.BiliAPI.draw_dynamic_id(manual_op[i])
                                if (i + 1 <= manual_op_failed_record.length) {
                                    write_in_content.push(`https://www.bilibili.com/opus/${myDynamicId} ,${manual_op_failed_record[i]}`)
                                }
                                else {
                                    write_in_content.push(`https://www.bilibili.com/opus/${myDynamicId}`)
                                }
                            }
                            MYAPI.fileWrite(filepath, write_in_content.join('\n'))
                        }
                    }
                    else {
                        // let filepath = 'log/' + `${lottery_setting.CONFIG.COOKIENAME} ${global_var.user_info.uname} 抽奖完成${d.toLocaleString()}.csv`.replaceAll('/', '-').replaceAll(':', '：')
                        // MYAPI.fileWrite(filepath, '')
                    }
                    console.log(`\t${lottery_setting.CONFIG.COOKIENAME}\t${global_var.user_info.uname}\t${global_var.user_info.uname}抽奖完成`, d.toLocaleString())
                    console.log(`${global_var.user_info.uname}\t`, lottery_record)
                    console.log(`${global_var.user_info.uname}\t人工回复动态：${manual_op.length}条`)
                    console.log(`${global_var.user_info.uname}\t`, manual_op)
                    console.log(`${global_var.user_info.uname}\t失败原因:`, manual_op_failed_record)
                    return lottery_success
                }
            }

            /**
             * 检查每天是否投币经验满了
             */
            async function Daily_rewards() {
                if (lottery_setting.CONFIG.AUTO_DailyReward) {
                    let my_coin = global_var.user_nav.data.money
                    if (my_coin < 1) {
                        console.log(`${global_var.user_info.uname}\t没有硬币了，跳过每日经验奖励\t${(new Date()).toLocaleTimeString()}`);
                        return;
                    }
                    let my_level;
                    try {
                        my_level = global_var.user_nav.data.level_info.current_level
                    }
                    catch { }
                    if (my_level == 6) {
                        console.log(`${global_var.user_info.uname}\t等级满了，跳过每日经验奖励\t${(new Date()).toLocaleTimeString()}`);
                        return;
                    }
                    await global_var.page.goto(`https://account.bilibili.com/account/home`, { "waitUntil": "networkidle2" })
                    let exp_text = await global_var.page.$$eval(`.home-dialy-exp-item`, els => {
                        try {
                            for (taskel of els) {
                                if (taskel.getElementsByClassName('re-exp-info')[0].textContent == '每日投币') {
                                    if (taskel.getElementsByClassName('re-exp-none')) {
                                        return taskel.getElementsByClassName('re-exp-none')[0].textContent
                                    }
                                    else {
                                        return null
                                    }
                                }
                            }
                        }
                        catch {
                            return null
                        }
                    })
                    let exp_re = /([0-9]+)\/([0-9]+)/ig.exec(exp_text)
                    if (exp_re) {
                        let exp_min = parseInt(exp_re[1]);
                        let exp_max = parseInt(exp_re[2]);
                        let coin_thow_num = (exp_max - exp_min) / 10
                        coin_thow_num = coin_thow_num > parseInt(my_coin) ? parseInt(my_coin) : coin_thow_num;
                        console.log(`${global_var.user_info.uname}\t需要投${coin_thow_num}个硬币\t${(new Date()).toLocaleTimeString()}`);
                        let video_num = Math.ceil(coin_thow_num / 2)
                        let sanlian_num = parseInt(coin_thow_num / 2)
                        let toubi_num = coin_thow_num % 2
                        let share_video_links = await my_operator.prevent_filter_module.get_video_list(video_num)
                        for (let v_link of share_video_links) {
                            if (sanlian_num) {
                                await my_operator.video_operator.goto_video_page(v_link);
                                await my_operator.video_operator.sanlian(v_link);
                                sanlian_num -= 1;
                                continue;
                            }
                            if (toubi_num) {
                                await my_operator.video_operator.goto_video_page(v_link);
                                await my_operator.video_operator.toubi(1, v_link);
                                toubi_num -= 1
                            }
                        }
                        console.log(`${global_var.user_info.uname}\t每日投币经验任务完成\t${(new Date()).toLocaleTimeString()}`);
                    }
                    else {
                        console.log(`${global_var.user_info.uname}\t投币经验已满\t${(new Date()).toLocaleTimeString()}`);
                    }
                }
            }

            async function lottery_init() {


                ///////////////////////////////////开始必抽的预约抽奖
                /**
                 * 返回参与成功的预约抽奖list
                 * @returns 
                 */

                async function 必抽的预约抽奖() {
                    let reserve_lottery_sapce_list = MYAPI.fileRead.lottery_dynamic_ids('必抽的预约抽奖.txt')
                    reserve_lottery_sapce_list = utl.noRepeatArr(reserve_lottery_sapce_list);//参加过的必抽的大奖
                    let mustjoin_reserve_record_path_name = `抽奖记录/必抽的预约抽奖记录/${global_var.user_info.uname}_参加过的预约抽奖.txt`
                    let joined_lottery_record = MYAPI.fileRead.lottery_dynamic_ids(mustjoin_reserve_record_path_name);
                    joined_lottery_record = utl.noRepeatArr(joined_lottery_record);//参加过的必抽的大奖


                    /** @member {Array} 参加失败或者没参加的预约抽奖*/
                    let joinfail_list = []
                    /** @member {Array} 参加成功或者超时的预约抽奖*/
                    let success_list = []
                    let before_reserve_list = []
                    if (reserve_lottery_sapce_list.length != 0) {
                        console.log(`${global_var.user_info.uname}\t开始执行任务：必抽的预约抽奖`);
                        let result = await reserve_lottery_loop(reserve_lottery_sapce_list);
                        joinfail_list = result.joinfail_list;
                        before_reserve_list = result.before_reserve_list;
                        success_list = result.joinsuccess_list;
                        console.log(`${global_var.user_info.uname}\t任务完成：必抽的预约抽奖`);
                    } else {
                        console.log(`${global_var.user_info.uname}\t抽奖数量为0，跳过任务：必抽的预约抽奖`);
                    }
                    if (joinfail_list.length != 0) {
                        let d = new Date()
                        MYAPI.fileWrite(`log/` + `${global_var.user_info.uname}_${d.toLocaleString()}参加失败的预约抽奖.txt`.replaceAll('/', '-').replaceAll(':', '：'), joinfail_list.join('\n'))
                    }
                    success_list.map(el => joined_lottery_record.push(el.jump_url));//参与成功的预约抽奖写进记录里
                    joined_lottery_record = utl.noRepeatArr(joined_lottery_record);
                    if (success_list.length != 0) {//将记录写进文件里
                        MYAPI.fileWrite(mustjoin_reserve_record_path_name, joined_lottery_record.join('\n'))
                    }
                    return success_list
                }
                /////////////////////////////////////////////////////////
                async function 必抽的大奖加官方抽奖() {
                    console.log(`${global_var.user_info.uname}\t开始执行任务：必抽的大奖加官方抽奖`);

                    let need_repost_official_dynamic = MYAPI.fileRead.lottery_dynamic_ids(`官方抽奖动态id.txt`);
                    let need_mustjoin_lottery_dynamic = MYAPI.fileRead.lottery_dynamic_ids(`必抽的大奖.txt`);

                    /////////////////////////////////必抽的大奖，先是必抽的大奖，然后再是官方抽奖，因为有可能会在官抽的评论区加抽
                    let mustjoin_lottery_record_path_name = `抽奖记录/必抽的大奖记录/${global_var.user_info.uname}_参加过的大奖.txt`
                    let mustjoin_lottery_record = MYAPI.fileRead.lottery_dynamic_ids(mustjoin_lottery_record_path_name);
                    mustjoin_lottery_record = utl.noRepeatArr(mustjoin_lottery_record);//参加过的必抽的大奖
                    need_mustjoin_lottery_dynamic = utl.noRepeatArr(need_mustjoin_lottery_dynamic);
                    let finally_mustjoin_lottery_dynaimc = [];
                    for (let i of need_mustjoin_lottery_dynamic) {
                        if (!mustjoin_lottery_record.includes(i)) {
                            finally_mustjoin_lottery_dynaimc.push(i)
                        }
                    }

                    lottery_setting.official_lottery_switch = true;//开启官方抽奖
                    lottery_setting.CONFIG.Only_Comment_Lottery_Switch = false;//关闭只抽普通抽奖
                    let must_join_lottery_result = [];
                    if (finally_mustjoin_lottery_dynaimc.length != 0) {
                        must_join_lottery_result = await lottery_loop(finally_mustjoin_lottery_dynaimc)
                    }//必抽的大奖
                    MYAPI.fileWrite(mustjoin_lottery_record_path_name, must_join_lottery_result.join("\n"), "a+");
                    //////////////////////////////////////////////

                    /////////////////////////////////////////////必抽的官抽
                    let official_lottery_record_path_name = `抽奖记录/官方抽奖记录/${global_var.user_info.uname}_参加过的官方抽奖.txt`
                    let reposted_official_dynamic = MYAPI.fileRead.lottery_dynamic_ids(official_lottery_record_path_name);
                    reposted_official_dynamic = utl.noRepeatArr(reposted_official_dynamic);
                    need_repost_official_dynamic = utl.noRepeatArr(need_repost_official_dynamic);
                    let finally_repost_official_dynaimc = [];
                    for (let i of need_repost_official_dynamic) {
                        if (!reposted_official_dynamic.includes(i)) {
                            finally_repost_official_dynaimc.push(i)
                        }
                    }
                    lottery_setting.official_lottery_switch = true;//开启官方抽奖
                    lottery_setting.CONFIG.Only_Comment_Lottery_Switch = false;//关闭只抽评论抽奖
                    lottery_setting.lottery_sep_time = utl.generater_step_Array(10e3, 60e3, 1e3);
                    lottery_setting.CONFIG.lottery_sep_time_type = 2
                    let official_lottery_result = [];
                    if (finally_repost_official_dynaimc.length != 0) {
                        official_lottery_result = await lottery_loop(finally_repost_official_dynaimc)
                    }//必抽的官抽
                    MYAPI.fileWrite(official_lottery_record_path_name, official_lottery_result.join("\n"), "a+");
                    ///////////////////////////////////////////////////
                    console.log(`${global_var.user_info.uname}\t任务完成：必抽的大奖加官方抽奖`);

                }
                async function 普通抽奖() {

                    let all_dynamic_id_list = []
                    if (lottery_setting.CONFIG.CommonLottery_switch) {
                        console.log(`${global_var.user_info.uname}\t开始执行任务：普通抽奖`);
                        all_dynamic_id_list = MYAPI.fileRead.lottery_dynamic_ids('一般的抽奖动态id.txt')//获取抽奖动态id
                        all_dynamic_id_list = utl.noRepeatArr(all_dynamic_id_list)
                        await lottery_loop(all_dynamic_id_list);
                    }
                    else {
                        console.log(`${global_var.user_info.uname}\t未开启开关，跳过任务：普通抽奖`);
                    }

                }

                let non_random_tasklist = [
                    "必抽的预约抽奖",
                    "参加点击的活动"
                ]

                for (let non_random_taskname of non_random_tasklist) {
                    switch (non_random_taskname) {
                        case "必抽的预约抽奖":
                            eval(lottery_setting_string);//重置抽奖设置
                            await 必抽的预约抽奖();
                            break;
                        case "参加点击的活动":
                            let op = JSON.parse(fs.readFileSync(__dirpath + 'JsonData/待操作HTML元素.json', 'utf-8'))//require并不是同步地读取文件，如果这个JSON文件是动态变化的话可能无法读取到最新的JSON文件。
                            // require('./JsonData/待操作HTML元素.json');
                            console.log(`${global_var.user_info.uname}\t开始执行任务：参加点击的活动`);
                            await HTMLOP(global_var.page, op.op)
                            console.log(`${global_var.user_info.uname}\t任务完成：参加点击的活动`);
                            break;
                    }
                }


                let tasklist = [
                    "普通抽奖",
                    "必抽的大奖加官方抽奖",
                ]
                global_var.Pause = false
                console.log(Date())
                console.log('开始获取动态id')
                lottery_setting.FLAG.do_lottery_flag = true//设置开始抽奖的标志
                global_var.page.on('close', function () {//确认关闭后干的事情
                    lottery_setting.FLAG.do_lottery_flag = false
                })

                tasklist = utl.part_shuffle(tasklist.length, tasklist);
                console.log(`${global_var.user_info.uname}\t任务执行顺序:\n${tasklist.join('\n')}`)
                for (let taskName of tasklist) {
                    switch (taskName) {
                        case "普通抽奖":
                            eval(lottery_setting_string);//重置抽奖设置
                            await 普通抽奖();
                            break;
                        case "必抽的大奖加官方抽奖":
                            eval(lottery_setting_string);//重置抽奖设置
                            await 必抽的大奖加官方抽奖();
                            break;
                    }
                }











                ///////////////////////////////////开始防过滤操作
                let clf = await global_var.page.isClosed()
                if (clf) {
                    return
                }
                if ((lottery_setting.prevent_module.share_video_switch || lottery_setting.prevent_module.create_word_dynamic_chp_switch) && !clf) {
                    console.log(`${global_var.user_info.uname}\t开始防过滤操作`)
                    //await global_var.page.setDefaultNavigationTimeout(30);

                    await global_var.page.goto('https://www.bilibili.com')
                    await sleep(10e3)
                    if (global_var.user_info.uname) {
                        lottery_setting.FLAG.share_flag = true
                        await my_operator.prevent_filter_module.prevent_filter_init()
                    } else {
                        console.warn("登陆失败" + JSON.stringify(global_var));
                        throw ("登陆失败" + JSON.stringify(global_var))
                    }
                }
                ///////////////////////////////////开始防过滤操作



                lottery_setting.FLAG.do_lottery_flag = false;
                // try {
                //     await MYAPI.cookieSetting.saveCookie(lottery_setting.CONFIG.COOKIENAME)//结束保存cookie
                // }
                // catch (e) {
                //     console.log(e, `${lottery_setting.CONFIG.COOKIENAME} cookie保存失败`);
                // }
            }
            function set_global_var(opus_dynamic) {
                global_var.FLAG.opus动态标志 = opus_dynamic;

            }
            async function Init() {
                //await sleep(3600e3)

                try {
                    await account_init()
                }
                catch (e) {
                    console.warn(`ERROR:${e}\naccount_init\n${lottery_setting.CONFIG.COOKIENAME}`);
                }

                try {
                    for (let i = 0; i < 5; i++) {//如果没有登陆信息，先多次尝试获取
                        if (!global_var.user_info.uname) {
                            await global_var.page.reload();
                            await sleep(5e3)
                        }
                        else {
                            break;
                        }
                    }
                }
                catch (e) {
                    console.warn('登陆出错：\n', e)
                    return
                }
                if (!global_var.user_info.uname) {
                    console.warn(`${lottery_setting.CONFIG.COOKIENAME}，账号初始化失败，无登录信息！`);
                    return
                }//如果登陆信息获取失败直接退出
                //设置全局标志
                set_global_var(opus动态标志);
                try {
                    if (!broswer_mode) {
                        await Daily_rewards();
                    }
                } catch (e) {
                    console.warn(`${global_var.user_info.uname}\t每日投币经验任务失败\t${(new Date()).toLocaleTimeString()}\n`);
                    console.warn(e);
                    await global_var.page.goto('chrome://new-tab-page/')
                }
                finally {
                    try {
                        await global_var.page.goto('https://message.bilibili.com/#/love')
                    }
                    catch {
                    }
                }


                if (broswer_mode) { return; }//如果是打开浏览器模式则直接退出抽奖

                await lottery_init();
                //await browser_Disconnected(global_var.browser);
            }











            this._setLotFlag(true);
            await Init()//初始化抽奖，同时开始抽奖
            this._setGlobalPage(global_var.page);
            await sleep(60e3)
            this._setLotFlag(false);
            if (!broswer_mode && global_var.user_info.uid) {
                if (global_var.response.msgfeed_unread) {
                    if (global_var.response.msgfeed_unread.data.at > 0 || global_var.response.msgfeed_unread.data.reply > 0) {//如果有回复或者@就不退出浏览器
                        await my_send_notify.push_me(`${global_var.user_info.uname} 有新的回复或at`, `at数量：${global_var.response.msgfeed_unread.data.at}\n回复数量：${global_var.response.msgfeed_unread.data.reply}`)
                        if (await global_var.page.isClosed()) {
                        }//页面关了全都不管
                        else {
                            await global_var.page.goto(`https://message.bilibili.com/#/love`)
                        }
                        return;
                    }
                }
                try {
                    if (await global_var.page.isClosed()) {
                    }//页面关了全都不管
                    else {
                        await global_var.browser.close()//页面没关全部关掉
                    }
                }
                catch {
                    await global_var.page.close()
                }
            }
        })()
    };
    mainFunc = async function (lottery_setting_filename, broswer_mode = false, opus动态标志 = false) {
        try {
            let lottery_settingstr = await lottery_setting_file_reader(lottery_setting_filename)
            await this.launch_lottery(lottery_settingstr, broswer_mode, opus动态标志)
        }
        catch (e) {
            console.log(e, lottery_setting_filename, Date());
        }
    };
}


/**
 * @todo 增加chatgpt类似的AI回复
 * @todo 增加自动获取色图并且发送的功能或者是转发色图up的动态？
 */
module.exports = { DO_Lottery, sleep };
