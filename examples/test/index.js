/* globals BABYLON */
'use strict';


/** 
 * Testbed.
*/


var noaEngine = require('../..')

var opts = {
	inverseY: true,
	chunkSize: 32,
	chunkAddDistance: 1,
	chunkRemoveDistance: 3,
	blockTestDistance: 50,
	texturePath: '/textures/',
	playerStart: [0.5, 15, 0.5],
	playerHeight: 1.4,
	playerWidth: 1.0,
	playerAutoStep: true,
	useAO: true,
	AOmultipliers: [0.93, 0.8, 0.5],
	reverseAOmultiplier: 1.0,
}



// create engine
var noa = noaEngine(opts)



//		World generation


// block materials
var brownish = [0.45, 0.36, 0.22]
var greenish = [0.1, 0.8, 0.2]
noa.registry.registerMaterial('dirtMat', brownish, null)
noa.registry.registerMaterial('grassMat', greenish, null)
var strs = ['a', 'b', 'c', 'd', '1', '2']
for (var i = 0; i < 6; i++) {
	var s = strs[i]
	noa.registry.registerMaterial(s, null, s + '.png')
	noa.registry.registerMaterial('t' + s, null, 't' + s + '.png', true)
}


// register block types and their material name
var dirtID = noa.registry.registerBlock('dirt', 'dirtMat')
var grassID = noa.registry.registerBlock('grass', 'grassMat')
var testID1 = noa.registry.registerBlock('test1', ['b', 'd', '1', '2', 'c', 'a',])
var testID2 = noa.registry.registerBlock('test2', ['tb', 'td', 't1', 't2', 'tc', 'ta',], 
	null, true, false, false)

setTimeout(function() {
	noa.setBlock(testID1, -1, 5, 6)
	noa.setBlock(testID2, 1, 5, 6)
}, 500)

// add a listener for when the engine requests a new world chunk
// `data` is an ndarray - see https://github.com/scijs/ndarray
noa.world.on('worldDataNeeded', function(id, data, x, y, z) {
	// populate ndarray with world data (block IDs or 0 for air)
	for (var i = 0; i < data.shape[0]; ++i) {
		for (var k = 0; k < data.shape[2]; ++k) {
			var height = getHeightMap(x + i, z + k)
			for (var j = 0; j < data.shape[1]; ++j) {
				if (y + j < height) {
					if (y + j < 0) data.set(i, j, k, dirtID)
					else data.set(i, j, k, grassID);
				}
			}
		}
	}
	// pass the finished data back to the game engine
	noa.world.setChunkData(id, data)
})

// worldgen - return a heightmap for a given [x,z]
function getHeightMap(x, z) {
	var xs = 0.8 + Math.sin(x / 10)
	var zs = 0.4 + Math.sin(z / 15 + x / 30)
	return xs + zs
}




// 		add a mesh to represent the player


// get the player entity's ID and other info (aabb, size)
var eid = noa.playerEntity
var dat = noa.entities.getPositionData(eid)
var w = dat.width
var h = dat.height

// make a Babylon.js mesh and scale it, etc.
var scene = noa.rendering.getScene()  // Babylon's "Scene" object
var mesh = BABYLON.Mesh.CreateBox('player', 1, scene)
mesh.scaling.x = mesh.scaling.z = w
mesh.scaling.y = h

// offset of mesh relative to the entity's "position" (center of its feet)
var offset = [0, h / 2, 0]

// a "mesh" component to the player entity
noa.entities.addComponent(eid, noa.entities.names.mesh, {
	mesh: mesh,
	offset: offset
})




// 		Interactivity:


// on left mouse, set targeted block to be air
noa.inputs.down.on('fire', function() {
	var loc = noa.getTargetBlockPosition()
	if (loc) noa.setBlock(0, loc);
})

// on right mouse, place some grass
noa.inputs.down.on('alt-fire', function() {
	var loc = noa.getTargetBlockAdjacent()
	if (loc) noa.addBlock(grassID, loc);
})

// add a key binding for "E" to do the same as alt-fire
noa.inputs.bind('alt-fire', 'E')




