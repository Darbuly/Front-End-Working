/**@charset "UTF-8";
 * @desc animateDrive.js v1.0.72
 * @author Wangwenwei 
 * @date 20220118
 */

; (function (undefined) {
	"use strict"
	var _global;
	/**
	 * animateDrive 类
	 * @constructor 
	 */

	var animateDrive = function () {

	}

	animateDrive.prototype = {}


	//最后将插件对象暴露给全局对象
	_global = (function () { return this || (0, eval)('this'); }());
	if (typeof module !== "undefined" && module.exports) {
		module.exports = animateDrive;
	} else if (typeof define === "function" && define.amd) {
		define(function () { return animateDrive; });
	} else {
		!('animateDrive' in _global) && (_global.animateDrive = animateDrive);
	}
}())
