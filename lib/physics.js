'use strict';

var createPhysics = require('voxel-physics-engine')
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
	physics.tick = function(dt) {
		this._originalTick(dt)
		updatePositionsFromAABBs(noa)
	}
	
	return physics
}



function updatePositionsFromAABBs(noa) {
	var states = noa.ents.getStatesList('position')
	for (var i = 0; i < states.length; ++i) {
		var pos = states[i]
		pos.updateFromAABB()
	}	
}


