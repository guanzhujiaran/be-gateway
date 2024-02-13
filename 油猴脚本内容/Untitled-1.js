var p = "Neptune>_<";
var h = (function () {
	function e() {}
	return (
		(e.encodeEvent = function (e, t, r) {
			return (
				void 0 === r && (r = p),
				(n = JSON.stringify({
					n: e,
					d: t,
					c: r,
				})),
				btoa(encodeURIComponent(n))
			);
			var n;
		}),
		(e.decodeEvent = function (e) {
			var t = JSON.parse(decodeURIComponent(atob(e)));
			return {
				eventName: t.n,
				eventDetail: t.d,
				channelId: t.c,
			};
		}),
		e
	);
})();
var v = {
	child: ["internal:bindParent", "internal:confirmChannelId"],
	parent: ["internal:notifyChild"],
};
var g = {
	child: ["internal:notifyChild"],
	parent: ["internal:bindParent"],
};
function m(e) {
	return (
		("http" !== e.slice.call(e, 0, 4) && "//" !== e.slice.call(e, 0, 2)) ||
		![/\.bilibili.com/].some(function (t) {
			return t.test(e);
		})
	);
}
var y = (function () {
	function e(e) {
		var t = e.target,
			r = e.iframeRef;
		(this._emitEventCache = []),
			(this._isReady = !1),
			(this._emitBlackList = []),
			(this._listenBlackList = []),
			(this._eventMap = {}),
			(this._emitBlackList = g[t] || []),
			(this._listenBlackList = v[t] || []),
			this._createCurrentWindowMessageHandler(),
			"child" === t ? this._initChildEvent(r) : this._initParentEvent();
	}
	return (
		(e.createChildEventPort = function (t) {
			return new e({
				target: "child",
				iframeRef: t,
			});
		}),
		(e.createParentEventPort = function () {
			return new e({
				target: "parent",
			});
		}),
		Object.defineProperty(e.prototype, "_oppositeWindow", {
			get: function () {
				return this._frame
					? this._frame.contentWindow
					: window !== window.parent
					? window.parent
					: null;
			},
			enumerable: !0,
			configurable: !0,
		}),
		(e.prototype._initChildEvent = function (e) {
			var t = this;
			(this._frame = e),
				(this._channelId = Math.floor(
					1e5 * Math.random() * Date.now()
				).toString(16));
			var r = function () {
				t._oppositeWindow.postMessage(
					h.encodeEvent("internal:notifyChild", t._channelId),
					"*"
				);
			};
			this._addEventHandlerToMap("internal:bindParent", r),
				this._addEventHandlerToMap(
					"internal:confirmChannelId",
					function e(n) {
						n === t._channelId &&
							(t.off("internal:bindParent", r),
							t.off("internal:confirmChannelId", e),
							(t._isReady = !0),
							t._emitEventCache.forEach(function (e) {
								return t.emit(e.eventName, e.eventDetail);
							}),
							(t._emitEventCache = []));
					}
				);
		}),
		(e.prototype._initParentEvent = function () {
			var e = this;
			if (this._oppositeWindow && !this._channelId) {
				this._addEventHandlerToMap(
					"internal:notifyChild",
					function t(r) {
						return (
							"string" == typeof r &&
								((e._channelId = r),
								(e._isReady = !0),
								e._oppositeWindow.postMessage(
									h.encodeEvent(
										"internal:confirmChannelId",
										e._channelId,
										e._channelId
									),
									"*"
								),
								e._emitEventCache.forEach(function (t) {
									return e.emit(t.eventName, t.eventDetail);
								}),
								(e._emitEventCache = [])),
							e.off("internal:notifyChild", t)
						);
					}
				),
					this._oppositeWindow.postMessage(
						h.encodeEvent("internal:bindParent"),
						"*"
					);
			}
		}),
		(e.prototype._createCurrentWindowMessageHandler = function () {
			var e = this;
			this._currentWindowMessageHandler ||
				((this._currentWindowMessageHandler = function (t) {
					if ("string" != typeof t.data) return;
					var r = h.decodeEvent(t.data),
						n = true;
					// r.channelId === p ||
					// e._channelId === r.channelId;
					if (!e._eventMap[r.eventName] || !n) return;
					if (
						m(t.origin) ||
						(r.eventDetail &&
							r.eventDetail.url &&
							m(r.eventDetail.url))
					)
						return;
					e._eventMap[r.eventName].forEach(function (e) {
						return e.call(null, r.eventDetail);
					});
				}),
				window.addEventListener(
					"message",
					this._currentWindowMessageHandler
				));
		}),
		(e.prototype._addEventHandlerToMap = function (e, t) {
			this._eventMap[e] || (this._eventMap[e] = []),
				-1 === this._eventMap[e].indexOf(t) &&
					this._eventMap[e].push(t);
		}),
		(e.prototype.dispose = function () {
			this._currentWindowMessageHandler &&
				(window.removeEventListener(
					"message",
					this._currentWindowMessageHandler
				),
				(this._currentWindowMessageHandler = null)),
				(this._isReady = !1),
				(this._eventMap = null),
				(this._frame = null);
		}),
		(e.prototype.off = function (e, t) {
			var r;
			if (this._eventMap && this._eventMap[e]) {
				var n = this._eventMap[e].indexOf(t);
				-1 !== n &&
					((r = this._eventMap[e]),
					(r = r.splice(n, 1)),
					0 === this._eventMap[e].length && delete this._eventMap[e]);
			}
		}),
		(e.prototype.on = function (e, t) {
			(this._oppositeWindow || this._frame) &&
				-1 === this._listenBlackList.indexOf(e) &&
				this._addEventHandlerToMap(e, t);
		}),
		(e.prototype.emit = function (e, t) {
			this._oppositeWindow &&
				-1 === this._emitBlackList.indexOf(e) &&
				(this._isReady
					? this._oppositeWindow.postMessage(
							h.encodeEvent(e, t, this._channelId),
							"*"
					  )
					: (this._emitEventCache &&
							this._emitEventCache.length > 100 &&
							this._emitEventCache.shift(),
					  this._emitEventCache.push({
							eventName: e,
							eventDetail: t,
					  })));
		}),
		e
	);
})();
var b = ["style"],
	w = (function () {
		function e(e, t) {
			void 0 === t && (t = []),
				(this._frame = e),
				(this._nativeEvents = t),
				this._nativeEvents.forEach(function (t) {
					return e.addEventListener(t.type, t.handler);
				}),
				(this.eventPort = y.createChildEventPort(e));
		}
		return (
			Object.defineProperty(e.prototype, "isActive", {
				get: function () {
					return !!this._frame;
				},
				enumerable: !0,
				configurable: !0,
			}),
			Object.defineProperty(e.prototype, "rawIFrame", {
				get: function () {
					return this._frame;
				},
				enumerable: !0,
				configurable: !0,
			}),
			(e.prototype.dispose = function () {
				var e = this;
				this._frame &&
					(this.eventPort.dispose(),
					(this.eventPort = null),
					this._nativeEvents.forEach(function (t) {
						return e._frame.removeEventListener(t.type, t.handler);
					}),
					this._frame.parentElement &&
						this._frame.parentElement.removeChild(this._frame),
					(this._frame = null));
			}),
			(e.prototype.setStyle = function (e) {
				var t = this;
				this._frame &&
					Object.keys(e).forEach(function (r) {
						return (t._frame.style[r] = e[r]);
					});
			}),
			(e.prototype.setAttr = function (e) {
				var t = this;
				this._frame &&
					Object.keys(e).forEach(function (r) {
						-1 === b.indexOf(r) && (t._frame[r] = e[r]);
					});
			}),
			(e.prototype.attachTo = function (e) {
				this._frame &&
					(this._frame.parentElement || e.appendChild(this._frame));
			}),
			e
		);
	})(),
	x = (function () {
		function e() {}
		return (
			(e.createChildFrame = function (e, t, r, n) {
				var i = new w(document.createElement("iframe"), n);
				return (
					r &&
						Object.keys(r).forEach(function (e) {
							return i.eventPort.on(e, r[e]);
						}),
					t && i.setStyle(t),
					i.setAttr(e),
					i
				);
			}),
			(e.parentEventPort = function () {
				return (
					e._parentEventPort ||
						(e._parentEventPort = y.createParentEventPort()),
					e._parentEventPort
				);
			}),
			e
		);
	})(),
	A = (function () {
		function e() {}
		return (
			(e.styles = {
				fullscreen: {
					width: "100%",
					height: "100%",
					position: "fixed",
					top: "0",
					left: "0",
					right: "0",
					bottom: "0",
					border: "none",
					"z-index": "1000",
				},
				noBorder: {
					border: "none",
				},
				filledParent: {
					width: "100%",
					height: "100%",
					position: "absolute",
					top: "0",
					left: "0",
					border: "none",
				},
			}),
			(e.attrs = {}),
			(e.parentElements = {
				fullScreen: function () {
					return document.body;
				},
			}),
			e
		);
	})(),
	S = (function () {
		function e() {}
		return (
			(e.createChildFrame = function (e, t) {
				void 0 === t && (t = {});
				var r = Object.assign({}, t.attrs || {}, {
					src: e,
				});
				if (!t.parentElement)
					throw new Error("[FrameGear]: 未指定父元素");
				var n = x.createChildFrame(
					r,
					t.styles || {},
					t.initialEvents || {},
					t.nativeEventHandlers || []
				);
				return t.parentElement && n.attachTo(t.parentElement), n;
			}),
			(e.createFullscreenChildFrame = function (t, r) {
				void 0 === r && (r = {});
				var n = d()({}, A.styles.fullscreen, r.styles || {});
				return (
					r.parentElement ||
						(r.parentElement = A.parentElements.fullScreen()),
					e.createChildFrame(
						t,
						d()({}, r, {
							styles: n,
						})
					)
				);
			}),
			(e.createNoBorderChildFrame = function (t, r) {
				void 0 === r && (r = {});
				var n = d()({}, A.styles.noBorder, r.styles || {});
				return e.createChildFrame(
					t,
					d()({}, r, {
						styles: n,
					})
				);
			}),
			(e.createFilledParentChildFrame = function (t, r) {
				void 0 === r && (r = {});
				var n = d()({}, A.styles.filledParent, r.styles || {});
				return e.createChildFrame(
					t,
					d()({}, r, {
						styles: n,
					})
				);
			}),
			Object.defineProperty(e, "parentEventPort", {
				get: function () {
					return x.parentEventPort();
				},
				enumerable: !0,
				configurable: !0,
			}),
			e
		);
	})();
