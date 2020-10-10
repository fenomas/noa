// shared references to terrain/object meshers
import ndarray from "ndarray"
import { addObjectBlock, buildObjectMeshes, disposeChunk, initChunk, removeObjectBlock, removeObjectMeshes } from './objectMesher'
import Engine, { ArrayTypes } from ".."
import { TerrainMesher } from "./terrainMesher"
import { Mesh } from "@babylonjs/core"
import { noaMesh } from "./rendering"


/**
 * Chunk
 * Stores and manages voxel ids and flags for each voxel within chunk
 */
export class Chunk<UserDataType = any> {
    constructor(noa: Engine, id: string, i: number, j: number, k: number, size: number, dataArray: ndarray<any>) {
        this.id = id // id used by noa
        this.requestID = '' // id sent to game client

        this.noa = noa
        this.isDisposed = false
        this.octreeBlock = null

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

        // (re) init references shared among all chunks
        solidLookup = noa.registry._solidityLookup
        opaqueLookup = noa.registry._opacityLookup
        objectLookup = noa.registry._objectLookup
        blockHandlerLookup = noa.registry._blockHandlerLookup

        // makes data for terrain / object meshing
        this._terrainMesh = null
        this._objectBlocks = null
        this._objectSystems = null
        initChunk(this)

        this.isFull = false
        this.isEmpty = false


        // references to neighboring chunks, if they exist (filled in by `world`)
        var narr = Array.from(Array(27)).map(() => null)
        this._neighbors = ndarray(narr, [3, 3, 3]).lo(1, 1, 1)
        this._neighbors.set(0, 0, 0, this)
        this._neighborCount = 0
        this._maxMeshedNeighbors = 0
        this._timesMeshed = 0

        // passes through voxel contents, calling block handlers etc.
        this.scanVoxelData()
    }


    /** id used by noa */
    id: string;

    /** id sent to game client */
    requestID: string;

    /** data attached to chunk */
    userData: UserDataType | undefined;

    noa: Engine;
    isDisposed: boolean;
    octreeBlock: null | any;

    isEmpty: boolean;
    isFull: boolean;

    /** voxel data and properties */
    voxels: ndarray<any>;

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
        this._terrainDirty = false
        this._objectsDirty = false
        initChunk(this)
        this.scanVoxelData()
    }

    // get/set deal with block IDs, so that this class acts like an ndarray
    get = (x: number, y: number, z: number) => {
        return this.voxels.get(x, y, z)
    }

    getSolidityAt = (x: number, y: number, z: number) => {
        return solidLookup[this.voxels.get(x, y, z)]
    }

    set = (x: number, y: number, z: number, newID: number) => {
        var oldID = this.voxels.get(x, y, z)
        var oldIDnum = oldID
        if (newID === oldIDnum) {
            return
        }

        // manage data
        this.voxels.set(x, y, z, newID)

        // voxel lifecycle handling
        if (objectLookup[oldID]) {
            this.removeObjectBlock(x, y, z)
        }
        if (objectLookup[newID]) {
            this.addObjectBlock(newID, x, y, z)
        }

        this.callBlockHandler(oldIDnum, 'onUnset', x, y, z)
        this.callBlockHandler(newID, 'onSet', x, y, z)

        // track full/emptiness and info about terrain
        if (!opaqueLookup[newID]) {
            this.isFull = false
        }
        if (newID !== 0) {
            this.isEmpty = false
        }
        if (affectsTerrain(newID) || affectsTerrain(oldID)) {
            this._terrainDirty = true
        }

        if (this._terrainDirty || this._objectsDirty) {
            this.noa.world._queueChunkForRemesh(this)
        }

        // neighbors only affected if solidity or opacity changed on an edge
        let SOchanged = false
        if (solidLookup[oldID] !== solidLookup[newID]) {
            SOchanged = true
        }

        if (opaqueLookup[oldID] !== opaqueLookup[newID]) {
            SOchanged = true
        }

        if (SOchanged) {
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
    mesh = (matGetter?: (blockId: number, dir: number) => number[], colGetter?: (matID: number) => [number, number, number], useAO?: boolean | undefined, aoVals?: [number, number, number] | undefined, revAoVal?: number): Mesh | null => {
        if (terrainMesher === undefined) {
            terrainMesher = new TerrainMesher(this.noa)
        }

        return terrainMesher.meshChunk(this, matGetter, colGetter, false, useAO, aoVals, revAoVal)
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
            meshes.forEach(mesh => rendering.addMeshToScene(mesh as noaMesh, true, pos2, this))
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
        this.voxels.data = null as any
        this.voxels = null as any
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
     * Scans voxel data, processing object blocks and setting chunk flags
     */
    scanVoxelData = () => {
        // flags for tracking if chunk is entirely opaque or transparent
        var fullyOpaque = true
        var fullyAir = true
        var hasObj = false

        var voxels = this.voxels
        var len = voxels.shape[0]
        for (var i = 0; i < len; ++i) {
            for (var j = 0; j < len; ++j) {
                var index = voxels.index(i, j, 0)
                for (var k = 0; k < len; ++k, ++index) {
                    var id = voxels.data[index]

                    // skip air blocks
                    if (id === 0) {
                        fullyOpaque = false
                        continue
                    }
                    fullyOpaque = fullyOpaque && opaqueLookup[id]

                    fullyAir = false
                    
                    // handle object blocks and handlers
                    if (objectLookup[id]) {
                        this.addObjectBlock(id, i, j, k)
                        hasObj = true
                    }
                    this.callBlockHandler(id, 'onLoad', i, j, k)
                }
            }
        }
    
        this.isFull = fullyOpaque
        this.isEmpty = fullyAir
        this._terrainDirty = !this.isEmpty
        this._objectsDirty = hasObj
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
                    var id = arr.get(i, j, k)
                    if (id > 0) this.callBlockHandler(id, type, i, j, k)
                }
            }
        }
    }

    getObjectMeshAt = (x: number, y: number, z: number) => {
        throw new Error("Not implemented yet")
    }
}

/** expose logic internally to create and update the voxel data array */
export function _createVoxelArray(size: number) {
    var arr = new Uint16Array(size * size * size)
    return ndarray(arr, [size, size, size])
}

var terrainMesher: undefined | TerrainMesher;

// Registry lookup references shared by all chunks
var solidLookup: any[]
var opaqueLookup: any[]
var objectLookup: any[]
var blockHandlerLookup: any[]

/** helpers to determine which blocks are, or can affect, terrain meshes */
function affectsTerrain(id: number) {
    if (id === 0) {
        return false
    }
    
    // treat object blocks as terrain if solid (they affect AO)
    if (solidLookup[id]) {
        return true
    }

    return !objectLookup[id]
}

