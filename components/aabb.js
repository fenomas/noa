'use strict';

var aabb = require('aabb-3d')

module.exports = function (noa) {
	return {

		name: 'bounding-box',

		state: {
			aabb: null
		},

		onAdd: function (eid, state) {
			if (!state.aabb) state.aabb = new aabb([0,0,0], [0,0,0])
		},

		onRemove: null,

		processor: null


	}
}

