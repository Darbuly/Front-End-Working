function returnProps() {
	return ['prop_value'];
}

function returnData() {
	return {
		count: 1,
		itemDic: null,
		data: [{
			label: '一级 1',
			children: [{
				label: '二级 1-1',
				children: [{
					label: '三级 1-1-1'
				}]
			}]
		}, {
			label: '一级 2',
			children: [{
				label: '二级 2-1',
				children: [{
					label: '三级 2-1-1'
				}]
			}, {
				label: '二级 2-2',
				children: [{
					label: '三级 2-2-1'
				}]
			}]
		}, {
			label: '一级 3',
			children: [{
				label: '二级 3-1',
				children: [{
					label: '三级 3-1-1'
				}]
			}, {
				label: '二级 3-2',
				children: [{
					label: '三级 3-2-1'
				}]
			}]
		}]
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