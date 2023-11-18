const { Page } = require("puppeteer");
const { DO_Lottery } = require("../木偶模块/puppeteer_lottery");
const utl = require('../木偶模块/util/common_utl');
const { sleep } = require("../木偶模块/puppeteer_lottery.js");
const live_op = {
    element_map: {//存放元素路径
        dm_send_btn: '.right-action.p-absolute.live-skin-coloration-area',//发送弹幕按钮
        dm_input_box: '.chat-input.border-box',//弹幕输入框
        like_btn: '.like-btn',
        anchor_icon: '.anchor-lot-icon',
        anchor_join_btn: '.join-btn-1',
        contribution_btn: '.switch-btn-bg.live-skin-highlight-bg',//贡献值下拉框按钮
    },
    /**
     * 初始化一个新的页面，专门进行直播操作，并注册一个拦截直播流的事件
     * @param {Page} pg 
     * @param {DO_Lottery} DO_Lottery_class 
     * @returns {Page} 返回创建的新的页面对象
     */
    live_page_init: async (pg, DO_Lottery_class) => {
        /**
         * 拦截直播流
         * @param {Page} live_pg 
         */
        function fetchout(live_pg) {
            live_pg.on('request', interceptedRequest => {//拦截直播流
                try {
                    if (interceptedRequest.url().includes('bilivideo')) {
                        interceptedRequest.abort()
                        console.log(`成功拦截直播流：${interceptedRequest.url()}`);
                    } else {
                        interceptedRequest.continue()
                    }
                }
                catch (e) {
                    console.warn(`拦截请求：${interceptedRequest.url()}失败`, e);
                }
            })
        }

        if ((await pg.browser().pages()).length === 0 || !pg) {
            DO_Lottery_class.broswer_mode = 1;
            await DO_Lottery_class.main();
            pg = DO_Lottery_class.global_page;
        }
        let new_pg = await pg.browser().newPage()
        new_pg.on('load', fetchout, new_pg)//注册拦截直播流事件
        new_pg.on('request', async interceptedRequest => {
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
        return new_pg;
    },
    basic_op: {
        input_dm: async (pg, dm_msg) => {
            let msg_box;
            await pg.waitForSelector(live_op.element_map.dm_input_box, { timeout: 10e3 })
            msg_box = await pg.$(live_op.element_map.dm_input_box)
            await msg_box.click()
            let msg_box_content = await pg.$eval(live_op.element_map.dm_input_box, el => el.value)
            let _bt = 0
            while (msg_box_content != dm_msg) {//回复栏里的东西等于回复内容时break
                await msg_box.click()
                await sleep(utl.random_choice(3 * lottery_setting.Working_clearance_time))
                await msg_box.type(dm_msg, { delay: 20 })
                await sleep(1e3)
                msg_box_content = await pg.$eval(live_op.element_map.dm_input_box, el => el.value)
                if (utl.remove_invisible_char(msg_box_content.replaceAll(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "")) != utl.remove_invisible_char(dm_msg.replaceAll(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, ""))) {//如果不等就删掉重新输入
                    await sleep(1e3)
                    await msg_box.click()
                    await pg.keyboard.down('Control');
                    await pg.keyboard.press('A');
                    await pg.keyboard.up('Control');
                    await sleep(1e3)
                    await pg.keyboard.press('Backspace');
                    console.log('输入框里内容与评论不符，删除输入框里内容', `\nmsg_box_content:${msg_box_content}\ndm_msg:${dm_msg}`);
                }
                else {
                    //相等了break出去
                    break;
                }
                if (_bt >= 5) {
                    console.error('弹幕输入失败');
                    throw (`弹幕输入失败`)
                }
                _bt += 1
            }
        },
        send_dm: async (pg) => {
            await pg.click(live_op.element_map.dm_send_btn);
        },
        click_like: async (pg) => {
            await pg.click(live_op.element_map.like_btn);
        },
    },

    polymer_op: {//通过一般操作组合成一套完整的操作
        /**
         * 无限循环发送弹幕
         * @param {Page} pg 
         * @param {String} dm_msg 
         * @param {boolean} cheat_mode 
         */
        live_send_dm_loop: async (pg, dm_msg, cheat_mode = false) => {
            let dm_list = [dm_msg]
            if (cheat_mode) {
                for (let i = 1; i < 30 - dm_msg.length; i++) {
                    dm_list.push(dm_msg + ' '.repeat(i));
                }
            }
            while (1) {
                for (let msg of dm_list) {
                    await live_op.basic_op.input_dm(pg, msg);
                    await sleep(100);
                    await live_op.basic_op.send_dm(pg, msg);
                    if (!cheat_mode) {
                        await sleep(6 * 1e3);
                    }
                    else {
                        await sleep(500);
                    }
                }
            }
        },
        live_send_dm_single: async (pg, dm_msg) => {
            let dm_list = [dm_msg]
            for (let msg of dm_list) {
                await live_op.basic_op.input_dm(pg, msg);
                await sleep(100);
                await live_op.basic_op.send_dm(pg, msg);
                if (!cheat_mode) {
                    await sleep(6 * 1e3);
                }
                else {
                    await sleep(500);
                }
            }
        },

    }
}
let BAPI = {
    /**
     * API发送请求
     * @param {Page} pg 
     * @param {String} url 
     * @param {String} method 
     * @param {JSON} data 
     */
    ajax: async (pg, url, method, data) => {
        let resp = await pg.evaluate(
            async (url, method, data) => {
                let params;
                let body;
                if (method.toLowerCase() == 'get') {
                    params = data;
                } else {
                    body = data;
                };
                if (params) {
                    let paramsArray = [];
                    //拼接参数
                    Object.keys(params).forEach(key => paramsArray.push(key + '=' + params[key]))
                    if (url.search(/\?/) === -1) {
                        url += '?' + paramsArray.join('&')
                    } else {
                        url += '&' + paramsArray.join('&')
                    }
                }
                let response = await fetch(
                    url = url,
                    {
                        credentials: 'include',
                        method: method,
                    },
                    body = JSON.stringify(body),
                );
                return await response.json();
            },
            url, method, data
        );
        return resp;
    },
    /**
     * 获取uid关注状态
     * @param {Page} pg 
     * @param {number} uid 
     * @returns 
     */
    IsUserFollow: async (pg, uid) => {
        let url = 'https://api.live.bilibili.com/relation/v1/Feed/IsUserFollow';
        let params = { follow: uid };
        return await BAPI.ajax(pg, url, 'get', params);
    },
    get_attention_list: async (pg, uid) => {
        let url = 'https://api.vc.bilibili.com/feed/v1/feed/get_attention_list';
        let params = {
            uid: uid
        }
        return await BAPI.ajax(pg, url, 'get', params);
    }
}
class API {
    constructor(uname) {
        this.uname = uname;
    }
    chatLog = (text, type = 'info') => {
        switch (type) {
            case 'info': {
                console.log(`【${this.uname}】${text}`)
                break
            }
            case 'warning': {
                console.warn(`【${this.uname}】${text}`)
                break
            }
            case 'error': {
                console.error(`【${this.uname}】${text}`)
                break
            }
            default: {
                console.debug(`【${this.uname}】${text}`)
                break
            }
        }
    }
}


class LIVE_LOT {
    /**
     * 遇到一个抽奖就创建一个新的页面，而不是新的class
     * @param {Page} pg 
     * @param {DO_Lottery} DO_Lottery_class 
     */
    constructor(pg, DO_Lottery_class) {
        this.__DO_Lottery_class = DO_Lottery_class;
        this.__origin_pg = pg;
        this.live_pg;
        this.API = new API();
        this.CONFIG = {
            live_info: {
                csrf: '',
                uid: 0,
                uname: '',
                user_level: 0,
                ALLFollowingList: [],
            },
            redpacket: {
                joined_redpacket_lot_id_list: [],
                max_joined_switch: false,
                join_risk_mark: false,//红包风控标志
                risk_sleeptime: 60 * 60 * 1e3,//风控等待时间
            },
            anchor: {
                joined_anchor_id_list: [],
                max_joined_switch: false,
                join_risk_mark: false,//天选抽奖风控标志
                risk_sleeptime: 60 * 60 * 1e3,//风控等待时间
            }
        };
    };
    /**
     * 初始化一个新的页面，专门用来抽直播抽奖
     */
    init = async () => {
        this.live_pg = await live_op.live_page_init(this.__origin_pg, this.__DO_Lottery_class);
        await this.live_pg.goto('https://live.bilibili.com/?spm_id_from=333.1007.0.0');
        let response = await (await this.live_pg.waitForResponse(resp => resp.url().includes('get_user_info'))).json();
        if (response.code == 0) {
            this.CONFIG.live_info.uname = response?.data?.uname;
            this.CONFIG.live_info.uid = response?.data?.uid;
            this.CONFIG.live_info.user_level = response?.data?.user_level;
        }
        this.API = new API(this.CONFIG.live_info.uname);
        await this.#init_following_list();
    };
    /**
     * 初始化关注人数
     */
    #init_following_list = async () => {
        while (!this.CONFIG.live_info.uid) {
            await this.live_pg.goto('https://live.bilibili.com/?spm_id_from=333.1007.0.0');
            await sleep(3e3);
        }
        BAPI.get_attention_list(this.live_pg, this.CONFIG.live_info.uid).then(async (data) => {
            if (data.code == 0) {
                this.API.chatLog('全部关注数', data.data.list.length)
                this.CONFIG.ALLFollowingList = data.data.list
                if (data.data.list.length > 2900) {
                    this.API.chatLog(`直播主播关注数达到${data.data.list.length}，注意满2000关注后，将无法新增关注，会影响中奖！`, 'warning')
                }
            }
        })
    };

    /**
     * 参加红包抽奖
     * @param {Page} pg 
     */
    #join_redpacket_lot = async (pg, room_id, anchor_uid, lot_id, total_price) => {
        if (!this.CONFIG.live_info.csrf) {
            if (!pg.url().includes('bilibili')) {
                await pg.goto('https://www.bilibili.com');
            };
            let all_cookies = await pg.cookies();
            let bili_cookie = all_cookies.filter(el => el.domain.includes('bilibili.com'));
            let csrf = bili_cookie.filter(el => el.name == 'bili_jct').pop().value;
            this.CONFIG.live_info.csrf = csrf;
        }//获取csrf
        let dmlist = ['[dog]', '[妙]', '[哇]']
        this.CONFIG.redpacket.joined_redpacket_lot_id_list.push(lot_id);
        if (this.CONFIG.redpacket.joined_redpacket_lot_id_list.length > 200) {
            this.CONFIG.redpacket.joined_redpacket_lot_id_list = this.CONFIG.redpacket.joined_redpacket_lot_id_list.slice(-50);
        }
        await pg.evaluate((roomid, anchor_uid, csrf_token, lot_id, CG, sleep) => {
            var formData = new FormData();
            formData.set("visit_id", "");
            formData.set("session_id", "");
            formData.set("room_id", roomid);
            formData.set("ruid", anchor_uid);
            formData.set("spm_id", "444.8.red_envelope.extract");
            formData.set("jump_from", "26000");
            formData.set("build", "6790300");
            formData.set("c_locale", "en_US");
            formData.set("channel", "360");
            formData.set("device", "android");
            formData.set("mobi_app", "android");
            formData.set("platform", "android");
            formData.set("version", "6.79.0");
            formData.set("statistics", "%7B%22appId%22%3A1%2C%22platform%22%3A3%2C%22version%22%3A%226.79.0%22%2C%22abtest%22%3A%22%22%7D");
            formData.set("csrf", csrf_token);
            formData.set("csrf_token", csrf_token);
            formData.set("lot_id", lot_id);
            let url = `https://api.live.bilibili.com/xlive/lottery-interface/v1/popularityRedPocket/RedPocketDraw`;
            let method = "post";
            let headers = {
                "User-Agent": "Mozilla/5.0 BiliDroid/6.79.0 (bbcallen@gmail.com) os/android model/Redmi K30 Pro mobi_app/android build/6790300 channel/360 innerVer/6790310 osVer/11 network/2"
            };
            fetch(
                url, {
                method: method,
                headers: headers,
                credentials: 'include',
            },
                data = formData,
            ).then(async (res) => {
                let dat = await res.json();
                //console.log('drawRedPacket',dat)
                if (dat.code == 0) {
                    console.log(`【直播间电池道具】【数据】房间号：<a target="_blank" href="https://live.bilibili.com/${roomid}">${roomid}</a>，直播间道具红包总值${total_price / 1000}元参与成功！`);
                    await sleep(1e3);
                    await this.#getOnlineGoldRank(pg).then(async (da) => {
                        if (da.code == 0) {
                            let onlineNum = da.data.count
                            let score = da.data.own_info.score
                            let rank = da.data.own_info.rank
                            console.log(`【直播间电池道具 ${this.CONFIG.live_info.uname}】目前在线人数：${onlineNum}<br>贡献值：${score}<br>排名：${rank}`, 'success');
                            if (score == 0) {
                                let con = `<br>${timestampToTime((ts_s() + s_diff))}：房间号：<a target="_blank" href="https://live.bilibili.com/${roomid}">${roomid}</a>，参加抽奖后直播间无贡献值，可能已经风控！`
                                if (CG.redpacket.join_risk_mark) {
                                    con = con + '暂停抽奖' + CG.redpacket.risk_sleeptime + '分钟！'
                                    console.log(`【直播间电池道具 ${this.CONFIG.live_info.uname}】${roomid}直播间无贡献值，暂停抽奖${CG.redpacket.risk_sleeptime}分钟！`, 'warning')
                                } else {
                                    CG.redpacket.join_risk_mark = true;
                                    setTimeout(() => {
                                        CG.redpacket.join_risk_mark = false;
                                    }, CG.redpacket.risk_sleeptime);
                                    console.log(`【直播间电池道具 ${this.CONFIG.live_info.uname}】${roomid}直播间无贡献值，可能已经风控！`, 'warning')
                                }
                                return
                            }
                            if (score < 3) {
                                console.log(`【直播间电池道具 ${this.CONFIG.live_info.uname}】开始在直播间${roomid}间隔5秒发送${3 - score}条表情包弹幕！`)
                                for (let i = 0; i < 3 - score; i++) {
                                    live_op.polymer_op.live_send_dm_single(pg, utl.random_choice(dmlist));
                                }
                            }
                        }
                    })
                } else if (dat.code == 1009109) {
                    CG.redpacket.max_joined_switch = true
                    console.log(`【直播间电池道具】${roomid}直播间道具红包参与反馈：${dat.message}`, 'warning')
                } else if (dat.code == 1009114) {
                    CG.redpacket.join_risk_mark = true
                    console.log(`【直播间电池道具】${roomid}直播间道具红包参与反馈：${dat.message}`, 'warning')
                } else {
                    CG.redpacket.join_risk_mark = true
                    console.log(`【直播间电池道具】${roomid}直播间道具红包参与反馈：${dat.message}`, 'warning')
                }
            })
        },
            room_id, anchor_uid, this.CONFIG.live_info.csrf, lot_id, this.CONFIG, sleep);
    };
    /**
     * 获取直播贡献值
     * @param {Page} pg 
     * @returns {Promise<JSON>}
     */
    #getOnlineGoldRank = async (pg) => {
        pg.click(live_op.element_map.contribution_btn);
        return await pg.waitForResponse(resp => resp.url().includes('queryContributionRank'))
    };
    /**
     * 参加天选抽奖
     * @param {Page} pg 
     * @returns 
     */
    #join_anchor_lot = async (pg, lot_id, gift_num, gift_price, anchor_uid) => {
        let unusual_mark = false
        if (this.CONFIG.live_info.ALLFollowingList.indexOf(anchor_uid) == -1) {
            await BAPI.IsUserFollow(pg, anchor_uid).then(async (data) => {
                if (data.code == 0) {
                    if (!data.data.follow) {
                        unusual_mark = true//参加抽奖前、是需要关注的抽奖、确认是未关注状态
                    }
                }
            }, () => {
                return
            })
        }
        this.CONFIG.anchor.joined_anchor_id_list.push(lot_id);
        if (CG.anchor.joined_anchor_id_list.length > 200) {
            CG.anchor.joined_anchor_id_list = CG.anchor.joined_anchor_id_list.slice(-50);
        }
        let anchor_icon = await pg.$(live_op.element_map.anchor_icon);
        if (!anchor_icon) {//没有获取到天选抽奖的图标
            return;
        }
        await anchor_icon.click();
        await sleep(1e3);
        let anchor_join_btn = await pg.$(live_op.element_map.anchor_join_btn);
        anchor_join_btn.click();
        let anchor_join_resp = await pg.waitForResponse(resp => resp.url().includes('xlive/lottery-interface/v1/Anchor/Join'));
        let anchor_join_json = await anchor_join_resp.json();
        if (anchor_join_json.code == 400 & gift_num * gift_price != 0) {
            console.log(`【天选抽奖 ${this.CONFIG.live_info.uname}】 参与 【${pg.url()}】 金瓜子余额不足!`);
            return
        }
        if (anchor_join_json.code == 0) {
            await sleep(5000)
            await this.#getOnlineGoldRank(pg).then(async (da) => {
                if (da.code == 0) {
                    let onlineNum = da.data.count
                    let score = da.data.own_info.score
                    let rank = da.data.own_info.rank
                    console.log(`【天选时刻 ${this.CONFIG.live_info.uname}】目前在线人数：${onlineNum} 贡献值：${score} 排名：${rank}`);
                    if (score == 0) {
                        let con = `参加抽奖后直播间无贡献值，可能已经风控！`
                        if (this.CONFIG.anchor.join_risk_mark) {
                            con = con + '暂停抽奖' + this.CONFIG.anchor.risk_sleeptime + '分钟！'
                            console.log(`【天选时刻 ${this.CONFIG.live_info.uname}】${roomid}直播间无贡献值，暂停抽奖${this.CONFIG.anchor.risk_sleeptime}分钟！`, 'warning')
                        } else {
                            this.CONFIG.anchor.join_risk_mark = true;
                            setTimeout(() => {
                                this.CONFIG.anchor.join_risk_mark = false;
                            }, this.CONFIG.anchor.risk_sleeptime);
                            console.log(`【天选时刻 ${this.CONFIG.live_info.uname}】${roomid}直播间无贡献值，可能已经风控！`, 'warning')
                        }
                        return
                    }
                    if (score < 3) {
                        console.log(`【天选时刻 ${this.CONFIG.live_info.uname}】开始在直播间${roomid}间隔5秒发送${3 - score}条表情包弹幕！`)
                        for (let i = 0; i < 3 - score; i++) {
                            live_op.polymer_op.live_send_dm_single(pg, utl.random_choice(dmlist));
                        }
                    }
                }
            })
        }
        else {
            this.CONFIG.anchor.join_risk_mark = true;
        }
        if (unusual_mark) {//查看是否关注，如果关注失败则账号被风控！
            BAPI.IsUserFollow(pg, anchor_uid).then(async (data) => {
                if (data.code == 0) {
                    if (!data.data.follow) {//参加抽奖后还是未关注状态判断为异常
                        unusual_stop = true
                        console.log(`【天选时刻 ${this.CONFIG.live_info.uname}】检测到${room_id}关注异常，暂停抽奖${this.CONFIG.anchor.risk_sleeptime / 60 / 1000}分钟！`)
                        setTimeout(async () => {
                            this.CONFIG.anchor.join_risk_mark = false;
                        }, this.CONFIG.anchor.risk_sleeptime)
                    }
                    else {
                        this.CONFIG.live_info.ALLFollowingList.push(anchor_uid);
                    }
                }
            })
        }

    };

    main = async () => {
        

    }


};