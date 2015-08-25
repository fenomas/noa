'use strict';


module.exports = function (noa) {
	return {

		name: 'collide-terrain',

		state: {
			callback: null
		},

		onAdd: function(eid, state) {
			// add collide handler for physics engine to call
			var ents = noa.entities
			if (ents.hasComponent(eid, ents.components.physics)) {
				var body = ents.getPhysicsBody(eid)
				body.onCollide = function(impulse) {
					var cb = ents.getData(eid, 'collide-terrain').callback
					if (cb) cb(impulse, eid)
				}
			}
		},

		onRemove: function(eid, state) {
			var ents = noa.entities
			if (ents.hasComponent(eid, ents.components.physics)) {
				ents.getPhysicsBody(eid).onCollide = null
			}
		},
		

		processor: null


	}
}

