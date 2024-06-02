import {UserModel} from "@/ExpressServerEnd/Model/api/v1/user/user_model";
import {UserDao} from "@/ExpressServerEnd/DAO/UserDao";
import md5 from "md5";
import {createToken} from "@/ExpressServerEnd/Controller/Route/JwtModule";
import {base_api_model} from "@/ExpressServerEnd/Model/base_model/base_model";

const yaml = require('js-yaml');
const config = yaml.load("@/ExpressServerEnd/config/config.yml", 'utf8');
const password_salt = config.common_config.salt.password_salt;

class UserService {
    /**
     * 用户登录
     * @param uid
     * @param user_name
     * @param pwd
     * @return {Promise<base_api_model>}
     */
    static async check_login({uid, user_name, pwd}) {
        let user_model = new UserModel({uid: uid, user_name: user_name});
        await user_model.get_uname_uid_pwd();
        if (user_model.parsed_pwd) {
            let parsed_pwd = md5(pwd + password_salt);
            if (user_model.parsed_pwd === parsed_pwd) {
                let jwt_token = createToken({
                    user_name: user_model.user_name,
                    uid: user_model.uid,
                });
                return new base_api_model(
                    {
                        data: {
                            uid: user_model.uid,
                            user_name: user_model.user_name,
                            jwt_token: jwt_token,
                        }
                    }
                )
            }
        }
        return new base_api_model(
            {code: -1, msg: '密码错误或账号不存在', data: null}
        )
    }

    /**
     * 获取用户登录信息
     * @param uid
     * @param user_name
     * @return {Promise<base_api_model>}
     */
    static async get_user_nav({uid}) {
        let user_model = new UserModel({uid: uid})
        await user_model.get_uname_uid_pwd()
        if (user_model.uid && user_model.user_name) {
            return new base_api_model({
                data: {
                    uid: user_model.uid,
                    user_name: user_model.user_name
                }
            })
        } else {
            return new base_api_model(
                {
                    code: -1,
                    msg: "用户不存在",
                }
            )
        }


    }

    static async register({user_name, pwd}) {
        let is_user_name_exist = await UserModel.is_exists_by_user_name(user_name);
        if (is_user_name_exist) {
            return new base_api_model({
                code: 40014,
                msg: "该昵称已存在",
            })
        }
        let parsed_pwd = md5(pwd + password_salt);
        if (await UserModel.add_user({user_name: user_name, pwd: parsed_pwd})) {
            return new base_api_model({
                msg: "注册成功！",
            })
        }
        return new base_api_model({
            msg: "发生未知错误，注册失败！",
        })

    }
}

export default UserService