{
	data() {
		return {
			showHeader: true,
			highlighCurrentRow: true,
			column: {
				id: 'jianyu-shebei',
				maxHeight: 200,
				list: [{
					"title": "設備狀態",
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
				{
					"title": "設備編號",
					"dataIndex": "cardName",
					"valueType": "",
				},
				{
					"title": "名称",
					"dataIndex": "suspectName",
					"valueType": "",
				},
				{
					"title": "還押人士編號",
					"dataIndex": "p_name",
					"valueType": "",
				}
				]
			},

			tableData: []
		}
	}
}