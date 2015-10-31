'use strict';

var vec3 = require('gl-vec3')
var _tempVec = vec3.create()


module.exports = function (noa) {
	return {
		
		name: 'physics-body',


		state: {
			body: null,
		},


		onAdd: function (entID, state) {
			state.body = noa.physics.addBody()
		},


		onRemove: function (entID, state) {
			noa.physics.removeBody( state.body )
		},


		processor: null,
		
		
		renderProcessor: function(dt, states) {
			// dt is time (ms) since physics engine tick
			// to avoid temporal aliasing, render the state as if lerping between
			// the last position and the next one 
			// since the entity data is the "next" position this amounts to 
			// offsetting each entity into the past by tickRate - dt
			// http://gafferongames.com/game-physics/fix-your-timestep/

			var backtrack = - (noa._tickRate - dt) / 1000
			
			for (var i = 0; i < states.length; ++i) {
				var state = states[i]
				var pdat = noa.ents.getPositionData(state.__id)
				
				// entity.renderPos = pos + backtrack * body.velocity
				vec3.scaleAndAdd(pdat.renderPosition, pdat.position, state.body.velocity, backtrack)
			}
		}
		
		

	}
}

