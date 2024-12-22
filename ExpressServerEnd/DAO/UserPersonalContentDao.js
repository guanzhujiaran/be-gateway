const {Op, fn, literal, col} = require("sequelize");
const {
    TPersonalizedContent,
    TPersonalizedContentType1, TComment, TCommentInteractRelation, TUserInfo, TUserDetail, TUserVip, TUserLevel
} = require("@/ExpressServerEnd/DAO/SqlHelper");
const {t} = require("@/ExpressServerEnd/Tool/Utl");

class UserPersonalContentDao {
    static async get_comment_like_dislike({
                                              rpid,
                                              mid,
                                          }) {
        return await TCommentInteractRelation.findOne({
            attributes: {
                exclude: ['createdAt', 'updatedAt', 'deletedAt']
            },
            where: {
                comment_rpid: rpid,
                mid,
            }
        })
    }

    static async add_comment_like_dislike({
                                              rpid,
                                              mid,
                                              action,
                                              ip_info_id
                                          }) {
        return await TCommentInteractRelation.upsert({
            comment_rpid: rpid,
            mid,
            action,
            ip_info_id
        })
    }

    static async add_markdown_article({
                                          mid,
                                          title,
                                          content,
                                          desc,
                                          type,
                                          ip_info_id
                                      }) {
        let content_id = t.personalized_content_type1_gen.NextId();
        return await sequelize.transaction(
            async (TA) => {
                let personal_content = await TPersonalizedContent.create({
                    content_id: content_id, type: type, up_mid: mid, ip_info_id: ip_info_id
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
            attributes: {
                exclude: ['createdAt', 'updatedAt', 'deletedAt']
            },
            where: {
                oid: oid,
                type: type,
            },
            include: [
                {
                    model: TPersonalizedContentType1,
                    as: "TPersonalizedContentType1",
                    attributes: {
                        exclude: ['createdAt', 'updatedAt', 'deletedAt', 'rid']
                    },
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
                    attributes: {
                        exclude: ['createdAt', 'updatedAt', 'deletedAt', 'rid']
                    },
                },
            ],

        })
    }

    static async add_comment({
                                 rid,
                                 root,
                                 parent,
                                 mid,
                                 reply_content,

                                 ip_info_id = null
                             }) {
        let new_rpid = t.comment_rpid_snowflake_gen.NextId();
        return await TComment.create({
                rpid: new_rpid,
                content: reply_content,
                rid,
                root,
                parent,
                mid,
                ip_info_id
            },
        )
    }

    static async get_single_comment_by_rpid({
                                         rpid
                                     }) {
        return await TComment.findOne({
            attributes: {
                exclude: ['createdAt', 'updatedAt', 'deletedAt']
            },
            where: {
                rpid: rpid,
            }
        })
    }

    static async _get_comments_main_by_oid_type({
                                                    mid = 0,
                                                    oid,
                                                    type,
                                                    page_size = 10,
                                                    page_num = 1,
                                                    order_by = 'like',
                                                    is_topped = false,
                                                    rpid = undefined
                                                }) {
        let where_args = {
            root: null,
            parent: null,
            is_topped: is_topped,
        }
        if (rpid) {
            where_args = {
                rpid: rpid
            }
        }
        where_args = Object.fromEntries(
            Object.entries(where_args).filter(([key, value]) => value !== undefined)
        )
        let rid_TPersonalizedContent_where = {
            oid: oid,
            type: type,
        };
        rid_TPersonalizedContent_where = Object.fromEntries(
            Object.entries(rid_TPersonalizedContent_where).filter(([key, value]) => value !== undefined)
        )
        let opts = {
            attributes: {
                exclude: ['createdAt', 'updatedAt', 'deletedAt', 'ip_info_id', 'is_reported', 'is_topped', 'root', 'parent', 'rid'],
                include: [
                    [literal(`(
Select COALESCE((SELECT a."action" FROM public."TCommentInteractRelation" AS a WHERE a.mid=:mid AND a."comment_rpid"="TComment"."rpid"),0)
)`), 'action'],
                    [literal(`(
COALESCE("TComment"."root",0)
)`), 'root'],
                    [literal(`(
COALESCE("TComment"."parent",0)
)`), 'parent'],
                    [literal(`(
\t\tSELECT
\t\t\tROW_TO_JSON(T)
\t\tFROM
\t\t\t(
\t\t\t\tSELECT
\t\t\t\t\t(
\t\t\t\t\t\tEXISTS (
\t\t\t\t\t\t\tSELECT
\t\t\t\t\t\t\t\t1
\t\t\t\t\t\t\tFROM
\t\t\t\t\t\t\t\tPUBLIC."TCommentInteractRelation" AS A
\t\t\t\t\t\t\tWHERE
\t\t\t\t\t\t\t\tA."mid" = "rid_TPersonalizedContent"."up_mid"
\t\t\t\t\t\t\t\tAND A."comment_rpid" = "TComment"."rpid"
\t\t\t\t\t\t\tLIMIT
\t\t\t\t\t\t\t\t1
\t\t\t\t\t\t)
\t\t\t\t\t) AS "like",
\t\t\t\t\tEXISTS (
\t\t\t\t\t\tSELECT
\t\t\t\t\t\t\t1
\t\t\t\t\t\tFROM
\t\t\t\t\t\t\tPUBLIC."TComment" AS A
\t\t\t\t\t\tWHERE
\t\t\t\t\t\t\tA."mid" = "rid_TPersonalizedContent"."up_mid"
\t\t\t\t\t\t\tAND (
\t\t\t\t\t\t\t\tA."root" = "TComment"."rpid"
\t\t\t\t\t\t\t\tOR A."parent" = "TComment"."rpid"
\t\t\t\t\t\t\t)
\t\t\t\t\t) AS "reply"
\t\t\t) AS T
\t)`), 'up_action',]
                ],
            },
            where: where_args,
            offset: page_size * (page_num - 1),
            limit: page_size, // 每页显示的条数
            order: [
                [order_by, 'DESC'],
            ],
            include: [
                {
                    model: TComment,
                    as: "root_TComments",
                    attributes: {
                        include: [
                            [literal(`(
Select COALESCE((SELECT a."action" FROM public."TCommentInteractRelation" AS a WHERE a.mid=:mid AND a."comment_rpid"="TComment"."rpid"),0)
)`), 'action'],
                            [literal(`(
COALESCE("TComment"."root",0)
)`), 'root'],
                            [literal(`(
COALESCE("TComment"."parent",0)
)`), 'parent'],
                            [literal(`(
SELECT
row_to_json(T)
from (
select exists(
\t\tselect 1 from "public"."TCommentInteractRelation" as a, "public"."TPersonalizedContent" as b where a."comment_rpid" = "rpid" and a."mid" = b."up_mid" and b.content_id="TComment"."rid"
\t\t)as "like",
\texists(
\t\tselect 1 from "public"."TComment" as a, "public"."TPersonalizedContent" as b where (a.root = "rpid" or a.parent = "rpid") and a."mid" = b."up_mid"
\t\t) as "reply"
) as T
) `), 'up_action',]
                        ],
                        exclude: ['createdAt', 'updatedAt', 'deletedAt', 'ip_info_id', 'is_reported', 'is_topped', 'root', 'parent'],
                    },
                    required: false,
                    limit: 3,
                    include: [
                        {
                            model: TUserInfo,
                            as: "mid_TUserInfo",
                            attributes: ['uid'],
                            include: [
                                {
                                    model: TUserDetail,
                                    as: "TUserDetail",
                                    required: false,
                                    attributes:
                                        [
                                            [literal(`COALESCE("mid_TUserInfo->TUserDetail"."mid", "TComment"."mid")`), 'mid'],
                                            [literal('COALESCE("mid_TUserInfo->TUserDetail"."avatar", \'\')'), 'avatar'],
                                            [literal(`COALESCE("mid_TUserInfo->TUserDetail"."uname",'匿名_'|| REGEXP_REPLACE("mid_TUserInfo"."user_name",'^(.)(.{0,2})(.*)$', '\\1**\\3', 'g'))`), 'uname'],
                                            [literal('COALESCE("mid_TUserInfo->TUserDetail"."sign", \'\')'), 'sign'],
                                            [literal('COALESCE("mid_TUserInfo->TUserDetail"."sex", \'\')'), 'sex']
                                        ],
                                    include: [
                                        {
                                            model: TUserVip,
                                            as: "TUserVip",
                                            attributes: {
                                                include: [
                                                    [literal(`COALESCE("mid_TUserInfo->TUserDetail->TUserVip"."mid", "TComment"."mid")`), 'mid'],
                                                    [literal(`COALESCE("mid_TUserInfo->TUserDetail->TUserVip"."vip_due_date", 0)`), 'vip_due_date'],
                                                    [literal('COALESCE("mid_TUserInfo->TUserDetail->TUserVip"."vip_pay_type", 0)'), 'vip_pay_type'],
                                                    [literal('COALESCE("mid_TUserInfo->TUserDetail->TUserVip"."vip_status",0)'), 'vip_status'],
                                                    [literal('COALESCE("mid_TUserInfo->TUserDetail->TUserVip"."vip_type", 0)'), 'vip_type'],
                                                ],
                                                exclude: ['createdAt', 'ip_info_id', 'updatedAt', 'deletedAt', 'mid']
                                            },
                                            required: false,
                                        },
                                        {
                                            model: TUserLevel,
                                            as: "TUserLevel",
                                            attributes: {
                                                include: [
                                                    [literal(`COALESCE("mid_TUserInfo->TUserDetail->TUserLevel"."mid", "TComment"."mid")`), 'mid'],
                                                    [literal(`COALESCE("mid_TUserInfo->TUserDetail->TUserLevel"."current_level", 0)`), 'current_level'],
                                                    [literal('COALESCE("mid_TUserInfo->TUserDetail->TUserLevel"."current_exp", 0)'), 'current_exp'],
                                                    [literal('COALESCE("mid_TUserInfo->TUserDetail->TUserLevel"."current_min",0)'), 'current_min'],
                                                ],
                                                exclude: ['createdAt', 'updatedAt', 'ip_info_id', 'deletedAt', 'mid']
                                            },
                                            required: false,
                                        },
                                    ]
                                },
                            ]
                        }
                    ]
                },
                {
                    model: TPersonalizedContent,
                    as: "rid_TPersonalizedContent",
                    attributes: [],
                    required: true,
                    where: rid_TPersonalizedContent_where,
                },
                {
                    model: TUserInfo,
                    as: "mid_TUserInfo",
                    attributes: ['uid'],
                    include: [
                        {
                            model: TUserDetail,
                            as: "TUserDetail",
                            required: false,
                            attributes: [
                                [literal(`COALESCE("mid_TUserInfo->TUserDetail"."mid", "TComment"."mid")`), 'mid'],
                                [literal('COALESCE("mid_TUserInfo->TUserDetail"."avatar", \'\')'), 'avatar'],
                                [literal(`COALESCE("mid_TUserInfo->TUserDetail"."uname",'匿名_'|| REGEXP_REPLACE("mid_TUserInfo"."user_name",'^(.)(.{0,2})(.*)$', '\\1**\\3', 'g'))`), 'uname'],
                                [literal('COALESCE("mid_TUserInfo->TUserDetail"."sign", \'\')'), 'sign'],
                                [literal('COALESCE("mid_TUserInfo->TUserDetail"."sex", \'\')'), 'sex']
                            ]
                            ,
                            include: [
                                {
                                    model: TUserVip,
                                    as: "TUserVip",
                                    attributes: {
                                        include: [
                                            [literal(`COALESCE("mid_TUserInfo->TUserDetail->TUserVip"."mid", "TComment"."mid")`), 'mid'],
                                            [literal(`COALESCE("mid_TUserInfo->TUserDetail->TUserVip"."vip_due_date", 0)`), 'vip_due_date'],
                                            [literal('COALESCE("mid_TUserInfo->TUserDetail->TUserVip"."vip_pay_type", 0)'), 'vip_pay_type'],
                                            [literal('COALESCE("mid_TUserInfo->TUserDetail->TUserVip"."vip_status",0)'), 'vip_status'],
                                            [literal('COALESCE("mid_TUserInfo->TUserDetail->TUserVip"."vip_type", 0)'), 'vip_type'],
                                        ],
                                        exclude: ['createdAt', 'updatedAt', 'deletedAt', 'mid']
                                    },
                                    required: false,
                                },
                                {
                                    model: TUserLevel,
                                    as: "TUserLevel",
                                    attributes: {
                                        include: [
                                            [literal(`COALESCE("mid_TUserInfo->TUserDetail->TUserLevel"."mid", "TComment"."mid")`), 'mid'],
                                            [literal(`COALESCE("mid_TUserInfo->TUserDetail->TUserLevel"."current_level", 0)`), 'current_level'],
                                            [literal('COALESCE("mid_TUserInfo->TUserDetail->TUserLevel"."current_exp", 0)'), 'current_exp'],
                                            [literal('COALESCE("mid_TUserInfo->TUserDetail->TUserLevel"."current_min",0)'), 'current_min'],
                                        ],
                                        exclude: ['createdAt', 'updatedAt', 'deletedAt', 'mid']
                                    },
                                    required: false,
                                },
                            ]
                        },
                    ]
                }
            ],
            replacements: {mid},
        }
        if (rpid) return await TComment.findOne(opts);
        return await TComment.findAll(opts);
    }

    /**
     * 这是最后api直接调用的方法
     * @param mid
     * @param oid
     * @param type
     * @param page_size
     * @param page_num
     * @param order_by
     * @return {Promise<{count: *, rows: Model[],top_rows:Model[]}>}
     */
    static async get_comments_main_with_user_info_by_oid_type({
                                                                  mid = 0,
                                                                  oid = 0,
                                                                  type = 0,
                                                                  page_size = 10,
                                                                  page_num = 1,
                                                                  order_by = 'like'
                                                              } = {}) {

        let count;
        let rows;
        let top_rows;
        await Promise.all([
            count = await TComment.count({
                where: {
                    root: null,
                    parent: null,
                },
                include: [
                    {
                        model: TPersonalizedContent,
                        as: "rid_TPersonalizedContent",
                        where: {
                            oid: oid,
                            type: type,
                        },
                        attributes: [],
                    },
                ]
            }),
            rows = await UserPersonalContentDao._get_comments_main_by_oid_type({
                mid,
                oid,
                type,
                page_size,
                page_num,
                order_by,
                is_topped: false
            }),
            top_rows = String(page_num) === "1" ? await UserPersonalContentDao._get_comments_main_by_oid_type({
                mid,
                oid,
                type,
                page_size,
                page_num,
                order_by,
                is_topped: true
            }) : []
        ])
        return {
            count,
            rows,
            top_rows
        }
    }

    static async get_content_comment_by_rpid({
                                                 rpid
                                             }) {
        return await UserPersonalContentDao._get_comments_main_by_oid_type(
            {rpid: rpid}
        )
    }


}

module.exports = {
    UserPersonalContentDao
}