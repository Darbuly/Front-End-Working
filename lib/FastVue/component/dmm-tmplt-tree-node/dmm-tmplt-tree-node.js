
function returnProps() {
	return ['componentkey', 'nodeData', 'level', 'formData', 'parentDataVue', 'activeComponentkey', 'group_row_index'];
}

function returnData() {
	return {
		count: 1,
		foldBody: false,
		count2: {},
		enum_list_map: {},
		treeData: [],
	}

}

function returnComputed() {
	return {
		dynamicClass: function () {
			const classObj = {
				'dmm-tmplt-tree-node': true,
				'active-focus': (this.nodeData && this.activeComponentkey == this.nodeData.uuid),
			};
			if (this.level) {

				if (Number(this.level) <= 3) {
					classObj[`dmm-tmplt-tree-node-${Number(this.level) - 1}`] = true
				} else {
					// 超过三级统一class
					classObj[`dmm-tmplt-tree-node-more`] = true
				}
			}
			classObj[`dmm-tmplt-tree-node-${this.nodeData.uuid}`] = true
			return classObj;
		},

		// 深入节点分两种情况 Array 静态节点，Object 条件节点
		// children 分三层，1：是否multi,2是否group,3属性节点数组
		resolveChildren: function () {



			if (null == this.nodeData.children
				|| undefined == this.nodeData.children) {
				return [];
			}

			if (Array.isArray(this.nodeData.children)) {
				// 静态节点
				return [this.nodeData.children];
			} else if (Object.keys(this.nodeData.children).length > 0) {
				// 条件节点

				if (!Array.isArray(this.nodeData.form_value)) {
					// 枚举值条件节点：当前节点uuid_当前枚举节点的value 存在 children 中，则其值为children
					const active_key = `${this.nodeData.uuid}_LINK_${this.nodeData.form_value}`;

					if (this.nodeData.children[active_key]) {
						return [this.nodeData.children[active_key]];
					}
				} else {
					// 多选条件节点：遍历多个 active_key ，将 emun_list 结构转成 node_data，返回obj作为区分

					const EnumListMap = {};
					this.nodeData.enum_list.map(eItem => {
						EnumListMap[eItem.value] = eItem;
					})

					if (!Array.isArray(this.nodeData.form_value)) {
						debugger;
						throw new Error('多选条件节点 但非数组')
					}
					const multiChildren = this.nodeData.form_value.map(vItem => {
						const active_key = `${this.nodeData.uuid}_LINK_${vItem}`;
						if (this.nodeData.children[active_key]) {
							const Enum = EnumListMap[vItem];
							if (!EnumListMap[vItem]) {
								throw new Error('将 emun_list 结构转成 node_data 失败');
							}
							const _node_data = {
								alias: Enum.label,
								uuid: Enum.uuid,
								max_group_count: 1,
								value_path: [],// FIXME 这里写什么合适？不写也不影响？
								children: this.nodeData.children[active_key],
							}
							return [[_node_data]];
						} else {

							// 选中了，但是不需要将 emun_list 结构转成 node_data 
							return []

						}
					})
					return multiChildren;
				}


			}
		},

		// 枚举节点动态化
		dynamicEnumList: function () {
			if (Array.isArray(this.nodeData.enum_list)) {
				return this.nodeData.enum_list.map(eItem => {
					if (this.enum_list_map && this.enum_list_map[eItem.id]) {
						return this.enum_list_map[eItem.id];
					} else {
						return eItem;
					}
				})
			} else {
				return null;
			}
		}

	}
}

function returnCreated() {
	return function () {
		// 在 root vue 维护一个 id-map ,方便快速定位树节点
		if (!this.$root.nodeMap) {
			this.$root.nodeMap = {}
		}
		this.$root.nodeMap[this.nodeData.id] = {
			type: "node",
			nodeVue: this
		};

		// 如果 nodeData 是枚举，则也把枚举节点作为节点类型维护在 id-map
		if (this.nodeData.enum_list) {
			this.nodeData.enum_list.map(eItem => {
				this.$root.nodeMap[eItem.id] = {
					type: "enumNode",
					parentNodeVue: this
				};
			})
		}


	}
}

function returnMounted() {
	return function () {
		console.log('demm-tmplt-tree-node,mounted');
	}
}

function returnMethods() {
	return {

		// 焦点处理
		handleFocus: function (e, isChanged = false) {
			// 让当前父亲节点的 body 处于焦点状态
			this.$emit('update-focus', { componentkey: this.componentkey })
			if (isChanged) {
				this.handleChanged(e);
			}
		},

		// 判断动态节点
		isDynamicNode: function (keyName) {
			if (keyName.indexOf("_LINK_") != -1) {
				return true;
			} else {
				return false;
			}
		},

		// 添加
		addRow: function () {
			if (!this.parentDataVue || (this.max_group_number && this.max_group_number == 1)) {
				throw new Error('不支持添加');
			}
			const oneRow = this.parentDataVue[this.nodeData.name][0];
			const _copyRow = JSON.parse(JSON.stringify(oneRow));
			console.log('addRow', _copyRow);
			this.parentDataVue[this.nodeData.name].push(_copyRow)
		},

		// 父级添加
		addRowParent: function () {
			if (!this.$parent) throw new Error('父级添加必须在子，但父不存在');
			this.$parent.addRow();
			this.$nextTick(() => {
				this.handleChanged(null);
			})
		},

		// 删除
		removeRow: function (index) {

			this.parentDataVue[this.nodeData.name].splice(index, 1);
			this.$nextTick(() => {
				this.handleChanged(null);
			})
		},

		// 父级删除
		removeRowParent: function (index) {
			if (!this.$parent) throw new Error('父级删除必须在子，但父不存在');
			this.$parent.removeRow(index);
		},

		getVueDataByPath: function (dataVue, path, node) {
			if (null == path) {
				return null;
			}
			var value_pointer_container = [dataVue];
			for (let i = 0; i < path.length; i++) {
				const pathPoint = path[i];
				if (typeof pathPoint == 'object') {
					debugger;
				}
				if (!value_pointer_container[i]) {
					debugger;
					throw new Error(`DATA PATH ${path.join(',')} not  [${i}]!`);
				}
				value_pointer_container.push(value_pointer_container[i][pathPoint])
			}

			return value_pointer_container[value_pointer_container.length - 1]
		},

		handleChanged: function (e) {
			// 调用hook
			let hook_key = "";
			if (this.nodeData.value_path.length > 0) {
				hook_key = `hook_${this.nodeData.value_path.join('_')}_${this.nodeData.name}_changed`;
			} else {
				hook_key = `hook_${this.nodeData.name}_changed`;
			}
			this.$emit('call-hook', hook_key, e, this.nodeData, this);

			// 如果有root_vue，统一执行root_vue里的handleChanged
			if (this.$root && this.$root.handleNodeChange
				&& typeof this.$root.handleNodeChange == 'function') {
				this.$root.handleNodeChange(this.nodeData, this, this.parentDataVue);
			}

		},

		// 判断是否属性节点
		isAttrNode: function () {
			// 暂时：要么没有children,要么有children但mode为(1=N 选一，2=N 选 x，3=x 合一)
			return (!this.nodeData.children
				|| this.nodeData.mode == "1"
				|| this.nodeData.mode == "2"
				|| this.nodeData.mode == "3")

		},

		// 某个节点是否允许添加
		canAdd: function () {
			// 非根节点 ,且不能是单一属性分组，或者指定了 max_group_count 且multiple不为true, 但 max_group_count 不为1,
			return this.parentDataVue && !this.nodeData.single_group && !this.nodeData.multiple && (!this.nodeData.max_group_count || this.nodeData.max_group_count != 1)
		},

		// 父级是否可添加:只要适用于分组单一节点的情况
		canAddParent: function () {
			if (this.$parent
				&& this.$parent.nodeData) {
				const parentNodeData = this.$parent.nodeData;
				// 和 canAdd 异曲同工
				return !parentNodeData.multiple && (!parentNodeData.max_group_count || parentNodeData.max_group_count != 1)
			}
			return false;
		},

		hasBody: function () {
			return (this.resolveChildren && this.resolveChildren.length > 0 && this.resolveChildren[0].length > 0 && !this.nodeData.disabled)
		},

		toFoldBody: function () {
			this.foldBody = !this.foldBody;
		}

	}
}