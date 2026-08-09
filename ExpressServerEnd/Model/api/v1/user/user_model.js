const {UserDao} = require("@/ExpressServerEnd/DAO/UserDao");
// pptr 用户读写全部走 be-message RPC，不再维护本地 sequelize 用户表
const { callRpc } = require("@/ExpressServerEnd/Service/mq/rpc_client");


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
        const resp = await callRpc("get_user_info", {
            uid: this.uid || 0,
            user_name: this.user_name || "",
        });
        // 服务端返回 StandardResponse { code, msg, data }
        const user_info = resp && resp.code === 0 ? resp.data : null;
        this.TUserInfo = user_info;
        if (user_info) {
            this.uid = user_info.uid;
            this.parsed_pwd = user_info.pwd; // 现为 Casdoor token（可能为 null）
            this.user_name = user_info.user_name;
            this.level = user_info.current_level;
            this.role = user_info.role;
        }
        return this;
    }

    /**
     * 创建用户（走 be-message RPC，不再维护本地 sequelize 用户表）。
     * uid 由服务端自增生成；返回 { uid, user_name, level, role } 兼容对象。
     * @param user_name
     * @param parsed_pwd - 可选，已废弃密码逻辑，一般留空（由 Casdoor token 填充）
     * @param transaction - 已废弃（RPC 自管事务），保留签名兼容
     * @return {Promise<{uid:number, user_name:string, level:string, role:string}>}
     */
    static async add_user({user_name, parsed_pwd, transaction = undefined}) {
        const resp = await callRpc("create_user", {
            uid: 0, // 服务端自增
            user_name,
            pwd: parsed_pwd || "",
        });
        if (!resp || resp.code !== 0) {
            return null;
        }
        const data = resp.data || {};
        return {
            uid: data.uid,
            user_name,
            level: "0",
            role: "level0",
            // 兼容 sequelize 实例的 update/reg_ip 写法（实际走 RPC）
            async update(patch) {
                const upd = await callRpc("update_user_info", {
                    uid: data.uid,
                    pwd: patch.pwd !== undefined ? patch.pwd : "",
                    reg_ip_info_id: patch.reg_ip_info_id || 0,
                });
                return upd && upd.code === 0;
            },
        };
    }

    static async is_exists_by_user_name(user_name) {
        const resp = await callRpc("get_user_info", { user_name });
        return !!(resp && resp.code === 0 && resp.data);
    }

    async get_user_vip() {
        if (!this.TUserInfo) {
            const resp = await callRpc("get_user_info", {
                uid: this.uid || 0,
                user_name: this.user_name || "",
            });
            this.TUserInfo = resp && resp.code === 0 ? resp.data : null;
        }
        const info = this.TUserInfo;
        return {
            vip_type: info ? info.vip_type : 0,
            vip_due_date: info ? info.vip_due_date : 0,
            vip_status: info ? info.vip_status : 0,
        };
    }


}

