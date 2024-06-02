import {AccountDao} from "@/ExpressServerEnd/DAO/AccountDao";


export class AccountModel {

    account_name = ""
    account_id = 0
    uid = 0
    info = {
        level: 0,
        vip: "",
        face: null,
        uname: "",
        uid: ""
    }
    lottery_setting={
        
    }

    constructor(uid) {
        this.uid = uid
    }

    /**
     * 获取用户所有账号信息
     * @return {Promise<Array<UserAccount>>}
     */
    async get_all_account_info_by_uid() {
        return await AccountDao.get_all_account_info_by_uid(this.uid)
    }

    /**
     * 通过账号名获取账号信息
     * @param account_name {string}
     * @return {Promise<UserAccount | null>}
     */
    async get_account_info_by_account_name(account_name) {
        return await AccountDao.get_account_info_by_account_name_and_uid(account_name, this.uid)
    }

    /**
     *  通过账号id获取账号信息
     * @param account_id {number}
     * @return {Promise<UserAccount | null>}
     */
    async get_account_info_by_account_id(account_id) {
        return await AccountDao.get_account_info_by_account_id_and_uid(account_id, this.uid)
    }

    /**
     *
     * @param account_name
     * @return {Promise<number>} account_id
     */
    async add_account(account_name) {
        return await AccountDao.add_account(account_name, this.uid)
    }


}
