function returnData() {
	return {
		selected_index: 0,
		slide_list: [],
		product_title: "",
		product_subtitle: "",
		product_desc: "",
		product_cost: 0,
		product_original_cost: 0,
		product_id: "",
		disable_btn: false,
		btn_text: '加入购物袋',
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
		onSelect: function (index) {
			this.selected_index = index;
			this.$refs.wpcSwipe && this.$refs.wpcSwipe.swipeTo(index);
		},
		clickBtn: function () {
			console.log('点击了加入购物袋');
		},
		doNot: function () {
			console.log('do noth.')
		},
		onSwipeChange: function (index) {
			this.selected_index = index
		}
	}
}