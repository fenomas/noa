'use strict';

var createController = require('voxel-fps-controller')
var extend = require('extend')

module.exports = function(noa, opts) {
  return makeControls(noa, opts)
}

/*
 *
 *    Simple wrapper module for the controller library
 *
*/

var defaults = {
  babylonCamera: true  // needed for Babylon.js camera.  TODO: abstractify?
}


function makeControls(noa, opts) {
  opts = extend( {}, defaults, opts )
  var stateObj = noa.inputs.state
  var controls = createController(opts, stateObj)
  return controls
}





