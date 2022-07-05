{
	data() {
		return {
			showHeader: false,
			highlighCurrentRow: false,
			column: {
				id: 'jianyu-a',
				maxHeight: "100%",
				list: [{
					"title": "文本",
					"dataIndex": "memo",
					"valueType": "",
					"width": 230,
					"render": [
						{
							"type": "icon",
							"class": "tb-alert-icon"
						}, {
							"type": "text",
							"key": "memo"
						}]
				},
				{
					"title": "日期",
					"dataIndex": "sosTime",
					"valueType": ""
				}
				]
			},

			tableData: []
		}
	},
	methods: {
		rowClick: function (row) {
			sosClick(row)
		},
		CellClassName({ row, column, rowIndex, columnIndex }) {
			if (this.column.list[columnIndex]) {
				return 'el-table__cell-' + this.column.list[columnIndex].dataIndex
			}
		}
	}
}