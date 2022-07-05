/**@charset "UTF-8";
 * @desc RunTracking.js v1.0.0
 * @author Wangwenwei 
 * @date 20220608
 */

; (function (undefined) {
	"use strict"
	var _global;
	/**
	 * RunTracking 类
	 * @constructor 
	 */

	var RunTracking = function () {

	}

	RunTracking.prototype = {}


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
