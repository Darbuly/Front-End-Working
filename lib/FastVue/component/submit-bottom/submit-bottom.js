function returnData() {
    return {
        type: '',
        color: '#5275f7',
        title: '我是按钮',
        showPicker: false,
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
        submit() {
            console.log('提交了');
        }
    }
}