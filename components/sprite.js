'use strict';


module.exports = function (noa) {
	return {
		
		name: 'is-sprite',

		state: {},

		onAdd: function(eid, state) {
			// turn on mesh's billboard.Y
			var meshData = noa.entities.getData(eid, noa.entities.components.mesh)
			noa.rendering.setUpSpriteMesh(meshData.mesh)
		},

		onRemove: null,

		processor: function(dt, states) {
			var ents = noa.entities
			for (var i=0; i<states.length; i++) {
				var id = states[i].__id
				var box = ents.getAABB(id)
				var mesh = ents.getMeshData(id).mesh
				// adjust height of sprite-based meshes to face camera
				noa.rendering.adjustSpriteMeshHeight(box, mesh)
			}
		}


	}
}

