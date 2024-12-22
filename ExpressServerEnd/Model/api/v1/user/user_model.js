const {UserDao} = require("@/ExpressServerEnd/DAO/UserDao");


exports.UserModel = class UserModel {
    uid;
    user_name;
    parsed_pwd;
    role;

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
            this.role = user_info.role;
        }
    }


    static async add_user({user_name, parsed_pwd}) {
        return await UserDao.add_user_info(user_name, parsed_pwd)
    }

    static async is_exists_by_user_name(user_name) {
        let result = await UserDao.get_user_info_by_user_name(user_name);
        return !!result;
    }

    static async get_user_vip({uid}) {
        let default_vip_info = {
            mid: uid,
            vip_due_date: 0,
            vip_pay_type: 0,
            vip_status: 0,
            vip_type: 0
        }
        if (!uid) {
            return default_vip_info
        }
        return await UserDao.get_user_vip({uid}) ?? default_vip_info
    }


}

