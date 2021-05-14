

/*!
  * runCallJava.js v1.0.0
  * Copyright 2011-2020 
  * Authors 
  *     wangwenwei@ruuuun.com 
  *     hyl
  * 奔跑h5联合安卓/IOS多端开发接口库
  */


//判断环境 安卓？ IOS? 
/**
 *  安卓：'android'
 * 	ios:'ios'
 * 	普通浏览器：'normal'
 */
function getOsType() {
    if (typeof window !== 'undefined' && typeof window.android !== 'undefined') {
        //安卓App

        return 'android';
    } else if (typeof window !== 'undefined' && typeof window.webkit !== 'undefined'
        && typeof window.webkit.messageHandlers !== 'undefined'
        && typeof window.webkit.messageHandlers.callios !== 'undefined') {
        //IOS App
        return 'ios';

    } else {
        //浏览器中 
        return 'normal';
    }
}



/*
show_tab: 整数类型，-1:不设定  0：隐藏Tab栏  1：显示Tab栏
show_back: 整数类型，-1：不设定 0：隐藏返回按钮， 1：显示隐藏按钮
 */
function showTabBack(show_tab, show_back) {
    if (show_tab == 0) {
        // alert('隐藏tab')
        showTab("0");
    } else if (show_tab == 1) {
        // alert('显示Tab')
        showTab("1");
    }


    if (show_back == 0) {
        // alert('隐藏返回按钮')
        showBack("0");
    } else if (show_back == 1) {
        // alert("显示隐藏按钮")
        showBack("1");
    }
}

//通知APP是否显示回退按钮 "1": 显示后退,  "0" 隐藏后退。
function showBack(strVal) {

    if (getOsType() == 'android') {
        //安卓App
        window.android.callJava("showBack", strVal); //通知APP显示Tab
    } else if (getOsType() == 'ios') {
        //IOS App
        //alert("请显示Tab");
        //IOS App
        var dic = {
            "actionType": "showBack",
            "callback": "",
            "show": strVal
        }
        window.webkit.messageHandlers.callios.postMessage(JSON.stringify(dic));
    } else {
        // 不在联调范围内
    }
}

//通知APP是否显示Tab栏 "1": 显示Tab,  "0" 隐藏Tab。
function showTab(strVal) {
    if (getOsType() == 'android') {
        //安卓App
        window.android.callJava("showTab", strVal); //通知APP显示Tab
    } else if (getOsType() == 'ios') {
        //IOS App
        //alert("请显示Tab");
        var dic = {
            "actionType": "showTab",
            "callback": "",
            "show": strVal
        }
        window.webkit.messageHandlers.callios.postMessage(JSON.stringify(dic));
    } else {
        // 不在联调范围内
    }

}


//页面显示时，是否显示Tab栏、是否显示返回按钮，只针对APP有效
/*
show_tab: 整数类型，-1:不设定  0：隐藏Tab栏  1：显示Tab栏
show_back: 整数类型，-1：不设定 0：隐藏返回按钮， 1：显示隐藏按钮
isActive: boolean, true：会根据是否有浏览记录强制显示可返回，false：反之
tab:指定某个tab强制不刷新
 */
function myOnpageShow(show_tab, show_back, isActive = false, tab = '') {
    let _show_back = show_back;
    let _show_tab = show_tab;

    if (window.history.length >= 2 && isActive == true) {
        //会根据是否有浏览记录强制显示可返回
        _show_back = 1;
    }
    let _disable_tab = window.localStorage.getItem('Lock_' + tab);
    if (_disable_tab && _disable_tab == '1') {
        //被禁用，不作为
        window.localStorage.removeItem('Lock_' + tab)
        return;
    }

    showTabBack(_show_tab, _show_back);
    console.log('myOnpageShow')
    window.addEventListener('pageshow', function (event) {
        showTabBack(_show_tab, _show_back);
    });
}
