'use strict';


module.exports = function (noa) {
	return {
		
		name: 'autostepping',

		state: {
			time: 100.1
		},

		onAdd: null,

		onRemove: null,

		processor: function(dt, states) {
			// remove self after time elapses
			for (var i = 0; i < states.length; ++i) {
				var state = states[i]
				state.time -= dt
				if (state.time < 0) noa.ents.removeComponent(state.__id, this)
			}
		},
		


	}
}

