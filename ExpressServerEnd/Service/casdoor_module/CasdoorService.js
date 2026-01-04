const axios = require("axios");
const jwt_decode = require("jwt-decode");
const casdoorConfig = require("@/ExpressServerEnd/config/casdoor_config");
const { createToken } = require("@/ExpressServerEnd/Service/user_permission_module/JwtModule");
const { UserService } = require("@/ExpressServerEnd/Service/user_module/user_service");
const { UserModel } = require("@/ExpressServerEnd/Model/api/v1/user/user_model");
const { base_api_model } = require("@/ExpressServerEnd/Model/base_model/base_model");
const { TUserInfo, TUserDetail, sequelize } = require("@/ExpressServerEnd/DAO/SqlHelper");
const { UserActModel } = require("@/ExpressServerEnd/Model/api/v1/user/user_act_model");
const { TUserLevel } = require("@/ExpressServerEnd/DAO/SqlHelper");
const { TUserVip } = require("@/ExpressServerEnd/DAO/SqlHelper");

/**
 * 生成随机state字符串
 */
function generateState() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

class CasdoorService {
    /**
     * 获取OAuth2登录URL
     * @param {string} state - 状态参数，用于防止CSRF攻击
     * @returns {string} 登录URL
     */
    static getLoginUrl(state = "") {
        const stateParam = state || generateState();
        const scope = "profile email";
        const url = `${casdoorConfig.endpoint}/login/oauth/authorize` +
            `?client_id=${encodeURIComponent(casdoorConfig.clientId)}` +
            `&response_type=code` +
            `&redirect_uri=${encodeURIComponent(casdoorConfig.redirectUri)}` +
            `&scope=${encodeURIComponent(scope)}` +
            `&state=${encodeURIComponent(stateParam)}`;
        return url;
    }

    /**
     * 通过授权码获取访问令牌
     * @param {string} code - OAuth2授权码
     * @returns {Promise<Object>} 包含access_token和用户信息
     */
    static async getOAuthToken(code) {
        try {
            const response = await axios.post(
                `${casdoorConfig.endpoint}/api/login/oauth/access_token`,
                null,
                {
                    params: {
                        grant_type: "authorization_code",
                        client_id: casdoorConfig.clientId,
                        client_secret: casdoorConfig.clientSecret,
                        code: code,
                        redirect_uri: casdoorConfig.redirectUri,
                    },
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
            return response.data;
        } catch (error) {
            console.error("获取OAuth令牌失败:", error.response?.data || error.message);
            throw new Error("获取授权令牌失败");
        }
    }

    /**
     * 获取用户详细信息
     * @param {string} accessToken - Casdoor访问令牌
     * @returns {Promise<Object>} 用户详细信息
     */
    static async getUserInfo(accessToken) {
        try {
            const response = await axios.get(
                `${casdoorConfig.endpoint}/api/userinfo`,
                {
                    headers: {
                        "Authorization": `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            return response.data;
        } catch (error) {
            console.error("获取用户信息失败:", error.response?.data || error.message);
            throw new Error("获取用户信息失败");
        }
    }

    /**
     * 解析JWT令牌获取用户信息
     * @param {string} token - Casdoor JWT令牌
     * @returns {Object} 解析后的用户信息
     */
    static parseJwtToken(token) {
        try {
            const decoded = jwt_decode(token);
            return decoded;
        } catch (error) {
            console.error("解析JWT令牌失败:", error);
            throw new Error("解析用户令牌失败");
        }
    }

    /**
     * 处理Casdoor登录回调
     * @param {string} code - 授权码
     * @param {Object} req - 请求对象
     * @param {Object} resp - 响应对象
     * @returns {Promise<base_api_model>} 包含JWT令牌的登录结果
     */
    static async handleCasdoorCallback({ code, req, resp }) {
        try {
            // 1. 获取OAuth令牌
            const oauthToken = await CasdoorService.getOAuthToken(code);
            console.log("获取到OAuth令牌:", JSON.stringify(oauthToken, null, 2));

            // 2. 获取用户详细信息
            const casdoorUserInfo = await CasdoorService.getUserInfo(oauthToken.access_token);
            console.log("Casdoor用户详细信息:", JSON.stringify(casdoorUserInfo, null, 2));

            // 3. 检查用户是否已存在于本地数据库
            const username = casdoorUserInfo.name || casdoorUserInfo.email;
            let localUser = await TUserInfo.findOne({
                where: {
                    user_name: username,
                }
            });

            // 4. 如果用户不存在，自动创建；如果存在，同步更新用户信息
            if (!localUser) {
                localUser = await CasdoorService.createLocalUserFromCasdoor(casdoorUserInfo, req, resp);
            } else {
                // 用户已存在，同步更新Casdoor信息到本地
                await CasdoorService.syncCasdoorUserInfoToDatabase(localUser, casdoorUserInfo);
            }

            // 5. 生成本地JWT令牌
            const jwt_token = createToken({
                user_name: localUser.user_name,
                uid: localUser.uid,
                level: localUser.level || "0",
            });

            // 6. 记录登录活动
            req.auth = { uid: localUser.uid };
            await UserService.add_user_act_ip_info({
                req,
                resp,
                act_info: UserActModel.login_succ,
            });

            return new base_api_model({
                code: 0,
                msg: "Casdoor登录成功",
                data: {
                    uid: localUser.uid,
                    user_name: localUser.user_name,
                    jwt_token: jwt_token,
                    casdoor_user: {
                        id: casdoorUserInfo.id,
                        name: casdoorUserInfo.name,
                        displayName: casdoorUserInfo.displayName,
                        email: casdoorUserInfo.email,
                        avatar: casdoorUserInfo.avatar,
                        phone: casdoorUserInfo.phone,
                        location: casdoorUserInfo.location,
                        affiliation: casdoorUserInfo.affiliation,
                    },
                },
            });
        } catch (error) {
            console.error("Casdoor登录失败:", error);
            return new base_api_model({
                code: -1,
                msg: `Casdoor登录失败: ${error.message}`,
                data: null,
            });
        }
    }

    /**
     * 从Casdoor用户信息创建本地用户
     * @param {Object} casdoorUser - Casdoor用户信息
     * @param {Object} req - 请求对象（可选）
     * @param {Object} resp - 响应对象（可选）
     * @returns {Promise<Object>} 本地用户对象
     */
    static async createLocalUserFromCasdoor(casdoorUser, req = null, resp = null) {
        return await sequelize.transaction(async (t) => {
            // 使用Casdoor用户名或邮箱作为本地用户名
            const username = casdoorUser.name || casdoorUser.email;

            // 生成随机密码（Casdoor用户不需要密码登录）
            const randomPassword = Math.random().toString(36).substring(2, 15);

            // 创建用户基础信息
            const createdUser = await UserModel.add_user({
                user_name: username,
                parsed_pwd: randomPassword, // 随机密码，Casdoor用户不使用
                transaction: t,
            });

            if (!createdUser) {
                throw new Error("创建本地用户失败");
            }

            // 记录注册IP信息
            let regIpInfoId = null;
            if (req && resp) {
                const regIpInfo = await UserService.add_user_act_ip_info({
                    req,
                    resp,
                    act_info: UserActModel.reg,
                    transaction: t,
                });
                regIpInfoId = regIpInfo.pk;
                await createdUser.update({ reg_ip_info_id: regIpInfoId }, { transaction: t });
            }

            // 同步Casdoor用户详细信息到TUserDetail表
            await CasdoorService.syncCasdoorUserInfoToDatabase(createdUser, casdoorUser, t);

            console.log(`成功创建Casdoor用户: ${username}, uid: ${createdUser.uid}`);

            return createdUser;
        });
    }

    /**
     * 将Casdoor用户信息同步到本地数据库
     * @param {Object} localUser - 本地用户对象
     * @param {Object} casdoorUser - Casdoor用户信息
     * @param {Object} transaction - Sequelize事务对象（可选）
     * @returns {Promise<void>}
     */
    static async syncCasdoorUserInfoToDatabase(localUser, casdoorUser, transaction = null) {
        try {
            // 准备用户详细信息
            const userDetailData = {
                mid: localUser.uid,
                // 使用显示名称作为昵称，如果没有则使用用户名
                uname: casdoorUser.displayName || casdoorUser.name || localUser.user_name,
                // 头像URL
                avatar: casdoorUser.avatar || "",
                // 个人简介/签名
                sign: casdoorUser.homepage || casdoorUser.bio || "",
                // 性别（Casdoor可能不提供这个信息，默认为"保密"）
                sex: "保密",
            };

            // 尝试从Casdoor属性中提取更多信息
            if (casdoorUser.attributes) {
                // 提取生日信息
                if (casdoorUser.attributes.birthday) {
                    userDetailData.birthday = new Date(casdoorUser.attributes.birthday);
                }
                // 提取性别信息
                if (casdoorUser.attributes.gender) {
                    const genderMap = {
                        "male": "男",
                        "female": "女",
                    };
                    userDetailData.sex = genderMap[casdoorUser.attributes.gender.toLowerCase()] || "保密";
                }
                // 提取签名
                if (casdoorUser.attributes.signature) {
                    userDetailData.sign = casdoorUser.attributes.signature;
                }
            }

            // upsert用户详细信息（存在则更新，不存在则创建）
            await TUserDetail.upsert(userDetailData, {
                transaction: transaction,
            });

            // 创建或初始化用户等级信息
            await TUserLevel.findOrCreate({
                where: { mid: localUser.uid },
                defaults: {
                    mid: localUser.uid,
                    current_level: 0,
                    current_exp: 0,
                    current_min: 0,
                },
                transaction: transaction,
            });

            // 创建或初始化用户VIP信息
            await TUserVip.findOrCreate({
                where: { mid: localUser.uid },
                defaults: {
                    mid: localUser.uid,
                    vip_status: 0,
                    vip_type: 0,
                    vip_pay_type: 0,
                    vip_due_date: 0,
                },
                transaction: transaction,
            });

            console.log(`成功同步Casdoor用户信息到数据库: ${localUser.user_name}`);
        } catch (error) {
            console.error("同步Casdoor用户信息到数据库失败:", error);
            throw error;
        }
    }

    /**
     * 验证Casdoor令牌并同步用户信息
     * @param {string} casdoorToken - Casdoor访问令牌
     * @returns {Promise<Object>} 同步后的用户信息
     */
    static async syncUserFromCasdoor(casdoorToken) {
        try {
            // 解析JWT获取用户基本信息
            const decodedToken = CasdoorService.parseJwtToken(casdoorToken);

            // 获取完整用户信息
            const casdoorUser = await CasdoorService.getUserInfo(casdoorToken);

            const username = casdoorUser.name || casdoorUser.email;

            let localUser = await TUserInfo.findOne({
                where: {
                    user_name: username,
                }
            });

            if (!localUser) {
                // 用户不存在，创建新用户
                localUser = await CasdoorService.createLocalUserFromCasdoor(casdoorUser);
            } else {
                // 用户已存在，同步更新Casdoor信息到本地
                await CasdoorService.syncCasdoorUserInfoToDatabase(localUser, casdoorUser);
            }

            return {
                uid: localUser.uid,
                user_name: localUser.user_name,
                level: localUser.level,
                casdoor_user: casdoorUser,
            };
        } catch (error) {
            console.error("同步Casdoor用户失败:", error);
            throw error;
        }
    }

    /**
     * 检查Casdoor是否启用
     * @returns {boolean}
     */
    static isEnabled() {
        return casdoorConfig.enabled;
    }
}

module.exports = { CasdoorService };
