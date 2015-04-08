'use strict';

var createController = require('voxel-fps-controller')
var extend = require('extend')

module.exports = function(noa, opts) {
  return makeControls(noa, opts)
}

/*
 *    Simple wrapper module for the controller library
 *
 *  Also decorate lib with logic to set camera zoom from mouse scrolling
 *
*/

var defaults = {
  babylonCamera: true,  // needed for Babylon.js camera.  TODO: abstractify?
  rotationScale: 0.0025,
  // camera 'zoom' stuff
  minCameraZoom: 0,
  maxCameraZoom: 10,
  cameraZoomStep: 1.5,
}


function makeControls(noa, opts) {
  opts = extend( {}, defaults, opts )
  
  var stateObj = noa.inputs.state
  var controls = createController(opts, stateObj)
  
  controls.zoomMin = opts.minCameraZoom
  controls.zoomMax = opts.maxCameraZoom
  controls.zoomStep = opts.cameraZoomStep
  controls.tickZoom = tickZoom.bind(null, noa)
  
  return controls
}



function tickZoom(noa) {
  // process any (cumulative) scroll inputs and then clear
  var scroll = noa.inputs.state.scrolly
  if (scroll === 0) return
  noa.inputs.state.scrolly = 0
  
  // handle zoom controls
  var self = noa.controls
  var z = noa.rendering.zoomDistance
  z += (scroll>0) ? self.zoomStep : -self.zoomStep
  if (z < self.zoomMin) z = self.zoomMin
  if (z > self.zoomMax) z = self.zoomMax
  noa.rendering.zoomDistance = z
}


