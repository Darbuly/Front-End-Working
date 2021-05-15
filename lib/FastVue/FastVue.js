/**
 * FastVue 
 * version 1.1.0
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

    initConfig() {
        this.log('安装配置');
    }

    log(obj) {
        this.isDebug && console.log(obj)
    }

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

    throwError(msg) {
        throw new Error(`FastVue Error: ${msg}`)
    }

    async getVM(container, componentId) {
        let _vm = await this.pushComponent(container, componentId);
        return _vm;
    }

    async pushComponent(container, componentId, initdata = {}, initMethods = {}) {
        this.log('放置一个组件');


        if (!container || typeof container != 'string') {
            this.throwError('container 参数不正确，应该是字符串')
        }
        let _cont = document.querySelector(container);
        if (!_cont) {
            this.throwError('你给的 container 参数没法获取到具体DOM对象');
        }
        // 放置容器
        let _div = this.pushDiv(_cont, componentId);

        // 加载组件
        let _tpl = await this.loadTemplate(componentId);
        if (!_tpl) {
            this.throwError(`组件 ${componentId}找不到`);
        }

        // 加载组件脚本
        let _script = await this.getComponentScript(componentId);
        this.log('组件脚本数据信息为', _script);
        let _VM = new Vue({
            el: `#${componentId}`,
            template: _tpl.template,
            data: this.initComponentData(initdata, _script.data),
            created: _script.created,
            methods: this.initComponentData(initMethods, _script.methods)
        });
        if (!this.$VM[`${container}`]) {
            this.$VM[`${container}`] = {};
        }
        this.$VM[`${container}`][`${componentId}`] = _VM;
        return _VM;
    }

    initComponentData(initdata, defaultData) {
        let _data = {};

        for (const key in defaultData) {
            if (Object.hasOwnProperty.call(defaultData, key)) {
                const element = defaultData[key];
                if (initdata[key]) {
                    _data[key] = initdata[key]
                } else {
                    _data[key] = element;
                }
            }
        }
        return _data;
    }

    async loadTemplate(componentId) {
        if (!this.templateList[`${componentId}`]) {
            let _tpl = await this.getTemplateFiles(`${this.templatePathRoot}${componentId}/${componentId}.html`);
            this.templateList[`${componentId}`] = _tpl;
        }
        return this.templateList[`${componentId}`];
    }
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

                    //解析methods
                    let _methods = returnMethods();
                    returnMethods = null;

                    resolve({
                        data: _data,
                        created: _created,
                        methods: _methods
                    });
                });
        })
    }

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

    pushDiv(container, idName = new Date().getTime()) {
        let _div = document.createElement('div');
        _div.id = idName;
        container.appendChild(_div)

    }


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
