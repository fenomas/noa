'use strict';

var extend = require('extend')

module.exports = function (noa, opts) {
	return new CameraController(noa, opts)
}



/*
*    Controller for the camera
*
*/


var defaults = {
	rotationScale: 0.0025,
	inverseY: false,
	
	// zoom stuff
	minCameraZoom: 0,
	maxCameraZoom: 10,
	cameraZoomStep: 1.5,
}


function CameraController(noa, opts) {
	this.noa = noa
	
	// options
	opts = extend({}, defaults, opts)
	this.rotationScale = opts.rotationScale
	this.inverseY = opts.inverseY
	this.zoomMin = opts.minCameraZoom
	this.zoomMax = opts.maxCameraZoom
	this.zoomStep = opts.cameraZoomStep
}




/**
 * On tick, consume scroll inputs and set (target) camera zoom level
 */

CameraController.prototype.tickCamera = function(dt) {
	// process any (cumulative) scroll inputs and then clear
	var scroll = this.noa.inputs.state.scrolly
	if (scroll === 0) return
	this.noa.inputs.state.scrolly = 0

	// handle zoom controls
	var z = this.noa.rendering.zoomDistance
	z += (scroll > 0) ? this.zoomStep : -this.zoomStep
	if (z < this.zoomMin) z = this.zoomMin
	if (z > this.zoomMax) z = this.zoomMax
	this.noa.rendering.zoomDistance = z
}





/**
 * On render, move/rotate the camera based on target and mouse inputs
 */

CameraController.prototype.updateForRender = function () {
	// input state
	var state = this.noa.inputs.state

	// Rotation: translate dx/dy inputs into y/x axis camera angle changes
	var dx = this.rotationScale * state.dy * ((this.inverseY) ? -1 : 1)
	var dy = this.rotationScale * state.dx
	
	// normalize/clamp/update
	var camrot = this.noa.rendering.getCameraRotation() // [x,y]
	var rotX = clamp(camrot[0] + dx, rotXcutoff)
	var rotY = (camrot[1] + dy) % (Math.PI*2)
	this.noa.rendering.setCameraRotation(rotX, rotY)
	
}

var rotXcutoff = (Math.PI/2) - .0001 // engines can be weird when xRot == pi/2

function clamp(value, to) {
	return isFinite(to) ? Math.max(Math.min(value, to), -to) : value
}




