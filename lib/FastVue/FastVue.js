/**
 * FastVue 
 * version 1.3.4
 *  
 *  
 *  author: Wangwenwei (970073804@qq.com)
 * 
 */
class FastVue {

    constructor({ appName, templatePathRoot, config, plugins }) {
        this.appName = appName;
        this.templatePathRoot = templatePathRoot;
        this.config = config;
        this.plugins = plugins;
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
    async regComponent(componentId, initdata = {}, initMethods = {}, loadCss = false) {
        if (!componentId) {
            this.throwError('你使用了注册组件功能，但该组件没有指定参数！')
        }

        //根据id初始化组件
        let res = await this.makeComponent(componentId, 1, initdata, initMethods, loadCss)

        return res;
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
     * @param { 创造类型 } type 默认为0，即创建VM对象，1为注册Vue组件
     * @param { 初始化数据 } initdata 
     * @param { 初始化方法 } initMethods 
     * @returns VM对象
     */
    async makeComponent(
        componentId,
        type = 0,
        initdata = {},
        initMethods = {},
        loadCss = false
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
                const that = this;
                return Vue.component(componentId, {
                    props: ['componentkey', 'propsdata'],
                    template: _tpl.template,
                    data: function () {
                        return that.initComponentData(initdata, _script.data);
                    },
                    computed: _script.computed,
                    created: _script.created,
                    methods: that.initComponentData(initMethods, _script.methods)
                });
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
     * 模板解析
     * @param {*} componentId 
     * @returns 
     */
    async loadTemplate(componentId) {
        if (!this.templateList[`${componentId}`]) {
            let _tpl = await this.getTemplateFiles(`${this.templatePathRoot}${componentId}/${componentId}.html`);
            this.templateList[`${componentId}`] = _tpl;
        }
        return this.templateList[`${componentId}`];
    }

    async loadCss(componentId) {
        if (!$) {
            this.throwError('请先加载JQ库');
        }
        let url = `${this.templatePathRoot}${componentId}/${componentId}.css`;
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

                resolve({
                    cssObj: url
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
                `${this.templatePathRoot}${componentId}/${componentId}.js`
                , function (res) {
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

                    //解析methods
                    let _methods = returnMethods();
                    returnMethods = null;

                    resolve({
                        data: _data,
                        computed: _computed,
                        created: _created,
                        methods: _methods
                    });
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

}
