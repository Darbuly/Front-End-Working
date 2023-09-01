function returnProps() {
	return ['prop_value'];
}

function returnData() {
	return {
		data: [{
			id: 1,
			label: '一级 1',
			children: [{
				id: 4,
				label: '二级 1-1',
				children: [{
					id: 9,
					label: '三级 1-1-1'
				}, {
					id: 10,
					label: '三级 1-1-2'
				}]
			}]
		}, {
			id: 2,
			label: '一级 2',
			children: [{
				id: 5,
				label: '二级 2-1'
			}, {
				id: 6,
				label: '二级 2-2'
			}]
		}, {
			id: 3,
			label: '一级 3',
			children: [{
				id: 7,
				label: '二级 3-1'
			}, {
				id: 8,
				label: '二级 3-2'
			}]
		}],

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