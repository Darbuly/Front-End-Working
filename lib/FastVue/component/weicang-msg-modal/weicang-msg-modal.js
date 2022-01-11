function returnData() {
	return {
		title: '这是标题',
		msg: '这是内容',
		show: false,
		btn_list: [
			{
				title: '确定',
				type: 'url',
				url: 'www.baidu.com'
			}, {
				title: '关闭',
				type: 'function',
				url: 'close'
			}
		]
	};
}
function returnCreated() {
	return function () {
	}
}
function returnMethods() {
	return {
		to_nav: function () {
			if (this.to_url) {
				window.location.href = this.to_url;
			}
		},
		showMsg(data) {
			this.title = data.title;
			this.msg = data.msg;
			this.btn_list = data.btn_list;
			this.show = true;
		},
		clickBtn: function (bitem) {
			if (bitem.type == 'url') {
				window.location.href = bitem.url;
			} else {

				if (bitem.url == 'close') {
					this.show = false;
				}

			}
		}
	}
}