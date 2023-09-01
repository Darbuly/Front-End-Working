function returnProps() {
	return ['prop_value', 'treeData', 'level', "itemDic", "parentkey"];
}

function returnData() {
	return {
		showIndex: {}
	}

}

function returnComputed() {
	return {
		dynamicClass: function () {
			const classObj = {
				'uf-tree-node': true,
			};
			if (this.level) {
				if (Number(this.level) <= 3) {
					classObj[`uf-tree-node-level-${Number(this.level) - 1}`] = true
				} else {
					// 超过三级统一class
					classObj[`uf-tree-node-level-more`] = tr
				}
			}
			return classObj;
		},
		dynamicTreeData: function () {
			const _treeData = JSON.parse(JSON.stringify(this.treeData));

			if (this.level == "3") debugger;
			// 整合 showIndex
			_treeData.map((tItem, tIndex) => {
				if (true == this.showIndex[tIndex]) {
					tItem["_showBody"] = true;
				} else {
					tItem["_showBody"] = false;
				}
			})

			return _treeData;
		}
	}
}

function returnMounted() {
	return function () {
	}
}

function returnCreated() {
	return function () {
	}
}
function returnMethods() {
	return {
		// 展开、收缩子节点
		toggleNode: function (index) {
			if (!this.showIndex[index]) this.showIndex[index] = false;
			this.showIndex[index] = !this.showIndex[index];
			this.showIndex = JSON.parse(JSON.stringify(this.showIndex))
		},
		getIdkey: function (index) {
			return this.parentkey + '_' + index;
		}
	}
}