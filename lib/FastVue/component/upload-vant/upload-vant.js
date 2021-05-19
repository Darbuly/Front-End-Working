function returnData() {
    return {
        URL:'/api/uploadImg',
        headers:{},
        multiple: true,
        max_count: 10,
        max_size: "20000 * 1024",
        fileList: [],
        deletable:true,
        realFileList:[],
        disableUpload:false
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
            const that = this;
            let data = new FormData();
            data.append('file',file.file);

            //不要用$.ajax处理上传文件，jq对上传文件的格式处理过于复杂

            //1.创建对象
            const xhr = new XMLHttpRequest();
            //2.设置请求行(get请求数据写在url后面)
            xhr.open('post', that.URL);
            //3.设置请求头(get请求可以省略,post不发送数据也可以省略)
            // 如果使用的时 formData可以不写 请求头 写了 无法正常上传文件
            for(let key in that.headers){
                xhr.setRequestHeader(key,that.headers[key]);
            }

            //3.5注册回调函数
            xhr.onload = function () {
                try{
                   let res = JSON.parse(xhr.responseText)
                    if(res && res.code==200){
                        file.status = 'done';
                        file.message = '上传成功';
                        file.realPath = res.data.path;

                        that.toRealList();
                    }else{
                        file.status = 'fail';
                        file.message = '上传失败';
                    }
                }catch(e){
                    file.status = 'fail';
                    file.message = '上传失败';
                    throw new Error('上传文件出错:'+e)
                }
            }
            // XHR2.0新增
            //4.请求主体发送(get请求为空，或者写null，post请求数据写在这里，如果没有数据，直接为空或者写null)
            xhr.send(data);

        },
        onOversize(file) {
            console.log(file);
            Toast('文件大小不能超过 20M');
        },
        toRealList(){
            let _realList = [];
            this.fileList.map((fItem,fIndex)=>{
                if(fItem.realPath){
                   _realList.push(fItem.realPath);
                }
            })
            this.realFileList = _realList;
        }
    }
}