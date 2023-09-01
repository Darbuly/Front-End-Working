function returnProps() {
	return ['initTreeData', 'initDataSource'];
}

function returnData() {
	return {
		count: 1,
		activeComponentkey: null,
		treeData: [],
		formData: {},
		hook_list: {}
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

function returnMounted() {
	return function () {
	}
}

function returnComputed() {
	return {

		dynamicData: function () {
			if (this.initTreeData && Object.keys(this.initTreeData).length > 0) {
				const _treeData = JSON.parse(JSON.stringify(this.initTreeData));

				if (Object.keys(this.formData).length == 0 || !this.formData) {
					this.initFormData();
				}

				const _data = this.formatNodeData(_treeData.children, this.formData);
				_treeData.children = [_data];
				return _treeData;
			} else {
				return {}
			}

		}
	}
}

function returnMethods() {
	return {
		addCount: function () {
			this.count++;
		},
		updateFocus: function (e) {
			this.activeComponentkey = e.componentkey;
		},
		handleFormDataChanged: function (e) {
			console.log('handleFormDataChanged root', e);
		},

		initFormData: function () {
			const treeDataFn = function (treeData) {
				let formData = {};
				if (!Array.isArray(treeData.children)) {
					debugger;
					throw new Error('treeData is not Array');
				}
				treeData.children.map(nodeItem => {

					if (nodeItem.children && nodeItem.children.length > 0) {

						// 可以通过 group_default_value 初始化默认分组值
						if (nodeItem.group_default_value) {
							const groupTreeData = treeDataFn(nodeItem);
							formData[nodeItem.name] = [];
							nodeItem.group_default_value.map(gv => {
								formData[nodeItem.name].push(
									{
										...groupTreeData,
										...gv
									}
								)
							})
						} else {
							// 默认分组行数只有一条。
							formData[nodeItem.name] = [treeDataFn(nodeItem)]
						}

					} else {

						// 监测初始值
						if (nodeItem.default_value) {

							switch (nodeItem.default_value.type) {
								case "text":
								case "array":
									formData[nodeItem.name] = nodeItem.default_value.value;
									break;
							}


						} else {
							formData[nodeItem.name] = null;
						}

						// 如果是枚举，且枚举值内部有children,这里要做动态节点
						// 动态节点的key: [枚举值的key]_[枚举值]
						if ("enum" == nodeItem.data_type) {
							const hasChildrenEnumList = nodeItem.enum_list.filter(eItem => {
								if (eItem.children && eItem.children.length > 0) {
									return true;
								}
							})

							if (hasChildrenEnumList.length > 0) {
								hasChildrenEnumList.map(oneChildrenEnumList => {
									const key = `${nodeItem.name}_LINK_${oneChildrenEnumList.value}`;
									formData[key] = [treeDataFn(oneChildrenEnumList)]
								})
							}

						}

					}


				})
				return formData;
			}

			let finalFormData = null;
			if (this.initDataSource) {
				finalFormData = JSON.parse(JSON.stringify(this.initDataSource));
				console.log('initDataSource', this.initDataSource);
			}

			if (finalFormData && Object.keys(finalFormData).length > 0) {
			} else {
				finalFormData = treeDataFn(this.initTreeData)
			}
			this.formData = JSON.parse(JSON.stringify(finalFormData));
		},

		formatNodeData: function (node_data_list, dataVue, path = [], isSingleGroupItem = null) {
			return node_data_list.map(node_data => {

				if (node_data.children && node_data.children.length > 0) {

					// 标志是否分组只有一个节点
					const singleGroupItem = node_data.children.length == 1;
					if (singleGroupItem) {
						node_data.single_group = true;
					}

					const currentVueData = this.getVueDataByPath(dataVue, path.concat(node_data.name));
					const children = [];
					if (Array.isArray(currentVueData)) {

						currentVueData.map((row, row_index) => {
							const res = this.formatNodeData(node_data.children, dataVue, path.concat(node_data.name).concat(row_index), singleGroupItem)
							children.push(JSON.parse(JSON.stringify(res)))
						})
					}
					node_data.children = children;
					node_data.form_value = null;
					node_data.value_path = path;
				} else {

					node_data.form_value = this.getVueDataByPath(dataVue, path.concat(node_data.name));
					node_data.value_path = path;

					// 动态节点:如果是枚举节点，会根据枚举选中值判断是否进一步加 children 
					if ("enum" == node_data.data_type) {

						const hasChildrenEnumList = node_data.enum_list.filter(eItem => {
							if (eItem.children && eItem.children.length > 0) {
								return true;
							}
						})

						if (hasChildrenEnumList.length > 0) {
							hasChildrenEnumList.map(oneChildrenEnumList => {
								const key = `${node_data.name}_LINK_${oneChildrenEnumList.value}`;
								if (Array.isArray(node_data.children)) {
									node_data.children = {};
								}

								const currentVueData = this.getVueDataByPath(dataVue, path.concat(key));
								const children = [];
								if (Array.isArray(currentVueData)) {
									currentVueData.map((row, row_index) => {
										const res = this.formatNodeData(oneChildrenEnumList.children, dataVue, path.concat(key).concat(row_index))
										children.push(JSON.parse(JSON.stringify(res)))
									})
								}
								node_data.children[key] = children;
							})

						}

					}
				}
				if (isSingleGroupItem) {
					node_data.single_group_item = true
				}
				return node_data;
			});
		},
		getVueDataByPath: function (dataVue, path) {
			var value_pointer_container = [dataVue];
			for (let i = 0; i < path.length; i++) {
				const pathPoint = path[i];
				if (typeof pathPoint == 'object') {
					debugger;
				}
				if (!value_pointer_container[i]) {
					throw new Error(`DATA PATH ${path.join(',')} not  [${i}]!`);
				}
				value_pointer_container.push(value_pointer_container[i][pathPoint])
			}
			return value_pointer_container[value_pointer_container.length - 1]
		},

		registHook: function (hook_key, hook_fn) {
			if (!this.hook_list[hook_key]) this.hook_list[hook_key] = [];
			this.hook_list[hook_key].push(hook_fn)
		},

		callHook: function (hook_key, ...parmas) {
			console.log(`callHook hook_key ${hook_key} `)
			this.$emit("change-hook", hook_key, this.formData)
			if (!this.hook_list
				|| !this.hook_list[hook_key]) {
				// console.log(`callHook Error,hook_key ${hook_key} does not exist!`)
				return;
			}
			const fn_list = this.hook_list[hook_key];
			for (let i = 0; i < fn_list.length; i++) {
				const hookFn = fn_list[i];
				hookFn.apply(this, [...parmas])
			}
		}
	}

}