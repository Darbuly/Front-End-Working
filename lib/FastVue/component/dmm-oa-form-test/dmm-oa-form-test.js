
function returnData() {
	return {
		count: 1,
		form_obj: {
			form_value: null
		},
	}
}
function returnCreated() {
	return function () {
		VueApp = this;
	}
}
function returnMethods() {
	return {
		addCount: function () {
			this.count++;
		}
	}
}