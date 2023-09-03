function returnProps() {
  return ['prop_value', 'template_id', "width", "height", "id_key", "rootVueAttribute"];
}

function returnData() {
  return {
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
      if (!finalParentItemDic['template_children'][this.template_id]) {
        // 默认样式:即uim从未记录该控件渲染样式
        var default_container = this.getDefaultItemDic()

        finalParentItemDic['template_children'][this.template_id] = {
          "use": this.itemId
        };
        ("undefined" != typeof addOneCtrl) && addOneCtrl(this.uiType, { ...default_container, "parentContainerId": parentContainerId });
        await this.waitCtrl();
        this.itemDic = default_container;
      } else {
        // 取得样式
        const useItemId = finalParentItemDic['template_children'][this.template_id]["use"];
        let useItemDic = null;

        if (parentV && parentV.orgCtrls
          && parentV.orgCtrls[useItemId]) {
          useItemDic = parentV.orgCtrls[useItemId];
        } else if (parentV && parentV.ctrlDic
          && parentV.ctrlDic[useItemId]) {
          useItemDic = parentV.ctrlDic[useItemId];
        }
        if (!useItemDic) {
          throw new Error('无法确定容器样式');
        }
        this.useItemDic = useItemDic;

        // 通过替换 itemId 和 parentContainerId 达到样式复用的效果。
        var setting_container = {
          ...useItemDic,
          itemId: this.itemId,
        }

        // 当前 itemDic 也有可能需要唤起数据源
        if (setting_container.dataApiId) this.data_codes[setting_container.dataApiId] = true;

        // 修改当前赋值
        setting_container = this.formatText(setting_container);

        if ("undefined" != typeof addOneCtrl) {

          this.readyForRender(this.uiType, { ...setting_container, "parentContainerId": parentContainerId })

          const renderRes = await this.waitCtrl();
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
        this.$parent.sendRenderMsg(itemDic.itemId, uiType, itemDic);
      } else {
        addOneCtrl(uiType, itemDic);
      }

    },

    // 作为父亲，接收到儿子的渲染信号
    sendRenderMsg: function (itemId, uiType, itemDic) {

      this.renderChildrenMap[itemId] = {
        ...itemDic,
        uiType
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
            newDicListTmp[cItemid + "_" + this.getIdKey()] = {
              ...newDicListTmp[cItemid],
              parentContainerId: this.itemId,
              itemId: cItemid + "_" + this.getIdKey()
            };
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

        // 重新唤起数据源
        if (0 < Object.keys(this.data_codes).length) {
          const codes = Object.keys(this.data_codes).join(',');
          this.asyncGetData(codes);
        }
      }

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

      // 监测是否需要处理数据源（因为主 uim 的数据源生命周期已经过时，这里需要另外唤起
      // ,但是在唤起之前，需要准备好 code ）

      if (currentItemDic.dataApiId) {
        this.data_codes[currentItemDic.dataApiId] = currentItemDic.itemId;
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
                    objValue = handleDmmApiData(code, objValue, function (code, resData) {
                      window.refreshOneCtrl(that.data_codes[code], resData);
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