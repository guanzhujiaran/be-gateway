// ==UserScript==
// @name         dynamic_lottery
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://*.bilibili.com/read/*
// @match        https://t.bilibili.com/*
// @match        https://space.bilibili.com/*
// @match        https://www.bilibili.com/404
// @match        https://www.bilibili.com/*
// @connect      *
// @connect      bilibili.com
// @exclude      https://t.bilibili.com/lottery/h5/index/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bilibili.com
// @require      http://code.jquery.com/jquery-3.x-git.min.js
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-start
// ==/UserScript==

if (window.top != window.self) {  //don't run on frames or iframes
    console.log("don't run on frames or iframes")
    return
}
document.addEventListener("click", function (e) {
    console.log(e.pageX, e.pageY, e.clientX, e.clientY, e.isTrusted)
})
window.onload = (function d_l() {
    var Live_info = {
        coin: undefined,
        room_id: undefined,
        uid: undefined,
        csrf_token: undefined,
        rnd: undefined,
        ruid: undefined,
        uname: undefined,
        user_level: undefined,
        Blever: undefined,
        room_area_id: 371,
        area_parent_id: 9,
        vipType: undefined,
        vipStatus: undefined,
        face_url: undefined,
        vipTypetext: undefined,
        cost: undefined,
        regtime: undefined,
        identification: undefined,
    }
    const delayCall = (callback, delay = 10e3) => {
        const p = $.Deferred();
        setTimeout(() => {
            const t = callback();
            if (t && t.then)
                t.then((arg1, arg2, arg3, arg4, arg5, arg6) => p.resolve(arg1, arg2, arg3, arg4, arg5, arg6));
            else
                p.resolve();
        }, delay);
        return p;
    };
    var BAPI
    const tz_offset = () => new Date().getTimezoneOffset() + 480;
    const ts_ms = () => Date.now();
    const ts_s = () => Math.round(ts_ms() / 1000);
    const year = () => new Date(ts_ms()).getFullYear()
    const month = () => new Date(ts_ms()).getMonth() + 1;
    const day = () => new Date(ts_ms()).getDate();
    const hour = () => new Date(ts_ms()).getHours();
    const minute = () => new Date(ts_ms()).getMinutes();
    const second = () => new Date(ts_ms()).getSeconds();
    const ts_ten_m = () => new Date(ts_ms()).getHours() * 6 + Math.round(new Date(ts_ms()).getMinutes() / 10) //十分钟误差标记
    var ms_diff = 0
    var s_diff = 0
    //一些按钮
    var my_component = {
        my_btn: function () {//按钮
            let btn = $('<button id="read" style="position: absolute; top: 200px; right: 300px;z-index:1;background-color:GhostWhite;color: #FF34B3;border-radius: 4px;border: none;padding: 5px;cursor: pointer;box-shadow: 1px 1px 2px #00000075;">' +
                '专栏抽奖开关</button>');
            $('.up-left').append(btn)
            btn.click(function () {
                $('#read').remove()
                let new_btn = $('<button id="read" style="position: absolute; top: 200px; right: 300px;z-index:1;background-color:GhostWhite;color: #FF34B3;border-radius: 4px;border: none;padding: 5px;cursor: pointer;box-shadow: 1px 1px 2px #00000075;">' +
                    '抽奖开启中，点击暂停运行</button>');
                new_btn.click(function () {
                    console.log('抽奖暂停')
                    GM_setValue('Pause', true)
                    lottery_setting.do_lottery_flag(false)
                    $('#read').remove()
                    let new_new_btn = $('<button id="read" style="position: absolute; top: 200px; right: 300px;z-index:1;background-color:GhostWhite;color: #FF34B3;border-radius: 4px;border: none;padding: 5px;cursor: pointer;box-shadow: 1px 1px 2px #00000075;">' +
                        '抽奖暂停中，点击继续运行</button>');
                    $('.up-left').append(new_new_btn)
                    new_new_btn.click(function () {
                        console.log('抽奖继续')
                        GM_setValue('Pause', false)
                        lottery_setting.do_lottery_flag(true)
                        $('#read').remove()
                        $('.up-left').append(new_btn)
                    })
                })
                $('#read').remove()
                $('.up-left').append(new_btn)
                setTimeout(cv_dynamic_lottery, 0)
            })

            try {
                const promiseInit = $.Deferred();
                const uniqueCheck = () => {
                    const t = Date.now();
                    if (t - lottery_setting.CONFIG.JSMARK >= 0 && t - lottery_setting.CONFIG.JSMARK <= 15e3) {
                        // 其他脚本正在运行
                        $('#background_show').hide()
                        $("#ddremove").hide()
                        setTimeout(() => {
                            console.warn('检测到脚本已经运行！');
                        }, 5e3);
                        return promiseInit.reject();
                    }
                    // 没有其他脚本正在运行
                    return promiseInit.resolve();
                };
                uniqueCheck().then(() => {
                    let timer_unique;
                    const uniqueMark = () => {
                        timer_unique = setTimeout(uniqueMark, 10e3);
                        lottery_setting.CONFIG.JSMARK = Date.now();
                        try {
                            utl.SaveLotterySetting()
                            return true
                        } catch (e) {
                            console.log('API保存出错', e);
                            return false
                        };
                    };
                    window.addEventListener('unload', () => {
                        if (timer_unique) {
                            clearTimeout(timer_unique);
                            lottery_setting.CONFIG.JSMARK = 0;
                            try {
                                utl.SaveLotterySetting()
                                return true
                            } catch (e) {
                                console.log('API保存出错', e);
                                return false
                            };
                        }
                    });
                    uniqueMark();
                    StartPlunder()
                })
            }
            catch (e) {
                console.log('重复运行监测失败')
                console.log(e);
            }

        },
        my_textarea: function () {
            let wait_time_box = $(`<input class="wait_time" placeholder="抽奖开启前等待时间（默认为0" type="number" style="position: absolute; top: 200px; right: 400px;z-index:1;background-color:GhostWhite;color: #FF34B3;border-radius: 4px;border: none;padding: 5px;cursor: pointer;box-shadow: 1px 1px 2px #00000075;">`)
            $('.up-left').append(wait_time_box)
            let common_style = "background-color:GhostWhite;color: #FF34B3;border-radius: 4px;border: none;padding: 5px;cursor: pointer;box-shadow: 1px 1px 2px #00000075;"
            let radio_septime1 = $(`<label style="${common_style}"><input class="septime" type="radio" name="radio_septime" id="septime_type1" checked="checked">阶段式总运行时间休眠<br></label>`)
            let radio_septime2 = $(`<label style="${common_style}"><input class="septime" type="radio" name="radio_septime" id="septime_type2">等间隔休眠<br></label>`)
            radio_septime1.insertBefore($('.side-toolbar'))
            radio_septime2.insertBefore($('.side-toolbar'))
            let download_log_check_box1 = $(`<label style="${common_style}"><input class="download_log_check" type="checkbox" value="" id="download_log_check">下载转抽log日志<br></label> `)
            download_log_check_box1.insertBefore($('.side-toolbar'))
            let official_lottery_checked_box = $(`<label style="${common_style}"><input type="checkbox" id="official_lottery_check">官方抽奖开关<br></label>`)
            if (lottery_setting.official_lottery_switch) { official_lottery_checked_box.find('input').attr('checked', '') }
            official_lottery_checked_box.change(function () { lottery_setting.official_lottery_switch = $('#official_lottery_check')[0].checked; utl.SaveLotterySetting() })
            official_lottery_checked_box.insertBefore($('.side-toolbar'))
            let lottery_dynamic_id_stock = $(`<div class="lottery_dynamic_id_stock" style="${common_style}border-radius: 4px;border: solid;white-space: pre-wrap;" contenteditable>放置动态id处</div>`)
            lottery_dynamic_id_stock.insertBefore($('.article-content'))
            lottery_dynamic_id_stock.bind('paste', function (event) {
                var e = event || window.event
                // 阻止默认粘贴
                e.preventDefault();
                // 粘贴事件有一个clipboardData的属性，提供了对剪贴板的访问
                // clipboardData的getData(fomat) 从剪贴板获取指定格式的数据
                var text = (e.originalEvent || e).clipboardData.getData('text/plain') || prompt('在这里输入文本');
                //清除回车
                //text = text.replace(/[d+]|n|r/ig, "")
                // 插入
                document.execCommand("insertText", false, text);
            })
            lottery_dynamic_id_stock.blur(function () {
                let all_stock = []
                let raw_stock = lottery_dynamic_id_stock.html().replace(/<div>/gmi, '').replace(/<\/div>/gmi, '\n').replace(/<br>/, '\n').replace('\r', '\n')
                let dajinli_zhuanlanflag = false
                if (raw_stock) {
                    if (raw_stock.includes('：')) {
                        dajinli_zhuanlanflag = true
                    }

                    raw_stock.split('\n').some(function (sto) {
                        if (sto && sto.includes('t.bilibili')) {
                            dynamic_url = /(https:\/\/.*)/.exec(sto)[0]
                            if (dajinli_zhuanlanflag) {
                                dynamic_url += '?tab=2'
                            }
                            all_stock.push(dynamic_url.trim())
                        }
                    })
                    let html_st = []
                    for (let dynamic_url of all_stock) {
                        html_st.push(`<a class="article-link" target="_blank" href="${dynamic_url}">${dynamic_url}<br></a>`)
                    }
                    if (!(html_st == false)) {
                        $('.article-content').html(html_st.join(''))
                    }
                }
            })

            //常用的方法
            function editable_datalist(setting_div, data_setting_name, bind_list) {//设置可编辑的框框
                let content_select = setting_div.find(`[data-setting=${data_setting_name}]`)
                bind_list.some(function (content) {
                    content_select.append($(`<option value="${content}">`))
                })
                let add_btn = $(`<button data-setting="${data_setting_name}_add_btn">添加</button>`)
                content_select.after(add_btn)
                add_btn.click(function () {
                    let input_content = setting_div.find(`input[list=${data_setting_name}]`).val()
                    if (input_content && !bind_list.includes(input_content)) {
                        bind_list.push(input_content)
                        content_select.children().remove()
                        bind_list.some(function (content) {
                            content_select.append($(`<option value="${content}">`))
                            utl.SaveLotterySetting()
                        })
                    }
                    else {
                        console.warn('添加内容为空或重复')
                    }
                })
                let del_btn = $(`<button data-setting="${data_setting_name}_del_btn">删除</button>`)
                add_btn.after(del_btn)
                del_btn.click(function () {
                    let input_content = setting_div.find(`input[list=${data_setting_name}]`).val()
                    if (input_content && bind_list.includes(input_content)) {
                        bind_list.splice(bind_list.indexOf(input_content), 1)
                        content_select.children().remove()
                        bind_list.some(function (content) {
                            content_select.append($(`<option value="${content}">`))
                        })
                        utl.SaveLotterySetting()
                    }
                    else {
                        console.warn('删除内容不存在列表内')
                    }
                })
            }
            function editable_range(setting_div, data_setting_name, bind_ele) {//绑定range的数据
                let range_span = setting_div.find(`span[data-setting=${data_setting_name}]`)
                let range = setting_div.find(`input[data-setting=${data_setting_name}]`)
                range.val(bind_ele)
                range_span.html(Math.ceil(bind_ele * 100) + '%')
                range.change(function () {
                    bind_ele = $(this).val()
                    utl.SaveLotterySetting()
                    range_span.html(Math.ceil(bind_ele * 100) + '%')
                })
            }

            //常用方法结束
            let lottery_setting_detail_div = $(`
            <fieldset class="lottery_setting_detail" style="display:none;z-index: 2;background-color:GhostWhite;color: #FF34B3;border-radius: 4px;border: solid;padding: 5px;cursor: pointer;box-shadow: 1px 1px 2px #00000075;">
            <legend>抽奖详细设置</legend>
            <button id="close" style="float: right;background-color: ghostwhite; color: rgb(255, 52, 179); border-radius: 2px; border: dashed; padding: 5px; cursor: pointer; box-shadow: rgba(0, 0, 0, 0.46) 1px 1px 2px;">X</button><br>
            <label><input id="dailyReward" style="vertical-align: text-top;" type="checkbox" title="获取主站登陆、观看、转发（不显示在动态）经验">主站登陆观看及转发<br></label>
            <span>带评论转发概率：</span><span data-setting="repostchance">50%</span><input type="range" data-setting="repostchance" min="0" max="1" step="0.01"><br>
            <span>评论点赞概率：</span><span data-setting="comment_thumb_chance">50%</span><input type="range" data-setting="comment_thumb_chance" min="0" max="1" step="0.01"><br>
            官方回复内容：<input list="official_comment_content"></input><datalist id="official_comment_content" data-setting="official_comment_content"></datalist><br>
            非官方回复内容：<input list="non_official_comment_content"></input><datalist id="non_official_comment_content" data-setting="non_official_comment_content"></datalist><br>
            默认回复内容：<input list="defined_reply_msg"></input><datalist id="defined_reply_msg" data-setting="defined_reply_msg"></datalist><br>

            </fieldset>
            `)
            let lottery_setting_detail_btn = $('<button id="lsb" style="position: absolute; top: 170px; right: 300px;z-index:1;background-color:GhostWhite;color: #FF34B3;border-radius: 4px;border: none;padding: 5px;cursor: pointer;box-shadow: 1px 1px 2px #00000075;">' +
                '抽奖详细设置</button>');
            lottery_setting_detail_btn.click(
                function () {
                    lottery_setting_detail_div.show()
                    $(this).hide()
                }
            )
            lottery_setting_detail_div.find('#close').click(function () {
                lottery_setting_detail_div.hide()
                lottery_setting_detail_btn.show()
            })
            $('.up-left').append(lottery_setting_detail_btn)
            lottery_setting_detail_div.insertBefore(lottery_setting_detail_btn)
            let dailyReward_checkBox = lottery_setting_detail_div.find('#dailyReward')
            if (lottery_setting.CONFIG.AUTO_DailyReward) {
                dailyReward_checkBox.attr('checked', '')
            }
            dailyReward_checkBox.change(function () {
                lottery_setting.CONFIG.AUTO_DailyReward = $(this).prop('checked')
                utl.SaveLotterySetting()
            })

            editable_range(lottery_setting_detail_div, 'repostchance', lottery_setting.repostchance)
            editable_range(lottery_setting_detail_div, 'comment_thumb_chance', lottery_setting.comment_thumb_chance)


            editable_datalist(lottery_setting_detail_div, `official_comment_content`, lottery_setting.replycontent)
            editable_datalist(lottery_setting_detail_div, `non_official_comment_content`, lottery_setting.non_official_chp)
            editable_datalist(lottery_setting_detail_div, `defined_reply_msg`, lottery_setting.defined_reply_msg)
            editable_datalist(lottery_setting_detail_div, `at_member`, lottery_setting.at_member)






            let prevent_filter_module_div = $(`
            <div class="prevent_filter"
            style="background-color:GhostWhite;color: #FF34B3;border-radius: 4px;border: solid;padding: 5px;cursor: pointer;box-shadow: 1px 1px 2px #00000075;">
            <p style="text-align:center">防止过滤模块<br>
            <span>分享个数：</span><span id="share_count">9</span><input type="range" name="share_count_range" id="share_count_range" min="3" max="30"><br>
            <label><input type="checkbox" id="share_video_check">分享视频开关</label>
            <br><label><input class="septime" type="radio" name="share_radio_septime" id="share_radio_septime1"
            checked="checked">总运行时间休眠</label>
            <label><input class="septime" type="radio" name="share_radio_septime" id="share_radio_septime2">等间隔休眠</label>
            <br><button style="text-align:center" id="share_botton">立即分享</button><br>
            <label><input type="checkbox" id="create_word_dynamic_chp_switch">抽奖结束创建彩虹屁动态开关</label><button style="text-align:center" id="create_word_dynamic_chp_button">立即创建</button><br>
            防过滤彩虹屁内容：<input list="create_word_dynamic_chp"></input><datalist id="create_word_dynamic_chp" data-setting="create_word_dynamic_chp"></datalist><br>
            </p></div>
            `)//分享视频
            prevent_filter_module_div.insertBefore($('.side-toolbar'))
            let share_video_checked_box = prevent_filter_module_div.find('#share_video_check')
            if (lottery_setting.prevent_module.share_video_switch) { share_video_checked_box.attr('checked', '') }
            share_video_checked_box.change(function () {
                lottery_setting.prevent_module.share_video_switch = $(this).prop('checked')
                utl.SaveLotterySetting()
            })
            let share_count_range = prevent_filter_module_div.find('input[id=share_count_range]')
            if (lottery_setting.prevent_module.share_video_num < share_count_range[0].min) {//加上随机值
                for (let temp_share_video_num = lottery_setting.prevent_module.share_video_num + Math.floor((Math.random() - 0.5) * 2.1); temp_share_video_num >= share_count_range[0].min && temp_share_video_num <= share_count_range[0].max; temp_share_video_num = lottery_setting.prevent_module.share_video_num + Math.floor((Math.random() - 0.5) * 2.1)) {
                    lottery_setting.prevent_module.share_video_num = temp_share_video_num
                }
                utl.SaveLotterySetting()
                prevent_filter_module_div.find('span[id=share_count]').html(lottery_setting.prevent_module.share_video_num)
                share_count_range[0].value = lottery_setting.prevent_module.share_video_num
            } else {
                lottery_setting.prevent_module.share_video_num = lottery_setting.prevent_module.share_video_num + Math.floor((Math.random() - 0.5) * 2.1)
                utl.SaveLotterySetting()
                share_count_range[0].value = lottery_setting.prevent_module.share_video_num
                prevent_filter_module_div.find('span[id=share_count]').html(lottery_setting.prevent_module.share_video_num)
            }
            share_count_range.change(function () {
                lottery_setting.prevent_module.share_video_num = parseInt(share_count_range[0].value) + Math.floor((Math.random() - 0.5) * 2.1);
                utl.SaveLotterySetting();
                prevent_filter_module_div.find('span[id=share_count]').html(lottery_setting.prevent_module.share_video_num)
            })
            let share_radio_septime1 = prevent_filter_module_div.find('#share_radio_septime1')
            let share_radio_septime2 = prevent_filter_module_div.find('#share_radio_septime1')
            let share_video_botton = prevent_filter_module_div.find('#share_botton')
            share_video_botton.click(function () {
                if (!share_video_checked_box.prop('checked')) {
                    share_video_checked_box.click()
                }
                if ($('#share_radio_septime1'.checked)) {
                    lottery_setting.prevent_module.share_video_sleep_time = utl.generater_step_Array(parseInt(0.5 * 30 * 60e3 / lottery_setting.prevent_module.share_video_num, 10), parseInt(1.5 * 30 * 60e3 / lottery_setting.prevent_module.share_video_num, 10), 300)
                }
                else {
                    lottery_setting.prevent_module.share_video_sleep_time = utl.generater_step_Array(3 * 60e3, 5 * 60e3, 50)
                }
                utl.SaveLotterySetting()
                console.log(lottery_setting)
                console.log('开始分享视频')
                GM_setValue('share_falg', true)
                window.open('https://www.bilibili.com/')
            })

            let create_word_dynamic_chp_checkbox = prevent_filter_module_div.find('#create_word_dynamic_chp_switch')
            if (lottery_setting.prevent_module.create_word_dynamic_chp_switch) { create_word_dynamic_chp_checkbox.attr('checked', '') }
            create_word_dynamic_chp_checkbox.change(function () {
                lottery_setting.prevent_module.create_word_dynamic_chp_switch = $(this).prop('checked')
                utl.SaveLotterySetting()
            })
            let create_word_dynamic_chp_button = prevent_filter_module_div.find('#create_word_dynamic_chp_button')
            create_word_dynamic_chp_button.click(function () {
                if (!create_word_dynamic_chp_checkbox.prop('checked')) {
                    create_word_dynamic_chp_checkbox.click()
                }
                utl.SaveLotterySetting()
                console.log(lottery_setting)
                console.log('开始创建动态')
                my_operator.prevent_filter_module.create_word_dynamic(lottery_setting.prevent_module.create_word_dynamic_chp, 1)
            })
            editable_datalist(prevent_filter_module_div, `create_word_dynamic_chp`, lottery_setting.prevent_module.create_word_dynamic_chp)
        }
    }

    //整合常用本地工具
    var utl = {
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
        my_throw: function (err_msg, lottery_wait = false) {
            GM_setValue('lottery_wait', lottery_wait)
            GM_setValue('lottery_reply_record', my_operator.log_record.construct_comment_record_data(err_msg))
            window.close()
            throw (err_msg)
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
                utl.my_throw('模拟点击失败')
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
        SaveLotterySetting: function () {
            try {
                GM_setValue('lottery_setting', lottery_setting)
            }
            catch (e) {
                console.error(e)
                alert('设置保存出错')
                return false
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

    }
    //模仿的一些操作
    var my_operator = {
        basic_operator: {
            check_reply: async function (response_json) {
                try {
                    let api = "https://api.bilibili.com/x/v2/reply/jump";
                    let type = response_json.data.reply.type;
                    let oid = global_var.global_dynamic_data.item.basic.comment_id_str
                    let rpid = response_json.data.reply.rpid;
                    let url = `${api}?type=${type}&oid=${oid}&rpid=${rpid}`;
                    console.log(response_json)
                    console.log(url)
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
                utl.simulate(document.getElementsByClassName('bili-dyn-action like')[0], 'click')
                await sleep(utl.random_choice(lottery_setting.Working_clearance_time))
                if (document.getElementsByClassName('bili-dyn-action like active')[0] != undefined) {
                    console.log('动态点赞成功')
                    await sleep(utl.random_choice(lottery_setting.Working_clearance_time))
                }
                else {
                    console.log('动态点赞失败')
                    GM_setValue('fengkong_flag', true)
                    utl.my_throw('动态点赞失败')
                    return
                }
            },
            dynamic_repost: async function () {//点击转发
                try {
                    utl.simulate(document.getElementsByClassName('bili-dyn-forward-publishing__action__btn')[0], 'click')
                    await sleep(utl.random_choice(lottery_setting.Working_clearance_time))
                    if (global_var.create_dyn_response.code != 0) {
                        console.log(global_var.create_dyn_response)
                        GM_setValue('fengkong_flag', true)//可能触发风控，停一个小时
                        utl.my_throw('动态转发失败')
                        return
                    }
                    else {
                        console.log('动态转发成功');
                    }
                }
                catch (e) {
                    console.log(global_var.create_dyn_response)
                    utl.my_throw(`动态转发失败`)
                    return
                }
            },
            comment_submit: async function (comment_msg) {//点击回复
                if (typeof comment_msg != 'string' || !comment_msg || comment_msg.includes('undefined') || comment_msg.includes('null') || comment_msg.includes('true') || comment_msg.includes('false')) {//检查是否传入的是string类型参数 或者是否为空
                    utl.my_throw('动态评论内容出错')
                    return
                }
                let bt = 0
                let msg_box
                while (1) {
                    msg_box = document.getElementsByName('msg')[0]
                    if (msg_box) {
                        break
                    }
                    if (bt >= 5) {
                        utl.my_throw('动态评论元素框获取失败')
                    }
                    await sleep(1e3)
                    bt += 1
                }
                msg_box.textContent = comment_msg
                await sleep(utl.random_choice(lottery_setting.Working_clearance_time))
                utl.simulate(document.getElementsByClassName('comment-submit')[0], 'click')
                await sleep(utl.random_choice(lottery_setting.Working_clearance_time))
                if (global_var.comment_dyn_response.code != 0) {
                    console.log('动态评论失败')
                    GM_setValue('fengkong_flag', true)//可能触发风控，停一个小时
                    utl.my_throw('动态评论失败')
                }
                await sleep(1e3)
                let comment_flag = await my_operator.basic_operator.check_reply(global_var.comment_dyn_response)
                if (comment_flag === true) {
                    console.log('评论显示正常')
                }
                else {
                    utl.my_throw('评论被阿瓦隆吞掉了')
                }
                //评论点赞部分
                if (Math.random() < lottery_setting.comment_thumb_chance) {
                    await my_operator.basic_operator.comment_thumb()
                    await sleep(utl.random_choice(lottery_setting.Working_clearance_time))
                }


            },
            comment_thumb: async function () {
                try {
                    let comment_user = document.getElementsByClassName('user')
                    let comment_con
                    let j
                    let my_comment_con
                    for (let i = 0; i < comment_user.length; i++) {
                        if (comment_user[i].children[0].text == global_var.user_nav.data.uname) {
                            comment_con = comment_user[i].parentElement.children
                            for (j = 0; j < comment_con.length; j++) {
                                if (comment_con[j].className == 'info') {
                                    utl.simulate(comment_con[j].getElementsByClassName('like')[0].getElementsByTagName('i')[0], 'click')
                                    my_comment_con = comment_con[j]
                                    break
                                }
                            }
                            break
                        }
                    }
                    await sleep(1500)
                    if (!my_comment_con.getElementsByClassName('like')[0].getElementsByTagName('span')[0].textContent) {
                        console.log('评论点赞失败')
                        utl.my_throw('评论点赞失败')
                        return
                    }
                    else {
                        console.log('评论点赞成功')
                    }
                }
                catch (e) {
                    console.log(e)
                    console.log('评论点赞失败')
                    utl.my_throw('评论点赞失败')
                    return
                }

            }
        },
        fast_repost: async function () {//直接转发
            try {//直接点转发
                await my_operator.basic_operator.dynamic_repost()
                //最后点赞
                await my_operator.basic_operator.dynamic_thumb()
            }
            catch {
                try {
                    await sleep(utl.random_choice(lottery_setting.Working_clearance_time))
                    utl.simulate(document.getElementsByClassName('bili-dyn-action forward')[0], 'click')//前往转发子页面
                    await sleep(utl.random_choice(lottery_setting.Working_clearance_time))
                    await my_operator.basic_operator.dynamic_repost()
                    //最后点赞
                    await my_operator.basic_operator.dynamic_thumb()
                }
                catch {
                    console.log(global_var.global_dynamic_data)
                    utl.my_throw(`转发失败`)
                    return
                }
            }
        },
        comment_repost_dynamic_with_content: async function (comment_msg) {//转评带上回复内容
            try {
                utl.simulate(document.getElementsByClassName('dynamic-repost-checkbox')[0], 'click')//勾选同时转发到我的动态
                await sleep(utl.random_choice(lottery_setting.Working_clearance_time))
                if (document.getElementsByClassName('dynamic-repost-checkbox')[0].checked) {
                    await sleep(utl.random_choice(lottery_setting.Working_clearance_time))
                }
                else {
                    console.log('勾选同时转发到我的动态失败')
                    utl.my_throw('勾选同时转发到我的动态失败')
                    return
                }
                if (comment_msg != null && comment_msg != undefined) {
                    await my_operator.basic_operator.comment_submit(comment_msg)
                }
                else {
                    console.log('评论获取失败')
                    utl.my_throw('评论获取失败')
                    return
                }
                await my_operator.basic_operator.dynamic_thumb()
            }
            catch (e) {
                console.log(global_var.global_dynamic_data)
                utl.my_throw(`转发失败`)
                return
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
                    utl.my_throw('评论获取失败')
                    return
                }
                //再转发
                await sleep(utl.random_choice(lottery_setting.Working_clearance_time))
                utl.simulate(document.getElementsByClassName('bili-dyn-action forward')[0], 'click')//前往转发子页面
                await sleep(utl.random_choice(lottery_setting.Working_clearance_time))
                await my_operator.basic_operator.dynamic_repost()
                //最后点赞
                await my_operator.basic_operator.dynamic_thumb()
            }
            catch (e) {
                console.log(global_var.global_dynamic_data)
                utl.my_throw(`评论转发失败`)
                return
            }
        },
        only_comment: async function (comment_msg) {//只评论
            try {
                console.log(`回复内容： ${comment_msg}`)
                if (comment_msg != null && comment_msg != undefined) {
                    await my_operator.basic_operator.comment_submit(comment_msg)
                }
                else {
                    console.log('评论获取失败')
                    return
                }
                await my_operator.basic_operator.dynamic_thumb()
            }
            catch (e) {
                console.log(global_var.global_dynamic_data)
                utl.my_throw(`评论获取失败`)
                return
            }
        },
        dynamic_content_operator: {//获取动态信息相关操作
            get_dynamic_content_and_top_msg: function (dynamic_data) {//获取动态内容和up置顶的回复
                function get_top_msg() {
                    if (global_var.reply_main != undefined) {
                        try {
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
                            //utl.my_throw('up置顶的回复获取失败')
                            return
                        }
                    }
                    else {
                        console.log('未拦截到评论API内容')
                        //utl.my_throw('获取置顶评论失败')
                        return
                    }
                }
                let top_msg = ''
                if (global_var.reply_main != undefined) {
                    top_msg = get_top_msg()
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
                return dynmaic_content + top_msg
            },
        },
        dynamic_comment_operator: {//回复内容相关操作
            pre_msg_processing: function (dynamic_content) {
                let premsg = ''//判断是否需要@或者带话题
                let msg = undefined
                dynamic_content = dynamic_content.replace(/＠/gmi, '@')
                dynamic_content = dynamic_content.replace(/@([^ ]{0,15}) /gmi, '')
                dynamic_content = dynamic_content.replace('转发话题', '带话题')
                dynamic_content = dynamic_content.replace('名', '位')
                let topobj_6 = /.*@.{0,3}位.*/gmi.exec(dynamic_content)
                let topobj_5 = /.*@.{0,3}1位.*/gmi.exec(dynamic_content)
                let topobj_4 = /.*@.{0,3}一位.*/img.exec(dynamic_content)
                let topobj_3 = /.*@.{0,3}一位好友.*|.*@.{0,3}你的/img.exec(dynamic_content)
                let topobj_2 = /.*艾特1位好友.*/img.exec(dynamic_content)
                let topobj_1 = /.*@你想祝福的人.*/img.exec(dynamic_content)
                let topobj0 = /.*@1位胖友.*/img.exec(dynamic_content)
                let topobj1 = /.*圈1位你的伙伴.*/img.exec(dynamic_content)
                let topobj2 = /.*带tag#.{0,20}#.*/img.exec(dynamic_content)
                let topobj3 = /.*带话题.{0,15}#.{0,20}#((?!投稿).)*$/img.exec(dynamic_content)
                let topobj4 = /.*带上tag#.{0,20}#((?!投稿).)*$/img.exec(dynamic_content)
                let topobj5 = /.*带#.{0,20}#.{0,10}话题((?!投稿).)*$/img.exec(dynamic_content)
                let topobj6 = /.*艾特好友.*/img.exec(dynamic_content)
                let topobj7 = /.*@一名好友.*/img.exec(dynamic_content)
                let topobj8 = /.*@你的一个小伙伴.*/img.exec(dynamic_content)
                let topobj9 = /.*@两位好友.*/img.exec(dynamic_content)
                let topobj10 = /.*带#.{0,20}#((?!投稿).)*$/img.exec(dynamic_content)
                let topobj11 = /.*@.{0,5}你的一个好友.*/img.exec(dynamic_content)
                let topobj12 = /.*带[^来|^】|^看懂]{0,5}#.{0,20}#((?!投稿).)*$/gmi.exec(dynamic_content)
                let topobj13 = /.*加话题#.{0,20}#((?!投稿).)*$/img.exec(dynamic_content)
                let topobj14 = /.*带标签#.{0,20}#((?!投稿).)*$/img.exec(dynamic_content)
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
                    msg = /.*带话题.*?#(.{0,20})#.*/img.exec(dynamic_content).slice(1)
                    for (let _ = 0; _ < msg.length; _++) {
                        if (msg[_] != null && msg[_] != undefined) { premsg += '#' + msg[_] + '#' }
                    }
                }
                else if (topobj4 != null) {
                    msg = /.*带上tag#(.{0,20})#.*/img.exec(dynamic_content).slice(1)
                    for (let _ = 0; _ < msg.length; _++) {
                        if (msg[_] != null && msg[_] != undefined) { premsg += '#' + msg[_] + '#' }
                    }
                }
                else if (topobj5 != null) {
                    msg = /.*带#(.{0,20})#.{0,10}话题.*/img.exec(dynamic_content).slice(1)
                    for (let _ = 0; _ < msg.length; _++) {
                        if (msg[_] != null && msg[_] != undefined) { premsg += '#' + msg[_] + '#' }
                    }
                }
                else if (topobj10 != null) {
                    msg = /.*带#(.{0,20})#.*/img.exec(dynamic_content).slice(1)
                    for (let _ = 0; _ < msg.length; _++) {
                        if (msg[_] != null && msg[_] != undefined) { premsg += '#' + msg[_] + '#' }
                    }
                }
                else if (topobj12 != null) {
                    msg = /.*带.{0,5}#(.{0,20})#.*/img.exec(dynamic_content).slice(1)
                    for (let _ = 0; _ < msg.length; _++) {
                        if (msg[_] != null && msg[_] != undefined) { premsg += '#' + msg[_] + '#' }
                    }
                }
                else if (topobj13 != null) {
                    msg = /.*加话题#(.{0,20})#.*/img.exec(dynamic_content).slice(1)
                    for (let _ = 0; _ < msg.length; _++) {
                        if (msg[_] != null && msg[_] != undefined) { premsg += '#' + msg[_] + '#' }
                    }
                }
                else if (topobj14 != null) {
                    msg = /.*带标签#(.{0,20})#.*/img.exec(dynamic_content).slice(1)
                    for (let _ = 0; _ < msg.length; _++) {
                        if (msg[_] != null && msg[_] != undefined) { premsg += '#' + msg[_] + '#' }
                    }
                }
                if (premsg.indexOf('#') > -1) {
                    let tpremsg = ''
                    for (let _ = 0; _ < premsg.split('#').length; _++) {
                        if (premsg.split('#')[_] != '' && premsg.split('#')[_] != ' ' && premsg.split('#')[_] != '  ' && premsg.split('#')[_] != '和') {
                            tpremsg += '#' + premsg.split('#')[_] + '#'
                        }
                    }
                    premsg = tpremsg
                }
                if (/.*带话题/gmi.test(dynamic_content) || topobj2 || topobj3 || topobj4 || topobj5 || topobj10 || topobj12 || topobj13 || topobj14) {
                    if (!premsg.includes('#')) {
                        utl.my_throw('话题获取失败')
                    }
                }
                return premsg
            },
            manual_reply_judge: function (dynamic_content) {//判断是否需要人工回复 返回true需要人工判断  返回null不需要人工判断
                dynamic_content = dynamic_content.replace(/＠/gmi, '@')
                dynamic_content = dynamic_content.replace(/好友/gmi, '朋友')
                dynamic_content = dynamic_content.replace(/伙伴/gmi, '朋友')
                let manual_re1 = /.*评论.*告诉|.*有关的评论|.*告诉.*留言/gmi.test(dynamic_content)
                let manual_re2 = /.*评论.{0,20}理由/gmi.test(dynamic_content)
                let manual_re3 = /.*评论.{0,10}对/gmi.test(dynamic_content)
                let manual_re4 = /.*三连|.*猜赢|.*猜对|.*答对/gmi.test(dynamic_content)
                let manual_re5 = /.*说.{0,10}说/gmi.test(dynamic_content)
                let manual_re6 = /.*@.{0,15}朋友|.*艾特|.*@.{0,3}你的/gmi.test(dynamic_content)
                let manual_re7 = /.*万粉福利/gmi.test(dynamic_content)
                let manual_re8 = /.*新衣回/gmi.test(dynamic_content)
                let manual_re9 = /.*评论.{0,10}留言|.*关注.{0,10}留言|.*留言.{0,10}建议|.*评论.{0,10}答|.*一句话证明|.*留言.{0,10}得分|.*有趣.{0,3}留言|.*有趣.{0,3}评论/gmi.test(dynamic_content)
                let manual_re10 = /.*恭喜/gmi.test(dynamic_content)
                let manual_re11 = /.*评论.{0,10}祝福|.*评论.{0,10}意见|.*意见.{0,10}评论/gmi.test(dynamic_content)
                let manual_re12 = /.*评论.{0,10}讨论|.*话题.{0,10}讨论/gmi.test(dynamic_content)
                let manual_re13 = /.*@.{0,15}朋友|.*@{0,15}赞助商/gmi.test(dynamic_content)
                let manual_re14 = /.*评论.{0,10}说出/gmi.test(dynamic_content)
                let manual_re15 = /.*评论.{0,10}分享|.*评论.{0,10}互动|.*评论.{0,10}提问/gmi.test(dynamic_content)
                let manual_re16 = /.*评论.{0,10}聊.{0,10}聊/gmi.test(dynamic_content)
                let manual_re17 = /.*评论区评论.{0,10}#/gmi.test(dynamic_content)
                let manual_re18 = /.*聊.{0,10}聊/gmi.test(dynamic_content)
                let manual_re19 = /.*评论.{0,10}扣|.*评论.{0,5}说.{0,3}下/gmi.test(dynamic_content)
                let manual_re20 = /.*转发.{0,10}分享/gmi.test(dynamic_content)
                let manual_re21 = /.*评论.{0,10}告诉/gmi.test(dynamic_content)
                let manual_re22 = /.*评论.{0,10}唠.{0,10}唠/gmi.test(dynamic_content)
                let manual_re23 = /.*今日.{0,5}话题|.*参与.{0,5}话题|.*参与.{0,5}答题/gmi.test(dynamic_content)
                let manual_re24 = /.*说.*答案|.*评论.{0,15}答案/gmi.test(dynamic_content)
                let manual_re25 = /.*说出/gmi.test(dynamic_content)
                let manual_re26 = /.*为.{0,10}加油/gmi.test(dynamic_content)
                let manual_re27 = /.*评论.{0,10}话|.*你中意的/gmi.test(dynamic_content)
                let manual_re28 = /.*评论.{0,10}最想做的事|.*评论.{0,3}最喜欢/gmi.test(dynamic_content)
                let manual_re29 = /.*分享.{0,20}经历|.*经历.{0,20}分享/gmi.test(dynamic_content)
                let manual_re30 = /.*分享.{0,20}心情/gmi.test(dynamic_content)
                let manual_re31 = /.*评论.{0,10}句/gmi.test(dynamic_content)
                let manual_re32 = /.*转关评下方视频/gmi.test(dynamic_content)
                let manual_re33 = /.*分享.{0,10}美好/gmi.test(dynamic_content)
                let manual_re34 = /.*视频.{0,10}弹幕/gmi.test(dynamic_content)
                let manual_re35 = /.*生日快乐/gmi.test(dynamic_content)
                let manual_re36 = /.*正确回答|.*一句话形容/gmi.test(dynamic_content)
                let manual_re37 = /.*谈.{0,10}谈/gmi.test(dynamic_content)
                let manual_re38 = /.*分享.{0,10}喜爱/gmi.test(dynamic_content)
                let manual_re39 = /.*分享.{0,10}最|.*评论.{0,10}最/gmi.test(dynamic_content)
                let manual_re40 = /.*带话题.{0,15}晒|.*带话题.{0,15}讨论/gmi.test(dynamic_content)
                let manual_re41 = /.*分享.{0,15}事/gmi.test(dynamic_content)
                let manual_re42 = /.*送出.{0,15}祝福/gmi.test(dynamic_content)
                let manual_re43 = /.*评论.{0,30}原因/gmi.test(dynamic_content)
                let manual_re44 = /.*复制/gmi.test(dynamic_content)
                let manual_re45 = /.*长按/gmi.test(dynamic_content)
                let manual_re46 = /.*怎么|.*给.{0,10}推荐/gmi.test(dynamic_content)
                let manual_re47 = /.*答案.{0,10}参与/gmi.test(dynamic_content)
                let manual_re48 = /.*唠.{0,5}唠/gmi.test(dynamic_content)
                let manual_re49 = /.*分享一下/gmi.test(dynamic_content)
                let manual_re50 = /.*评论.{0,30}故事/gmi.test(dynamic_content)
                let manual_re51 = /.*告诉.{0,30}什么/gmi.test(dynamic_content)
                let manual_re53 = /.*发布.{0,20}图.{0,5}动态/gmi.test(dynamic_content)
                let manual_re54 = /.*视频.{0,20}评论/gmi.test(dynamic_content)
                let manual_re55 = /.*复zhi/gmi.test(dynamic_content)
                let manual_re56 = /.*多少.{0,10}合适/gmi.test(dynamic_content)
                let manual_re57 = /.*喜欢.{0,5}哪/gmi.test(dynamic_content)
                let manual_re58 = /.*多少.{0,15}？|.*多少.{0,15}\?/gmi.test(dynamic_content)
                let manual_re59 = /.*哪.{0,15}？|.*哪.{0,15}？|.*那些.{0,15}？|.*那些.{0,15}？/gmi.test(dynamic_content)
                let manual_re60 = /.*送.{0,10}祝福/gmi.test(dynamic_content)
                let manual_re61 = /.*看.{0,10}猜/gmi.test(dynamic_content)
                let manual_re62 = /.*评论.{0,10}#.*什么/gmi.test(dynamic_content)
                let manual_re63 = /.*评论.{0,10}猜|.*评论.{0,15}预测/gmi.test(dynamic_content)
                let manual_re64 = /.*分享.{0,10}的/gmi.test(dynamic_content)
                let manual_re65 = /.*老规矩你们懂的/gmi.test(dynamic_content)
                let manual_re66 = /.*评.{0,10}选/gmi.test(dynamic_content)
                let manual_re67 = /.*评.{0,5}“|.*评.{0,5}【|.*评.{0,5}:|.*评.{0,5}：|.*评.{0,5}「/gmi.test(dynamic_content)
                let manual_re68 = /.*将.{0,10}内容.{0,10}评/gmi.test(dynamic_content)
                let manual_re70 = /.*会不会.{0,20}？|.*会不会.{0,20}\?/gmi.test(dynamic_content)
                let manual_re71 = /.*猜.{0,10}猜|.*猜.{0,10}比分/gmi.test(dynamic_content)
                let manual_re72 = /.*生日/gmi.test(dynamic_content)
                let manual_re73 = /.*知道.{0,15}什么.{0,15}？|.*知道.{0,15}什么.{0,15}\?|.*用什么/gmi.test(dynamic_content)
                let manual_re74 = /.*领.{0,10}红包.{0,5}大小|.*领.{0,10}多少.{0,10}红包|.*红包金额/gmi.test(dynamic_content)
                let manual_re75 = /.*互动话题|.*互动留言/gmi.test(dynamic_content)
                return manual_re1 || manual_re2 || manual_re3 || manual_re4 || manual_re5 || manual_re6 || manual_re7 || manual_re8 || manual_re9 || manual_re10 ||
                    manual_re11 || manual_re12 || manual_re13 || manual_re14 || manual_re15 || manual_re16 || manual_re17 || manual_re18 || manual_re19 || manual_re20 || manual_re21 || manual_re22 || manual_re23 || manual_re24 || manual_re25 ||
                    manual_re26 || manual_re27 || manual_re28 || manual_re29 || manual_re30 ||
                    manual_re31 || manual_re32 || manual_re33 || manual_re34 || manual_re35 ||
                    manual_re36 || manual_re37 || manual_re38 || manual_re39 || manual_re40 ||
                    manual_re41 || manual_re42 || manual_re43 || manual_re44 || manual_re44 || manual_re45 || manual_re46 ||
                    manual_re47 || manual_re48 || manual_re49 || manual_re50 || manual_re51 ||
                    manual_re53 || manual_re54 || manual_re58 || manual_re59 || manual_re55 || manual_re56 ||
                    manual_re57 || manual_re60 || manual_re61 || manual_re62 || manual_re63 || manual_re64 ||
                    manual_re65 || manual_re66 || manual_re67 || manual_re68 || manual_re70 || manual_re71 || manual_re72 || manual_re73 ||
                    manual_re74 || manual_re75

            },
            key_word_reply: function (dynamic_content) {
                if (/.*领到多少红包|.*领.{0,3}到.{0,3}红包大小|.*评论.{0,10}红包金额|留言.{0,10}红包金额/.test(dynamic_content)) {
                    return lottery_setting.key_word_comment.red_pocket
                }
                if (/.*喜欢.{0,5}零食/.test(dynamic_content)) {
                    if (lottery_setting.key_word_comment.favorite_food) {
                        return utl.random_choice(['', '最爱', '喜欢', '想吃', '', '']) + lottery_setting.key_word_comment.favorite_food
                    }
                    else {
                        return utl.random_choice(['', '最爱', '喜欢', '想吃', '', '']) + utl.random_choice(['薯片', '巧克力', '辣条', '冰淇淋', '肉松饼', '魔芋爽', '小酥肉', '烤冷面', '鸡柳', '曲奇饼干', '芒果干', '猪肉脯'])
                    }
                }
                if (/.*喜欢.{0,5}颜色|.*最爱.{0,5}颜色/.test(dynamic_content)) {
                    if (lottery_setting.key_word_comment.favorite_color) {
                        return utl.random_choice(['', '喜欢', '', '']) + lottery_setting.key_word_comment.favorite_color
                    }
                    else {
                        return utl.random_choice(['', '喜欢', '', '']) + utl.random_choice(['白色', '黑色', '红色'])
                    }

                }
                return undefined
            },
            reply_comment_generator: function (dynamic_content) {
                let comment_msg
                if (my_operator.dynamic_comment_operator.manual_reply_judge(dynamic_content)) {
                    let key_reply = my_operator.dynamic_comment_operator.key_word_reply(dynamic_content)
                    if (!key_reply) {
                        console.log('需要人工回复的动态')
                        comment_msg = '人工回复'
                        GM_setValue('lottery_reply_record', my_operator.log_record.construct_comment_record_data(comment_msg))
                        utl.my_throw('需要人工回复的动态')
                    }
                    else {
                        console.log('触发关键词回复')
                        comment_msg = key_reply
                    }
                }
                let pre_msg = ''
                pre_msg = my_operator.dynamic_comment_operator.pre_msg_processing(dynamic_content)
                let official_type = global_var.global_dynamic_data.item.modules.module_author.official_verify.type
                if (!comment_msg) {
                    comment_msg = utl.random_choice(lottery_setting.defined_reply_msg)
                    if (official_type == 1) {
                        comment_msg = utl.random_choice(lottery_setting.replycontent)
                    }
                    else {
                        comment_msg = utl.random_choice(lottery_setting.non_official_chp)
                    }
                }
                if (!comment_msg || typeof comment_msg != 'string') {
                    comment_msg = '回复内容出错'
                    GM_setValue('lottery_reply_record', my_operator.log_record.construct_comment_record_data(comment_msg))
                    utl.my_throw('回复内容出错')
                }


                return pre_msg + comment_msg
            }
        },
        log_record: {
            construct_comment_record_data: function (comment_msg) {
                try { var rpid = global_var.comment_dyn_response.data.reply.rpid_str }
                catch { rpid = undefined }
                try {
                    let d = new Date()
                    var ctime = d.toLocaleString(global_var.comment_dyn_response.data.reply.ctime)

                }
                catch {
                    let d = new Date()
                    ctime = d.toLocaleString()
                }
                try {
                    var author_name = global_var.global_dynamic_data.item.modules.module_author.name
                }
                catch {
                    author_name = undefined
                }
                try {
                    var author_mid = global_var.global_dynamic_data.item.modules.module_author.mid
                    var author_homepage = `https://space.bilibili.com/${author_mid}/dynamic`
                }
                catch {
                    author_homepage = undefined
                }
                try {
                    var dynamic_content = JSON.stringify(my_operator.dynamic_content_operator.get_dynamic_content_and_top_msg(global_var.global_dynamic_data)).replace(/,/g, '，')
                }
                catch {
                    dynamic_content = undefined
                }
                let lottery_reply_record = `${window.location.protocol}//${window.location.host}${window.location.pathname}#${rpid} ,${String(comment_msg)},${ctime},${author_name},${dynamic_content},${author_homepage}`
                return lottery_reply_record
            }
        },
        judge_lottery_time: {
            judge_official_lottery: async function () {//官方抽奖判断 没过期返回false 过期了返回true
                if (document.getElementsByClassName('bili-rich-text-module lottery')[0] && JSON.stringify(global_var.global_dynamic_data.item.modules.module_dynamic.desc).includes('RICH_TEXT_NODE_TYPE_LOTTERY')) {//选取互动抽奖蓝标
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
                            utl.my_throw('过期的官方抽奖')
                            return true
                        }
                    }
                    catch {
                        utl.my_throw('官抽信息获取失败或者过期')
                    }
                }
                else {
                    return undefined
                }
            }
        },
        prevent_filter_module: {
            prevent_filter_init: async function () {
                await this.share_video(lottery_setting.prevent_module.share_video_num)
            },
            share_video: async function (share_num) {
                async function get_video_list(__share_num) {
                    let share_video_list = []
                    let bt = false
                    while (1) {
                        if (share_video_list.length > __share_num * 5 || bt) {
                            break
                        }
                        if (document.getElementsByClassName('recommended-card')) {
                            for (let _i = 0; _i < document.getElementsByClassName('recommended-card').length; _i++) {
                                if (!document.getElementsByClassName('recommended-card')[_i].getElementsByTagName('a')[0].href.includes('www.bilibili.com/video/BV')) { continue }//不包含视频的跳过
                                if (share_video_list.includes(document.getElementsByClassName('recommended-card')[_i])) { }
                                else {
                                    share_video_list.push(document.getElementsByClassName('recommended-card')[_i])
                                    console.log(document.getElementsByClassName('recommended-card')[_i].getElementsByTagName('a')[0].href)
                                }
                            }
                        }
                        if (document.getElementsByClassName('feed-card')) {
                            for (let _i = 0; _i < document.getElementsByClassName('feed-card').length; _i++) {
                                if (!document.getElementsByClassName('feed-card')[_i].getElementsByTagName('a')[0].href.includes('www.bilibili.com/video/BV')) { continue }//不包含视频的跳过
                                if (share_video_list.includes(document.getElementsByClassName('feed-card')[_i])) { }
                                else {
                                    share_video_list.push(document.getElementsByClassName('feed-card')[_i])
                                    console.log(document.getElementsByClassName('feed-card')[_i].getElementsByTagName('a')[0].href)
                                }
                            }
                        }

                        await sleep(1e3)
                        utl.simulate(document.getElementsByClassName('primary-btn')[0], 'click')
                        await sleep(1e3)
                        if (share_video_list.length == 0) {
                            bt += true
                        }

                    }
                    return share_video_list
                }
                async function share_video_operator() {
                    console.log('开始点击分享')
                    await sleep(10e3)
                    utl.simulate(document.getElementsByClassName('share-btn')[0], 'click')
                    await sleep(3e3)
                    utl.simulate(document.getElementsByName('dynmic-share')[0].contentDocument.getElementsByClassName('share-btn')[0], 'click')
                    await sleep(1e3)
                    window.close()
                }


                let pageurl = location.href
                if (pageurl == 'https://www.bilibili.com/' && lottery_setting.prevent_module.share_video_switch && GM_getValue('share_falg')) {
                    let video_list = await get_video_list(share_num)
                    let share_video_list = []
                    video_list = utl.part_shuffle(video_list.length, video_list)
                    video_list.some((rcm_video) => {
                        if (share_video_list.length < share_num) {
                            if (!share_video_list.includes(rcm_video)) {
                                share_video_list.push(rcm_video)
                            }
                        }
                        else {
                            return
                        }
                    })
                    console.log('开始分享视频', share_video_list)
                    window.onbeforeunload = function (e) {//退出的时候取消转发视频
                        GM_setValue('share_falg', false)
                        utl.SaveLotterySetting()
                        return undefined;
                    };
                    for (let video_elem of share_video_list) {
                        utl.const_object_remake(GM_getValue('lottery_setting'), lottery_setting)
                        lottery_setting.prevent_module.share_video_url = video_elem.getElementsByTagName('a')[0].href
                        console.log('分享视频：', lottery_setting.prevent_module.share_video_url)
                        utl.SaveLotterySetting()
                        utl.simulate(video_elem.getElementsByTagName('a')[0], 'click')
                        await sleep(utl.random_choice(lottery_setting.prevent_module.share_video_sleep_time))
                    }
                    utl.SaveLotterySetting()
                    if (lottery_setting.prevent_module.create_word_dynamic_chp_switch) {

                        await this.create_word_dynamic(lottery_setting.prevent_module.create_word_dynamic_chp, 1)
                    }
                    GM_setValue('share_falg', false)
                    window.close()
                }
                else if (pageurl.includes(lottery_setting.prevent_module.share_video_url) && lottery_setting.prevent_module.share_video_switch && GM_getValue('share_falg')) {
                    await share_video_operator()
                }
            },
            create_word_dynamic: async function (content_list, create_times) {
                console.log('分享彩虹屁')
                let content
                if (!create_times) { create_times = 1 }
                for (let i = 0; i < create_times; i++) {
                    content = utl.random_choice(content_list)
                    if (typeof content != 'string' || !content || content.includes('undefined') || content.includes('null') || content.includes('true') || content.includes('false')) {//检查是否传入的是string类型参数 或者是否为空
                        continue
                    }
                    BAPI.dynamic_create(content).then((data) => {
                        if (data.code == 0) {
                            console.log(`【自动发动态】成功发送一条动态：${content}`, 'success');
                        } else {
                            console.log(`【自动发动态】发送动态失败：${data}`)
                        }
                    })
                    await sleep(utl.random_choice(lottery_setting.prevent_module.share_video_sleep_time))
                }
            }
        }


    }
    var global_var = {//全局变量
        global_dynamic_data: undefined,//全局的动态数据
        create_dyn_response: undefined,//创建或转发动态的响应
        comment_dyn_response: undefined,//自己评论动态的响应
        reply_main: undefined,//评论区响应
        user_nav: undefined
    }
    const lottery_setting = {
        CONFIG: {//默认的设置
            AUTO_DailyReward: true,
            CLEAR_TS: 0,
            JSMARK: 0
        },
        prevent_module: {
            share_video_num: undefined,//分享视频数
            share_video_sleep_time: undefined,//分享视频休眠时长
            share_video_url: undefined,//分析视频连接
            share_video_switch: true,//分享视频开关
            create_word_dynamic_chp: [`日子很狗，但我不敢骂它，我怕它疯狂咬我`
                , `百因必有果，下个富婆就是我`
                , `心里藏着小星星，生活才能亮晶晶。`
                , `公主殿下的任务呢，就是天天开心`
                , `我是一个保安，爱吃小熊饼干，工资只够早餐，上班为了下班，整天郁郁寡欢，爱情与我无关，一个看大门的憨憨`
                , `最讨厌苦的东西了，但你是甜的所以我吃定你啦`
                , `是直接爱我还是走个流程`
                , `天冷了要照顾好自己，衣服要穿厚厚的，看起来胖胖的，让别人怕怕的`
                , `气温都下降了，我的体重什么时候下降呢`
                , `生活不易 猪猪叹气，叹气泄气，还得打气`
                , `跟男朋友分手了，他气得夺门而出，我追了他八条街，才把门抢了回来`
                , `我有一颗早起的心，可被子和床不同意`
                , `大家好，我是玉米，要是你惹我 我就是爆米花`
                , `我要睡觉了，昨晚梦见的泡面还有半桶没有吃完`
                , `我把自己吃的那么圆就是为了不让别人看扁`
                , `每个男孩子都应该有个女朋友，如果你没有 那我就是你女朋友`
                , `低头看看自己的肉，真是甩也甩不掉的温柔`
                , `你不是个合格的朋友，还是做我老公吧`
                , `多年前你一句保重，我至今没瘦`
                , `以后有话直说，不要老是在吗在吗，不出意外的话几十年内我都是在的`
            ],//创建彩虹屁文字动态
            create_word_dynamic_chp_switch: false,
        },
        key_word_comment: {
        },
        do_lottery_flag: function (do_flag) {
            GM_setValue('do_lottery_flag', do_flag)
        },
    }
    const lottery_setting_default = {//抽奖参数的设置
        CONFIG: {
            AUTO_DailyReward: true,
            CLEAR_TS: 0,
            JSMARK: 0
        },
        prevent_module: {
            share_video_num: undefined,//分享视频数
            share_video_sleep_time: undefined,//分享视频休眠时长
            share_video_url: undefined,//分析视频连接
            share_video_switch: true,//分享视频开关
            create_word_dynamic_chp: [`日子很狗，但我不敢骂它，我怕它疯狂咬我`
                , `百因必有果，下个富婆就是我`
                , `心里藏着小星星，生活才能亮晶晶。`
                , `公主殿下的任务呢，就是天天开心`
                , `我是一个保安，爱吃小熊饼干，工资只够早餐，上班为了下班，整天郁郁寡欢，爱情与我无关，一个看大门的憨憨`
                , `最讨厌苦的东西了，但你是甜的所以我吃定你啦`
                , `是直接爱我还是走个流程`
                , `天冷了要照顾好自己，衣服要穿厚厚的，看起来胖胖的，让别人怕怕的`
                , `气温都下降了，我的体重什么时候下降呢`
                , `生活不易 猪猪叹气，叹气泄气，还得打气`
                , `跟男朋友分手了，他气得夺门而出，我追了他八条街，才把门抢了回来`
                , `我有一颗早起的心，可被子和床不同意`
                , `大家好，我是玉米，要是你惹我 我就是爆米花`
                , `我要睡觉了，昨晚梦见的泡面还有半桶没有吃完`
                , `我把自己吃的那么圆就是为了不让别人看扁`
                , `每个男孩子都应该有个女朋友，如果你没有 那我就是你女朋友`
                , `低头看看自己的肉，真是甩也甩不掉的温柔`
                , `你不是个合格的朋友，还是做我老公吧`
                , `多年前你一句保重，我至今没瘦`
                , `以后有话直说，不要老是在吗在吗，不出意外的话几十年内我都是在的`
            ],//创建彩虹屁文字动态
            create_word_dynamic_chp_switch: false,
        },
        do_lottery_flag: function (do_flag) {
            GM_setValue('do_lottery_flag', do_flag)
        },

        official_lottery_switch: undefined,
        user_name: undefined,
        user_mid: undefined,
        Working_clearance_time: utl.generater_step_Array(1500, 5e3, 50),
        lottery_run_time: 3600e3,
        lottery_sep_time: [10e3, 15e3, 20e3],//后续会重新赋值，阶段式运行时间
        at_member: ['_大锦鲤_ ', '中 ', '哔哩哔哩大会员 ', '哔哩哔哩会员购 ', '哔哩哔哩弹幕网 ', '哔哩哔哩大会员 ', '哔哩哔哩国创  ', '哔哩哔哩番剧 ', '哔哩哔哩晚会 '],//评论时需要@的对象
        replycontent: [
            '抽奖三原则:①从不缺席②从不中奖③从不放弃[2233电子喵_从不中奖]',
            '[2233电子喵_吹爆老婆]',
            '[2233电子喵_爱了爱了]',
            '[2233电子喵_awsl]',
            '[2233电子喵_从不中奖]'],//对官方的评论

        non_official_chp: [
            '[2233电子喵_吹爆老婆]',
            '[2233电子喵_爱了爱了]',
            '[2233电子喵_awsl]',
            '[2233电子喵_从不中奖]'
        ],//对非官方的说辞

        defined_reply_msg: ['[2233电子喵_爱了爱了]', '[2233电子喵_吹爆老婆]', '[2233电子喵_从不中奖]', '[2233电子喵_awsl]'],//获取评论失败时的默认评论
        repostchance: 0.5,//转发动态时，转发内容为评论内容的几率 为0时所有转发的东西都是转发动态
        comment_thumb_chance: 0.6, //评论动态时点赞自己评论的几率
        key_word_comment: {//关键词回复内容
            red_pocket: '0.69',//红包大小
            favorite_food: '辣条',
            favorite_color: '黑色',
        }
    }
    utl.const_object_remake(lottery_setting_default, lottery_setting)
    function listen() {
        var origin = {
            open: XMLHttpRequest.prototype.open,
            send: XMLHttpRequest.prototype.send
        }

        XMLHttpRequest.prototype.open = function (a, b) {
            // console.log('open');
            // this.addEventListener('loadend', onReadyStateChangeReplacement);

            this.addEventListener('load', replaceFn)
            // this.addEventListener('readystatechange', replaceFn);
            origin.open.apply(this, arguments)
        }
        XMLHttpRequest.prototype.send = function (a, b) {
            origin.send.apply(this, arguments)
        }
        $(document).ajaxComplete(function (event, xhr, settings) {//监听ajax请求
            //这个就出现了ajaxComplete，定义在上面，就是每个ajax请求后，成功与否都会调用的事件

            if (xhr.status == 200) {//这里设置了，只有成功返回，状态码200代表返回成功
                let obj = { target: { responseURL: settings.url }, response: xhr.responseJSON }
                let res = replaceFn.bind(obj, obj)
                res()
            }
        })

        function replaceFn(obj) {
            var url = obj.target.responseURL;
            var res = this
            console.log(`获取拦截数据:`, res)
            let resp
            if (url.includes(`/x/polymer/web-dynamic/v1/detail?timezone_offset`) ||
                url.includes(`/x/dynamic/feed/create/dyn`) ||
                url.includes(`/x/v2/reply/add`) ||
                url.includes(`/x/v2/reply/main`) ||
                url.includes(`/x/web-interface/nav`)
            ) {
                if (typeof res.response == 'object' && res.response.length == undefined) {
                    resp = res.response
                }
                else {
                    resp = JSON.parse(res.response)
                }
                if (url.includes("/x/polymer/web-dynamic/v1/detail?timezone_offset")) {
                    (function () { global_var.global_dynamic_data = resp.data })()
                }
                if (url.includes("/x/dynamic/feed/create/dyn") || url.includes("/v1/dynamic_repost/reply")) {
                    (function () { global_var.create_dyn_response = resp })()
                }
                if (url.includes("/x/v2/reply/add")) {
                    (function () { global_var.comment_dyn_response = resp })()
                }
                if (url.includes("/x/v2/reply/main")) {
                    (function () { console.log(`获取评论响应：`, res.response); global_var.reply_main = resp })()
                }
                if (url.includes("/x/web-interface/nav")) {
                    (function () { global_var.user_nav = resp })()
                }
            }

        }
    }
    listen()


    function sleep(ms) {
        return new Promise(resolve => setTimeout(() => resolve(sleep), ms));
    }

    let get_cv_dynamic = function () {
        let all_ddynamic_id_elements = document.getElementsByClassName('article-link')
        let all_dynamic_id = []
        let need_comment_repost_dynamic_id_lsit = []
        let not_need_comment_dynamic_id_list = []
        let not_need_repost_dynamic_id_list = []
        for (let i = 0; i < all_ddynamic_id_elements.length; i++) {
            if (all_dynamic_id.indexOf(all_ddynamic_id_elements[i].text) > -1) {
                continue
            }
            else {
                all_dynamic_id.push(all_ddynamic_id_elements[i].text)
            }
            if (all_ddynamic_id_elements[i].text.indexOf('tab=1') > -1) {
                not_need_comment_dynamic_id_list.push(all_ddynamic_id_elements[i].text)
            }
            else if (all_ddynamic_id_elements[i].text.indexOf('tab=2') > -1) {
                need_comment_repost_dynamic_id_lsit.push(all_ddynamic_id_elements[i].text)
            }
            else {
                not_need_repost_dynamic_id_list.push(all_ddynamic_id_elements[i].text)
            }
        }
        console.log(`获取完成：${all_dynamic_id.length}条\n需要转评动态：${need_comment_repost_dynamic_id_lsit.length}条\n无需评论动态：${not_need_comment_dynamic_id_list.length}条\n无需转发动态${not_need_repost_dynamic_id_list.length}条`)
    }

    async function do_lottery() {
        let pageurl = window.location.href
        let lottery_pageurl = GM_getValue('lottery_dynamic')
        if (pageurl.includes('www.bilibili.com/404') && document.referrer == lottery_pageurl) {
            GM_setValue('lottery_reply_record', my_operator.log_record.construct_comment_record_data('404动态'))
            //utl.my_throw('404动态')
            GM_setValue('lottery_wait', false)
            window.close()
        }
        if (pageurl.indexOf(lottery_pageurl) > -1) {
            console.log(lottery_setting)
            console.log('是记录的抽奖动态')
            let bt = 0
            while (1) {
                if (global_var.global_dynamic_data) { break }
                await sleep(1e3)
                console.log('未获取到动态信息')
                bt += 1
                if (bt >= 5) {
                    location.reload();
                    //utl.my_throw('未获取到动态信息')
                    return
                }
            }
            this.scrollTo(0, 3000)
            await sleep(0.5 * utl.random_choice(lottery_setting.Working_clearance_time))
            this.scrollTo(0, -3000)
            await sleep(0.5 * utl.random_choice(lottery_setting.Working_clearance_time))
            if (document.getElementsByClassName('bili-dyn-action like active')[0] != undefined) {//先进行点赞判断
                console.log('点过赞的动态')
                await sleep(utl.random_choice(lottery_setting.Working_clearance_time))
                let comment_msg = '点过赞的动态'
                GM_setValue('lottery_reply_record', my_operator.log_record.construct_comment_record_data(comment_msg))
                GM_setValue('lottery_wait', false)
                window.close()
                utl.my_throw('点过赞的动态')
                return
            }
            await my_operator.judge_lottery_time.judge_official_lottery().then(async (is_past) => {
                if (is_past == true) {
                    await sleep(utl.random_choice(lottery_setting.Working_clearance_time))
                    utl.my_throw('过期的官方抽奖')
                    return
                }
                else if (is_past == false) {//未过期的官方抽奖
                    if (!pageurl.includes('tab=1') && !pageurl.includes('tab=2')) {
                        pageurl += '?tab=1'
                    }
                }
            });

            let dynamic_comment_count = global_var.global_dynamic_data.item.modules.module_stat.comment.count
            if (dynamic_comment_count <= 50 && !pageurl.includes('tab=1')) {
                utl.my_throw('评论人数过少，需要人工判断')
                return
            }
            let dynamic_content = my_operator.dynamic_content_operator.get_dynamic_content_and_top_msg(global_var.global_dynamic_data)


            let comment_msg
            console.log('开始抽奖')
            console.log(global_var.global_dynamic_data)
            if (pageurl.indexOf('tab=1') > -1) {//只转发
                if (lottery_setting.official_lottery_switch) {
                    await my_operator.fast_repost()
                    comment_msg = '无需评论动态'
                }
                else {
                    utl.my_throw('过期的官方抽奖')
                }
            }
            else {
                comment_msg = my_operator.dynamic_comment_operator.reply_comment_generator(dynamic_content)
            }
            if (global_var.global_dynamic_data.item.modules.module_author.following == null) {//判断关注
                GM_setValue('follow_uid', global_var.global_dynamic_data.item.modules.module_author.mid)
                utl.simulate(document.getElementsByClassName('bili-dyn-avatar')[0], 'click')//点开主页关注
                console.log('未关注')
                await sleep(15e3)
            }
            if (!comment_msg || typeof comment_msg != 'string') {
                utl.my_throw('回复内容为空')
                return
            }
            console.log(`动态内容： `, dynamic_content)
            console.log(`回复内容： `, comment_msg)
            console.log(global_var.global_dynamic_data)
            if (pageurl.indexOf('tab=2') > -1) {//评论加转发
                if (Math.random() < lottery_setting.repostchance || comment_msg.includes('#')) {
                    await my_operator.comment_repost_dynamic_with_content(comment_msg)

                }
                else {
                    await my_operator.comment_repost_dynamic_without_content(comment_msg)
                }
            }
            else if (pageurl.indexOf('tab=2') == -1 && pageurl.indexOf('tab=1') == -1) {//只评论不转发
                await my_operator.only_comment(comment_msg)
            }
            else if (!(pageurl.indexOf('tab=2') > -1 || pageurl.indexOf('tab=1') > -1)) {
                utl.my_throw('未知tab类型')
                return
            }

            GM_setValue('lottery_reply_record', my_operator.log_record.construct_comment_record_data(comment_msg))
            await sleep(utl.random_choice(lottery_setting.Working_clearance_time))
            GM_setValue('lottery_wait', false)
            window.close()
        }
        console.log('非记录的抽奖动态')
    }

    async function check_follow() {
        if (this.mid == GM_getValue('follow_uid') && GM_getValue('follow_uid') != undefined && GM_getValue('do_lottery_flag')) {
            console.log('需要关注的对象')
            utl.simulate(document.getElementsByClassName('h-f-btn h-follow')[0], 'click')
            await sleep(3 * utl.random_choice(lottery_setting.Working_clearance_time))
            if (document.getElementsByClassName('be-dropdown h-f-btn h-unfollow')[0] == undefined) {
                console.log('关注失败')
                throw ('关注失败')
            }
            window.close();
        }
    }


    async function StartPlunder() {
        let LT_Timer = async function () {
            if (utl.checkNewDay(lottery_setting.CONFIG.CLEAR_TS) && lottery_setting.CONFIG.AUTO_DailyReward) {
                console.log(`新的一天，1分钟后开始执行每日任务`)
                lottery_setting.CONFIG.CLEAR_TS = utl.dateNow();
                utl.SaveLotterySetting()
                setTimeout(async () => {
                    MY_API.onedianchi_retry = 0
                    MY_API.DailyReward.GetEmoticons();
                    MY_API.DailyReward.nav()
                    MY_API.DailyReward.watch_Video();
                    MY_API.DailyReward.get_user_info();
                    MY_API.DailyReward.login();
                    await sleep(5000)
                    MY_API.DailyReward.onedianchi()
                    console.log(`昵称：${Live_info.uname}
                    UID：${Live_info.uid}
                    直播消费：${Live_info.cost}
                    会员等级：${Live_info.vipTypetext}
                    主站等级：Lv${Live_info.Blever}
                    硬币数量：${Live_info.coin}`)
                }, 1 * 60 * 1000)
            }


        }

        LT_Timer()
        setInterval(LT_Timer, 20e3);
    }

    async function cv_dynamic_lottery() {
        if (window.location.href.indexOf('read/cv') > -1) {
            let r = confirm(`检测到专栏动态网址，是否开始获取链接并转发评论`);
            if (r) {
                utl.SaveLotterySetting()
                GM_setValue('Pause', false)
                if ($('.wait_time').val()) {
                    let d = new Date()
                    console.log(d.toLocaleString(), '等待', $('.wait_time').val(), '分钟后开始抽奖')
                    await sleep($('.wait_time').val() * 60e3)
                }
                console.log(Date())
                console.log('开始获取动态id')
                lottery_setting.do_lottery_flag(true)//设置开始抽奖的标志
                function reload_handler(event) {
                    //event.preventDefault();
                    event.returnValue = "真的要关闭此窗口吗?";
                }
                window.addEventListener("beforeunload", reload_handler);
                window.onunload = function () {//确认关闭后干的事情
                    lottery_setting.do_lottery_flag(false)
                }
                get_cv_dynamic()
                let all_dynamic_id_elements = this.document.getElementsByClassName('article-link')
                if (!all_dynamic_id_elements.length == true) {
                    console.log('专栏没有链接');
                    return
                }
                let all_dynamic_id_list = []
                let recorded_dynamic_id_list = []
                for (let _ = 0; _ < all_dynamic_id_elements.length; _++) {
                    if (recorded_dynamic_id_list.includes(all_dynamic_id_elements[_].text)) {
                        continue
                    }
                    recorded_dynamic_id_list.push(all_dynamic_id_elements[_].text)
                    all_dynamic_id_list.push(all_dynamic_id_elements[_])
                }
                recorded_dynamic_id_list = undefined//销毁
                all_dynamic_id_list = utl.part_shuffle(parseInt(0.1 * all_dynamic_id_list.length), all_dynamic_id_list)//打乱百分之十的抽奖链接
                if ($('#septime_type1')[0].checked) {
                    if (all_dynamic_id_list.length <= 50) {//设置运行时间
                        lottery_setting.lottery_run_time = 0.5 * 3600e3
                    }
                    else if (150 >= all_dynamic_id_list.length) {
                        lottery_setting.lottery_run_time = 0.75 * 3600e3
                    }
                    else if (200 > all_dynamic_id_list.length) {
                        lottery_setting.lottery_run_time = 1 * 3600e3
                    }
                    else if (300 > all_dynamic_id_list.length) {
                        lottery_setting.lottery_run_time = 1.5 * 3600e3
                    }
                    else {
                        lottery_setting.lottery_run_time = 2 * 3600e3
                    }
                }
                else if ($('#septime_type2')[0].checked) {
                    lottery_setting.lottery_run_time = lottery_setting.lottery_sep_time[0] * all_dynamic_id_list.length
                }
                lottery_setting.lottery_sep_time = utl.generater_step_Array(parseInt(0.5 * lottery_setting.lottery_run_time / all_dynamic_id_list.length, 10), parseInt(1.5 * lottery_setting.lottery_run_time / all_dynamic_id_list.length, 10), 300)
                console.log(`运行时间约为${lottery_setting.lottery_run_time / 1000 / 60}分钟`)
                console.log('抽奖设定：', lottery_setting);
                let lottery_record = []//记录抽奖评论信息
                let manual_op = []//需要人工操作的动态
                let manual_op_dynamic_content = []
                let every_n_times_sleep_longtime = 14//每隔多少个动态休息时间延长
                let longsleepflag = [true, 0]//0是标志是否需要长时间休息,1是休息之后经过的抽奖次数
                for (let i = 0; i < all_dynamic_id_list.length; i++) {
                    if (longsleepflag[1] > every_n_times_sleep_longtime / 2) {
                        longsleepflag[0] = true
                    }
                    if (GM_getValue('fengkong_flag') == true) {
                        console.log('出了点问题，停个一小时再抽', (new Date()).toLocaleString())
                        await sleep(3600e3)
                        GM_setValue('fengkong_flag', false)
                    }
                    if (GM_getValue('Pause')) {
                        while (1) {
                            if (!GM_getValue('Pause')) {
                                break
                            }
                            await sleep(1e3)
                        }
                    }
                    utl.const_object_remake(GM_getValue('lottery_setting'), lottery_setting)
                    try {
                        GM_setValue('lottery_wait', true)
                        GM_setValue('lottery_dynamic', all_dynamic_id_list[i].text)
                        let d = new Date()
                        console.log(`当前进度：  【${i + 1}/${all_dynamic_id_list.length}】\t\t${all_dynamic_id_list[i].text} ${d.toLocaleTimeString()}`)
                        utl.simulate(all_dynamic_id_list[i], 'click')
                        lottery_setting.do_lottery_flag(true)
                        let bt = 1
                        while (1) {
                            await sleep(1e3);
                            if (GM_getValue('lottery_wait')) {
                                bt += 1;
                                if (bt >= 180) {
                                    GM_setValue('lottery_reply_record', `${all_dynamic_id_list[i].text}undefined\t评论转发失败`)
                                    GM_setValue('lottery_wait', false)//true是需要等待，false是不用等
                                    break
                                }
                            }
                            else {
                                if (bt < 3) {
                                    bt += 1;
                                    continue
                                }
                                break
                            }
                        }
                        let record = GM_getValue('lottery_reply_record')
                        console.log(`转评反馈：\n${record}\n`)
                        lottery_record.push(record)
                        //遇到点过赞的动态不休眠
                        if (record.includes('点过赞的动态')) {
                            console.log('点过赞的动态不休眠')
                        }
                        else {
                            let st = utl.random_choice(lottery_setting.lottery_sep_time)
                            if (st - bt * 1e3 < 0) {
                                st = 0
                            }
                            else {
                                st = st - bt * 1e3
                            }
                            if ((i + utl.random_choice([1, 2, 3, 4, 5, 6, 7])) % every_n_times_sleep_longtime == 0 && longsleepflag[0]) {//每隔多少次休眠
                                st += 9 * st
                                longsleepflag[0] = false
                                longsleepflag[1] = 0
                            }
                            longsleepflag[1] += 1
                            console.log(`休眠 ${st / 1000}秒`)
                            await sleep(st)
                        }
                        try {
                            if (/https:\/\/t.bilibili.com\/(.\d+)/gmi.exec(record)) {//如果动态id获取为空
                                //啥都不干，因为可能是404的动态
                            }
                            else if (all_dynamic_id_list[i].text.includes(/https:\/\/t.bilibili.com\/(.\d+)/gmi.exec(record).slice(1)[0])) {//如果不为空，判断是否包含对应动态id
                                //包含，啥都不干
                            }
                            else {//不包含，添加进去
                                manual_op.push(all_dynamic_id_list[i].text)
                                console.log(`添加入人工回复队列`)
                                manual_op_dynamic_content.push(record)
                                continue
                            }
                            if (!record.includes('404动态') && !record.includes('点过赞的动态') && !record.includes('过期的官方抽奖') && record.includes('undefined') || record.includes(`评论被阿瓦隆吞掉了`) || record.includes(`转发失败`) || record.includes(`动态评论失败`) || record.includes(`回复内容出错`)
                                || record.includes(`模拟点击失败`) || record.includes(`评论失败`) || record.includes(`评论获取失败`) || record.includes(`话题获取失败`)
                            ) {
                                manual_op.push(all_dynamic_id_list[i].text)
                                console.log(`添加入人工回复队列`)
                                manual_op_dynamic_content.push(record)
                            }
                        }
                        catch (e) {//提取动态id失败
                            console.log(e)
                            console.log(`提取动态id失败`)
                            manual_op.push(all_dynamic_id_list[i].text)
                            console.log(`添加入人工回复队列`)
                            manual_op_dynamic_content.push(record)
                        }
                    }
                    catch (e) {
                        console.error(e)
                        manual_op(all_dynamic_id_list[i].text)
                        manual_op_dynamic_content.push(record)
                        continue
                    }
                }
                if ($('#download_log_check').checked) {
                    let d = new Date()
                    utl.downFile(`${lottery_setting.user_name} ${d.toLocaleString()}.csv`, lottery_record.join('\n'))
                }
                if (!manual_op == false) {//人工判断列表非空时的操作
                    let d = new Date()
                    let new_article_content = '<p>需要人工回复内容</p><br><ol>'
                    for (let _manual_index = 0; _manual_index < manual_op.length; _manual_index++) {
                        new_article_content += `<li><a class="article-link" target="_blank" href="${manual_op[_manual_index]}">${manual_op_dynamic_content[_manual_index]}</a></li><br>`
                    }
                    new_article_content += `</ol>`
                    utl.downFile(`${lottery_setting.user_name} ${d.toLocaleString()}人工判断.txt`, manual_op.join('\n'))
                    $('.article-link').remove()
                    new_article_content = $(new_article_content)
                    $('.article-container').append(new_article_content)
                }
                let d = new Date()
                console.log('抽奖完成', d.toLocaleString())
                console.log(lottery_record)
                console.log('人工回复动态：')
                console.log(manual_op)
                window.removeEventListener("beforeunload", reload_handler);

                $('#read').remove()
                let btn = $('<button id="read" style="position: absolute; top: 200px; right: 300px;z-index:1;background-color:GhostWhite;color: #FF34B3;border-radius: 4px;border: none;padding: 5px;cursor: pointer;box-shadow: 1px 1px 2px #00000075;">' +
                    '抽奖已经完成</button>');
                btn.on('click', function () {
                    alert('抽奖已完成')
                    $('#read').remove()
                    my_component.my_btn()
                })
                $('.up-left').append(btn)

                utl.const_object_remake(GM_getValue('lottery_setting'), lottery_setting)
                if (lottery_setting.prevent_module.share_video_switch) {
                    console.log('开始分享视频')
                    utl.simulate($('#share_botton').get(0), 'click')
                }
                else {
                    lottery_setting.do_lottery_flag(false)
                }
            }
            else {
                lottery_setting.do_lottery_flag(false)
                $('#read').remove()
                my_component.my_btn()
            }
        }
    }

    async function init() {
        //初始化一些全局参数
        await sleep(2e3)
        try {
            utl.const_object_remake(GM_getValue('lottery_setting'), lottery_setting)
        } catch (e) {
            console.warn(e)
            console.warn('获取设置失败，使用默认默认设置')
            utl.const_object_remake(lottery_setting_default, lottery_setting)
        }
        console.log(lottery_setting)
        if (!lottery_setting.user_name || !lottery_setting.user_mid) {
            try {
                lottery_setting.user_name = this.window.__BiliUser__.cache.data.uname
                lottery_setting.user_mid = this.window.__BiliUser__.cache.data.mid
            } catch {
                await sleep(1e3)
                location.reload()
            }
            if (!lottery_setting.user_name || !lottery_setting.user_mid) {
                await sleep(1e3)
                utl.my_throw('未登录')
            }
        }
        try {
            BAPI = BilibiliAPI
            BAPI.setCommonArgs(BAPI.getCookie('bili_jct')); // 设置token
        } catch (err) {
            console.error(`[${NAME}]`, err);
            return;
        }
        Live_info.csrf_token = BAPI.getCookie('bili_jct');
        csrf_token = Live_info.csrf_token

        if (window.location.href.indexOf('read/cv') > -1) {
            my_component.my_btn()//初始化按钮
            my_component.my_textarea()//初始化checkbox
        }

        if (lottery_setting.prevent_module.share_video_switch) {
            await my_operator.prevent_filter_module.prevent_filter_init()
        }

        if (GM_getValue('fengkong_flag') == true) {
            console.log('停止抽奖一小时')
            setTimeout(GM_setValue('fengkong_flag', false), 3600e3)
        }
        if (GM_getValue('do_lottery_flag')) {
            GM_setValue('fengkong_flag', false)//停止抽奖标志
            await check_follow()
            do_lottery()
        }
        else {
            console.log('未开始抽奖，退出')
            return
        }
    }
    var csrf_token
    const MY_API = {//直接调用b站的API
        chatLog: function (args) {
            console.log(args)
        },
        dmlist: [],
        onedianchi_retry: 0,
        DailyReward: {//每日任务：主站登陆、观看、转发
            onedianchi: () => {
                return BAPI.GetUserTaskProgress().then(async (re) => {
                    //console.log('onedianchi', re)
                    if (re.code == 0 && re.data.status == 3) {
                        return MY_API.chatLog(`【直播间任务电池】今日已领取！`);
                    }
                    if (re.code == 0 && re.data.is_surplus == -1) {
                        return MY_API.chatLog(`【直播间任务电池】无领取资格！`, 'warning');
                    }
                    if (re.code == 0 && re.data.is_surplus == 1 && re.data.status != 3) {
                        if (re.data.status == 1 || re.data.status == 0) {
                            let num = re.data.target - re.data.progress
                            let roomlist = [21622811, 7734200, 46936, 11218604, 21144080]
                            for (let i = 0; i < num; i++) {
                                if (MY_API.dmlist[i] == undefined) break
                                BAPI.sendLiveDanmu_dm_type(MY_API.dmlist[i], roomlist[i])
                                await sleep(5000)
                            }
                            MY_API.onedianchi_retry++
                            if (MY_API.onedianchi_retry > 25) return
                            await sleep(5000)
                            return MY_API.DailyReward.onedianchi()
                        }
                        if (re.data.status == 2) {
                            var formData = new FormData();
                            formData.set("build", "6790300");
                            formData.set("c_locale", "en_US");
                            formData.set("channel", "360");
                            formData.set("device", "android");
                            formData.set("disable_rcmd", 0);
                            formData.set("mobi_app", "android");
                            formData.set("platform", "android");
                            formData.set("s_locale", "en_US");
                            formData.set("statistics", "%7B%22appId%22%3A1%2C%22platform%22%3A3%2C%22version%22%3A%226.79.0%22%2C%22abtest%22%3A%22%22%7D");
                            formData.set("ts", ts_s());
                            formData.set("target_id", 358483030);
                            formData.set("csrf", Live_info.csrf_token);
                            formData.set("csrf_token", Live_info.csrf_token);
                            return GM_xmlhttpRequest({
                                url: `https://api.live.bilibili.com/xlive/app-ucenter/v1/userTask/UserTaskReceiveRewards`,
                                method: "post",
                                headers: {
                                    "User-Agent": "Mozilla/5.0 BiliDroid/6.79.0 (bbcallen@gmail.com) os/android model/Redmi K30 Pro mobi_app/android build/6790300 channel/360 innerVer/6790310 osVer/11 network/2"
                                },
                                data: formData,
                                onload: async function (res) {
                                    let dat = JSON.parse(res.response);
                                    //console.log('onedianchi', dat)
                                    if (dat.code == 0) {
                                        MY_API.chatLog(`【直播间任务电池】${dat.data.num}领取成功！`, 'success');
                                    }
                                }
                            })
                        }
                    }
                    if (re.code == -101) {
                        return console.log(re)
                    }
                }, () => {
                    console.log('await error')
                    MY_API.chatLog('直播间任务电池获取失败，请检查网络', 'warning');
                    return delayCall(() => MY_API.DailyReward.onedianchi());
                });
            },
            score_task_sign: () => {//大会员自动签到
                if (Live_info.vipType >= 1 && Live_info.vipStatus == 1) {
                    return BAPI.score_task_sign().then((re) => {
                        if (re.code == 0 && re.message == "success") {
                            MY_API.chatLog(`【大会员签到】大会员签到成功！`, 'success');
                            return BAPI.vip_point_task_combine().then((r) => {
                                if (r.code == 0) {
                                    MY_API.chatLog(`【大会员签到】大会员积分：${r.data.point_info.point}`, 'success');
                                }
                            })
                        }
                    }, () => {
                        console.log('await error')
                        MY_API.chatLog('大会员签到数据获取失败，请检查网络', 'warning');
                        return delayCall(() => MY_API.DailyReward.score_task_sign());
                    });
                }
            },
            get_b: () => {//自动领取年度B币券
                if (MY_API.CONFIG.get_b && Live_info.vipType >= 2 && Live_info.vipStatus == 1) {
                    return BAPI.vip_privilege().then((re) => {
                        if (re.code == 0 && re.data.list[0].state == 0) {
                            return BAPI.get_vip_privilege(1).then((res) => {
                                if (res.code == 0 && res.message == "0")
                                    MY_API.chatLog(`【年度大会员B币】B币券领取成功！`, 'success');
                            })
                        }
                    });
                }
            },
            b_to_gold: async () => {//自动年度B币券充值为金瓜子
                if (MY_API.CONFIG.b_to_gold) {
                    await sleep(2000)
                    return BAPI.myWallet().then((re) => {
                        if (re.code == 0 && re.message == "0" && re.data.common_bp != undefined && re.data.common_bp > 0) {
                            let common_bp = re.data.common_bp
                            return BAPI.createOrder(common_bp).then((res) => {
                                if (res.code == 0 && res.message == "0")
                                    MY_API.chatLog(`【年度大会员B币】B币券充值金瓜子成功！`, 'success');
                            })
                        }
                    });
                }
            },
            watch_Video: () => {
                if (1 == 1) BAPI.watch_Video('BV1n84y1y7Dr')
            },
            get_cost: () => {
                return BAPI.cost().then((re) => {
                    if (re.code == 0) {
                        let list = re.data.info
                        for (let i = 0; i < list.length; i++) {
                            if (list[i].title == "富可敌国") {
                                if (list[i].finished) {
                                    Live_info.cost = '10个W元以上'
                                } else {
                                    Live_info.cost = list[i].progress.now / 10 + '元'
                                }
                                console.log('Live_info.cost', Live_info.cost)
                                break
                            }
                        }
                    }
                }, () => {
                    console.log('await error')
                    MY_API.chatLog('直播消费数据获取失败，请检查网络', 'warning');
                    return delayCall(() => MY_API.DailyReward.cost());
                });
            },
            GetEmoticons: () => {
                return BAPI.GetEmoticons().then((re) => {
                    if (re.code == 0 && re.data != undefined && re.data.data != undefined && re.data.data[0] != undefined && re.data.data[0].emoticons != undefined) {
                        let emlist = re.data.data[0].emoticons
                        for (let i = 0; i < emlist.length; i++) {
                            MY_API.dmlist.push(emlist[i].emoticon_unique)
                        }
                        //console.log('GetEmoticons',dmlist)
                    }
                    if (re.code == -101) {
                        return console.log(re)
                    }
                }, () => {
                    console.log('await error')
                    MY_API.chatLog('表情包数据获取失败，请检查网络', 'warning');
                    return delayCall(() => MY_API.DailyReward.GetEmoticons());
                });
            },
            get_user_info: () => {
                return BAPI.get_user_info().then((re) => {
                    if (re.code == 0) {
                        Live_info.uname = re.data.uname
                        Live_info.user_level = re.data.user_level
                        Live_info.identification = re.data.identification
                        if (String(Live_info.uname).length > 3) {
                            Xname = String(Live_info.uname).substr(-2).padStart(String(Live_info.uname).length, "*")
                        } else {
                            Xname = String(Live_info.uname).substr(-1).padStart(String(Live_info.uname).length, "*")
                        }
                    }
                }, () => {
                    console.log('await error')
                    MY_API.chatLog('直播等级数据获取失败，请检查网络', 'warning');
                    return delayCall(() => MY_API.DailyReward.get_user_info());
                });
            },
            nav: () => {
                return BAPI.nav().then((re) => {
                    if (re.code == 0) {
                        Live_info.uname = re.data.uname;
                        Live_info.uid = re.data.mid
                        Live_info.coin = re.data.money
                        Live_info.Blever = re.data.level_info.current_level
                        if (Live_info.Blever >= 6) {//6级关闭投币
                            MY_API.CONFIG.AUTO_COIN = false
                            MY_API.CONFIG.AUTO_COIN2 = false
                        }
                        Live_info.vipType = re.data.vipType
                        Live_info.uname = re.data.uname
                        Live_info.face_url = re.data.face
                        Live_info.vipStatus == re.data.vipStatus
                        Live_info.vipTypetext = re.data.vip_label.text
                        if (Live_info.vipTypetext == '') Live_info.vipTypetext = '普通会员'
                    }
                    if (re.code == -101) {
                        return console.log(re)
                    }
                }, () => {
                    console.log('await error')
                    MY_API.chatLog('用户信息获取失败，请检查网络', 'warning');
                    return delayCall(() => MY_API.DailyReward.nav());
                });
            },
            DoSign: () => {//直播区奖励
                return BAPI.DoSign().then((response) => {
                    //console.log('每日直播区签到', response)
                    if (response.code === 0) {
                        MY_API.chatLog(`【每日奖励】直播区签到成功！`, 'success');
                    } else if (response.code == 1011040) {
                        // 已签到
                        MY_API.chatLog('【每日奖励】直播区已签到！', 'warning');
                    } else {
                        MY_API.chatLog(`【每日奖励】${response.message}`, 'warning');
                    }
                    if (response.code == -101) {
                        return console.log(re)
                    }
                }, () => {
                    console.log('await error')
                    MY_API.chatLog('【每日奖励】直播区已签到失败，请检查网络！', 'warning');
                    return setTimeout(function () { MY_API.DailyReward.DoSign() }, 10 * 60 * 1000)
                });
            },
            login: () => {//主站登陆
                return BAPI.DailyReward.login().then((response) => {
                    MY_API.chatLog('【每日奖励】每日登录完成', 'success');
                    if (response.code == -101) {
                        return console.log(re)
                    }
                }, () => {
                    console.log('await error')
                    MY_API.chatLog('【每日奖励】每日登录完成失败，请检查网络', 'warning');
                    return delayCall(() => MY_API.DailyReward.login());
                });
            },
            share: (aid) => {
                return BAPI.DailyReward.share(aid).then((response) => {
                    //console.log('每日分享', response)
                    if (response.code === 0) {
                        MY_API.chatLog(`【每日奖励】每日分享分享成功(av=${aid})`, 'success');
                    } else if (response.code === 71000) {
                        // 重复分享
                        MY_API.chatLog('【每日奖励】每日分享今日分享已完成', 'info');
                    } else if (response.code === 137004) {
                        // 账号异常，操作失败
                        MY_API.chatLog('【每日奖励】每日分享账号异常，操作失败!', 'warning');
                    } else {
                        MY_API.chatLog(`【每日奖励】每日分享${response.message}`, 'warning');
                    }
                    if (response.code == -101) {
                        return console.log(re)
                    }
                }, () => {
                    console.log('await error')
                    MY_API.chatLog('【每日奖励】每日分享分享失败，请检查网络', 'warning');
                    return delayCall(() => MY_API.DailyReward.share(aid));
                });
            },
            watch: (aid, cid) => {
                return BAPI.DailyReward.watch(aid, cid, Live_info.uid, ts_s()).then((response) => {
                    //console.log('每日观看', response)
                    if (response.code === 0) {
                        MY_API.chatLog(`【每日奖励】每日观看完成(av=${aid})`, 'success');
                    } else {
                        MY_API.chatLog(`【每日奖励】每日观看${response.message}`, 'caution');
                    }
                    if (response.code == -101) {
                        return console.log(re)
                    }
                }, () => {
                    console.log('await error')
                    MY_API.chatLog('【每日奖励】[每日观看]完成失败，请检查网络', 'warning');
                    return delayCall(() => MY_API.DailyReward.watch(aid, cid));
                });
            },
        }, // Once Run every day "api.live.bilibili.com"
    }
    var BilibiliAPI = {
        setCommonArgs: (csrfToken = '', visitId = '') => {
            csrf_token = csrfToken;
        },
        runUntilSucceed: (callback, delay = 0, period = 50) => {
            setTimeout(() => {
                if (!callback())
                    BilibiliAPI.runUntilSucceed(callback, period, period);
            }, delay);
        },
        processing: 0,
        ajax: (settings) => {
            if (settings.xhrFields === undefined)
                settings.xhrFields = {};
            settings.xhrFields.withCredentials = true;
            jQuery.extend(settings, {
                url: (settings.url.substr(0, 2) === '//' ? '' : '//api.live.bilibili.com/') + settings.url,
                method: settings.method || 'GET',
                crossDomain: true,
                dataType: settings.dataType || 'json'
            });
            const p = jQuery.Deferred();
            BilibiliAPI.runUntilSucceed(() => {
                if (BilibiliAPI.processing > 8)
                    return false;
                ++BilibiliAPI.processing;
                return jQuery.ajax(settings).then((arg1, arg2, arg3) => {
                    --BilibiliAPI.processing;
                    p.resolve(arg1, arg2, arg3);
                    return true;
                }, (arg1, arg2, arg3) => {
                    --BilibiliAPI.processing;
                    p.reject(arg1, arg2, arg3);
                    return true;
                });
            });
            return p;
        },
        ajaxWithCommonArgs: (settings) => {
            if (!settings.data)
                settings.data = {};
            settings.data.csrf = csrf_token;
            settings.data.csrf_token = csrf_token;
            settings.data.visit_id = '';
            return BilibiliAPI.ajax(settings);
        },
        // 整合常用API
        GetUserTaskProgress: () => {//直播1电池
            return BilibiliAPI.ajax({
                url: "//api.live.bilibili.com/xlive/app-ucenter/v1/userTask/GetUserTaskProgress",
                method: "GET",
            })
        },
        score_task_sign: () => {//大会员积分签到
            return BilibiliAPI.ajax({
                url: "//api.bilibili.com/pgc/activity/score/task/sign",
                method: "POST",
                data: {
                    csrf: csrf_token,
                }
            })
        },
        vip_point_task_combine: () => {//大会员积分签到
            return BilibiliAPI.ajax({
                url: "//api.bilibili.com/x/vip_point/task/combine",
                method: "GET",
                data: {
                    csrf: csrf_token,
                }
            })
        },
        Storm: {
            check: (roomid) => {
                // 检查是否有节奏风暴
                return BilibiliAPI.ajax({
                    url: 'lottery/v1/Storm/check?roomid=' + roomid
                });
            },
            join: (id, roomid) => {
                // 参加节奏风暴
                return BilibiliAPI.ajaxWithCommonArgs({
                    method: 'POST',
                    url: 'lottery/v1/Storm/join',
                    data: {
                        id: id,
                        color: 16777215,
                        captcha_token: '',
                        captcha_phrase: '',
                        roomid: roomid
                    }
                });
            }
        },
        likeInteract: (roomid) => {//点赞直播间
            return BilibiliAPI.ajax({
                url: "//api.live.bilibili.com/xlive/web-ucenter/v1/interact/likeInteract",
                method: "POST",
                data: {
                    roomid: roomid,
                    ts: ts_s(),
                    csrf_token: csrf_token,
                    csrf: csrf_token,
                    visit_id: ''
                }
            })
        },
        new_video_dynamic: () => {
            return BilibiliAPI.ajax({
                url: `//api.bilibili.com/x/polymer/web-dynamic/v1/feed/all?timezone_offset=-480&type=video&page=1`,
                method: "GET",
            })
        },
        dyn: (dyn_id_str) => {
            let data = {
                "dyn_req": {
                    "content": {
                        "contents": [
                            {
                                "raw_text": "转发动态",
                                "type": 1,
                                "biz_id": ""
                            }
                        ]
                    },
                    "scene": 4,
                    "upload_id": Live_info.uid + "_" + ts_s() + "_" + Math.round(Math.random() * 1000),
                    "meta": {
                        "app_meta": {
                            "from": "create.dynamic.web",
                            "mobi_app": "web"
                        }
                    }
                },
                "web_repost_src": {
                    "dyn_id_str": dyn_id_str
                }
            }
            let p = JSON.stringify(data)
            return BilibiliAPI.ajax({
                url: `//api.bilibili.com/x/dynamic/feed/create/dyn?csrf=${csrf_token}`,
                method: "POST",
                contentType: "application/json;charset-UTF-8",
                dataType: "json",
                data: p
            })
        },
        submit_check: () => {
            let data = {
                "content": {
                    "contents": [
                        {
                            "raw_text": "转发动态",
                            "type": 1,
                            "biz_id": ""
                        }
                    ]
                }
            }
            let p = JSON.stringify(data)
            return BilibiliAPI.ajax({
                url: `//api.bilibili.com/x/dynamic/feed/create/submit_check?csrf=${csrf_token}`,
                contentType: "application/json;charset-UTF-8",
                dataType: "json",
                method: "POST",
                data: p
            })
        },
        TrigerInteract: (roomid) => {//分享直播间
            return BilibiliAPI.ajax({
                url: "//api.live.bilibili.com/xlive/web-room/v1/index/TrigerInteract",
                method: "POST",
                data: {
                    roomid: roomid,
                    interact_type: 3,
                    csrf_token: csrf_token,
                    csrf: csrf_token,
                    visit_id: ''
                }
            })
        },
        elec: (ruid, bp_num = 5) => {//B币券充电
            return BilibiliAPI.ajax({
                url: "//api.bilibili.com/x/ugcpay/web/v2/trade/elec/pay/quick",
                method: "POST",
                data: {
                    bp_num: bp_num,
                    is_bp_remains_prior: true,
                    up_mid: ruid,
                    otype: 'up',
                    oid: ruid,
                    csrf: csrf_token,
                }
            })
        },
        getWebArea_room_List: (parent_area_id, page) => {
            return BilibiliAPI.ajax({
                url: `//api.live.bilibili.com/xlive/web-interface/v1/second/getList?platform=web&parent_area_id=${parent_area_id}&area_id=0&page=${page}`,
                method: "GET",
            })
        },
        now: () => {
            return BilibiliAPI.ajax({
                url: `//api.bilibili.com/x/report/click/now`,
                method: "GET",
            })
        },
        getWebAreaList: () => {
            return BilibiliAPI.ajax({
                url: `//api.live.bilibili.com/xlive/web-interface/v1/index/getWebAreaList?source_id=2`,
                method: "GET",
            })
        },
        getOnlineGoldRank: (ruid, room_id) => {
            return BilibiliAPI.ajax({
                url: `//api.live.bilibili.com/xlive/general-interface/v1/rank/getOnlineGoldRank?ruid=${ruid}&roomId=${room_id}&page=1&pageSize=50`,
                method: "GET",
            })
        },
        getConf: (room_id) => {
            return BilibiliAPI.ajax({
                url: `//api.live.bilibili.com/room/v1/Danmu/getConf?room_id=${room_id}&platform=pc&player=web`,
                method: "GET",
            })
        },
        cost: () => {//花费适用于10w以下
            return BilibiliAPI.ajax({
                url: "//api.live.bilibili.com/xlive/web-ucenter/v1/achievement/list?type=normal&status=0&category=all&keywords=&page=1&pageSize=100",
                method: "GET",
            })
        },
        ConfigPlugs: () => {//勋章显示设置获取
            return BilibiliAPI.ajax({
                url: "//api.live.bilibili.com/xlive/web-ucenter/v1/labs/ConfigPlugs",
                method: "GET",
            })
        },
        EditPlugs: () => {//个人空间关闭显示勋章墙
            return BilibiliAPI.ajax({
                url: "//api.live.bilibili.com/xlive/web-ucenter/v1/labs/EditPlugs",
                method: "POST",
                data: {
                    key: 'close_space_medal',
                    status: 1,//关闭
                    csrf_token: csrf_token,
                    csrf: csrf_token,
                    visit_id: '',
                }
            })
        },
        verify_room_pwd: (roomid) => {//加密
            return BilibiliAPI.ajax({
                url: "//api.live.bilibili.com/room/v1/Room/verify_room_pwd",
                method: "GET",
                data: {
                    room_id: roomid,
                }
            })
        },
        getLotteryInfoWeb: (roomid) => {//抽奖信息
            return BilibiliAPI.ajax({
                url: "//api.live.bilibili.com/xlive/lottery-interface/v1/lottery/getLotteryInfoWeb",
                method: "GET",
                data: {
                    roomid: roomid,
                }
            })
        },
        red_pocket_join: (id, roomid) => {//参加直播间红包
            return BilibiliAPI.ajax({
                url: "//api.live.bilibili.com/xlive/revenue/v1/red_pocket/join",
                method: "POST",
                data: {
                    roomId: roomid,
                    id: id,
                    uid: Live_info.uid,
                    spm_id: '444.8.red_envelope.extract',
                    jump_from: '',
                    session_id: '',
                    room_id: roomid,
                    csrf_token: csrf_token,
                    csrf: csrf_token,
                    visit_id: '',
                }
            })
        },
        myWallet: () => {//获取B币信息
            return BilibiliAPI.ajax({
                url: "//api.live.bilibili.com/xlive/revenue/v1/wallet/myWallet",
                method: "GET",
                data: {
                    need_bp: 1,
                    need_metal: 1,
                    platform: 'pc',
                    bp_with_decimal: 0,
                    ios_bp_afford_party: 0,
                }
            })
        },
        createOrder: (pay_bp) => {//B币充值为金瓜子
            return BilibiliAPI.ajax({
                url: "//api.live.bilibili.com/xlive/revenue/v1/order/createOrder",
                method: "POST",
                data: {
                    platform: 'pc',
                    pay_bp: pay_bp,
                    context_id: 5440,
                    context_type: 1,
                    goods_id: 1,
                    goods_num: 5,
                    goods_type: 2,
                    ios_bp: 0,
                    common_bp: pay_bp,
                    csrf_token: csrf_token,
                    csrf: csrf_token,
                    visit_id: '',
                }
            })
        },
        gethistory_dm: (roomid) => {
            return BilibiliAPI.ajax({
                url: `//api.live.bilibili.com/xlive/web-room/v1/dM/gethistory?roomid=${roomid}`,
                method: "GET",
            })
        },
        vip_privilege: () => {//获取大会员福利信息
            return BilibiliAPI.ajax({
                url: "//api.bilibili.com/x/vip/privilege/my",
                method: "GET",
            })
        },
        get_vip_privilege: (type) => {//领取大会员福利//1B币 2会员购优惠券 3大会员专享漫画礼包
            return BilibiliAPI.ajax({
                url: "//api.bilibili.com/x/vip/privilege/receive",
                method: "POST",
                data: {
                    type: type,
                    csrf: csrf_token
                }
            })
        },
        view_bvid: (bvid) => {//获取bv信息
            return BilibiliAPI.ajax({
                url: "//api.bilibili.com/x/web-interface/view",
                method: "GET",
                data: {
                    bvid: bvid,
                }
            })
        },
        getWebAreaList: () => {
            return BilibiliAPI.ajax({
                url: "//api.live.bilibili.com/xlive/web-interface/v1/index/getWebAreaList",
                method: "GET",
                data: {
                    source_id: 2,
                }
            })
        },
        fans_medal_info: async (ruid, rroom_id) => {
            return BilibiliAPI.ajax({
                url: "//api.live.bilibili.com/xlive/app-ucenter/v1/fansMedal/fans_medal_info",
                method: "GET",
                data: {
                    target_id: ruid,
                    room_id: rroom_id,
                    room_area_id: Live_info.room_area_id,
                    area_parent_id: Live_info.area_parent_id,
                    platform: 'pc'
                }
            })
        },
        relation: (ruid) => {//关注类型0非关注
            return BilibiliAPI.ajax({
                url: "//api.live.bilibili.com/x/relation",
                method: "GET",
                data: {
                    fid: ruid,
                    jsonp: 'jsonp',
                    callback: ''
                }
            })
        },
        IsUserFollow: e => BAPI.ajax({//是否关注1关注0非关注
            url: "relation/v1/Feed/IsUserFollow?follow=" + e
        }),
        live_fans_medal: (page, pageSize) => {//获取全部勋章数据
            return BilibiliAPI.ajax({
                url: "//api.live.bilibili.com/xlive/app-ucenter/v1/user/GetMyMedals",
                method: "GET",
                data: {
                    page: page,
                    page_size: pageSize
                }
            })
        },
        rm_dynamic: (dynamic_id) => {//删除动态
            return BilibiliAPI.ajax({
                url: "//api.vc.bilibili.com/dynamic_svr/v1/dynamic_svr/rm_dynamic",
                method: "POST",
                data: {
                    dynamic_id: dynamic_id,
                    csrf_token: csrf_token,
                    csrf: csrf_token
                }
            })
        },
        msgfeed_reply: () => {//获取回复信息
            return BilibiliAPI.ajax({
                url: "//api.bilibili.com/x/msgfeed/reply",
                method: "GET",
                data: {
                    build: 0,
                    mobi_app: 'web',
                    platform: 'web',
                }
            })
        },
        msgfeed_at: () => {//获取@信息
            return BilibiliAPI.ajax({
                url: "//api.bilibili.com/x/msgfeed/at",
                method: "GET",
                data: {
                    build: 0,
                    mobi_app: 'web'
                }
            })
        },
        dynamic_postdiscuss: (discuss, oid, type) => { //动态发送评论
            if (oid == 0) return;
            return BilibiliAPI.ajax({
                method: 'POST',
                url: '//api.bilibili.com/x/v2/reply/add',
                data: {
                    oid: oid,
                    type: type,
                    message: discuss,
                    plat: 1,
                    ordering: 'time',
                    jsonp: 'jsonp',
                    csrf: csrf_token,
                }
            });
        },
        get_dynamic_detail: (dynamic_id) => {//获取动态详细
            return BilibiliAPI.ajax({
                url: "//api.vc.bilibili.com/dynamic_svr/v1/dynamic_svr/get_dynamic_detail",
                method: "GET",
                data: {
                    dynamic_id: dynamic_id
                }
            })
        },
        //https://api.bilibili.com/x/space/article?mid=1975047664&pn=1&ps=12&sort=publish_time&jsonp=jsonp&callback=__jp5
        space_article: (mid) => {//获取最新专栏投稿信息
            return BilibiliAPI.ajax({
                url: "//api.bilibili.com/x/space/article",
                method: "GET",
                data: {
                    mid: mid,
                    pn: 1,
                    ps: 12,
                    sort: 'publish_time',
                    jsonp: 'jsonp',
                }
            })
        },
        article_list: (id) => {//获取文集信息
            return BilibiliAPI.ajax({
                url: "//api.bilibili.com/x/article/list/web/articles",
                method: "GET",
                data: {
                    id: id,
                    jsonp: 'jsonp',
                }
            })
        },
        article_recommends: () => {//获取最新专栏信息
            return BilibiliAPI.ajax({
                url: "//api.bilibili.com/x/article/recommends",
                method: "GET",
                data: {
                    aid: '',
                    cid: 3,
                    pn: 1,
                    ps: 20,
                    jsonp: 'jsonp',
                    sort: 1
                }
            })
        },
        article_favorites_add: (oid, upid) => {//专栏收藏
            return BilibiliAPI.ajax({
                url: "//api.bilibili.com/x/article/favorites/add",
                method: "POST",
                data: {
                    id: oid,
                    csrf: csrf_token
                }
            })
        },
        article_coin_add: (oid, upid) => {//专栏投币
            return BilibiliAPI.ajax({
                url: "//api.bilibili.com/x/web-interface/coin/add",
                method: "POST",
                data: {
                    aid: oid,
                    upid: upid,
                    multiply: 1,
                    avtype: 2,
                    csrf: csrf_token
                }
            })
        },
        article_like: (oid) => {//专栏点赞
            return BilibiliAPI.ajax({
                url: "//api.bilibili.com/x/article/like",
                method: "POST",
                data: {
                    id: oid,
                    type: 1,
                    csrf: csrf_token
                }
            })
        },
        GetEmoticons: () => {//表情包信息
            return BilibiliAPI.ajax({
                url: "//api.live.bilibili.com/xlive/web-ucenter/v2/emoticon/GetEmoticons?platform=pc&room_id=2374828",
                method: "GET",
            })
        },
        get_user_info: () => {//用户信息
            return BilibiliAPI.ajax({
                url: "//api.live.bilibili.com/xlive/web-ucenter/user/get_user_info",
                method: "GET",
            })
        },
        nav: () => {//用户登陆信息等
            return BilibiliAPI.ajax({
                url: "//api.bilibili.com/x/web-interface/nav",
                method: "GET",
            })
        },
        DoSign: () => {//直播区签到
            return BilibiliAPI.ajax({
                url: "//api.live.bilibili.com/xlive/web-ucenter/v1/sign/DoSign",
                method: "GET",
            })
        },
        dynamic_create: (content) => {//文字动态
            const extension = '{"emoji_type":1,"from":{"emoji_type":1},"flag_cfg":{}}'
            return BilibiliAPI.ajax({
                url: "//api.vc.bilibili.com/dynamic_svr/v1/dynamic_svr/create",
                method: "POST",
                data: {
                    dynamic_id: 0,
                    type: 4,
                    rid: 0,
                    content: content,
                    up_choose_comment: 0,
                    up_close_comment: 0,
                    extension: extension,
                    at_uids: '',
                    ctrl: [],
                    csrf_token: csrf_token,
                    csrf: csrf_token,
                }
            })
        },
        dynamic_like: (dynamic_id) => {//动态点赞
            return BilibiliAPI.ajax({
                url: "//api.vc.bilibili.com/dynamic_like/v1/dynamic_like/thumb",
                method: "POST",
                data: {
                    uid: Live_info.uid,
                    dynamic_id: dynamic_id,
                    up: 1,
                    csrf_token: csrf_token,
                    csrf: csrf_token,
                }
            })
        },
        space_history: (host_uid, offset_dynamic_id = 0) => {//进入个人主页的动态页
            return BilibiliAPI.ajax({
                url: "//api.vc.bilibili.com/dynamic_svr/v1/dynamic_svr/space_history",
                method: "GET",
                data: {
                    visitor_uid: Live_info.uid,
                    offset_dynamic_id: offset_dynamic_id,//动态抽奖一般会置顶，嫌麻烦只取近期最近的一组数据
                    host_uid: host_uid,
                    need_top: 1,
                    platform: 'web'
                }
            })
        },
        reserve_relation_info: (business_id) => {//business_id
            return BilibiliAPI.ajax({
                url: "//api.bilibili.com/x/activity/up/reserve/relation/info",
                method: "GET",
                data: {
                    ids: business_id,
                    csrf: csrf_token,
                }
            })
        },
        reserve_attach_card_button: (reserve_id, reserve_total) => {//business_id
            return BilibiliAPI.ajax({
                url: "//api.vc.bilibili.com/dynamic_mix/v1/dynamic_mix/reserve_attach_card_button",
                method: "POST",
                data: {
                    reserve_id: reserve_id,
                    cur_btn_status: 1,
                    reserve_total: reserve_total,
                    csrf: csrf_token,
                }
            })
        },
        detail_by_lid: (lottery_id) => {
            return BilibiliAPI.ajax({
                url: "//api.vc.bilibili.com/lottery_svr/v1/lottery_svr/detail_by_lid",
                method: "GET",
                data: {
                    lottery_id: lottery_id,
                    csrf: csrf_token,
                }
            })
        },
        dynamic_lottery_notice: (dynamic_id) => {
            return BilibiliAPI.ajax({
                url: "//api.vc.bilibili.com/lottery_svr/v1/lottery_svr/lottery_notice",
                method: "GET",
                data: {
                    dynamic_id: dynamic_id
                }
            })
        },
        getdiscusss_dynamic: (oid) => {
            if (!oid) return
            return BilibiliAPI.ajax({ //获取热门转发评论
                url: "//api.bilibili.com/x/v2/reply/main",
                data: {
                    jsonp: 'jsonp',
                    next: 0,
                    type: 17,
                    oid: oid,
                    mode: 3,
                    _: (ts_ms() + ms_diff),
                    callback: ""
                }
            })
        },
        dynamic_history: (offset_dynamic_id) => {//自己动态首页刷新的关注的UP的动态
            return BilibiliAPI.ajax({
                url: "//api.vc.bilibili.com/dynamic_svr/v1/dynamic_svr/dynamic_history",
                method: "GET",
                data: {
                    uid: Live_info.uid,
                    offset_dynamic_id: offset_dynamic_id,
                    type_list: '268435455',
                    from: 'weball',
                    platform: 'web'
                }
            })
        },
        dynamic_new: () => {
            return BilibiliAPI.ajax({
                url: "//api.vc.bilibili.com/dynamic_svr/v1/dynamic_svr/dynamic_new",
                method: "GET",
                data: {
                    uid: Live_info.uid,
                    type_list: '268435455',
                    from: 'weball',
                    platform: 'web'
                }
            })
        },
        repost: (dynamic_id, content, ctrl) => {
            const len = content.length;
            if (len > 233) {
                content = content.slice(0, 233 - len)
            }
            return BilibiliAPI.ajax({
                method: "POST",
                url: "//api.vc.bilibili.com/dynamic_repost/v1/dynamic_repost/repost",
                data: {
                    uid: Live_info.uid,
                    dynamic_id: dynamic_id,
                    content: content,
                    at_uids: '',
                    ctrl: ctrl,
                    csrf_token: csrf_token,
                    csrf: csrf_token,
                }
            })
        },
        get_attention_list: () => {
            return BilibiliAPI.ajax({
                url: "//api.vc.bilibili.com/feed/v1/feed/get_attention_list",
                method: "GET",
                data: {
                    uid: Live_info.uid
                }
            })
        },
        get_weared_medal: () => {
            return BilibiliAPI.ajax({
                url: "//api.live.bilibili.com/live_user/v1/UserInfo/get_weared_medal",
                method: "POST",
                data: {
                    source: 1,
                    uid: Live_info.uid,
                    target_id: Live_info.room_id,
                    csrf_token: csrf_token,
                    csrf: csrf_token,
                    visit_id: ''
                }
            })
        },
        exp: () => {//投币经验
            return BilibiliAPI.ajax({
                url: "//api.bilibili.com/x/web-interface/coin/today/exp",
            })
        },
        exp_reward: () => {//经验获取情况,投币经验显示不稳定
            return BilibiliAPI.ajax({
                url: "//api.bilibili.com/x/member/web/exp/reward",
            })
        },
        coin_add: (aid) => {
            return BilibiliAPI.ajax({
                url: "//api.bilibili.com/x/web-interface/coin/add",
                method: "POST",
                data: {
                    aid: aid,
                    multiply: 1,//投币数量
                    select_like: 1,//点赞
                    cross_domain: true,
                    csrf: csrf_token
                }
            })
        },
        web_interface_card: (ruid) => {
            return BilibiliAPI.ajax({
                url: "//api.bilibili.com/x/web-interface/card",
                data: {
                    mid: ruid,
                    photo: true
                }
            })
        },
        getdiscusss: (oid) => {
            if (!oid) return
            return BilibiliAPI.ajax({ //获取屏蔽词
                url: "//api.bilibili.com/x/v2/reply/main", //https://api.bilibili.com/x/v2/reply/main?callback=jQuery33100497697415878422_1620034684747&jsonp=jsonp&next=0&type=12&oid=5293953&mode=2&plat=1&_=1620034684750 新接口？
                data: {
                    jsonp: 'jsonp',
                    next: 0,
                    type: 12,
                    oid: oid,
                    mode: 2,
                    _: (ts_ms() + ms_diff),
                    callback: ""
                }
            })
        },
        activity_lottery: {
            addtimes: (sid) => {
                return BilibiliAPI.ajax({
                    url: "//api.bilibili.com/x/activity/lottery/addtimes",
                    method: "POST",
                    data: {
                        sid: sid,
                        action_type: 3,
                        csrf: csrf_token
                    }
                })
            },
            mytimes: (sid) => {
                return BilibiliAPI.ajax({
                    url: "//api.bilibili.com/x/activity/lottery/mytimes",
                    data: {
                        sid: sid,
                    }
                })
            },
            do: (sid) => {
                return BilibiliAPI.ajax({
                    url: "//api.bilibili.com/x/activity/lottery/do",
                    method: "POST",
                    data: {
                        sid: sid,
                        type: 1,
                        csrf: csrf_token
                    }
                })
            },
        },
        new_activity_lottery: {
            addtimes: (sid, action_type = 3) => {
                return BilibiliAPI.ajax({
                    url: "//api.bilibili.com/x/lottery/addtimes",
                    method: "POST",
                    data: {
                        sid: sid,
                        action_type: action_type,
                        csrf: csrf_token
                    }
                })
            },
            mytimes: (sid) => {
                return BilibiliAPI.ajax({
                    url: "//api.bilibili.com/x/lottery/mytimes",
                    data: {
                        sid: sid,
                    }
                })
            },
            do: (sid) => {
                return BilibiliAPI.ajax({
                    url: "//api.bilibili.com/x/lottery/do",
                    method: "POST",
                    data: {
                        sid: sid,
                        type: 1,
                        csrf: csrf_token
                    }
                })
            },
        },
        activity_lottery: {
            addtimes: (sid) => {
                return BilibiliAPI.ajax({
                    url: "//api.bilibili.com/x/activity/lottery/addtimes",
                    method: "POST",
                    data: {
                        sid: sid,
                        action_type: 3,
                        csrf: csrf_token
                    }
                })
            },
            mytimes: (sid) => {
                return BilibiliAPI.ajax({
                    url: "//api.bilibili.com/x/activity/lottery/mytimes",
                    data: {
                        sid: sid,
                    }
                })
            },
            do: (sid) => {
                return BilibiliAPI.ajax({
                    url: "//api.bilibili.com/x/activity/lottery/do",
                    method: "POST",
                    data: {
                        sid: sid,
                        type: 1,
                        csrf: csrf_token
                    }
                })
            },
        },
        update_ack: (talker_id, ack_seqno) => {//私信已读1 普通私信，34预约抽奖通知
            return BilibiliAPI.ajax({
                url: "//api.vc.bilibili.com/session_svr/v1/session_svr/update_ack",
                method: "POST",
                data: {
                    talker_id: talker_id,
                    session_type: 1,
                    ack_seqno: ack_seqno,
                    build: 0,
                    mobi_app: 'web',
                    csrf_token: csrf_token,
                    csrf: csrf_token
                }
            })
        },
        get_sessions: (end_ts) => {//获取私信列表（显示最后一条私信）
            return BilibiliAPI.ajax({
                url: "//api.vc.bilibili.com/session_svr/v1/session_svr/get_sessions",
                data: {
                    session_type: 1,
                    group_fold: 1,
                    unfollow_fold: 0,
                    sort_rule: 2,
                    end_ts: end_ts,
                    build: 0,
                    mobi_app: 'web'
                }
            })
        },
        getMsg: (uid) => {//获取私信内容
            return BilibiliAPI.ajax({
                url: "//api.vc.bilibili.com/svr_sync/v1/svr_sync/fetch_session_msgs",
                data: {
                    sender_device_id: 1,
                    talker_id: uid,
                    session_type: 1,
                    size: 20,
                    build: 0,
                    mobi_app: 'web'
                }
            })
        },
        modify: (i, e, a = 11) => BilibiliAPI.ajaxWithCommonArgs({
            method: "POST",
            url: "//api.bilibili.com/x/relation/modify",
            data: {
                fid: i,
                act: e,
                re_src: a,
                jsonp: "jsonp",
                callback: ""
            }
        }),
        batch_modify: (i, e, a = 222) => BilibiliAPI.ajaxWithCommonArgs({//i:123,564,445
            method: "POST",
            url: "//api.bilibili.com/x/relation/batch/modify",
            data: {
                fids: i,
                act: e,
                re_src: a,
                jsonp: "jsonp",
                callback: ""
            }
        }),
        getInfoByUser: i => BilibiliAPI.ajax({
            url: "xlive/web-room/v1/index/getInfoByUser",
            data: {
                room_id: i
            }
        }),
        getInfoByRoom: e => BAPI.ajax({
            url: "xlive/web-room/v1/index/getInfoByRoom",
            data: {
                room_id: e
            }
        }),
        get_tags_mid: (i, e, f) => BilibiliAPI.ajax({
            url: "//api.bilibili.com/x/relation/tag",
            data: {
                mid: i,
                tagid: e,
                pn: f,
                ps: '20',
                jsonp: 'jsonp'
            }
        }),
        get_tags: () => BilibiliAPI.ajax({
            url: "//api.bilibili.com/x/relation/tags",
            data: {
                jsonp: 'jsonp',
            }
        }),
        tag_create: (i) => BilibiliAPI.ajaxWithCommonArgs({
            method: "POST",
            url: "//api.bilibili.com/x/relation/tag/create",
            type: "post",
            data: {
                tag: i,
                jsonp: 'jsonp',
                csrf: csrf_token,
            }
        }),
        tags_addUsers: (i, e) => BilibiliAPI.ajaxWithCommonArgs({
            method: "POST",
            url: "//api.bilibili.com/x/relation/tags/addUsers?cross_domain=true",
            type: "post",
            data: {
                fids: i,
                tagids: e,
                csrf: csrf_token,
            }
        }),
        wear_medal: (i) => BilibiliAPI.ajaxWithCommonArgs({
            method: "POST",
            url: "xlive/web-room/v1/fansMedal/wear",
            data: {
                medal_id: i,
            }
        }),
        link_group: {
            my_groups: () => BilibiliAPI.ajax({
                url: "link_group/v1/member/my_groups"
            }),
            sign_in: (i, e) => BilibiliAPI.ajax({
                url: "link_setting/v1/link_setting/sign_in",
                data: {
                    group_id: i,
                    owner_id: e
                }
            }),
            buy_medal: (i, e = "metal", a = "android") => BilibiliAPI.ajaxWithCommonArgs({
                method: "POST",
                url: "//api.vc.bilibili.com/link_group/v1/member/buy_medal",
                data: {
                    master_uid: i,
                    coin_type: e,
                    platform: a
                }
            })
        },
        DailyReward: {
            login: () => BilibiliAPI.x.now(),
            share: i => BilibiliAPI.x.share_add(i),
            watch: (i, e, a, t, l, r, o, n, s) => BilibiliAPI.x.heartbeat(i, e, a, t, l, r, o, n, s),

        },
        x: {
            getUserSpace: (i, e, a, t, l, r, o) => BilibiliAPI.ajax({
                url: "//api.bilibili.com/x/space/arc/search",
                data: {
                    mid: i,
                    ps: e,
                    tid: a,
                    pn: t,
                    keyword: l,
                    order: r,
                    jsonp: o
                }
            }),
            heartbeat: (i, e, a, t, l = 0, r = 0, o = 3, n = 1, s = 2) => BilibiliAPI.ajaxWithCommonArgs({
                method: "POST",
                url: "//api.bilibili.com/x/report/web/heartbeat",
                data: {
                    aid: i,
                    cid: e,
                    mid: a,
                    start_ts: t || Date.now() / 1e3,
                    played_time: l,
                    realtime: r,
                    type: o,
                    play_type: n,
                    dt: s
                }
            }),
            share_add: i => BilibiliAPI.ajaxWithCommonArgs({
                method: "POST",
                url: "//api.bilibili.com/x/web-interface/share/add",
                data: {
                    aid: i,
                    jsonp: "jsonp"
                }
            }),
            now: () => BilibiliAPI.ajax({
                url: "//api.bilibili.com/x/report/click/now",
                data: {
                    jsonp: "jsonp"
                }
            })
        },
        dynamic_svr: {
            dynamic_new: (i, e = 8) => BilibiliAPI.ajax({
                url: "dynamic_svr/v1/dynamic_svr/dynamic_new",
                data: {
                    uid: i,
                    type: e
                }
            }),
            space_history: (i, e, a, t) => BilibiliAPI.ajax({
                url: "dynamic_svr/v1/dynamic_svr/space_history",
                data: {
                    visitor_uid: i,
                    host_uid: e,
                    offset_dynamic_id: a,
                    need_top: t
                }
            })
        },
        Exchange: {
            silver2coin: (platform) => BilibiliAPI.pay.silver2coin(platform),
            silver2coin_old: (platform) => BilibiliAPI.pay.silver2coin_old(platform),
        },
        sendLiveDanmu: (msg, roomid) => {
            return BilibiliAPI.ajax({
                method: 'POST',
                url: 'msg/send',
                data: {
                    color: '4546550',
                    fontsize: '25',
                    mode: '1',
                    msg: msg,
                    rnd: (ts_s() + s_diff),
                    roomid: roomid,
                    bubble: '0',
                    csrf: csrf_token,
                    csrf_token: csrf_token,
                }
            });
        },
        watch_Video: (BV) => {
            BilibiliAPI.ajax({
                method: 'POST',
                url: '//api.bilibili.com/x/click-interface/click/web/h5',
                data: {
                    "bvid": BV,
                    "part": 1,
                    "mid": Live_info.uid,
                    "lv": 2,
                    "jsonp": "jsonp",
                    "type": 3,
                    "sub_type": 0
                }
            }).then(function (data) {
                if (data.code == 0) {
                    BilibiliAPI.ajax({
                        method: 'POST',
                        url: '//api.bilibili.com/x/click-interface/web/heartbeat',
                        data: {
                            "bvid": BV,
                            "type": 3,
                            "dt": 2,
                            "played_time": 12 + Math.ceil(Math.random() * 18),
                            "realtime": 12 + Math.ceil(Math.random() * 18),
                            "play_type": 0
                        }
                    })
                }
            });
        },
        sendLiveDanmu_dm_type: (msg, roomid) => {
            return BilibiliAPI.ajax({
                method: 'POST',
                url: 'msg/send',
                data: {
                    color: '16777215',
                    fontsize: '25',
                    mode: '1',
                    dm_type: '1',
                    msg: msg,
                    rnd: (ts_s() + s_diff),
                    roomid: roomid,
                    bubble: '0',
                    csrf: csrf_token,
                    csrf_token: csrf_token,
                }
            });
        },
        anchor_postdiscuss: (discuss, oid) => { //发送评论
            if (oid == 0) return;
            return BilibiliAPI.ajax({
                method: 'POST',
                url: '//api.bilibili.com/x/v2/reply/add',
                data: {
                    oid: oid,
                    type: '12',
                    message: discuss,
                    plat: '1',
                    ordering: 'time',
                    jsonp: 'jsonp',
                    csrf: csrf_token,
                }
            });
        },
        getCookie: (name) => {
            let arr = document.cookie.match(new RegExp("(^| )" + name + "=([^;]*)(;|$)"));
            if (arr != null)
                return unescape(arr[2]);
            return false;
        },
        sendMsg: (msg) => {
            return BilibiliAPI.ajax({
                method: "POST",
                url: "//api.vc.bilibili.com/web_im/v1/web_im/send_msg ",
                data: {
                    "msg[sender_uid]": msg.sender_uid,
                    "msg[receiver_id]": msg.receiver_id,
                    "msg[receiver_type]": msg.receiver_type,
                    "msg[msg_type]": msg.msg_type,
                    "msg[msg_status]": msg.msg_status,
                    "msg[content]": msg.content,
                    "msg[timestamp]": (ts_s() + s_diff),
                    "msg[dev_id]": msg.dev_id,
                    build: 0,
                    mobi_app: "web",
                    csrf_token: csrf_token,
                    csrf: csrf_token,
                }
            })
        },
        lottery: {
            box: {
                getRoomActivityByRoomid: (roomid) => {
                    // 获取房间特有的活动 （实物抽奖）
                    return BilibiliAPI.ajax({
                        url: 'lottery/v1/box/getRoomActivityByRoomid?roomid=' + roomid
                    });
                },
                getStatus: (aid) => {
                    // 获取活动信息/状态
                    return BilibiliAPI.ajax({
                        url: 'xlive/lottery-interface/v2/Box/getStatus',
                        data: {
                            aid: aid,
                        }
                    });
                },
                draw: (aid, number = 1) => {
                    // 参加实物抽奖
                    return BilibiliAPI.ajax({
                        url: 'xlive/lottery-interface/v2/Box/draw',
                        data: {
                            aid: aid,
                            number: number
                        }
                    });
                },
                getWinnerGroupInfo: (aid, number = 1) => {
                    // 获取中奖名单
                    return BilibiliAPI.ajax({
                        url: 'xlive/lottery-interface/v2/Box/getWinnerGroupInfo',
                        data: {
                            aid: aid,
                            number: number
                        }
                    });
                }
            },
        },
        room: {
            get_info: (room_id, from = 'room') => {
                return BilibiliAPI.ajax({
                    url: 'room/v1/Room/get_info',
                    data: {
                        room_id: room_id,
                        from: from
                    }
                });
            },
            room_entry_action: (room_id, platform = 'pc') => {
                return BilibiliAPI.ajaxWithCommonArgs({
                    method: 'POST',
                    url: 'room/v1/Room/room_entry_action',
                    data: {
                        room_id: room_id,
                        platform: platform
                    }
                });
            },
        },
        gift: {
            bag_list: () => {
                return BilibiliAPI.ajax({
                    url: '//api.live.bilibili.com/xlive/web-room/v1/gift/bag_list',
                    data: {
                        t: (ts_ms() + ms_diff),
                        room_id: Live_info.room_id
                    }
                });
            },
            bag_send: (uid, gift_id, ruid, gift_num, bag_id, biz_id, rnd, platform = 'pc', biz_code = 'Live', storm_beat_id = 0, price = 0, send_ruid = 0) => {
                return BilibiliAPI.ajaxWithCommonArgs({
                    method: 'POST',
                    url: 'xlive/revenue/v2/gift/sendBag',
                    data: {
                        uid: uid,
                        gift_id: gift_id,
                        ruid: ruid,
                        gift_num: gift_num,
                        bag_id: bag_id,
                        platform: platform,
                        biz_code: biz_code,
                        biz_id: biz_id, // roomid
                        rnd: rnd,
                        storm_beat_id: storm_beat_id,
                        metadata: '',
                        price: price,
                        send_ruid: send_ruid
                    }
                });
            },
            sendGold: (uid, gift_id, ruid, gift_num, biz_id, rnd, price) => {
                return BilibiliAPI.ajaxWithCommonArgs({
                    method: 'POST',
                    url: 'xlive/revenue/v1/gift/sendGold',
                    data: {
                        uid: uid,
                        gift_id: gift_id,
                        ruid: ruid,
                        gift_num: gift_num,
                        coin_type: 'gold',
                        bag_id: 0,
                        platform: 'pc',
                        biz_code: 'Live',
                        biz_id: biz_id, // roomid
                        rnd: rnd,
                        storm_beat_id: 0,
                        metadata: '',
                        price: price,
                        send_ruid: 0
                    }
                });
            },
        },
        live_user: {
            get_anchor_in_room: (roomid) => {
                return BilibiliAPI.ajax({
                    url: 'live_user/v1/UserInfo/get_anchor_in_room?roomid=' + roomid
                });
            },
            get_info_in_room: i => BilibiliAPI.ajax({
                url: "live_user/v1/UserInfo/get_info_in_room?roomid=" + i
            }),
        },
        pay: {
            silver2coin: (platform = 'pc') => {
                // 银瓜子兑换硬币，700银瓜子=1硬币
                return BilibiliAPI.ajaxWithCommonArgs({
                    method: 'POST',
                    url: 'xlive/revenue/v1/wallet/silver2coin',
                });
            },
            silver2coin_old: (platform = 'pc') => {
                // 银瓜子兑换硬币，700银瓜子=1硬币
                return BilibiliAPI.ajaxWithCommonArgs({
                    method: 'POST',
                    url: 'pay/v1/Exchange/silver2coin',
                    data: {
                        platform: platform
                    }
                });
            }
        },
        Lottery: {
            MaterialObject: {
                getRoomActivityByRoomid: (roomid) => BilibiliAPI.lottery.box.getRoomActivityByRoomid(roomid),
                getStatus: (aid, times) => BilibiliAPI.lottery.box.getStatus(aid, times),
                draw: (aid, number) => BilibiliAPI.lottery.box.draw(aid, number),
                getWinnerGroupInfo: (aid, number) => BilibiliAPI.lottery.box.getWinnerGroupInfo(aid, number)
            },
            anchor: {
                following_live: (i = 1) => BilibiliAPI.ajax({
                    url: "xlive/web-ucenter/user/following",
                    data: {
                        page: i,
                        page_size: 9
                    },
                }),
                awardlist: (i = 1) => BilibiliAPI.ajax({
                    url: "lottery/v1/Award/award_list",
                    data: {
                        page: i,
                        month: mm,
                    },

                }),
                getUserInfo: i => BilibiliAPI.ajax({
                    url: "User/getUserInfo?ts=" + i
                }),
                deldiscusss5: (rpid, oid) => {//5348728
                    let data = {
                        oid: oid,
                        type: 12,
                        jsonp: 'jsonp',
                        rpid: rpid,
                        csrf: csrf_token,
                    };
                    return BilibiliAPI.ajaxWithCommonArgs({
                        method: "POST",
                        url: "//api.bilibili.com/x/v2/reply/del",
                        data: data
                    })
                },
                join: (id, room_id, gift_id, gift_num) => {
                    let data = {
                        id: id,
                        platform: "pc",
                        room_id: room_id,
                        jump_from_str: '',
                        session_id: '',
                        spm_id: '444.8.interaction.anchor_draw_auto'
                    };
                    if (gift_id !== undefined && gift_num !== undefined && gift_id !== 0) {
                        data.gift_id = gift_id;
                        data.gift_num = gift_num;
                    };
                    return BilibiliAPI.ajaxWithCommonArgs({
                        method: "POST",
                        url: "xlive/lottery-interface/v1/Anchor/Join",
                        data: data
                    })
                },
                title_update: (anchor_list, room_id) => {
                    let data = {
                        room_id: room_id,
                        title: anchor_list,
                        platform: "pc",
                        csrf_token: csrf_token,
                        csrf: csrf_token,
                        visit_id: '',
                    };
                    return BilibiliAPI.ajax({
                        method: "POST",
                        url: "room/v1/Room/update",
                        data: data
                    })
                },
                description_update: (anchor_list, room_id) => {
                    let data = {
                        room_id: room_id,
                        description: anchor_list,
                        csrf_token: csrf_token,
                        csrf: csrf_token,
                    };
                    return BilibiliAPI.ajax({
                        method: "POST",
                        url: "room/v1/Room/update",
                        data: data
                    })
                },
                uid_info: (uid) => {//通过uid获取真实roomid，直播状态等
                    let data = {
                        mid: uid,
                    };
                    return BilibiliAPI.ajax({
                        method: "get",
                        url: "//api.bilibili.com/x/space/acc/info",
                        data: data
                    })
                },
                medal: (i = 1, e = 10) => BilibiliAPI.ajax({
                    url: "i/api/medal",
                    data: {
                        page: i,
                        pageSize: e
                    }
                }),
                get_home_medals: (page) => BilibiliAPI.ajax({
                    url: "fans_medal/v1/fans_medal/get_home_medals",
                    data: {
                        uid: Live_info.uid,
                        source: 2,
                        need_rank: false,
                        master_status: 0,
                        page: page
                    }
                }),
                guards: (i = 1, e = 10) => BilibiliAPI.ajax({
                    url: "xlive/web-ucenter/user/guards",
                    data: {
                        page: i,
                        page_size: e
                    }
                }),
                getFollowings: (i) => BilibiliAPI.ajax({
                    url: "xlive/web-ucenter/user/following",
                    data: {
                        page: i,
                        page_size: 9,
                    }
                }),
                getRoomBaseInfo: (i, e = "link-center") => BilibiliAPI.ajax({
                    url: "xlive/web-room/v1/index/getRoomBaseInfo",
                    data: {
                        room_ids: i,
                        req_biz: e
                    }
                }),
                AnchorRecord: (i = 1) => BilibiliAPI.ajax({
                    url: "xlive/lottery-interface/v1/Anchor/AwardRecord",
                    data: {
                        page: i,
                    }
                }),
            }
        },
    }
    init()

})()

