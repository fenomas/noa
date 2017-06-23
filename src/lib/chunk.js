'use strict'

var constants = require('./constants')
var ndarray = require('ndarray')
var TerrainMesher = require('./terrainMesher')


window.ndarray = ndarray

module.exports = Chunk






/* 
 * 
 *   BabylonJS Voxel Chunk
 * 
 *  Stores and manages voxel ids and flags for each voxel within chunk
 *  See constants.js for internal data representation
 * 
*/


// enable for profiling..
var PROFILE = 0


// data representation
var ID_MASK = constants.ID_MASK
var VAR_MASK = constants.VAR_MASK
var SOLID_BIT = constants.SOLID_BIT
var OPAQUE_BIT = constants.OPAQUE_BIT
var OBJECT_BIT = constants.OBJECT_BIT




/*
 *
 *    Chunk constructor
 *
*/

function Chunk(noa, id, i, j, k, size) {
    this.id = id

    this.noa = noa
    this.isDisposed = false
    this.isGenerated = false
    this.inInvalid = false

    this.isEmpty = false
    this.isFull = false

    // packed data storage
    var s = size + 2 // 1 block of padding on each side
    var arr = new Uint16Array(s * s * s)
    this.array = new ndarray(arr, [s, s, s])
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
    initShared(noa)

    // build unpadded and transposed array views for internal use
    rebuildArrayViews(this)

    // storage for block for selection octree
    this.octreeBlock = null

    // storage for list of known object meshes
    this._objectMeshes = {}
}



// Registry lookup references shared by all chunks
var solidLookup
var opaqueLookup
var objectMeshLookup
var blockHandlerLookup

function initShared(noa) {
    solidLookup = noa.registry._blockSolidity
    opaqueLookup = noa.registry._blockOpacity
    objectMeshLookup = noa.registry._blockMesh
    blockHandlerLookup = noa.registry._blockHandlers
}




/*
 *
 *    Chunk API
 *
*/

// get/set deal with block IDs, so that this class acts like an ndarray

Chunk.prototype.get = function (x, y, z) {
    return ID_MASK & this._unpaddedView.get(x, y, z)
}

Chunk.prototype.getSolidityAt = function (x, y, z) {
    return (SOLID_BIT & this._unpaddedView.get(x, y, z)) ? true : false
}

Chunk.prototype.set = function (x, y, z, id) {
    var oldID = this._unpaddedView.get(x, y, z)
    var oldIDnum = oldID & ID_MASK
    if (id === oldIDnum) return

    // manage data
    var newID = packID(id)
    this._unpaddedView.set(x, y, z, newID)

    // handle object meshes
    if (oldID & OBJECT_BIT) removeObjectMeshAt(this, x, y, z)
    if (newID & OBJECT_BIT) addObjectMeshAt(this, id, x, y, z)

    // track full/emptyness
    if (newID !== 0) this.isEmpty = false
    if (!(newID & OPAQUE_BIT)) this.isFull = false

    // call block handlers
    callBlockHandler(this, oldIDnum, 'onUnset', x, y, z)
    callBlockHandler(this, id, 'onSet', x, y, z)

    // mark terrain dirty unless neither block was terrain
    if (isTerrain(oldID) || isTerrain(newID)) this._terrainDirty = true
}






// helper to call handler of a given type at a particular xyz

function callBlockHandler(chunk, blockID, type, x, y, z) {
    var hobj = blockHandlerLookup[blockID]
    if (!hobj) return
    var handler = hobj[type]
    if (!handler) return
    // ignore all handlers if block is in chunk's edge padding blocks
    var s = chunk.size
    if (x < 0 || y < 0 || z < 0 || x >= s || y >= s || z >= s) return
    handler(chunk.x + x, chunk.y + y, chunk.z + z)
}



// Mesh self into a babylon JS mesh
Chunk.prototype.mesh = function (matGetter, colGetter, useAO, aoVals, revAoVal) {
    if (!terrainMesher) terrainMesher = new TerrainMesher(this.noa)
    return terrainMesher.meshChunk(this, matGetter, colGetter, useAO, aoVals, revAoVal)
}

// one terrainMesher instance for all chunks
var terrainMesher




// gets called by World when this chunk has been queued for remeshing
Chunk.prototype.updateMeshes = function () {
    if (this._terrainDirty) {
        this.noa.rendering.removeTerrainMesh(this)
        var mesh = this.mesh()
        if (mesh) this.noa.rendering.addTerrainMesh(this, mesh)
        this._terrainDirty = false
    }
    if (this._objectsDirty) {
        this.processObjectMeshes()
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
 *  Gets called right after client filled the voxel ID data array
*/



Chunk.prototype.initData = function () {
    // remake other views, assuming that data has changed
    rebuildArrayViews(this)
    // flags for tracking if chunk is entirely opaque or transparent
    var fullyOpaque = OPAQUE_BIT
    var fullyAir = true

    // init everything in one big scan
    var arr = this.array
    var data = arr.data
    var len = arr.shape[0]
    var kstride = arr.stride[2]
    var objHash = this._objectMeshes
    for (var i = 0; i < len; ++i) {
        var edge1 = (i === 0 || i === len - 1)
        for (var j = 0; j < len; ++j) {
            var d0 = arr.index(i, j, 0)
            var edge2 = edge1 || (j === 0 || j === len - 1)
            for (var k = 0; k < len; ++k, d0 += kstride) {
                // pull raw ID - could in principle be packed, so mask it
                var id = data[d0] & ID_MASK
                // skip air blocks
                if (id === 0) {
                    fullyOpaque = 0
                    continue
                }
                // store ID as packed internal representation
                var packed = packID(id) | 0
                data[d0] = packed
                // track whether chunk is entirely full or empty
                fullyOpaque &= packed
                fullyAir = false
                // within unpadded view, handle object blocks and handlers
                var atEdge = edge2 || (k === 0 || k === len - 1)
                if (!atEdge) {
                    if (OBJECT_BIT & packed) {
                        addObjectMeshAt(this, id, i - 1, j - 1, k - 1)
                    }
                    callBlockHandler(this, id, 'onLoad', i - 1, j - 1, k - 1)
                }
            }
        }
    }

    this.isFull = !!(fullyOpaque & OPAQUE_BIT)
    this.isEmpty = !!(fullyAir)
    this._terrainDirty = !(this.isFull || this.isEmpty)

    this.isGenerated = true
}


// helper to rebuild several transformed views on the data array

function rebuildArrayViews(chunk) {
    var arr = chunk.array
    var size = chunk.size
    chunk._unpaddedView = arr.lo(1, 1, 1).hi(size, size, size)
}







// dispose function - just clears properties and references

Chunk.prototype.dispose = function () {
    // look through the data for onUnload handlers
    callAllBlockHandlers(this, 'onUnload')

    // dispose unmerged object meshes
    for (var s in this._objectMeshes) {
        var dat = this._objectMeshes[s]
        if (dat.mesh) dat.mesh.dispose()
    }
    this._objectMeshes = null

    // apparently there's no way to dispose typed arrays, so just null everything
    this.array.data = null
    this.array = null
    this._unpaddedView = null

    this.isGenerated = false
    this.isDisposed = true
}


// helper to call a given handler for all blocks in the chunk

function callAllBlockHandlers(chunk, type) {
    var view = chunk._unpaddedView
    var data = view.data
    var si = view.stride[0]
    var sj = view.stride[1]
    var sk = view.stride[2]
    var size = view.shape[0]
    var d0 = view.offset
    for (var i = 0; i < size; ++i) {
        for (var j = 0; j < size; ++j) {
            for (var k = 0; k < size; ++k) {
                var id = ID_MASK & data[d0]
                callBlockHandler(chunk, id, type, i, j, k)
                d0 += sk
            }
            d0 -= sk * size
            d0 += sj
        }
        d0 -= sj * size
        d0 += si
    }
}











/*
 * 
 * 
 *      Object mesh handling
 * 
*/

// helper class to hold data about object meshes
function ObjMeshDat(id, x, y, z, mesh) {
    this.id = id | 0
    this.x = x | 0
    this.y = y | 0
    this.z = z | 0
    this.mesh = mesh || null
}



// adds an object mesh location to the list of meshes being tracked
function addObjectMeshAt(chunk, id, x, y, z) {
    var key = x + '|' + y + '|' + z
    var dat = new ObjMeshDat(id, x, y, z, null)
    chunk._objectMeshes[key] = dat
    chunk._objectsDirty = true
}



// undoes the previous
function removeObjectMeshAt(chunk, x, y, z) {
    var key = x + '|' + y + '|' + z
    var dat = chunk._objectMeshes[key]
    if (!dat) return
    if (dat.mesh) {
        removeUnorderedListItem(chunk.octreeBlock.entries, dat.mesh)
        dat.mesh.dispose()
    }
    delete (chunk._objectMeshes[key])
    chunk._objectsDirty = true
}





// Run through the known object mesh locations and create any meshes that are missing

Chunk.prototype.processObjectMeshes = function () {
    var x0 = this.i * this.size
    var y0 = this.j * this.size
    var z0 = this.k * this.size

    var objHash = this._objectMeshes
    for (var s in objHash) {
        var dat = objHash[s]
        if (dat.mesh) continue // skip anything already built

        var srcMesh = objectMeshLookup[dat.id]
        // var mesh = srcMesh.createInstance('object mesh instance')
        var mesh = srcMesh.clone('object mesh instance')
        mesh.position.x = x0 + dat.x + 0.5
        mesh.position.y = y0 + dat.y
        mesh.position.z = z0 + dat.z + 0.5

        mesh.computeWorldMatrix(true)
        if (!mesh.billboardMode) {
            mesh.freezeWorldMatrix()
            mesh.freezeNormals()
        }

        // call custom handler to let it, say, rotate the mesh
        var handlers = blockHandlerLookup[dat.id]
        if (handlers && handlers.onCustomMeshCreate) {
            handlers.onCustomMeshCreate(mesh, x0 + dat.x, y0 + dat.y, z0 + dat.z)
        }

        // stuff necessary to add mesh to scene
        this.octreeBlock.entries.push(mesh)

        dat.mesh = mesh
    }
}








// helper to swap item to end and pop(), instead of splice()ing
function removeUnorderedListItem(list, item) {
    var i = list.indexOf(item)
    if (i < 0) { return }
    if (i === list.length - 1) {
        list.pop()
    } else {
        list[i] = list.pop()
    }
}



















