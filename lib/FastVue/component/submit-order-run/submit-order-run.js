function returnData() {
    return {
        title: '提交订单',
        count: '2',
        unit: '件',
        url_link:'#',
        item_name: '商品',
        sumPrice: '9999'
    };
}
function returnCreated() {
    return function () {
        console.log(this)
        console.log('组件创建完毕')
    }
}
function returnMethods() {
    return {
        toSubmit(){
            window.location.href = this.url_link;
        }
    }
}