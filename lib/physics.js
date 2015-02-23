'use strict';

var createPhysics = require('voxel-physics-engine')
var extend = require('extend')

module.exports = function(noa, opts) {
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
  opts = extend( {}, defaults, opts )
  var blockGetter = noa.world.getBlock.bind( noa.world )
  var physics = createPhysics(opts, blockGetter)
  return physics
}





