function returnProps() {
	return ['prop_value'];
}

function returnData() {
	return {
		count: 1,
		pdCoverActiveIndex: 0,
		fromConfigSelection: {
			config: ''
		}
	}

}

function returnCreated() {
	return function () {
	}
}
function returnComputed() {
	return {
		dynmPdCoverClass: function () {
			const _class = { 'pd-indicator-item': true, 'pdi-active': false };
			const cApp = this.$refs['pdCover'];
			return _class
		}
	}
}
function returnMethods() {
	return {
		toggleCover(cName) {
			const cApp = this.$refs['pdCover'];
			cApp.setActiveItem(cName)
		},
		pdCoverChange(index) {
			this.pdCoverActiveIndex = index;
		}
	}
}