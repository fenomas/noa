
import { LocationQueue } from './util'
import ndarray from 'ndarray'




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

/** @param {import('../index').Engine} noa */
export function Chunk(noa, requestID, ci, cj, ck, size, dataArray, fillVoxelID = -1) {
    this.noa = noa
    this.isDisposed = false

    // arbitrary data passed in by client when generating world
    this.userData = null

    // voxel data and properties
    this.requestID = requestID     // id sent to game client
    this.voxels = dataArray
    this.i = ci
    this.j = cj
    this.k = ck
    this.size = size
    this.x = ci * size
    this.y = cj * size
    this.z = ck * size
    this.pos = [this.x, this.y, this.z]

    // flags to track if things need re-meshing
    this._terrainDirty = false
    this._objectsDirty = false

    // inits state of terrain / object meshing
    this._terrainMeshes = []
    noa._terrainMesher.initChunk(this)
    noa._objectMesher.initChunk(this)

    this._isFull = false
    this._isEmpty = false

    this._wholeLayerVoxel = Array(size).fill(-1)
    if (fillVoxelID >= 0) {
        this.voxels.data.fill(fillVoxelID, 0, this.voxels.size)
        this._wholeLayerVoxel.fill(fillVoxelID)
    }

    // references to neighboring chunks, if they exist (filled in by `world`)
    var narr = Array.from(Array(27), () => null)
    this._neighbors = ndarray(narr, [3, 3, 3]).lo(1, 1, 1)
    this._neighbors.set(0, 0, 0, this)
    this._neighborCount = 0
    this._timesMeshed = 0

    // location queue of voxels in this chunk with block handlers (assume it's rare)
    /** @internal */
    this._blockHandlerLocs = new LocationQueue()

    // passes through voxel contents, calling block handlers etc.
    scanVoxelData(this)
}


// expose logic internally to create and update the voxel data array
Chunk._createVoxelArray = function (size) {
    var arr = new Uint16Array(size * size * size)
    return ndarray(arr, [size, size, size])
}

Chunk.prototype._updateVoxelArray = function (dataArray, fillVoxelID = -1) {
    // dispose current object blocks
    callAllBlockHandlers(this, 'onUnload')
    this.noa._objectMesher.disposeChunk(this)
    this.noa._terrainMesher.disposeChunk(this)
    this.voxels = dataArray
    this._terrainDirty = false
    this._objectsDirty = false
    this._blockHandlerLocs.empty()
    this.noa._objectMesher.initChunk(this)
    this.noa._terrainMesher.initChunk(this)

    if (fillVoxelID >= 0) {
        this._wholeLayerVoxel.fill(fillVoxelID)
    } else {
        this._wholeLayerVoxel.fill(-1)
    }

    scanVoxelData(this)
}








/*
 *
 *    Chunk API
 *
 */

// get/set deal with block IDs, so that this class acts like an ndarray

Chunk.prototype.get = function (i, j, k) {
    return this.voxels.get(i, j, k)
}

Chunk.prototype.getSolidityAt = function (i, j, k) {
    var solidLookup = this.noa.registry._solidityLookup
    return solidLookup[this.voxels.get(i, j, k)]
}

Chunk.prototype.set = function (i, j, k, newID) {
    var oldID = this.voxels.get(i, j, k)
    if (newID === oldID) return

    // update voxel data
    this.voxels.set(i, j, k, newID)

    // lookup tables from registry, etc
    var solidLookup = this.noa.registry._solidityLookup
    var objectLookup = this.noa.registry._objectLookup
    var opaqueLookup = this.noa.registry._opacityLookup
    var handlerLookup = this.noa.registry._blockHandlerLookup

    // track invariants about chunk data
    if (!opaqueLookup[newID]) this._isFull = false
    if (newID !== 0) this._isEmpty = false
    if (this._wholeLayerVoxel[j] !== newID) this._wholeLayerVoxel[j] = -1

    // voxel lifecycle handling
    var hold = handlerLookup[oldID]
    var hnew = handlerLookup[newID]
    if (hold) callBlockHandler(this, hold, 'onUnset', i, j, k)
    if (hnew) {
        callBlockHandler(this, hnew, 'onSet', i, j, k)
        this._blockHandlerLocs.add(i, j, k)
    } else {
        this._blockHandlerLocs.remove(i, j, k)
    }

    // track object block states
    var objMesher = this.noa._objectMesher
    var objOld = objectLookup[oldID]
    var objNew = objectLookup[newID]
    if (objOld) objMesher.setObjectBlock(this, 0, i, j, k)
    if (objNew) objMesher.setObjectBlock(this, newID, i, j, k)

    // decide dirtiness states
    var solidityChanged = (solidLookup[oldID] !== solidLookup[newID])
    var opacityChanged = (opaqueLookup[oldID] !== opaqueLookup[newID])
    var wasTerrain = !objOld && (oldID !== 0)
    var nowTerrain = !objNew && (newID !== 0)

    if (objOld || objNew) this._objectsDirty = true
    if (solidityChanged || opacityChanged || wasTerrain || nowTerrain) {
        this._terrainDirty = true
    }

    if (this._terrainDirty || this._objectsDirty) {
        this.noa.world._queueChunkForRemesh(this)
    }

    // neighbors only affected if solidity or opacity changed on an edge
    if (solidityChanged || opacityChanged) {
        var edge = this.size - 1
        var imin = (i === 0) ? -1 : 0
        var jmin = (j === 0) ? -1 : 0
        var kmin = (k === 0) ? -1 : 0
        var imax = (i === edge) ? 1 : 0
        var jmax = (j === edge) ? 1 : 0
        var kmax = (k === edge) ? 1 : 0
        for (var ni = imin; ni <= imax; ni++) {
            for (var nj = jmin; nj <= jmax; nj++) {
                for (var nk = kmin; nk <= kmax; nk++) {
                    if ((ni | nj | nk) === 0) continue
                    var nab = this._neighbors.get(ni, nj, nk)
                    if (!nab) continue
                    nab._terrainDirty = true
                    this.noa.world._queueChunkForRemesh(nab)
                }
            }
        }
    }
}



// helper to call handler of a given type at a particular xyz
function callBlockHandler(chunk, handlers, type, i, j, k) {
    var handler = handlers[type]
    if (!handler) return
    handler(chunk.x + i, chunk.y + j, chunk.z + k)
}


// gets called by World when this chunk has been queued for remeshing
Chunk.prototype.updateMeshes = function () {
    if (this._terrainDirty) {
        this.noa._terrainMesher.meshChunk(this)
        this._timesMeshed++
        this._terrainDirty = false
    }
    if (this._objectsDirty) {
        this.noa._objectMesher.buildObjectMeshes()
        this._objectsDirty = false
    }
}












/*
 * 
 *      Init
 * 
 *  Scans voxel data, processing object blocks and setting chunk flags
 * 
*/

function scanVoxelData(chunk) {
    var voxels = chunk.voxels
    var data = voxels.data
    var len = voxels.shape[0]
    var opaqueLookup = chunk.noa.registry._opacityLookup
    var handlerLookup = chunk.noa.registry._blockHandlerLookup
    var objectLookup = chunk.noa.registry._objectLookup
    var plainLookup = chunk.noa.registry._blockIsPlainLookup
    var objMesher = chunk.noa._objectMesher

    // flags for tracking if chunk is entirely opaque or transparent
    var fullyOpaque = true
    var fullyAir = true

    // scan vertically..
    for (var j = 0; j < len; ++j) {

        // fastest case where whole layer is air/dirt/etc
        var layerID = chunk._wholeLayerVoxel[j]
        if (layerID >= 0 && !objMesher[layerID] && !handlerLookup[layerID]) {
            if (!opaqueLookup[layerID]) fullyOpaque = false
            if (layerID !== 0) fullyAir = false
            continue
        }

        var constantID = voxels.get(0, j, 0)

        for (var i = 0; i < len; ++i) {
            var index = voxels.index(i, j, 0)
            for (var k = 0; k < len; ++k, ++index) {
                var id = data[index]

                // detect constant layer ID if there is one
                if (constantID >= 0 && id !== constantID) constantID = -1

                // most common cases: air block...
                if (id === 0) {
                    fullyOpaque = false
                    continue
                }
                // ...or plain boring block (no mesh, handlers, etc)
                if (plainLookup[id]) {
                    fullyAir = false
                    continue
                }
                // otherwise check opacity, object mesh, and handlers
                fullyOpaque = fullyOpaque && opaqueLookup[id]
                fullyAir = false
                if (objectLookup[id]) {
                    objMesher.setObjectBlock(chunk, id, i, j, k)
                    chunk._objectsDirty = true
                }
                var handlers = handlerLookup[id]
                if (handlers) {
                    chunk._blockHandlerLocs.add(i, j, k)
                    callBlockHandler(chunk, handlers, 'onLoad', i, j, k)
                }
            }
        }

        if (constantID >= 0) chunk._wholeLayerVoxel[j] = constantID
    }

    chunk._isFull = fullyOpaque
    chunk._isEmpty = fullyAir
    chunk._terrainDirty = !chunk._isEmpty
}










// dispose function - just clears properties and references

Chunk.prototype.dispose = function () {
    // look through the data for onUnload handlers
    callAllBlockHandlers(this, 'onUnload')
    this._blockHandlerLocs.empty()

    // let meshers dispose their stuff
    this.noa._objectMesher.disposeChunk(this)
    this.noa._terrainMesher.disposeChunk(this)

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
    var handlerLookup = chunk.noa.registry._blockHandlerLookup
    chunk._blockHandlerLocs.arr.forEach(([i, j, k]) => {
        var id = voxels.get(i, j, k)
        callBlockHandler(chunk, handlerLookup[id], type, i, j, k)
    })
}
