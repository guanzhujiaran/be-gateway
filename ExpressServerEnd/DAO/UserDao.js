const { t } = require("@/ExpressServerEnd/Tool/Utl");
// pptr 用户读写全部走 be-message RPC，不再维护本地 sequelize 用户表
const { callRpc } = require("@/ExpressServerEnd/Service/mq/rpc_client");

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
        const resp = await callRpc("get_user_info", { uid });
        return resp && resp.code === 0 ? resp.data : undefined;
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
        const resp = await callRpc("get_user_info", { user_name });
        return resp && resp.code === 0 ? resp.data : undefined;
    };

    /**
     *
     * @param user_name
     * @param uid
     * @return {Promise<*>}
     */
    static async get_whole_user_info({ user_name, uid }) {
        const resp = await callRpc("get_user_info", {
            uid: uid || 0,
            user_name: user_name || "",
        });
        const data = resp && resp.code === 0 ? resp.data : null;
        if (!data) return null;
        // 兼容旧调用方的嵌套结构（TUserDetail.TUserLevel / TUserVip）
        return {
            uid: data.uid,
            user_name: data.user_name,
            pwd: data.pwd,
            role: data.role,
            TUserDetail: {
                uname: data.uname,
                avatar: data.face,
                TUserLevel: { current_level: data.current_level },
                TUserVip: {
                    vip_type: data.vip_type,
                    vip_due_date: data.vip_due_date,
                    vip_status: data.vip_status,
                },
            },
        };
    }

    /**
     * 更新用户的pwd字段（此处被复用为：保存Casdoor用户级access_token）
     * @param {string|number} uid
     * @param {string} pwd - 新的pwd值，或Casdoor access_token
     * @return {Promise<number>} 受影响行数
     * @throws {Error} 服务端返回业务错误时抛出（上游登录流程依赖抛错以中止）
     */
    static async update_user_pwd(uid, pwd) {
        const resp = await callRpc("update_user_info", { uid, pwd });
        if (!resp || resp.code !== 0) {
            const msg = resp && resp.msg ? resp.msg : JSON.stringify(resp);
            throw new Error(`pptr RPC update_user_info 失败: ${msg} (uid=${uid})`);
        }
        return 1;
    };
    //#endregion

    static get_user_whole_info = async ({ uid }) => {
        const resp = await callRpc("get_user_info", { uid });
        const data = resp && resp.code === 0 ? resp.data : null;
        if (!data) return undefined;
        return {
            uid: data.uid,
            user_name: data.user_name,
            role: data.role,
            TUserDetail: {
                uname: data.uname,
                avatar: data.face,
                TUserLevel: { current_level: data.current_level },
                TUserVip: {
                    vip_type: data.vip_type,
                    vip_due_date: data.vip_due_date,
                    vip_status: data.vip_status,
                },
            },
        };
    };
}

module.exports = {
    UserDao
}