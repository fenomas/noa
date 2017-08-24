'use strict'


module.exports = function (noa) {
	return {

		name: 'smooth-camera',

		state: {
			time: 100.1
		},

		onAdd: null,

		onRemove: null,

		system: function (dt, states) {
			// remove self after time elapses
			for (var i = 0; i < states.length; ++i) {
				var state = states[i]
				state.time -= dt
				if (state.time < 0) noa.ents.removeComponent(state.__id, 'smooth-camera')
			}
		},



	}
}

