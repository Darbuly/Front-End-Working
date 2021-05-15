function returnData() {
    return {
        activeColor: '#5275f7',
        value: 0,
        option: [
            { text: '天安豪园3栋x06', value: 0 },
            { text: '天安豪园3栋86', value: 1 },
            { text: '天安豪园3栋80', value: 2 },
        ],
        optionList: [

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
        clickItem(index) {
            console.log(index);
        }
    }
}