'use strict';

var aabb = require('aabb-3d')
var vec3 = require('gl-vec3')


/**
 * 
 * 	Component holding entity's position, width, height, and (implicitly) AABB.
 * To update position, call `state.setPosition`.
 * After running physics (which updates AABBs) call `state.updateFromAABB`
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
			aabb: null,
			setPosition: null,
			updateFromAABB: null,
		},


		onAdd: function (eid, state) {
			state.renderPosition = vec3.create()
			
			// populate accessors
			state.setPosition = setPosition
			state.updateFromAABB = updateFromAABB
			
			// force position to be a vec3
			var pos = state.position
			state.position = vec3.create()
			if (pos) vec3.copy(state.position, pos)
			vec3.copy(state.renderPosition, state.position)
			
			// create "managed" AABB
			var base = vec3.clone(state.position)
			base[0] -= state.width/2
			base[2] -= state.width/2
			var vec = vec3.fromValues(state.width, state.height, state.width)
			state.aabb = new aabb(base, vec)
		},

		onRemove: null,

		system: null


	}
}

function setPosition(x, y, z) {
	vec3.set(this.position, x, y, z)
	var hw = this.width / 2
	this.aabb.setPosition([x - hw, y, z - hw])
}

function updateFromAABB() {
	var hw = this.width / 2
	var vec = this.aabb.base
	vec3.set(this.position, vec[0] + hw, vec[1], vec[2] + hw)
}


