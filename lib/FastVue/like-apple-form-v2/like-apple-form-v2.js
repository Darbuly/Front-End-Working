function returnData() {
	return {
		autocomplete: 'on',
		formData: {},
		form_id: 'ruleForm',
		hide_required_asterisk: true,
		formValue: {

		},

		formType: {

		},

		rules: {

		}
	};
}

function returnComputed() {
	return {
		outputData: function () {

			if (Object.keys(this.formData).length) {
				return this.formData
			} else if (this.propsdata && this.propsdata.formData) {
				return this.propsdata.formData
			} else {
				return null;
			}

		}

	}
}

function returnCreated() {
	return function () {
		console.log(this)

	}
}


function returnMethods() {
	return {
		submitForm(formName) {
			console.log(this.$refs);
			this.$refs[formName].validate((valid) => {
				if (valid) {
					console.log(valid);
					return true;
				} else {
					console.log('error submit!!');
					return false;
				}
			});
		},

		validateForm() {
			this.$refs[this.form_id].validate((valid) => {
				if (valid) {

					return true;
				} else {

					return false;
				}
			});
		},

		resetForm(formName) {
			this.$refs[formName].resetFields();
		},
		getFormValue() {
			return this.outputData.formValue;
		}

	}
}