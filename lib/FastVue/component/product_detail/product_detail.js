function returnProps() {
	return ['prop_value', 'sales_line_item', 'dsh_data', 'slide_data', 'detail_data', 'config_scheme_options'];
}

function returnData() {
	return {
		count: 1,
		pdCoverActiveIndex: 0,
		fromConfigSelection: {
			sch_id: ''
		},
		fromSkuId: null,
	}

}

function returnCreated() {
	return function () {
		console.log('sales_line_item', this.sales_line_item)
	}
}


function returnMounted() {
	return function () {

	}
}


function returnComputed() {
	return {
		dynmPdCoverClass: function () {
			const _class = { 'pd-indicator-item': true, 'pdi-active': false };
			return _class
		},
		SalesLineItem: function () {
			if (this.sales_line_item) {
				const _finalSli = JSON.parse(JSON.stringify(this.sales_line_item));
				if (this.fromConfigSelection.sch_id) {
					_finalSli.config_scheme.sch_id = this.fromConfigSelection.sch_id;
				}
				return _finalSli;
			} else {
				return null
			}
		},
		currentDshData: function () {
			if (this.dsh_data != null
				&& 0 < Object.keys(this.dsh_data).length) {

				try {
					if (this.fromSkuId
						&& this.dsh_data[this.fromSkuId]) {
						return JSON.parse(this.dsh_data[this.fromSkuId])
					} else {
						return JSON.parse(this.dsh_data['default'])
					}
				} catch (e) {
					throw new Error('解析 dsh_data json失败')
				}

			} else {
				return [];
			}
		},
		detailShowData: function () {
			if (this.detail_data) {
				let showDataList = [];
				if (Array.isArray(this.detail_data.show_img)
					&& 0 < this.detail_data.show_img.length) {
					showDataList = showDataList.concat(this.sortByProperty(this.detail_data.show_img, "IMG_DISPLAY_ORDER"))
				}
				return showDataList;
			} else {
				return [];
			}
		},
		slideShowData: function () {
			if (this.slide_data) {
				let showDataList = [];
				if (Array.isArray(this.slide_data.show_img)
					&& 0 < this.slide_data.show_img.length) {
					showDataList = showDataList.concat(this.sortByProperty(this.slide_data.show_img, "IMG_DISPLAY_ORDER"))
				}
				return showDataList;
			} else {
				return [];
			}
		}
	}
}
function returnMethods() {
	return {
		toggleCover: function (cName) {
			const cApp = this.$refs['pdCover'];
			cApp.setActiveItem(cName)
		},
		pdCoverChange: function (index) {
			this.pdCoverActiveIndex = index;
		},

		coverImg: function (prd_img_item) {
			if (prd_img_item.length > 0) {
				return DMM_URL + "/" + prd_img_item[0]["IMG_URL"];
			} else {
				return "https://img01.yzcdn.cn/vant/cat.jpeg";
			}
		},

		CpqFormUtils: function (fnName, payload) {

			if (typeof CpqFormUtils != 'undefined') {
				return CpqFormUtils[fnName](payload);
			} else {
				return `${fnName}(payload)`
			}
		},

		sortByProperty: function (arr, prop) {
			return arr.sort((a, b) => Number(a[prop]) - Number(b[prop]));
		},

		handleChangeSch: function (sch_id) {
			console.log("changed sch_id", sch_id)
			const cApp = this.$refs['configNode'];
			cApp.loadOnline(sch_id);
			CpqTable.dispatch('handleCndSchId', {
				sli_id: this.SalesLineItem.sli_id,
				sch_id: sch_id,
			})
		}
	}
}