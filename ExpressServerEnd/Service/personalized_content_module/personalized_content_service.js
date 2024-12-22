const {base_api_model} = require("@/ExpressServerEnd/Model/base_model/base_model");
const yaml = require('js-yaml');
const config = require('@/ExpressServerEnd/config/index');
const {UserPersonalContentDao} = require("@/ExpressServerEnd/DAO/UserPersonalContentDao");
const {UserService} = require("@/ExpressServerEnd/Service/user_module/user_service");
const {t} = require("@/ExpressServerEnd/Tool/Utl");
const {UserActModel} = require("@/ExpressServerEnd/Model/api/v1/user/user_act_model");

const type_arr = [1] //目前允许创建的内容type
const PersonalizedContentType = {
    markdown_article: {
        type: 1,
        result_data_name: "markdown_article_detail",
        origin_data_name: "TPersonalizedContentType1"
    }
}

class PersonalizedContentService {
    #CommentRespPropMap = {
        "mid_TUserInfo": "member",
        "root_TComments": "replies",
        "TUserLevel": "level_info",
        "TUserVip": "vip",
    }

    /**
     *
     * @param el {Model}
     * @return {*}
     * @private
     */
    _process_ret_comment(el) {
        let _ = el.toJSON();
        _.mid_TUserInfo = _.mid_TUserInfo.TUserDetail;
        _.replies = _.root_TComments.map(__ => {
            __.mid_TUserInfo = __.mid_TUserInfo.TUserDetail;
            return __
        })
        return _
    }

    replace_key_name(data_model, data_type) {
        let data = data_model.toJSON();
        switch (data_type) {
            case PersonalizedContentType.markdown_article.type:
                let {
                    [PersonalizedContentType.markdown_article.origin_data_name]: data_val,
                    ...rest
                } = data;
                return {
                    ...rest,
                    [PersonalizedContentType.markdown_article.result_data_name]: data_val
                }
        }
    }

    /**
     *
     * @param mid
     * @param title
     * @param content
     * @param desc
     * @param type
     * @param req
     * @param resp
     * @return {Promise<string|string|*|null>}
     */
    async add_personalized_content({
                                       mid,
                                       title,
                                       content,
                                       desc,
                                       type,
                                       req, resp
                                   }) {
        switch (type) {
            case PersonalizedContentType.markdown_article.type:
                let ip_act_info = await UserService.add_user_act_ip_info({
                    req,
                    resp,
                    act_info: UserActModel.add_personal_content
                })
                const result = await UserPersonalContentDao.add_markdown_article({
                    mid,
                    title,
                    content,
                    desc,
                    type,
                    ip_info_id: ip_act_info.pk,
                });
                return new base_api_model({
                    code: 0,
                    data: {
                        rid: result.rid
                    },
                    msg: '创建成功'
                })
            default:
                return new base_api_model({
                    code: 12001,
                    data: null,
                    msg: '未知类型！'
                })
        }
    }

    async get_personalized_content_model({
                                             content_id,
                                             oid,
                                             type
                                         }) {
        if (content_id) {
            return await UserPersonalContentDao.get_content_by_content_id({content_id})
        }
        switch (type) {
            case PersonalizedContentType.markdown_article.type:
                return await UserPersonalContentDao.get_markdown_article({oid, type})
            default:
                return null
        }
    }

    async get_personalized_content({
                                       content_id,
                                       oid,
                                       type
                                   }) {
        let data = await this.get_personalized_content_model({content_id, oid, type});
        if (!data) return new base_api_model({
            code: 4100024,
            msg: "无内容！",
            data: null
        })
        return new base_api_model({
            code: 0,
            data: this.replace_key_name(data, data.type),
        })
    }

    async add_comment({
                          oid,
                          type,
                          root,
                          parent,
                          mid,
                          reply_content,
                          user_act_info_pk = null
                      }) {
        let data = await this.get_personalized_content_model({
            oid, type
        })

        root = String(root) === '0' ? null : root;
        parent = String(parent) === '0' ? null : parent;
        if (!data) return new base_api_model({
            code: 4100023,
            msg: "待回复的资源不存在！",
            data: null
        })
        let root_comment;
        let parent_comment;
        if (root || parent) {
            root_comment = await UserPersonalContentDao.get_single_comment_by_rpid({rpid: root});
            parent_comment = root === parent ? root_comment : await UserPersonalContentDao.get_single_comment_by_rpid({rpid: parent});
            if (!(root_comment || parent_comment)) return new base_api_model({
                code: 4100025,
                msg: "待回复的评论不存在！",
                data: null
            })
            if (parent_comment && parent_comment.root !== root_comment.rpid) {
                return new base_api_model({
                    code: 4100026,
                    msg: "评论层级错误！",
                    data: null
                })
            }
        }
        let created_comment = await UserPersonalContentDao.add_comment({
            rid: data.content_id, root, parent, mid, reply_content, ip_info_id: user_act_info_pk
        });
        if (root_comment) {
            await root_comment.increment('rcount', {by: 1});
        }

        let created_comment_all_data = await UserPersonalContentDao.get_content_comment_by_rpid({rpid: created_comment.rpid});
        let created_comment_json = t.renameKeys(this._process_ret_comment(created_comment_all_data), this.#CommentRespPropMap)
        return new base_api_model({
            code: 0,
            data: created_comment_json,
            msg: "评论成功！"
        })
    }

    /**
     *
     * @param mid
     * @param oid
     * @param type
     * @param page_size
     * @param page_num
     * @param order_by {"hot"|"time"}
     * @return {Promise<base_api_model<{
     *   assist: number
     *   content: string
     *   count: number //二级评论条数
     *   ctime: number //秒级回复
     *   dislike: number | string
     *   like: number | string
     *   member: {
     *      avatar: string
     *      level_info: {current_exp: number
     *              current_level: number
     *              current_min: number
     *              next_exp: number}
     *      mid: number
     *      uname: string
     *      sign: string
     *      sex: string
     *      vip: {
     *          vip_due_date: number // 秒级时间戳
     *          vip_pay_type: number
     *          vip_status: number
     *          vip_type: number
     *          }
     *   }
     *   mid: number
     *   rid: number | string // 视频或者动态的id
     *   rpid: number | string // 评论的主键id
     *   root: number | string // 根回复的主键id，也就是哪条回复底下的
     *   parent: number | string //回复的评论的rpid
     *   rcount: number | string //回复评论条数
     *   up_action: {
     *     like: boolean
     *     reply: boolean
     *   }
     *   replies: self[]
     * }>
     * >}
     */
    async get_content_comments_by_oid_type({
                                               mid = 0,
                                               oid = 0,
                                               type = 0,
                                               page_size = 10,
                                               page_num = 1,
                                               order_by = 'hot'
                                           }) {
        let {count, rows, top_rows} = await UserPersonalContentDao.get_comments_main_with_user_info_by_oid_type({
            mid,
            oid,
            type,
            page_size,
            page_num,
            order_by: order_by === 'hot' ? 'like' : 'ctime'
        });

        let process_rows = t.renameKeys(rows.map(el => this._process_ret_comment(el)), this.#CommentRespPropMap);
        let processed_top_rows = t.renameKeys(top_rows.map(el => this._process_ret_comment(el)), this.#CommentRespPropMap);
        return new base_api_model({
            code: 0,
            data: {
                total_num: count,
                cur_page: typeof page_num === "string" ? parseInt(page_num) : page_num,
                replies: process_rows,
                top_replies: processed_top_rows
            },
            msg: "获取评论成功！"
        })
    }

    /**
     * 执行点赞或者点踩的互动
     * @param rpid
     * @param mid
     * @param action
     * @param user_act_info_pk
     * @return {Promise<base_api_model>}
     */
    async add_comment_like_dislike({
                                       rpid,
                                       mid,
                                       action,
                                       user_act_info_pk = null
                                   }) {
        if (![0, 1, 2].includes(action)) {
            return new base_api_model({
                code: 400,
                data: null,
                msg: "未知action类型",
            })
        }
        let comment = await UserPersonalContentDao.get_single_comment_by_rpid({rpid})
        if (!comment) {
            return new base_api_model({
                code: 4100024,
                msg: "无内容！",
                data: null
            })
        }
        let origin_comment_like_dislike_state = await UserPersonalContentDao.get_comment_like_dislike({
            rpid,
            mid,
        })
        let [instance, created] = await UserPersonalContentDao.add_comment_like_dislike({
            rpid,
            mid,
            action,
            ip_info_id: user_act_info_pk
        })
        if (origin_comment_like_dislike_state?.action !== instance.action) {
            switch (instance.action) {
                case 0:// 取消点赞或者取消点踩
                    if (origin_comment_like_dislike_state?.action === 0 || !origin_comment_like_dislike_state) { //未操作状态
                    } else if (origin_comment_like_dislike_state.action === 1) {
                        await comment.decrement('like', {by: 1})
                    } else if (origin_comment_like_dislike_state.action === 2) {
                        await comment.decrement('dislike', {by: 1})
                    }
                    break;
                case 1:// 执行点赞
                    if (origin_comment_like_dislike_state?.action === 0 || !origin_comment_like_dislike_state) { //未操作状态
                        await comment.increment('like', {by: 1})
                    } else if (origin_comment_like_dislike_state.action === 1) {
                    } else if (origin_comment_like_dislike_state.action === 2) {
                        await comment.decrement('dislike', {by: 1})
                        await comment.increment('like', {by: 1})
                    }
                    break;
                case 2:// 执行点踩
                    if (origin_comment_like_dislike_state?.action === 0 || !origin_comment_like_dislike_state) { //未操作状态
                        await comment.increment('dislike', {by: 1})
                    } else if (origin_comment_like_dislike_state.action === 1) {
                        await comment.decrement('like', {by: 1})
                        await comment.increment('dislike', {by: 1})
                    } else if (origin_comment_like_dislike_state.action === 2) {
                    }
                    break;
            }
        }
        return new base_api_model({
            code: 0,
            data: null,
            msg: `${action === 1 ? "点赞" : action === 0 ? "取消" : "点踩"}成功！`
        })
    }

    async delete_comment({
                             oid, type, rpid, uid
                         }) {
        let data = await this.get_personalized_content_model({
            oid, type
        });
        if (!data) return new base_api_model({
            code: 4100027,
            msg: "无效oid和type，评论删除失败！",
            data: null
        })
        let comment = await UserPersonalContentDao.get_single_comment_by_rpid({rpid})
        if (!comment) return new base_api_model({
            code: 4100028,
            msg: "无效评论rpid，评论删除失败！",
            data: null
        });
        if (String(comment.uid) !== String(uid)) return new base_api_model({
            code: 4100029,
            msg: "非自己评论无法删除，评论删除失败！",
            data: null
        });
        await comment.destroy();
        return new base_api_model({
            code: 0,
            data: null,
            msg: "评论删除成功！"
        });
    }
}

personalized_content_service = new PersonalizedContentService()
module.exports = {personalized_content_service}