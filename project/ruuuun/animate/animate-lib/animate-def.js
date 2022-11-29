/**
 * 动画单元定义模型
 */


var testData = {
	id: 99,
	name: '字体变大',
	data: {
		0: { "fontSize": "64px" },
		100: { "fontSize": "1200px" }
	}
}
var testData2 = {
	id: 98,
	name: '淡出',
	data: {
		0: { "opacity": 1 },
		80: { "opacity": 1 },
		100: { "opacity": 0 }
	}
}





var animateDataLib = {
	1: testData,
	2: testData2,
	4: {
		id: 4,
		name: '向右淡入',
		data: {
			0: { "opacity": 0, "translateX": -50 },
			80: { "opacity": 1, "translateX": 0 },
			100: { "opacity": 1 }
		}
	}
}

