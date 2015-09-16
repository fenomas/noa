'use strict';

var vec3 = require('gl-vec3')

module.exports = function (noa) {
	return {
		
		name: 'has-mesh',

		state: {
			mesh: null, 
			offset: null 
		},


		onAdd: function (eid, state) {
			if (state.mesh) {
				noa.rendering.addDynamicMesh(state.mesh)
			} else {
				throw new Error('Mesh component added without a mesh - probably a bug!')
			}
			if (!state.offset) {
				state.offset = new vec3()
			}
		},


		onRemove: function(eid, state) {
			state.mesh.dispose()
		},


		processor: null


	}
}


