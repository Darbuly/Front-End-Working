(function ($, window, document, undefined) {
	var pluginName = "scrollTrigger"
		, defaults = {
			offset: .8,
			callBack: function () { }
		};
	var timer;
	function scrollTrigger(element, options) {
		if (element) {
			this.element = element;
			this.triggerElements = [];
			this.triggerPoint = null;
			this.lastScrollPos = -1;
			this.options = $.extend({}, defaults, options);
			this._defaults = defaults;
			this._name = pluginName;
			window.onload = this.init()
		}
	}
	scrollTrigger.prototype = {
		init: function () {
			var _this = this;
			var $els = $(this.element);
			_this.setup($els);
			var scrollIntervalID = setInterval(function () {
				_this.updatePage(_this)
			}, 10);
			$(window).on("resize", function () {
				_this.resize()
			})
		},
		resize: function () {
			var _this = this;
			clearTimeout(timer);
			timer = setTimeout(function () {
				_this.setTriggerpoint()
			}, 50)
		},
		setTriggerpoint: function () {
			this.triggerPoint = window.innerHeight * this.options.offset
		},
		setup: function (items) {
			this.setTriggerpoint();
			var $this = $(items);
			this.triggerElements.push($this)
		},
		updatePage: function (plugin) {
			var _this = plugin;
			window.requestAnimationFrame(function () {
				_this.animateElements()
			})
		},
		animateElements: function () {
			var _this = this;
			var scrollPos = window.pageYOffset;
			if (scrollPos === this.lastScrollPos)
				return;
			this.lastScrollPos = scrollPos;
			$(_this.triggerElements).each(function () {
				var $this = $(this)
					, $children = $this.find("[data-trigger-child]");
				if ($this.hasClass("triggered") || scrollPos < $this.offset().top - _this.triggerPoint)
					return;
				if ($children.length) {
					_this.triggerOne($this);
					$children.each(function () {
						_this.triggerOne($(this));
					})
				} else {
					_this.triggerOne($this);
				}
			})
		},
		triggerOne: function ($this) {
			$this.addClass("triggered");
			var _this = this;
			_this.options.callBack && _this.options.callBack($this);
		}
	};
	$.fn[pluginName] = function (options) {
		return this.each(function () {
			if (!$.data(this, "plugin_" + pluginName)) {
				$.data(this, "plugin_" + pluginName, new scrollTrigger(this, options))
			}
		})
	}
		;
	if (typeof define === "function" && define.amd) {
		define(function () {
			return scrollTrigger
		})
	}
}
)(jQuery, window, document);
