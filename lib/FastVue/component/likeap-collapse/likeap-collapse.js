function returnData() {
	return {
		oldActiveName: '1',
		activeName: '1',
		list: [

		]
	};
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
			return this.formValue;
		},

		testFn() {
			console.log('cdcd');
		},
		changFn: function (data) {
			console.log(data)
		},

		handleCollapseChange(val) {

		}
	}
}