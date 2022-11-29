/**
 * inputNumber 模块组件通用结构
 * MIT Licensed
 */

rui.define(['vue', 'el-input-number'], function (exports) {
	"use strict";

	var Vue = rui.vue

		//模块名
		, MOD_NAME = 'input-number'

		//外部接口
		, inputNumber = {
			config: {}
			, index: rui[MOD_NAME] ? (rui[MOD_NAME].index + 10000) : 0

			//设置全局项
			, set: function (options) {
				var that = this;
				that.config = $.extend({}, that.config, options);
				return that;
			}

			//事件
			, on: function (events, callback) {
				return rui.onevent.call(this, MOD_NAME, events, callback);
			}
		}

		//操作当前实例
		, thisModule = function () {
			var that = this
				, options = that.config
				, id = options.id || that.index;

			thisModule.that[id] = that; //记录当前实例对象

			return {
				config: options
				//重置实例
				, reload: function (options) {
					that.reload.call(that, options);
				}
			}
		}


		//构造器
		, Class = function (options) {
			var that = this;
			that.config = {
				...that.config,
				...inputNumber.config,
				...options
			}


			//加载 css
			that.render();
		};

	//默认配置
	Class.prototype.config = {

	};

	//重载实例
	Class.prototype.reload = function (options) {
		var that = this;

		//防止数组深度合并
		rui.each(options, function (key, item) {
			if (rui.type(item) === 'array') delete that.config[key];
		});

		that.config = $.extend(true, {}, that.config, options);
		that.render();
	};

	//渲染
	Class.prototype.render = function () {
		var that = this;
		that.events(); //事件
	};

	//事件
	Class.prototype.events = function () {
		var that = this
			, options = that.config;


		return new Vue(options);

	};

	//记录所有实例
	thisModule.that = {}; //记录所有实例对象

	//获取当前实例对象
	thisModule.getThis = function (id) {
		var that = thisModule.that[id];
		if (!that) hint.error(id ? (MOD_NAME + ' instance with ID \'' + id + '\' not found') : 'ID argument required');
		return that
	};

	//重载实例
	inputNumber.reload = function (id, options) {
		var that = thisModule.that[id];
		that.reload(options);

		return thisModule.call(that);
	};

	//核心入口
	inputNumber.render = function (options) {
		var inst = new Class(options);
		return thisModule.call(inst);
	};

	exports(MOD_NAME, inputNumber);
});
