function returnData() {
    return {
        username: '',
        password: '',
    };
}
function returnCreated() {
    return function () {
        console.log(this)
        console.log('field 组件 创建完毕')
    }
}
function returnMethods() {

}