import {TUserInfo} from "@/ExpressServerEnd/DAO/SqlHelper";

const {Op} = require("sequelize");

export class UserDao {
    constructor() {
    }

    //#region UserInfo表的增删改查
    /**
     * @typedef {Object} UserCredentials
     * @property {string} uid - 用户ID
     * @property {string} user_name - 用户名
     * @property {string} pwd - 加密后的密码
     */
    /**
     * @typedef {Object} UserBaseInfo
     * @property {string} uid - 用户ID
     * @property {string} user_name - 用户名
     */
    /**
     * 通过uid查找userinfo
     * @param {number} uid
     * @returns {Promise<UserCredentials|undefined> }
     * --{
     "uid": "1",
     "user_name": "admin",
     "pwd": "f6ad0632d7babd4ca84f787257941acb"
     }
     */
    static get_user_info_by_uid = async (uid) => {
        let user_info = await TUserInfo.findOne({
            where: {
                uid: uid,
            },
        });
        return user_info?.toJSON();
    };

    /**
     * 通过user_name查找userinfo
     * @param user_name
     * @return {Promise<string|null>}
     */
    static async get_user_info_by_user_name (user_name) {
        let user_info = await TUserInfo.findOne({
            where: {
                user_name: user_name,
            },
            attributes:['user_name']
        });
        return user_info?.toJSON();
    };

    static add_user_info = async (user_name, pwd) => {
        return await TUserInfo.create({
            pwd: pwd,
            user_name: user_name,
        });
    };
    //#endregion

}