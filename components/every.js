'use strict'


module.exports = function (noa) {
	return {

		name: 'every',

		state: {
			every: 100.0, //ms
			callback: null,
			_ct: 0.0
		},

		onAdd: null,

		onRemove: null,

		system: function everyProcessor(dt, states) {
			for (var i = 0; i < states.length; i++) {
				var state = states[i]
				state._ct += dt
				if (state._ct > state.every) {
					state.callback(state.every)
					state._ct -= state.every
				}
			}
		}


	}
}

