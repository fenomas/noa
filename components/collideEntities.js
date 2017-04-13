'use strict';

var boxIntersect = require('box-intersect')


/**
 * 
 * 	Every frame, entities with this component will get checked for colliions
 * 
 *   * collideBits: category for this entity
 *   * collideMask: categories this entity collides with
 *   * callback: function(other_id) - called when `own.collideBits & other.collideMask` is true
/*


/*
 * 
 * 		Notes:
 * 	normal entity (e.g. monster) probably wants bits=1; mask=1
 *  bullets want bits=0, mask=1  (collide with things, but things don't collide back)
 *  something with no callback (e.g. critter) probably wants bits=1, mask=0
 * 
 * 
 * TODO: could optimize this by doing bipartite checks for certain groups 
 * 		instead of one big collision check for everything
 * 		(IF there's a bottleneck...)
 * 
*/



module.exports = function (noa) {

	return {

		name: 'collideEntities',

		state: {
			collideBits: 1 | 0,
			collideMask: 1 | 0,
			callback: null,
			// isCylinder: true,
		},

		onAdd: null,

		onRemove: null,


		system: function entityCollider(dt, states) {
			var ents = noa.ents

			// data struct that boxIntersect looks for
			// - array of [lo, lo, lo, hi, hi, hi] extents
			var intervals = []
			for (var i = 0; i < states.length; i++) {
				var id = states[i].__id
				var dat = ents.getPositionData(id)
				intervals[i] = dat._extents
			}

			// run the intersect library
			boxIntersect(intervals, function intersectHandler(i, j) {
				var istate = states[i]
				var jstate = states[j]

				// todo: implement testing entities as cylinders/spheres?
				// if (!cylinderTest(istate, jstate)) return

				if (istate.collideMask & jstate.collideBits) {
					if (istate.callback) istate.callback(jstate.__id)
				}
				if (jstate.collideMask & istate.collideBits) {
					if (jstate.callback) jstate.callback(istate.__id)
				}
			})

		}


	}
}





