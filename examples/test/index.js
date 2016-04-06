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
	texturePath: 'textures/',
	playerStart: [0.5, 5, 0.5],
	playerHeight: 1.4,
	playerWidth: 0.6,
	playerAutoStep: true,
	useAO: true,
	AOmultipliers: [0.92, 0.8, 0.5],
	reverseAOmultiplier: 1.0,
}



// create engine
var noa = noaEngine(opts)



//		World generation


// block materials
var brownish = [0.45, 0.36, 0.22]
var greenish = [0.1, 0.8, 0.2]
noa.registry.registerMaterial('dirt', brownish, null)
noa.registry.registerMaterial('grass', greenish, null)
var strs = ['a', 'b', 'c', 'd', '1', '2']
for (var i = 0; i < 6; i++) {
	var s = strs[i]
	noa.registry.registerMaterial(s, null, s + '.png')
	noa.registry.registerMaterial('t' + s, null, 't' + s + '.png', true)
}
noa.registry.registerMaterial('water', [0.5, 0.5, 0.8, 0.7], null)


// register block types and their material name
var _id = 1
var dirtID = noa.registry.registerBlock(_id++, 'dirt')
var grassID = noa.registry.registerBlock(_id++, 'grass')
var testID1 = noa.registry.registerBlock(_id++, ['b', 'd', '1', '2', 'c', 'a',])
var testID2 = noa.registry.registerBlock(_id++, ['tb', 'td', 't1', 't2', 'tc', 'ta',],
	null, true, false, false)
var testID3 = noa.registry.registerBlock(_id++, ['1', '2', 'a',])
var waterID = noa.registry.registerBlock(_id++, 'water', null, false, false, true)
var customID = noa.registry.registerObjectBlock(_id++, 'customMesh', null, true, false, false)

// object block mesh
var mesh = BABYLON.Mesh.CreateBox('b', 1, noa.rendering.getScene())
var mat = BABYLON.Matrix.Scaling(0.2, 1, 0.2)
mat.setTranslation(new BABYLON.Vector3(0, 0.5, 0))
mesh.bakeTransformIntoVertices(mat)
noa.registry.registerMesh('customMesh', mesh, null)


// add a listener for when the engine requests a new world chunk
// `data` is an ndarray - see https://github.com/scijs/ndarray
noa.world.on('worldDataNeeded', function(id, data, x, y, z) {
	// populate ndarray with world data (block IDs or 0 for air)
	for (var i = 0; i < data.shape[0]; ++i) {
		for (var k = 0; k < data.shape[2]; ++k) {
			var height = getHeightMap(x + i, z + k)
			for (var j = 0; j < data.shape[1]; ++j) {
				var b = decideBlock(x + i, y + j, z + k, height)
				if (b) data.set(i, j, k, b)
			}
		}
	}
	// pass the finished data back to the game engine
	noa.world.setChunkData(id, data)
})

// worldgen - return a heightmap for a given [x,z]
function getHeightMap(x, z) {
	var xs = 0.8 + 2 * Math.sin(x / 10)
	var zs = 0.4 + 2 * Math.sin(z / 15 + x / 30)
	return xs + zs
}

function decideBlock(x, y, z, height) {
	// flat area to NE
	if (x > 0 && z > 0) {
		var h = 1
		if (z==63 || x==63) h = 20
		return (y < h) ? grassID : 0
	}
	// general stuff
	if (y < height) {
		return (y < 0) ? dirtID : grassID
	} else {
		return (y < 1) ? waterID : 0
	}
}



setTimeout(function() {
	addWorldFeatures()
}, 1000)

function addWorldFeatures() {
	noa.setBlock(testID1, -6, 5, 6)
	noa.setBlock(testID2, -4, 5, 6)
	noa.setBlock(testID3, -2, 5, 6)
	
	var z = 5
	makeRows(10, 5, z, dirtID)
	makeRows(10, 5, z+2, dirtID)
	makeRows(10, 5, z+5, dirtID)
	makeRows(10, 5, z+9, dirtID)
	makeRows(10, 5, z+14, dirtID)
	z += 18
	makeRows(10, 5, z, customID)
	makeRows(10, 5, z+2, customID)
	makeRows(10, 5, z+5, customID)
	makeRows(10, 5, z+9, customID)
	makeRows(10, 5, z+14, customID)
}

function makeRows(length, x, z, block) {
	for (var i = 0; i < length; i++) {
		noa.setBlock(block, x + i, 1, z + i)
		noa.setBlock(block, length * 2 + x - i, 1, z + i)
	}
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

// place block on alt-fire (RMB/E)
noa.inputs.down.on('alt-fire', function() {
	var loc = noa.getTargetBlockAdjacent()
	if (loc) noa.addBlock(pickedID, loc);
})
var pickedID = grassID

// pick block on middle fire (MMB/Q)
noa.inputs.down.on('mid-fire', function() {
	var loc = noa.getTargetBlockPosition()
	if (loc) pickedID = noa.getBlock(loc)
})



