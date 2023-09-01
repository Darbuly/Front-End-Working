function returnProps() {
	return ['form_id', 'page_id', 'var_obj', 'var_name', 'extra_data'];
}

function returnData() {
	return {
		dev: false,
		form_data: null,
	}

}
function returnCreated() {
	return function () {
		this.loadOaPage()
	}
}
function returnMethods() {
	return {

		loadOaPage: function () {
			// if (this.form_id && this.page_id && this.var_obj && this.varName)
			this.pushOaPageIdBindForm(this.form_id, this.page_id, this.var_obj, this.var_name);
		},

		pushOaPageIdBindForm: function (container_id, page_id, varObj, varName) {
			var that = this;
			var extra_data = JSON.parse(JSON.stringify(that.extra_data))
			if ("undefined" == typeof callAPI) {
				this.dev = true;
			} else {
				callAPI('1650971236057481541.getOaDataByPageId',
					{
						page_id
					}, (res) => {

						const res_data = JSON.parse(res);
						if (res_data.code == 200) {
							const tempdata = JSON.parse(res_data.data);
							const temptname = res_data.tname;

							var loadOAFormFn = function () {
								window.analysisLoadingDone = true;
								tname = temptname;
								const $container = $("#" + container_id);
								addOALayoutByEle($container, tempdata, 2);
								setTimeout(function () {

									var form_el = $container.find("form");
									if (varObj[varName] != null
										&& varObj[varName].oa_form_value != null
										&& Array.isArray(varObj[varName].oa_form_value)) {
										// 读取初始值
										const initFormDataList = JSON.parse(JSON.stringify(varObj[varName].oa_form_value));
										const initFormData = {};
										initFormDataList.map(fItem => {
											initFormData[fItem["name"]] = fItem["value"];
										});
										Object.keys(initFormData).length > 0 && setFormInfo(initFormData);
									}

									Object.defineProperty(varObj, varName, {
										get: function () {
											if (form_el.length == 0) {
												throw new Error('form get Error! not $container form');
											}
											const form_data = getOAFormData(form_el);
											return {
												...extra_data,
												oa_form_value: form_data
											};
										}
									});

								}, 1500)
							}

							// analysisLoading 只执行一次。
							if (!window.analysisLoadingDone) {
								analysisLoading(tempdata, loadOAFormFn)
							} else {
								loadOAFormFn();
							}


						} else {
							throw new Error('加载OA页面出错');
						}

					})
			}

		}
	}
}