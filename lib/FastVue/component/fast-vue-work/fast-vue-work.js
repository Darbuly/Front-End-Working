function returnData() {
	return {
		count: 1,
		exportType: [
			{ label: "默认", value: "default" },
			{ label: "OA写法", value: "OA" },
			{ label: "mixin", value: "mixin" },
		],
		form: {
			name: 'demo',
			tagsname: 'demo',
			code: '',
			exportType: "default"
		}
	}

}
function returnCreated() {
	return function () {
	}
}
function returnMethods() {
	return {
		addCount: function () {
			this.count++;
		},
		async onSubmit() {
			console.log('submit!2s');
			if ("default" == this.form.exportType) {
				const vueScript = await this.$fastvue.getRegVueComponentScript(this.form.name, {}, {}, true)
				this.renderCode(vueScript);
			} else if ("OA" == this.form.exportType) {
				const vueJson = await this.$fastvue.getRegVueComponentScript(this.form.name, {}, {}, true, 3)
				const code_list = [];
				code_list.push({
					label: "拓展html",
					code: vueJson.template,
				})

				var _vueJson = {
					props: vueJson.props,
					data: vueJson.data,
					computed: vueJson.computed,
					mounted: vueJson.mounted,
					created: vueJson.created,
					methods: vueJson.methods,
				}
				code_list.push({
					label: "拓展html的Vue信息",
					code: this.$fastvue.obj2Str(_vueJson),
				})

				this.form.code = code_list;
			} else if ("mixin" == this.form.exportType) {
				const vueJson = await this.$fastvue.getRegVueComponentScript(this.form.name, {}, {}, true, 3)
				const code_list = [];
				var _vueJson = {
					props: vueJson.props,
					data: vueJson.data,
					computed: vueJson.computed,
					mounted: vueJson.mounted,
					created: vueJson.created,
					methods: vueJson.methods,
				}
				code_list.push({
					label: "mixin",
					code: this.renderMixin(this.$fastvue.obj2Str(_vueJson)),
				})
				this.form.code = code_list;
			}

		},
		renderCode(vueScript) {
			this.form.code = `
Vue.component(${JSON.stringify(this.form.tagsname)}, 
    ${vueScript}
)
`
		},
		renderMixin(vueScript) {
			return `
var ${this.$fastvue.dashToCamel(this.form.name)} = ${vueScript}
			`
		}
	}
}