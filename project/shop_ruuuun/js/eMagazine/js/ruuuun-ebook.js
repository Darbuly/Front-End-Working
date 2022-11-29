function loadPage(page, pageElement, file_path, file_name, exten_name) {

	// let offset_index = 3;
	let offset_index = 1;

	var img = $('<img />');
	img.mousedown(function (e) {
		e.preventDefault();
	});



	if (page - offset_index < vm.turnjs_arg.orgfile_pages) {
		img.load(function () {
			// Set the size
			$(this).css({ width: '100%', height: '100%' });

			// Add the image to the page after loaded
			// var pageElement = $('.sj-book .p' + page);
			$(this).appendTo(pageElement);

			if (RBook) {
				RBook.afterPageImgLoad(pageElement, page, img);
			}

			var Cnv = document.getElementById('myCanvas');
			var old_img_elm = this;
			reflectImg(old_img_elm, Cnv, 600, function (url) {
				// 需要把back-img保存在backImgs
				vm.ebookApp.data().backImgs[page + 1] = {
					'page': page + 1, 'back-img': url
				}

				pageElement.find('.loader').remove();
			});
			// Remove the loader indicator

		});

		// Load the page : We need to proceesing offset algorithm.


		// pro env 

		// $.ajax({
		// 	type: 'POST',
		// 	url: "http://shop.ruuuun.com/wechat/getHuacePageImg",
		// 	data: {
		// 		"_token": $('meta[name="csrf-token"]').attr('content'),
		// 		"product_id": PRODUCT_ID,
		// 		"page": page - 1,
		// 	},
		// 	success: function (data) {
		// 		if (data.code != 200) {
		// 			console.log(data);
		// 			return;
		// 		} else {
		// 			var Cnv = document.getElementById('myCanvas');
		// 			AutoRotateImg(data.data, Cnv, function (src, rotated) {
		// 				if (rotated) {
		// 					if (!vm.ebookApp.turn('horizontal')) {
		// 						vm.ebookApp.turn('horizontal', true);
		// 					}
		// 				}
		// 				img.attr('src', src);
		// 			})
		// 		}

		// 	},
		// 	error: function () {
		// 		vant.Toast('系统异常');
		// 	}
		// });

		// end pro env.

		//local test
		page = Math.max(0, page - offset_index);
		img.attr('src', file_path + file_name + PrefixInteger(page, 2) + '.' + exten_name);
		//end local test

	} else {
		pageElement.find('.loader').remove(); //自动补全到偶数页的页面没有对应的图片
	}

}


// num传入的数字，n需要返回的字符长度
function PrefixInteger(num, n) {
	return (Array(n).join(0) + num).slice(-n);
}

function addPage(page, book, file_path, file_name, exten_name) {

	var id, pages = book.turn('pages');

	let innerPageWidth = 460;
	let innerPageHeight = 582;


	if (!book.turn('hasPage', page)) {

		if ($(window).width() <= 768) {
			if (page == 1) {
				// Proceesing the cover pages: 1,2
				var element = $('<div />',
					{
						'class': 'own-size',
						// css: { width: innerPageWidth, height: innerPageHeight }
					}).
					html('<div class="loader"></div>');

				// Proceesing the cover pages: last page,lasg page -1
			} else if (page == vm.turnjs_arg.orgfile_pages) {
				var element = $('<div />',
					{
						'class': 'own-size',
						// css: { width: innerPageWidth, height: innerPageHeight }
					}).
					html('<div class="loader"></div>');
			} else {
				var element = $('<div />',
					{
						'class': 'own-size',
						// css: { width: innerPageWidth, height: innerPageHeight }
					}).
					html('<div class="loader"></div>');
			}

		} else {
			if (page == 1 || page == 2) {
				// Proceesing the cover pages: 1,2
				var element = $('<div />',
					{
						'class': 'own-size hard',
						// css: { width: innerPageWidth, height: innerPageHeight }
					}).
					html('<div class="loader"></div>');

				// Proceesing the cover pages: last page,lasg page -1
			} else if (page == vm.turnjs_arg.orgfile_pages || page == vm.turnjs_arg.orgfile_pages - 1) {
				var element = $('<div />',
					{
						'class': 'own-size hard',
						// css: { width: innerPageWidth, height: innerPageHeight }
					}).
					html('<div class="loader"></div>');
			} else {
				var element = $('<div />',
					{
						'class': 'own-size',
						// css: { width: innerPageWidth, height: innerPageHeight }
					}).
					html('<div class="loader"></div>');
			}

		}



		if (book.turn('addPage', element, page)) {
			loadPage(page, element, file_path, file_name, exten_name);
		}

	}
}

function numberOfViews(book) {
	return book.turn('pages') / 2 + 1;
}

function getViewNumber(book, page) {
	return parseInt((page || book.turn('page')) / 2 + 1, 10);
}


function moveBar(yes) {
	if (Modernizr && Modernizr.csstransforms) {
		$('#slider .ui-slider-handle').css({ zIndex: yes ? -1 : 10000 });
	}
}

function isChrome() {

	// Chrome's unsolved bug
	// http://code.google.com/p/chromium/issues/detail?id=128488

	return navigator.userAgent.indexOf('Chrome') != -1;

}

function reflectImg(old_img_elm, Cnv, width, callback) {
	var Cntx = Cnv.getContext('2d');//获取2d编辑容器
	var imgobj = new Image();//创建一个图片
	imgobj.src = old_img_elm.src;
	imgobj.onload = function () {
		//等比缩放
		var m = imgobj.height / imgobj.width;
		Cnv.width = width;//该值影响缩放后图片的大小
		Cnv.height = width * m;
		Cntx.globalAlpha = 0.3;
		Cntx.scale(-1, 1); //
		Cntx.translate(-Cnv.width, 0);
		//img放入画布中
		Cntx.drawImage(old_img_elm, 0, 0, width, width * m);
		//把画布中的数据，写出到某img的src里
		var Pic = Cnv.toDataURL("image/png");
		callback(Pic);
	}
}




function AutoRotateImg(img_src, Cnv, callback) {
	var Cntx = Cnv.getContext('2d');//获取2d编辑容器
	const FILE_TYPE = 'image/jpeg';

	var old_img_elm = new Image();//创建一个图片
	old_img_elm.src = img_src;
	old_img_elm.onload = function () {


		if (old_img_elm.height < old_img_elm.width) {
			//旋转纠正宽高
			Cnv.width = old_img_elm.height
			Cnv.height = old_img_elm.width;
			Cntx.clearRect(0, 0, Cnv.width, Cnv.height)
			Cntx.translate(Cnv.width, 0);
			Cntx.rotate(90 * Math.PI / 180)
			Cntx.drawImage(old_img_elm, 0, 0, old_img_elm.width, old_img_elm.height)
			var Pic = Cnv.toDataURL(FILE_TYPE);
			callback(Pic, true);
		} else {
			Cnv.width = old_img_elm.width
			Cnv.height = old_img_elm.height;
			Cntx.clearRect(0, 0, Cnv.width, Cnv.height)
			Cntx.drawImage(old_img_elm, 0, 0, old_img_elm.width, old_img_elm.height)
			var Pic = Cnv.toDataURL(FILE_TYPE);
			callback(Pic, false);
		}


	}
}


//给当前页添加一层div图层
function appendToDivLayout(divlayout, pageElement, page) {
	$(divlayout).addClass('page-layout-' + page);
	divlayout && divlayout.appendTo(pageElement);
}
