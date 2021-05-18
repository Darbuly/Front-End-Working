function returnData() {
    return {
        status: 'success',
        tip_msg: '添加成功',
        back_title: '返回',
        back_link: 'http://www.baidu.com',
        showStatus: false,
    };
}
function returnCreated() {
    return function () {
    }
}
function returnMethods() {
    return {
        show(type) {
            switch (type) {
                case 'success':
                    this.status = 'success'
                    this.showStatus = true;
                    break;
                default:
                    this.status = 'success';
                    this.showStatus = true;
                    break;
            }
        },

        hide() {
            this.showStatus = false;
        },

        toBack() {
            window.location.href = this.back_link;
        }
    }
}