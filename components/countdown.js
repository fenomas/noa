'use strict';


module.exports = function (noa) {
	return {
		
		name: 'countdown',

		state: {
			callback:	null,
			time:		500.1  // ms
		},

		onAdd: null,

		onRemove: function (entID, state) {
			state.callback()
		},

		processor: function (dt, states) {
			for (var i=0; i<states.length; i++) {
				var state = states[i]
				state.time -= dt
				if (state.time < 0) {
					noa.entities.removeComponent(state.__id, 'countdown')
				}
			}
		}


	}
}

