const BiliElementMap = {
    opus_dynamic: {
        interact: {
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
            reply_box_text_area: `.reply-box-textarea`,
            reply_send_btn: `.send-text`,
            reply_user_icon: `.user-name`,
            comment_thumb_btn: `.reply-like`,
            comment_thumb_btn_is_active: `.svg-icon.liked.use-color.like-icon.liked`,
            t_dynamic_publish_btn: `.bili-dyn-publishing__action.launcher`,
            t_dynamic_publish_confirm_btn: `.bili-dyn-specification-popup__btn.bili-button.primary.bili-button--medium`,
            dynamic_error_pic: `.error-container`,
        },
        response: {
            wait_comment_response_failed: `检查是否评论被风控时未获取到响应`,
            _404_dynamic: `404动态`

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
            share_btn_clickable: `.share-btn.clickable`

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
    url_path: {
        user: {
            nav: `x/web-interface/nav`,
            relation_modify: `x/relation/modify`,
            msg_unread: `msgfeed/unread`,
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

        },
        space: {
            reservation: `space/reservation`,

        }
    },
    log_record: {
        opus_dynamic: {
            dynamic_like_fail: `动态点赞失败`,
            dynamic_like_icon_fail: `动态点赞图标获取失败`,
            dynamic_comment_kami_kakushi_fail: `动态评论失败，评论被隐藏`,
            dynamic_comment_fail: `动态评论失败`,
            dynamic_repost_fail: `动态转发失败`,
            dynamic_fast_repost_fail: `快速动态转发失败`,
            dynamic_repost_content_input_fail: `动态转发失败，转发内容输入失败`,
            dynamic_comment_captcha_fail: `动态评论失败，需要验证码`,
            dynamic_only_comment_fail: `评论动态失败`,
            comment_msg_error: `动态评论内容出错`,
            comment_msg_input_error: `动态评论内容输入出错`,
            comment_thumb_fail: `评论点赞失败`,
            comment_repost_dynamic_with_content_fail: `评论转发失败`,
            comment_msg_empty: `评论获取失败，评论内容为空`,
            comment_msg_generate_fail: `生成评论失败，需要人工回复的动态`,
            comment_msg_content_error: `回复内容出错`,
            follow_up_fail: `点击关注up失败`,
            follow_up_fail_banned_by_up: `点击关注up失败，被拉黑了，不抽`,
            get_dynamic_info_fail: `获取动态详情失败`,
            not_enough_comment_count: `评论人数过少，需要人工判断`,
            get_dynamic_content_fail: `获取到的动态内容为空`,
            unknown_url_tab: `未知tab类型`,
            unknown_do_dynamic_lottery_error: `动态抽奖函数发生未知错误，不可避免！`,
        },
        critical_error: {
            account_logout: `账号未登录或被强制登出`,
            lottery_loop_single_fail: `lottery_loop执行单条任务失败`,
            dynamic_lottery_fail: `动态转发抽奖失败`
        },
        succ_info: { // 抽奖成功的反馈信息
            only_comment_dynamic: `无需评论动态`,
            past_official_lot: `过期的官方抽奖`,
            thumbed_dynamic: `点过赞的动态`,
            manual_reply: `需要人工回复的动态`,
            manual_reply_non_lottery_up:`包含非抽奖up，需要人工回复的动态`,
            _404_dynamic: `404动态`,
            repost_dynamic:`单转发执行成功`,
            comment_dynamic:`单评论执行成功`
        },
        response: {
            reply_response_timeout: `动态评论失败，获取评论响应失败`,
        },

    },
    browser_usage: {
        lottery: `lottery`,
        follow_up: `关注up主`
    }
}
Object.freeze(BiliElementMap)
module.exports = {BiliElementMap}