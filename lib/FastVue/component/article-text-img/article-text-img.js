function returnData() {
	return {
		img_spuare_url: 'http://www.t-matrix.com/drupal/sites/t-matrix2/themes/mytvtheme/images/square.png'
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