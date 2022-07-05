/**@charset "UTF-8";
 * @desc RunTracking.js v1.0.3
 * @author Wangwenwei 
 * @date 20220608
 */

; (function (undefined) {
	"use strict"
	var _global,

		version = '1.0.3',


		/**
		 * 
		 * realtime:实时发送
		 * 
		 * 事件发生即发送。
		 * 
		 * batch:批量发送
		 * 
		 * 定时批量：数据在缓存队列中存放一定时间后（可配置，比如6s），将所有数据发送出去，发送成功，删除数据，发送失败，跟下一批一起发送；

		   定量批量：数据在缓存队列中存放数量后（可配置，比如6条），将所有数据发送出去，发送成功，删除数据，发送失败，跟下一批一起发送；

		 * 
		 */
		SendStrategy = ['realtime', 'batch'],

		defualtOptions = {

			// debug

			debug: false,

			// 数据发送策略

			SendStrategy: SendStrategy[0],

			// 补充default_variable

			extend_default_variable: {},

			// id

			session_id: null,

			sendRequest: null,

			firstRequestUrl: "http://dmm.ruuuun.com/DMM/UniAPI?API=addSessionEvent",
			RequestUrl: "http://dmm.ruuuun.com/DMM/UniAPI?API=addSessionEventDetail",

		};


	// 事件模型

	var TrackingDataOptions = {

		// 触发时间

		trigger_time: 0,


		// 事件枚举id
		event_type: null,

		// 事件变量
		event_variable_1: null,
		event_variable_2: null,
		event_variable_3: null,
		event_variable_4: null,
		event_variable_5: null

	}
	var TrackingEvent = function (data) {
		this.data = Object.assign({}, this.TrackingDataOptions, data);


		this.setTriggerTime();
		return this.data;
	}
	TrackingEvent.prototype = {
		TrackingDataOptions: TrackingDataOptions,
		setTriggerTime: function () {
			this.data.trigger_time = dateFormat("YYYY-mm-dd HH:MM:SS", new Date());;
		},
		getDatas: function () {
			return this.data;
		}
	}

	// 停留事件模型

	var stayEventOptions = {

		// start_timestamp: null,
		event_variable_1: null,

		// over_timestamp: null,
		event_variable_2: null,

		// stay_time: null
		event_variable_3: null,
	};

	var StayEvent = function (rt, data) {

		if (!rt) {
			throw RTError('stayEvent 需指定 RunTracking 对象')
		}

		this.rt = rt;

		this.event_type = data.event_type;
		if (data.event_type) {
			delete data.event_type;
		}
		this.event_data = Object.assign({}, this.defaultData, data);

		this.status = 'ready';
	}
	StayEvent.prototype = {
		defaultData: stayEventOptions,
		start: function () {
			this.status = 'start';
			this.event_data.event_variable_1 = new Date().getTime();
		},
		over: function () {
			if (this.status != 'start') {
				throw RTError('StayEvent 还没开始');
			}
			this.event_data.event_variable_2 = new Date().getTime();
			this.event_data.event_variable_3 = this.event_data.event_variable_2 - this.event_data.event_variable_1;
			this.triggerStayEvent();
			this.status = 'over';

		},
		triggerStayEvent: function () {
			this.rt.triggerEvent(this.event_type, this.event_data)
		}

	}

	var judgeBrand = function () {
		var sUserAgent = navigator.userAgent.toLowerCase();
		var isIphone = sUserAgent.match(/iphone/i) == "iphone";
		var isHuawei = sUserAgent.match(/huawei/i) == "huawei";
		var isHonor = sUserAgent.match(/honor/i) == "honor";
		var isOppo = sUserAgent.match(/oppo/i) == "oppo";
		var isOppoR15 = sUserAgent.match(/pacm00/i) == "pacm00";
		var isVivo = sUserAgent.match(/vivo/i) == "vivo";
		var isXiaomi = sUserAgent.match(/mi\s/i) == "mi ";
		var isXiaomi2s = sUserAgent.match(/mix\s/i) == "mix ";
		var isRedmi = sUserAgent.match(/redmi/i) == "redmi";
		var isSamsung = sUserAgent.match(/sm-/i) == "sm-";

		if (isIphone) {
			return 'iphone';
		} else if (isHuawei || isHonor) {
			return 'huawei';
		} else if (isOppo || isOppoR15) {
			return 'oppo';
		} else if (isVivo) {
			return 'vivo';
		} else if (isXiaomi || isRedmi || isXiaomi2s) {
			return 'xiaomi';
		} else if (isSamsung) {
			return 'samsung';
		} else {
			return 'default';
		}
	}


	var getNetworkType = function () {
		var ua = navigator.userAgent;
		var networkStr = ua.match(/NetType\/\w+/) ? ua.match(/NetType\/\w+/)[0] : 'NetType/other';
		networkStr = networkStr.toLowerCase().replace('nettype/', '');
		var networkType;
		switch (networkStr) {
			case 'wifi': networkType = 'wifi'; break;
			case '4g': networkType = '4g'; break;
			case '3g': networkType = '3g'; break;
			case '3gnet': networkType = '3g'; break;
			case '2g': networkType = '2g'; break;
			default: networkType = 'other';
		}
		return networkType;
	}

	var getExplorerInfo = function () {
		let explorer = window.navigator.userAgent;
		explorer = explorer.toLowerCase();
		//ie
		if (explorer.indexOf("msie") >= 0) {
			let ver = explorer.match(/msie ([\d.]+)/)[1] || "";
			return "IE" + ver;
		}
		//firefox
		else if (explorer.indexOf("firefox") >= 0) {
			let ver = explorer.match(/firefox\/([\d.]+)/)[1] || "";
			return "Firefox" + ver;
		}
		//Chrome
		else if (explorer.indexOf("chrome") >= 0) {
			let ver = explorer.match(/chrome\/([\d.]+)/)[1] || "";
			return "Chrome" + ver;
		}
		//Opera
		else if (explorer.indexOf("opera") >= 0) {
			let ver = explorer.match(/opera.([\d.]+)/)[1] || "";
			return "Opera" + ver;
		}
		//Safari
		else if (explorer.indexOf("safari") >= 0) {
			let ver = explorer.match(/version\/([\d.]+)/)[1] || "";
			return "Safari" + ver;
		}
		if (explorer.indexOf("edge") >= 0) {
			let ver = explorer.match(/edge\/([\d.]+)/)[1] || "";
			return "edge" + ver;
		}
		//遨游浏览器
		if (explorer.indexOf("maxthon") >= 0) {
			let ver = explorer.match(/maxthon\/([\d.]+)/)[1] || "";
			return "傲游浏览器" + ver;
		}
		//QQ浏览器
		if (explorer.indexOf("qqbrowser") >= 0) {
			let ver = explorer.match(/qqbrowser\/([\d.]+)/)[1] || "";
			return "QQ浏览器" + ver;
		}
		//搜狗浏览器
		if (explorer.indexOf("se 2.x") >= 0) {
			return "搜狗浏览器";
		}
		return "";
	}


	var dateFormat = function (fmt, date) {
		let ret;
		const opt = {
			"Y+": date.getFullYear().toString(),        // 年
			"m+": (date.getMonth() + 1).toString(),     // 月
			"d+": date.getDate().toString(),            // 日
			"H+": date.getHours().toString(),           // 时
			"M+": date.getMinutes().toString(),         // 分
			"S+": date.getSeconds().toString()          // 秒
			// 有其他格式化字符需求可以继续添加，必须转化成字符串
		};
		for (let k in opt) {
			ret = new RegExp("(" + k + ")").exec(fmt);
			if (ret) {
				fmt = fmt.replace(ret[1], (ret[1].length == 1) ? (opt[k]) : (opt[k].padStart(ret[1].length, "0")))
			};
		};
		return fmt;
	}


	// JS Errors

	var RTError = function (message) {

		function RunTrackingError(message) {
			this.name = "RunTrackingError";
			this.message = message;
		}

		RunTrackingError.prototype = new Error();
		RunTrackingError.prototype.constructor = RunTrackingError;
		return new RunTrackingError(message);

	}


	/**
	 * RunTracking 类
	 * @constructor 
	 */
	var RunTracking = function (options) {

		this.options = Object.assign({}, this.defaults, options);

		//首次请求记录 

		this.firstRequest();


	}

	RunTracking.prototype = {
		defaults: defualtOptions,

		// 触发事件

		triggerEvent: function (event_type_id, params) {

			if (!this.options.session_id && !this.options.debug) {
				throw RTError('需先执行 firstRequest')
			}

			var data = Object.assign({}, {
				session_event_id: this.options.session_id,
				event_type: event_type_id,
			}, params),
				opts = this.options;

			var te = new TrackingEvent(data);

			if (opts.SendStrategy == 'realtime') {
				this.sendRequestEvent(te);
			}

			return te;

		},

		// 停留事件

		makeStayEvent: function (data) {
			return new StayEvent(this, data);
		},

		// 发送事件:

		sendRequestEvent: function (trackingEvent) {

			var opts = this.options;

			if (opts.debug) {
				console.log("发送模拟", trackingEvent);
				trackingEvent = null;
				return;
			}

			if (opts.sendRequest) {
				return opts.sendRequest(trackingEvent)
			} else {
				return this.sendRequest(trackingEvent);
			}


		},

		// ajax 请求

		sendRequest: function (trackingEvent) {
			console.log("发送PROD", trackingEvent);
			var opts = this.options;

			if (trackingEvent.event_type && trackingEvent.event_type == 1) {
				window.localStorage.setItem('test_inner', new Date().getTime())
			}

			$.ajax({
				type: 'POST',
				url: opts.RequestUrl,
				data: trackingEvent,
				async: false,
				success: function (data) {
					var _res = JSON.parse(data);
					console.log('res', _res);
				},
				error: function () {
				}
			});
		},

		// 首次访问请求
		firstRequest: function () {

			var opts = this.options;



			var defualtValue = this.getDefaultValue();
			var current_time = dateFormat("YYYY-mm-dd HH:MM:SS", new Date());
			defualtValue.access_time = current_time;
			if (opts.debug) {
				console.log("发送模拟", defualtValue);
				return;
			}

			$.ajax({
				type: 'POST',
				url: opts.firstRequestUrl,
				data: defualtValue,
				success: function (data) {
					var _res = JSON.parse(data);
					console.log('res', _res);
					var session_event_id = _res.data.result.post;
					opts.session_id = Number(session_event_id);

				},
				error: function () {
				}
			});

		},


		// 获取预置变量

		getDefaultValue: function () {

			var defualtValues = {};

			defualtValues.network_type = getNetworkType();
			defualtValues.device_manufacture = navigator.platform;
			defualtValues.device_model = judgeBrand();
			defualtValues.browser_info = getExplorerInfo();
			defualtValues.domain = document.domain;
			defualtValues.sdk_version = this.version();

			return Object.assign({}, defualtValues, this.options.extend_default_variable)

		},

		// Gets the current version

		version: function () {
			return version;
		}
	}


	//最后将插件对象暴露给全局对象
	_global = (function () { return this || (0, eval)('this'); }());
	if (typeof module !== "undefined" && module.exports) {
		module.exports = RunTracking;
	} else if (typeof define === "function" && define.amd) {
		define(function () { return RunTracking; });
	} else {
		!('RunTracking' in _global) && (_global.RunTracking = RunTracking);
	}
}())
