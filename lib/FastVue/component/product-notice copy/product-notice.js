function returnData() {
	return {
		img: '',
		title: '',
		color: '',
		to_url: ''
	};
}
function returnCreated() {
	return function () {
	}
}
function returnMethods() {
	return {
		to_nav: function () {
			if (this.to_url) {
				window.location.href = this.to_url;
			}
		}
	}
}