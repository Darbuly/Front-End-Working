function returnData() {
    return {
        multiple: true,
        max_count: 10,
        max_size: "20000 * 1024",
        fileList: []
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
        afterRead(file) {
            file.status = 'uploading';
            file.message = '上传中...';

            setTimeout(() => {
                file.status = 'failed';
                file.message = '上传失败';
            }, 1000);
        },
        onOversize(file) {
            console.log(file);
            Toast('文件大小不能超过 500kb');
        },
    }
}