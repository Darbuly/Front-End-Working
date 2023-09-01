function returnProps() {
  return ['prop_value', 'template_id', "width", "height", "id_key", "rootVueAttribute"];
}

function returnData() {
  return {
    count: 1,
    uiType: "senior_containerAutoHeight",
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

        // 通过替换 itemId 和 parentContainerId 达到样式复用的效果。
        var setting_container = {
          ...useItemDic,
          itemId: this.itemId,
        }

        // 修改当前赋值
        setting_container = this.formatText(setting_container);

        if ("undefined" != typeof addOneCtrl) {
          addOneCtrl(this.uiType, { ...setting_container, "parentContainerId": parentContainerId });
        }
        if ("undefined" != typeof parentV) {

          const ctrlDicList = parentV.orgCtrls ? parentV.orgCtrls : parentV.ctrlDic;

          // 要把 vue 关联的控件过滤掉，vue关联的控件，交给vue调用uim渲染引擎自主渲染。
          const noVueLinkOrgCtrls = {};
          Object.keys(ctrlDicList).map(itemId => {
            if (!ctrlDicList[itemId].vueLink) {

              // 后代控件如果是模板样式下一个体系的，那么这里做拷贝整颗后代控件树给当前控件
              if (ctrlDicList[itemId].parentContainerId == useItemId) {
                noVueLinkOrgCtrls[itemId + "_" + this.getIdKey()] = {
                  ...ctrlDicList[itemId],
                  parentContainerId: this.itemId,
                  itemId: itemId + "_" + this.getIdKey()
                };
              } else {

                // 后代控件树并非模板样式下的体系，比如uim定制样式时用到了多层非vue-uim的容器嵌套，则保留
                noVueLinkOrgCtrls[itemId] = ctrlDicList[itemId];
              }

            }
          })
          if ("undefined" != typeof circleAddCtrl) {
            circleAddCtrl(this.itemId, noVueLinkOrgCtrls);
          }
          await this.waitCtrl();
          this.itemDic = setting_container;
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

    // 需要根据不同的控件，指定不同的赋值方式 
    formatText: function (itemDIc) {
      return itemDIc;
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