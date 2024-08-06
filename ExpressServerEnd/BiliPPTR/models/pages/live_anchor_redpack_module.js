class LiveAnchorType {
    /**
     *
     * @param {"anchor"} type
     * @param lot_id
     * @param anchor_uid
     * @param room_id
     * @param end_time
     * @param total_price
     * @param live_room_url
     * @param app_schema
     */
    constructor({
                    type,
                    lot_id,
                    gift_num,
                    gift_price,
                    anchor_uid,
                    room_id,
                    require_type,
                    end_time,
                    danmu,
                    award_name,
                    live_room_url,
                    app_schema
                }) {
        this.type = type;
        this.lot_id = lot_id;
        this.gift_num = gift_num;
        this.gift_price = gift_price;
        this.anchor_uid = anchor_uid;
        this.room_id = room_id;
        this.require_type = require_type;
        this.end_time = end_time;
        this.danmu = danmu;
        this.award_name = award_name;
        this.live_room_url = live_room_url;
        this.app_schema = app_schema;
    }
}

class LiveRedPackType {
    /**
     *
     * @param {"popularity_red_pocket"} type
     * @param lot_id
     * @param anchor_uid
     * @param room_id
     * @param end_time
     * @param total_price
     * @param live_room_url
     * @param app_schema
     */
    constructor({
                    type, lot_id, anchor_uid, room_id, end_time, total_price, live_room_url, app_schema
                }) {

        this.type = type;
        this.lot_id = lot_id;
        this.anchor_uid = anchor_uid;
        this.room_id = room_id;
        this.end_time = end_time;
        this.total_price = total_price;
        this.live_room_url = live_room_url;
        this.app_schema = app_schema;
    }
}

class LiveGoldBoxType {
    /**
     *
     * @param {"gold_box"} type
     * @param join_start_time
     * @param join_end_time
     * @param title
     * @param aid
     * @param num
     * @param jp_name
     * @param jp_num
     * @param startTime
     * @param live_url 这个api里面没有，需要手动推送
     */
    constructor({
                    type, join_start_time, join_end_time, title, aid, num, jp_name, jp_num, startTime, live_url
                } = {type: "gold_box"}) {
        this.type = type;
        this.join_start_time = join_start_time;
        this.join_end_time = join_end_time;
        this.title = title;
        this.aid = aid;
        this.num = num;
        this.jp_name = jp_name;
        this.jp_num = jp_num;
        this.startTime = startTime;
        this.live_url = live_url;
    }
}

class live_lottery_setting {
    unignore_anchor_key_word = [
        "手办",
        "ps",
        "旗舰手机",
        "铁三角",
        "海盗船",
        "轻薄本",
        "华硕",
        "ROG",
        "耳机",
        "手机",
        "Mate",
        "mate",
        "Pro",
    ]

    /**
     *
     * @param {string[]} unignore_anchor_key_word
     */
    constructor({unignore_anchor_key_word} = {unignore_anchor_key_word: undefined}) {
        if (unignore_anchor_key_word) this.unignore_anchor_key_word = unignore_anchor_key_word;
    }
}

module.exports = {
    LiveAnchorType,
    LiveRedPackType,
    LiveGoldBoxType,
    live_lottery_setting
}
