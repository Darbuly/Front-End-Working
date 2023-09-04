function returnMixins() {
	return ['uim-ctrl-mixin']
}

function returnProps() {
	return ["fieldName", "context"];
}

function returnData() {
	return {
		count: 1,
	}

}
function returnComputed() {
	return {
		finalFieldName: function () {
			if (this.fieldName) {
				return this.fieldName;
			} else {
				return "容器" + this.itemId
			}
		}
	}
}

function returnCreated() {
	return function () {

	}
}

function returnMounted() {
	return async function () {

	}

}

function returnMethods() {
	return {

		copyUseItemDic: function (useItemDic) {
			return {
				...useItemDic,
				_ctx: this.context,
				itemId: this.itemId,
			}
		},

		getDefaultItemDic: function () {
			const itemDic = {
				"itemId": this.itemId,
				"uiType": "senior_containerAutoHeight",
				"positionType": "relative",
				"layerOrderId": 0,
				"alignType": 0,
				"top": 0,
				"left": 0,
				"vueLink": true,
				"width": this.width ? this.width : 200,
				"height": this.height ? this.height : "auto",
				"borderRadius": "0",
				"borderWidth": "0",
				"borderColor": "rgba(200,200,200,0.8)",
				"borderType": "border",
				"borderStyle": "solid",
				"dataFromType": "",
				"labelId": "",
				"fieldName": this.finalFieldName,
				"fieldValue": ""
			}

			// 自动继承根 ItemDic 的一些属性，如特效触发器
			const rootItemDic = this.$root.itemDic;
			if (rootItemDic.tpEffectTrigger) itemDic.tpEffectTrigger = rootItemDic.tpEffectTrigger
			if (rootItemDic.tpEffectTriggerOptions) itemDic.tpEffectTriggerOptions = rootItemDic.tpEffectTriggerOptions

			// 支持指定容器的上下文
			if (this.context) {
				itemDic._ctx = this.context;
			}

			return itemDic;
		}
	}
}