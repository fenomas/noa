'use strict'

module.exports = function (noa, opts) {
	return new CameraController(noa, opts)
}



/*
*    Controller for the camera
*
*/


var defaults = {
	rotationScaleX: 0.0025,
	rotationScaleY: 0.0025,
	inverseY: false,
}


function CameraController(noa, opts) {
	this.noa = noa

	// options
	opts = Object.assign({}, defaults, opts)
	this.rotationScaleX = opts.rotationScaleX
	this.rotationScaleY = opts.rotationScaleY
	this.inverseY = opts.inverseY
}





/**
 * On render, move/rotate the camera based on target and mouse inputs
 */

CameraController.prototype.updateForRender = function () {
	// input state
	var state = this.noa.inputs.state

	// TODO: REMOVE EVENTUALLY
	bugFix(state)

	// Rotation: translate dx/dy inputs into y/x axis camera angle changes
	var dx = this.rotationScaleY * state.dy * ((this.inverseY) ? -1 : 1)
	var dy = this.rotationScaleX * state.dx

	// normalize/clamp/update
	var camrot = this.noa.rendering.getCameraRotation() // [x,y]
	var rotX = clamp(camrot[0] + dx, rotXcutoff)
	var rotY = (camrot[1] + dy) % (Math.PI * 2)
	this.noa.rendering.setCameraRotation(rotX, rotY)

}

var rotXcutoff = (Math.PI / 2) - .0001 // engines can be weird when xRot == pi/2

function clamp(value, to) {
	return isFinite(to) ? Math.max(Math.min(value, to), -to) : value
}



// workaround for this Chrome 63 + Win10 bug
// https://bugs.chromium.org/p/chromium/issues/detail?id=781182
function bugFix(state) {
	var dx = state.dx
	var dy = state.dy
	var wval = document.body.clientWidth / 6
	var hval = document.body.clientHeight / 6
	var badx = (Math.abs(dx) > wval && (dx / lastx) < -1)
	var bady = (Math.abs(dy) > hval && (dy / lasty) < -1)
	if (badx || bady) {
		state.dx = lastx
		state.dy = lasty
		lastx = (dx > 0) ? 1 : -1
		lasty = (dy > 0) ? 1 : -1
	} else {
		if (dx) lastx = dx
		if (dy) lasty = dy
	}
}

var lastx = 0
var lasty = 0


