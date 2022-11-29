/**
 * turn.js 4th release
 * turnjs.com
 * turnjs.com/license.txt
 *
 * Copyright (C) 2012 Emmanuel Garcia
 * All rights reserved
 **/

(function ($) {

  'use strict';

  var has3d,

    hasRot,

    vendor = '',

    version = '4.1.0.2.1',//奔跑修改版本从 4.1.0 => 4.1.0.1.0 开始

    PI = Math.PI,

    A90 = PI / 2,

    isTouch = 'ontouchstart' in window,

    mouseEvents = (isTouch) ?
      {
        down: 'touchstart',
        move: 'touchmove',
        up: 'touchend',
        over: 'touchstart',
        out: 'touchend'
      }
      :
      {
        down: 'mousedown',
        move: 'mousemove',
        up: 'mouseup',
        over: 'mouseover',
        out: 'mouseout'
      },

    // Contansts used for each corner
    //   | tl * tr |
    // l | *     * | r
    //   | bl * br |

    corners = {
      backward: ['bl', 'tl'],
      forward: ['br', 'tr'],
      vertical: ['bl', 'br'],
      all: ['tl', 'bl', 'tr', 'br', 'l', 'r']
    },

    // Display values

    displays = ['single', 'double'],

    // Direction values

    directions = ['ltr', 'rtl'],

    // Default options

    turnOptions = {

      // Enables hardware acceleration

      acceleration: true,

      // Display

      display: 'double',

      // Duration of transition in milliseconds

      duration: 600,

      // First page

      page: 1,

      // Enables gradients

      gradients: true,

      // Corners used when turning the page

      turnCorners: 'bl,br',

      // Events

      when: null,

      /** add below by Wangwenwei 20220422
       *  任何允许定义的变量参数，请按照以下规范进行添加
       */
      // flip 参数可控
      flip: {},

      // 开发模式

      debug: false,

      // 拖动翻页生效时间 ms

      dragDuration: 2000,

      // 拖动翻页生效距离(坐标差)

      dragDeltaX: 30,

      // 妥当翻页生效正切角度

      dragAngle: 60,

      //翻页生效时间（大于这个时间，将采取是否跨过中线的方式去判断翻页）

      outAreaReleasedDuration: 200,

      // 点击生效时间(s)

      clickEffectTime: 1,

      // 横屏模式

      isHorizontal: false
    },

    flipOptions = {

      // Size of the active zone of each corner

      cornerSize: 50

    },

    // Number of pages in the DOM, minimum value: 6

    pagesInDOM = 6,


    turnMethods = {

      // Singleton constructor
      // $('#selector').turn([options]);

      init: function (options) {

        // Define constants

        // 是否有3D变化支持
        has3d = 'WebKitCSSMatrix' in window || 'MozPerspective' in document.body.style;
        hasRot = rotationAvailable();
        vendor = getPrefix();

        var i, that = this, pageNum = 0, data = this.data(), ch = this.children();

        // Set initial configuration

        // 按优先级合并options
        options = $.extend({
          width: this.width(),
          height: this.height(),
          direction: this.attr('dir') || this.css('direction') || 'ltr'
        }, turnOptions, options);

        data.opts = options;
        data.pageObjs = {};
        data.pages = {};
        data.pageWrap = {};
        data.pageZoom = {};
        data.pagePlace = {};
        data.pageMv = [];
        data.zoom = 1;
        data.totalPages = options.pages || 0;

        // 添加一个存背面图像的容器
        data.backImgs = {};

        data.timer_live = false;
        data.timer_point = 0;

        // 禁用翻页功能，仅在处于缩放状态的时候为true
        data.preventTurn = false;
        data.preventPinch = false;

        data.eventHandlers = {
          touchStart: $.proxy(turnMethods._touchStart, this),
          touchMove: $.proxy(turnMethods._touchMove, this),
          touchEnd: $.proxy(turnMethods._touchEnd, this),
          start: $.proxy(turnMethods._eventStart, this)
        };



        // Add event listeners

        if (options.when)
          for (i in options.when)
            if (has(i, options.when))
              this.bind(i, options.when[i]);

        // Set the css

        this.css({ position: 'relative', width: options.width, height: options.height });

        // Set the initial display

        this.turn('display', options.display);

        // Set the direction

        if (options.direction !== '')
          this.turn('direction', options.direction);

        // Prevent blue screen problems of switching to hardware acceleration mode
        // By forcing hardware acceleration for ever

        //非移动端的硬件加速机制
        if (has3d && !isTouch && options.acceleration)
          this.transform(translate(0, 0, true));

        // Add pages from the DOM

        for (i = 0; i < ch.length; i++) {
          if ($(ch[i]).attr('ignore') != '1') {
            this.turn('addPage', ch[i], ++pageNum);
          }
        }

        // Event listeners

        $(this).bind(mouseEvents.down, data.eventHandlers.touchStart).
          bind('end', turnMethods._eventEnd).
          bind('pressed', turnMethods._eventPressed).
          bind('released', turnMethods._eventReleased).
          bind('flip', turnMethods._flip);

        $(this).parent().bind('start', data.eventHandlers.start);

        $(document).bind(mouseEvents.move, data.eventHandlers.touchMove).
          bind(mouseEvents.up, data.eventHandlers.touchEnd);

        // Set the initial page

        this.turn('page', options.page);

        // This flipbook is ready

        data.done = true;

        return this;
      },

      // renderTimer 计时器步长， 1/60
      timerRender: function () {
        var data = this.data();
        data.timer_point += 0.0166666666666667;// 1/60
      },

      // 计时器停止
      timerStop: function () {
        var data = this.data();
        data.timer_live = false;
        data.timer_point = data.opts.clickEffectTime + 1;
      },



      // Adds a page from external data

      addPage: function (element, page) {

        var currentPage,
          className,
          incPages = false,
          data = this.data(),
          lastPage = data.totalPages + 1;

        if (data.destroying)
          return false;

        // Read the page number from the className of `element` - format: p[0-9]+

        if ((currentPage = /\bp([0-9]+)\b/.exec($(element).attr('class'))))
          page = parseInt(currentPage[1], 10);

        if (page) {

          if (page == lastPage)
            incPages = true;
          else if (page > lastPage)
            throw turnError('Page "' + page + '" cannot be inserted');

        } else {

          page = lastPage;
          incPages = true;

        }

        if (page >= 1 && page <= lastPage) {

          if (data.display == 'double')
            className = (page % 2) ? ' odd' : ' even';
          else
            className = '';

          // Stop animations
          if (data.done)
            this.turn('stop');

          // Move pages if it's necessary
          if (page in data.pageObjs)
            turnMethods._movePages.call(this, page, 1);

          // Increase the number of pages
          if (incPages)
            data.totalPages = lastPage;

          // Add element
          data.pageObjs[page] = $(element).
            css({ 'float': 'left' }).
            addClass('page p' + page + className);

          if (!hasHardPage() && data.pageObjs[page].hasClass('hard')) {
            data.pageObjs[page].removeClass('hard');
          }

          // Add page
          turnMethods._addPage.call(this, page);

          // Remove pages out of range
          turnMethods._removeFromDOM.call(this);
        }

        return this;
      },

      // Adds a page

      _addPage: function (page) {

        var data = this.data(),
          element = data.pageObjs[page];

        if (element)
          if (turnMethods._necessPage.call(this, page)) {

            if (!data.pageWrap[page]) {

              // Wrapper
              data.pageWrap[page] = $('<div/>',
                {
                  'class': 'page-wrapper',
                  page: page,
                  css: {
                    position: 'absolute',
                    overflow: 'hidden'
                  }
                });

              // Append to this flipbook
              this.append(data.pageWrap[page]);

              if (!data.pagePlace[page]) {

                data.pagePlace[page] = page;
                // Move `pageObjs[page]` to wrapper
                data.pageObjs[page].appendTo(data.pageWrap[page]);

              }

              // Set the size of the page
              var prop = turnMethods._pageSize.call(this, page, true);
              element.css({ width: prop.width, height: prop.height });
              data.pageWrap[page].css(prop);

            }

            if (data.pagePlace[page] == page) {

              // If the page isn't in another place, create the flip effect
              turnMethods._makeFlip.call(this, page);

            }

          } else {

            // Place
            data.pagePlace[page] = 0;

            // Remove element from the DOM
            if (data.pageObjs[page])
              data.pageObjs[page].remove();

          }

      },

      // Checks if a page is in memory

      hasPage: function (page) {

        return has(page, this.data().pageObjs);

      },

      // Centers the flipbook

      center: function (page) {

        var data = this.data(),
          size = $(this).turn('size'),
          left = 0;

        if (!data.noCenter) {
          if (data.display == 'double') {
            var view = this.turn('view', page || data.tpage || data.page);

            if (data.direction == 'ltr') {
              if (!view[0])
                left -= size.width / 4;
              else if (!view[1])
                left += size.width / 4;
            } else {
              if (!view[0])
                left += size.width / 4;
              else if (!view[1])
                left -= size.width / 4;
            }

          }

          $(this).css({ marginLeft: left });
        }

        return this;

      },

      // Destroys the flipbook

      destroy: function () {

        var page,
          flipbook = this,
          data = this.data(),
          events = [
            'end', 'first', 'flip', 'last', 'pressed',
            'released', 'start', 'turning', 'turned',
            'zooming', 'missing'];

        if (trigger('destroying', this) == 'prevented')
          return;

        data.destroying = true;

        $.each(events, function (index, eventName) {
          flipbook.unbind(eventName);
        });

        this.parent().unbind('start', data.eventHandlers.start);

        $(document).unbind(mouseEvents.move, data.eventHandlers.touchMove).
          unbind(mouseEvents.up, data.eventHandlers.touchEnd);

        while (data.totalPages !== 0) {
          this.turn('removePage', data.totalPages);
        }

        if (data.fparent)
          data.fparent.remove();

        if (data.shadow)
          data.shadow.remove();

        this.removeData();
        data = null;

        return this;

      },

      // Checks if this element is a flipbook

      is: function () {

        return typeof (this.data().pages) == 'object';

      },

      // Sets and gets the zoom value

      zoom: function (newZoom) {

        var data = this.data();

        if (typeof (newZoom) == 'number') {

          if (newZoom < 0.001 || newZoom > 100)
            throw turnError(newZoom + ' is not a value for zoom');

          if (trigger('zooming', this, [newZoom, data.zoom]) == 'prevented')
            return this;

          var size = this.turn('size'),
            currentView = this.turn('view'),
            iz = 1 / data.zoom,
            newWidth = Math.round(size.width * iz * newZoom),
            newHeight = Math.round(size.height * iz * newZoom);

          data.zoom = newZoom;

          $(this).turn('stop').
            turn('size', newWidth, newHeight);
          /*.
          css({marginTop: size.height * iz / 2 - newHeight / 2});*/

          if (data.opts.autoCenter)
            this.turn('center');
          /*else
            $(this).css({marginLeft: size.width * iz / 2 - newWidth / 2});*/

          turnMethods._updateShadow.call(this);

          for (var i = 0; i < currentView.length; i++) {
            if (currentView[i] && data.pageZoom[currentView[i]] != data.zoom) {

              this.trigger('zoomed', [
                currentView[i],
                currentView,
                data.pageZoom[currentView[i]],
                data.zoom]);

              data.pageZoom[currentView[i]] = data.zoom;
            }
          }

          return this;

        } else
          return data.zoom;

      },

      // Gets the size of a page

      _pageSize: function (page, position) {

        var data = this.data(),
          prop = {};

        if (data.display == 'single') {

          prop.width = this.width();
          prop.height = this.height();

          if (position) {
            prop.top = 0;
            prop.left = 0;
            prop.right = 'auto';
          }

        } else {

          var pageWidth = this.width() / 2,
            pageHeight = this.height();

          if (data.pageObjs[page].hasClass('own-size')) {
            prop.width = data.pageObjs[page].width();
            prop.height = data.pageObjs[page].height();
          } else {
            prop.width = pageWidth;
            prop.height = pageHeight;
          }

          if (position) {
            var odd = page % 2;
            prop.top = (pageHeight - prop.height) / 2;

            if (data.direction == 'ltr') {

              prop[(odd) ? 'right' : 'left'] = pageWidth - prop.width;
              prop[(odd) ? 'left' : 'right'] = 'auto';

            } else {

              prop[(odd) ? 'left' : 'right'] = pageWidth - prop.width;
              prop[(odd) ? 'right' : 'left'] = 'auto';

            }

          }
        }

        return prop;

      },

      // Prepares the flip effect for a page

      _makeFlip: function (page) {



        var data = this.data();

        if (!data.pages[page] && data.pagePlace[page] == page) {

          var single = data.display == 'single',
            odd = page % 2;

          data.pages[page] = data.pageObjs[page].
            css(turnMethods._pageSize.call(this, page)).
            flip($.extend({}, {
              page: page,
              next: (odd || single) ? page + 1 : page - 1,
              turn: this,
            }, data.opts.flip)).
            flip('disable', data.disabled);

          // Issue about z-index
          turnMethods._setPageLoc.call(this, page);

          data.pageZoom[page] = data.zoom;

        }

        return data.pages[page];
      },

      // Makes pages within a range

      _makeRange: function () {

        var page, range,
          data = this.data();

        if (data.totalPages < 1)
          return;

        range = this.turn('range');

        for (page = range[0]; page <= range[1]; page++)
          turnMethods._addPage.call(this, page);

      },

      // Returns a range of pages that should be in the DOM
      // Example:
      // - page in the current view, return true
      // * page is in the range, return true
      // Otherwise, return false
      //
      // 1 2-3 4-5 6-7 8-9 10-11 12-13
      //   **  **  --   **  **

      range: function (page) {

        var remainingPages, left, right, view,
          data = this.data();

        page = page || data.tpage || data.page || 1;
        view = turnMethods._view.call(this, page);

        if (page < 1 || page > data.totalPages)
          throw turnError('"' + page + '" is not a valid page');


        view[1] = view[1] || view[0];

        if (view[0] >= 1 && view[1] <= data.totalPages) {

          remainingPages = Math.floor((pagesInDOM - 2) / 2);

          if (data.totalPages - view[1] > view[0]) {
            left = Math.min(view[0] - 1, remainingPages);
            right = 2 * remainingPages - left;
          } else {
            right = Math.min(data.totalPages - view[1], remainingPages);
            left = 2 * remainingPages - right;
          }

        } else {
          left = pagesInDOM - 1;
          right = pagesInDOM - 1;
        }

        return [Math.max(1, view[0] - left),
        Math.min(data.totalPages, view[1] + right)];

      },

      // Detects if a page is within the range of `pagesInDOM` from the current view

      _necessPage: function (page) {

        if (page === 0)
          return true;

        var range = this.turn('range');

        return this.data().pageObjs[page].hasClass('fixed') ||
          (page >= range[0] && page <= range[1]);

      },

      // Releases memory by removing pages from the DOM

      _removeFromDOM: function () {

        var page, data = this.data();

        for (page in data.pageWrap)
          if (has(page, data.pageWrap) &&
            !turnMethods._necessPage.call(this, page))
            turnMethods._removePageFromDOM.call(this, page);

      },

      // Removes a page from DOM and its internal references

      _removePageFromDOM: function (page) {

        var data = this.data();

        if (data.pages[page]) {
          var dd = data.pages[page].data();

          flipMethods._moveFoldingPage.call(data.pages[page], false);

          if (dd.f && dd.f.fwrapper)
            dd.f.fwrapper.remove();

          data.pages[page].removeData();
          data.pages[page].remove();
          delete data.pages[page];
        }

        if (data.pageObjs[page])
          data.pageObjs[page].remove();

        if (data.pageWrap[page]) {
          data.pageWrap[page].remove();
          delete data.pageWrap[page];
        }

        turnMethods._removeMv.call(this, page);

        delete data.pagePlace[page];
        delete data.pageZoom[page];

      },

      // Removes a page

      removePage: function (page) {

        var data = this.data();

        // Delete all the pages
        if (page == '*') {

          while (data.totalPages !== 0) {
            this.turn('removePage', data.totalPages);
          }

        } else {

          if (page < 1 || page > data.totalPages)
            throw turnError('The page ' + page + ' doesn\'t exist');

          if (data.pageObjs[page]) {

            // Stop animations
            this.turn('stop');

            // Remove `page`
            turnMethods._removePageFromDOM.call(this, page);

            delete data.pageObjs[page];

          }

          // Move the pages
          turnMethods._movePages.call(this, page, -1);

          // Resize the size of this flipbook
          data.totalPages = data.totalPages - 1;

          // Check the current view

          if (data.page > data.totalPages) {

            data.page = null;
            turnMethods._fitPage.call(this, data.totalPages);

          } else {

            turnMethods._makeRange.call(this);
            this.turn('update');

          }
        }

        return this;

      },

      // Moves pages

      _movePages: function (from, change) {

        var page,
          that = this,
          data = this.data(),
          single = data.display == 'single',
          move = function (page) {

            var next = page + change,
              odd = next % 2,
              className = (odd) ? ' odd ' : ' even ';

            if (data.pageObjs[page])
              data.pageObjs[next] = data.pageObjs[page].
                removeClass('p' + page + ' odd even').
                addClass('p' + next + className);

            if (data.pagePlace[page] && data.pageWrap[page]) {

              data.pagePlace[next] = next;

              if (data.pageObjs[next].hasClass('fixed'))
                data.pageWrap[next] = data.pageWrap[page].
                  attr('page', next);
              else
                data.pageWrap[next] = data.pageWrap[page].
                  css(turnMethods._pageSize.call(that, next, true)).
                  attr('page', next);

              if (data.pages[page])
                data.pages[next] = data.pages[page].
                  flip('options', {
                    page: next,
                    next: (single || odd) ? next + 1 : next - 1
                  });

              if (change) {
                delete data.pages[page];
                delete data.pagePlace[page];
                delete data.pageZoom[page];
                delete data.pageObjs[page];
                delete data.pageWrap[page];
              }

            }

          };

        if (change > 0)
          for (page = data.totalPages; page >= from; page--)
            move(page);
        else
          for (page = from; page <= data.totalPages; page++)
            move(page);

      },

      // Sets or Gets the display mode

      display: function (display) {

        var data = this.data(),
          currentDisplay = data.display;

        if (display === undefined) {

          return currentDisplay;

        } else {

          if ($.inArray(display, displays) == -1)
            throw turnError('"' + display + '" is not a value for display');

          switch (display) {
            case 'single':

              // Create a temporal page to use as folded page

              if (!data.pageObjs[0]) {

                //below changed by Wangwenwei 20220411 ：翻页的时候，纸张背面可以穿透。
                // this.turn('stop').
                //   css({ 'overflow': 'hidden' });
                this.turn('stop')
                //end changed by Wangwenwei

                data.pageObjs[0] = $('<div />',
                  { 'class': 'page p-temporal' }).
                  css({ width: this.width(), height: this.height() }).
                  appendTo(this);
              }

              this.addClass('shadow');

              break;
            case 'double':

              // Remove the temporal page

              if (data.pageObjs[0]) {
                this.turn('stop').css({ 'overflow': '' });
                data.pageObjs[0].remove();
                delete data.pageObjs[0];
              }

              this.removeClass('shadow');

              break;
          }


          data.display = display;

          if (currentDisplay) {
            var size = this.turn('size');
            turnMethods._movePages.call(this, 1, 0);
            this.turn('size', size.width, size.height).
              turn('update');
          }

          return this;

        }

      },




      // Sets or gets the isHorizontal mode

      horizontal: function (isHorizontal) {

        var data = this.data(),
          currentHorizontal = data.opts.isHorizontal;

        if (isHorizontal == null) {
          return currentHorizontal;
        }

        if (currentHorizontal == isHorizontal) {
          //没有变化
          return this;

        } else {

          data.opts.isHorizontal = isHorizontal;

          var size = this.turn('size');
          turnMethods._movePages.call(this, 1, 0);
          this.turn('size', size.width, size.height).
            turn('update');

          return this;

        }

      },


      // Gets and sets the direction of the flipbook

      direction: function (dir) {

        var data = this.data();

        if (dir === undefined) {

          return data.direction;

        } else {

          dir = dir.toLowerCase();

          if ($.inArray(dir, directions) == -1)
            throw turnError('"' + dir + '" is not a value for direction');

          //自定义的CSS样式 direction
          if (dir == 'rtl') {
            $(this).attr('dir', 'ltr').
              css({ direction: 'ltr' });
          }

          data.direction = dir;

          if (data.done)
            this.turn('size', $(this).width(), $(this).height());

          return this;
        }

      },

      // Detects animation

      animating: function () {

        return this.data().pageMv.length > 0;

      },

      // Gets the current activated corner

      corner: function () {

        var corner,
          page,
          data = this.data();

        for (page in data.pages) {
          if (has(page, data.pages))
            if ((corner = data.pages[page].flip('corner'))) {
              return corner;
            }
        }

        return false;
      },

      // Gets the data stored in the flipbook

      data: function () {

        return this.data();

      },

      // Disables and enables the effect

      disable: function (disable) {

        var page,
          data = this.data(),
          view = this.turn('view');

        data.disabled = disable === undefined || disable === true;

        for (page in data.pages) {
          if (has(page, data.pages))
            data.pages[page].flip('disable',
              (data.disabled) ? true : $.inArray(parseInt(page, 10), view) == -1);
        }

        return this;

      },

      // Disables and enables the effect

      disabled: function (disable) {

        if (disable === undefined) {
          return this.data().disabled === true;
        } else {
          return this.turn('disable', disable);
        }

      },

      // Gets and sets the size

      size: function (width, height) {

        if (width === undefined || height === undefined) {

          return { width: this.width(), height: this.height() };

        } else {

          this.turn('stop');

          var page, prop,
            data = this.data(),
            pageWidth = (data.display == 'double') ? width / 2 : width;

          this.css({ width: width, height: height });

          if (data.pageObjs[0])
            data.pageObjs[0].css({ width: pageWidth, height: height });

          for (page in data.pageWrap) {
            if (!has(page, data.pageWrap)) continue;

            prop = turnMethods._pageSize.call(this, page, true);

            data.pageObjs[page].css({ width: prop.width, height: prop.height });
            data.pageWrap[page].css(prop);

            if (data.pages[page])
              data.pages[page].css({ width: prop.width, height: prop.height });
          }

          this.turn('resize');

          return this;

        }
      },

      // Resizes each page

      resize: function () {

        var page, data = this.data();

        if (data.pages[0]) {
          data.pageWrap[0].css({ left: -this.width() });
          data.pages[0].flip('resize', true);
        }

        for (page = 1; page <= data.totalPages; page++)
          if (data.pages[page])
            data.pages[page].flip('resize', true);

        turnMethods._updateShadow.call(this);

        if (data.opts.autoCenter)
          this.turn('center');

      },

      // Removes an animation from the cache

      _removeMv: function (page) {

        var i, data = this.data();

        for (i = 0; i < data.pageMv.length; i++)
          if (data.pageMv[i] == page) {
            data.pageMv.splice(i, 1);
            return true;
          }

        return false;

      },

      // Adds an animation to the cache

      _addMv: function (page) {

        var data = this.data();

        turnMethods._removeMv.call(this, page);
        data.pageMv.push(page);

      },

      // Gets indexes for a view

      _view: function (page) {

        var data = this.data();

        page = page || data.page;

        if (data.display == 'double')
          return (page % 2) ? [page - 1, page] : [page, page + 1];
        else
          return [page];

      },

      // Gets a view

      view: function (page) {

        var data = this.data(),
          view = turnMethods._view.call(this, page);

        if (data.display == 'double')
          return [(view[0] > 0) ? view[0] : 0,
          (view[1] <= data.totalPages) ? view[1] : 0];
        else
          return [(view[0] > 0 && view[0] <= data.totalPages) ? view[0] : 0];

      },

      // Stops animations

      stop: function (ignore, animate) {

        if (this.turn('animating')) {

          var i, opts, page,
            data = this.data();

          if (data.tpage) {
            data.page = data.tpage;
            delete data['tpage'];
          }

          for (i = 0; i < data.pageMv.length; i++) {

            if (!data.pageMv[i] || data.pageMv[i] === ignore)
              continue;

            page = data.pages[data.pageMv[i]];
            opts = page.data().f.opts;

            page.flip('hideFoldedPage', animate);

            if (!animate)
              flipMethods._moveFoldingPage.call(page, false);

            if (opts.force) {
              opts.next = (opts.page % 2 === 0) ? opts.page - 1 : opts.page + 1;
              delete opts['force'];
            }

          }
        }

        this.turn('update');

        return this;
      },

      // Gets and sets the number of pages

      pages: function (pages) {

        var data = this.data();

        if (pages) {

          if (pages < data.totalPages) {

            for (var page = data.totalPages; page > pages; page--)
              this.turn('removePage', page);

          }

          data.totalPages = pages;
          turnMethods._fitPage.call(this, data.page);

          return this;

        } else
          return data.totalPages;

      },

      // Checks missing pages

      _missing: function (page) {

        var data = this.data();

        if (data.totalPages < 1)
          return;

        var p,
          range = this.turn('range', page),
          missing = [];

        for (p = range[0]; p <= range[1]; p++) {
          if (!data.pageObjs[p])
            missing.push(p);
        }

        if (missing.length > 0)
          this.trigger('missing', [missing]);

      },

      // Sets a page without effect

      _fitPage: function (page) {

        var data = this.data(),
          newView = this.turn('view', page);

        turnMethods._missing.call(this, page);

        if (!data.pageObjs[page])
          return;

        data.page = page;

        this.turn('stop');

        for (var i = 0; i < newView.length; i++) {

          if (newView[i] && data.pageZoom[newView[i]] != data.zoom) {

            this.trigger('zoomed', [
              newView[i],
              newView,
              data.pageZoom[newView[i]],
              data.zoom]);

            data.pageZoom[newView[i]] = data.zoom;

          }
        }

        turnMethods._removeFromDOM.call(this);
        turnMethods._makeRange.call(this);
        turnMethods._updateShadow.call(this);
        this.trigger('turned', [page, newView]);
        this.turn('update');

        if (data.opts.autoCenter)
          this.turn('center');

      },

      // Turns the page

      _turnPage: function (page, noMv = false) {

        var current,
          next,
          data = this.data(),
          place = data.pagePlace[page],
          view = this.turn('view'),
          newView = this.turn('view', page);


        if (data.page != page) {

          var currentPage = data.page;

          if (trigger('turning', this, [page, newView]) == 'prevented') {

            if (currentPage == data.page && $.inArray(place, data.pageMv) != -1)
              data.pages[place].flip('hideFoldedPage', true);

            return;

          }

          if ($.inArray(1, newView) != -1)
            this.trigger('first');
          if ($.inArray(data.totalPages, newView) != -1)
            this.trigger('last');

        }

        if (data.display == 'single') {
          current = view[0];
          next = newView[0];
        } else if (view[1] && page > view[1]) {
          current = view[1];
          next = newView[0];
        } else if (view[0] && page < view[0]) {
          current = view[0];
          next = newView[1];
        }

        var optsCorners = data.opts.turnCorners.split(','),
          flipData = data.pages[current].data().f,
          opts = flipData.opts,
          actualPoint = flipData.point;


        turnMethods._missing.call(this, page);

        if (!data.pageObjs[page])
          return;

        this.turn('stop');

        data.page = page;

        turnMethods._makeRange.call(this);

        data.tpage = next;

        if (opts.next != next) {
          opts.next = next;
          opts.force = true;
        }

        this.turn('update');

        flipData.point = actualPoint;

        if (noMv) {
          return;
        }


        if (flipData.effect == 'hard')
          if (data.direction == 'ltr')
            data.pages[current].flip('turnPage',
              (page > current) ? 'r' : 'l');
          else
            data.pages[current].flip('turnPage',
              (page > current) ? 'l' : 'r');
        else {
          if (data.direction == 'ltr') {
            data.pages[current].flip('turnPage',
              optsCorners[(page > current) ? 1 : 0]);
          }
          else {
            data.pages[current].flip('turnPage',
              optsCorners[(page > current) ? 0 : 1]);
          }
        }

      },

      // Gets and sets a page

      page: function (page) {

        var data = this.data();

        if (page === undefined) {

          return data.page;

        } else {

          if (!data.disabled && !data.destroying) {

            page = parseInt(page, 10);

            if (page > 0 && page <= data.totalPages) {

              if (page != data.page) {
                if (!data.done || $.inArray(page, this.turn('view')) != -1)
                  turnMethods._fitPage.call(this, page);
                else
                  turnMethods._turnPage.call(this, page);
              }

              return this;

            } else {

              throw turnError('The page ' + page + ' does not exist');

            }

          }

        }

      },

      // Turns to the next view

      next: function () {

        return this.turn('page', Math.min(this.data().totalPages,
          turnMethods._view.call(this, this.data().page).pop() + 1));

      },

      // Turns to the previous view

      previous: function () {

        return this.turn('page', Math.max(1,
          turnMethods._view.call(this, this.data().page).shift() - 1));

      },

      // Shows a peeling corner

      peel: function (corner, animate) {

        var data = this.data(),
          view = this.turn('view');

        animate = (animate === undefined) ? true : animate === true;

        if (corner === false) {

          this.turn('stop', null, animate);

        } else {

          if (data.display == 'single') {

            data.pages[data.page].flip('peel', corner, animate);

          } else {

            var page;

            if (data.direction == 'ltr') {

              page = (corner.indexOf('l') != -1) ? view[0] : view[1];

            } else {

              page = (corner.indexOf('l') != -1) ? view[1] : view[0];

            }

            if (data.pages[page])
              data.pages[page].flip('peel', corner, animate);

          }
        }

        return this;

      },

      // Adds a motion to the internal list
      // This event is called in context of flip

      _addMotionPage: function () {

        var opts = $(this).data().f.opts,
          turn = opts.turn,
          dd = turn.data();

        turnMethods._addMv.call(turn, opts.page);

      },

      // This event is called in context of flip

      _eventStart: function (e, opts, corner) {

        var data = opts.turn.data(),
          isHorizontal = data.opts.isHorizontal,
          actualZoom = data.pageZoom[opts.page];

        if (e.isDefaultPrevented()) {
          turnMethods._updateShadow.call(opts.turn);
          return;
        }

        if (actualZoom && actualZoom != data.zoom) {

          opts.turn.trigger('zoomed', [
            opts.page,
            opts.turn.turn('view', opts.page),
            actualZoom,
            data.zoom]);

          data.pageZoom[opts.page] = data.zoom;

        }

        if (data.display == 'single' && corner) {

          if ((corner.charAt(1) == 'l' && data.direction == 'ltr') ||
            (corner.charAt(1) == 'r' && data.direction == 'rtl')) {

            if (isHorizontal) {
              opts.next = (opts.next > opts.page) ? opts.next : opts.page + 1;
            } else {

              opts.next = (opts.next < opts.page) ? opts.next : opts.page - 1;
              opts.force = true;
            }


          } else {

            opts.next = (opts.next > opts.page) ? opts.next : opts.page + 1;

          }

        }

        turnMethods._addMotionPage.call(e.target);
        turnMethods._updateShadow.call(opts.turn);
      },

      // This event is called in context of flip

      _eventEnd: function (e, opts, turned) {

        var that = $(e.target),
          data = that.data().f,
          turn = opts.turn,
          dd = turn.data();

        if (turned) {

          var tpage = dd.tpage || dd.page;

          if (tpage == opts.next || tpage == opts.page) {
            delete dd.tpage;



            turnMethods._fitPage.call(turn, tpage || opts.next, true);
          } else {
          }

        } else {


          turnMethods._removeMv.call(turn, opts.page);
          turnMethods._updateShadow.call(turn);
          turn.turn('update');

        }

      },

      // This event is called in context of flip

      _eventPressed: function (e) {

        var page,
          data = $(e.target).data().f,
          turn = data.opts.turn,
          turnData = turn.data(),
          pages = turnData.pages;

        turnData.mouseAction = true;

        turn.turn('update');

        return data.time = new Date().getTime();

      },

      // This event is called in context of flip

      _eventReleased: function (e, point) {

        var outArea,
          page = $(e.target),
          data = page.data().f,
          turn = data.opts.turn,
          turnData = turn.data(),
          isHorizontal = turnData.opts.isHorizontal;

        if (turnData.display == 'single') {

          if (point.centerCirclePoint && point.realpoint) {

            // 跩边型拖动到中心才翻页
            if (isHorizontal) {
              outArea = (point.corner == 'bl' || point.corner == 'br') ?
                point.realpoint.x < page.height() / 2 :
                point.realpoint.x > page.height() / 2;

            } else {
              outArea = (point.corner == 'br' || point.corner == 'tr') ?
                point.realpoint.x < page.width() / 2 :
                point.realpoint.x > page.width() / 2;
            }



          } else {

            if (isHorizontal) {
              outArea = (point.corner == 'bl' || point.corner == 'br') ?
                point.y < page.height() / 2 :
                point.y > page.height() / 2;

            } else {
              outArea = (point.corner == 'br' || point.corner == 'tr') ?
                point.x < page.width() / 2 :
                point.x > page.width() / 2;
            }

          }


        } else {
          outArea = point.x < 0 || point.x > page.width();
        }

        if (point.centerCirclePoint && point.realpoint) {
          // 如果是跩边型，判断短按是否强制翻页的前提是拖拽方向是否正确

          if (point.previous) {
            // 如果是回翻
            if (point.canEffect &&
              (new Date()).getTime() - data.time < turnData.opts.outAreaReleasedDuration) {
              if (point.direction == 'right') {
                // 回翻的情况下，保持不变就是成功回翻。
                data.backturned = true;
              } else {
                // 快速往左边滑动，就可以翻页
                e.preventDefault();
                turnMethods._turnPage.call(turn, data.opts.next);
              }

            } else {
              if (outArea) {
                e.preventDefault();
                turnMethods._turnPage.call(turn, data.opts.next);
              } else {
                // 回翻的情况下，保持不变就是成功回翻。
                data.backturned = true;
              }

            }
          } else {

            if (point.canEffect &&
              ((new Date()).getTime() - data.time < turnData.opts.outAreaReleasedDuration || outArea)) {

              // 如果是 内部横向拖动区域 ，方向为right，需要保持不变，因为right 为回翻


              if (point.direction == 'right') {

                // 内部横向拖动区域+向右拖拽，拖动的时间很短
                if (point.previousPage > 0) {
                  flipMethods.turnPrevious.call(page, point.previousPage)
                }

              } else {
                e.preventDefault();
                turnMethods._turnPage.call(turn, data.opts.next);

              }

            } else if (point.canEffect && point.direction == 'right') {

              // 内部横向拖动区域+向右拖拽，拖动的时间很长且满足拖拽距离

              if (point.previousPage > 0) {
                flipMethods.turnPrevious.call(page, point.previousPage)
              }

            }


          }


        } else {

          if ((new Date()).getTime() - data.time < turnData.opts.outAreaReleasedDuration || outArea) {

            e.preventDefault();
            turnMethods._turnPage.call(turn, data.opts.next);

          }

        }



        turnData.mouseAction = false;

      },

      // This event is called in context of flip

      _flip: function (e) {

        e.stopPropagation();

        var opts = $(e.target).data().f.opts;

        opts.turn.trigger('turn', [opts.next]);

        if (opts.turn.data().opts.autoCenter) {
          opts.turn.turn('center', opts.next);
        }

      },

      //
      _touchStart: function () {
        this.tlog('_touchStart');

        var data = this.data(),
          _arguments = arguments,
          that = this;

        // 如果处于缩放状态，这里无效
        if (data.preventTurn) {
          return true;
        }


        //开启计时器
        data.timer_point = 0;
        data.timer_live = true;

        var frame = function () {
          var current_time_point = data.timer_point,
            clickEffectTime = data.opts.clickEffectTime;

          turnMethods.timerRender.call(that);

          if (current_time_point <= clickEffectTime) {
            window.requestAnim(frame);
          } else {

            if (!data.timer_live) return false;

            data.timer_live = false;
            //点击计时器到时，杜绝缩放事件 
            data.preventPinch = true;

            if (flipMethods.isDoublefingerEvents(_arguments[0])) {
            } else {

              for (var page in data.pages) {
                if (has(page, data.pages) &&
                  flipMethods._eventStart.apply(data.pages[page], _arguments) === false) {
                  return false;
                }
              }
            }
          }

        }

        return frame();


      },

      //
      _touchMove: function () {
        // this.tlog('_touchMove')

        //点击计时器没到时，如果出现MOVE,那么杜绝缩放事件，进行翻页事件。
        var data = this.data(),
          current_time_point = data.timer_point,
          clickEffectTime = data.opts.clickEffectTime;

        // 如果处于缩放状态，这里无效
        if (data.preventTurn) {
          return true;
        }

        if (current_time_point <= clickEffectTime) {
          data.preventPinch = true;
          // 马上生效翻页事件,这次move无效
          data.timer_point = clickEffectTime + 1;
          return true;
        }


        if (flipMethods.isDoublefingerEvents(arguments[0])) {
        } else {

          for (var page in data.pages) {
            if (has(page, data.pages)) {
              flipMethods._eventMove.apply(data.pages[page], arguments);
            }
          }
        }


      },

      //
      _touchEnd: function () {
        this.tlog('_touchEnd');
        var data = this.data();

        turnMethods.timerStop.call(this, arguments)

        // 如果处于缩放状态，这里无效
        if (data.preventTurn) {
          return true;
        }

        if (flipMethods.isDoublefingerEvents(arguments[0])) {
        } else {

          for (var page in data.pages) {
            if (has(page, data.pages)) {
              flipMethods._eventEnd.apply(data.pages[page], arguments);
            }
          }

        }

        //释放缩放组件
        data.preventPinch = false;

      },

      // Calculate the z-index value for pages during the animation

      calculateZ: function (mv) {

        var i, page, nextPage, placePage, dpage,
          that = this,
          data = this.data(),
          view = this.turn('view'),
          currentPage = view[0] || view[1],
          total = mv.length - 1,
          r = { pageZ: {}, partZ: {}, pageV: {} },

          addView = function (page) {
            var view = that.turn('view', page);
            if (view[0]) r.pageV[view[0]] = true;
            if (view[1]) r.pageV[view[1]] = true;
          };

        for (i = 0; i <= total; i++) {
          page = mv[i];
          nextPage = data.pages[page].data().f.opts.next;
          placePage = data.pagePlace[page];
          addView(page);
          addView(nextPage);
          dpage = (data.pagePlace[nextPage] == nextPage) ? nextPage : page;
          r.pageZ[dpage] = data.totalPages - Math.abs(currentPage - dpage);
          r.partZ[placePage] = data.totalPages * 2 - total + i;
        }

        return r;
      },

      // Updates the z-index and display property of every page

      update: function () {

        var page,
          data = this.data();

        if (this.turn('animating') && data.pageMv[0] !== 0) {

          // Update motion

          var p, apage, fixed,
            pos = this.turn('calculateZ', data.pageMv),
            corner = this.turn('corner'),
            actualView = this.turn('view'),
            newView = this.turn('view', data.tpage);

          for (page in data.pageWrap) {

            if (!has(page, data.pageWrap))
              continue;

            fixed = data.pageObjs[page].hasClass('fixed');

            data.pageWrap[page].css({
              display: (pos.pageV[page] || fixed) ? '' : 'none',
              zIndex:
                (data.pageObjs[page].hasClass('hard') ?
                  pos.partZ[page]
                  :
                  pos.pageZ[page]
                ) || (fixed ? -1 : 0)
            });

            if ((p = data.pages[page])) {

              p.flip('z', pos.partZ[page] || null);

              if (pos.pageV[page])
                p.flip('resize');

              if (data.tpage) { // Is it turning the page to `tpage`?

                p.flip('hover', false).
                  flip('disable',
                    $.inArray(parseInt(page, 10), data.pageMv) == -1 &&
                    page != newView[0] &&
                    page != newView[1]);

              } else {

                p.flip('hover', corner === false).
                  flip('disable', page != actualView[0] && page != actualView[1]);

              }

            }

          }

        } else {

          // Update static pages

          for (page in data.pageWrap) {

            if (!has(page, data.pageWrap))
              continue;

            var pageLocation = turnMethods._setPageLoc.call(this, page);

            if (data.pages[page]) {
              data.pages[page].
                flip('disable', data.disabled || pageLocation != 1).
                flip('hover', true).
                flip('z', null);
            }
          }
        }

        return this;
      },

      // Updates the position and size of the flipbook's shadow

      _updateShadow: function () {

        var view, view2, shadow,
          data = this.data(),
          width = this.width(),
          height = this.height(),
          pageWidth = (data.display == 'single') ? width : width / 2;

        view = this.turn('view');

        if (!data.shadow) {
          data.shadow = $('<div />', {
            'class': 'shadow',
            'css': divAtt(0, 0, 0).css
          }).
            appendTo(this);
        }

        for (var i = 0; i < data.pageMv.length; i++) {
          if (!view[0] || !view[1])
            break;

          view = this.turn('view', data.pages[data.pageMv[i]].data().f.opts.next);
          view2 = this.turn('view', data.pageMv[i]);

          view[0] = view[0] && view2[0];
          view[1] = view[1] && view2[1];
        }

        if (!view[0]) shadow = (data.direction == 'ltr') ? 1 : 2;
        else if (!view[1]) shadow = (data.direction == 'ltr') ? 2 : 1;
        else shadow = 3;

        switch (shadow) {
          case 1:
            data.shadow.css({
              width: pageWidth,
              height: height,
              top: 0,
              left: pageWidth
            });
            break;
          case 2:
            data.shadow.css({
              width: pageWidth,
              height: height,
              top: 0,
              left: 0
            });
            break;
          case 3:
            data.shadow.css({
              width: width,
              height: height,
              top: 0,
              left: 0
            });
            break;
        }

      },

      // Sets the z-index and display property of a page
      // It depends on the current view

      _setPageLoc: function (page) {

        var data = this.data(),
          view = this.turn('view'),
          loc = 0;


        if (page == view[0] || page == view[1])
          loc = 1;
        else if (
          (data.display == 'single' && page == view[0] + 1) ||
          (data.display == 'double' && page == view[0] - 2 || page == view[1] + 2)
        )
          loc = 2;

        if (!this.turn('animating'))
          switch (loc) {
            case 1:
              data.pageWrap[page].css(
                {
                  zIndex: data.totalPages,
                  display: ''
                });
              break;
            case 2:
              data.pageWrap[page].css(
                {
                  zIndex: data.totalPages - 1,
                  display: ''
                });
              break;
            case 0:
              data.pageWrap[page].css(
                {
                  zIndex: 0,
                  display: (data.pageObjs[page].hasClass('fixed')) ? '' : 'none'
                }
              );
              break;
          }

        return loc;
      },

      // Gets and sets the options

      options: function (options) {

        if (options === undefined) {

          return this.data().opts;

        } else {

          var data = this.data();

          // Set new values

          $.extend(data.opts, options);

          // Set pages

          if (options.pages)
            this.turn('pages', options.pages);

          // Set page

          if (options.page)
            this.turn('page', options.page);

          // Set display

          if (options.display)
            this.turn('display', options.display);

          // Set direction

          if (options.direction)
            this.turn('direction', options.direction);

          // Set size

          if (options.width && options.height)
            this.turn('size', options.width, options.height);

          // Add event listeners

          if (options.when)
            for (var eventName in options.when)
              if (has(eventName, options.when)) {
                this.unbind(eventName).
                  bind(eventName, options.when[eventName]);
              }

          return this;
        }

      },

      // Gets the current version

      version: function () {

        return version;

      }
    },

    // Methods and properties for the flip page effect

    flipMethods = {

      // Constructor

      init: function (opts) {

        this.data({
          f: {
            disabled: false,
            hover: false,
            effect: (this.hasClass('hard')) ? 'hard' : 'sheet'
          }
        });

        this.flip('options', opts);

        flipMethods._addPageWrapper.call(this);

        return this;
      },

      setData: function (d) {

        var data = this.data();

        data.f = $.extend(data.f, d);

        return this;
      },

      options: function (opts) {

        var data = this.data().f;

        if (opts) {
          flipMethods.setData.call(this,
            { opts: $.extend({}, data.opts || flipOptions, opts) });
          return this;
        } else
          return data.opts;

      },

      z: function (z) {

        var data = this.data().f;

        data.opts['z-index'] = z;

        if (data.fwrapper)
          data.fwrapper.css({
            zIndex: z || parseInt(data.parent.css('z-index'), 10) || 0
          });

        return this;
      },

      _cAllowed: function () {

        var data = this.data().f,
          page = data.opts.page,
          turnData = data.opts.turn.data(),
          isHorizontal = turnData.opts.isHorizontal,
          odd = page % 2;

        if (data.effect == 'hard') {

          return (turnData.direction == 'ltr') ?
            [(odd) ? 'r' : 'l'] :
            [(odd) ? 'l' : 'r'];

        } else {

          if (turnData.display == 'single') {

            if (isHorizontal) {

              if (page == 1)
                return corners['vertical'];
              else if (page == turnData.totalPages)
                return [];
              else
                return corners['vertical'];


            } else {

              if (page == 1)
                return corners['forward'];
              else if (page == turnData.totalPages)
                return [];
              else
                return corners['forward'];

            }

          } else {

            return (turnData.direction == 'ltr') ?
              corners[(odd) ? 'forward' : 'backward']
              :
              corners[(odd) ? 'backward' : 'forward'];

          }

        }

      },

      _cornerActivated: function (p) {

        var data = this.data().f,
          width = this.width(),
          height = this.height(),
          point = { x: p.x, y: p.y, corner: '' },
          csz = data.opts.cornerSize * 1.5;

        if (point.x <= 0 || point.y <= 0 || point.x >= width || point.y >= height) {
          this.tlog(' _cornerActivated 外围区域')
          return false;
        }


        var allowedCorners = flipMethods._cAllowed.call(this);

        switch (data.effect) {
          case 'hard':

            if (point.x > width - csz)
              point.corner = 'r';
            else if (point.x < csz)
              point.corner = 'l';
            else
              return false;

            break;

          case 'sheet':
            // TODO: 这里需要模仿hard机制，折角区域算法需要优化，目前的算法仅对于4折角有用，6折角是不支持的。

            //   if (point.y </*csz*/ height / 2)
            //   point.corner += 't';
            // else if (point.y >=/*height-csz*/ height / 2)
            //   point.corner += 'b';
            // else
            //   return false;

            if (point.y < csz)
              point.corner += 't';
            else if (point.y >= height - csz)
              point.corner += 'b';
            else {
              if (point.x < width / 2) {
                // this.tlog(" _cornerActivated 内部区域 l")
              }
              else if (point.x >= width / 2) {
                // this.tlog(" _cornerActivated 内部区域 r")
              }

              return false;
            }

            if (point.x <= csz)
              point.corner += 'l';
            else if (point.x >= width - csz)
              point.corner += 'r';
            else {
              // this.tlog(" _cornerActivated 内部区域")
              return false;
            }



            break;
        }


        if (!point.corner || $.inArray(point.corner, allowedCorners) == -1) {
          return false;
        } else {
          return point;
        }

        return (!point.corner || $.inArray(point.corner, allowedCorners) == -1) ?
          false : point;

        // return (!point.corner || $.inArray(point.corner, allowedCorners) == -1) ?
        //   false : point;

      },

      _isIArea: function (e) {

        var pos = this.data().f.parent.offset();


        e = (isTouch && e.originalEvent) ? e.originalEvent.touches[0] : e;

        return flipMethods._cornerActivated.call(this,
          {
            x: e.pageX - pos.left,
            y: e.pageY - pos.top
          });

      },

      _c: function (corner, opts) {

        opts = opts || 0;

        switch (corner) {
          case 'tl':
            return point2D(opts, opts);
          case 'tr':
            return point2D(this.width() - opts, opts);
          case 'bl':
            return point2D(opts, this.height() - opts);
          case 'br':
            return point2D(this.width() - opts, this.height() - opts);
          case 'l':
            return point2D(opts, 0);
          case 'r':
            return point2D(this.width() - opts, 0);
        }

      },

      _c2: function (corner) {

        switch (corner) {
          case 'tl':
            return point2D(this.width() * 2, 0);
          case 'tr':
            return point2D(-this.width(), 0);
          case 'bl':
            return point2D(this.width() * 2, this.height());
          case 'br':
            return point2D(-this.width(), this.height());
          case 'l':
            return point2D(this.width() * 2, 0);
          case 'r':
            return point2D(-this.width(), 0);
        }

      },

      _foldingPage: function () {

        var data = this.data().f;

        if (!data)
          return;

        var opts = data.opts;

        if (opts.turn) {
          data = opts.turn.data();
          if (data.display == 'single')
            return (opts.next > 1 || opts.page > 1) ? data.pageObjs[0] : null;
          else
            return data.pageObjs[opts.next];
        }

      },

      _backGradient: function () {

        var data = this.data().f,
          turnData = data.opts.turn.data(),
          gradient = turnData.opts.gradients && (turnData.display == 'single' ||
            (data.opts.page != 2 && data.opts.page != turnData.totalPages - 1));

        if (gradient && !data.bshadow)
          data.bshadow = $('<div/>', divAtt(0, 0, 1)).
            css({ 'position': '', width: this.width(), height: this.height() }).
            appendTo(data.parent);

        return gradient;

      },

      type: function () {

        return this.data().f.effect;

      },

      resize: function (full) {

        var data = this.data().f,
          turnData = data.opts.turn.data(),
          width = this.width(),
          height = this.height();

        switch (data.effect) {
          case 'hard':

            if (full) {
              data.wrapper.css({ width: width, height: height });
              data.fpage.css({ width: width, height: height });
              if (turnData.opts.gradients) {
                data.ashadow.css({ width: width, height: height });
                data.bshadow.css({ width: width, height: height });
              }
            }

            break;
          case 'sheet':

            if (full) {
              var size = Math.round(Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2)));

              data.wrapper.css({ width: size, height: size });
              data.fwrapper.css({ width: size, height: size }).
                children(':first-child').
                css({ width: width, height: height });


              if (turnData.opts.debugShowReferenceLine) {
                data.fpage.css({ width: width, height: height, border: '1px solid red' });
              } else {
                data.fpage.css({ width: width, height: height });
              }

              if (turnData.opts.gradients)
                data.ashadow.css({ width: width, height: height });

              if (flipMethods._backGradient.call(this))
                data.bshadow.css({ width: width, height: height });
            }

            if (data.parent.is(':visible')) {
              var offset = findPos(data.parent[0]);

              if (turnData.opts.debugShowReferenceLine) {
                data.fwrapper.css({
                  top: offset.top,
                  left: offset.left,
                  overflow: "visible",
                  borderTop: '1px solid black',
                  borderRight: '1px solid pink',
                  borderBottom: '1px solid blue',
                  borderLeft: '1px solid green'
                });
              } else {
                data.fwrapper.css({
                  top: offset.top,
                  left: offset.left,
                });
              }



              //if (data.opts.turn) {
              offset = findPos(data.opts.turn[0]);
              data.fparent.css({ top: -offset.top, left: -offset.left });
              //}
            }

            this.flip('z', data.opts['z-index']);

            break;
        }

      },

      // Prepares the page by adding a general wrapper and another objects

      _addPageWrapper: function () {

        var att,
          data = this.data().f,
          turnData = data.opts.turn.data(),
          parent = this.parent();

        data.parent = parent;

        if (!data.wrapper)
          switch (data.effect) {
            case 'hard':

              var cssProperties = {};
              cssProperties[vendor + 'transform-style'] = 'preserve-3d';
              cssProperties[vendor + 'backface-visibility'] = 'hidden';

              data.wrapper = $('<div/>', divAtt(0, 0, 2)).
                css(cssProperties).
                appendTo(parent).
                prepend(this);

              data.fpage = $('<div/>', divAtt(0, 0, 1)).
                css(cssProperties).
                appendTo(parent);

              if (turnData.opts.gradients) {
                data.ashadow = $('<div/>', divAtt(0, 0, 0)).
                  hide().
                  appendTo(parent);

                data.bshadow = $('<div/>', divAtt(0, 0, 0));
              }

              break;
            case 'sheet':

              var width = this.width(),
                height = this.height(),
                size = Math.round(Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2)));

              data.fparent = data.opts.turn.data().fparent;

              if (!data.fparent) {
                var fparent = $('<div/>', { css: { 'pointer-events': 'none' } }).hide();
                fparent.data().flips = 0;
                fparent.css(divAtt(0, 0, 'auto', 'visible').css).
                  appendTo(data.opts.turn);

                data.opts.turn.data().fparent = fparent;
                data.fparent = fparent;
              }

              this.css({ position: 'absolute', top: 0, left: 0, bottom: 'auto', right: 'auto' });

              data.wrapper = $('<div/>', divAtt(0, 0, this.css('z-index'))).
                appendTo(parent).
                prepend(this);

              data.fwrapper = $('<div/>', divAtt(parent.offset().top, parent.offset().left)).
                hide().
                appendTo(data.fparent);

              data.fpage = $('<div/>', divAtt(0, 0, 0, 'visible')).
                css({ cursor: 'default' }).
                appendTo(data.fwrapper);

              if (turnData.opts.gradients)
                data.ashadow = $('<div/>', divAtt(0, 0, 1)).
                  appendTo(data.fpage);

              flipMethods.setData.call(this, data);

              break;
          }

        // Set size
        flipMethods.resize.call(this, true);

      },

      // Takes a 2P point from the screen and applies the transformation

      _fold: function (point) {

        var data = this.data().f,
          turnData = data.opts.turn.data(),
          o = flipMethods._c.call(this, point.corner),

          width = this.width(),
          height = this.height(),
          isHorizontal = turnData.opts.isHorizontal;

        /**
         * 横屏处理：o折角原点要逆时针翻转
         */
        if (isHorizontal) {
          if (point.corner == 'br') {

            // 横屏下：br->tr
            o = point2D(height, 0)
          }

          if (point.corner == 'bl') {

            // 横屏下：bl->br
            o = point2D(height, width);
          }

        }



        switch (data.effect) {

          case 'hard':

            if (point.corner == 'l')
              point.x = Math.min(Math.max(point.x, 0), width * 2);
            else
              point.x = Math.max(Math.min(point.x, width), -width);

            var leftPos,
              shadow,
              gradientX,
              fpageOrigin,
              parentOrigin,
              totalPages = turnData.totalPages,
              zIndex = data.opts['z-index'] || totalPages,
              parentCss = { 'overflow': 'visible' },
              relX = (o.x) ? (o.x - point.x) / width : point.x / width,
              angle = relX * 90,
              half = angle < 90;

            switch (point.corner) {
              case 'l':

                fpageOrigin = '0% 50%';
                parentOrigin = '100% 50%';

                if (half) {
                  leftPos = 0;
                  shadow = data.opts.next - 1 > 0;
                  gradientX = 1;
                } else {
                  leftPos = '100%';
                  shadow = data.opts.page + 1 < totalPages;
                  gradientX = 0;
                }

                break;
              case 'r':

                fpageOrigin = '100% 50%';
                parentOrigin = '0% 50%';
                angle = -angle;
                width = -width;

                if (half) {
                  leftPos = 0;
                  shadow = data.opts.next + 1 < totalPages;
                  gradientX = 0;
                } else {
                  leftPos = '-100%';
                  shadow = data.opts.page != 1;
                  gradientX = 1;
                }

                break;
            }

            parentCss[vendor + 'perspective-origin'] = parentOrigin;

            data.wrapper.transform('rotateY(' + angle + 'deg)' +
              'translate3d(0px, 0px, ' + (this.attr('depth') || 0) + 'px)', parentOrigin);

            data.fpage.transform('translateX(' + width + 'px) rotateY(' + (180 + angle) + 'deg)', fpageOrigin);

            data.parent.css(parentCss);

            if (half) {
              relX = -relX + 1;
              data.wrapper.css({ zIndex: zIndex + 1 });
              data.fpage.css({ zIndex: zIndex });
            } else {
              relX = relX - 1;
              data.wrapper.css({ zIndex: zIndex });
              data.fpage.css({ zIndex: zIndex + 1 });
            }

            if (turnData.opts.gradients) {
              if (shadow)
                data.ashadow.css({
                  display: '',
                  left: leftPos,
                  backgroundColor: 'rgba(0,0,0,' + (0.5 * relX) + ')'
                }).
                  transform('rotateY(0deg)');
              else
                data.ashadow.hide();

              data.bshadow.css({ opacity: -relX + 1 });

              if (half) {
                if (data.bshadow.parent()[0] != data.wrapper[0]) {
                  data.bshadow.appendTo(data.wrapper);
                }
              } else {
                if (data.bshadow.parent()[0] != data.fpage[0]) {
                  data.bshadow.appendTo(data.fpage);
                }
              }
              /*data.bshadow.css({
                backgroundColor: 'rgba(0,0,0,'+(0.1)+')'
              })*/
              gradient(data.bshadow, point2D(gradientX * 100, 0), point2D((-gradientX + 1) * 100, 0),
                [[0, 'rgba(0,0,0,0.3)'], [1, 'rgba(0,0,0,0)']], 2);

            }

            break;
          case 'sheet':

            var that = this,
              a = 0,
              alpha = 0,
              beta,
              px,
              gradientEndPointA,
              gradientEndPointB,
              gradientStartVal,
              gradientSize,
              gradientOpacity,
              shadowVal,
              mv = point2D(0, 0),
              df = point2D(0, 0),
              tr = point2D(0, 0),
              folding = flipMethods._foldingPage.call(this),
              tan = Math.tan(alpha),
              ac = turnData.opts.acceleration,
              h = data.wrapper.height(),
              top = point.corner.substr(0, 1) == 't',
              left = point.corner.substr(1, 1) == 'l',

              compute = function () {

                var rel = point2D(0, 0);
                var middle = point2D(0, 0);



                /**
                 * 横屏处理，rel的计算：
                 */
                if (isHorizontal) {
                  if (point.corner == 'br') {
                    rel.x = (o.x) ? o.x - point.y : point.y;
                    if (!hasRot) {
                      rel.y = 0;
                    } else {
                      rel.y = (o.y) ? o.y - (width - point.x) : (width - point.x);
                    }
                  }

                  if (point.corner == 'bl') {
                    rel.x = (o.x) ? o.x - point.y : point.y;
                    if (!hasRot) {
                      rel.y = 0;
                    } else {
                      rel.y = point.x;
                    }
                  }

                } else {

                  rel.x = (o.x) ? o.x - point.x : point.x;

                  if (!hasRot) {
                    rel.y = 0;
                  } else {
                    rel.y = (o.y) ? o.y - point.y : point.y;
                  }

                }

                if (isHorizontal) {
                  if (point.corner == 'br') {
                    middle.x = (left) ? height - rel.x / 2 : point.y + rel.x / 2;
                  }

                  if (point.corner == 'bl') {
                    middle.x = point.y + rel.x / 2;
                  }

                } else {
                  middle.x = (left) ? width - rel.x / 2 : point.x + rel.x / 2;

                }

                middle.y = rel.y / 2;


                var alpha = A90 - Math.atan2(rel.y, rel.x),
                  gamma = alpha - Math.atan2(middle.y, middle.x),
                  distance = Math.max(0, Math.sin(gamma) * Math.sqrt(Math.pow(middle.x, 2) + Math.pow(middle.y, 2)));

                a = deg(alpha);

                tr = point2D(distance * Math.sin(alpha), distance * Math.cos(alpha));


                /**
                 * 横屏处理：>90度时，height -> width  top->left left->top
                 */
                if (isHorizontal) {

                  if (point.corner == 'br') {

                    if (alpha > A90) {
                      tr.x = tr.x + Math.abs(tr.y * rel.y / rel.x);
                      tr.y = 0;

                      // height -> width
                      if (Math.round(tr.x * Math.tan(PI - alpha)) < width) {

                        // height -> width
                        point.x = Math.sqrt(Math.pow(width, 2) + 2 * middle.x * rel.x);
                        if (top) point.x = width - point.x;
                        return compute();


                      }
                    }

                    if (alpha > A90) {

                      // h=w ，warpper 是正方形
                      // height -> width
                      var beta = PI - alpha, dd = h - width / Math.sin(beta);
                      mv = point2D(Math.round(dd * Math.cos(beta)), Math.round(dd * Math.sin(beta)));
                      if (left) mv.x = - mv.x;
                      if (top) mv.y = - mv.y;
                    }

                  }

                  if (point.corner == 'bl') {


                    if (alpha > A90) {
                      tr.x = tr.x + Math.abs(tr.y * rel.y / rel.x);
                      tr.y = 0;

                      // height -> width
                      if (Math.round(tr.x * Math.tan(PI - alpha)) < width) {

                        // height -> width
                        // top->left
                        // left->top
                        point.x = Math.sqrt(Math.pow(width, 2) + 2 * middle.x * rel.x);
                        if (left) point.x = width - point.x;
                        return compute();


                      }
                    }

                    if (alpha > A90) {

                      // h=w ，warpper 是正方形
                      // height -> width
                      var beta = PI - alpha, dd = h - width / Math.sin(beta);
                      mv = point2D(Math.round(dd * Math.cos(beta)), Math.round(dd * Math.sin(beta)));
                      if (top) mv.x = - mv.x;
                      if (left) mv.y = - mv.y;
                    }


                  }


                } else {

                  if (alpha > A90) {
                    tr.x = tr.x + Math.abs(tr.y * rel.y / rel.x);
                    tr.y = 0;
                    if (Math.round(tr.x * Math.tan(PI - alpha)) < height) {
                      point.y = Math.sqrt(Math.pow(height, 2) + 2 * middle.x * rel.x);
                      if (top) point.y = height - point.y;
                      return compute();
                    }
                  }

                  if (alpha > A90) {
                    var beta = PI - alpha, dd = h - height / Math.sin(beta);
                    mv = point2D(Math.round(dd * Math.cos(beta)), Math.round(dd * Math.sin(beta)));
                    if (left) mv.x = - mv.x;
                    if (top) mv.y = - mv.y;
                  }



                }




                px = Math.round(tr.y / Math.tan(alpha) + tr.x);

                var side = width - px,
                  sideX = side * Math.cos(alpha * 2),
                  sideY = side * Math.sin(alpha * 2);
                df = point2D(
                  Math.round((left ? side - sideX : px + sideX)),
                  Math.round((top) ? sideY : height - sideY));



                /**
                 * 横屏处理：df计算，width与height对换，然后left 或者 top 遍历一下可以得到最终值
                 */

                if (isHorizontal) {
                  if (point.corner == 'br') {

                    side = height - px;
                    sideX = side * Math.cos(alpha * 2);
                    sideY = side * Math.sin(alpha * 2);
                    df = point2D(
                      Math.round(px + sideX),
                      Math.round(width - sideY));

                  }

                  if (point.corner == 'bl') {

                    side = height - px;
                    sideX = side * Math.cos(alpha * 2);
                    sideY = side * Math.sin(alpha * 2);
                    df = point2D(
                      Math.round(px + sideX),
                      Math.round(sideY));

                  }
                }



                // Gradients
                if (turnData.opts.gradients) {

                  gradientSize = side * Math.sin(alpha);



                  var endingPoint = flipMethods._c2.call(that, point.corner),
                    far = Math.sqrt(Math.pow(endingPoint.x - point.x, 2) + Math.pow(endingPoint.y - point.y, 2)) / width;

                  shadowVal = Math.sin(A90 * ((far > 1) ? 2 - far : far));

                  gradientOpacity = Math.min(far, 1);


                  gradientStartVal = gradientSize > 100 ? (gradientSize - 100) / gradientSize : 0;

                  if (isHorizontal) {
                    if (point.corner == 'br') {
                      gradientEndPointA = point2D(
                        gradientSize * Math.sin(alpha) / height * 100,
                        gradientSize * Math.cos(alpha) / width * 100);

                    }

                    if (point.corner == 'bl') {
                      gradientEndPointA = point2D(
                        gradientSize * Math.sin(alpha) / height * 100,
                        gradientSize * Math.cos(alpha) / width * 100);

                    }
                  } else {

                    gradientEndPointA = point2D(
                      gradientSize * Math.sin(alpha) / width * 100,
                      gradientSize * Math.cos(alpha) / height * 100);

                  }


                  if (flipMethods._backGradient.call(that)) {


                    if (isHorizontal) {
                      if (point.corner == 'br') {

                        gradientEndPointB = point2D(
                          gradientSize * 1.2 * Math.sin(alpha) / height * 100,
                          gradientSize * 1.2 * Math.cos(alpha) / width * 100);

                        gradientEndPointB.x = 100 - gradientEndPointB.x;
                        gradientEndPointB.y = 100 - gradientEndPointB.y;

                      }

                      if (point.corner == 'bl') {

                        gradientEndPointB = point2D(
                          gradientSize * 1.2 * Math.sin(alpha) / height * 100,
                          gradientSize * 1.2 * Math.cos(alpha) / width * 100);

                        gradientEndPointB.x = 100 - gradientEndPointB.x;

                      }
                    } else {


                      gradientEndPointB = point2D(
                        gradientSize * 1.2 * Math.sin(alpha) / width * 100,
                        gradientSize * 1.2 * Math.cos(alpha) / height * 100);

                      if (!left) gradientEndPointB.x = 100 - gradientEndPointB.x;
                      if (!top) gradientEndPointB.y = 100 - gradientEndPointB.y;


                    }



                  }

                }

                tr.x = Math.round(tr.x);
                tr.y = Math.round(tr.y);

                /**
                 * 横屏处理，源tr计算用于目标tr:
                 */
                if (isHorizontal) {
                  if (point.corner == 'br') {
                    tr = point2D(tr.y, tr.x);
                    df = point2D(df.y, df.x);
                    mv = point2D(mv.y, mv.x);
                  }

                  if (point.corner == 'bl') {
                    tr = point2D(tr.y, tr.x);
                    df = point2D(df.y, df.x);
                    mv = point2D(mv.y, mv.x);
                  }
                }

                return true;
              },

              transform = function (tr, c, x, a) {

                var f = ['0', 'auto'], mvW = (width - h) * x[0] / 100, mvH = (height - h) * x[1] / 100,
                  cssA = { left: f[c[0]], top: f[c[1]], right: f[c[2]], bottom: f[c[3]] },
                  cssB = {},
                  aliasingFk = (a != 90 && a != -90) ? (left ? -1 : 1) : 0,
                  origin = x[0] + '% ' + x[1] + '%';

                that.css(cssA).
                  transform(rotate(a) + translate(tr.x + aliasingFk, tr.y, ac), origin);

                if (isHorizontal) {
                  /**
                   * 横屏处理下，背景图是颠倒的，需要颠倒处理
                   */
                  data.ashadow.next().css(cssA).transform(
                    rotate(180), '50% 50%'
                  );

                }

                data.fpage.css(cssA).transform(
                  rotate(a) +
                  translate(tr.x + df.x - mv.x - width * x[0] / 100, tr.y + df.y - mv.y - height * x[1] / 100, ac) +
                  rotate((180 / a - 2) * a),
                  origin);

                data.wrapper.transform(translate(-tr.x + mvW - aliasingFk, -tr.y + mvH, ac) + rotate(-a), origin);


                data.fwrapper.transform(translate(-tr.x + mv.x + mvW, -tr.y + mv.y + mvH, ac) + rotate(-a), origin);

                if (turnData.opts.gradients) {

                  if (isHorizontal) {
                    if (x[0])
                      gradientEndPointA.y = 100 - gradientEndPointA.y;

                    if (x[1])
                      gradientEndPointA.x = (100 - gradientEndPointA.x);
                  } else {
                    if (x[0])
                      gradientEndPointA.x = 100 - gradientEndPointA.x;

                    if (x[1])
                      gradientEndPointA.y = (100 - gradientEndPointA.y);
                  }



                  /**
                   * 
                   * 这里调整折角边角的阴影值，目前看起来太黑，不真实
                   * 
                   * 这里将废弃掉，请采用 .sj-book .page 来调整阴影值
                   * 
                   */

                  // cssB['box-shadow'] = '0 0 20px rgba(0,0,0,' + (0.5 * shadowVal) + ')';
                  // folding.css(cssB);

                  if (isHorizontal) {

                    if (point.corner == 'br') {

                      //这里调整折角背面的阴影值
                      gradient(data.ashadow,
                        point2D(left ? 0 : 100, top ? 100 : 0),
                        point2D(gradientEndPointA.y, gradientEndPointA.x),
                        [[gradientStartVal, 'rgba(0,0,0,0)'],
                        [((1 - gradientStartVal) * 0.8) + gradientStartVal, 'rgba(0,0,0,' + (0.13 * gradientOpacity) + ')'],
                        [1, 'rgba(255,255,255,' + (0.2 * gradientOpacity) + ')']],
                        3,
                        alpha);

                      if (flipMethods._backGradient.call(that))
                        // 这里调整折角落在B面的阴影
                        gradient(data.bshadow,
                          point2D(left ? 0 : 100, top ? 0 : 100),
                          point2D(gradientEndPointB.y, gradientEndPointB.x),
                          [[0.4, 'rgba(0,0,0,0)'],
                          [0.8, 'rgba(0,0,0,' + (0.2 * gradientOpacity) + ')'],
                          [1, 'rgba(0,0,0,0)']
                          ],
                          3);


                    }

                    if (point.corner == 'bl') {

                      //这里调整折角背面的阴影值
                      gradient(data.ashadow,
                        point2D(0, 0),
                        point2D(gradientEndPointA.y, gradientEndPointA.x),
                        [[gradientStartVal, 'rgba(0,0,0,0)'],
                        [((1 - gradientStartVal) * 0.8) + gradientStartVal, 'rgba(0,0,0,' + (0.13 * gradientOpacity) + ')'],
                        [1, 'rgba(255,255,255,' + (0.2 * gradientOpacity) + ')']],
                        3,
                        alpha);

                      if (flipMethods._backGradient.call(that))
                        // 这里调整折角落在B面的阴影
                        gradient(data.bshadow,
                          point2D(0, 100),
                          point2D(gradientEndPointB.y, gradientEndPointB.x),
                          [[0.4, 'rgba(0,0,0,0)'],
                          [0.8, 'rgba(0,0,0,' + (0.2 * gradientOpacity) + ')'],
                          [1, 'rgba(0,0,0,0)']
                          ],
                          3);


                    }


                  } else {

                    //这里调整折角背面的阴影值
                    gradient(data.ashadow,
                      point2D(left ? 100 : 0, top ? 0 : 100),
                      point2D(gradientEndPointA.x, gradientEndPointA.y),
                      [[gradientStartVal, 'rgba(0,0,0,0)'],
                      [((1 - gradientStartVal) * 0.8) + gradientStartVal, 'rgba(0,0,0,' + (0.13 * gradientOpacity) + ')'],
                      [1, 'rgba(255,255,255,' + (0.2 * gradientOpacity) + ')']],
                      3,
                      alpha);

                    if (flipMethods._backGradient.call(that))
                      // 这里调整折角落在B面的阴影
                      gradient(data.bshadow,
                        point2D(left ? 0 : 100, top ? 0 : 100),
                        point2D(gradientEndPointB.x, gradientEndPointB.y),
                        [[0.4, 'rgba(0,0,0,0)'],
                        [0.8, 'rgba(0,0,0,' + (0.2 * gradientOpacity) + ')'],
                        [1, 'rgba(0,0,0,0)']
                        ],
                        3);
                  }


                }

              };

            switch (point.corner) {
              case 'l':


                break;
              case 'r':


                break;
              case 'tl':
                point.x = Math.max(point.x, 1);
                compute();
                transform(tr, [1, 0, 0, 1], [100, 0], a);
                break;
              case 'tr':
                point.x = Math.min(point.x, width - 1);
                compute();
                transform(point2D(-tr.x, tr.y), [0, 0, 0, 1], [0, 0], -a);
                break;
              case 'bl':

                /**
                 * 横屏处理，transform传参处理：
                 */
                if (isHorizontal) {

                  point.y = Math.min(point.y, height - 1);
                  compute();
                  transform(point2D(tr.x, -tr.y), [0, 0, 1, 1], [0, 0], a);

                } else {

                  point.x = Math.max(point.x, 1);
                  compute();
                  transform(point2D(tr.x, -tr.y), [1, 1, 0, 0], [100, 100], -a);

                }
                break;
              case 'br':

                /**
                 * 横屏处理，transform传参处理：
                 */
                if (isHorizontal) {
                  point.y = Math.min(point.y, height - 1);
                  compute();
                  transform(point2D(-tr.x, -tr.y), [1, 0, 0, 1], [100, 0], -a);
                } else {

                  point.x = Math.min(point.x, width - 1);
                  compute();
                  transform(point2D(-tr.x, -tr.y), [0, 1, 1, 0], [0, 100], a);
                }

                break;
            }

            break;
        }

        data.point = point;

      },

      _moveFoldingPage: function (move) {

        var data = this.data().f;

        if (!data)
          return;

        var turn = data.opts.turn,
          turnData = turn.data(),
          place = turnData.pagePlace;

        if (move) {

          var nextPage = data.opts.next;

          if (place[nextPage] != data.opts.page) {

            if (data.folding)
              flipMethods._moveFoldingPage.call(this, false);

            var folding = flipMethods._foldingPage.call(this);

            folding.appendTo(data.fpage);
            place[nextPage] = data.opts.page;
            data.folding = nextPage;
          }

          turn.turn('update');

        } else {

          if (data.folding) {

            if (turnData.pages[data.folding]) {

              // If we have flip available

              var flipData = turnData.pages[data.folding].data().f;

              turnData.pageObjs[data.folding].
                appendTo(flipData.wrapper);

            } else if (turnData.pageWrap[data.folding]) {

              // If we have the pageWrapper

              turnData.pageObjs[data.folding].
                appendTo(turnData.pageWrap[data.folding]);

            }

            if (data.folding in place) {
              place[data.folding] = data.folding;
            }

            delete data.folding;

          }
        }
      },

      _showFoldedPage: function (c, animate) {

        var folding = flipMethods._foldingPage.call(this),
          dd = this.data(),
          data = dd.f,
          visible = data.visible;
        var turnData = data.opts.turn.data();

        if (folding) {




          if (!visible || !data.point || data.point.corner != c.corner) {

            var corner = (
              data.status == 'hover' ||
              data.status == 'peel' ||
              data.opts.turn.data().mouseAction) ?
              c.corner : null;

            visible = false;

            if (trigger('start', this, [data.opts, corner]) == 'prevented')
              return false;

          }

          if (animate) {

            var that = this,
              point = (data.point && data.point.corner == c.corner) ?
                data.point : flipMethods._c.call(this, c.corner, 1);



            this.animatef({
              from: [point.x, point.y],
              to: [c.x, c.y],
              duration: 500,
              frame: function (v) {
                c.x = Math.round(v[0]);
                c.y = Math.round(v[1]);
                flipMethods._fold.call(that, c);
              }
            });

          } else {

            flipMethods._fold.call(this, c);

            if (dd.effect && !dd.effect.turning)
              this.animatef(false);

          }

          if (!visible) {

            switch (data.effect) {
              case 'hard':

                data.visible = true;
                flipMethods._moveFoldingPage.call(this, true);
                data.fpage.show();
                if (data.opts.shadows)
                  data.bshadow.show();

                break;
              case 'sheet':

                data.visible = true;
                data.fparent.show().data().flips++;
                flipMethods._moveFoldingPage.call(this, true);
                data.fwrapper.show();
                if (data.bshadow)
                  data.bshadow.show();

                break;
            }

          }

          return true;

        }

        return false;
      },

      hide: function () {

        var data = this.data().f,
          turnData = data.opts.turn.data(),
          folding = flipMethods._foldingPage.call(this);

        switch (data.effect) {
          case 'hard':

            if (turnData.opts.gradients) {
              data.bshadowLoc = 0;
              data.bshadow.remove();
              data.ashadow.hide();
            }

            data.wrapper.transform('');
            data.fpage.hide();

            break;
          case 'sheet':

            if ((--data.fparent.data().flips) === 0)
              data.fparent.hide();

            this.css({ left: 0, top: 0, right: 'auto', bottom: 'auto' }).
              transform('');

            data.wrapper.transform('');

            data.fwrapper.hide();

            if (data.bshadow)
              data.bshadow.hide();

            folding.transform('');

            break;
        }

        data.visible = false;

        return this;
      },

      hideFoldedPage: function (animate) {

        var data = this.data().f;

        var direction = data.corner ? data.corner.direction : null;

        if (!data.point) return;

        var that = this,
          p1 = data.point,
          hide = function () {
            data.point = null;
            data.status = '';
            that.flip('hide');
            if (direction == 'right' && data.backturned) {
              data.backturned = false;
              that.trigger('realTurned')
            }

            that.trigger('end', [data.opts, false]);
          };

        if (animate) {

          var p4 = flipMethods._c.call(this, p1.corner),
            top = (p1.corner.substr(0, 1) == 't'),
            delta = (top) ? Math.min(0, p1.y - p4.y) / 2 : Math.max(0, p1.y - p4.y) / 2,
            p2 = point2D(p1.x, p1.y + delta),
            p3 = point2D(p4.x, p4.y - delta);

          this.animatef({
            from: 0,
            to: 1,
            frame: function (v) {
              var np = bezier(p1, p2, p3, p4, v);
              p1.x = np.x;
              p1.y = np.y;
              flipMethods._fold.call(that, p1);
            },
            complete: hide,
            duration: 800,
            hiding: true
          });

        } else {

          this.animatef(false);
          hide();

        }
      },


      /**
       * 新添加的回翻机制
       * 
       * 处理方式是通过模拟回翻后的状态（即执行一次_turnPage ），再执行一次 _showFoldedPage ,
       * 
       * 还不够，还需要给一个信号，让它释放，即人为触发 _eventEnd 。
       * 
       * 整个处理方式
       * 
       */

      turnPrevious: function (previousPage) {

        var data = this.data().f,
          turn = data.opts.turn,
          turnData = data.opts.turn.data(),
          isHorizontal = turnData.opts.isHorizontal,
          width = this.width(),
          height = this.height();



        if (previousPage > 0) {
          var _corner = {};
          var thet = Math.PI * 2 / 5;

          if (isHorizontal) {
            var calc_width = height;
            var calc_height = width;
          } else {
            var calc_width = width;
            var calc_height = height;
          }

          var _point = calcPoint(calc_width / 4, calc_height / 2, thet * 180 / Math.PI, calc_width, calc_height);

          var returnPoint = _point;

          if (isHorizontal) {
            returnPoint = {
              x: width - _point.y,
              y: _point.x
            }
            if (_point.corner == 'tr') returnPoint.corner = 'br';
            if (_point.corner == 'br') returnPoint.corner = 'bl';
          }

          _corner.x = returnPoint.x;
          _corner.y = returnPoint.y;
          _corner.corner = returnPoint.corner;
          _corner.realpoint = true;
          _corner.canEffect = true;
          _corner.direction = 'right';
          _corner.centerCirclePoint = true;
          _corner.auto = true;

          turnMethods._turnPage.call(turn, previousPage, true);
          turnData.pages[previousPage].data().f.corner = _corner;

          // 有些值需要重新赋值
          turnData.pages[previousPage].data().f.time = (new Date()).getTime();
          turnData.pages[previousPage].data().f.backturned = true;

          flipMethods._showFoldedPage.call(turnData.pages[previousPage], turnData.pages[previousPage].data().f.corner);
          flipMethods._eventEnd.apply(turnData.pages[previousPage]);
        }


      },


      // 翻页释放之后的动画
      turnPage: function (corner) {

        var that = this,
          data = this.data().f,
          turnData = data.opts.turn.data(),
          isHorizontal = turnData.opts.isHorizontal,
          corner = {
            corner: (data.corner) ?
              data.corner.corner :
              corner || flipMethods._cAllowed.call(this)[0]
          };

        var direction = data.corner ? data.corner.direction : null;

        var p1 = data.point ||
          flipMethods._c.call(this,
            corner.corner,
            (data.opts.turn) ? turnData.opts.elevation : 0),
          p4 = flipMethods._c2.call(this, corner.corner);

        if (isHorizontal) {
          if (corner.corner == 'bl') {
            p4 = point2D(0, - this.height());
          }
          if (corner.corner == 'br') {
            p4 = point2D(this.width(), -this.height());
          }
        }

        this.trigger('flip').
          animatef({
            from: 0,
            to: 1,
            frame: function (v) {

              var np = bezier(p1, p1, p4, p4, v);
              corner.x = np.x;
              corner.y = np.y;
              flipMethods._showFoldedPage.call(that, corner);

            },
            complete: function () {

              if (!direction) {
                that.trigger('realTurned')
              }
              that.trigger('end', [data.opts, true]);

            },
            duration: turnData.opts.duration,
            turning: true
          });

        data.corner = null;
      },

      moving: function () {

        return 'effect' in this.data();

      },

      isTurning: function () {

        return this.flip('moving') && this.data().effect.turning;

      },

      corner: function () {

        return this.data().f.corner;

      },

      isDoublefingerEvents: function (e) {
        if (isTouch && e.originalEvent.touches.length > 1) {
          //双指
          return true;
        } else {
          return false;
        }
      },

      _eventStart: function (e) {


        var data = this.data().f,
          turn = data.opts.turn,

          turnData = turn.data(),
          isHorizontal = turnData.opts.isHorizontal;


        /**
         * 
         * !data.corner:说明单页尚未激活折角状态
         * 
         * !data.disabled:说明单页是激活状态
         * 
         * !this.flip('isTurning'):说明单页并没有effect或者，有effect 但是没有turning状态	
         * 
         * data.opts.page == turn.data().pagePlace[data.opts.page]://说明这页是真实存在的
         * 
         */

        if (!data.corner && !data.disabled && !this.flip('isTurning') &&
          data.opts.page == turn.data().pagePlace[data.opts.page]) {

          this.tlog('one page had listen event flipMethods._eventStart');

          data.corner = flipMethods._isIArea.call(this, e);

          if (data.corner && flipMethods._foldingPage.call(this)) {

            this.trigger('pressed', [data.point]);
            flipMethods._showFoldedPage.call(this, data.corner);

            return false;

          } else
            data.corner = null;

        }

        //add by Wangwenwei 20220422：set drag_flag;
        if (!data.corner && !data.disabled &&
          data.opts.page == turn.data().pagePlace[data.opts.page]) {
          e = (isTouch && e.originalEvent) ? e.originalEvent.touches[0] : e;
          var pos = this.data().f.parent.offset();
          var width = this.width();
          var point = {
            x: e.pageX - pos.left,
            y: e.pageY - pos.top
          }
          var c = 'l';

          var inoutArea = flipMethods._checkInOutArea.call(this, point);

          if (inoutArea == 'in') {
            c = 'l';
            this.tlog(" 拖动翻页区域")

            //与拖动翻页不同，这个要求单页不能处于effect或者，有effect 但是处于turning状态，否则就会出现翻页太快，回闪问题
            if (!this.flip('isTurning')) {

              data.corner = flipMethods._getTransversCorner.call(this, e, true);

              if (data.corner && flipMethods._foldingPage.call(this)) {

                // 回翻状态准备:给当前做记录corner,但是加一个标志，代表是回翻，告诉等下的move事件，记得不要用当前页的corner去做showFold
                data.corner.previous = true;
                this.trigger('pressed', [data.point]);
                return false;

              } else
                data.corner = null;

            }

          }
          else if (inoutArea == 'out') {
            c = 'r';
            this.tlog(" 内部横向拖动区域 ")

            //与拖动翻页不同，这个要求单页不能处于effect或者，有effect 但是处于turning状态，否则就会出现翻页太快，回闪问题
            if (!this.flip('isTurning')) {

              data.corner = flipMethods._getTransversCorner.call(this, e);

              if (data.corner && flipMethods._foldingPage.call(this)) {

                this.trigger('pressed', [data.point]);
                // flipMethods._showFoldedPage.call(this, data.corner);
                return false;

              } else
                data.corner = null;

            }

          }

        }
        //endadd

      },

      _eventMove: function (e) {


        var data = this.data().f,
          turn = data.opts.turn,
          turnData = data.opts.turn.data(),
          isHorizontal = turnData.opts.isHorizontal,
          e = (isTouch) ? e.originalEvent.touches : [e];
        if (!data.disabled) {

          if (data.corner) {

            /**
             * 
             * !data.disabled:说明单页是激活状态
             * 
             *  data.corner: 说明处于折角状态（折角状态有两种，一种是原生的拽角型，一种是奔跑拓展的拽边型）
             * 
             *  该条件下继续折角动画
             * 
             */

            var pos = data.parent.offset(),
              currentPoint = {},
              width = this.width(),
              height = this.height(),
              thet,
              angle = -1,
              deltaX,
              deltaY,
              point;


            if (data.corner.centerCirclePoint) {
              // 横向翻页处理 - 拽边型

              if (isHorizontal) {
                currentPoint.x = e[0].pageY - pos.top;
                currentPoint.y = width - (e[0].pageX - pos.left);
                deltaX = currentPoint.x - data.corner.startPoint.x;
                deltaY = currentPoint.y - data.corner.startPoint.y;

                var calc_width = height;
                var calc_height = width;

              } else {
                currentPoint.x = e[0].pageX - pos.left;
                currentPoint.y = e[0].pageY - pos.top;
                deltaX = currentPoint.x - data.corner.startPoint.x;
                deltaY = currentPoint.y - data.corner.startPoint.y;

                var calc_width = width;
                var calc_height = height;
              }

              if (data.corner.showFold) {
                // 如果已经是满足折角条件了，就不需要再进行复杂的条件判断了，直接上动画

                // FIXME: 采取任总说的thet算法
                thet = Math.PI / 2 - Math.atan2(data.corner.centerCirclePoint.y - currentPoint.y, data.corner.centerCirclePoint.x - currentPoint.x);

                point = calcPoint(currentPoint.x, currentPoint.y, thet * 180 / Math.PI, calc_width, calc_height);

                var returnPoint = point;

                if (isHorizontal) {
                  returnPoint = {
                    x: width - point.y,
                    y: point.x
                  }

                  if (point.corner == 'tr') returnPoint.corner = 'br';
                  if (point.corner == 'br') returnPoint.corner = 'bl';

                }


                data.corner.x = returnPoint.x;
                data.corner.y = returnPoint.y;
                data.corner.corner = returnPoint.corner;
                data.corner.realpoint = currentPoint;
                flipMethods._showFoldedPage.call(this, data.corner);

              } else {


                // 计算正切角度
                if (deltaX != 0)
                  angle = Math.atan(Math.abs(deltaY) / Math.abs(deltaX)) * 180 / Math.PI;

                // 正切角度必须小于?度
                if (angle < turnData.opts.dragAngle && angle != -1) {

                  if (deltaX > 0) {
                    // drag right

                    // 角度一旦符合，就允许快速点击翻页
                    data.corner.canEffect = true;

                    // 方向是right，做个标志
                    data.corner.direction = 'right';

                    // 回翻的情况,回翻页准备
                    var previousPage = turnData.page - 1;
                    if (previousPage > 0 && data.corner.previous) {
                      // 当前页的时间戳给到回翻页上去,否则将出错
                      turnData.pages[previousPage].data().f.time = data.time;
                    }

                    if (previousPage > 0) {
                      data.corner.previousPage = previousPage;
                    } else {
                      turn.trigger('touchFirstPage');
                      data.corner = null;
                      return;
                    }


                    // 做个记录，代表已经满足拖拽距离
                    if (Math.abs(deltaX) > turnData.opts.dragDeltaX) {
                      data.corner.touchDragDeltaX = true;
                    } else {
                      data.corner.touchDragDeltaX = false;
                    }


                    if (Math.abs(deltaX) > turnData.opts.dragDeltaX && data.corner.previous) {
                      // 满足拖拽距离 => 满足折角条件

                      // FIXME: 采取任总说的thet算法
                      thet = Math.PI / 2 - Math.atan2(data.corner.centerCirclePoint.y - currentPoint.y, data.corner.centerCirclePoint.x - currentPoint.x);

                      point = calcPoint(currentPoint.x, currentPoint.y, thet * 180 / Math.PI, calc_width, calc_height);


                      var returnPoint = point;

                      if (isHorizontal) {
                        returnPoint = {
                          x: width - point.y,
                          y: point.x
                        }

                        if (point.corner == 'tr') returnPoint.corner = 'br';
                        if (point.corner == 'br') returnPoint.corner = 'bl';

                      }


                      data.corner.x = returnPoint.x;
                      data.corner.y = returnPoint.y;
                      data.corner.corner = returnPoint.corner;
                      data.corner.realpoint = currentPoint;
                      data.corner.showFold = true;

                      /**
                      * 
                      * 执行瞬间换位算法，将本页的 corner 保存起来，执行一次翻页到上一页的动作，
                      * 
                      * 然后重新赋值刚刚保存的corner数据，触发上一页的_showFoldedPage
                      * 
                      */

                      var _corner = data.corner;
                      data.corner = null;
                      turnMethods._turnPage.call(turn, previousPage, true);

                      turnData.pages[previousPage].data().f.corner = _corner;

                      flipMethods._showFoldedPage.call(turnData.pages[previousPage], turnData.pages[previousPage].data().f.corner);

                    }


                  } else {
                    // drag left

                    // 如果是尾页，那么这里不应该再触发条件，
                    if (data.opts.page == turnData.totalPages) {
                      turn.trigger('touchLastPage');
                      data.corner = null;
                      return;
                    }

                    //角度一旦符合，且方向是left，就允许快速点击翻页
                    data.corner.canEffect = true;
                    if (Math.abs(deltaX) > turnData.opts.dragDeltaX) {
                      // 满足拖拽距离=> 满足折角条件

                      if (deltaX > 0) {
                        // drag right

                      } else {
                        // drag left

                        // FIXME: 采取任总说的thet算法
                        thet = Math.PI / 2 - Math.atan2(data.corner.centerCirclePoint.y - currentPoint.y, data.corner.centerCirclePoint.x - currentPoint.x);

                        point = calcPoint(currentPoint.x, currentPoint.y, thet * 180 / Math.PI, calc_width, calc_height);

                        var returnPoint = point;

                        if (isHorizontal) {
                          returnPoint = {
                            x: width - point.y,
                            y: point.x
                          }

                          if (point.corner == 'tr') returnPoint.corner = 'br';
                          if (point.corner == 'br') returnPoint.corner = 'bl';

                        }


                        data.corner.x = returnPoint.x;
                        data.corner.y = returnPoint.y;
                        data.corner.corner = returnPoint.corner;
                        data.corner.realpoint = currentPoint;
                        data.corner.showFold = true;
                        flipMethods._showFoldedPage.call(this, data.corner, true);
                      }
                    }

                  }


                }

              }



            } else {
              // 拽角翻页处理 - 拽角型

              /**
               * 拽角型不会出现回翻的情况，因为到时候我们会暂时把 bl tl 给禁用。（横屏模式下，是禁用 tl tr）
               */

              data.corner.x = e[0].pageX - pos.left;
              data.corner.y = e[0].pageY - pos.top;
              flipMethods._showFoldedPage.call(this, data.corner);
            }



          } else if (data.hover && !this.data().effect && this.is(':visible')) {

            var point = flipMethods._isIArea.call(this, e[0]);

            if (point) {

              /**
               * 
               * !data.disabled:说明单页是激活状态
               * 
               * !data.corner: 说处不属于折角状态
               * 
               * point：说明处于折角区域
               * 
               * 该条件下，在新的point下继续折角动画
               * 
               */

              if ((data.effect == 'sheet' && point.corner.length == 2) || data.effect == 'hard') {
                data.status = 'hover';
                var origin = flipMethods._c.call(this, point.corner, data.opts.cornerSize / 2);
                point.x = origin.x;
                point.y = origin.y;
                flipMethods._showFoldedPage.call(this, point, true);
              }

            } else {

              /**
               * 
               * !data.disabled:说明单页是激活状态
               * 
               * !data.corner: 说处不属于折角状态
               * 
               * !point：说明不处于折角区域
               * 
               * 如果之前是hover（即处于折角的hover状态），需要来一次释放折角回去的动画
               * 
               */

              if (data.status == 'hover') {
                data.status = '';
                flipMethods.hideFoldedPage.call(this, true);
              }

            }

          }

          /**
           * 
           * !data.disabled:说明单页是激活状态
           * 
           */

          //add by Wangwenwei 20220422：Record the ended point.
          let touch = e[0];
          if (data.drag_start_point) {
            data.drag_end_point = { x: touch.pageX, y: touch.pageY };
          }
          //end add

        }


      },

      _eventEnd: function (e) {

        var data = this.data().f,
          corner = data.corner;


        if (!data.disabled && corner) {

          /**
           * 
           * 这里为什么需要canEffect 要提高优先级？
           * 
           * 因为有一种情况，就是在 内部横向拖动区域 往右拖的时候，如果很快，连续拖两次，
           * 
           * 那么第二次因为第一次还存在动画的原因，有data.point ，会替换我们真正的corner,而导致翻页失败，故这里给一个高优先级的判断
           * 
           * 目前尚未发现有别的问题。
           * 
           */

          if (corner && corner.canEffect) {
            if (trigger('released', this, [corner]) != 'prevented') {
              flipMethods.hideFoldedPage.call(this, true);
            }
          } else {
            if (trigger('released', this, [data.point || corner]) != 'prevented') {
              flipMethods.hideFoldedPage.call(this, true);
            }
          }
        }

        //add by Wangwenwei 20220422：Drag left or right?
        if (data.drag_flag && data.drag_start_point && data.drag_end_point) {
          flipMethods._dragTurnCheck.call(this, arguments);
        }

        //endadd

        data.corner = null;

      },


      //below add by Wangwenwei : 实现一种跩边型，采用几何的方式去映射两点坐标关系
      _getTransversCorner: function (e, previous = false) {

        var pos = this.data().f.parent.offset(),
          e = (isTouch && e.originalEvent) ? e.originalEvent.touches[0] : e,
          offsetValue = 5,
          width = this.width(),
          height = this.height(),
          isHorizontal = this.data().f.opts.turn.data().opts.isHorizontal,
          currentPoint = {
            x: e.pageX - pos.left,
            y: e.pageY - pos.top
          },
          centerCirclePoint,
          point,
          thet;


        if (isHorizontal) {


          /**
           *  calc_height = width;
           *  calc_currentPoint.x = currentPoint.y calc_currentPoint.y = width - currentPoint.x 
           *  
           */
          var calc_height = width,
            calc_width = height,
            calc_currentPoint = {
              x: currentPoint.y,
              y: width - currentPoint.x
            }



          if (calc_currentPoint.y < calc_height / 2) offsetValue = -1 * offsetValue;

          centerCirclePoint = point2D(calc_width - 1, calc_currentPoint.y + offsetValue);
          thet = Math.PI / 2 - Math.atan2(centerCirclePoint.y - calc_currentPoint.y, centerCirclePoint.x - calc_currentPoint.x);
          point = calcPoint(calc_currentPoint.x, calc_currentPoint.y, thet * 180 / Math.PI, calc_width, calc_height);

          var returnPoint = {
            x: width - point.y,
            y: point.x
          }

          if (point.corner == 'tr') returnPoint.corner = 'br';
          if (point.corner == 'br') returnPoint.corner = 'bl';

          return {
            x: returnPoint.x,
            y: returnPoint.y,
            corner: returnPoint.corner,
            centerCirclePoint: centerCirclePoint,
            startPoint: calc_currentPoint,
            realpoint: calc_currentPoint,
            canEffect: false
          }

        } else {
          if (currentPoint.y > height / 2) offsetValue = -1 * offsetValue;

          centerCirclePoint = point2D(width - 1, currentPoint.y + offsetValue);
          thet = Math.PI / 2 - Math.atan2(centerCirclePoint.y - currentPoint.y, centerCirclePoint.x - currentPoint.x);
          point = calcPoint(currentPoint.x, currentPoint.y, thet * 180 / Math.PI, width, height);

          return {
            x: point.x,
            y: point.y,
            corner: point.corner,
            centerCirclePoint: centerCirclePoint,
            startPoint: currentPoint,
            realpoint: currentPoint,
            canEffect: false
          }
        }



      },



      //Analyze whether need to drag left or right.
      _dragTurnCheck: function () {
        var data = this.data().f,
          start_point = data.drag_start_point,
          end_point = data.drag_end_point,
          deltaX = end_point.x - start_point.x,
          deltaY = end_point.y - start_point.y,
          turn = data.opts.turn,
          turnData = data.opts.turn.data(),
          angle = -1,
          duration = new Date().getTime() - start_point.time;

        //时间必须小于?s
        if (duration > turnData.opts.dragDuration) return false;

        //deltaX 必须大于?
        if (Math.abs(deltaX) < turnData.opts.dragDeltaX) return false;

        //正切角度必须小于?度
        if (deltaX != 0)
          angle = Math.atan(Math.abs(deltaY) / Math.abs(deltaX)) * 180 / Math.PI

        this.tlog('turnData.opts.dragAngle', turnData.opts.dragAngle);

        if (angle < turnData.opts.dragAngle && angle != -1) {
          if (deltaX > 0) {
            // drag right
            turn.turn('previous')
          } else {
            // darg left
            turn.turn('next')
          }
        }

        // must clear data.drag data
        delete data.drag_start_point;
        delete data.drag_end_point;
      },


      // 判断当前坐标是拖动翻页区域还是内部横向拖动区域
      _checkInOutArea: function (point) {
        var width = this.width(),
          height = this.height(),
          data = this.data().f,
          turn = data.opts.turn,
          turnData = turn.data(),
          isHorizontal = turnData.opts.isHorizontal;

        if (isHorizontal) {
          if (point.y < height / 2) {
            return 'in';
          } else {
            return 'out';
          }

        } else {
          if (point.x < width / 2) {
            return 'in';
          } else {
            return 'out';
          }
        }

      },


      disable: function (disable) {

        flipMethods.setData.call(this, { 'disabled': disable });
        return this;

      },

      hover: function (hover) {

        flipMethods.setData.call(this, { 'hover': hover });
        return this;

      },

      peel: function (corner, animate) {

        var data = this.data().f;

        if (corner) {

          if ($.inArray(corner, corners.all) == -1)
            throw turnError('Corner ' + corner + ' is not permitted');

          if ($.inArray(corner, flipMethods._cAllowed.call(this)) != -1) {

            var point = flipMethods._c.call(this, corner, data.opts.cornerSize / 2);

            data.status = 'peel';

            flipMethods._showFoldedPage.call(this,
              {
                corner: corner,
                x: point.x,
                y: point.y
              }, animate);

          }


        } else {

          data.status = '';

          flipMethods.hideFoldedPage.call(this, animate);

        }

        return this;
      }
    };


  // Processes classes

  function dec(that, methods, args) {

    // 如果是对象，就init
    if (!args[0] || typeof (args[0]) == 'object')
      return methods.init.apply(that, args);

    //否则，参数1为方法，剩下是参数
    else if (methods[args[0]])
      return methods[args[0]].apply(that, Array.prototype.slice.call(args, 1));

    else
      throw turnError(args[0] + ' is not a method or property');

  }


  // Attributes for a layer

  function divAtt(top, left, zIndex, overf) {

    return {
      'css': {
        position: 'absolute',
        top: top,
        left: left,
        'overflow': overf || 'hidden',
        zIndex: zIndex || 'auto'
      }
    };

  }

  // Gets a 2D point from a bezier curve of four points

  function bezier(p1, p2, p3, p4, t) {

    var a = 1 - t,
      b = a * a * a,
      c = t * t * t;

    return point2D(Math.round(b * p1.x + 3 * t * a * a * p2.x + 3 * t * t * a * p3.x + c * p4.x),
      Math.round(b * p1.y + 3 * t * a * a * p2.y + 3 * t * t * a * p3.y + c * p4.y));

  }

  // Converts an angle from degrees to radians

  function rad(degrees) {

    return degrees / 180 * PI;

  }

  // Converts an angle from radians to degrees

  function deg(radians) {

    return radians / PI * 180;

  }

  // Gets a 2D point

  function point2D(x, y) {

    return { x: x, y: y };

  }

  // Webkit 534.3 on Android wrongly repaints elements that use overflow:hidden + rotation

  function rotationAvailable() {
    var parts;

    if ((parts = /AppleWebkit\/([0-9\.]+)/i.exec(navigator.userAgent))) {
      var webkitVersion = parseFloat(parts[1]);
      return (webkitVersion > 534.3);
    } else {
      return true;
    }
  }

  // Returns the traslate value

  function translate(x, y, use3d) {

    return (has3d && use3d) ? ' translate3d(' + x + 'px,' + y + 'px, 0px) '
      : ' translate(' + x + 'px, ' + y + 'px) ';

  }

  // add by Darbuly 20220426：给定一个点，一个斜率，计算出对应的折角坐标，根据情况1和情况2的解析几何得出来的算法
  function calcPoint(x0, y0, _thet, W, H) {
    if (_thet == 90) {
      if (y0 > H / 2) {
        return {
          x: x0,
          y: 0,
          corner: 'tr'
        }
      } else {
        return {
          x: x0,
          y: H,
          corner: 'br'
        }
      }
    }
    var thet = _thet * Math.PI / 180,
      tanthet = Math.tan(thet),
      sinthet = Math.sin(thet),
      costhet = Math.cos(thet);
    if (_thet < 90) {
      var _x = (W - x0) * sinthet + (H - y0) * costhet;
      var _y = _x * (1 / costhet - tanthet);
      var x = W - _x;
      var y = H - _y;
      var corner = 'br';
    } else {
      var _x = (W - x0) * tanthet * costhet - y0 * costhet
      var _y = (_x - W + x0) * tanthet + y0;
      var x = W - _x;
      var y = _y;
      var corner = 'tr'
    }
    return {
      x: x,
      y: y,
      corner: corner
    }
  }

  // Returns the rotation value

  function rotate(degrees) {

    return ' rotate(' + degrees + 'deg) ';

  }

  // Checks if a property belongs to an object

  function has(property, object) {

    return Object.prototype.hasOwnProperty.call(object, property);

  }

  // Gets the CSS3 vendor prefix

  function getPrefix() {

    var vendorPrefixes = ['Moz', 'Webkit', 'Khtml', 'O', 'ms'],
      len = vendorPrefixes.length,
      vendor = '';

    while (len--)
      if ((vendorPrefixes[len] + 'Transform') in document.body.style)
        vendor = '-' + vendorPrefixes[len].toLowerCase() + '-';

    return vendor;

  }

  // Detects the transitionEnd Event

  function getTransitionEnd() {

    var t,
      el = document.createElement('fakeelement'),
      transitions = {
        'transition': 'transitionend',
        'OTransition': 'oTransitionEnd',
        'MSTransition': 'transitionend',
        'MozTransition': 'transitionend',
        'WebkitTransition': 'webkitTransitionEnd'
      };

    for (t in transitions) {
      if (el.style[t] !== undefined) {
        return transitions[t];
      }
    }
  }

  // Gradients

  function gradient(obj, p0, p1, colors, numColors) {

    var j, cols = [];

    if (vendor == '-webkit-') {

      for (j = 0; j < numColors; j++)
        cols.push('color-stop(' + colors[j][0] + ', ' + colors[j][1] + ')');

      obj.css({
        'background-image':
          '-webkit-gradient(linear, ' +
          p0.x + '% ' +
          p0.y + '%,' +
          p1.x + '% ' +
          p1.y + '%, ' +
          cols.join(',') + ' )'
      });
    } else {

      p0 = { x: p0.x / 100 * obj.width(), y: p0.y / 100 * obj.height() };
      p1 = { x: p1.x / 100 * obj.width(), y: p1.y / 100 * obj.height() };

      var dx = p1.x - p0.x,
        dy = p1.y - p0.y,
        angle = Math.atan2(dy, dx),
        angle2 = angle - Math.PI / 2,
        diagonal = Math.abs(obj.width() * Math.sin(angle2)) + Math.abs(obj.height() * Math.cos(angle2)),
        gradientDiagonal = Math.sqrt(dy * dy + dx * dx),
        corner = point2D((p1.x < p0.x) ? obj.width() : 0, (p1.y < p0.y) ? obj.height() : 0),
        slope = Math.tan(angle),
        inverse = -1 / slope,
        x = (inverse * corner.x - corner.y - slope * p0.x + p0.y) / (inverse - slope),
        c = { x: x, y: inverse * x - inverse * corner.x + corner.y },
        segA = (Math.sqrt(Math.pow(c.x - p0.x, 2) + Math.pow(c.y - p0.y, 2)));

      for (j = 0; j < numColors; j++)
        cols.push(' ' + colors[j][1] + ' ' + ((segA + gradientDiagonal * colors[j][0]) * 100 / diagonal) + '%');

      obj.css({ 'background-image': vendor + 'linear-gradient(' + (-angle) + 'rad,' + cols.join(',') + ')' });
    }
  }


  // Triggers an event

  function trigger(eventName, context, args) {

    var event = $.Event(eventName);
    context.trigger(event, args);
    if (event.isDefaultPrevented())
      return 'prevented';
    else if (event.isPropagationStopped())
      return 'stopped';
    else
      return '';
  }

  // JS Errors

  function turnError(message) {

    function TurnJsError(message) {
      this.name = "TurnJsError";
      this.message = message;
    }

    TurnJsError.prototype = new Error();
    TurnJsError.prototype.constructor = TurnJsError;
    return new TurnJsError(message);

  }

  // Find the offset of an element ignoring its transformation

  function findPos(obj) {

    var offset = { top: 0, left: 0 };

    do {
      offset.left += obj.offsetLeft;
      offset.top += obj.offsetTop;
    } while ((obj = obj.offsetParent));

    return offset;

  }

  // Checks if there's hard page compatibility
  // IE9 is the only browser that does not support hard pages

  function hasHardPage() {
    return (navigator.userAgent.indexOf('MSIE 9.0') == -1);
  }

  // Request an animation

  window.requestAnim = (function () {
    return window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.oRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      function (callback) {
        window.setTimeout(callback, 1000 / 60);
      };

  })();

  // Extend $.fn

  $.extend($.fn, {

    flip: function () {
      return dec($(this[0]), flipMethods, arguments);
    },

    turn: function () {
      return dec($(this[0]), turnMethods, arguments);
    },

    transform: function (transform, origin) {

      var properties = {};

      if (origin)
        properties[vendor + 'transform-origin'] = origin;

      properties[vendor + 'transform'] = transform;

      return this.css(properties);

    },

    //add by wangwenwei 20220422: 
    tlog: function () {
      var data = this.data().f ? this.data().f.opts : this.data().opts;
      if (data.debug) {
        console.log(...arguments);
      }
    },
    //end added

    animatef: function (point) {

      var data = this.data();

      if (data.effect)
        data.effect.stop();

      if (point) {

        if (!point.to.length) point.to = [point.to];
        if (!point.from.length) point.from = [point.from];

        var diff = [],
          len = point.to.length,
          animating = true,
          that = this,
          time = (new Date()).getTime(),
          frame = function () {

            if (!data.effect || !animating)
              return;

            var v = [],
              timeDiff = Math.min(point.duration, (new Date()).getTime() - time);

            for (var i = 0; i < len; i++)
              v.push(data.effect.easing(1, timeDiff, point.from[i], diff[i], point.duration));

            point.frame((len == 1) ? v[0] : v);

            if (timeDiff == point.duration) {
              delete data['effect'];
              that.data(data);
              if (point.complete)
                point.complete();
            } else {
              window.requestAnim(frame);
            }
          };

        for (var i = 0; i < len; i++)
          diff.push(point.to[i] - point.from[i]);

        data.effect = $.extend(
          {
            stop: function () {
              animating = false;
            },
            easing: function (x, t, b, c, data) {
              return c * Math.sqrt(1 - (t = t / data - 1) * t) + b;
            }
          },
          point
        );

        this.data(data);

        frame();

      } else {

        delete data['effect'];

      }
    }
  });
  // Export some globals

  $.isTouch = isTouch;
  $.mouseEvents = mouseEvents;
  $.cssPrefix = getPrefix;
  $.cssTransitionEnd = getTransitionEnd;
  $.findPos = findPos;

})(jQuery);
