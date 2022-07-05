/**@charset "UTF-8";
 * @desc PluginTest.js v1.0.72
 * @author Wangwenwei 
 * @date 20220118
 */

; (function (undefined) {
	"use strict"
	var _global;
	/**
	 * PluginTest 类
	 * @constructor 
	 */

	var PluginTest = function () {

	}

	PluginTest.prototype = {}


	//最后将插件对象暴露给全局对象
	_global = (function () { return this || (0, eval)('this'); }());
	if (typeof module !== "undefined" && module.exports) {
		module.exports = PluginTest;
	} else if (typeof define === "function" && define.amd) {
		define(function () { return PluginTest; });
	} else {
		!('PluginTest' in _global) && (_global.PluginTest = PluginTest);
	}
}())
