'use strict'

var vec3 = require('gl-vec3')
var shadowDist

module.exports = function (noa, dist) {

	shadowDist = dist

	// create a mesh to re-use for shadows
	var scene = noa.rendering.getScene()
	var disc = BABYLON.Mesh.CreateDisc('shadow', 0.75, 30, scene)
	disc.rotation.x = Math.PI / 2
	disc.material = noa.rendering.makeStandardMaterial('shadowMat')
	disc.material.diffuseColor = BABYLON.Color3.Black()
	disc.material.ambientColor = BABYLON.Color3.Black()
	disc.material.alpha = 0.5
	disc.setEnabled(false)

	// source mesh needn't be in the scene graph
	scene.removeMesh(disc)


	return {

		name: 'shadow',

		state: {
			size: 0.5,
			_mesh: null,
		},


		onAdd: function (eid, state) {
			state._mesh = noa.rendering.makeMeshInstance(disc, false)
		},


		onRemove: function (eid, state) {
			state._mesh.dispose()
		},


		system: function shadowSystem(dt, states) {
			var cpos = noa.rendering.getCameraPosition()
			vec3.set(camPos, cpos.x, cpos.y, cpos.z)
			var dist = shadowDist
			for (var i = 0; i < states.length; i++) {
				var state = states[i]
				updateShadowHeight(state.__id, state._mesh, state.size, dist, noa)
			}
		},


		renderSystem: function (dt, states) {
			// before render adjust shadow x/z to render positions
			for (var i = 0; i < states.length; ++i) {
				var state = states[i]
				var rpos = noa.ents.getPositionData(state.__id).renderPosition
				var spos = state._mesh.position
				spos.x = rpos[0]
				spos.z = rpos[2]
			}
		}




	}
}

var down = vec3.fromValues(0, -1, 0)
var camPos = vec3.fromValues(0, 0, 0)
var shadowPos = vec3.fromValues(0, 0, 0)

function updateShadowHeight(id, mesh, size, shadowDist, noa) {
	var ents = noa.entities
	var dat = ents.getPositionData(id)
	var loc = dat.position
	var b = ents.getPhysicsBody(id)
	var y
	// set to entity position if entity standing on ground
	if (b.resting[1] < 0) {
		y = dat.renderPosition[1]
	} else {
		var pick = noa.pick(loc, down, shadowDist)
		if (pick) y = pick.position[1]
	}
	if (y !== undefined) {
		y = Math.round(y) // pick results get slightly countersunk
		// set shadow slightly above ground to avoid z-fighting
		vec3.set(shadowPos, mesh.position.x, y, mesh.position.z)
		var sqdist = vec3.squaredDistance(camPos, shadowPos)
		// offset ~ 0.01 for nearby shadows, up to 0.1 at distance of ~40
		var offset = 0.01 + 0.1 * (sqdist / 1600)
		if (offset > 0.1) offset = 0.1
		mesh.position.y = y + offset
		// set shadow scale
		var dist = loc[1] - y
		var scale = size * 0.7 * (1 - dist / shadowDist)
		mesh.scaling.copyFromFloats(scale, scale, scale)
		mesh.setEnabled(true)
	} else {
		mesh.setEnabled(false)
	}
}


