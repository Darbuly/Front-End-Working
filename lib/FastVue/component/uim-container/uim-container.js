function returnMixins() {
	return ['uim-ctrl-mixin']
}

function returnProps() {
	return ["fieldName"];
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
		}
	}
}