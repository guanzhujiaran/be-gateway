const {UserDao} = require("@/ExpressServerEnd/DAO/UserDao");


exports.UserModel = class UserModel {
    TUserInfo;
    uid;
    user_name;
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
            this.parsed_pwd = user_info.pwd;
            this.user_name = user_info.user_name;
            this.level = user_info.TUserDetail.TUserLevel.current_level;
            this.role = user_info.role;
        }
    }

    /**
     *
     * @param user_name
     * @param parsed_pwd
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

