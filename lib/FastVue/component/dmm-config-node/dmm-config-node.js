function returnProps() {
	return ['sales_line_item'];
}

function returnData() {
	return {
		dev: false,
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

				// 把 vue 对象存储起来，方便后面对他进行刷新配置方案操作。
				if (!CpqTable.config_scheme_vue) CpqTable.config_scheme_vue = {};
				if (!CpqTable.config_scheme_vue[this.row.sli_id]) {
					CpqTable.config_scheme_vue[this.row.sli_id] = this;
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

					this.$nextTick(() => {
						this.initMvc(this.row.config_scheme.sch_id);
					})

				} else {
					if (this.$refs['form'])
						this.$refs['form'].cleanData();
					this.initTreeData = null;
					this.initDataSource = null;
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

					that.$nextTick(() => {
						that.initMvc(that.row.config_scheme.sch_id);
					})

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
					disabled: configNode.CND_IS_ENABLED == '0',
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
					disabled: item.CND_IS_ENABLED == '0',
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

			const getRealEnumFather = function (fatherNode, idMap) {

				const grandFatherNode = idMap[fatherNode.CND_PARENT];

				// 如果爷节是选择模式，父亲又是选择模式，那么应该用跳板节点作为父亲节点
				if (fatherNode.CND_SELECTION_MODE != "0"
					&& grandFatherNode.CND_SELECTION_MODE != "0") {

					// 先检查跳板节点是否存在
					const jmp_id = `JMP_${fatherNode.id}`;
					if (!idMap[jmp_id]) {

						// 凭空创造一个父亲的跳板节点，是一个list
						const jumpNode = {
							...fatherNode,
							children: [],// 跳板节点的子节点是干净的。
							id: jmp_id
						}

						// 记录节点容器idmap 避免重复创造跳板节点
						idMap[jmp_id] = jumpNode;

						// 父亲节点连接跳板节点
						fatherNode.children.push(formatItem(jumpNode));

					}

					return idMap[jmp_id];
				} else {
					return fatherNode;
				}
			}

			data.forEach((item) => {
				if (item.CND_PARENT !== null && idMap[item.CND_PARENT]) {

					const fatherItem = idMap[item.CND_PARENT];


					if (fatherItem.CND_SELECTION_MODE == "1") {

						let enumFather = getRealEnumFather(fatherItem, idMap);
						enumFather.enum_list.push(configNode2EnumItem(item));
						const default_value = configNode2DefaultValue(item);
						if (default_value) {
							enumFather.default_value.value = default_value;
						}

					} else if (fatherItem.CND_SELECTION_MODE == "2") {

						let enumFather = getRealEnumFather(fatherItem, idMap);
						enumFather.enum_list.push(configNode2EnumItem(item));
						const default_value = configNode2DefaultValue(item);
						if ('1' == enumFather.CND_X_ALLOW_DUPLICATE && '2' == enumFather.CND_SELECTION_MODE) {
							// N合1 ：它的默认值在父亲节点添加的时候指定了，这里不需要指定

						} else {
							if (
								default_value
								&& enumFather.default_value.value.length < enumFather.default_value.max_length) {
								enumFather.default_value.value.push(default_value);
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
								multiple: false,// 这种分组，是另外一种多选的表现形式，所以把它设置为false
								group_default_value: [],
								children: []
							}

							// 找出所有指向item.id的选中的子节点，结合max_group_count，push groupItem.children
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

				// 如果节点已经被禁用，则不继续深入遍历。
				if (this.$root.nodeMap && this.$root.nodeMap[key]) {
					const mapObj = this.$root.nodeMap[key];

					if (mapObj.type == 'node') {
						const nodeVue = mapObj.nodeVue;
						if (nodeVue.nodeData.disabled) {
							return;
						}
					} else if (mapObj.type == 'enumNode') {
						const parentNodeVue = mapObj.parentNodeVue;
						const dynamicEnumList = parentNodeVue.dynamicEnumList;
						if (!dynamicEnumList) {
							throw new Error('dynamicEnumList is null');
						}
						let disabled = false;
						dynamicEnumList.map(enumItem => {
							if (enumItem.id == value
								&& enumItem.disabled) {
								disabled = true;
							}
						})

						if (disabled) {
							return;
						}
					}

				}

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
		},

		// mvc init
		initMvc: function (sch_id) {
			try {
				if (!this.mvc_ConfigSchemeMgr) {
					this.mvc_ConfigSchemeMgr = CpqMvc.objBroker.GetObject(OID_CONFIG_SCHEME_MGR);
				}
				this.mvc_Cnf = this.mvc_ConfigSchemeMgr.GetConfigScheme(sch_id);
				console.log('initMvc mvc_cnf', this.mvc_Cnf);

				this.refreshMvcState();

				if (!this.$root.handleChange) {
					const that = this;
					this.$root.handleChange = function (nodeData) {
						that.handleNodeChange(nodeData);
					}
				}

			} catch (e) {
				throw e;
			}
		},

		refreshMvcState: function () {

			if (!this.mvc_ConfigSchemeMgr
				|| !this.mvc_Cnf) {
				throw new Error(`mvc_ConfigSchemeMgr is empty!`);
			}

			// 刷新 mvc state
			const CurrentCnfNodeList = this.mvc_Cnf.RefreshAllNodes();

			if (Array.isArray(CurrentCnfNodeList)
				&& CurrentCnfNodeList.length == 0) {
				console.log('无配置脚本');
				return;
			}

			// 遍历每一个配置节点，根据情况去查询子选择state
			CurrentCnfNodeList.map(cItem => {
				const nodeId = cItem.Id;

				// 同步节点禁用状态
				this.setNodeDisable(nodeId, !cItem.IsEnabled);

				// 获取所有节点的state
				const parentNodeStateList = cItem.GetAllChildNodeStates(nodeId);

				// 遍历节点的state 获取全部 statePositioned
				const allStatePositioned = parentNodeStateList.map(state => {

					// 读取 statePositioned 容器
					const statePositioned = this.us_GetStatePositioned(state.Id);
					if (!statePositioned) {
						throw new Error(`statePositioned ${state.Id} is empty!`);
					}
					return {
						...statePositioned,
						currentState: state
					};
				})

				// 分组
				const groupStateMap = this.us_GroupStatePositioned(allStatePositioned);

				// 对分组后的每一组，分别执行同步操作
				Object.keys(groupStateMap).map(groupId => {
					const groupStatePositionedList = groupStateMap[groupId];
					this.us_SyncState(cItem, groupStatePositionedList)
				})

			})

		},


		// 得到真正的 nodeId，有些id是前面有修饰符的，要去掉
		formatNodeId(nodeId) {
			if (nodeId.indexOf('JMP_') == 0) {
				nodeId = nodeId.substring(4);
			}
			return nodeId;
		},

		// 树节点发送变动时，触发mvc的选择事件
		handleNodeChange(nodeData, parentNodeVue, parentDataVue) {
			if (this.dev) {
				console.log('dev:handleNodeChange', nodeData, parentDataVue)
				return;
			}
			if (nodeData.data_type != 'enum') {
				console.log('非选择类型');
				return;
			}
			console.log('handleNodeChange', nodeData, parentDataVue);
			if (!this.mvc_ConfigSchemeMgr
				|| !this.mvc_Cnf) {
				throw new Error(`handleNodeChange mvc_ConfigSchemeMgr is empty!`);
			}

			// 获取当前节点的父节点
			const parentNode = this.mvc_Cnf.GetNode(this.formatNodeId(nodeData.id));
			if (!parentNode) {
				throw new Error(`handleNodeChange getNode ${nodeData.id} fail！`)
			}

			const selectedNodeId = parentDataVue[nodeData.name];

			// 单选
			if (!nodeData.multiple) {

				// 获取旧值子节点的state
				let selectedNodeIdBef = null;
				if (parentNodeVue.oldFormValue) {
					selectedNodeIdBef = parentNodeVue.oldFormValue;
				} else {
					selectedNodeIdBef = nodeData.default_value.value;
					parentNodeVue.oldFormValue = selectedNodeId;
				}
				let selectedNodeStateBef = this.us_GetStateByChildNodeId(selectedNodeIdBef, parentNodeVue, parentNode);

				// 获取新选中子节点的state
				let selectedNodeState = this.us_GetStateByChildNodeId(selectedNodeId, parentNodeVue, parentNode)

				// 制定当前state操作：unselect 旧的 state, select 新的state
				const stateAction = [];
				stateAction.push({ parentNode, action: 'unselect', state: selectedNodeStateBef });
				stateAction.push({ parentNode, action: 'select', state: selectedNodeState });

				// 执行state操作
				this.us_ExecuteStateAction(stateAction);

			} else if (nodeData.multiple) {
				// 多选


				// 处理旧值节点的state
				const selectedNodeIdsBef = nodeData.form_value;
				const selectedNodeStateBefMap = {};
				selectedNodeIdsBef.map(childNodeId => {
					selectedNodeStateBefMap[childNodeId] = this.us_GetStateByChildNodeId(childNodeId, parentNodeVue, parentNode);
				});

				// 处理新值节点的state
				const selectedNodeIds = parentDataVue[nodeData.name];;
				const selectedNodeStateMap = {};
				selectedNodeIds.map(childNodeId => {
					selectedNodeStateMap[childNodeId] = this.us_GetStateByChildNodeId(childNodeId, parentNodeVue, parentNode);
				})

				const stateAction = [];
				if (Object.keys(selectedNodeStateBefMap).length > Object.keys(selectedNodeStateMap).length) {
					// 需要去除选中

					// 枚举所有旧值节点，找出变动的节点（选中/去除选中）,处理选中/去除选中
					selectedNodeIdsBef.map(cNodeId => {

						if (selectedNodeStateMap[cNodeId]) {
							// 选中状态不变
						} else {

							// 去除选中
							let unSeletingNodeState = selectedNodeStateBefMap[cNodeId];
							if (!unSeletingNodeState) {
								// 不可能出现该情况
								throw new Error('unSeletingNodeState is null');
							}
							stateAction.push({ parentNode, action: 'unselect', state: unSeletingNodeState });
						}

					})
				} else {
					// 需要增加选中

					// 枚举所有新增得节点，找出变动的节点（选中/去除选中）,处理选中/去除选中
					selectedNodeIds.map(cNodeId => {

						if (selectedNodeStateBefMap[cNodeId]) {
							// 选中状态不变
						} else {

							// 增加选中
							let seletingNodeState = selectedNodeStateMap[cNodeId];
							if (!seletingNodeState) {
								// 不可能出现该情况
								throw new Error('seletingNodeState is null');
							}
							stateAction.push({ parentNode, action: 'select', state: seletingNodeState });
						}
					})
				}
				// 执行state操作
				this.us_ExecuteStateAction(stateAction);

			} else {
				// todo 将来支持可重复选项的多选

				// 多选 

			}

			// 刷新状态
			this.$nextTick(() => {
				this.refreshMvcState();
			})

		},

		setNodeDisable(nodeId, disabled) {
			if (this.$root.nodeMap && this.$root.nodeMap[nodeId]) {
				const mapObj = this.$root.nodeMap[nodeId];

				if (mapObj.type == 'node') {
					const nodeVue = mapObj.nodeVue;
					nodeVue.nodeData.disabled = disabled;
				} else if (mapObj.type == 'enumNode') {
					const parentNodeVue = mapObj.parentNodeVue;
					if (!parentNodeVue) {
						throw new Error(`setNodeDisable ${nodeId} parentNodeVue is null`);
					}
					const dynamicEnumList = parentNodeVue.dynamicEnumList;
					if (!dynamicEnumList) {
						throw new Error(`setNodeDisable ${nodeId} dynamicEnumList is null`);
					}
					const _enumItem = dynamicEnumList.find(item => item.id == nodeId);
					if (!_enumItem) {
						throw new Error(`setNodeDisable ${nodeId} enumItem is null`);
					}

					if (_enumItem.disabled === disabled) {
						// 无需改变
						return;
					}

					_enumItem.disabled = disabled;
					parentNodeVue.enum_list_map[nodeId] = _enumItem;
					parentNodeVue.enum_list_map = JSON.parse(JSON.stringify(parentNodeVue.enum_list_map));

					// 更换选择
					const parentDataVue = parentNodeVue.parentDataVue;
					const nodeData = parentNodeVue.nodeData;
					if (!nodeData.multiple) {
						// 单选：挑一个可用的选项进行选择，如果都没有，那么整个禁用。
						const validOptions = dynamicEnumList.filter(item => !item.disabled);
						if (validOptions.length == 0) {
							// 整个禁用
							nodeData.disabled = true;
						} else {
							nodeData.disabled = false;
							parentDataVue[nodeData.id] = String(validOptions[0].id);
						}
					} else {
						// 多选：直接去除即可。
						const _value = parentDataVue[nodeData.id];
						if (!Array.isArray(_value)) {
							throw new Error(`setNodeDisable ${nodeId} value is not array`);
						}
						const _value_new = _value.filter(id => String(id) !== String(nodeId));
						parentDataVue[nodeData.id] = _value_new;
					}

				}

			} else {
				throw new Error(`setNodeDisable nodeId ${nodeId} is not exist`);
			}
		},


		// 通过子节点id，添加state
		us_AddNodeStateByChildNodeId(parentNode, childNodeId, parentNodeVue) {

			let selectedNodeState = null;

			// 获取 mvc 的 stateList
			const mvcStateList = parentNode.FindStatesForChildNode(childNodeId);
			let unPositionedStateList = [];

			// 先从 statePositioned 里确认
			let hadStatePositioned = false;
			if (!this.$root.statePositioned) {
				hadStatePositioned = false;
				unPositionedStateList = mvcStateList;
			} else {
				// 过滤还没绑定us的state
				unPositionedStateList = mvcStateList.filter(state => {
					return !this.$root.statePositioned[state.Id];
				});
			}

			if (unPositionedStateList.length) {
				selectedNodeState = unPositionedStateList[0];
			} else {

				// 无可用state，需要重新添加
				selectedNodeState = parentNode.AddChildNodeState(childNodeId);
			}
			this.us_SetStatePositioned(selectedNodeState, parentNode.Id, parentNodeVue, parentNodeVue.parentDataVue, parentNodeVue.group_row_index);

			// 每次得到一个新的state，都要维护一个容器，方便下次parentNodeVue改变时，精确知道需要改变哪个state.
			if (!parentNodeVue.formValueStateMap) parentNodeVue.formValueStateMap = {};
			parentNodeVue.formValueStateMap[childNodeId] = selectedNodeState.Id;

			return selectedNodeState;

		},

		// 根据子节点id，获取唯一确定的state
		us_GetStateByChildNodeId(childNodeId, parentNodeVue, parentNode) {
			// 根据 formValueStateMap 尝试获取 stateId
			const formValueStateMap = parentNodeVue.formValueStateMap;
			if (!formValueStateMap) {
				return this.us_AddNodeStateByChildNodeId(parentNode, childNodeId, parentNodeVue);
			}
			if (!formValueStateMap[childNodeId]) {
				return this.us_AddNodeStateByChildNodeId(parentNode, childNodeId, parentNodeVue);
			}
			return parentNode.GetChildNodeState(formValueStateMap[childNodeId]);
		},


		// 设置全局statePositioned容器
		us_SetStatePositioned(state, parentNodeId, parentNodeVue, parentDataVue, index = 0) {
			if (!this.$root.statePositioned) this.$root.statePositioned = {};
			this.$root.statePositioned[state.Id] = {
				parentNodeId,
				parentNodeVue,
				index,
				parentDataVue
			}
		},

		// 读取全局statePostioned容器
		us_GetStatePositioned(stateId) {
			if (!this.$root.statePositioned) return null;
			return this.$root.statePositioned[stateId];
		},

		// 执行state操作
		us_ExecuteStateAction(actionQueue) {
			if (Array.isArray(actionQueue) && actionQueue.length > 0) {
				actionQueue.forEach(action => {
					if (action.action === 'unselect') {
						action.parentNode.UnselectChildNodeState(action.state);
					} else {
						action.parentNode.SelectChildNodeState(action.state);
					}
				});
			}
		},

		us_SyncState(node, groupStatePositionedList) {
			const selectedStatePositionedList = groupStatePositionedList.filter(statePositioned => statePositioned.currentState.IsSelected == true)
			const parentNodeId = node.Id;
			const selectedStatePositioned = selectedStatePositionedList[0];
			if (node.ChildSelectionMode == '1'
				|| (node.ChildSelectionMode == '2' && node.XAllowDuplicate)) {
				// 单选: 只需要将选中的第一个state同步

				console.log(`${parentNodeId} -> ${selectedStatePositioned.currentState.ConfigNodeId}`);

				const parentDataVue = selectedStatePositioned.parentDataVue;
				const nodeData = selectedStatePositioned.parentNodeVue.nodeData;
				parentDataVue[nodeData.name] = String(selectedStatePositioned.currentState.ConfigNodeId);

			} else if (node.ChildSelectionMode == '2') {
				// 多选：
				const parentNodeIdSelectedIdList = selectedStatePositionedList.map(statePositioned => statePositioned.currentState.ConfigNodeId)
				console.log(`${parentNodeId} -> ${JSON.stringify(parentNodeIdSelectedIdList)}`);

				const parentDataVue = selectedStatePositioned.parentDataVue;
				const nodeData = selectedStatePositioned.parentNodeVue.nodeData;

				parentDataVue[nodeData.name] = parentNodeIdSelectedIdList;

			}
		},

		// 对 statePositioned 进行分组
		us_GroupStatePositioned(statePositionedList) {

			const groupStateMap = {};

			statePositionedList.map(statePositioned => {
				if (!groupStateMap[statePositioned.index]) {
					groupStateMap[statePositioned.index] = [];
				}
				groupStateMap[statePositioned.index].push(statePositioned);
			})
			return groupStateMap;
		}

	}
}