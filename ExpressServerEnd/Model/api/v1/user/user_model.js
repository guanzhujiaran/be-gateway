const {UserDao} = require("@/ExpressServerEnd/DAO/UserDao");


exports.UserModel = class UserModel {
    TUserInfo;
    uid;
    user_name;
    parsed_pwd;
    level;

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
        }
    }


    static async add_user({user_name, parsed_pwd}) {
        return await UserDao.add_user_info(user_name, parsed_pwd)
    }

    static async is_exists_by_user_name(user_name) {
        let result = await UserDao.get_user_info_by_user_name(user_name);
        return !!result;
    }

    async get_user_vip() {
        this.TUserInfo = await UserDao.get_whole_user_info({
            user_name: this.user_name,
            uid: this.uid
        });
        return this.TUserInfo.TUserDetail.TUserVip
    }


}

