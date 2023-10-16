function returnProps() {
	return ['prop_value'];
}

function returnData() {
	return {
		data: {},
		isDesign: true,
		qrCodeUrl: "http://localhost:8080/pds/qrauth?actionType=getqrcode",
		status: "",

		// status_text: "请用手机扫码",
	}

}
function returnCreated() {
	return function () {
	}
}

function returnComputed() {
	return {
		status_text: function () {
			if (this.status == "expired") {
				return "请刷新二维码"
			} else if (this.status == "authorizing") {
				return "请在手机上允许授权"
			}
			return "请用手机扫码";
		}
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

		refresh() {

		}

	}
}