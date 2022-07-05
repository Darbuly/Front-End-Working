function returnData() {
	return {
		showHeader: true,
		highlighCurrentRow: true,
		column: {
			id: 'jianyu-a',
			maxHeight: '100%',
			gridData: [{
				date: '2016-05-02',
				name: '王小虎',
				address: '上海市普陀区金沙江路 1518 弄'
			}, {
				date: '2016-05-04',
				name: '王小虎',
				address: '上海市普陀区金沙江路 1518 弄'
			}, {
				date: '2016-05-01',
				name: '王小虎',
				address: '上海市普陀区金沙江路 1518 弄'
			}, {
				date: '2016-05-03',
				name: '王小虎',
				address: '上海市普陀区金沙江路 1518 弄'
			}],
			list: [{
				"title": "文本",
				"dataIndex": "tip_text",
				"valueType": "",
				"width": 250,
				"render": [
					{
						"type": "icon",
						"class": "tb-alert-icon"
					}, {
						"type": "text",
						"key": "date"
					}]
			},

			{
				"title": "状态",
				"dataIndex": "status",
				"initialValue": "all",
				"valueEnum": {
					"close": {
						"text": "結束",
						"status": "Close"
					},
					"running": {
						"text": "進行中",
						"status": "Processing"
					},
					"todo": {
						"text": "待辦",
						"status": "Todo"
					}
				}
			},
			{
				"title": "名称",
				"dataIndex": "name",
				"valueType": "",

			},
			{
				"title": "设备状态",
				"dataIndex": "sb_status",
				"initialValue": "all",
				"valueEnum": {
					"close": {
						"text": " ",
						"status": "Close"
					},
					"running": {
						"text": " ",
						"status": "Processing"
					}

				}
			},



			]
		},

		tableData: [{
			date: '2016-05-02',
			name: '進行中',
			status: 'close',
			tip_text: '腕帶斷裂，請盡快處理。腕帶斷裂，請盡快處理。腕帶斷裂，請盡快處理。腕帶斷裂，請盡快處理。',
			sb_status: 'running',
		}, {
			date: '2016-05-04',
			name: '待辦',
			status: 'running',
			tip_text: '腕帶斷裂，請盡快處理。',
			sb_status: 'close',
		}, {
			date: '2016-05-01',
			name: '結束',
			status: 'todo',
			tip_text: '腕帶斷裂，請盡快處理。',
			sb_status: 'close',
		}, {
			date: '2016-05-03',
			name: '進行中',
			status: 'close',
			tip_text: '腕帶斷裂，請盡快處理。',
			sb_status: 'close',
		},
		{
			date: '2016-05-03',
			name: '進行中',
			status: 'close',
			tip_text: '腕帶斷裂，請盡快處理。',
			sb_status: 'close',
		},
		{
			date: '2016-05-03',
			name: '進行中',
			status: 'close',
			tip_text: '腕帶斷裂，請盡快處理。',
			sb_status: 'close',
		},
		{
			date: '2016-05-03',
			name: '進行中',
			status: 'close',
			tip_text: '腕帶斷裂，請盡快處理。',
			sb_status: 'close',
		},
		{
			date: '2016-05-03',
			name: '進行中',
			status: 'close',
			tip_text: '腕帶斷裂，請盡快處理。',
			sb_status: 'close',
		},
		{
			date: '2016-05-03',
			name: '進行中',
			status: 'close',
			tip_text: '腕帶斷裂，請盡快處理。',
			sb_status: 'close',
		}]
	}
}
function returnCreated() {
	return function () {

	}
}
function returnMethods() {
	return {
		rowClick: function (row) {
			console.log(row);
		},
		CellClassName({ row, column, rowIndex, columnIndex }) {
			if (this.column.list[columnIndex]) {
				return 'el-table__cell-' + this.column.list[columnIndex].dataIndex
			}
		},
		selectOne(index) {
			this.$refs[this.column.id].setCurrentRow(this.tableData[index])
		}
	}
}