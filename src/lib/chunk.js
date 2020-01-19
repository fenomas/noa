
var ndarray = require('ndarray')

// shared references to terrain/object meshers
import terrainMesher from './terrainMesher'
import objectMesher from './objectMesher'
import { constants } from './constants'


export default Chunk


/* 
 * 
 *   Chunk
 * 
 *  Stores and manages voxel ids and flags for each voxel within chunk
 *  See constants.js for internal data representation
 * 
 */



// data representation
var ID_MASK = constants.ID_MASK
// var VAR_MASK = constants.VAR_MASK // NYI
var SOLID_BIT = constants.SOLID_BIT
var OPAQUE_BIT = constants.OPAQUE_BIT
var OBJECT_BIT = constants.OBJECT_BIT




/*
 *
 *    Chunk constructor
 *
 */

function Chunk(noa, id, i, j, k, size, dataArray) {
    this.id = id            // id used by noa
    this.requestID = ''     // id sent to game client

    this.noa = noa
    this.isDisposed = false
    this.octreeBlock = null

    this.isEmpty = false
    this.isFull = false

    // voxel data and properties
    this.voxels = dataArray
    this.i = i
    this.j = j
    this.k = k
    this.size = size
    this.x = i * size
    this.y = j * size
    this.z = k * size

    // flags to track if things need re-meshing
    this._terrainDirty = false
    this._objectsDirty = false

    // init references shared among all chunks
    setBlockLookups(noa)

    // makes data for terrain / object meshing
    this._terrainMesh = null
    this._objectBlocks = null
    this._objectSystems = null
    objectMesher.initChunk(this)

    // references to neighboring chunks, if they exist (filled in by `world`)
    var narr = Array.from(Array(27)).map(() => null)
    this._neighbors = new ndarray(narr, [3, 3, 3]).lo(1, 1, 1)
    this._neighbors.set(0, 0, 0, this)
    this._neighborCount = 0
    this._maxMeshedNeighbors = 0
    this._timesMeshed = 0

    // converts raw voxelID data into packed ID+solidity etc.
    packVoxelData(this)
}


// expose logic internally to create and update the voxel data array
Chunk._createVoxelArray = function (size) {
    var arr = new Uint16Array(size * size * size)
    return new ndarray(arr, [size, size, size])
}

Chunk.prototype._updateVoxelArray = function (dataArray) {
    // dispose current object blocks
    callAllBlockHandlers(this, 'onUnload')
    objectMesher.disposeChunk(this)
    this.voxels = dataArray
    this._terrainDirty = true
    this._objectsDirty = true
    objectMesher.initChunk(this)
    packVoxelData(this)
}


// Registry lookup references shared by all chunks
var solidLookup
var opaqueLookup
var objectMeshLookup
var blockHandlerLookup

function setBlockLookups(noa) {
    solidLookup = noa.registry._solidityLookup
    opaqueLookup = noa.registry._opacityLookup
    objectMeshLookup = noa.registry._blockMeshLookup
    blockHandlerLookup = noa.registry._blockHandlerLookup
}








/*
 *
 *    Chunk API
 *
 */

// get/set deal with block IDs, so that this class acts like an ndarray

Chunk.prototype.get = function (x, y, z) {
    return ID_MASK & this.voxels.get(x, y, z)
}

Chunk.prototype.getSolidityAt = function (x, y, z) {
    return (SOLID_BIT & this.voxels.get(x, y, z)) ? true : false
}

Chunk.prototype.set = function (x, y, z, id, paddingUpdate) {
    var oldID = this.voxels.get(x, y, z)
    var oldIDnum = oldID & ID_MASK
    if (id === oldIDnum) return

    // manage data
    var newID = packID(id)
    this.voxels.set(x, y, z, newID)

    // voxel lifecycle handling
    if (oldID & OBJECT_BIT) removeObjectBlock(this, x, y, z)
    if (newID & OBJECT_BIT) addObjectBlock(this, id, x, y, z)
    callBlockHandler(this, oldIDnum, 'onUnset', x, y, z)
    callBlockHandler(this, id, 'onSet', x, y, z)

    // track full/emptyness
    if (newID !== 0) this.isEmpty = false
    if (!(newID & OPAQUE_BIT)) this.isFull = false

    // mark terrain dirty unless neither block was terrain
    if (isTerrain(oldID) || isTerrain(newID)) {
        this._terrainDirty = true
        this.noa.world._queueChunkForRemesh(this)
    }

    // neighbors only affected if solidity or opacity changed on an edge
    var prevSO = oldID & (SOLID_BIT | OPAQUE_BIT)
    var newSO = newID & (SOLID_BIT | OPAQUE_BIT)
    if (newSO !== prevSO) {
        var edge = this.size - 1

        var iedge = (x === 0) ? -1 : (x < edge) ? 0 : 1
        var jedge = (y === 0) ? -1 : (y < edge) ? 0 : 1
        var kedge = (z === 0) ? -1 : (z < edge) ? 0 : 1
        if (iedge | jedge | kedge) {
            var is = (iedge) ? [0, iedge] : [0]
            var js = (jedge) ? [0, jedge] : [0]
            var ks = (kedge) ? [0, kedge] : [0]
            is.forEach(i => {
                js.forEach(j => {
                    ks.forEach(k => {
                        if ((i | j | k) === 0) return
                        var nab = this._neighbors.get(i, j, k)
                        if (!nab) return
                        nab._terrainDirty = true
                        this.noa.world._queueChunkForRemesh(nab)
                    })
                })
            })
        }
    }
}






// helper to call handler of a given type at a particular xyz
function callBlockHandler(chunk, blockID, type, x, y, z) {
    var hobj = blockHandlerLookup[blockID]
    if (!hobj) return
    var handler = hobj[type]
    if (!handler) return
    handler(chunk.x + x, chunk.y + y, chunk.z + z)
}



// Convert chunk's voxel terrain into a babylon.js mesh
// Used internally, but needs to be public so mesh-building hacks can call it
Chunk.prototype.mesh = function (matGetter, colGetter, useAO, aoVals, revAoVal) {
    return terrainMesher.meshChunk(this, matGetter, colGetter, useAO, aoVals, revAoVal)
}





// gets called by World when this chunk has been queued for remeshing
Chunk.prototype.updateMeshes = function () {
    var rendering = this.noa.rendering
    if (this._terrainDirty) {
        if (this._terrainMesh) this._terrainMesh.dispose()
        var mesh = this.mesh()
        if (mesh && mesh.getIndices().length > 0) {
            var pos = [this.x, this.y, this.z]
            rendering.addMeshToScene(mesh, true, pos, this)
        }
        this._terrainMesh = mesh || null
        this._terrainDirty = false
        this._timesMeshed++
        this._maxMeshedNeighbors = Math.max(this._maxMeshedNeighbors, this._neighborCount)
    }
    if (this._objectsDirty) {
        objectMesher.removeObjectMeshes(this)
        var meshes = objectMesher.buildObjectMeshes(this)
        var pos2 = [this.x, this.y, this.z]
        meshes.forEach(mesh => rendering.addMeshToScene(mesh, true, pos2, this))
        this._objectsDirty = false
    }
}







// helper to determine if a block counts as "terrain" (non-air, non-object)
function isTerrain(id) {
    if (id === 0) return false
    // treat object blocks as terrain if solid (they affect AO)
    if (id & OBJECT_BIT) return !!(id & SOLID_BIT)
    return true
}

// helper to pack a block ID into the internally stored form, given lookup tables
function packID(id) {
    var newID = id
    if (solidLookup[id]) newID |= SOLID_BIT
    if (opaqueLookup[id]) newID |= OPAQUE_BIT
    if (objectMeshLookup[id]) newID |= OBJECT_BIT
    return newID
}








/*
 * 
 *      Init
 * 
 *  Converts raw voxel ID data into packed ID + solidity etc.
 * 
*/

function packVoxelData(chunk) {
    // flags for tracking if chunk is entirely opaque or transparent
    var fullyOpaque = OPAQUE_BIT
    var fullyAir = true

    var arr = chunk.voxels
    var len = arr.shape[0]
    for (var i = 0; i < len; ++i) {
        for (var j = 0; j < len; ++j) {
            for (var k = 0; k < len; ++k) {
                // pull raw ID - could in principle be packed, so mask it
                var index = arr.index(i, j, k)
                var id = arr.data[index] & ID_MASK
                // skip air blocks
                if (id === 0) {
                    fullyOpaque = 0
                    continue
                }
                // store ID as packed internal representation
                var packed = packID(id) | 0
                arr.data[index] = packed
                fullyOpaque &= packed
                fullyAir = false
                // within unpadded view, handle object blocks and handlers
                if (OBJECT_BIT & packed) {
                    addObjectBlock(chunk, id, i, j, k)
                }
                callBlockHandler(chunk, id, 'onLoad', i, j, k)
            }
        }
    }

    chunk.isFull = !!(fullyOpaque & OPAQUE_BIT)
    chunk.isEmpty = !!(fullyAir)
    chunk._terrainDirty = !(chunk.isFull || chunk.isEmpty)
}





// accessors related to meshing

function addObjectBlock(chunk, id, x, y, z) {
    objectMesher.addObjectBlock(chunk, id, x, y, z)
    chunk._objectsDirty = true
}

function removeObjectBlock(chunk, x, y, z) {
    objectMesher.removeObjectBlock(chunk, x, y, z)
    chunk._objectsDirty = true
}





// dispose function - just clears properties and references

Chunk.prototype.dispose = function () {
    // look through the data for onUnload handlers
    callAllBlockHandlers(this, 'onUnload')

    // let meshers dispose their stuff
    objectMesher.disposeChunk(this)
    if (this._terrainMesh) this._terrainMesh.dispose()

    // apparently there's no way to dispose typed arrays, so just null everything
    this.voxels.data = null
    this.voxels = null
    this._neighbors.data = null
    this._neighbors = null

    this.isDisposed = true
}


// helper to call a given handler for all blocks in the chunk
function callAllBlockHandlers(chunk, type) {
    var arr = chunk.voxels
    var size = arr.shape[0]
    for (var i = 0; i < size; ++i) {
        for (var j = 0; j < size; ++j) {
            for (var k = 0; k < size; ++k) {
                var id = ID_MASK & arr.get(i, j, k)
                if (id > 0) callBlockHandler(chunk, id, type, i, j, k)
            }
        }
    }
}
