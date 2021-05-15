function returnData() {
    return {
        product_num: '1',
        product_price: '1',
        product_desc: '1',
        product_title: '1',
        product_thumb: 'https://img01.yzcdn.cn/vant/ipad.jpeg',
        tags: [
            // {
            //     type: 'danger',
            //     title: 'danger'
            // }
        ],
        footer: [
            // {
            //     size: 'mini',
            //     title: '按钮',
            //     // callback: 'submitTest'
            // }
        ]

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
        // submitTest() {
        //     console.log('cdcdcdcdcdcd')
        // }
    }
}