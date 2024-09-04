const BiliElementMap = {
    opus_dynamic: {
        interact: {
            /**
             * 分享动态弹窗
             */
            share_modal: `.bili-dyn-share__wrap`,
            /**
             * 转发富文本框内部
             */
            rich_text_area: `.bili-rich-textarea__inner`,
            /**
             * opus动态边侧点赞按钮
             */
            sidebar_like_btn: `.side-toolbar__action.like`,
            /**
             * opus动态边侧转发按钮
             */
            sidebar_forward_btn: `.side-toolbar__action.forward`,
            /**
             * 转发富文本框
             */
            repost_input_text_area: `.bili-rich-textarea`,
            /**
             * opus动态边侧点赞按钮是否激活
             */
            sidebar_like_btn_is_active: `.side-toolbar__action.like.is-active`,
            old_like_btn_is_active: `.bili-dyn-action.like.active`,
            /**
             * opus动态转发modal点击转发按钮
             */
            repost_btn: `.bili-dyn-share-publishing__action.launcher`,
            /**
             * opus动态评论富文本框
             */
            reply_box_text_area: `.reply-box-textarea,>>>textarea[id='input']`,
            reply_send_btn: `.send-text,>>>#pub>button`,
            reply_user_icon: `.user-name,>>>#user-name > a`,
            comment_thumb_btn: `.reply-like,>>>#like`,
            comment_thumb_btn_is_active: `.svg-icon.liked.use-color.like-icon.liked,>>>bili-icon[icon='BDC/hand_thumbsup_fill/1']`,
            t_dynamic_publish_btn: `.bili-dyn-publishing__action.launcher`,
            t_dynamic_publish_confirm_btn: `.bili-dyn-specification-popup__btn.bili-button.primary.bili-button--medium`,
            dynamic_error_pic: `.error-container`,
            follow_btn: `.h-f-btn.h-follow, .h-f-btn.h-follow-oldfan`,
        },
        captcha: {
            comment_captcha: `.comment-captcha`,
        },
        video: {
            /**
             * 视频页面播放器元素
             */
            player: `.bpx-player-video-area`,
            sanlian_btn: `.video-coin.video-toolbar-left-item`,
            sanlian_btn_active: `.video-coin.video-toolbar-left-item.on`,
            coin_btn: `.mc-box.left-con`,
            coin_btn_active: `.coin-bottom>.bi-btn`,
            share_btn_hover: `#share-btn-outer`,
            share_btn: `.share-btn`,
            share_iframe_editor_textarea: `#editor`,
            share_btn_clickable: `.share-btn.clickable`,
            share_iframe: `iframe[name="dynmic-share"]`
        },
        dynamic_attach_card: {
            charge_card: `.bili-dyn-upower-lottery__title.bili-ellipsis`,
        },
        homepage: {
            /**
             * 主站首页的视频链接元素
             */
            video_card: `.bili-video-card.is-rcmd>div.bili-video-card__wrap.__scale-wrap>a[href]`,
            video_fresh_btn: `.primary-btn`,
            huanyihuan_caozuo_btn: `.bilifont.bili-icon_caozuo_huanyihuan`,
        }
    },
    live_page: {
        dm_send_btn: ".bl-button--primary.bl-button--small", //发送弹幕按钮
        dm_input_box: ".chat-input.border-box", //弹幕输入框
        like_btn: ".like-btn",
        anchor_icon: ".anchor-lot-icon",
        anchor_join_btn: `[class*="join-btn-"]`,
        contribution_btn: ".switch-btn-bg.live-skin-highlight-bg", //贡献值下拉框按钮
        gift_package: ".gift-control-section .gift-package", //包裹按钮
        gift_item_free: ".gift-item.package.free",
        live_room_treasurebox: {
            round_item: ".round-item", // 金宝箱侧边栏
            join_btn: ".bl-button.bl-button--primary", //参加金宝箱按钮
        },
        rightArrow_btn: ".pointer.arrow-box", //直播的功能展开箭头
        live_player: `#live-player-ctnr`, //直播播放器！
    },
    url_path: {
        main: {
            main_site: `https://www.bilibili.com/`
        },
        user: {
            nav: `x/web-interface/nav`,
            relation_modify: `x/relation/modify`,
            msg_unread: `msgfeed/unread`,
            msg_whisper: `https://message.bilibili.com/?spm_id_from=333.1007.0.0#/whisper`,
            msg_session_svr_get_session:`https://api.vc.bilibili.com/session_svr/v1/session_svr/get_sessions`,
            msg_session_svr_fetch_session_msgs:`https://api.vc.bilibili.com/svr_sync/v1/svr_sync/fetch_session_msgs`,
            home: `https://account.bilibili.com/account/home`,
            login: `https://passport.bilibili.com/pc/passport/login`
        },
        opus_dynamic: {
            opus_link: `www.bilibili.com/opus`,
            dynamic_like_thumb: `dynamic_like/v1/dynamic_like/thumb`,
            dynamic_reply_add: `reply/add`,
            dynamic_detail: `x/polymer/web-dynamic/v1/detail?`,
            create_dynamic: `x/dynamic/feed/create/dyn`,
            dynamic_repost: `dynamic_repost/reply`,
            /**
             * 回复评论
             */
            dynamic_reply: `x/v2/reply/add`,
            /**
             * 动态评论区
             */
            dynamic_reply_main: `x/v2/reply/main`,
            dynamic_reply_main_wbi: `x/v2/reply/wbi/main`,
            article: `read/cv`
        },
        space: {
            reservation: `space/reservation`,
            message: `https://message.bilibili.com/?spm_id_from=333.1007.0.0#/love`,
        },
        live: {
            anchor: {
                join: "/Anchor/Join",
            },
        }
    },
    log_record: {
        opus_dynamic: {
            //region 重要错误，算作执行失败！
            err: {
                like: {
                    dynamic_like_fail: `\u200b动态点赞失败`,
                    dynamic_like_icon_fail: `\u200b动态点赞图标获取失败`,
                },
                comment: {
                    dynamic_comment_kami_kakushi_fail: `\u200b动态评论失败，评论被隐藏，评论被阿瓦隆干掉了~~`,
                    dynamic_comment_fail: `\u200b动态评论失败`,
                    dynamic_comment_captcha_fail: `\u200b动态评论失败，需要验证码`,
                    comment_msg_error: `\u200b动态评论内容出错`,
                    comment_msg_input_error: `\u200b动态评论内容输入出错`,
                    comment_repost_dynamic_with_content_fail: `\u200b评论转发失败`,
                    comment_msg_empty: `\u200b评论获取失败，评论内容为空`,
                    comment_msg_content_error: `\u200b回复内容出错`,
                    reply_response_timeout: `\u200b动态评论失败，获取评论响应失败`,
                    comment_msg_generate_fail: `\u200b生成评论失败，需要人工回复的动态`,
                },
                repost: {
                    dynamic_repost_fail: `\u200b动态转发失败`,
                    dynamic_fast_repost_fail: `\u200b快速动态转发失败`,
                    dynamic_repost_content_input_fail: `\u200b动态转发失败，转发内容输入失败`,
                    official_lottery_switch_off: `\u200b未开启官方抽奖`
                },
                follow: {
                    follow_up_fail: `\u200b点击关注up失败`,
                },
                common: {
                    get_dynamic_info_fail: `\u200b获取动态详情失败`,
                    get_dynamic_content_fail: `\u200b获取到的动态内容为空`,
                    unknown_url_tab: `\u200b未知tab类型`,
                    unknown_do_dynamic_lottery_error: `\u200b动态抽奖函数发生未知错误，不可避免！`
                }
            },
            //endregion

            //region 一般错误或日志，不影响执行
            comment_thumb_fail: `\u200b评论点赞失败`,
            not_enough_comment_count: `\u200b评论人数过少，需要人工判断`,
            repost_dynamic: `\u200b单转发执行成功`,
            comment_dynamic: `\u200b单评论执行成功`,
            thumb_dynamic: `\u200b单点赞执行成功`,
            only_comment_dynamic: `\u200b无需评论动态`,
            //endregion

        },
        //region 超重大级错误，直接退出抽奖的那种！
        critical_error: {
            account_logout: `\u200b账号未登录或被强制登出`,
            lottery_loop_single_fail: `\u200blottery_loop执行单条任务失败`,
            dynamic_lottery_fail: `\u200b动态转发抽奖失败`,
            goto_page_fail: `\u200b前往页面失败`,
        },
        //endregion
        //region 算作成功，但是有些需要人工判断
        succ_info: { // 抽奖成功的反馈信息
            lot_succ: `\u200b抽奖成功！`,
            past_official_lot: `\u200b过期的官方抽奖`,
            thumbed_dynamic: `\u200b点过赞的动态`,
            manual_reply: `\u200b需要人工回复的动态`,
            manual_reply_non_lottery_up: `\u200b包含非抽奖up，需要人工回复的动态`,
            _404_dynamic: `\u200b404动态`,
            follow_up_fail_banned_by_up: `\u200b点击关注up失败，被拉黑了，不抽`,
        },
        //endregion
    },
    browser_usage: {
        lottery: `lottery`,
        follow_up: `关注up主`,
        daily_task: `每日任务`,
        useless: `无用`,
        unfollow: `取关`,
        live_lottery: `直播抽奖`,
    }
}
Object.freeze(BiliElementMap)
module.exports = {BiliElementMap}