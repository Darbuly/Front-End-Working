/**
 * FastVue 
 * version 1.5.0
 *  
 *  
 *  author: Wangwenwei (970073804@qq.com)
 * 
 */
class FastVue {

    constructor({ appName, templatePathRoot, config, plugins, component_version = '1.0' }) {
        this.appName = appName;
        this.templatePathRoot = templatePathRoot;
        this.config = config;
        this.plugins = plugins;
        this.component_version = component_version;

        this.$VM = {};
        this.idNameList = [];
        this.templateList = {};
        this.isDebug = true;


    }

    /**
     * 安装配置
     */
    initConfig() {
        this.log('安装配置');
    }

    /**
     *  日志输出
     * @param {*} obj 
     */
    log(obj) {
        this.isDebug && console.log(obj)
    }

    /**
     * 安装插件，即 Vue.use()
     * @param {*} plugin 
     */
    initPlugin(plugin) {
        this.log('安装插件');

        if (!Vue) {
            this.throwError('FastVue initPlugin:找不到 Vue');
        }
        if (!plugin) {
            this.throwError('FastVue initPlugin:你不能使用一个不存在的插件');
        }

        Vue.use(plugin);

    }

    /**
     * 注册组件
     */
    async regComponent(componentId, initdata = {}, initMethods = {}, loadCss = false, initMixin = []) {
        return new Promise(async (resolve, reject) => {
            if (!componentId) {
                this.throwError('你使用了注册组件功能，但该组件没有指定参数！')
            }

            //根据id初始化组件
            let res = await this.makeComponent(componentId, 1, initdata, initMethods, loadCss, initMixin)
            resolve(res);
        })
    }

    /**
     * getMixin
     */
    async getMixin(componentId) {
        return new Promise(async (resolve, reject) => {
            if (!componentId) {
                this.throwError('你使用了注册组件功能，但该组件没有指定参数！')
            }

            //根据id初始化组件
            let res = await this.makeComponent(componentId, 4)
            resolve(res);

        })
    }

    /**
     * 包裹组件
     * 
     * @param {*} container  被包裹的div的id
     * @param {*} componentId  组件库中用什么组件包裹
     * @param {*} initdata 包裹组件的传值
     * @param {*} initMethods 包裹组件的方法
     */
    async wrapComponent(container, wrapComponentId, initdata = {}, initMethods = {}) {
        if (!wrapComponentId) {
            this.throwError('你使用了包裹组件功能，但该组件没有指定参数！')
        }

        if (!container || typeof container != 'string') {
            this.throwError('container 参数不正确，应该是字符串')
        }
        let _cont = document.querySelector(container);
        if (!_cont) {
            this.throwError('你给的 container 参数没法获取到具体DOM对象');
        }
        //取出 container 里作为嵌套组件模板内容
        let innerHtml = _cont.innerHTML;

        //初始化 container 组件
        Vue.component(container.replace("#", ""), {
            props: ['componentkey', 'propsdata'],
            template: innerHtml,
            methods: initMethods
        });

        //清除 container 里的内容
        _cont.innerHTML = "";

        //初始化绑定对象
        return await this.makeComponent(wrapComponentId, container, initdata)

    }

    /**
     * 异常抛出
     * @param {*} msg 
     */
    throwError(msg) {
        throw new Error(`FastVue Error: ${msg}`)
    }

    /**
     * 
     *  获取VM对象
     * @param {*} container 
     * @param {*} componentId 
     * @returns 
     */
    async getVM(container, componentId) {
        let _vm = await this.pushComponent(container, componentId);
        return _vm;
    }

    /**
     * 容器中放置组件
     * 
     * @param {*} container 
     * @param {*} componentId 
     * @param {*} initdata 
     * @param {*} initMethods 
     * @returns 
     */
    async pushComponent(container, componentId, initdata = {}, initMethods = {}, loadCss = false) {
        this.log('放置一个组件');


        if (!container || typeof container != 'string') {
            this.throwError('container 参数不正确，应该是字符串')
        }
        let _cont = document.querySelector(container);
        if (!_cont) {
            this.throwError('你给的 container 参数没法获取到具体DOM对象');
        }
        // 放置容器
        this.pushDiv(_cont, componentId);

        if (!this.$VM[`${container}`]) {
            this.$VM[`${container}`] = {};
        }
        let _VM = await this.makeComponent(componentId, 0, initdata, initMethods, loadCss)

        this.$VM[`${container}`][`${componentId}`] = _VM;
        return _VM;
    }



    /**
     *  创造Vue组件
     * @param { 组件id } componentId 
     * @param { 创造类型 } type 默认为0，即创建VM对象，1为注册Vue组件，2为导出注册组件脚本
     * @param { 初始化数据 } initdata 
     * @param { 初始化方法 } initMethods 
     * @returns VM对象
     */
    async makeComponent(
        componentId,
        type = 0,
        initdata = {},
        initMethods = {},
        loadCss = false,
        initMixin = []
    ) {

        // 加载组件
        let _tpl = await this.loadTemplate(componentId);
        if (!_tpl) {
            this.throwError(`组件 ${componentId}找不到`);
        }

        // 加载组件脚本
        let _script = await this.getComponentScript(componentId);

        if (loadCss) {
            await this.loadCss(componentId);
        }

        // 加载 mixins
        let _mixin = _script.mixins;
        let _mixinMap = {};
        _script.mixinList = {};
        if (Array.isArray(_mixin)
            && _mixin.length > 0) {

            const that = this;
            const mixinList = await Promise.all(_mixin.map(componentId => {
                if ("string" != typeof componentId) this.throwError('无法解析 mixin,请检查写法正确');
                return new Promise(async function (resolve, reject) {
                    try {
                        const m = await that.getMixin(componentId);
                        resolve({
                            componentId: that.dashToCamel(componentId),
                            mixin: m
                        });
                    } catch (e) {
                        reject(e);
                    }
                })
            }));

            mixinList.map(mItem => {
                _mixinMap[mItem.componentId] = mItem.mixin
            })
            _script.mixinList = _mixinMap;

        }


        this.log('组件脚本数据信息为', _script);

        // 如果type为字符串，说明是包裹组件
        if (typeof type == 'string') {
            let _cont = document.querySelector(type);
            if (!_cont) {
                this.throwError(' makeComponent 传进了字符串类型的type,但DOM中无法寻得该元素');
            }


            // 赋予嵌套组件id
            let _data = this.initComponentData(initdata, _script.data);
            _data['contentComponent'] = type.replace("#", "");

            const vm = new Vue({
                el: type,
                template: _tpl.template,
                data: _data,
                computed: _script.computed,
                created: _script.created,
                methods: this.initComponentData(initMethods, _script.methods)
            });
            console.log(vm);
            return vm;
        }

        switch (type) {

            case 1://注册组件
            case 2://导出脚本
            case 3://原始vue对象
            case 4://导出mixin
                const that = this;

                let VueScript = {
                    props: _script.props ? _script.props : ['componentkey', 'propsdata'],
                    template: _tpl.template,
                    data: function () {
                        return that.initComponentData(initdata, _script.data);
                    },
                    computed: _script.computed,
                    created: _script.created,
                    mounted: _script.mounted,
                    methods: that.initComponentData(initMethods, _script.methods)
                };
                if (1 == type) {
                    VueScript.mixins = initMixin.concat(Object.values(_script.mixinList));
                    return Vue.component(componentId, VueScript);
                } else if (2 == type) {

                    VueScript.mixins = [];
                    var mixin_str = `[${Object.keys(_script.mixinList).join(',')}]`;

                    var data_fn = null;
                    eval(`data_fn = function(){ return ${that.obj2Str(_script.data)} }`)
                    VueScript.data = data_fn;
                    VueScript = this.obj2Str(VueScript);
                    VueScript = VueScript.replace("mixins:[]", `mixins:${mixin_str}`);
                    return VueScript;
                } else if (3 == type) {

                    var data_fn = null;
                    eval(`data_fn = function(){ return ${that.obj2Str(_script.data)} }`)
                    VueScript.data = data_fn;
                    return VueScript;
                } else if (4 == type) {
                    const mixin = {
                        props: VueScript.props,
                        data: VueScript.data,
                        computed: VueScript.computed,
                        created: VueScript.created,
                        mounted: VueScript.mounted,
                        methods: VueScript.methods,
                    }
                    return mixin;
                }

                break;


            case 0://实例化VM对象
            default:
                return new Vue({
                    el: `#${componentId}`,
                    template: _tpl.template,
                    data: this.initComponentData(initdata, _script.data),
                    computed: _script.computed,
                    created: _script.created,
                    methods: this.initComponentData(initMethods, _script.methods)
                });
                break;
        }

    }



    /**
     *  解析组件数据
     * @param {*} initdata 
     * @param {*} defaultData 
     * @returns 
     */
    initComponentData(initdata, defaultData) {
        let _data = {};

        for (const key in defaultData) {
            if (Object.hasOwnProperty.call(defaultData, key)) {
                const element = defaultData[key];
                if (initdata[key] != undefined) {
                    _data[key] = initdata[key]
                } else {
                    _data[key] = element;
                }
            }
        }
        return _data;
    }


    /**
     * 由对象转字符串，包括函数也一起转
     * @param {any} obj 
     * @returns 
     */
    obj2Str(obj) {
        switch (typeof (obj)) {
            case 'object':
                var ret = [];
                if (obj instanceof Array) {
                    for (var i = 0, len = obj.length; i < len; i++) {
                        ret.push(this.obj2Str(obj[i]));
                    }
                    return '[' + ret.join(',') + ']';
                }
                else if (obj instanceof RegExp) {
                    return obj.toString();
                }
                else {
                    for (var a in obj) {
                        ret.push(a + ':' + this.obj2Str(obj[a]));
                    }
                    return '{' + ret.join(',') + '}';
                }
            case 'function':
                const fnStr = String(obj);
                return fnStr.replace(/^(\w+)\s*\(/, "function(");
            case 'number':
                return obj.toString();
            case 'string':
                return "\"" + obj.replace(/(\\|\")/g, "\\$1").replace(/\n|\r|\t/g, function (a) { return ("\n" == a) ? "\\n" : ("\r" == a) ? "\\r" : ("\t" == a) ? "\\t" : ""; }) + "\"";
            case 'boolean':
                return obj.toString();
            default:
                return obj.toString();
        }
    }

    /**
     * 将要转换的字符串传递给这个函数，并得到相应的驼峰式字符串。
     * @param {*} input 
     * @returns 
     */
    dashToCamel(input) {
        return input.replace(/-(.)/g, (_, match) => match.toUpperCase());
    }

    /**
     * 模板解析
     * @param {*} componentId 
     * @returns 
     */
    async loadTemplate(componentId) {
        if (!this.templateList[`${componentId}`]) {
            let _tpl = await this.getTemplateFiles(`${this.templatePathRoot}${componentId}/${componentId}.html?v=${this.component_version}`);
            this.templateList[`${componentId}`] = _tpl;
        }
        return this.templateList[`${componentId}`];
    }

    async loadCss(componentId) {
        if (!$) {
            this.throwError('请先加载JQ库');
        }
        let url = `${this.templatePathRoot}${componentId}/${componentId}.css?v=${this.component_version}`;
        const that = this;
        return new Promise(async (resolve, reject) => {

            let file_exist = await this.IsExistsFile(url)
            if (file_exist) {
                console.log('css 存在');
                var head = document.getElementsByTagName('head')[0];
                var link = document.createElement('link');
                link.type = 'text/css';
                link.rel = 'stylesheet';
                link.href = url;

                head.appendChild(link);
                that.superviseCssLinkLoad(link, function () {
                    console.log('加载css完毕')
                    resolve({
                        cssObj: url
                    })
                })

            } else {
                console.log('css 不存在');
                resolve({
                    cssObj: null
                })
            }

        })

    }
    async IsExistsFile(filepath) {

        return new Promise((resolve, reject) => {
            try {
                var xmlhttp = null;
                if (window.XMLHttpRequest) {
                    xmlhttp = new XMLHttpRequest();
                } else if (window.ActiveXObject) {
                    xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
                }
                xmlhttp.open("GET", filepath, false);
                xmlhttp.send();
                if (xmlhttp.readyState == 4) {
                    if (xmlhttp.status == 200) resolve(true); //url存在 
                    else if (xmlhttp.status == 404) resolve(false); //url不存在 
                    else resolve(false);//其他状态 
                }
            } catch (error) {
                resolve(false)
            }

        })


    }

    /**
     * 组件脚本部分解析
     * @param {*} componentId 
     * @returns 
     */
    async getComponentScript(componentId) {
        return new Promise((resolve, reject) => {
            $.getScript(
                `${this.templatePathRoot}${componentId}/${componentId}.js?v=${this.component_version}`
                , function (res) {


                    //解析 mixin
                    let _mixins = null;
                    if ("function" == typeof returnMixins) {
                        _mixins = returnMixins();
                        returnMixins = null;
                    }


                    //解析props
                    let _props = null;
                    if ("function" == typeof returnProps) {
                        _props = returnProps();
                        returnProps = null;
                    }

                    //解析data
                    let _data = returnData();
                    returnData = null;
                    //解析created
                    let _created = returnCreated();
                    returnCreated = null;

                    let _computed = {};
                    try {
                        //解析computed
                        _computed = returnComputed();
                        returnComputed = null;
                    } catch (e) {
                        // console.log(e.message);//sojson is undefined
                    }

                    //解析mounted
                    let _mounted = {};
                    try {
                        //解析mounted
                        _mounted = returnMounted();
                        returnMounted = null;
                    } catch (e) {
                        // console.log(e.message);//sojson is undefined
                    }


                    //解析methods
                    let _methods = returnMethods();
                    returnMethods = null;


                    resolve({
                        mixins: _mixins,
                        props: _props,
                        data: _data,
                        computed: _computed,
                        created: _created,
                        mounted: _mounted,
                        methods: _methods
                    });
                }, function (e) {
                    console.log(e);
                    debugger;
                    throw new Error(e);
                });
        })
    }

    /**
     * 获取模板文件
     * @param {*} filePath 
     * @returns 
     */
    async getTemplateFiles(filePath) {
        if (!$) {
            this.throwError('请先加载JQ库');
        }
        return new Promise((resolve, reject) => {
            $.get(filePath).then(function (res) {
                resolve({
                    template: res
                })
            });
        })

    }

    /**
     *  容器放置操作 
     * @param {*} container 
     * @param {*} idName 
     */
    pushDiv(container, idName = new Date().getTime()) {
        let _div = document.createElement('div');
        _div.id = idName;
        container.appendChild(_div)

    }



    /**
     *  批量放置组件到容器中
     * @param {*} compntListArray 
     * @returns 
     */
    async batchPushCompnt(compntListArray) {
        if (!Array.isArray(compntListArray)) {
            this.throwError('batchPushCompnt 第一个参数必须是数组');
        }
        const that = this;

        return new Promise.all(compntListArray.map(async (item) => {
            return new Promise((resolve) => {

                resolve(that.pushComponent(item))

            })
        }))
    }


    /**
     * 
     * 监听css样式文件加载完毕之后的回调
     * 
     * @param {*} link 
     * @param {*} onload 
     */
    superviseCssLinkLoad(link, onload) {
        const that = this;

        if (!that.isSafari) {
            requestIdleCallback(() => {
                if (link.sheet) {
                    if (link.sheet.cssRules && link.sheet.cssRules.length) {
                        typeof onload === 'function' && onload()
                    } else {
                        that.superviseCssLinkLoad(link, onload)
                    }
                } else {
                    that.superviseCssLinkLoad(link, onload)
                }
            })
        } else {
            setTimeout(() => {
                if (link.sheet) {
                    if (link.sheet.cssRules && link.sheet.cssRules.length) {
                        typeof onload === 'function' && onload()
                    } else {
                        that.superviseCssLinkLoad(link, onload)
                    }
                } else {
                    that.superviseCssLinkLoad(link, onload)
                }
            }, 100)
        }


    }

    isSafari() {
        return (/Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent));
    }

    /**
     * 获取注册 vue 组件脚本
     */
    getRegVueComponentScript(componentId, initdata = {}, initMethods = {}, loadCss = false, type = 2) {
        return new Promise(async (resolve, reject) => {
            if (!componentId) {
                this.throwError('你使用了注册组件功能，但该组件没有指定参数！')
            }

            //根据id初始化组件
            let res = await this.makeComponent(componentId, type, initdata, initMethods, loadCss)
            resolve(res);
        })
    }


    /**
     * 使用在 Vue 
     */
    useInVue() {
        Vue.prototype.$fastvue = this;
    }

}
