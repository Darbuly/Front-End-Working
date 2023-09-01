function returnProps() {
	return ['prop_value'];
}

function returnData() {
	return {
		count: 1,
		itemDic: null
	}

}
function returnCreated() {
	return function () {
	}
}
function returnMethods() {
	return {
		addCount: function () {
			this.count++;
		}
	}
}