
var ndarray = require('ndarray')

// shared references to terrain/object meshers
import TerrainMesher from './terrainMesher'
import objectMesher from './objectMesher'


export default Chunk


/* 
 * 
 *   Chunk
 * 
 *  Stores and manages voxel ids and flags for each voxel within chunk
 * 
 */





/*
 *
 *    Chunk constructor
 *
 */

function Chunk(noa, requestID, i, j, k, size, dataArray) {
    this.noa = noa
    this.isDisposed = false
    this.octreeBlock = null

    // voxel data and properties
    this.requestID = requestID     // id sent to game client
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

    // (re) init references shared among all chunks
    solidLookup = noa.registry._solidityLookup
    opaqueLookup = noa.registry._opacityLookup
    objectLookup = noa.registry._objectLookup
    blockHandlerLookup = noa.registry._blockHandlerLookup

    // makes data for terrain / object meshing
    this._terrainMesh = null
    this._objectBlocks = null
    this._objectSystems = null
    objectMesher.initChunk(this)

    this.isFull = false
    this.isEmpty = false

    // references to neighboring chunks, if they exist (filled in by `world`)
    var narr = Array.from(Array(27), () => null)
    this._neighbors = new ndarray(narr, [3, 3, 3]).lo(1, 1, 1)
    this._neighbors.set(0, 0, 0, this)
    this._neighborCount = 0
    this._maxMeshedNeighbors = 0
    this._timesMeshed = 0

    // passes through voxel contents, calling block handlers etc.
    scanVoxelData(this)
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
    this._terrainDirty = false
    this._objectsDirty = false
    objectMesher.initChunk(this)
    scanVoxelData(this)
}


// Registry lookup references shared by all chunks
var solidLookup
var opaqueLookup
var objectLookup
var blockHandlerLookup









/*
 *
 *    Chunk API
 *
 */

// get/set deal with block IDs, so that this class acts like an ndarray

Chunk.prototype.get = function (x, y, z) {
    return this.voxels.get(x, y, z)
}

Chunk.prototype.getSolidityAt = function (x, y, z) {
    return solidLookup[this.voxels.get(x, y, z)]
}

Chunk.prototype.set = function (x, y, z, newID) {
    var oldID = this.voxels.get(x, y, z)
    var oldIDnum = oldID
    if (newID === oldIDnum) return

    // manage data
    this.voxels.set(x, y, z, newID)

    // voxel lifecycle handling
    if (objectLookup[oldID]) removeObjectBlock(this, x, y, z)
    if (objectLookup[newID]) addObjectBlock(this, newID, x, y, z)
    var hold = blockHandlerLookup[oldIDnum]
    if (hold) callBlockHandler(this, hold, 'onUnset', x, y, z)
    var hnew = blockHandlerLookup[newID]
    if (hnew) callBlockHandler(this, hnew, 'onSet', x, y, z)

    // track full/emptiness and info about terrain
    if (!opaqueLookup[newID]) this.isFull = false
    if (newID !== 0) this.isEmpty = false
    if (affectsTerrain(newID) || affectsTerrain(oldID)) {
        this._terrainDirty = true
    }

    if (this._terrainDirty || this._objectsDirty) {
        this.noa.world._queueChunkForRemesh(this)
    }

    // neighbors only affected if solidity or opacity changed on an edge
    var SOchanged = false
    if (solidLookup[oldID] !== solidLookup[newID]) SOchanged = true
    if (opaqueLookup[oldID] !== opaqueLookup[newID]) SOchanged = true
    if (SOchanged) {
        var edge = this.size - 1
        var iedge = (x === 0) ? -1 : (x < edge) ? 0 : 1
        var jedge = (y === 0) ? -1 : (y < edge) ? 0 : 1
        var kedge = (z === 0) ? -1 : (z < edge) ? 0 : 1
        if (iedge | jedge | kedge) {
            var ivals = (iedge) ? [0, iedge] : [0]
            var jvals = (jedge) ? [0, jedge] : [0]
            var kvals = (kedge) ? [0, kedge] : [0]
            for (var i of ivals) {
                for (var j of jvals) {
                    for (var k of kvals) {
                        if ((i | j | k) === 0) return
                        var nab = this._neighbors.get(i, j, k)
                        if (!nab) return
                        nab._terrainDirty = true
                        this.noa.world._queueChunkForRemesh(nab)
                    }
                }
            }
        }
    }
}






// helper to call handler of a given type at a particular xyz
function callBlockHandler(chunk, handlers, type, x, y, z) {
    var handler = handlers[type]
    if (!handler) return
    handler(chunk.x + x, chunk.y + y, chunk.z + z)
}



// Convert chunk's voxel terrain into a babylon.js mesh
// Used internally, but needs to be public so mesh-building hacks can call it
Chunk.prototype.mesh = function (matGetter, colGetter, ignoreMats, useAO, aoVals, revAoVal) {
    if (!terrainMesher) terrainMesher = new TerrainMesher(this.noa)
    return terrainMesher.meshChunk(this, matGetter, colGetter, ignoreMats, useAO, aoVals, revAoVal)
}

var terrainMesher




// gets called by World when this chunk has been queued for remeshing
Chunk.prototype.updateMeshes = function () {
    var rendering = this.noa.rendering
    var pos = [this.x, this.y, this.z]
    if (this._terrainDirty) {
        if (this._terrainMesh) this._terrainMesh.dispose()
        var mesh = this.mesh()
        if (mesh && mesh.getIndices().length > 0) {
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
        for (var dmesh of meshes) {
            rendering.addMeshToScene(dmesh, true, pos, this)
        }
        this._objectsDirty = false
    }
}







// helpers to determine which blocks are, or can affect, terrain meshes
function affectsTerrain(id) {
    if (id === 0) return false
    if (solidLookup[id]) return true
    return !objectLookup[id]
}









/*
 * 
 *      Init
 * 
 *  Scans voxel data, processing object blocks and setting chunk flags
 * 
*/

function scanVoxelData(chunk) {
    // flags for tracking if chunk is entirely opaque or transparent
    var fullyOpaque = true
    var fullyAir = true
    var hasObj = false

    var voxels = chunk.voxels
    var data = voxels.data
    var len = voxels.shape[0]
    var handlerLookup = blockHandlerLookup
    for (var i = 0; i < len; ++i) {
        for (var j = 0; j < len; ++j) {
            var index = voxels.index(i, j, 0)
            for (var k = 0; k < len; ++k, ++index) {
                var id = data[index]
                // skip air blocks
                if (id === 0) {
                    fullyOpaque = false
                    continue
                }
                fullyOpaque = fullyOpaque && opaqueLookup[id]
                fullyAir = false
                // handle object blocks and handlers
                if (objectLookup[id]) {
                    addObjectBlock(chunk, id, i, j, k)
                    hasObj = true
                }
                var handlers = handlerLookup[id]
                if (handlers) {
                    callBlockHandler(chunk, handlers, 'onLoad', i, j, k)
                }
            }
        }
    }

    chunk.isFull = fullyOpaque
    chunk.isEmpty = fullyAir
    chunk._terrainDirty = !chunk.isEmpty
    chunk._objectsDirty = hasObj
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
    var voxels = chunk.voxels
    var data = voxels.data
    var handlerLookup = blockHandlerLookup
    var len = voxels.shape[0]
    for (var i = 0; i < len; ++i) {
        for (var j = 0; j < len; ++j) {
            var index = voxels.index(i, j, 0)
            for (var k = 0; k < len; ++k, ++index) {
                var id = data[index]
                if (id > 0 && handlerLookup[id]) {
                    callBlockHandler(chunk, handlerLookup[id], type, i, j, k)
                }
            }
        }
    }
}
