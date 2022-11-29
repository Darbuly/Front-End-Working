function returnData() {
    return {
        show: true,
        //大标题序号
        field_number: 1,
        //字段标题
        field_title: '字段标题',
        //字段标签
        field_label: '',
        //字段类型：
        /**
         * 默认：输入框
         * datetime:时间选择器
         * password:密码输入框
         * textarea:留言类输入框（高度自适应)
         */
        field_type: '',
        //是否禁用状态
        field_disabled: false,
        //绑定值
        field_value: '',
        //提示文本
        fleld_placeholder: '请输入',
        //留言类输入框最大字数
        field_maxlength: "100",

        //特殊组件传递参数
        field_params: {
        },

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
        onPickerConfirm(time) {
            this.field_value = time;
            let _Date = new Date(time);
            if (!moment) {
                throw new Error('请引入 moment.js')
            }
            this.field_value = moment(_Date).format('YYYY-MM-DD HH:mm:ss')
            this.showPicker = false;
        },
        onDeadlinePickerConfirm(time) {
            let _Date = new Date(time);
            if (!moment) {
                throw new Error('请引入 moment.js')
            }
            this.field_value["data"] = moment(_Date).format('YYYY-MM-DD HH:mm:ss')
            this.showPicker = false;
        },
        redioChange(e) {
            console.log('redioChange')
            console.log(e)
        },
        refreshCaptcha() {
            this.field_params.img_url = this.field_params.img_url;
        }
    }
}