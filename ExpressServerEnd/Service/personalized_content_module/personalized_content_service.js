const {UserModel} = require("@/ExpressServerEnd/Model/api/v1/user/user_model");
const {base_api_model} = require("@/ExpressServerEnd/Model/base_model/base_model");
const yaml = require('js-yaml');
const config = require('@/ExpressServerEnd/config/index');
const {utils} = require("@/ExpressServerEnd/BiliPPTR/utils/utils");
const {UserPersonalContentDao} = require("@/ExpressServerEnd/DAO/UserPersonalContentDao");
const type_arr = [1] //目前允许创建的内容type
const PersonalizedContentType = {
    markdown_article: {
        type: 1,
        data_type_name: "markdown_article_detail"
    }
}

class PersonalizedContentService {
    static _trans_personalized_content_2_response(data, data_type) {
        let {
            TPersonalizedContentType1,
            ...rest
        } = data;
        return new base_api_model({
            code: 0,
            data: {
                ...rest,
                [data_type]: TPersonalizedContentType1
            },
            msg: '获取成功'
        })
    }

    static async add_personalized_content({
                                              mid,
                                              title,
                                              content,
                                              desc,
                                              type
                                          }) {
        switch (type) {
            case PersonalizedContentType.markdown_article.type:
                const result = await UserPersonalContentDao.add_markdown_article({
                    mid,
                    title,
                    content,
                    desc,
                    type
                });
                return new base_api_model(
                    {
                        code: 0,
                        data: {
                            rid: result.rid
                        },
                        msg: '创建成功'
                    }
                )
            default:
                return new base_api_model(
                    {
                        code: 12001,
                        data: null,
                        msg: '未知类型！'
                    }
                )
        }
    }

    static async get_personalized_content({
                                              content_id,
                                              oid,
                                              type
                                          }) {
        if (content_id) {
            let da = (await UserPersonalContentDao.get_content_by_content_id({content_id}))?.toJSON();
            if (!da) return new base_api_model({
                code: 4100024,
                msg: "无内容！",
                data: null
            })
            return PersonalizedContentService._trans_personalized_content_2_response(da, PersonalizedContentType.markdown_article.data_type_name)
        }
        switch (type) {
            case PersonalizedContentType.markdown_article.type:
                let da = (await UserPersonalContentDao.get_markdown_article({oid, type}))?.toJSON();
                if (!da) return new base_api_model({
                    code: 4100024,
                    message: "无内容！",
                    data: null
                })
                return PersonalizedContentService._trans_personalized_content_2_response(da, PersonalizedContentType.markdown_article.data_type_name)
            default:
                return new base_api_model({
                    code: 12001,
                    message: "未知类型！",
                    data: null
                })
        }
    }

    /**
     * 需要确保 reply_content rid 不为空
     * @param rid
     * @param root
     * @param parent
     * @param mid
     * @param reply_content
     * @return {Promise<base_api_model>}
     */
    static async add_comment({
                                 rid,
                                 root,
                                 parent,
                                 mid,
                                 reply_content
                             }) {

        let content = await UserPersonalContentDao.get_content_by_content_id({content_id: rid});
        if (!content) return new base_api_model({
                code: 4100023,
                msg: "待回复的资源不存在！",
                data: null
            }
        );
        if (root || parent) {
            let root_comment = await UserPersonalContentDao.get_comment_by_rpid({rpid: root});
            let parent_comment = root === parent ? root_comment : await UserPersonalContentDao.get_comment_by_rpid({rpid: parent});
            if (!root_comment || !parent_comment) return new base_api_model({
                code: 4100025,
                msg: "待回复的评论不存在！",
                data: null
            });
            if (parent_comment.root && parent_comment.root !== root_comment.rpid) return new base_api_model({
                code: 4100026,
                msg: "评论层级错误！",
                data: null
            })
        }
        let created_comment = await UserPersonalContentDao.add_comment({
            rid, root, parent, mid, reply_content
        });
        return new base_api_model({
            code: 0,
            data: {
                rpid: created_comment.rpid
            },
            msg: "评论成功！"
        })
    }

    static async get_content_comment_by_content_id({
                                                       content_id,
                                                       page_size,
                                                       page_num,
                                                       order_by
                                                   }) {

        let {count, main_comments} = await UserPersonalContentDao.get_comments_by_comment_id({
            content_id,
            page_size,
            page_num,
            order_by: order_by === 'hot' ? 'like' : 'ctime'
        })
    }
}

module.exports = {PersonalizedContentService}