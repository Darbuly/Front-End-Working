{
	data() {
		return {
			showHeader: true,
			highlighCurrentRow: true,
			column: {
				id: 'jianyu-mission',
				maxHeight: '100%',
				list: [{
					"title": "状态",
					"dataIndex": "status",
					"initialValue": "all",
					"valueEnum": {
						"3": {
							"text": "結束",
							"status": "Close"
						},
						"2": {
							"text": "進行中",
							"status": "Processing"
						},
						"1": {
							"text": "待辦",
							"status": "Todo"
						}
					}
				},

				{
					"title": "任務名稱",
					"dataIndex": "name",
					"valueType": "",
				},

				{
					"title": "押解人數",
					"dataIndex": "suspect_number",
					"valueType": "",
				},


				]
			},

			tableData: []
		}
	},
	created: function() {
		window.MissionVue = this;
	},
	methods: {
		rowClick: function (row) {
			console.log(row);
			setMissDetail(row)
		}, CellClassName({ row, column, rowIndex, columnIndex }) {
			if (this.column.list[columnIndex]) {
				return 'el-table__cell-' + this.column.list[columnIndex].dataIndex
			}
		},
		selectOne(index) {
			this.$refs[this.column.id].setCurrentRow(this.tableData[index])
			setMissDetail(this.tableData[index])
		}
	}
}