const {TUserInfo, TUserVip} = require("@/ExpressServerEnd/DAO/SqlHelper");

const {Op} = require("sequelize");

class UserDao {
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
     * @param {string|number} uid
     * @returns {Promise<UserCredentials|undefined> }
     * --{
     "uid": "1",
     "user_name": "admin",
     "pwd": "f6ad0632d7babd4ca84f787257941acb"
     }
     */
    static get_user_info_by_uid = async (uid) => {
        let user_info = await TUserInfo.findOne({
            attributes: {
                exclude: ['createdAt', 'updatedAt', 'deletedAt']
            },
            where: {
                uid: uid,
            },
        });
        return user_info?.toJSON();
    };

    /**
     * 通过user_name查找userinfo
     * @param user_name
     * @return {Promise<{
     *   uid: number,
     *   user_name: string,
     *   pwd: string
     * }>}
     */
    static async get_user_info_by_user_name(user_name) {
        let user_info = await TUserInfo.findOne({
            attributes: {
                exclude: ['createdAt', 'updatedAt', 'deletedAt']
            },
            where: {
                user_name: user_name,
            },
        });
        return user_info?.toJSON();
    };

    /**
     *
     * @param user_name
     * @param pwd
     * @return {Promise<TUserInfo>}
     */
    static add_user_info = async (user_name, pwd) => {
        return await TUserInfo.create({
            pwd: pwd,
            user_name: user_name,
        })
    };
    //#endregion

    static get_user_vip = async ({uid}) => {
        return (await TUserVip.findOne({
            attributes: {
                exclude: ['createdAt', 'updatedAt', 'deletedAt']
            },
            where: {
                mid: uid
            }
        }))?.toJSON();
    };
}

module.exports = {
    UserDao
}