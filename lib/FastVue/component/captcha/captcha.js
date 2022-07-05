function returnData() {
	return {
		code: ""
	}

}
function returnCreated() {
	return function () {
	}
}
function returnMethods() {
	return {
		onSubmit: function () {
			this.count++;
		}
	}
}