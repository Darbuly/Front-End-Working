function returnData() {
	return {

	};
}
function returnCreated() {
	return function () {
		console.log('组件创建完毕')
	}
}
function returnMethods() {
	return {
		changFn: function (data) {
			console.log(data)
		},
		rowClickEvent: function () {
			console.log(this.propsdata);
		}
	}
}