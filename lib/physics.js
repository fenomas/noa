'use strict'

var createPhysics = require('voxel-physics-engine')
var vec3 = require('gl-vec3')
var extend = require('extend')

module.exports = function (noa, opts) {
	return makePhysics(noa, opts)
}

/*
*
*    Simple wrapper module for the physics library
*
*/


var defaults = {
	gravity: [0, -10, 0],
	airFriction: 0.999
}


function makePhysics(noa, opts) {
	opts = extend({}, defaults, opts)
	var world = noa.world
	var blockGetter = function (x, y, z) { return world.getBlockSolidity(x, y, z) }
	var isFluidGetter = function (x, y, z) { return world.getBlockFluidity(x, y, z) }
	var physics = createPhysics(opts, blockGetter, isFluidGetter)

	// Wrap `tick` function with one that steps the engine, 
	// then updates all `position` components
	physics._originalTick = physics.tick
	physics.tick = function (dt) {
		this._originalTick(dt)
		updatePositionsFromAABBs(noa)
	}

	return physics
}



function updatePositionsFromAABBs(noa) {
	var ents = noa.ents
	var states = ents.getStatesList(ents.names.physics)
	var vec = _tempvec
	for (var i = 0; i < states.length; ++i) {
		var phys = states[i]
		var pdat = ents.getPositionData(phys.__id)
		vec[0] = pdat.width / 2
		vec[1] = 0
		vec[2] = vec[0]
		var pos = pdat.position
		var base = phys.body.aabb.base
		var max = phys.body.aabb.max
		var ext = pdat._extents
		for (var j = 0; j < 3; j++) {
			pos[j] = base[j] + vec[j]
			ext[j] = base[j]
			ext[j + 3] = max[j]
		}
	}
}

var _tempvec = vec3.create()


