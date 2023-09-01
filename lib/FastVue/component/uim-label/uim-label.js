function returnMixins() {
	return ['uim-ctrl-mixin']
}


function returnProps() {
	return ['prop_value', 'data'];
}

function returnData() {
	return {
		count: 1,
		uiType: "label",
	}

}
function returnCreated() {
	return function () {

	}
}

function returnMounted() {
	return function () {

	}

}

function returnMethods() {
	return {

		formatText: function (itemDIc) {
			// label 赋值策略：itemDic的英文名变量 > 插槽里的文本
			let text = "uim-label"
			const engName = itemDIc.engName ? itemDIc.engName : itemDIc.engName_pc;
			if (engName && this.data && this.data[engName]) {
				itemDIc.fieldValue = this.data[engName];
				itemDIc.fieldValue_pc = this.data[engName];
			} else if (this.$slots.default
				&& this.$slots.default.length > 0) {
				itemDIc.fieldValue = this.$slots.default[0].text;
				itemDIc.fieldValue_pc = this.$slots.default[0].text;
			}
			return itemDIc;
		},

		getDefaultItemDic: function () {

			const _itemDic = {
				"itemId": this.itemId,
				"uiType": "label",
				"positionType": "absolute",
				"layerOrderId": 0,
				"alignType": 0,
				"top": 0,
				"vueLink": true,
				"left": 0,
				"width": 200,
				"height": 20,
				"textId": "kTextId",
				"borderRadius": "0",
				"borderWidth": "0",
				"borderColor": "rgba(200,200,200,0.8)",
				"borderType": "border",
				"borderStyle": "solid",
				"dataFromType": "",
				"labelId": "",
				"fieldName": "",
				"fieldValue": "",
				"uaType": "pc",
				"fieldValue_pc": "",
				"engName_pc": "label",
				"engName": "label"
			}
			return this.formatText(_itemDic)
		}
	}
}