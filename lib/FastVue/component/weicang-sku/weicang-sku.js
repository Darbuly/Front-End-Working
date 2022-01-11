function returnData() {
	return {
		title: '这是标题',
	};
}
function returnCreated() {
	return function () {
		console.log('createed')
		try {

			msgVm = this;

			console.log(msgVm)

		} catch (e) {
			console.log(e)
		}
	}
}
function returnMethods() {
	return {
		changeTitle(str) {
			console.log('asdfasdfads')
			this.title = str
		},
		hit() {
			alert('dsasd');
			this.$parent.title = 'asdfa'
			console.log(this);
			return this;
		}
	}
}