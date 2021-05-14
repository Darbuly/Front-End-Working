// rem适配
function getOsType() {
    let u = navigator.userAgent;
    let isAndroid = u.indexOf('Android') > -1 || u.indexOf('Linux') > -1; //g
    let isIOS = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/); //ios终端
    if (isAndroid) {
        return 'android';
    } else if (isIOS) {
        return 'ios';
    }

}

// jQuery(document).ready(function ($) {

//移动端标准 视宽小于767
if (document.documentElement.clientWidth < 767) {

    if (getOsType() == 'ios') {
        console.log('rem适配结果: ios');
        (function () {
            function changeRootFont() {
                var designWidth = 750, rem2px = 100;
                document.documentElement.style.fontsize =
                    ((window.innerWidth / designWidth) * rem2px) + 'px';
                //iphone6: (375 / 750) * 100 + 'px';
                //直接将设计稿的尺寸小数点往左移动两位即可，如 width：750px->7.5rem(全屏宽) height: 80px->0.8rem

                document.getElementsByTagName('html')[0].style.fontSize = document.documentElement.style.fontsize;
            }
            changeRootFont();
            window.addEventListener('resize', changeRootFont, false);
        })();
    } else {
        console.log('rem适配结果: android');
        // (function () {
        //     function changeRootFont() {
        //         var designWidth = 750, rem2px = 100;
        //         document.documentElement.style.fontsize =
        //             ((window.innerWidth / designWidth) * rem2px) + 'px';
        //         //iphone6: (375 / 750) * 100 + 'px';
        //         //直接将设计稿的尺寸小数点往左移动两位即可，如 width：750px->7.5rem(全屏宽) height: 80px->0.8rem

        //         document.getElementsByTagName('html')[0].style.fontSize = document.documentElement.style.fontsize;
        //     }
        //     changeRootFont();
        //     window.addEventListener('resize', changeRootFont, false);
        // })();
        (function (doc, win) {

            var isAndroid = win.navigator.appVersion.match(/android/gi);
            var isIPhone = win.navigator.appVersion.match(/iphone/gi);

            var scale = 1.0;
            var ratio = 1;
            if (isIPhone) {
                if (window.devicePixelRatio == 2) {
                    scale *= 0.5;
                    ratio *= 2;
                }
                if (window.devicePixelRatio == 3) {
                    scale *= (1 / 3);
                    ratio *= 3;
                }
            }
            var text = '<meta name="viewport" content="initial-scale=' + scale + ', maximum-scale=' + scale + ',' + ' minimum-scale=' + scale + ', width=device-width,' + ' user-scalable=no" />';
            document.write(text);

            var docEl = doc.documentElement
            var resizeEvt = 'orientationchange' in window ? 'orientationchange' : 'resize'
            var recalc = function () {
                var clientWidth = docEl.clientWidth
                if (!clientWidth) return
                docEl.style.fontSize = 100 * (clientWidth / 750) + 'px'

                // 解决改动系统字体造成rem适配没法1比1输出问题   
                var docElFontSize = docEl.style.fontSize.replace(/px/gi, '')
                var computedFontSize = win.getComputedStyle(docEl)['font-size'].replace(/px/gi, '')
                docElFontSize != computedFontSize && (docEl.style.fontSize = docElFontSize * docElFontSize / computedFontSize + 'px')
            }
            if (!doc.addEventListener) return
            recalc()
            win.addEventListener(resizeEvt, recalc, false)
        })(document, window);
    }
}

// });

