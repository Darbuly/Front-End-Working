function RAu(time) {
	return time * 1000;
}

function _RAu(time) {
	return time / 1000;
}

function RAtranslateLinetime(aniItemList, aniDefData) {
	if (Array.isArray(aniItemList)) {


		let finalAnimateData = {};
		let timeLineEvent = {};
		let whole_time = 0;

		/**
		 * 时间线重组算法：根据每个特效的不同持续时间+延迟时间以及对应的百分比，
		 * 重新铺排唯一单条时间线
		 * 算法的逻辑：遍历所有特效参数以及对应的百分比关键帧数据，
		 * 记录什么时候执行这个帧数据，（受持续时间、延迟时间、循环次数影响）
		 */
		let fillMode = "";
		aniItemList.map(function (aItem, aIndex) {

			let animateData = aniDefData[aItem.use_effect_id].data;
			let el = aItem.el;
			let loop = aItem.loop;
			let loopInterval = aItem.loopInterval;
			let minInterval = 100;//最小间隔 100ms
			if (aItem.fillMode) {
				fillMode = aItem.fillMode
			}

			if (animateData) {

				//先处理单次循环，后面再根据循环参数去补充完整时间线
				let one_loop_ani_item_time = RAu(aItem.delay + aItem.duration);


				for (let i = 0; i < loop; i++) {


					if (i > 0) {
						//补充间隔,间隔内快速回到 0%的状态

						const frame = animateData[0];
						let current_key_frame_time = one_loop_ani_item_time * i + minInterval * i;
						if (timeLineEvent[current_key_frame_time] == undefined) timeLineEvent[current_key_frame_time] = {};
						if (timeLineEvent[current_key_frame_time][el] == undefined) timeLineEvent[current_key_frame_time][el] = {};

						timeLineEvent[current_key_frame_time][el] = {
							...timeLineEvent[current_key_frame_time][el],
							...frame
						}


						if (loopInterval > 0) {
							//间隔处理
							current_key_frame_time = one_loop_ani_item_time * i + minInterval * i + RAu(loopInterval);
							if (timeLineEvent[current_key_frame_time] == undefined) timeLineEvent[current_key_frame_time] = {};
							if (timeLineEvent[current_key_frame_time][el] == undefined) timeLineEvent[current_key_frame_time][el] = {};

							timeLineEvent[current_key_frame_time][el] = {
								...timeLineEvent[current_key_frame_time][el],
								...frame
							}

						}

					}


					for (const key_frame in animateData) {
						if (Object.hasOwnProperty.call(animateData, key_frame)) {
							const frame = animateData[key_frame];
							let current_key_frame_time = 0;
							if (loop > 1) {
								current_key_frame_time = (one_loop_ani_item_time + minInterval + RAu(loopInterval)) * i + RAu(aItem.duration) * key_frame * 0.01 + RAu(aItem.delay);
							} else {
								current_key_frame_time = RAu(aItem.duration) * key_frame * 0.01 + RAu(aItem.delay);
							}

							if (timeLineEvent[current_key_frame_time] == undefined) timeLineEvent[current_key_frame_time] = {};
							if (timeLineEvent[current_key_frame_time][el] == undefined) timeLineEvent[current_key_frame_time][el] = {};

							timeLineEvent[current_key_frame_time][el] = {
								...timeLineEvent[current_key_frame_time][el],
								...frame
							}

							//计算最大时间
							if (current_key_frame_time > whole_time) {
								whole_time = current_key_frame_time;
							}
						}
					}


				}


			}


		})

		//避免出现第一个时不是0的情况
		if (timeLineEvent[0] == undefined) timeLineEvent[0] = {};


		//转成通用的百分比时间线
		for (const time_key in timeLineEvent) {
			if (Object.hasOwnProperty.call(timeLineEvent, time_key)) {
				const whole_frame_data = timeLineEvent[time_key];
				let current_percent = Number((Number(time_key) / whole_time * 100).toFixed(2));
				if (finalAnimateData[current_percent] == undefined) finalAnimateData[current_percent] = {};
				finalAnimateData[current_percent] = whole_frame_data;
			}
		}


		return {
			data: {
				duration: _RAu(whole_time),
				delay: 0,
				// FIXME: 考虑循环
				loop: 1,
				loopInterval: 0,
				fillMode
			},
			animate: finalAnimateData
		};

	}
}




function RAdriveAnimate(animate, params) {

	let el_queue = {};
	let all_current_time = params.delay ? RAu(params.delay) : 0;//单位 毫秒
	let all_time = 0;//动画总时长
	let fill_mode = params.fillMode;
	let backward_style = {};


	//计算动画总时长
	all_time = RAu(params.duration);

	//格式化时间线
	let formatedTimeLine = RAtoAttributeTimeline(animate);


	for (const el in formatedTimeLine) {
		if (Object.hasOwnProperty.call(formatedTimeLine, el)) {
			const attribute_list = formatedTimeLine[el];
			const el_dom = document.getElementById(el);

			let max_time = 0;
			let max_time_attribute = null;

			for (const attribute in attribute_list) {
				if (Object.hasOwnProperty.call(attribute_list, attribute)) {
					const frame_list = attribute_list[attribute];

					const key_frame_list = Object.keys(frame_list);

					let last_key_frame = key_frame_list[0];
					let current_time = all_current_time;

					let o_frame_list = Object.keys(frame_list);
					//必须要排序执行
					let order_frame_list = o_frame_list.sort(function (a, b) {
						return a - b;
					})

					//记录每一个 attribute 刚开始时的状态值,方便 backwards
					if (backward_style[el] == undefined) backward_style[el] = {};


					if (attribute.indexOf('translate') != -1) {
						if (backward_style[el]['transform'] == undefined) backward_style[el]['transform'] = "";
						if (el_dom && el_dom.style['transform']) {
							backward_style[el]['transform'] = el_dom.style['transform'];
						}
					} else {
						if (backward_style[el][attribute] == undefined) backward_style[el][attribute] = "";
						if (el_dom && el_dom.style[attribute]) {
							backward_style[el][attribute] = el_dom.style[attribute];
						}
					}


					order_frame_list.map(function (key_frame) {
						if (Object.hasOwnProperty.call(frame_list, key_frame)) {
							const value = frame_list[key_frame];
							let duration = (Number(key_frame) - Number(last_key_frame)) * 0.01 * all_time
							last_key_frame = key_frame;

							const frame = {};


							if (el_queue[el] == undefined) {



								frame[attribute] = [{ value: value, duration: duration, delay: current_time }];

								el_queue[el] = {
									targets: '#' + el,
									easing: 'linear',
									autoplay: false,
									...frame
								};
							} else {
								if (el_queue[el][attribute] == undefined) el_queue[el][attribute] = [];
								el_queue[el][attribute].push({
									value: value,
									duration: duration
								})

							}

							current_time += duration;

							if (max_time < current_time) {
								max_time = current_time;
								max_time_attribute = attribute;
							}

						}
					})


				}
			}

			if (fill_mode == 'backwards') {
				el_queue[el]['complete'] = function (e) {
					for (const el in backward_style) {
						if (Object.hasOwnProperty.call(backward_style, el)) {
							let attributes = backward_style[el];
							let el_dom = document.getElementById(el);
							if (el_dom && el_dom.style) {
								for (const attribute in attributes) {
									if (Object.hasOwnProperty.call(attributes, attribute)) {
										const value = attributes[attribute];
										el_dom.style[attribute] = value;

									}
								}
							}
						}
					}

				}
			}


		}
	}

	// 执行 el 队列动画
	for (const el in el_queue) {
		if (Object.hasOwnProperty.call(el_queue, el)) {
			const el_obj = el_queue[el];
			console.log('el_obj', el_queue[el])
			el_queue[el] = anime(el_obj);

			el_queue[el].play();

		}
	}



}

function RAtoAttributeTimeline(animate) {

	let attribute_time_line = {};
	//排序
	let origin_time_key_list = Object.keys(animate);

	let ordered_time_key_list = origin_time_key_list.sort(function (a, b) {
		return a - b;
	})
	ordered_time_key_list.map(function (key_frame) {
		if (Object.hasOwnProperty.call(animate, key_frame)) {
			const el_frame = animate[key_frame];

			for (const el in el_frame) {
				if (Object.hasOwnProperty.call(el_frame, el)) {
					const frame = el_frame[el];

					for (const attribute in frame) {
						if (Object.hasOwnProperty.call(frame, attribute)) {
							const value = frame[attribute];

							if (attribute_time_line[el] == undefined) attribute_time_line[el] = {};
							if (attribute_time_line[el][attribute] == undefined) {
								attribute_time_line[el][attribute] = {};
								attribute_time_line[el][attribute]['0'] = value;
							}
							if (attribute_time_line[el][attribute][key_frame] == undefined) attribute_time_line[el][attribute][key_frame] = {};
							attribute_time_line[el][attribute][key_frame] = value;

						}
					}

				}
			}



		}
	})

	return attribute_time_line;

}




function toAnimeTimeline(animate_line, main_duration) {

	if (!main_duration) {
		throw new Error('toAnimeTimeline main_duration 不能为空')
	}

	let mian_track = {
		duration: main_duration,
		easing: 'easeInOutSine',
	}
	let all_time = main_duration;

	//格式化时间线
	let formatedTimeLine = RAtoAttributeTimeline(animate_line, false);

	let anime_time_line = [];

	for (const el in formatedTimeLine) {
		if (Object.hasOwnProperty.call(formatedTimeLine, el)) {
			const el_frame = formatedTimeLine[el];

			for (const attribute in el_frame) {
				if (Object.hasOwnProperty.call(el_frame, attribute)) {
					const value_line = el_frame[attribute];

					let last_ky = {
						last_value: null,
						key_frame: null
					}

					for (const key_frame in value_line) {
						if (Object.hasOwnProperty.call(value_line, key_frame)) {
							const value = value_line[key_frame];
							if (last_ky.last_value === null) {
								last_ky.last_value = value;
								last_ky.key_frame = key_frame;
							} else {

								if (last_ky.last_value != value) {
									let frame = {}
									frame[attribute] = value;

									let duration = (Number(key_frame) - Number(last_ky.key_frame)) * 0.01 * all_time;
									let offset = all_time * ((100 - Number(key_frame)) * 0.01)

									let atl_item = {
										params: {
											targets: '#' + el,
											duration: parseFloat(duration.toFixed(2)),
											...frame,
										},
										offset: `-=${offset.toFixed(2)}`,
									}

									anime_time_line.push(atl_item);

									last_ky.last_value = value;
									last_ky.key_frame = key_frame;

								}


							}

						}
					}

				}
			}

		}
	}

	return anime_time_line;


}