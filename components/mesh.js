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


		processor: null


	}
}


