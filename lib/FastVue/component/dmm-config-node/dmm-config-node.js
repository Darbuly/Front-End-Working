function returnProps() {
	return ['sales_line_item'];
}

function returnData() {
	return {
		row: null,
		width: null,
		initDataSource: null,
		raw_config_node_list: null,
		raw_ast_map: null,
		initTreeData: null
	}

}
function returnCreated() {
	return function () {
		this.reFresh();
	}
}

function returnMounted() {
	return function () {
	}
}

function returnMethods() {
	return {

		reFresh: function () {
			// 调整宽度：
			if (typeof CpqTable != 'undefined') {
				if (typeof row != 'undefined') {
					const width = $($(".use-width")[1]).css('width');
					if (!width) {
						debugger;
					}
					this.width = width;
					this.row = row;

				} else if (this.sales_line_item) {
					this.width = "100%";
					this.row = this.sales_line_item;
				}
				console.log('dmm-config-node 刷新this.row', this.row);
				const sch_data = deepCopy(CpqTable.state.sch_data_map[this.row.sli_id]);
				if (sch_data && Object.keys(sch_data).length > 0) {
					const raw_form_data = sch_data.raw_form_data;
					if (!raw_form_data) {
						debugger;
						throw new Error('读取历史配置方案信息错误', sch_data);
					}

					this.initDataSource = JSON.parse(JSON.stringify(raw_form_data));
					const raw_config_node_list = sch_data.raw_config_node_list;
					const raw_ast_map = sch_data.raw_ast_map;
					this.buildConfigNodeTree(JSON.parse(raw_config_node_list), JSON.parse(raw_ast_map));
					this.raw_config_node_list = raw_config_node_list;
					this.raw_ast_map = raw_ast_map;
				} else {
					this.loadOnline(this.row.config_scheme.sch_id);
				}
			}
		},

		// 生产环境加载配置节点数据
		loadOnline: function (id) {
			const that = this;
			callAPI("1673490560471976892.getConfigNodeData", {
				sch_id: id
			}, function (res) {
				if (res.code == 200) {
					const node_list = res.data.node_list;
					const ast_map = res.data.ast_map;
					that.buildConfigNodeTree(node_list, ast_map)
					that.raw_config_node_list = JSON.stringify(node_list);
					that.raw_ast_map = JSON.stringify(ast_map);
				} else {
					debugger;
					throw new Error('getConfigNodeData Error')
				}

			}, "json")
		},

		// 配置节点树结构生成函数
		buildConfigNodeTree: function (data, ast_map = null) {
			const idMap = {};
			const tree = [];

			// 高级设置类似转属性节点
			const ast2Node = function (cnd_id, ast_info) {
				return {
					uuid: ast_info.id,
					id: ast_info.id,
					name: "AST_" + ast_info.id,
					alias: ast_info.AST_NAME,
					page_id: ast_info.AST_VIEW_URL,
					extra_data: {
						id: ast_info.id,
						cnd_id,
						stt_cost_excel_tax: 0,
						stt_amt_payable_excl_tax: 0
					},
					data_type: "oa-form"
				}
			}

			// 配置节点转枚举数据
			const configNode2EnumItem = function (configNode) {

				return {
					uuid: configNode.id,
					id: configNode.id,
					value: configNode.id,
					label: configNode.CND_NAME,
					children: configNode.children
				}
			}

			// 配置节点读取默认值
			const configNode2DefaultValue = function (configNode) {

				if (configNode.CND_IS_SELECTED == "1") {
					return configNode.id;
				} else {
					return null;
				}
			}

			const formatItem = function (item) {
				return {
					uuid: item.id,
					id: item.id,
					name: item.id,
					alias: item.CND_NAME,
					mode: item.CND_SELECTION_MODE,
					max_group_count: Number(item.CND_MAX_SELECTION),
					CND_PARENT: item.CND_PARENT,
					children: item.children,
					data_type: item.data_type,
					repeatable: item.repeatable,
					multiple: item.multiple,
					multiple_limit: item.multiple_limit,
					default_value: item.default_value,
					ast_info: item.ast_info,
					ast_open: item.ast_open,
					enum_list: item.enum_list
				}
			}

			data.forEach((item) => {
				item.children = [];

				// N选x
				if (
					item.CND_SELECTION_MODE == "2") {
					item.data_type = "enum";
					item.multiple = true;
					if ("1" == item.CND_X_ALLOW_DUPLICATE) {
						item.repeatable = true;
						idMap[item.id] = item;
						item.enum_list = [];
						item.multiple_limit = Number(item.CND_MAX_SELECTION);
						item.default_value = {
							type: "text",
							value: null
						};
					} else {
						item.multiple_limit = Number(item.CND_MAX_SELECTION);
						item.default_value = {
							type: "array",
							max_length: Number(item.CND_MAX_SELECTION),
							value: []
						};
						item.enum_list = [];
					}

				}

				// 枚举值
				if (item.CND_SELECTION_MODE == "1") {
					item.data_type = "enum"
					item.default_value = {
						type: "text",
						value: null
					};
					item.enum_list = [];
				}

				// 列表型
				if (item.CND_SELECTION_MODE == "0") {
					item.enum_list = [];
				}

				// 高级设置:高级设置的信息将作为该节点的子节点
				if (ast_map && item.AST_ID && ast_map[item.AST_ID]) {
					const astNode = ast2Node(item.id, ast_map[item.AST_ID])
					item.children = item.children.concat(astNode);
				}

				idMap[item.id] = item;
			});

			data.forEach((item) => {
				if (item.CND_PARENT !== null && idMap[item.CND_PARENT]) {

					const fatherItem = idMap[item.CND_PARENT];
					if (fatherItem.CND_SELECTION_MODE == "1") {

						fatherItem.enum_list.push(configNode2EnumItem(item));
						const default_value = configNode2DefaultValue(item);
						if (default_value) {
							fatherItem.default_value.value = default_value;
						}
					} else if (fatherItem.CND_SELECTION_MODE == "2") {

						fatherItem.enum_list.push(configNode2EnumItem(item));
						const default_value = configNode2DefaultValue(item);
						if ('1' == fatherItem.CND_X_ALLOW_DUPLICATE && '2' == fatherItem.CND_SELECTION_MODE) {
							// N合1 ：它的默认值在父亲节点添加的时候指定了，这里不需要指定

						} else {
							if (
								default_value
								&& fatherItem.default_value.value.length < fatherItem.default_value.max_length) {
								fatherItem.default_value.value.push(default_value);
							}
						}


					} else {

						if ('1' == item.CND_X_ALLOW_DUPLICATE && '2' == item.CND_SELECTION_MODE) {
							// 可重复，组成 N合1 : 父子中间加一个 group 分组项
							const key = `${item.id}_group`;
							const groupItem = {
								name: `${item.id}_group`,
								alias: null,
								id: `${item.id}_group`,
								uuid: `${item.id}_group`,
								max_group_count: Number(item.CND_MAX_SELECTION),
								group_default_value: [],
								children: []
							}

							// 找出所有指向item.id的子节点，结合max_group_count，push groupItem.children
							const childrenList = data.filter(dItem => {
								return (item.id == dItem.CND_PARENT && "1" == dItem.CND_IS_SELECTED)
							})

							let count = 0;
							childrenList.map(cItem => {
								const currentItem = formatItem(item);
								if (0 == count) {
									// 结构上只需要push一次，具体数组交给 value 机制去实现
									groupItem.children.push(currentItem);
								}
								// 指定 currentItem 的 default_value
								currentItem.default_value = {
									type: "text",
									value: cItem.id,

								}
								currentItem.multiple = false;//改多选为单选，因为多选的属性交给了groupItem
								currentItem.max_group_count = 1;//取消添加

								if (count < groupItem.max_group_count) {

									const valueObj = {}
									valueObj[currentItem.name] = currentItem.default_value.value
									groupItem.group_default_value.push(valueObj)
									count++;
								}
							})

							idMap[key] = groupItem;
							fatherItem.children.push(groupItem)
						} else {
							fatherItem.children.push(formatItem(item))
						}

					}
				} else {

					tree.push(formatItem(item))
				}
			});

			this.initTreeData = tree[0];
		},

		handleChange: function (hook, formData) {
			console.log(hook, formData);

			const cleanFormData = JSON.parse(JSON.stringify(formData));
			const nodeContainer = this.procFormDataObj(cleanFormData);

			if (typeof CpqTable != 'undefined') {
				CpqTable.dispatch('handleCndChange', {
					sli_id: this.row.sli_id,
					sch_id: this.row.config_scheme.sch_id,
					container: nodeContainer,
					raw_form_data: cleanFormData,
					raw_config_node_list: this.raw_config_node_list,
					raw_ast_map: this.raw_ast_map
				})
			} else {
				console.log("nodeContainer", nodeContainer)
			}

		},

		procFormDataObj: function (cleanFormData) {

			var Container = {
				node: [],
				ast: [],
				// todo 支持高级设置节点
			}

			const notLinkNode = function (node_key) {
				return String(node_key).indexOf('_LINK_') == -1
			}

			// 判断高级设置节点
			const isAstNode = function (node_key) {

				return String(node_key).indexOf("AST_") != -1;
			}

			// 处理单个高级设置节点
			const procAstNodeValue = function (key, form_value) {
				if (!form_value) {
					throw new Error('获取高级设置数据失败');
				}
				const stt_id = String(key).replace("AST_", "");
				if (!stt_id) throw new Error('高级设置获取数据失败，stt_id为null');
				const { cnd_id, stt_cost_excel_tax,
					stt_amt_payable_excl_tax } = form_value;
				Container.ast.push(
					{
						id: stt_id,
						cnd_id,
						stt_json: JSON.stringify(form_value.oa_form_value),
						stt_cost_excel_tax,
						stt_amt_payable_excl_tax
					}
				)
			}

			// 判断分组节点
			const isGroupNode = function (node_key) {
				return String(node_key).indexOf('_group') != -1
			}

			// 先分类，分出静态节点和条件节点。
			const node_map = {
				statisNode: {},
				linkNode: {},
			}
			Object.keys(cleanFormData).map(key => {
				if (notLinkNode(key)) {
					node_map.statisNode[key] = cleanFormData[key];
				} else {
					node_map.linkNode[key] = cleanFormData[key];
				}
			});
			var _that = this;
			// 遍历静态节点，
			Object.keys(node_map.statisNode).map(key => {
				const value = node_map.statisNode[key];

				if (isAstNode(key)) {

					// 如果是高级设置节点，key不需要进入节点容器，而是获取对应的高级信息
					// 包括 JSON数值、STT_COST_EXCL_TAX等
					procAstNodeValue(key, value);

				} else {

					if (isGroupNode(key)) {

						// 如果是_group节点，key不需要进入节点容器，直接当数组，进一步遍历，每个数组都是递归处理。
						if (Array.isArray(value)) {
							value.map(vItem => {
								const subNodeContainer = _that.procFormDataObj(vItem)
								Container.node = Container.node.concat(subNodeContainer.node);
								Container.ast = Container.ast.concat(subNodeContainer.ast);
							})
						}

					} else {

						// 静态节点的key进节点容器，然后判断值类型，
						Container.node.push(key);

						const valueProce = function (k, v) {
							if (Array.isArray(v)) {
								// 如果值是数组，则进一步遍历，每个数组处理都是递归处理。

								v.map(vItem => {

									const subNodeContainer = _that.procFormDataObj(vItem)
									Container.node = Container.node.concat(subNodeContainer.node);
									Container.ast = Container.ast.concat(subNodeContainer.ast);
								})
							}
							if ("string" == typeof v) {

								// 如果值是文本，则判断 key_LINK_value 是否存在条件节点之中，
								const active_key = `${k}_LINK_${v}`;
								const active_node = node_map.linkNode[active_key];
								if (active_node) {

									// 如果存在，那么该值也要进节点容器，然后，对 key_LINK_value 条件节点进一步值判断。
									Container.node.push(v);
									valueProce(active_key, active_node);

								} else {

									// 如果不存在，那么该值进节点容器。
									Container.node.push(v);

								}
							}

							if (null === v) {
								// noth. todo.
							}

						}

						// 值处理
						valueProce(key, value)

					}

				}

			})

			return Container;
		}

	}
}