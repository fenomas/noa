'use strict'

var vec3 = require('gl-vec3')
var AABB = require('aabb-3d')


module.exports = function (noa) {

	var tempVec = vec3.create()

	return {

		name: 'physics',


		state: {
			body: null,
		},


		onAdd: function (entID, state) {
			state.body = noa.physics.addBody()
			// implicitly assume body has a position component, to get size
			var dat = noa.ents.getPositionData(state.__id)
			noa.ents.setEntitySize(state.__id, dat.width, dat.height, dat.width)
		},


		onRemove: function (entID, state) {
			noa.physics.removeBody(state.body)
		},


		system: null,


		renderSystem: function (dt, states) {
			// dt is time (ms) since physics engine tick
			// to avoid temporal aliasing, render the state as if lerping between
			// the last position and the next one 
			// since the entity data is the "next" position this amounts to 
			// offsetting each entity into the past by tickRate - dt
			// http://gafferongames.com/game-physics/fix-your-timestep/

			var backtrack = - (noa._tickRate - dt) / 1000
			var pos = tempVec

			for (var i = 0; i < states.length; ++i) {
				var state = states[i]
				var id = state.__id
				var pdat = noa.ents.getPositionData(id)

				// pos = pos + backtrack * body.velocity
				vec3.scaleAndAdd(pos, pdat.position, state.body.velocity, backtrack)

				// smooth out position update if component is present
				// (normally set after sudden movements like auto-stepping)
				if (noa.ents.cameraSmoothed(id)) {
					vec3.lerp(pos, pdat.renderPosition, pos, 0.3)
				}

				// copy values over to renderPosition, 
				vec3.copy(pdat.renderPosition, pos)


			}
		}



	}
}

