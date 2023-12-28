function returnProps() {
	return ['prop_value'];
}

function returnData() {
	return {
		count: 1,
		title: "说明理由",
		label: "理由",
		show: false,
		message: ""
	}

}
function returnCreated() {
	return function () {
		if (typeof CpqDialog != 'undefined') {
			CpqDialog = this;
		}
	}
}
function returnMethods() {
	return {
		openDialog(callback) {
			this.show = true;
			this._callback = callback;
		},
		confirm() {
			if (this._callback) {
				this._callback(this.message);
			}
		},
		cancel() {
			if (this._callback) {
				this._callback('');
			}
		}
	}
}