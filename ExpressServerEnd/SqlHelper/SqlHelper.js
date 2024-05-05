/*
 * @Author: 星瞳 1944637830@qq.com
 * @Date: 2024-04-06 16:33:24
 * @LastEditors: 星瞳 1944637830@qq.com
 * @LastEditTime: 2024-04-11 13:53:13
 * @FilePath: \tampermonkey\ExpressServerEnd\SqlHelper\SqlHelper.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
const moduleAlias = require("module-alias");
const config = require("dotenv").config();
moduleAlias.addAlias("@", config.parsed.root_dir);
const { Sequelize } = require("sequelize");
const { Op } = require("sequelize");
const DB = config.parsed.DB;
const sequelize = new Sequelize(DB);
sequelize
	.authenticate()
	.then(() => {
		console.log(`数据库连接正常`);
	})
	.catch((e) => {
		console.error(`数据库连接失败！${e}`);
	});
const {
	TAccountInfo,
	TAccountInfo_DashBoardInfo,
	TAccountInfo_LotteryLog,
	TAccountInfo_ReserveLog,
	TAtariInfo,
	TDynamicInfo,
	TLotteryLogInfo,
	TReserveLotteryInfo,
	TUserInfo,
} = require("./dbModel/init-models")(sequelize);
class SqlHelper {
	constructor() {}
	//#region UserInfo表的增删改查
	/**
	 * 通过uid查找userinfo
	 * @param {number} uid
	 * @returns
	 */
	get_user_info_by_uid = async (uid) => {
		let user_info = await TUserInfo.findOne({
			where: {
				uid: uid,
			},
		});
		return user_info;
	};

	get_user_info_by_user_name = async (user_name) => {
		let user_info = await TUserInfo.findOne({
			where: {
				user_name: user_name,
			},
		});
		return user_info;
	};
	add_user_info = async (user_name, pwd) => {
		return await TUserInfo.create({
			pwd: pwd,
			user_name: user_name,
		});
	};
	//#endregion
	//#region accountinfo的crud
	add_account_info = async (account_name, uid) => {
		let user_info = await this.get_user_info_by_uid(uid);
		if (!user_info) {
			throw new Error(`uid:${uid}不存在，无法添加user_info下的account！`);
		}
		return await TAccountInfo.create({
			account_name: account_name,
			uid: uid,
		});
	};

	get_all_account_info_by_uid = async (uid) => {
		let all_accounts = await TAccountInfo.findAll({
			where: {
				uid: uid,
			},
		});
		return all_accounts;
	};
	get_account_info_by_account_name_and_uid = async (account_name, uid) => {
		let user_info = await TAccountInfo.findOne({
			where: {
				account_name: account_name,
				uid: uid,
			},
		});
		return user_info;
	};
	//#endregion
	/**
	 * @typedef {Object} account_dashboard_info - API返回的dashboard信息类型
	 * @property {string} account_name
	 * @property {string} account_uid
	 * @property {string} account_uname
	 * @property {string} vip
	 * @property {number} level
	 * @property {number} official_lottery_num - Log里面的内容
	 * @property {number} reserve_lottery_num - Log里面的内容
	 * @property {number} common_lottery_num - Log里面的内容
	 * @property {number} manual_num
	 * @property {number} atari_up_num
	 * @property {number} atari_num
	 * @property {string} account_status
	 * @property {number} latest_lot_timestamp
	 * @property {number} failed_num
	 */
	/**
	 * 获取dashboard上需要的信息 通过account_name 和uid特定出一个指定的账号，通过这个账号的account_id获取其他信息
	 * @param {string} account_name
	 * @param {string} uid
	 * @returns {promise<account_dashboard_info>}
	 */
	get_account_dashboard_info_by_account_name_and_uid = async (
		account_name,
		uid
	) => {
		let account_info = await this.get_account_info_by_account_name_and_uid(
			account_name,
			uid
		);
		if (!account_info) {
			throw new Error(
				`account_name:${account_name}不存在，无法获取dashboard信息！`
			);
		}
		let account_dashboard_info = await TAccountInfo_DashBoardInfo.findOne({
			attributes: { exclude: ["dashboard_id", "accountinfo_id"] },
			where: {
				accountinfo_id: account_info.account_id,
			},
		});
		let official_lottery_num =
			await this.get_Log_official_lottery_num_by_account_id(
				account_info.account_id
			);
		let reserve_lottery_num =
			await this.get_Log_reserve_lottery_num_by_account_id(
				account_info.account_id
			);
		let common_lottery_num =
			await this.get_Log_common_lottery_num_by_account_id(
				account_info.account_id
			);
		let manual_num = await this.get_Log_manual_lottery_num_by_account_id(
			account_info.account_id
		);

		let atari_num = await this.get_Atari_lottery_num_by_account_id(
			account_info.account_id
		);
		let atari_up_num = await this.get_Atari_up_num_by_account_id(
			account_info.account_id
		);
		let failed_num = await this.get_Log_failed_lottery_num_by_account_id(
			account_info.account_id
		);
		let ret = Object.assign(account_dashboard_info.toJSON(), {
			/** 中间内容-官方抽奖数量 */
			official_lottery_num: official_lottery_num,
			/** 中间内容-预约抽奖数量 */
			reserve_lottery_num: reserve_lottery_num,
			/** 中间内容-一般抽奖数量 */
			common_lottery_num: common_lottery_num,
			/** 中间内容-人工判断数量 */
			manual_num: manual_num,
			/** 中间内容-中奖up数量 */
			atari_up_num: atari_up_num,
			/** 中间内容-中奖次数 */
			atari_num: atari_num,
			/** 中间内容-参加失败的抽奖 */
			failed_num: failed_num,
		});
		return ret;
	};

	//#region 查询某个用户的参加抽奖数量
	/**
	 * 查询一个用户成功参加的官方抽奖数量
	 * @param {number} account_id
	 * @returns {promise<number>}
	 */
	get_Log_official_lottery_num_by_account_id = async (account_id) => {
		let official_lottery_num = await TDynamicInfo.count({
			include: [
				{
					model: TLotteryLogInfo,
					as: "TLotteryLogInfos",
					attributes: [],
					where: {
						is_success: true,
						is_manual_reply: false,
						lottery_type: { [Op.contained]: [1] },
					},
					include: [
						{
							model: TAccountInfo_LotteryLog,
							as: "TAccountInfo_LotteryLogs",
							attributes: [],
							where: {
								accountinfo_id: account_id,
							},
						},
					],
				},
			],
		});
		return official_lottery_num;
	};
	/**
	 * 查询一个用户成功参加的一般抽奖数量
	 * @param {number} account_id
	 * @returns {promise<number>}
	 */
	get_Log_common_lottery_num_by_account_id = async (account_id) => {
		let official_lottery_num = await TDynamicInfo.count({
			include: [
				{
					model: TLotteryLogInfo,
					as: "TLotteryLogInfos",
					attributes: [],
					where: {
						is_success: true,
						is_manual_reply: false,
						lottery_type: { [Op.contained]: [0] },
					},
					include: [
						{
							model: TAccountInfo_LotteryLog,
							as: "TAccountInfo_LotteryLogs",
							attributes: [],
							where: {
								accountinfo_id: account_id,
							},
						},
					],
				},
			],
		});
		return official_lottery_num;
	};
	get_Log_reserve_lottery_num_by_account_id = async (account_id) => {
		let reserve_lottery_num = await TReserveLotteryInfo.count({
			include: [
				{
					model: TAccountInfo_ReserveLog,
					as: "TAccountInfo_ReserveLogs",
					attributes: [],
					where: {
						accountinfo_id: account_id,
					},
				},
			],
		});
		return reserve_lottery_num;
	};
	get_Log_manual_lottery_num_by_account_id = async (account_id) => {
		let official_lottery_num = await TDynamicInfo.count({
			include: [
				{
					model: TLotteryLogInfo,
					as: "TLotteryLogInfos",
					attributes: [],
					where: {
						is_success: true,
						is_manual_reply: false,
						lottery_type: { [Op.contained]: [0] },
					},
					include: [
						{
							model: TAccountInfo_LotteryLog,
							as: "TAccountInfo_LotteryLogs",
							attributes: [],
							where: {
								accountinfo_id: account_id,
							},
						},
					],
				},
			],
		});
		return official_lottery_num;
	};
	get_Log_failed_lottery_num_by_account_id = async (account_id) => {
		let failed_lottery_num = await TDynamicInfo.count({
			include: [
				{
					model: TLotteryLogInfo,
					as: "TLotteryLogInfos",
					attributes: [],
					where: {
						is_success: false,
					},
					include: [
						{
							model: TAccountInfo_LotteryLog,
							as: "TAccountInfo_LotteryLogs",
							attributes: [],
							where: {
								accountinfo_id: account_id,
							},
						},
					],
				},
			],
		});
		return failed_lottery_num;
	};
	get_Atari_lottery_num_by_account_id = async (account_id) => {
		let atari_lottery_num = await TDynamicInfo.count({
			include: [
				{
					model: TAtariInfo,
					as: "TAtariInfos",
					attributes: [],
					on: {
						"$TAtariInfos.atari_dynamic_id$":
							"$TDynamicInfo.dynamic_id$",
					},
					where: {
						accountinfo_id: account_id,
					},
				},
			],
		});
		return atari_lottery_num;
	};
	get_Atari_up_num_by_account_id = async (account_id) => {
		let atari_up_num = await TDynamicInfo.count({
			distinct: true,
			include: [
				{
					model: TAtariInfo,
					as: "TAtariInfos",
					attributes: [],
					on: {
						"$TAtariInfos.atari_dynamic_id$":
							"$TDynamicInfo.dynamic_id$",
					},
					where: {
						accountinfo_id: account_id,
					},
				},
			],
		});
		return atari_up_num;
	};
	//#endregion
}

module.exports = new SqlHelper();
