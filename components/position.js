'use strict';

var vec3 = require('gl-vec3')


/**
 * 
 * 	Component holding entity's position, width, and height.
 *  By convention, "position" is the bottom center of the entity's AABB
 * 
 */


module.exports = function (noa) {
	return {

		name: 'position',

		state: {
			position: null,
			renderPosition: null,
			width: 0.0,
			height: 0.0,
		},


		onAdd: function (eid, state) {
			// force position to be a vec3
			var pos = state.position
			state.position = vec3.create()
			if (pos) vec3.copy(state.position, pos)

			state.renderPosition = vec3.create()
			vec3.copy(state.renderPosition, state.position)
		},

		onRemove: null,

		system: null


	}
}


