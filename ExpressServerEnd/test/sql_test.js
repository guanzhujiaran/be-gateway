const sqlhelper = require("../SqlHelper/SqlHelper");

(async () => {
	let resp =
		await sqlhelper.get_account_dashboard_info_by_account_name_and_uid(
			'cookie1',
            1
		);
	console.log(resp);
})();
