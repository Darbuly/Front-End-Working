function returnProps() {
	return ['prop_value'];
}

function returnData() {
	return {
		count: 1,
		sales_line_item: null,
		dsh_data: null
	}

}
function returnCreated() {
	return function () {
	}
}


function returnMounted() {
	return function () {
	}
}


function returnMethods() {
	return {
		addCount: function () {
			this.count++;
		}
	}
}