/**
 * drag
 * version 1.0.0
 *  
 *  
 *  author: Wangwenwei (970073804@qq.com)
 * 
 */


class drag {

	constructor({ containerId, config }) {

		this.containerId = containerId;
		this.config = initConfig(config);
		//
	}


	initConfig(config) {
		//是否固定Y轴
		this.disableY = config['disableY'] != undefined ? config['disableY'] : true;

		//是否自动弹回
		this.turnBack = config['turnBack'] != undefined ? config['turnBack'] : true;

		//最大拖动左边极限留白宽度
		this.maxLeft = config['maxLeft'] != undefined ? config['maxLeft'] : 300;

		//最大拖动右边极限留白宽度
		this.maxRight = config['maxRight'] != undefined ? config['maxRight'] : 300;
	}
}