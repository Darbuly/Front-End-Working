function returnData() {
	return {
		value: '',
		showPicker: false,
		columns: ['杭州', '宁波', '温州', '绍兴', '湖州', '嘉兴', '金华', '衢州'],
	};
}
function returnCreated() {
	return function () {
	}
}
function returnMethods() {
	return {
		onConfirm(value) {
			this.value = value;
			this.showPicker = false;
		},
	}
}