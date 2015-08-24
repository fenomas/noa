'use strict';


module.exports = function (noa) {
	return {
		
		name: 'physics-body',


		state: {
			body: null
		},


		onAdd: function (entID, state) {
			state.body = noa.physics.addBody()
		},


		onRemove: function (entID, state) {
			noa.physics.removeBody( state.body )
		},


		processor: null


	}
}

