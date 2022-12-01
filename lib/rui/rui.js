/**@charset "UTF-8";
 * @desc rui.js v1.0.0
 * @author ruuuun.com 
 * @date 20221031
 */

; (function (win) {
	"use strict"
	var _global
		, doc = win.document,
		config = {
			modules: {} // 模块物理路径
			, status: {} // 模块加载状态
			, timeout: 10 // 符合规范的模块请求最长等待秒数
			, event: {} // 模块自定义事件
			, callback: {}//存储模块的回调
		}


		//识别预先可能定义的指定全局对象
		, GLOBAL = win.rui_GLOBAL || {}
		/**
		 * rui 类
		 * @constructor 
		 */
		, Rui = function () {
			this.version = '1.0.0'; // rui版本号
		}

		//异常提示
		, error = function (msg, type) {
			type = type || 'log';
			win.console && console[type] && console[type]('rui error hint: ' + msg);
		}

		//内置模块
		, modules = config.builtin = {
			vue: 'vue',	//VUE库

			collapse: 'collapse',	//collapse,目前用的是element 
			'el-collapse': 'el-collapse',	//el-collapse

			'el-input-number': 'el-input-number',
			'input-number': 'input-number',

			'swiper': 'swiper',
			'three':'three',
			'tween':'tween',
			'CSS3DRenderer':'CSS3DRenderer',
			'ThreeTrackballControls':'ThreeTrackballControls',

			demo: 'demo',
			demo_vue: 'demo_vue',


		},

		//获取rui所在目录，加载组件的时候需要用到
		getRuiPath = function () {
			var jsPath = doc.currentScript ? doc.currentScript.src : function () {
				var js = doc.scripts
					, last = js.length - 1
					, src;
				for (var i = last; i > 0; i--) {
					if (js[i].readyState === 'interactive') {
						src = js[i].src;
						break;
					}
				}
				return src || js[last].src;
			}();

			return config.dir = GLOBAL.dir || jsPath.substring(0, jsPath.lastIndexOf('/') + 1);
		}()

	Rui.prototype = {

		use: function (apps, callback, exports, from) {
			var that = this
				, dir = config.dir = config.dir ? config.dir : getPath
				, head = doc.getElementsByTagName('head')[0];

			apps = function () {
				if (typeof apps === 'string') {
					return [apps];
				}
				//当第一个参数为 function 时，则自动加载所有内置模块，且执行的回调即为该 function 参数；
				else if (typeof apps === 'function') {
					callback = apps;
					return ['all'];
				}
				return apps;
			}();

			//如果页面已经存在 jQuery 1.7+ 库且所定义的模块依赖 jQuery，则不加载内部 jquery 模块
			if (win.jQuery && jQuery.fn.on) {
				that.each(apps, function (index, item) {
					if (item === 'jquery') {
						apps.splice(index, 1);
					}
				});
				rui.jquery = rui.$ = jQuery;
			}

			//如果页面已经存在 Vue 库且所定义的模块依赖 Vue，则不加载内部 Vue 模块
			if (win.Vue) {
				let delete_index = -1;
				apps.map(function (aItem, aIndex) {
					if (aItem == 'vue') {
						delete_index = aIndex;
					}
				})
				if (delete_index != -1) {
					apps.splice(delete_index, 1);
				}
				rui.vue = Vue;
			}

			var item = apps[0]
				, timeout = 0;
			exports = exports || [];

			//静态资源host
			config.host = config.host || (dir.match(/\/\/([\s\S]+?)\//) || ['//' + location.host + '/'])[0];

			//加载完毕
			function onScriptLoad(e, url) {
				var readyRegExp = navigator.platform === 'PLaySTATION 3' ? /^complete$/ : /^(complete|loaded)$/
				if (e.type === 'load' || (readyRegExp.test((e.currentTarget || e.srcElement).readyState))) {

					//标识文档加载记录;
					config.modules[item] = url;

					//删除加载script节点，做到无侵入
					head.removeChild(node);

					//轮询等待demo callback执行完成	
					(function poll() {
						//每4ms进行一次检查，如果超过指定规范时间（10s）还没完成模块的加载，断定为不符合规范的模块

						/**
						 * 定义模块规范要求：
						 * 
						 * 	1.命名规范：demo 对应 暴露出来的export
						 * 	
						 * 	2.大小规范：单个模块文件文件大小不能太大 
						 */
						if (++timeout > config.timeout * 1000 / 4) {
							return error(item + ' is not a valid module', 'error');
						};
						console.log(item + 'timeout', timeout)

						//轮询完成，执行demo模块的的加载回调,即use.demo.callback
						config.status[item] ? onCallback() : setTimeout(poll, 4);
					}());
				}
			}

			//回调
			function onCallback() {
				exports.push(rui[item]);
				apps.length > 1 ?
					that.use(apps.slice(1), callback, exports, from)
					: (typeof callback === 'function' && function () {
						//保证文档加载完毕再执行回调
						if (rui.jquery && typeof rui.jquery === 'function' && from !== 'define') {
							return rui.jquery(function () {
								callback.apply(rui, exports);
							});
						}
						callback.apply(rui, exports);
					}());
			}

			//如果app没有引入任何模块，或者引入了聚合版（all），内置的模块则不必重复加载，直接执行回调
			if (apps.length === 0 || (rui['rui.all'] && modules[item])) {
				return onCallback(), that;
			}

			//获取加载的模块 URL
			//如果是内置模块，则按照 dir 参数拼接模块路径
			//如果是扩展模块，则判断模块路径值是否为 {/} 开头，
			//如果路径值是 {/} 开头，则模块路径即为后面紧跟的字符。
			//否则，则按照 base 参数拼接模块路径

			var url = (modules[item] ? (dir + 'modules/')
				: (/^\{\/\}/.test(that.modules[item]) ? '' : (config.base || ''))
			) + (that.modules[item] || item) + '.js';
			url = url.replace(/^\{\/\}/, '');

			//如果扩展模块（即：非内置模块）对象已经存在，则不必再加载
			if (!config.modules[item] && rui[item]) {
				config.modules[item] = url; //并记录起该扩展模块的 url
			}

			//首次加载模块
			if (!config.modules[item]) {
				var node = doc.createElement('script');

				node.async = true;
				node.charset = 'utf-8';
				node.src = url + function () {
					var version = config.version === true
						? (config.v || (new Date()).getTime())
						: (config.version || '');
					return version ? ('?v=' + version) : '';
				}();

				head.appendChild(node);

				if (node.attachEvent && !(node.attachEvent.toString && node.attachEvent.toString().indexOf('[native code') < 0) && !isOpera) {
					node.attachEvent('onreadystatechange', function (e) {
						onScriptLoad(e, url);
					});
				} else {
					node.addEventListener('load', function (e) {
						onScriptLoad(e, url);
					}, false);
				}

				config.modules[item] = url;
			} else { //缓存
				(function poll() {
					if (++timeout > config.timeout * 1000 / 4) {
						return error(item + ' is not a valid module', 'error');
					};
					(typeof config.modules[item] === 'string' && config.status[item])
						? onCallback()
						: setTimeout(poll, 4);
				}());
			}

			return that;
		},

		modules: function () {
			var clone = {};
			for (var o in modules) {
				clone[o] = modules[o];
			}
			return clone;
		},

		/**
		 *  模块的定义方法：
		 * 	
		 * 	所有模块都是通过rui.define的方式联动本rui对象去定义自己；
		 * 	
		 * 	逻辑流程：先用use去递归处理定义模块的依赖关系，保证依赖关系完整引入后，再执行本模块的callback;
		 * 	
		 * 	本模块的callback有两个流程，1是完成模块对象的定义并暴露给rui,2是rui接受这个暴露对象并保存起来，标识模块加载完成。
		 * 
		 * @param {*} deps 该定义模块的依赖模块
		 * @param {*} factory 模块工厂函数
		 * @returns 
		 */
		define: function (deps, factory) {
			var that = this
				, type = typeof deps === 'function'
				, callback = function () {
					var setApp = function (app, exports) {

						//rui接受这个暴露对象并保存起来,标识模块加载完成
						rui[app] = exports;
						config.status[app] = true;
					};

					//factory = 完成模块对象的定义并暴露给rui
					typeof factory === 'function' && factory(function (app, exports) {
						setApp(app, exports);
						config.callback[app] = function () {
							factory(setApp);
						}
					});
					return this;
				};

			type && (
				factory = deps,
				deps = []
			);

			//用use去递归处理定义模块的依赖关系
			that.use(deps, callback, null, 'define');
			return that;
		},

		//css 内部加载器
		addcss: function (firename, fn, cssname) {
			return this.link(config.dir + 'css/' + firename, fn, cssname);
		},

		//css外部加载器
		link: function (href, fn, cssname) {
			var that = this
				, head = doc.getElementsByTagName('head')[0]
				, link = doc.createElement('link');

			if (typeof fn === 'string') cssname = fn;

			var app = (cssname || href).replace(/\.|\//g, '')
				, id = link.id = 'ruicss-' + app
				, STAUTS_NAME = 'creating'
				, timeout = 0;

			link.rel = 'stylesheet';
			link.href = href + (config.debug ? '?v=' + new Date().getTime() : '');
			link.media = 'all';

			if (!doc.getElementById(id)) {
				head.appendChild(link);
			}

			if (typeof fn !== 'function') return that;

			//轮询 css 是否加载完毕
			(function poll(status) {
				var delay = 100
					, getLinkElem = doc.getElementById(id); //获取动态插入的 link 元素

				//如果轮询超过指定秒数，则视为请求文件失败或 css 文件不符合规范
				if (++timeout > config.timeout * 1000 / delay) {
					return error(href + ' timeout');
				};

				//css 加载就绪
				if (parseInt(that.getStyle(getLinkElem, 'width')) === 1989) {
					//如果参数来自于初始轮询（即未加载就绪时的），则移除 link 标签状态
					if (status === STAUTS_NAME) getLinkElem.removeAttribute('lay-status');
					//如果 link 标签的状态仍为「创建中」，则继续进入轮询，直到状态改变，则执行回调
					getLinkElem.getAttribute('lay-status') === STAUTS_NAME ? setTimeout(poll, delay) : fn();
				} else {
					getLinkElem.setAttribute('lay-status', STAUTS_NAME);
					setTimeout(function () {
						poll(STAUTS_NAME);
					}, delay);
				}
			}());


			return that;
		},

		//遍历
		each: function (obj, fn) {
			var key
				, that = this
				, callFn = function (key, obj) { //回调
					return fn.call(obj[key], key, obj[key])
				};

			if (typeof fn !== 'function') return that;
			obj = obj || [];

			//优先处理数组结构
			if (Array.isArray(obj)) {
				for (key = 0; key < obj.length; key++) {
					if (callFn(key, obj)) break;
				}
			} else {
				for (key in obj) {
					if (callFn(key, obj)) break;
				}
			}

			return that;
		}



	}


	//最后将插件对象暴露给全局对象
	_global = (function () { return this || (0, eval)('this'); }());
	if (typeof module !== "undefined" && module.exports) {
		module.exports = new Rui();
	} else if (typeof define === "function" && define.amd) {
		define(function () { return new Rui(); });
	} else {
		!('rui' in _global) && (_global.rui = new Rui());
	}
}(window))
