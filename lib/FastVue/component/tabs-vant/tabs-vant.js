function returnData() {
	return {
		active: 0,
		list: []
	};
}

function returnCreated() {
	return function () {
		console.log(this)
		console.log('组件创建完毕')
	}
}

function returnMethods() {
	return {
		changFn() {

		}
	}
}