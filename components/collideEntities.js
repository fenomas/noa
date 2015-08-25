'use strict';

var boxIntersect = require('box-intersect')

var intervals = [],
	ids = [],
	idToi = []

module.exports = function (noa) {
	return {

		name: 'collide-entities',

		state: {
			callback: null
		},

		onAdd: function (eid, state) {
			// add collide handler for physics engine to call
			var ents = noa.entities
			if (ents.hasComponent(eid, ents.components.physics)) {
				var body = ents.getPhysicsBody(eid)
				body.onCollide = function (impulse) {
					var cb = ents.getData(eid, 'collide-terrain').callback
					if (cb) cb(impulse, eid)
				}
			}
		},

		onRemove: function (eid, state) {
			var ents = noa.entities
			if (ents.hasComponent(eid, ents.components.physics)) {
				ents.getPhysicsBody(eid).onCollide = null
			}
		},


		processor: function entityCollider(dt, states) {
			// populate data struct that boxIntersect looks for
			populateIntervals(intervals, ids, idToi, states, noa.entities)
			// find collisions and call callbacks
			var collideEnt = noa.entities.components.collideEntities
			boxIntersect(intervals, function (i, j) {
				var iid = ids[i]
				var jid = ids[j]
				// var ihandler = states[idToi[iid]].callback
				var ihandler = noa.entities.getData(iid, collideEnt).callback
				if (ihandler) ihandler(iid, jid)
				// var jhandler = states[idToi[jid]].callback
				var jhandler = noa.entities.getData(jid, collideEnt).callback
				if (jhandler) jhandler(jid, iid)
				// if (iid==0 || jid==0) throw new Error()
			})
		}



	}
}


// implementation:

function populateIntervals(intervals, ids, idToi, states, entitites) {
	// grow/shrink [lo, lo, hi, hi] array entries
	// optimized to common case where states.length is the same as last time
	while (intervals.length < states.length) {
		intervals.push(new Float32Array(6))
	}
	intervals.length = states.length
	ids.length = states.length
	idToi.length = states.length
	// populate [lo, lo, lo, hi, hi, hi] arrays
	for (var i = 0; i < states.length; i++) {
		var id = states[i].__id
		var box = entitites.getAABB(id)
		var lo = box.base
		var hi = box.max
		var arr = intervals[i]
		for (var j = 0; j < 3; j++) {
			arr[j] = lo[j]
			arr[j + 3] = hi[j]
		}
		ids[i] = id
		idToi[id] = i
	}
}



