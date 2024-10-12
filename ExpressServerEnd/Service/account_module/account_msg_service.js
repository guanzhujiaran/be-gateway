const {AccountMsgDao} = require("@/ExpressServerEnd/DAO/AccountMsgDao");
const {TBiliUser, TAccountBiliReplyMsg} = require("@/ExpressServerEnd/DAO/SqlHelper");

class AccountMsgService {
    constructor() {
        this.accountMsgDao = AccountMsgDao
    }

    async upsert_bili_user_Info({mid, avatar, mid_link, nickname}) {
        return await this.accountMsgDao.upsert_bili_user_Info({mid, avatar, mid_link, nickname})
    };

    async upsert_bili_user_detail({
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
        return await this.accountMsgDao.upsert_bili_user_detail({
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
    }

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
    async upsert_bili_reply_msg({
                                    account_id, reply_id, counts, item, reply_time, uid
                                }) {
        return await this.accountMsgDao.upsert_bili_reply_msg({
            account_id, reply_id, counts, item, reply_time, uid
        });
    }

    async upsert_bili_at_msg({
                                 account_id, at_id, item, uid,at_time
                             }) {
        return await this.accountMsgDao.upsert_bili_at_msg({
            account_id, at_id, item, uid,at_time
        });
    }

    /**
     *
     * @param account_id
     * @param msg_key
     * @param msg_source
     * @param msg_type
     * @param notify_code
     * @param receiver_id
     * @param receiver_type
     * @param sender_uid
     * @param timestamp
     * @return {Promise<boolean|string|*>}
     */
    async upsert_bili_whisper_msg({
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
        return await this.accountMsgDao.upsert_bili_whisper_msg(
            {
                account_id,
                msg_key,
                msg_source,
                msg_type,
                notify_code,
                receiver_id,
                receiver_type,
                sender_uid,
                timestamp
            }
        );
    }
}

module.exports = {AccountMsgService}