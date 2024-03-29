function returnProps() {
  return ['prop_value', 'template_id', "width", "height", "id_key", "rootVueAttribute"];
}

function returnData() {
  return {
    ctxName: "__CTX__",
    count: 1,
    uiType: "senior_containerAutoHeight",
    data_codes: {},
    renderChildrenMap: {},
    useItemDic: null,
    itemDic: null
  }
}
function returnComputed() {
  return {
    isDev: function () {
      return 'undefined' == typeof parentV;
    },
    wrapperId: function () {
      const _key = this.getIdKey();
      if (_key == null) {
        return this.template_id + '_wrapper';
      } else {
        return this.template_id + '_wrapper' + "_" + _key;
      }
    },
    itemId: function () {
      return this.template_id + "_" + (this.getIdKey() ? this.getIdKey() : "0");
    },
    showSlot: function () {
      // 开发环境，均显示
      if (this.isDev) {
        return true
      }
      return (this.itemDic != null) && this.itemDic.itemId != null;
    },
  }
}

function returnCreated() {
  return function () {
    if (!this.template_id) {
      debugger;
      throw new Error('template_id 必须指定');
    }
  }
}

function returnMounted() {
  return async function () {
    /**
     * created -> mounted
     * 每次 mounted , 都要执行一次 uim 渲染。
     *  
     */
    let parentItemDic = this.$parent.itemDic;

    if (parentItemDic && parentItemDic.itemId != null) {
      if (parentItemDic.uiType.indexOf("container") != -1) {

        /**
         * 处于容器：
         * 情况：处于<uim-container>紧接着之后的嵌套
         */

        if (0 == $("#" + parentItemDic.itemId).length) {
          throw new Error('父容器尚未添加');
        }

        this.pushContainer(parentItemDic, parentItemDic.itemId)

      } else {

        /**
         * 处于vue-uim高级控件之后
         * 情况：处于vue-uim高级控件之后
         */

        let link_item = {
          "itemId": this.wrapperId,
          "uiType": "container",
          "parentContainerId": parentItemDic.itemId,
        }
        if ("undefined" != typeof parentV) {
          parentV.ctrlDic[this.wrapperId] = link_item
        }

        this.pushContainer(parentItemDic, this.wrapperId)

      }
    } else {
      if (this.isRootCtrl()) {
        // 符合根 VUE 判断，则从根 vue 里寻得itemDic

        parentItemDic = this.$root.itemDic;

        /**
         * 处于vue-uim高级控件之后
         * 情况：处于vue-uim高级控件之后
         */

        let link_item = {
          "itemId": this.wrapperId,
          "uiType": "container",
          "parentContainerId": parentItemDic.itemId,
        }
        if ("undefined" != typeof parentV) {
          parentV.ctrlDic[this.wrapperId] = link_item
        }

        this.pushContainer(parentItemDic, this.wrapperId)

      }
    }
  }

}

function returnMethods() {
  return {
    addCount: function () {
      this.count++;
    },
    getIdKey: function () {
      const getKey = function (currentVue) {
        if (currentVue.id_key) {
          return currentVue.id_key;
        } else {
          if (currentVue.$parent) {
            return getKey(currentVue.$parent);
          } else {
            return null;
          }
        }
      }
      return getKey(this);
    },
    pushContainer: async function (parentItemDic, parentContainerId) {
      let finalParentItemDic = parentItemDic;

      // 如果父控件并非 root 控件，则
      if (parentItemDic.itemId != this.$root.itemDic.itemId) {
        finalParentItemDic = parentV.ctrlDic[parentItemDic.itemId];
      }

      // 样式采取优先级：uim数据库中定制好的模板（parentV.orgCtrls） > 当前页面上已有的(parentV.ctrlDic) > 默认样式

      if (!finalParentItemDic['template_children']) finalParentItemDic['template_children'] = {};

      // 判断默认样式 templateChildren 
      const useItem = this.getUseItem(finalParentItemDic, this.template_id);

      if (!useItem) {
        // 默认样式:即uim从未记录该控件渲染样式
        var default_container = this.getDefaultItemDic()

        finalParentItemDic['template_children'][this.template_id] = {
          "use": this.itemId
        };
        ("undefined" != typeof addOneCtrl) && addOneCtrl(this.uiType, { ...default_container, "parentContainerId": parentContainerId });
        await this.waitCtrl();
        this.itemDic = default_container;
        this.afterAddCtrl();
      } else {
        // 取得样式:这里不代表设计模式和生产格式的隔离
        const useItemId = useItem["use"];
        let useItemDic = null;

        if (parentV && parentV.orgCtrls
          && parentV.orgCtrls[useItemId]) {
          useItemDic = parentV.orgCtrls[useItemId];
        } else if (parentV && parentV.ctrlDic
          && parentV.ctrlDic[useItemId]) {
          useItemDic = parentV.ctrlDic[useItemId];
        }

        // 样式容器是否被拷贝过（itemId格式化）,尝试通过 template_as 还原格式
        if (!useItemDic) useItemDic = this.restoreUseItemDic(useItemId, finalParentItemDic)

        if (!useItemDic) {

          // 无法确定容器样式,已经删掉该模板了
          this.readyForRender(null, null)

          return;
        }

        // 确定样式容器，那么保证这个样式容器是样式容器，后面itemId格式化的时候就不会乱掉
        this.checkUseItemDic(useItemDic);

        this.useItemDic = useItemDic;

        // 通过替换 itemId 和 parentContainerId 达到样式复用的效果。
        var setting_container = this.copyUseItemDic(useItemDic)

        // 每个控件都需要做的一件事
        this.beforeAddOneCtrl(setting_container)

        // 修改当前赋值
        setting_container = this.formatText(setting_container);

        if ("undefined" != typeof addOneCtrl) {

          this.readyForRender(this.uiType, { ...setting_container, "parentContainerId": parentContainerId })

          const renderRes = await this.waitCtrl();
          this.afterAddCtrl();
          if (renderRes) {

            // 遍历当前容器的儿子控件(只需要vueLink的就行)，准备信号渲染hash renderChildMap
            const _renderChildrenMap = {}
            const ctrlDicList = this.getCtrls();
            Object.keys(ctrlDicList).map(itemId => {
              const itemDic = ctrlDicList[itemId];
              if (itemDic.vueLink
                && this.itemId == itemDic.parentContainerId) {
                _renderChildrenMap[itemId] = false;
              }
            })
            // 验证 _renderChildrenMap 必须有那个“一级”的itemId.
            this.renderChildrenMap = _renderChildrenMap;

            // 释放showSlot，儿子控件准备数据
            this.itemDic = setting_container;

          } else {
            throw new Error('由于依赖addOneCtrl，有可能父亲不执行')
          }

        }

      }
    },
    waitCtrl: function () {
      return new Promise((resolve => {
        const waitDomId = this.itemId;
        var waitTimer = null;
        var time = 100;
        clearInterval(waitTimer);
        if (!waitTimer) {
          waitTimer = setInterval(function () {
            console.log('time', time);
            if ($("#" + waitDomId).length > 0) {
              clearInterval(waitTimer);
              resolve(true);
              time = 100;
            };
            if (0 >= time) {
              clearInterval(waitTimer);
              resolve(false);
              time = 100;
            }
            time--;
          }, 200)
        }
      }));
    },

    // 允许添加控件之后执行一些事情。
    afterAddCtrl: function () { },

    // 可以定义寻找 root Vue 的条件，可以在控件指定对应的参数，让控件自动判断是否根vue-uim
    isRootCtrl: function () {
      const codeVarName = this.rootVueAttribute;
      if (this.$parent && this.$parent[codeVarName]
        && this.$parent[codeVarName]) {
        return true;
      } else {
        return false;
      }
    },

    // 儿子的addOneCtrl，是发送渲染信号，交给父亲去执行
    readyForRender: function (uiType, itemDic) {
      // 儿子item通过 $parent.sendRenderMsg
      if (this.$parent
        && this.$parent.sendRenderMsg) {
        if (itemDic && itemDic.itemId) {
          this.$parent.sendRenderMsg(itemDic.itemId, uiType, itemDic);
        } else {

          // 该控件已经被删了
          this.$parent.sendRenderMsg(null, null, null);

        }
      } else {
        if (uiType && itemDic)
          addOneCtrl(uiType, itemDic);
      }

    },

    // 作为父亲，接收到儿子的渲染信号
    sendRenderMsg: function (itemId, uiType, itemDic) {

      // 允许空 itemDic ，代表下一级全是原生 uim 控件
      if (itemId
        && itemDic) {
        this.renderChildrenMap[itemId] = {
          ...itemDic,
          uiType
        }
      }


      // 每次接收到儿子的信号，就试着判断是否满足渲染——全部都有渲染信号
      let canRender = true;

      for (const rItemId in this.renderChildrenMap) {
        if (Object.hasOwnProperty.call(this.renderChildrenMap, rItemId)) {
          const rItemDic = this.renderChildrenMap[rItemId];
          if (false === rItemDic) {
            canRender = false;
          }
        }
      }

      if (canRender) {
        // 渲染阶段

        // 获得控件库，然后将vueLink的真实itemDic替换，将新的控件库递归调用即可。
        const ctrlDicList = this.getCtrls();
        const newDicListTmp = {};

        Object.keys(ctrlDicList).map(cItemid => {
          newDicListTmp[cItemid] = ctrlDicList[cItemid];

          // 后代控件拷贝的条件：必须是原生uim控件，且模板useItemDic.itemId 不是当前节点
          if (
            this.useItemDic.itemId != this.itemId
            && !newDicListTmp[cItemid].vueLink
            && newDicListTmp[cItemid].parentContainerId == this.useItemDic.itemId) {
            this.copyItemDicNode(newDicListTmp, cItemid, this.itemId, ctrlDicList)
          }

        })

        for (const itemId in this.renderChildrenMap) {
          if (Object.hasOwnProperty.call(this.renderChildrenMap, itemId)) {
            const itemDic = this.renderChildrenMap[itemId];

            // 替换
            newDicListTmp[itemId] = itemDic;

          }
        }

        // 递归添加
        this.circleAddCtrl(this.itemId, newDicListTmp);

        // 上下文赋值
        if (this.context
          && this.context.data) {

          // uim 数据源
          window.refreshOneCtrl && window.refreshOneCtrl(this.itemId, this.context.data);

          // $() 数据
          $("#" + this.itemId).data("vue_uim_ctx_data", this.context.data);

        }

        // 重新唤起 ajax 数据源
        if (0 < Object.keys(this.data_codes).length) {
          const codes = Object.keys(this.data_codes).join(',');
          this.asyncGetData(codes);
        }


      }

    },

    // 递归向上获取上下文的ItemId
    getContextVueRecursively: function () {
      const getContext = function (currentVue) {
        if (currentVue.context) {
          return currentVue;
        } else {
          if (currentVue.$parent) {
            return getContext(currentVue.$parent);
          } else {
            return null;
          }
        }
      }
      return getContext(this);
    },

    // 递归拷贝某个 uim 控件
    copyItemDicNode: function (outTreeDataMap, nodeIdToCopy, newParentId, allNodeMap) {
      const copiedNode = allNodeMap[nodeIdToCopy];

      if (!copiedNode) {
        // Node not found, return null or handle the error as needed.
        return null;
      }

      // Generate a new unique ID for the copied node.
      const newId = nodeIdToCopy + "_" + this.getIdKey();

      // Create a copy of the node with the new ID and parent_id.
      const newNode = {
        ...copiedNode,
        parentContainerId: newParentId,
        itemId: newId
      };

      // 上下文脚本赋值要复原，否则就会影响拷贝后的上下文不一致。
      if (newNode._setCtx) {
        if (newNode.jsContent_pc) newNode.jsContent_pc = newNode._rawJsContent;
        if (newNode.jsContent) newNode.jsContent = newNode._rawJsContent;
        newNode._setCtx = false;
      }

      // Add the copied node to the tree data.
      outTreeDataMap[newNode.itemId] = newNode;

      // Recursively copy child nodes.
      const childNodesMap = {};
      for (const _ItemId in allNodeMap) {
        if (Object.hasOwnProperty.call(allNodeMap, _ItemId)) {
          const itemDic = allNodeMap[_ItemId];
          if (itemDic.parentContainerId == copiedNode.itemId) {
            childNodesMap[itemDic.itemId] = itemDic;
          }
        }
      }

      for (const childNodeItemId in childNodesMap) {
        this.copyItemDicNode(outTreeDataMap, childNodeItemId, newId, allNodeMap)
      }

      return outTreeDataMap;
    },

    // 获得控件库
    getCtrls: function () {
      return parentV.orgCtrls ? parentV.orgCtrls : parentV.ctrlDic;
    },

    // 需要根据不同的控件，指定不同的赋值方式 
    formatText: function (itemDIc) {
      return itemDIc;
    },

    // 对 circleAddCtrl 进行覆写 
    circleAddCtrl: function (parentContainerId, ctrlsDic) {

      var samelayers = getSortContainerItems(parentContainerId, ctrlsDic);

      if (!samelayers || samelayers.length == 0) {
        return;
      }

      for (var i = 0; i < samelayers.length; i++) {

        var oneCtrlDic = samelayers[i];

        // 每个控件添加之前都会做一件事
        this.beforeAddOneCtrl(oneCtrlDic);

        addOneCtrl(oneCtrlDic.uiType, oneCtrlDic);

        if (oneCtrlDic.containAble
          || oneCtrlDic.uiType == 'container'
          || oneCtrlDic.uiType == 'senior_containerFlow'
          || oneCtrlDic.uiType == 'senior_swipper'
          || oneCtrlDic.uiType == 'senior_containerAutoHeight') {
          this.circleAddCtrl(oneCtrlDic.itemId, ctrlsDic);
        }
        else if (oneCtrlDic.uiType == 'senior_containerRow') {
          this.circleAddCtrl(oneCtrlDic.cItemId, ctrlsDic);
        }
        else if (oneCtrlDic.uiType == 'senior_frame1') {
          this.circleAddCtrl(oneCtrlDic.itemId, ctrlsDic);
        }
        else if (oneCtrlDic.group == "tab") {
          for (var j = 0; j < oneCtrlDic.tabs.length; j++) {
            var tabPageId = oneCtrlDic.tabs[j].tabPageId;
            this.circleAddCtrl(tabPageId, ctrlsDic);
          }
        }
        else if (oneCtrlDic.uiType == 'senior_3d_swipper') {
          this.circleAddCtrl(oneCtrlDic.itemId, ctrlsDic);
          //添加完成之后，触发3D渲染
          render3DSwiper(oneCtrlDic)
        }
      }

    },

    // 每个控件添加之前都会做的事情
    beforeAddOneCtrl: function (currentItemDic) {

      // 数据源、上下文数据，都应该在预览模式才进行
      if (this.$root
        && this.$root.isDesign) {
        return;
      }

      // 监测是否需要处理数据源（因为主 uim 的数据源生命周期已经过时，这里需要另外唤起
      // ,但是在唤起之前，需要准备好 code ）

      if (currentItemDic.dataApiId) {
        this.data_codes[currentItemDic.dataApiId] = currentItemDic.itemId;
      }

      // 监测是否使用了脚本，需要给每个脚本附上上下文数据;
      if (currentItemDic.jsContent_pc
        && !currentItemDic._setCtx
      ) {
        currentItemDic._rawJsContent = currentItemDic.jsContent_pc;
        currentItemDic.jsContent_pc = this.setContextDataJs(currentItemDic.jsContent_pc);
        currentItemDic._setCtx = true;
      }
      if (currentItemDic.jsContent
        && currentItemDic._setCtx
      ) {
        currentItemDic._rawJsContent = currentItemDic.jsContent;
        currentItemDic.jsContent = this.setContextDataJs(currentItemDic.jsContent);
        currentItemDic._setCtx = true;
      }

    },

    // 置上下文脚本
    setContextDataJs: function (rawJsContent) {
      const contextVue = this.getContextVueRecursively();
      const contextItemId = contextVue.itemId;
      const contextCtxName = contextVue.ctxName;
      if (contextItemId) {
        return `var ${contextCtxName}=$("#${contextItemId}").data("vue_uim_ctx_data"); 
        ${rawJsContent}`
      }
    },

    // 覆写 数据源
    asyncGetData: function (codes) {
      var commonParams = null;
      var prItemDic = parentV.pageSetDic;
      if (prItemDic && prItemDic.enableReqCommonParams == 1 && prItemDic.cstFields) {
        commonParams = {};
        loadCstParam2Req(prItemDic.cstFields, prItemDic.cstFieldsSubKey, commonParams);
      }

      const that = this;
      // todo show loading 
      reqCtrlValues(codes, {}, commonParams, false, null, function (data) {
        // todo hide loading 
        showJuhua(false);
        if (data) {
          if (data.code == 0) {
            var dataList = data["data"];
            if (dataList) {
              for (var i = 0; i < dataList.length; i++) {
                var map = dataList[i];
                if (map && Object.keys(map).length > 0) {
                  var code = Object.keys(map)[0];
                  var objValue = map[code];

                  //如果是DmmApi接口类型，需要做一个转换
                  if (objValue && objValue.gsType && objValue.gsType == "dmmApi") {
                    objValue = handleDmmApiData(that.data_codes[code], objValue, function (code, resData) {
                      window.refreshOneCtrl(code, resData);
                    });
                  } else {
                    window.refreshOneCtrl(that.data_codes[code], objValue);
                  }
                }
              }
            }

          }
          else {
            var msg = data.msg ? data.msg : "获取数据失败！";
            tipMsg(msg);
          }
        }
        else {
          tipMsg("系统异常!");
        }
      });
    },

    // 默认拷贝模板的方式
    copyUseItemDic: function (useItemDic) {
      return {
        ...useItemDic,
        itemId: this.itemId,
      }
    },

    // 检查样式容器
    checkUseItemDic: function (useItemDic) {
      useItemDic.template_as = useItemDic.itemId;
    },

    // 样式容器格式化检查
    restoreUseItemDic: function (useItemId, finalParentItemDic) {
      const allCtrlsMap = this.getCtrls();
      let newUseItemDic = null;
      for (const itemId in allCtrlsMap) {
        if (Object.hasOwnProperty.call(allCtrlsMap, itemId)) {
          const itemDic = allCtrlsMap[itemId];
          if (useItemId == itemDic.template_as) {
            // 寻得格式化之前的 itemDic
            newUseItemDic = itemDic;
            this.checkUseItemDic(newUseItemDic)
          }
        }
      }

      if (newUseItemDic) {

        // 修正finalParentItemDic
        if (parentV.ctrlDic
          && parentV.ctrlDic[finalParentItemDic.itemId]) {

          if (!parentV.ctrlDic[finalParentItemDic.itemId]["template_children"][this.template_id]) {
            // 有可能是之前没有命名空间，现在有了，那么需要修复命名空间
            parentV.ctrlDic[finalParentItemDic.itemId]["template_children"][this.template_id] = {};
          }

          parentV.ctrlDic[finalParentItemDic.itemId]["template_children"][this.template_id]["use"] = newUseItemDic.itemId;
        }
        if (parentV.orgCtrls
          && parentV.orgCtrls[finalParentItemDic.itemId]) {

          if (!parentV.orgCtrls[finalParentItemDic.itemId]["template_children"][this.template_id]) {
            // 有可能是之前没有命名空间，现在有了，那么需要修复命名空间
            parentV.orgCtrls[finalParentItemDic.itemId]["template_children"][this.template_id] = {};
          }

          parentV.orgCtrls[finalParentItemDic.itemId]["template_children"][this.template_id]["use"] = newUseItemDic.itemId;
        }

        // 后面交给保存，去提交修正数据了。

      }
      return newUseItemDic;
    },

    getUseItem: function (finalParentItemDic, template_id) {

      if (finalParentItemDic['template_children'][this.template_id]) {
        return finalParentItemDic['template_children'][this.template_id];
      } else {

        // 有可能是非命名空间的那个时候创建的模板
        if (0 != this.template_id.indexOf(this.$root.itemId)) {
          const unamespace_template_id = template_id.replace(`${this.$root.itemDic.itemId}_`, "");
          if (finalParentItemDic['template_children'][unamespace_template_id]) {
            return finalParentItemDic['template_children'][unamespace_template_id];
          }
        }

        return null;
      }
    },

    getDefaultItemDic: function () {
      return {
        "itemId": this.itemId,
        "uiType": "senior_containerAutoHeight",
        "positionType": "relative",
        "layerOrderId": 0,
        "alignType": 0,
        "top": 0,
        "left": 0,
        "vueLink": true,
        "width": this.width ? this.width : 200,
        "height": this.height ? this.height : 30,
        "borderRadius": "0",
        "borderWidth": "0",
        "borderColor": "rgba(200,200,200,0.8)",
        "borderType": "border",
        "borderStyle": "solid",
        "dataFromType": "",
        "labelId": "",
        "fieldName": "控件-" + this.itemId,
        "fieldValue": ""
      }
    }
  }
}