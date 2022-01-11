function returnData() {
	return {
		defaultClass: 'swipe-vant',
		addClass: '',
		autoplay: 3000,
		active: 0,
		list: [],

	};
}

function returnCreated() {
	return function () {
		console.log(this)
		console.log('组件创建完毕')
	}
}
function returnComputed() {
	return {
		iterateList: function () {
			if (Array.isArray(this.list)
				&& this.list.length) {
				console.log(this.list)
				return this.list;
			} else if (this.propsdata
				&& Array.isArray(this.propsdata.swipe_vant_list)
				&& this.propsdata.swipe_vant_list.length) {
				return this.propsdata.swipe_vant_list;
			} else {
				return [];
			}

		},
		useComponent: function (item) {
			if (item.contentComponent != undefined) {
				return item.contentComponent
			} else if (this.contentComponent) {
				return item.contentComponent
			} else {
				console.log('加载了组件，但组件里的嵌套组件未指定')
				return undefined;
			}
		}
	}
}

function returnMethods() {
	return {

		changFn() {

		}

	}
}