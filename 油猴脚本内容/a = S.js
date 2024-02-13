a = S.createChildFrame(
	"https://live.bilibili.com/p/html/live-lottery/anchor-join.html?roomId=8873942&uid=4237378&anchorId=5848774&from=web&liteVersion=0",
	{
		parentElement: document.querySelector("#live-player-ctnr"),
		attrs: {
			width: "500px",
			height: "420px",
			frameBorder: "0",
		},
		initialEvents: {
			removeAnchorLottery: function () {
				document.body.removeChild(
					document.querySelector("#live-player-ctnr")
				),
					r.clearGuestFrame(),
					r.AnchorLotteryService.init();
			},
			closeGuestPanel: function () {
				document.body.removeChild(
					document.querySelector("#live-player-ctnr")
				),
					r.clearGuestFrame();
			},
			anchorLotToLogin: function () {
				(0, k.login)();
			},
			anchorLotRefreshPrice: function (t) {
				(0, _.Y7)({
					silverSeed: t.silver,
					goldSeed: t.gold,
				});
			},
			anchorLotFollow: function () {
				if (!A.h.state.baseInfoAnchor.isAttention) {
					var t = A.h.getters.baseInfoAnchor.fansCount + 1;
					A.h.dispatch("baseInfoAnchor", {
						isAttention: !0,
						fansCount: t,
					});
				}
			},
		},
	}
);

a.eventPort.emit("IFRAME:ANCHOR_LOTTERY_USERINFO", {
	userLevel: 31,
	guardLevel: 0,
	isFollowing: false,
}),
	a.eventPort.on("lottery:joinSucceed", function () {
		r.joinSucceed = !0;
	});
