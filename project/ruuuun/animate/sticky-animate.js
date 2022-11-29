function renderAnmateLine(animate_line, pos) {

	let last_frame = {
		pos: 0,
		frameStyleObj: {}
	}

	let target_frame = {
		pos: pos,
		frameStyleObj: {}
	}


	// get currentFrame

	let status_frame = {};
	let current_frame = {};
	let future_frame = {};


	let animate_line_arr = Object.keys(animate_line);

	animate_line_arr.map(function (frame_time, index) {

		if (Object.hasOwnProperty.call(animate_line, frame_time)) {

			const last_frame_time = animate_line_arr[index - 1] ? animate_line_arr[index - 1] : 0;

			if (last_frame_time / 100 <= pos && frame_time / 100 > pos) {


				last_frame.frameStyleObj = animate_line[last_frame_time];
				last_frame.pos = last_frame_time / 100;
				target_frame.frameStyleObj = animate_line[frame_time];
				target_frame.pos = frame_time / 100;

				let offSetPos = (pos - last_frame_time / 100) / ((frame_time - last_frame_time) / 100)
				current_frame = currentStyleFrameObj(last_frame, target_frame, offSetPos)

			} else if (frame_time / 100 <= pos) {
				//超过这个时间帧
				status_frame = { ...status_frame, ...animate_line[frame_time] }

			} else if (frame_time / 100 > pos) {
				//即将渲染帧
				future_frame = { ...future_frame, ...animate_line[frame_time] }

			}

		}

	})

	//将即将渲染帧的样式都归为未设置状态
	for (const id in future_frame) {
		if (Object.hasOwnProperty.call(future_frame, id)) {
			const StyleObj = future_frame[id];
			let dom = document.getElementById(id);

			if (dom) {
				for (const styleKey in StyleObj) {
					if (Object.hasOwnProperty.call(StyleObj, styleKey)) {
						dom.style[styleKey] = "";
					}
				}

			}

		}
	}

	//先处理状态帧
	procAnimateLine(status_frame);

	//再处理当前帧
	procAnimateLine(current_frame);


}


function currentStyleFrameObj(last_frame, target_frame, offSetPos) {

	let currentFrameObj = {};
	let domObj = target_frame.frameStyleObj;


	for (const id in domObj) {
		if (Object.hasOwnProperty.call(domObj, id)) {
			const styleObj = domObj[id];
			currentFrameObj[id] = {};


			if (last_frame.frameStyleObj[id]) {
				//上一帧有同样的dom对象
				for (const styleKey in styleObj) {
					if (Object.hasOwnProperty.call(styleObj, styleKey)) {
						const value = styleObj[styleKey];
						const last_value = last_frame.frameStyleObj[id][styleKey]

						if (last_value) {

							if (typeof last_value == "boolean") {
								//上一帧是无,无需过渡
								currentFrameObj[id][styleKey] = "";

							} else {

								//上一帧有同样的style设置
								if (typeof value == 'string') {
									//文本型
									currentFrameObj[id][styleKey] = calcStringValueByOffset(last_value, value, offSetPos);

								}
								if (typeof value == "number") {
									//整数型
									currentFrameObj[id][styleKey] = calcNumberValueByOffset(last_value, value, offSetPos);
								}

							}


						} else {
							currentFrameObj[id][styleKey] = value;
						}
					}
				}


			} else {
				currentFrameObj[id] = styleObj;
			}
		}
	}

	return currentFrameObj;

}
function calcStringValueByOffset(from, to, percent) {

	//TODO: 支持对每一个数字部分，都做修改
	let fromNumArr = from.match(/\d+/g)//60px

	let StrArr = from.match(/[^\d]+/g)

	let toNumArr = to.match(/\d+/g)//100px

	let resNumberArr = [];

	fromNumArr.map(function (nItem, nIndex) {
		let fromNumStr = nItem;

		let toNumStr = toNumArr[nIndex];

		let resNum = (Number(toNumStr) - Number(fromNumStr)) * percent + Number(fromNumStr);

		resNumberArr[nIndex] = String(resNum);

	})

	//组合

	let final_str = '';

	for (let index = 0; index < StrArr.length; index++) {
		const Str = StrArr[index];

		if (resNumberArr[index] !== undefined) final_str += Str + resNumberArr[index]


	}



	return final_str;

}
function calcNumberValueByOffset(from, to, percent) {
	return (to - from) * percent + from;
}


function procAnimateLine(frameStyleObj) {

	for (const id in frameStyleObj) {
		if (Object.hasOwnProperty.call(frameStyleObj, id)) {
			const StyleObj = frameStyleObj[id];
			let dom = document.getElementById(id);

			if (dom) {
				for (const styleKey in StyleObj) {
					if (Object.hasOwnProperty.call(StyleObj, styleKey)) {
						const value = StyleObj[styleKey];

						if (typeof value != 'boolean') {
							//优化：如果值相同，不再重新赋值
							if (dom.style[styleKey] !== value) {
								dom.style[styleKey] = value;
							}

						}


					}
				}

			}



		}
	}

}