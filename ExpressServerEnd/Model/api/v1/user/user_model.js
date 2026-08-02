const {UserDao} = require("@/ExpressServerEnd/DAO/UserDao");


exports.UserModel = class UserModel {
    TUserInfo;
    uid;
    user_name;
    // 注：本地密码登录已废弃，TUserInfo.pwd 字段现在仅作 Casdoor access_token 仓库。
    // parsed_pwd 从 pwd 读取，含义为「当前用户的 Casdoor token」（可能为空）。
    parsed_pwd;
    level; // 这个是用户的等级，可以提升，等级越高，权限越高
    role; // 这个是用户的角色，无法提升，只能后台修改

    constructor({uid, user_name}) {
        this.uid = uid
        this.user_name = user_name
    }

    async get_uname_uid_pwd() {
        let user_info = await UserDao.get_whole_user_info({
            user_name: this.user_name,
            uid: this.uid
        })
        this.TUserInfo = user_info;
        if (user_info) {
            this.uid = user_info.uid;
            this.parsed_pwd = user_info.pwd; // 现为 Casdoor token（可能为 null）
            this.user_name = user_info.user_name;
            this.level = user_info.TUserDetail.TUserLevel.current_level;
            this.role = user_info.role;
        }
    }

    /**
     * 创建本地用户（Casdoor 登录流程使用）。
     * 不再传入密码：pwd 字段留空，待 Casdoor 登录回调时写入 access_token。
     * @param user_name
     * @param parsed_pwd - 可选，已废弃密码逻辑，一般留空（由 Casdoor token 填充）
     * @param transaction
     * @return {Promise<TUserInfo>}
     */
    static async add_user({user_name, parsed_pwd, transaction = undefined}) {
        return await UserDao.add_user_info(user_name, parsed_pwd, transaction)
    }

    static async is_exists_by_user_name(user_name) {
        let result = await UserDao.get_user_info_by_user_name(user_name);
        return !!result;
    }

    async get_user_vip() {
        if (!this.TUserInfo) {
            this.TUserInfo = await UserDao.get_whole_user_info({
                user_name: this.user_name,
                uid: this.uid
            });
        }
        return this.TUserInfo.TUserDetail.TUserVip
    }


}

