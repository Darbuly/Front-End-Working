function returnData() {
    return {

        hideDelete: false,
        store_list: [
            {
                selected: false,
                supplier_name: '三岁の小花',
                product_list: [
                    {
                        url_link: '#',
                        selected: false,
                        product_num: 1,
                        product_price: 1,
                        product_desc: '商品描述',
                        product_title: '商品标题',
                        product_thumb: 'https://img01.yzcdn.cn/vant/ipad.jpeg'
                    }

                ]
            }
        ],
        other_cost: [
            {
                name: 'post',
                cost_title: '配送费',
                cost_price: '10'
            }
        ],
        count: 0,
        sumPrice: '9999'

    };
}
function returnCreated() {
    return function () {
        console.log(this)
        console.log('组件创建完毕')
    }
}

function returnComputed() {
    return {
        sum: function () {
            let _sum = this.countSum();
            this.changeCallback();
            return _sum;
        }
    }
}

function returnMethods() {
    return {
        hitSelect(action, type, sIndex, pIndex) {

            switch (type) {
                case "sIndex":
                    // 全选，则全部选
                    if (action) {
                        this.store_list[sIndex].selected = true;
                        this.store_list[sIndex].product_list.map((item, i) => {
                            this.store_list[sIndex].product_list[i].selected = true;
                        })
                    } else {
                        this.store_list[sIndex].selected = false;
                        this.store_list[sIndex].product_list.map((item, i) => {
                            this.store_list[sIndex].product_list[i].selected = false;
                        })
                    }


                    break;
                case "pIndex":
                    if (action) {
                        this.store_list[sIndex].product_list[pIndex].selected = true;
                    } else {
                        this.store_list[sIndex].product_list[pIndex].selected = false;
                    }
                    //如果全部选了，则全选
                    let all_selected = true;
                    for (let i = 0; i < this.store_list[sIndex].product_list.length; i++) {
                        const element = this.store_list[sIndex].product_list[i];
                        if (element.selected == false) {
                            all_selected = false;
                            break;
                        }
                    }
                    if (all_selected) {
                        this.store_list[sIndex].selected = true;
                    } else {
                        this.store_list[sIndex].selected = false;
                    }

                    break;
            }

        },

        //统计总价
        countSum() {
            let all_money = 0;
            let all_selected = 0;
            for (var i = 0; i < this.store_list.length; i++) {
                let store = this.store_list[i];
                //  普通商品计件
                for (var j = 0; j < store.product_list.length; j++) {
                    let product = store.product_list[j];
                    if (product.selected == true) {
                        all_selected++;
                        all_money += product.product_num * product.product_price;
                    }
                }

            }
            this.count = all_selected;
            this.sumPrice = all_money;

            return {
                all_money,
                all_selected
            }
        },

        changeCallback() {
            console.log('改变了');
        }
    }
}