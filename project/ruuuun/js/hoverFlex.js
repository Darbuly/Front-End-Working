/**@charset "UTF-8";
 * @desc hoverFlex.js v1.0.0
 * 
 * dependence:
 * 	jQuery >=2.2.2
 * 	
 * @author Wangwenwei 
 * @date 20220224
 */

; (function (undefined) {
	// "use strict"
	var _global;
	/**
	 * hoverFlex 类
	 * @constructor 
	 * @param {string} id 能够被$('')指向的id
	 * @param {string} toggle_class_name hover 的时候切换的类名
	 * @param {number} an_time 动画时间
	 * @param {number} timing 初始时间
	 */

	var hoverFlex = function (id, toggle_class_name, an_time, timing = 0) {
		this.id = id;
		this.toggle_class_name = toggle_class_name;
		this.an_time = an_time;
		this.timing = 0;
		this.hadDelay = false;


		this.registerHoverEvent();
	}

	hoverFlex.prototype = {

		/**
		 * 注册 hover 事件
		 */
		registerHoverEvent: function () {
			const _id = this.id;
			const that = this;

			this.$el = $(_id);

			$(_id).hover(function () {
				that.runHover(1);
			}, function () {
				that.runHover(0);
			});
		},

		/**
		 * hover动画执行
		 */
		runHover: function (direct) {

			const that = this;

			if (direct == 1) {
				if (this.timing < this.an_time && this.timing != 0) {
				} else {
					this.$el.addClass(this.toggle_class_name);
					this.runGo()
				}
			}
			if (direct == 0) {

				if (this.timing < this.an_time && this.timing != 0) {
					//处于动画时间，应该进入延时动画
					if (!this.hadDelay) {
						setTimeout(function () {
							that.runHover(0)
						}, (that.an_time - that.timing) * 1000)
						this.hadDelay = true;
					}

				} else {

					this.$el.removeClass(this.toggle_class_name);
					this.runGo()
					this.hadDelay = false;
				}

			}

		},

		/**
		 * 计时器开
		 */
		runGo: function () {
			//开时
			this.timing = 0;
			const that = this;
			requestAnimationFrame(function () {
				that.rander()
				//当超过时间后才停止
				if (that.timing <= that.an_time) {
					requestAnimationFrame(arguments.callee)
				} else {
				}

			});
		},

		/**
		 * rander
		 */
		rander: function () {
			this.timing += 0.0166666666666667;// 1/60
		}

	}


	//最后将插件对象暴露给全局对象
	_global = (function () { return this || (0, eval)('this'); }());
	if (typeof module !== "undefined" && module.exports) {
		module.exports = hoverFlex;
	} else if (typeof define === "function" && define.amd) {
		define(function () { return hoverFlex; });
	} else {
		!('hoverFlex' in _global) && (_global.hoverFlex = hoverFlex);
	}
}())
