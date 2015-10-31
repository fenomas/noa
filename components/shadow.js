'use strict';


module.exports = function (noa) {
	return {
		
		name: 'has-shadow',

		state: {
			mesh:	null,
			size:	0.5
		},


		onAdd: function (eid, state) {
			state.mesh = noa.rendering.makeMeshInstance('shadow', false)
		},


		onRemove: function(eid, state) {
			state.mesh.dispose()
		},


		processor: function shadowProcessor(dt, states) {
			for (var i=0; i<states.length; i++) {
				var state = states[i]
				var shadowDist = noa.entities.shadowDist
				updateShadowHeight(state.__id, state.mesh, state.size, shadowDist, noa)
			}
		},
		
		
		renderProcessor: function(dt, states) {
			// before render adjust shadow x/z to render positions
			for (var i = 0; i < states.length; ++i) {
				var state = states[i]
				var rpos = noa.ents.getPositionData(state.__id).renderPosition
				var spos = state.mesh.position
				spos.x = rpos[0]
				spos.z = rpos[2]
			}
		}




	}
}

var down = new Float32Array([0, -1, 0])

function updateShadowHeight(id, mesh, size, shadowDist, noa) {
	var loc = noa.entities.getPositionData(id).position
	var pick = noa.pick(loc, down, shadowDist)
	if (pick) {
		var y = pick.position[1]
		mesh.position.y = y + 0.05
		var dist = loc[1] - y
		var scale = size * 0.7 * (1-dist/shadowDist)
		mesh.scaling.copyFromFloats(scale, scale, scale)
		mesh.setEnabled(true)
	} else {
		mesh.setEnabled(false)
	}
}


