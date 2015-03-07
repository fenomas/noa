'use strict';

var createController = require('voxel-fps-controller')
var extend = require('extend')

module.exports = function(noa, opts) {
  return makeControls(noa, opts)
}

/*
 *    Simple wrapper module for the controller library
 *
 *  Also adds some logic to zoom camera in and out from player entity
 *
*/

var defaults = {
  babylonCamera: true,  // needed for Babylon.js camera.  TODO: abstractify?
  rotationScale: 0.0025,
  // camera 'zoom' stuff
  minCameraZoom: 0,
  maxCameraZoom: 10,
  cameraZoomSpeed: 1.5
}


function makeControls(noa, opts) {
  opts = extend( {}, defaults, opts )
  var stateObj = noa.inputs.state
  var controls = createController(opts, stateObj)
  setupCameraZoom(noa, opts.minCameraZoom, opts.maxCameraZoom, opts.cameraZoomSpeed)
  return controls
}



// add camera 'zoom' controls on top of what's implemented in fps controls
// on tick, look at mousewheel inputs and tells rendering how to zoom
function setupCameraZoom(noa, min, max, speed) {
  var zoom = min // start at minimum zoom
  var target = zoom
  noa.on('tick', function() {
    var scroll = noa.inputs.state.scrolly
    if (scroll) {
      target += (scroll>0) ? speed : -speed
      if (target<min) target = min
      if (target>max) target = max
    }
    zoom += (target-zoom) * .2
    
    // BUG WORKAROUND - TODO: REMOVE
    zoom += .001*Math.random()
    
    noa.rendering.setCameraZoomLevel(zoom)
  })
}




