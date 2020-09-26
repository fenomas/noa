// shared references to terrain/object meshers
import ndarray from "ndarray"
import { addObjectBlock, buildObjectMeshes, disposeChunk, initChunk, removeObjectBlock, removeObjectMeshes } from './objectMesher'
import { constants } from './constants'
import Engine from ".."
import { TerrainMesher } from "./terrainMesher"

/**
 * Chunk
 * Stores and manages voxel ids and flags for each voxel within chunk
 * See constants.js for internal data representation
 */


// data representation
var ID_MASK = constants.ID_MASK
// var VAR_MASK = constants.VAR_MASK // NYI
var SOLID_BIT = constants.SOLID_BIT
var OPAQUE_BIT = constants.OPAQUE_BIT
var OBJECT_BIT = constants.OBJECT_BIT




/**
 * Chunk constructor
 */
export class Chunk {
    constructor(noa: Engine, id: string, i: number, j: number, k: number, size: number, dataArray: any[]) {
        this.id = id // id used by noa
        this.requestID = '' // id sent to game client

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
        initChunk(this)

        // references to neighboring chunks, if they exist (filled in by `world`)
        var narr = Array.from(Array(27)).map(() => null)
        this._neighbors = ndarray(narr, [3, 3, 3]).lo(1, 1, 1)
        this._neighbors.set(0, 0, 0, this)
        this._neighborCount = 0
        this._maxMeshedNeighbors = 0
        this._timesMeshed = 0

        // converts raw voxelID data into packed ID+solidity etc.
        this.packVoxelData()
    }


    /** id used by noa */
    id: string;

    /** id sent to game client */
    requestID: string;

    noa: Engine;
    isDisposed: boolean;
    octreeBlock: null | any;

    isEmpty: boolean;
    isFull: boolean;

    /** voxel data and properties */
    voxels: any;

    i: number;
    j: number;
    k: number;

    size: number;
    x: number;
    y: number;
    z: number;

    /** flags to track if things need re-meshing */
    _terrainDirty: boolean;
    _objectsDirty: boolean;

    // makes data for terrain / object meshing
    _terrainMesh: any | null;
    _objectBlocks: any | null;
    _objectSystems: any | null;

    _neighbors: any;
    _neighborCount: number;
    _maxMeshedNeighbors: number;
    _timesMeshed: number;

    _updateVoxelArray = (dataArray: any) => {
        // dispose current object blocks
        this.callAllBlockHandlers('onUnload')
        disposeChunk(this)
        this.voxels = dataArray
        this._terrainDirty = true
        this._objectsDirty = true
        initChunk(this)
        this.packVoxelData()
    }

    // get/set deal with block IDs, so that this class acts like an ndarray
    get = (x: number, y: number, z: number) => {
        return ID_MASK & this.voxels.get(x, y, z)
    }

    getSolidityAt = (x: number, y: number, z: number) => {
        return (SOLID_BIT & this.voxels.get(x, y, z)) ? true : false
    }

    set = (x: number, y: number, z: number, id: number) => {
        var oldID = this.voxels.get(x, y, z)
        var oldIDnum = oldID & ID_MASK
        if (id === oldIDnum) {
            return
        }

        // manage data
        var newID = packID(id)
        this.voxels.set(x, y, z, newID)

        // voxel lifecycle handling
        if (oldID & OBJECT_BIT) {
            this.removeObjectBlock(x, y, z)
        }
        if (newID & OBJECT_BIT) {
            this.addObjectBlock(id, x, y, z)
        }

        this.callBlockHandler(oldIDnum, 'onUnset', x, y, z)
        this.callBlockHandler(id, 'onSet', x, y, z)

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

    // Convert chunk's voxel terrain into a babylon.js mesh
    // Used internally, but needs to be public so mesh-building hacks can call it
    mesh = (matGetter?: any, colGetter?: any, useAO?: any, aoVals?: any, revAoVal?: any) => {
        const mesher = new TerrainMesher(this.noa);
        return mesher.meshChunk(this, matGetter, colGetter, false, useAO, aoVals, revAoVal)
    }

    // gets called by World when this chunk has been queued for remeshing
    updateMeshes = () => {
        var rendering = this.noa.rendering
        if (this._terrainDirty) {
            if (this._terrainMesh) {
                this._terrainMesh.dispose()
            }

            var mesh = this.mesh()
            if (mesh && mesh.getIndices()!.length > 0) {
                var pos: [number, number, number] = [this.x, this.y, this.z]
                rendering.addMeshToScene(mesh as any, true, pos, this)
            }
            this._terrainMesh = mesh || null
            this._terrainDirty = false
            this._timesMeshed++
            this._maxMeshedNeighbors = Math.max(this._maxMeshedNeighbors, this._neighborCount)
        }
        if (this._objectsDirty) {
            removeObjectMeshes(this)
            var meshes = buildObjectMeshes(this)
            var pos2: [number, number, number] = [this.x, this.y, this.z]
            meshes.forEach(mesh => rendering.addMeshToScene(mesh, true, pos2, this))
            this._objectsDirty = false
        }
    }

    // dispose function - just clears properties and references
    dispose = () => {
        // look through the data for onUnload handlers
        this.callAllBlockHandlers('onUnload')

        // let meshers dispose their stuff
        disposeChunk(this)
        if (this._terrainMesh) {
            this._terrainMesh.dispose()
        }

        // apparently there's no way to dispose typed arrays, so just null everything
        this.voxels.data = null
        this.voxels = null
        this._neighbors.data = null
        this._neighbors = null

        this.isDisposed = true
    }

    
    // helper to call handler of a given type at a particular xyz
    callBlockHandler = (blockID: number, type: 'onUnset' | 'onSet' | 'onLoad' | 'onUnload', x: number, y: number, z: number) => {
        var hobj = blockHandlerLookup[blockID]
        if (!hobj) {
            return
        }

        var handler = hobj[type]
        if (!handler) {
            return
        }
        handler(this.x + x, this.y + y, this.z + z)
    }

    /**
     * Init
     * Converts raw voxel ID data into packed ID + solidity etc.
     */
    packVoxelData = () => {
        // flags for tracking if chunk is entirely opaque or transparent
        var fullyOpaque = OPAQUE_BIT
        var fullyAir = true

        var arr = this.voxels
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
                        this.addObjectBlock(id, i, j, k)
                    }
                    this.callBlockHandler(id, 'onLoad', i, j, k)
                }
            }
        }

        this.isFull = !!(fullyOpaque & OPAQUE_BIT)
        this.isEmpty = !!(fullyAir)
        this._terrainDirty = !(this.isFull || this.isEmpty)
    }

    // accessors related to meshing
    addObjectBlock = (id: number, x: number, y: number, z: number) => {
        addObjectBlock(this, id, x, y, z)
        this._objectsDirty = true
    }

    removeObjectBlock = (x: number, y: number, z: number) => {
        removeObjectBlock(this, x, y, z)
        this._objectsDirty = true
    }

    // helper to call a given handler for all blocks in the chunk
    callAllBlockHandlers = (type: 'onUnset' | 'onSet' | 'onLoad' | 'onUnload') => {
        var arr = this.voxels
        var size = arr.shape[0]
        for (var i = 0; i < size; ++i) {
            for (var j = 0; j < size; ++j) {
                for (var k = 0; k < size; ++k) {
                    var id = ID_MASK & arr.get(i, j, k)
                    if (id > 0) this.callBlockHandler(id, type, i, j, k)
                }
            }
        }
    }

}

/** expose logic internally to create and update the voxel data array */
export function _createVoxelArray(size: number) {
    var arr = new Uint16Array(size * size * size)
    return ndarray(arr, [size, size, size])
}

// Registry lookup references shared by all chunks
var solidLookup: any[]
var opaqueLookup: any[]
var objectMeshLookup: any[]
var blockHandlerLookup: any[]

function setBlockLookups(noa: Engine) {
    solidLookup = noa.registry._solidityLookup
    opaqueLookup = noa.registry._opacityLookup
    objectMeshLookup = noa.registry._blockMeshLookup
    blockHandlerLookup = noa.registry._blockHandlerLookup
}

/** helper to determine if a block counts as "terrain" (non-air, non-object) */
function isTerrain(id: number) {
    if (id === 0) return false
    // treat object blocks as terrain if solid (they affect AO)
    if (id & OBJECT_BIT) return !!(id & SOLID_BIT)
    return true
}

/** helper to pack a block ID into the internally stored form, given lookup tables */
function packID(id: number) {
    var newID = id
    if (solidLookup[id]) {
        newID |= SOLID_BIT
    }
    if (opaqueLookup[id]) {
        newID |= OPAQUE_BIT
    }
    if (objectMeshLookup[id]) {
        newID |= OBJECT_BIT
    }
    return newID
}
