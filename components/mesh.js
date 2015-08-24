'use strict';


module.exports = function (noa) {
	return {
		
		name: 'has-mesh',

		state: {
			mesh: null, 
			offset: null 
		},


		onAdd: function (eid, state) {
			noa.rendering.addDynamicMesh(state.mesh)
		},


		onRemove: function(eid, state) {
			state.mesh.dispose()
		},


		processor: function (dt, states) {
			for (var i=0; i<states.length; i++) {
				// var state = states[i]
				// var shadowDist = noa.entities.shadowDist
				// updateShadowHeight(state.__id, state.mesh, state.size, shadowDist, noa)
			}
		}


	}
}


