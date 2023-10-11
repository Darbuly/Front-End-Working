function returnProps() {
	return ['prop_value'];
}

function returnData() {
	return {
		data: {},
		isDesign: true,
		qrCodeUrl: "http://localhost:8080/pds/qrauth?actionType=getqrcode"

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
		append(data) {
			const newChild = { id: id++, label: 'testtest', children: [] };
			if (!data.children) {
				this.$set(data, 'children', []);
			}
			data.children.push(newChild);
		},

		remove(node, data) {
			const parent = node.parent;
			const children = parent.data.children || parent.data;
			const index = children.findIndex(d => d.id === data.id);
			children.splice(index, 1);
		},

	}
}