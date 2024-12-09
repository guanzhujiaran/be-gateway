const {Op} = require("sequelize");
const {
    TPersonalizedContent,
    TPersonalizedContentType1, sequelize, TComment
} = require("@/ExpressServerEnd/DAO/SqlHelper");
const {t} = require("@/ExpressServerEnd/Tool/Utl");

class UserPersonalContentDao {
    static async add_markdown_article({
                                          mid,
                                          title,
                                          content,
                                          desc,
                                          type
                                      }) {
        let content_id = t.personalized_content_type1_gen.NextId();
        return await sequelize.transaction(
            async (TA) => {
                let personal_content = await TPersonalizedContent.create({
                    content_id: content_id, type: type, up_mid: mid,
                }, {transaction: TA});
                return await personal_content.createTPersonalizedContentType1({
                    title: title,
                    content: content,
                    desc: desc,
                }, {transaction: TA})
            }
        )
    }


    static async get_markdown_article({oid, type}) {
        return await TPersonalizedContent.findOne({
            where: {
                oid: oid,
                type: type,
            },
            include: [
                {
                    model: TPersonalizedContentType1,
                    as: "TPersonalizedContentType1",
                    attributes: {exclude: ['rid']}
                },
            ],
        })
    }

    static async get_content_by_content_id({content_id}) {
        return await TPersonalizedContent.findOne({
            where: {
                content_id: content_id
            },
            include: [
                {
                    model: TPersonalizedContentType1,
                    as: "TPersonalizedContentType1",
                    attributes: {exclude: ['rid']}
                },
            ],

        })
    }

    static async add_comment({
                                 rid,
                                 root,
                                 parent,
                                 mid,
                                 reply_content
                             }) {
        let new_rpid = t.comment_rpid_snowflake_gen.NextId();
        return await TComment.create({
            rpid: new_rpid,
            content: reply_content,
            rid,
            root,
            parent,
            mid
        })
    }

    static async get_comment_by_rpid({
                                         rpid
                                     }) {
        return await TComment.findOne({
            where: {
                rpid
            }
        })
    }

    /**
     *
     * @param comment_id
     * @param page_size
     * @param page_num
     * @param order_by {"ctime" || "like"}
     * @return {Promise<{rows: Model[], count: number}|{rows: Model[], count: GroupedCountResultItem[]}>}
     */
    static async get_comments_by_comment_id({
                                                comment_id,
                                                page_size,
                                                page_num,
                                                order_by
                                            }) {
        return await TComment.findAndCountAll({
            where: {
                rid: comment_id,
            },
            offset: page_size * (page_num - 1),
            limit: page_size, // 每页显示的条数
            order: [
                [order_by, 'DESC'],
            ],
        })
    }
}

module.exports = {
    UserPersonalContentDao
}