$(function () {

	//初始化拖动
	function initDrag(idName, config = null) {
		const div = document.getElementById(idName);
		if (!div) {
			throw new Error('拖动对象初始化失败，请检查id值是否正确');
		}
		let drag_flag = false;
		let position = [0, 0];


		//函数监听
		div.onmousedown = function (e) {
			drag_flag = true;

			// div.style.transition = 'none';
			div.style.transition = 'left 0.8s ease-out'
			position[0] = e.clientX;
			position[1] = e.clientY;
		}


		let overFlowWidth = div.scrollWidth - document.body.clientWidth;

		console.log(`div.scrollWidth = ${div.scrollWidth},document.body.clientWidth = ${document.body.clientWidth}`)

		let isOverFlowX = false;
		let isOverFlowY = '';


		document.onmousemove = function (e) {

			if (drag_flag) {

				if (!config || !config.disableX) {
					let deltaX = e.clientX - position[0];
					if (deltaX > 0) {
						isOverFlowX = false;
						isOverFlowY = '';
						//向右拖


						if ((parseInt(div.style.left) || 0) > 0) {
							isOverFlowX = true;
						}

						if (!config
							|| !config.maxLeft ||
							(parseInt(div.style.left) || 0) + deltaX < config.maxLeft
						) {
							div.style.left = (parseInt(div.style.left) || 0) + deltaX + "px";
							position[0] = e.clientX;
						}
					} else {
						//向左拖
						isOverFlowX = false;
						if (overFlowWidth == 0 && (parseInt(div.style.left) || 0) > 0) {
							//说明刚好铺满整个窗口，那么
							isOverFlowY = '0';
						} else if ((parseInt(div.style.left) || 0) + deltaX < -(overFlowWidth)) {
							isOverFlowY = -overFlowWidth;
						}

						if (!config
							|| !config.maxRight ||
							(parseInt(div.style.left) || 0) + deltaX > -(config.maxRight + overFlowWidth)
						) {
							// console.log(`${(parseInt(div.style.left) || 0) + deltaX} >? ${-(config.maxRight + overFlowWidth)},overFlowWidth=${overFlowWidth}`);

							if ((parseInt(div.style.left) || 0) + deltaX > -(config.maxRight + overFlowWidth)) {
								div.style.left = (parseInt(div.style.left) || 0) + deltaX + "px";
								position[0] = e.clientX;
							}
						}
					}

				}

				if (!config || !config.disableY) {
					let deltaY = e.clientY - position[1];
					div.style.top = (parseInt(div.style.top) || 0) + deltaY + "px";
					position[1] = e.clientY;
				}

			}
		}
		document.onmouseup = function () {
			drag_flag = false;
			if (config && config.turnBack && isOverFlowX) {
				console.log('is overflow');
				// div.style.transition = 'left 1s ease-out'
				div.style.left = 0;
				div.style.top = 0;
			}
			if (config && config.turnBack && isOverFlowY != null) {
				// div.style.transition = 'left 1s ease-out'
				div.style.left = `${isOverFlowY}px`;
				div.style.top = 0;
				isOverFlowY = '';
			}
		}
	}


	initDrag('main', {
		disableY: true,//是否固定Y轴
		turnBack: true,//是否自动弹回
		maxLeft: 300,//最大拖动左边极限留白宽度
		maxRight: 300,//最大拖动右边极限留白宽度
	});

});