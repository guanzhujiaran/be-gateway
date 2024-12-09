const {Op} = require("sequelize");
const {
    TComment
} = require("@/ExpressServerEnd/DAO/SqlHelper");
const {t} = require("@/ExpressServerEnd/Tool/Utl");

class UserCommentDao {

    /**
     *
     * @param uid
     * @param oid
     * @param type
     * @return {Promise<TComment|undefined>}
     */
    static get_latest_comment = async ({uid, oid, type}) => {
        return (await TComment.findOne({
            where: {
                mid: uid,
                oid: oid,
                type: type,
            }
        }))?.toJSON()
    }
    /**
     * {"code":0,"message":"0","ttl":1,"data":{"need_captcha":false,"url":"","success_action":0,"success_toast":"发送成功","success_animation":"","rpid":247976556305,"rpid_str":"247976556305","dialog":247976556305,"dialog_str":"247976556305","root":246074423681,"root_str":"246074423681","parent":246074423681,"parent_str":"246074423681","reply":{"rpid":247976556305,"oid":113429817856264,"type":1,"mid":4237378,"root":246074423681,"parent":246074423681,"dialog":247976556305,"count":0,"rcount":0,"state":0,"fansgrade":0,"attr":0,"ctime":1732852776,"mid_str":"4237378","oid_str":"113429817856264","rpid_str":"247976556305","root_str":"246074423681","parent_str":"246074423681","dialog_str":"247976556305","like":0,"action":0,"member":{"mid":"4237378","uname":"后藤波奇","sex":"男","sign":"天空一声巨响，阿光闪亮登场~ -A*Fun弹幕视频网-认真你就输啦(・ω・)ノ-(゜-゜)つロ","avatar":"https://i0.hdslb.com/bfs/baselabs/c5635c08f60a78beaa42215ecae3d5f569bd7c04.png","rank":"10000","face_nft_new":1,"is_senior_member":0,"senior":{"status":4},"level_info":{"current_level":6,"current_min":0,"current_exp":0,"next_exp":0},"pendant":{"pid":5393,"name":"雫るる","image":"https://i1.hdslb.com/bfs/garb/item/21e72a6812371baf9729dba58864780d33deb557.png","expire":0,"image_enhance":"https://i1.hdslb.com/bfs/garb/item/21e72a6812371baf9729dba58864780d33deb557.png","image_enhance_frame":"","n_pid":5393},"nameplate":{"nid":88,"name":"十年大会员","image":"https://i2.hdslb.com/bfs/face/5b04cc2fb1c479874cac145eb7ac7098a1e081d9.png","image_small":"https://i1.hdslb.com/bfs/face/b44b390de6b68a9ac7087b3bef07ad90a46101c4.png","level":"稀有勋章","condition":"累计开通大会员总时长\u003e=10年即可获得"},"official_verify":{"type":-1,"desc":""},"vip":{"vipType":2,"vipDueDate":1927036800000,"dueRemark":"","accessStatus":0,"vipStatus":1,"vipStatusWarn":"","themeType":0,"label":{"path":"","text":"十年大会员","label_theme":"ten_annual_vip","text_color":"#FFFFFF","bg_style":1,"bg_color":"#FB7299","border_color":"","use_img_label":true,"img_label_uri_hans":"","img_label_uri_hant":"","img_label_uri_hans_static":"https://i0.hdslb.com/bfs/vip/adb599797dd171e2d3d6d012f448b49679258344.png","img_label_uri_hant_static":"https://i0.hdslb.com/bfs/activity-plat/static/20220614/e369244d0b14644f5e1a06431e22a4d5/sGu57N6pgK.png"},"avatar_subscript":1,"nickname_color":"#FB7299"},"fans_detail":null,"user_sailing":{"pendant":{"id":5393,"name":"雫るる","image":"https://i0.hdslb.com/bfs/garb/item/21e72a6812371baf9729dba58864780d33deb557.png","jump_url":"","type":"suit","image_enhance":"https://i0.hdslb.com/bfs/garb/item/21e72a6812371baf9729dba58864780d33deb557.png","image_enhance_frame":""},"cardbg":{"id":68028,"name":"奈奈莉娅伶俐集-勋章","image":"https://i0.hdslb.com/bfs/garb/open/abe6f208b1b4a0ae5f2571c3485716f52f700def.png","jump_url":"https://www.bilibili.com/h5/mall/digital-card/home?act_id=101820\u0026from=reply\u0026f_source=garb\u0026-Abrowser=live\u0026hybrid_set_header=2\u0026navhide=1\u0026anchor_task=1","fan":{"is_fan":1,"number":87,"color":"#BFC8D2","name":"","num_desc":"000087","num_prefix":"CD.","color_format":{"start_point":"0,0","end_point":"100,100","colors":["#B8C7D0FF","#A2A7B0FF"],"gradients":[0,100]}},"type":"collect_card","image_group":null},"cardbg_with_focus":null},"user_sailing_v2":{"pendant":{"id":5393,"name":"雫るる","image":"https://i0.hdslb.com/bfs/garb/item/21e72a6812371baf9729dba58864780d33deb557.png","type":"suit","image_enhance":"https://i0.hdslb.com/bfs/garb/item/21e72a6812371baf9729dba58864780d33deb557.png"},"card_bg":{"id":68028,"name":"奈奈莉娅伶俐集-勋章","image":"https://i0.hdslb.com/bfs/garb/open/abe6f208b1b4a0ae5f2571c3485716f52f700def.png","jump_url":"https://www.bilibili.com/h5/mall/digital-card/home?act_id=101820\u0026from=reply\u0026f_source=garb\u0026-Abrowser=live\u0026hybrid_set_header=2\u0026navhide=1\u0026anchor_task=1","fan":{"is_fan":1,"number":87,"color":"#BFC8D2","num_desc":"000087","num_prefix":"CD.","color_format":{"start_point":"0,0","end_point":"100,100","colors":["#B8C7D0FF","#A2A7B0FF"],"gradients":[0,100]}},"type":"collect_card"}},"is_contractor":false,"contract_desc":"","nft_interaction":{"itype":"cheer_alone","metadata_url":"https://i0.hdslb.com/bfs/baselabs/c7b3d550759d9929f51d4f49227814b3c3cc79f0.plain","nft_id":"MTQ1MTpqVGFqOjg","region":{"type":1,"icon":"https://i0.hdslb.com/bfs/activity-plat/static/20220506/334553dd7c506a92b88eaf4d59ac8b4d/j8AeXAkEul.gif","show_status":1}},"avatar_item":{"container_size":{"width":1.8,"height":1.8},"fallback_layers":{"layers":[{"visible":true,"general_spec":{"pos_spec":{"coordinate_pos":2,"axis_x":0.9,"axis_y":0.9},"size_spec":{"width":0.94,"height":0.94},"render_spec":{"opacity":1}},"layer_config":{"tags":{"AVATAR_LAYER":{},"GENERAL_CFG":{"config_type":1,"general_config":{"web_css_style":{"borderRadius":"50%"}}}},"is_critical":true},"resource":{"res_type":3,"res_image":{"image_src":{"src_type":1,"placeholder":6,"remote":{"url":"https://i0.hdslb.com/bfs/baselabs/c5635c08f60a78beaa42215ecae3d5f569bd7c04.png","bfs_style":"widget-layer-avatar"}}}}},{"visible":true,"general_spec":{"pos_spec":{"coordinate_pos":2,"axis_x":0.9,"axis_y":0.9},"size_spec":{"width":1.65,"height":1.65},"render_spec":{"opacity":1}},"layer_config":{"tags":{"PENDENT_LAYER":{}}},"resource":{"res_type":3,"res_image":{"image_src":{"src_type":1,"remote":{"url":"https://i1.hdslb.com/bfs/garb/item/21e72a6812371baf9729dba58864780d33deb557.png","bfs_style":"widget-layer-avatar"}}}}},{"visible":true,"general_spec":{"pos_spec":{"coordinate_pos":1,"axis_x":1.0450000000000002,"axis_y":1.0616666666666668},"size_spec":{"width":0.41666666666666663,"height":0.41666666666666663},"render_spec":{"opacity":1}},"layer_config":{"tags":{"GENERAL_CFG":{"config_type":1,"general_config":{"web_css_style":{"background-color":"rgb(255,255,255)","border":"2px solid rgba(255,255,255,1)","borderRadius":"50%","boxSizing":"border-box"}}},"ICON_LAYER":{}}},"resource":{"res_type":4,"res_animation":{"webp_src":{"src_type":1,"placeholder":5,"remote":{"url":"https://i0.hdslb.com/bfs/activity-plat/static/20220506/334553dd7c506a92b88eaf4d59ac8b4d/j8AeXAkEul.gif","bfs_style":"widget-layer-avatar"}}}}}],"is_critical_group":true},"mid":"4237378"}},"content":{"message":"都是ikun","members":[],"jump_url":{},"max_line":6},"replies":null,"assist":0,"up_action":{"like":false,"reply":false},"invisible":false,"reply_control":{"max_line":6,"location":"IP属地：上海"},"folder":{"has_folded":false,"is_folded":false,"rule":""},"dynamic_id_str":"0","note_cvid_str":"0","track_info":""}}}
     * {"code":12006,"message":"没有该评论","ttl":1,"data":null}
     * {"code":12051,"message":"重复评论，请勿刷屏","ttl":1,"data":{"need_captcha":false,"url":"","success_action":0,"success_toast":"","success_animation":"","rpid":0,"rpid_str":"","dialog":0,"dialog_str":"","root":0,"root_str":"","parent":0,"parent_str":"","reply":null}}
     * @param mid
     * @param content
     * @param oid
     * @param type
     * @param root
     * @param parent
     * @return {Promise<*>}
     */
    static add_comment = async ({
                                    mid,
                                    content,
                                    oid,
                                    type,
                                    root,
                                    parent,
                                }) => {
        let ctime = t.now_s();
        let rpid = t.comment_rpid_snowflake_gen.NextId();
        return await TComment.create(Object.assign({}, ...arguments, {ctime}, {rpid}))
    }

    static get_comment_by_rpid = async ({rpid}) => {
        return (await TComment.findOne({
            where: {
                rpid
            }
        }))?.toJSON()
    }

    static del_comment_by_rpid = async ({rpid}) => {
        return (await TComment.update(
                {
                    is_deleted: true
                },
                {
                    where: {
                        rpid: rpid,
                    }
                }
        )
    )?.
        toJSON()
    }

}

module.exports = {
    UserCommentDao
}