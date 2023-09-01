function returnData() {
	return {
		autosize: false,
		can_edit: false,
		is_number: true,
		loading: false,
		placeholder: '请输入内容',
		old_name: '',
		ruleForm: {
			name: '收到收到收到收到收到收到收到收到收到收到收到收到收到收到收到收到收到收到收到收到收到',
		},
		rules: {
			name: [
				{ required: true, message: '请输入活动名称', trigger: 'change' },
			]
		}
	};
}
function returnCreated() {
	return function () {
		console.log(this)

	}
}


function returnMethods() {
	return {
		openEditStatus() {
			this.can_edit = true;
		},
		usernameYes() {
			if (this.loading) return;
			console.log(this.$refs['ruleForm'])
			if (this.$refs['ruleForm'].fields[0].validateState == 'error') {
				return;
			}
			this.can_edit = false;
		},
		closeEditStatus() {
			this.can_edit = false;
		},
		submitForm(formName) {

		}

	}
}