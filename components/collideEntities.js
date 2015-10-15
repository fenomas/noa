'use strict';

var boxIntersect = require('box-intersect')

var noa


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

 

module.exports = function (_noa) {
	noa = _noa
	
	return {

		name: 'collide-entities',

		state: {
			collideBits: 1|0,
			collideMask: 1|0,
			callback: null,
		},

		onAdd: null, 

		onRemove: null,
		

		processor: function entityCollider(dt, states) {
			// populate data struct that boxIntersect looks for
			var ints = populateIntervals(states)
			
			// find collisions and call callbacks
			boxIntersect(ints, function (i, j) {
				var istate = states[i]
				var jstate = states[j]
				
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




// implementation:

var intervals = []

function populateIntervals(states) {
	// grow/shrink [lo, lo, hi, hi] array entries
	// optimized to common case where states.length is the same as last time
	while (intervals.length < states.length) {
		intervals.push(new Float32Array(6))
	}
	intervals.length = states.length
	
	var ents = noa.entities
	// populate [lo, lo, lo, hi, hi, hi] arrays
	for (var i = 0; i < states.length; i++) {
		var id = states[i].__id
		var box = ents.getAABB(id)
		var lo = box.base
		var hi = box.max
		var arr = intervals[i]
		for (var j = 0; j < 3; j++) {
			arr[j] = lo[j]
			arr[j + 3] = hi[j]
		}
	}
	
	return intervals
}




