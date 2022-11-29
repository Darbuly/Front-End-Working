function returnData() {
	return {
		title: '这是标题',
		max_count: 99,
		tmp_product_list: []

	};
}
function returnCreated() {
	return function () {
		console.log('created')
		this.tmp_product_list = this.propsdata.product_list;
		this.$parent['product_list'] = this.tmp_product_list;
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
		},
		subCount(pIndex) {

			if (this.tmp_product_list
				&& this.tmp_product_list[pIndex]) {
				if (this.tmp_product_list[pIndex].count > 0) {
					this.tmp_product_list[pIndex].count -= 1;
					this.updateDate();
				}
			}

		},

		addCount(pIndex) {
			if (this.tmp_product_list
				&& this.tmp_product_list[pIndex]) {

				if (this.tmp_product_list[pIndex].count < this.tmp_product_list[pIndex].max
					&& this.tmp_product_list[pIndex].count < this.max_count) {
					this.tmp_product_list[pIndex].count += 1;
					this.updateDate();
				}


			}

		},
		updateDate() {
			console.log(this.propsdata);
			const SkuVm = this.propsdata.SkuVm;
			const msgVm = this.propsdata.SkuVm.msgVm;
			SkuVm['product_list'] = this.tmp_product_list;
			if (this.checkCanSave()) {
				msgVm['confirmButtonClass'] = ''
			} else {
				msgVm['confirmButtonClass'] = 'disable'
			}
		},
		checkCanSave() {
			let res = false;
			this.tmp_product_list.map(function (item) {
				if (item.count > 0) {
					res = true;
				}
			})
			return res;
		}
	}
}