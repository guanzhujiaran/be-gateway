const {UserModel} = require("@/ExpressServerEnd/Model/api/v1/user/user_model");
const {base_api_model} = require("@/ExpressServerEnd/Model/base_model/base_model");
const yaml = require('js-yaml');
const config = require('@/ExpressServerEnd/config/index');
const {LOTTERY_DATA_VIP_ACCESS_OFFSET} = require("@/ExpressServerEnd/Service/CONST");
const {utils} = require("@/ExpressServerEnd/BiliPPTR/utils/utils");


class LotteryDatabaseBiliService {
    static async check_user_vip_accessible_page({uid, page_num, page_size}) {
        let user = new UserModel({uid});
        let vip_info = await user.get_user_vip();
        let offset_value = LOTTERY_DATA_VIP_ACCESS_OFFSET[vip_info.vip_type];
        return page_num * page_size <= offset_value
    }

    /**
     *
     * @param uid
     * @param page_num
     * @param page_size
     * @param {"GetOfficialLottery"|"GetReserveLottery"|"GetChargeLottery"|"GetLiveLottery"|"GetTopicLottery"}data_type
     * @return {Promise<base_api_model>}
     */
    static async handle_lottery_data({uid, page_num, page_size}, data_type) {
        let limit_time = 0
        uid = parseInt(uid);
        page_num = parseInt(page_num);
        page_size = parseInt(page_size);
        if (await LotteryDatabaseBiliService.check_user_vip_accessible_page({uid, page_num, page_size})) {
            let resp = {};
            switch (data_type) {
                case "GetReserveLottery":
                    resp = await utils.MYAPI.get_reserve_lottery_by_page({limit_time, page_num, page_size});
                    break;
                case "GetOfficialLottery":
                    resp = await utils.MYAPI.get_official_lottery_by_page({limit_time, page_num, page_size});
                    break;
                case "GetChargeLottery":
                    resp = await utils.MYAPI.get_charge_lottery_by_page({limit_time, page_num, page_size});
                    break;
                case "GetLiveLottery":
                    resp = await utils.MYAPI.get_live_lottery_by_page({limit_time, page_num, page_size});
                    break;
                case "GetTopicLottery":
                    resp = await utils.MYAPI.get_topic_lottery_by_page({limit_time, page_num, page_size});
                    break;
                default:
                    return new base_api_model({
                        code: 500,
                        msg: "抽奖数据类型错误"
                    })
            }
            if (resp.data) {
                return new base_api_model(
                    {
                        data: resp.data
                    });
            } else {
                return new base_api_model(
                    {
                        code: 500,
                        data: resp.data,
                        msg: resp.msg
                    })
            }
        } else {
            return new base_api_model(
                {
                    code: 403,
                    data: null,
                    msg: "vip等级不足"
                })
        }
    }

    static async add_dynamic_lottery({dynamic_id_or_url}) {
        return await utils.MYAPI.add_dynamic_lottery(
            {
                dynamic_id_or_url
            }
        )
    }

    static async get_all_scrapy_status() {
        return await utils.MYAPI.get_all_scrapy_status()
    }

    static async get_lottery_rank({date,lot_type, rank_type, offset, limit}) {
        return await utils.MYAPI.get_lottery_rank({date,lot_type, rank_type, offset, limit})
    }

    static async get_lottery_result({date,uid, lot_type, rank_type, offset, limit}) {
        return await utils.MYAPI.get_lottery_result({date,uid, lot_type, rank_type, offset, limit})
    }
}

module.exports = {LotteryDatabaseBiliService}