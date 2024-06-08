const {UserDao} = require("@/ExpressServerEnd/DAO/UserDao");


exports.UserModel = class UserModel {
    uid;
    user_name;
    parsed_pwd;
    accounts;

    constructor({uid, user_name}) {
        this.uid = uid
        this.user_name = user_name
    }

    async get_uname_uid_pwd() {
        let user_info
        if (this.uid) {
            user_info = await UserDao.get_user_info_by_uid(this.uid);
        } else if (this.user_name) {
            user_info = await UserDao.get_user_info_by_user_name(this.user_name);
        }
        if (user_info) {
            this.uid = user_info.uid;
            this.parsed_pwd = user_info.pwd;
            this.user_name = user_info.user_name;
        }
    }


    static async add_user({user_name, parsed_pwd}) {
        return await UserDao.add_user_info(user_name, parsed_pwd)
    }

    static async is_exists_by_user_name(user_name) {
        let result = await UserDao.get_user_info_by_user_name(user_name);
        return !!result;
    }
}
