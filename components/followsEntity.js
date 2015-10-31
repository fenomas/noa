'use strict';

var vec3 = require('gl-vec3')
var _tempVec = vec3.create()


/**
 * Indicates that an entity should be moved to another entity's position each tick,
 * possibly by a fixed offset and possibly inheriting rotation.
 * If meshes are set it will also move the meshes on each render.
 */

module.exports = function (noa) {
	
	return {

		name: 'follows-entity',

		state: {
			entity: 0|0,
			offset: null,
			// mesh: null,
			inheritRotation: false,
		},

		onAdd: function(eid, state) {
			var off = vec3.create()
			state.offset = (state.offset) ? vec3.copy(off, state.offset) : off
			if (state.inheritRotation) throw new Error("TODO")
		},

		onRemove: null,
		
		
		// on tick, copy over regular positions
		processor: function followEntity(dt, states) {
			for (var i=0; i<states.length; i++) {
				var state = states[i]
				var self = noa.ents.getPositionData(state.__id)
				var other = noa.ents.getPositionData(state.entity).position
				var off = state.offset
				self.setPosition(
					other[0] + off[0], 
					other[1] + off[1], 
					other[2] + off[2]
				)
			}
		},
		
		
		// on render, copy over render positions
		renderProcessor: function followEntityMesh(dt, states) {
			for (var i=0; i<states.length; i++) {
				var state = states[i]
				
				var self = noa.ents.getPositionData(state.__id)
				var other = noa.ents.getPositionData(state.entity)
				vec3.add(self.renderPosition, other.renderPosition, state.offset)
			}
		}


	}
}





