$(function () {
    var curr_item_indx = 0;

    logo_item_click = function () {

        //隐藏logo
        $('#border_animat').hide();
        $('#street_contain').hide();
        $('#m_logo_layer').hide();
        $('#product_layer').show();
        $('#product_layer').addClass('zoomProduct');
        $('#product_layer').removeClass('anti_ZoomProduct');

    };

    product_item_click = function (indx) {

        curr_item_indx = indx;

        $("#product_contain .product_item").eq(indx).addClass("productItemCur").siblings().removeClass('productItemCur');
        $("#hd ul li").eq(indx).addClass("on").siblings().removeClass('on');

        var p_w = $("#product_layer").width();
        var l = (p_w - 600) / 2 - 200 * indx;
        //商品条向左移动
        $("#product_contain").css({
            'left': l,
            'transition': 'left .3s ease'
        });

        var product_infos = readProductInfos();
        //读取商品信息，覆写信息
        $("#product_infos .product_name").html(product_infos[indx].name);
        $("#product_infos .product_desc").html(product_infos[indx].desc);
        $("#product_infos .product_price").html(`￥${product_infos[indx].price} 元`);
    };
    enterDetail = function () {
        var product_infos = readProductInfos();
        window.open(product_infos[curr_item_indx].herf_url);
    };

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
                    point_desc_str += `<div class="point_desc" style="left:${pItem.top}%;top:${pItem.left}%;" ><span>${pItem.text}</span></div>`;
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


        product_item_click(Math.floor(product_infos.length / 2));
        $('#product_layer').hide();

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

    }

});
