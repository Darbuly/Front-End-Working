function returnData() {
    return {
        showStatus: false,
        title: "捕捉风味——风味捕手与豁然开朗作品3号(2019.4)",
        body: "2018年1月24日，味仓团队第一次踏上征程的时候，就有坚定的信心，坚信自己一定能找到惊世骇俗的东西。 2018年1月28日，味仓团队兵分两路，一路和姐妹两去看人见人爱的弯弓；一路坐老岳父的摩托车去马鞍山。傍晚时分，看断水流喝酒时兴奋程度，真情流露：“哪个没得点民族脾气！”。告诉我们今天应该是看到了不平凡的东西，动了真情，过程很惊险，效果很满意！ 随后的三年时间里，味仓团队数十次去茶园，瞻仰她的面容。以至于在去的路途中： 听到什么歌曲，就知道是走到那一段路了； 走到哪一段路有一个很大的拐弯； 走到哪一段路可高瞻远瞩看远处的风景； 走到哪一段路就能闻到一阵阵花香； 走到哪一段路可以捡橄榄果； 走到哪一段路停下来休息有树藤可以爬来玩耍； 走到哪一段路有天然乐之者的LOGO拍照； 走到哪一段路特别危险需要用四驱； 走到哪一段路会与野猪的通道交汇； 走到哪一段路有手机信号可以发条朋友圈；"
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
            $('body').css("overflow", "hidden")
            $('html').css("overflow", "hidden")
            //初始化滚动条
            console.log(this.$refs.main);

            setTimeout(() => {
                this.$refs.main.scrollTop = 0;
            }, 0)
        },

        hide() {
            $('body').css("overflow", "auto")
            $('html').css("overflow", "auto")
            this.showStatus = false;
            console.log(this.$refs.main.scrollTop);
        },

    }
}