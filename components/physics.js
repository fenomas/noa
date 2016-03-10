'use strict';

var vec3 = require('gl-vec3')
var tempVec = vec3.create()


module.exports = function (noa) {
	return {
		
		name: 'physics',


		state: {
			body: null,
		},


		onAdd: function (entID, state) {
			state.body = noa.physics.addBody()
		},


		onRemove: function (entID, state) {
			noa.physics.removeBody( state.body )
		},


		system: null,
		
		
		renderSystem: function(dt, states) {
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
				
				// copy values over to renderPosition, 
				// except smooth out y transition if the entity is autostepping
				if (noa.ents.isStepping(id)) {
					var curr = pdat.renderPosition[1]
					pos[1] = curr + (pos[1]-curr) * .3
				}

				vec3.copy(pdat.renderPosition, pos)

				
			}
		}
		
		

	}
}

