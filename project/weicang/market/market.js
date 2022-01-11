
$(function () {


    //初始化产品高宽
    var height = document.getElementById("product_contain").offsetHeight//600
    var smHeight = height / 3; //600/3=200
    $(".product_infos_wrap").css('marginTop', height - 20 + 'px')

    var curr_item_indx = 0;


    logo_item_click = function () {

        //隐藏logo
        $('#border_animat').hide();
        $('#street_contain').hide();
        $('#m_logo_layer').hide();
        $('#product_layer').show();
        $('#product_layer').addClass('zoomProduct');
        $('#product_layer').removeClass('anti_ZoomProduct');

        if (document.body.clientWidth <= 750) {
            big_p_w = document.body.clientWidth * 0.8036;
            $('.closer_phone')[0].style.display = 'block';
        }

    };



    product_item_click = function (indx) {
        var product_infos = readProductInfos();
        if (indx >= product_infos.length
            || indx < 0) {
            console.log('触底了')
            return;
        }
        curr_item_indx = indx;


        //变大当前 其余变小


        //当前元素处理：变大，去透明,加class标记
        $("#product_contain .product_item").eq(indx).addClass('productItemCur').siblings().removeClass('productItemCur');

        $("#product_contain .product_item img").eq(indx).css('width', height + 'px');
        $("#product_contain .product_item img").eq(indx).css('height', height + 'px');
        $("#product_contain .product_item img").eq(indx).css('opacity', '1');


        //处理其余元素
        var others = $("#product_contain .product_item").eq(indx).siblings();
        for (let i = 0; i < others.length; i++) {
            const pItem = others[i];
            const img = pItem.firstChild;
            //透明
            img.style.opacity = 0.3;
            //变小
            img.style.width = smHeight + 'px';
            img.style.height = smHeight + 'px';
        }

        //导航记录状态
        $("#hd ul li").eq(indx).addClass("on").siblings().removeClass('on');



        var p_w = $("#product_layer").width();//总长
        var one_p_w = smHeight//单位长
        var big_p_w = height;

        if (document.body.clientWidth <= 750) {
            // big_p_w = document.body.clientWidth * 0.8036;
        }


        console.log(`${one_p_w},${big_p_w}`);
        var l = (p_w - big_p_w) / 2 - one_p_w * indx;
        //商品条向左移动
        $("#product_contain").css({
            'left': l,
            'transition': 'left .3s ease'
        });


        //读取商品信息，覆写信息
        $("#product_infos .product_name").html(product_infos[indx].name);
        $("#product_infos .product_desc").html(product_infos[indx].desc);
        $("#product_infos .product_price").html(`￥${product_infos[indx].price} 元`);
    };
    enterDetail = function () {
        var product_infos = readProductInfos();
        window.open(product_infos[curr_item_indx].herf_url);
    };


    activeDrag = () => {
        console.log('移动端支持拖拽');
        let position = [0, 0];

        const div = document.getElementById("product_contain");
        if (!div) {
            throw new Error('拖动对象初始化失败，请检查id值是否正确');
        }
        div.addEventListener('touchstart', function (e) {
            if (e.targetTouches.length == 1) {
                position[0] = e.targetTouches[0].pageX;
            }

        }, false);

        div.addEventListener('touchend', function (e) {
            if (e.changedTouches.length == 1) {
                let deltaX = e.changedTouches[0].pageX - position[0];
                if (Math.abs(deltaX) < 10) {
                    return;
                }
                if (deltaX > 0) {
                    //向右拖
                    console.log('向右拖')
                    setTimeout(() => {
                        product_item_click(curr_item_indx - 1);
                    }, 0)


                } else {
                    //向左拖
                    console.log('向左拖')
                    setTimeout(() => {
                        product_item_click(curr_item_indx + 1);
                    }, 0)

                }
            }


        }, false);

    }

    init();

    function init() {
        var product_infos = readProductInfos();

        //初始化产品层
        let center = product_infos.length / 2 + 1;

        for (var i = 0; i < product_infos.length; i++) {

            let point_desc_str = ``;
            const point_desc = product_infos[i].point_desc;
            if (point_desc
                && point_desc.length) {

                point_desc.map((pItem) => {

                    //计算加宽值
                    let add_width = 0;
                    let minWidth = 220;
                    let maxWidth = 500;

                    if (pItem.addW && document.body.clientWidth > 750) {
                        add_width = height * pItem.addW * 0.01;
                    }

                    if (document.body.clientWidth <= 750) {
                        minWidth = 120;
                        maxWidth = 250;
                    }


                    point_desc_str += `<div class="point_desc" style="left:${pItem.left}%;top:${pItem.top}%;" ><span style="min-width:${add_width + minWidth}px;max-width:${maxWidth}px;"> <div class='p_desc_t'>${pItem.text}</div></span></div>`;
                })


            }


            var str =
                "<div class='product_item' style='display: flex;position: relative;' data-index='" + i + "'onclick='product_item_click(" + i + ")'>" +
                "<img src='" + product_infos[i].img_url + "'>" + point_desc_str
            "</div>";

            $("#product_contain").append(str)
            str = `<li onclick="product_item_click(${i})"></li>`;
            $("#hd ul").append(str)
        }





        $("#product_contain .product_item img").css('width', height);

        $("#product_contain .product_item img").css('height', height);
        // for (let i = 0; i < imglist.length; i++) {
        //     const imgItem = imglist[i];
        //     imgItem.css('width', smHeight)
        //     imgItem.css('height', smHeight)

        // }


        $('#flash_title').css('display', 'none')
        product_item_click(Math.floor(product_infos.length / 2));

        // $('#product_layer').hide();
        // setTimeout(() => {
        //     $('#border_animat').show();
        //     $('#street_contain').css('display', 'flex')
        //     $('#flash_title').css('display', 'none')

        // }, 2800)

        //禁止浏览器拖动图片打开新标签页的默认事件
        document.ondragover = function (e) { e.preventDefault(); };

        //禁止浏览器拖动图片
        var im = document.getElementsByTagName('img');
        for (var i = 0; i < im.length; i++) {
            im[i].onmousedown = function (e) {
                e.preventDefault()
            }
        }


        //移动端支持拖拽
        if (document.body.clientWidth <= 750) {
            activeDrag();
        }
        // $('#street_contain').addClass('street_move');

        //初始化街道层
        // for (var i = 0; i < product_infos.length; i++) {
        //     var str =
        //         "<div style='display: flex; width: 124px; height: 124px; border: 1px solid rgba(255,255,255,0.4); align-items: center; justify-content: center;overflow: hidden; position: absolute;" +
        //         " left: " + product_infos[i].left + "px; top: " + product_infos[i].top + "px; z-index: 2;' onclick='logo_item_click(" + i + ")'>" +
        //         "</div>";
        //     str +=
        //         "<img class='logo_item' style='display: flex; position: absolute; left: " + product_infos[i].left + "px; top: "
        //         + product_infos[i].top + "px; z-index: 1'  src='" + product_infos[i].img_url + "'>";

        //     $("#street_contain").append(str);
        // }


    }

    close_product_layer = () => {

        $('#product_layer').addClass('anti_ZoomProduct');
        $('#product_layer').removeClass('zoomProduct');
        $('#street_contain').removeClass('street_contain_start');
        $('#street_contain').addClass('fast_innermove');
        $('#street_contain').show();
        $('#m_logo_layer').show();
        // $('#border_animat').show();
        $('.closer_phone')[0].style.display = 'none';

        // setTimeout(() => {
        //     $('#product_layer').css('display', 'none')
        // }, 1000)

    }



    function responseStreet() {
        if (document.body.clientWidth > 750) {
            var divW = $("#street_contain").css('width');
            var divH = $("#street_contain").css('height', divW);

        }

    }
    responseStreet();
    window.addEventListener('resize', responseStreet, false);


    function children(curEle, tagName) {
        var nodeList = curEle.childNodes;
        var ary = [];
        if (/MSIE(6|7|8)/.test(navigator.userAgent)) {
            for (var i = 0; i < nodeList.length; i++) {
                var curNode = nodeList[i];
                if (curNode.nodeType === 1) {
                    ary[ary.length] = curNode;
                }
            }
        } else {
            ary = Array.prototype.slice.call(curEle.children);
        }

        // 获取指定子元素
        if (typeof tagName === "string") {
            for (var k = 0; k < ary.length; k++) {
                curTag = ary[k];
                if (curTag.nodeName.toLowerCase() !== tagName.toLowerCase()) {
                    ary.splice(k, 1);
                    k--;
                }
            }
        }

        return ary;
    }

    //取绝对坐标
    function getAbsX(e) {
        var x = e.offsetLeft;
        while (e = e.offsetParent) {
            x += e.offsetLeft;
        }
        return x;
    }

    //亮点hover事件,赋予改变方向
    $(".point_desc").hover(function (e) {
        //取当前hover 元素的x坐标
        const p_x = getAbsX(e.currentTarget)
        //取当前页面的中心点x坐标
        const fullWidth = document.documentElement.clientWidth;
        console.log(`${p_x},${fullWidth / 2}`)
        let descDiv = e.currentTarget;
        let spanDiv = children(descDiv, 'span');
        if (p_x <= fullWidth / 2) {//中心轴左侧
            // 改变方向

            if (spanDiv) {
                let sWidth = spanDiv[0].offsetWidth;
                spanDiv[0].style.left = `-${sWidth - 10}px`;
                spanDiv[0].className = 'p_to_left';
            }

        } else {

            if (spanDiv) {
                spanDiv[0].style.left = '10px';
                spanDiv[0].className = '';
            }
        }

    })


});
