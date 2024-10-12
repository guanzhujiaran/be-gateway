const {
    TUserInfo,
    TBiliUser,
    TAccountBiliReplyMsg,
    TAccountBiliSessionMsg, TBiliUserDetail, TAccountBiliAtMsg
} = require("@/ExpressServerEnd/DAO/SqlHelper");

const {Op} = require("sequelize");

class AccountMsgDao {
    constructor() {
    }

    static async upsert_bili_user_Info({mid, avatar, mid_link, nickname}) {
        return await TBiliUser.upsert({mid, avatar, mid_link, nickname});
    };

    /**
     *
     * @param account_id
     * @param reply_id
     * @param counts
     * @param item
     * @param reply_time
     * @param uid
     * @return {Promise<boolean>} true 如果创建了新记录，否则 false
     */
    static async upsert_bili_reply_msg({
                                           account_id, reply_id, counts, item, reply_time, uid
                                       }) {
        let [result,_] = await TAccountBiliReplyMsg.upsert({
            account_id, reply_id, counts, item, reply_time, uid
        })
        return result.isNewRecord;
    }

    static async upsert_bili_at_msg({account_id, at_id, item, uid, at_time}) {
        let [result,_] = await TAccountBiliAtMsg.upsert({
            account_id, at_id, item, uid, at_time
        })
        return result.isNewRecord;
    }

    static async upsert_bili_whisper_msg({
                                             account_id,
                                             msg_key,
                                             msg_source,
                                             msg_type,
                                             notify_code,
                                             receiver_id,
                                             receiver_type,
                                             sender_uid,
                                             timestamp
                                         }) {
        let [result,_] = await TAccountBiliSessionMsg.upsert({
            account_id, msg_key, msg_source, msg_type, notify_code, receiver_id, receiver_type, sender_uid, timestamp
        })
        return result.isNewRecord;
    }

    static async upsert_bili_user_detail({
                                             uid,
                                             face,
                                             face_nft,
                                             face_nft_new,
                                             name_render,
                                             nameplate,
                                             official,
                                             pendant,
                                             vip
                                         }) {
        let result = await TBiliUserDetail.upsert({
            uid,
            face,
            face_nft,
            face_nft_new,
            name_render,
            nameplate,
            official,
            pendant,
            vip
        })
        return result.created;
    }
}

module.exports = {
    AccountMsgDao
}