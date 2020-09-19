import { EventEmitter } from "events"
import Engine from ".."
import { Chunk, _createVoxelArray } from './chunk'
import { sortByReferenceArray, loopForTime, numberOfVoxelsInSphere } from './util'
import { makeProfileHook, makeThroughputHook } from './util'

var lookIndex = 0
const PROFILE = 0
const PROFILE_QUEUES = 0

export interface IWorldOptions {
    /**
     * @default 24
     */
    chunkSize: number;

    /**
     * @default 3
     */
    chunkAddDistance: number;

    /**
     * @default 4
     */
    chunkRemoveDistance: number;
}

const defaultWorldOptions: IWorldOptions = {
    chunkSize: 24,
    chunkAddDistance: 3,
    chunkRemoveDistance: 4
}

/**
 * @typicalname noa.world
 * @emits worldDataNeeded(id, ndarray, x, y, z, worldName)
 * @emits chunkAdded(chunk)
 * @emits chunkBeingRemoved(id, ndarray, userData)
 * @description Manages the world and its chunks
 */

export class World extends EventEmitter {
    constructor(noa: Engine, options: Partial<IWorldOptions>) {
        super()

        const optionsWidthDefaults = {
            ...defaultWorldOptions,
            ...options
        };

        this.noa = noa

        this.playerChunkLoaded = false
        // this.Chunk = Chunk

        this.chunkSize = optionsWidthDefaults.chunkSize
        this.chunkAddDistance = optionsWidthDefaults.chunkAddDistance
        this.chunkRemoveDistance = optionsWidthDefaults.chunkRemoveDistance
        if (this.chunkRemoveDistance < this.chunkAddDistance) {
            this.chunkRemoveDistance = this.chunkAddDistance
        }

        // set this higher to cause chunks not to mesh until they have some neighbors
        this.minNeighborsToMesh = 6

        // settings for tuning worldgen behavior and throughput
        this.maxChunksPendingCreation = 10
        this.maxChunksPendingMeshing = 10
        this.maxProcessingPerTick = 9
        this.maxProcessingPerRender = 5

        // set up internal state
        this._cachedWorldName = ''
        this._lastPlayerChunkID = ''
        this._chunkStorage = {}
        
        this.initChunkQueues()

        // triggers a short visit to the meshing queue before renders
        noa.on('beforeRender', this.beforeRender)

        // instantiate coord conversion functions based on the chunk size
        // use bit twiddling if chunk size is a power of 2
        var cs = this.chunkSize
        if ((cs & cs - 1) === 0) {
            var shift = Math.log2(cs) | 0
            var mask = (cs - 1) | 0
            this._worldCoordToChunkCoord = coord => (coord >> shift) | 0
            this._worldCoordToChunkIndex = coord => (coord & mask) | 0
        } else {
            this._worldCoordToChunkCoord = coord => Math.floor(coord / cs) | 0
            this._worldCoordToChunkIndex = coord => (((coord % cs) + cs) % cs) | 0
        }
    }

    /**
     * chunk queues and queue processing
     */
    initChunkQueues = () => {
        // accessor for chunks to queue themselves for remeshing
        this._queueChunkForRemesh = (chunk: any) => {
            this.queueChunkForRemesh(chunk)
        }
    }

    // var chunkHash = ndHash([1024, 1024, 1024])
    _getChunk = (i: number, j: number, k: number) => {
        var id = getChunkID(i, j, k)
        return this._chunkStorage[id] || null
    }

    _setChunk = (i: number, j: number, k: number, value: number | null) => {
        var id = getChunkID(i, j, k)
        if (value) {
            this._chunkStorage[id] = value
        } else {
            delete this._chunkStorage[id]
        }
    }

    // chunk accessor for internal use
    _getChunkByCoords = (x: number, y: number, z: number) => {
        const i = this._worldCoordToChunkCoord(x)
        const j = this._worldCoordToChunkCoord(y)
        const k = this._worldCoordToChunkCoord(z)
        return this._getChunk(i, j, k)
    }

    noa: Engine;

    playerChunkLoaded: boolean;
    Chunk: Chunk | undefined;

    chunkSize: number;
    chunkAddDistance: number;
    chunkRemoveDistance: number;

    /** set this higher to cause chunks not to mesh until they have some neighbors */
    minNeighborsToMesh: number = 6;

    /** settings for tuning worldgen behavior and throughput */
    maxChunksPendingCreation: number = 10;
    maxChunksPendingMeshing: number = 10;

    /**
     * milliseconds
     */
    maxProcessingPerTick: number = 9;

    /**
     * milliseconds
     */
    maxProcessingPerRender: number = 5;

    /** set up internal state */
    _cachedWorldName: string = '';
    _lastPlayerChunkID: string = '';
    _chunkStorage: any = {};
    _queueChunkForRemesh: any;

    /** all chunks existing in any queue */
    _chunkIDsKnown: any[] = [];

    /** not yet requested from client */
    _chunkIDsToRequest: any[] = [];

    /** requested, awaiting creation */
    _chunkIDsPending: any[] = [];

    /** created but not yet meshed */
    _chunkIDsToMesh: any[] = [];

    /** priority meshing queue */
    _chunkIDsToMeshFirst: any[] = [];

    /** chunks awaiting disposal */
    _chunkIDsToRemove: any[] = [];

    _worldCoordToChunkCoord = (coord: any) => {
        // instantiate coord conversion functions based on the chunk size
        // use bit twiddling if chunk size is a power of 2
        if ((this.chunkSize & this.chunkSize - 1) === 0) {
            var shift = Math.log2(this.chunkSize) | 0
            return (coord >> shift) | 0;
        } else {
            return Math.floor(coord / this.chunkSize) | 0;
        }
    }

    _worldCoordToChunkIndex = (coord: any) => {
        // instantiate coord conversion functions based on the chunk size
        // use bit twiddling if chunk size is a power of 2
        if ((this.chunkSize & this.chunkSize - 1) === 0) {
            var mask = (this.chunkSize - 1) | 0
            this._worldCoordToChunkIndex = coord => (coord & mask) | 0
        } else {
            this._worldCoordToChunkIndex = coord => (((coord % this.chunkSize) + this.chunkSize) % this.chunkSize) | 0
        }
    }

    getBlockID = (x: number, y: number, z: number) => {
        var chunk = this._getChunkByCoords(x, y, z)
        if (!chunk) return 0
        return chunk.get(this._worldCoordToChunkIndex(x), this._worldCoordToChunkIndex(y), this._worldCoordToChunkIndex(z))
    }

    getBlockSolidity = (x: number, y: number, z: number) => {
        var chunk = this._getChunkByCoords(x, y, z)
        if (!chunk) return false
        return !!chunk.getSolidityAt(this._worldCoordToChunkIndex(x), this._worldCoordToChunkIndex(y), this._worldCoordToChunkIndex(z))
    }

    getBlockOpacity = (x: number, y: number, z: number) => {
        var id = this.getBlockID(x, y, z)
        return this.noa.registry.getBlockOpacity(id)
    }

    getBlockFluidity = (x: number, y: number, z: number) => {
        var id = this.getBlockID(x, y, z)
        return this.noa.registry.getBlockFluidity(id)
    }

    getBlockProperties = (x: number, y: number, z: number) => {
        var id = this.getBlockID(x, y, z)
        return this.noa.registry.getBlockProps(id)
    }

    getBlockObjectMesh = (x: number, y: number, z: number) => {
        var chunk = this._getChunkByCoords(x, y, z)
        if (!chunk) return 0
        return chunk.getObjectMeshAt(this._worldCoordToChunkIndex(x), this._worldCoordToChunkIndex(y), this._worldCoordToChunkIndex(z))
    }

    setBlockID = (val: string, x: number, y: number, z: number) => {
        var i = this._worldCoordToChunkCoord(x)
        var j = this._worldCoordToChunkCoord(y)
        var k = this._worldCoordToChunkCoord(z)
        var ix = this._worldCoordToChunkIndex(x)
        var iy = this._worldCoordToChunkIndex(y)
        var iz = this._worldCoordToChunkIndex(z)

        // logic inside the chunk will trigger a remesh for chunk and 
        // any neighbors that need it
        var chunk = this._getChunk(i, j, k)
        if (chunk) {
            chunk.set(ix, iy, iz, val)
        }
    }

    isBoxUnobstructed = (box: any) => {
        var base = box.base
        var max = box.max
        for (var i = Math.floor(base[0]); i < max[0] + 1; i++) {
            for (var j = Math.floor(base[1]); j < max[1] + 1; j++) {
                for (var k = Math.floor(base[2]); k < max[2] + 1; k++) {
                    if (this.getBlockSolidity(i, j, k)) return false
                }
            }
        }
        return true
    }


    /** Tells noa to discard voxel data within a given `AABB` (e.g. because 
     * the game client received updated data from a server). 
     * The engine will mark all affected chunks for disposal, and will later emit 
     * new `worldDataNeeded` events (if the chunk is still in draw range).
     * Note that chunks invalidated this way will not emit a `chunkBeingRemoved` event 
     * for the client to save data from.
     */
    invalidateVoxelsInAABB = (box: any) => {
        this.invalidateChunksInBox(box)
    }

    /** invalidate chunks overlapping the given AABB */
    invalidateChunksInBox = (box: any) => {
        var min = box.base.map((n: any) => Math.floor(this._worldCoordToChunkCoord(n)))
        var max = box.max.map((n: any) => Math.floor(this._worldCoordToChunkCoord(n)))
        this._chunkIDsKnown.forEach(id => {
            var pos = parseChunkID(id)
            for (var i = 0; i < 3; i++) {
                if (pos[i] < min[i] || pos[i] > max[i]) return
            }
            if (this._chunkIDsToRemove.includes(id)) return
            enqueueID(id, this._chunkIDsToRequest)
        })
    }


    /**
     * internals: tick functions that process queues and trigger events
     */
    tick = () => {
        var tickStartTime = performance.now()

        // if world has changed, mark everything to be removed and re-requested
        if (this._cachedWorldName !== this.noa.worldName) {
            this.markAllChunksForRemoval()
            this._cachedWorldName = this.noa.worldName
        }

        // current player chunk changed since last tick?
        var pos = this.getPlayerChunkCoords()
        var chunkID = getChunkID(pos[0], pos[1], pos[2])
        var changedChunks = (chunkID != this._lastPlayerChunkID)
        if (changedChunks) {
            this.emit('playerEnteredChunk', pos[0], pos[1], pos[2])
            this._lastPlayerChunkID = chunkID
        }
        profile_hook('start')
        profile_queues_hook('start')

        // possibly scan for chunks to add/remove
        if (changedChunks) {
            this.findDistantChunksToRemove(pos[0], pos[1], pos[2])
            profile_hook('remQueue')
        }
        var numChunks = numberOfVoxelsInSphere(this.chunkAddDistance)
        if (changedChunks || (this._chunkIDsKnown.length < numChunks)) {
            this.findNewChunksInRange(pos[0], pos[1], pos[2])
            profile_hook('addQueue')
        }

        // process (create or mesh) some chunks, up to max iteration time
        loopForTime(this.maxProcessingPerTick, () => {
            var done: any = this.processRequestQueue()
            profile_hook('requests')
            done = done && this.processRemoveQueue()
            profile_hook('removes')
            done = done && this.processMeshingQueue(false)
            profile_hook('meshes')
            return done
        }, tickStartTime)

        // when time is left over, look for low-priority extra meshing
        var dt = performance.now() - tickStartTime
        if (dt + 2 < this.maxProcessingPerTick) {
            this.lookForChunksToMesh()
            profile_hook('looking')
            loopForTime(this.maxProcessingPerTick, () => {
                var done = this.processMeshingQueue(false)
                profile_hook('meshes')
                return done
            }, tickStartTime)
        }

        // track whether the player's local chunk is loaded and ready or not
        var pChunk = this._getChunk(pos[0], pos[1], pos[2])
        this.playerChunkLoaded = !!pChunk

        profile_queues_hook('end')
        profile_hook('end')
    }
    
    report = () => {
        console.log('World report - playerChunkLoaded: ', this.playerChunkLoaded)
        this._report('  known:     ', this._chunkIDsKnown, true)
        this._report('  to request:', this._chunkIDsToRequest)
        this._report('  to remove: ', this._chunkIDsToRemove)
        this._report('  creating:  ', this._chunkIDsPending)
        this._report('  to mesh:   ', this._chunkIDsToMesh.concat(this._chunkIDsToMeshFirst))
    }

    _report = (name: string, arr: any[], ext?: any) => {
        var full = 0,
            empty = 0,
            exist = 0,
            surrounded = 0,
            remeshes: any[] = []

        arr.forEach(id => {
            var chunk = this._chunkStorage[id]
            if (!chunk) return
            exist++
            remeshes.push(chunk._timesMeshed)
            if (chunk.isFull) full++
            if (chunk.isEmpty) empty++
            if (chunk._neighborCount === 26) surrounded++
        })

        var out = arr.length.toString().padEnd(8)
        out += ('exist: ' + exist).padEnd(12)
        out += ('full: ' + full).padEnd(12)
        out += ('empty: ' + empty).padEnd(12)
        out += ('surr: ' + surrounded).padEnd(12)

        if (ext) {
            var sum = remeshes.reduce((acc, val) => acc + val)
            var max = remeshes.reduce((acc, val) => Math.max(acc, val))
            var min = remeshes.reduce((acc, val) => Math.min(acc, val))
            out += 'times meshed: avg ' + (sum / exist).toFixed(2)
            out += '  max ' + max
            out += '  min ' + min
        }
        console.log(name, out)
    }


    /**
     * client should call this after creating a chunk's worth of data (as an ndarray)  
     * If userData is passed in it will be attached to the chunk
     */
    setChunkData = (reqID: string, array: any[], userData: any) => {
        var arr = reqID.split('|')
        var i = parseInt(arr.shift()!)
        var j = parseInt(arr.shift()!)
        var k = parseInt(arr.shift()!)
        var worldName = arr.join('|')
        var id = getChunkID(i, j, k)
        unenqueueID(id, this._chunkIDsPending)
        // discard data if it's for a world that's no longer current
        if (worldName !== this.noa.worldName) return
        // discard if chunk is no longer needed
        if (!this._chunkIDsKnown.includes(id)) return
        if (this._chunkIDsToRemove.includes(id)) return
        var chunk = this._chunkStorage[id]
        if (!chunk) {
            // if chunk doesn't exist, create and init
            var size = this.chunkSize
            chunk = new Chunk(this.noa, id, i, j, k, size, array)
            this._setChunk(i, j, k, chunk)
            chunk.requestID = reqID
            chunk.userData = userData
            this.updateNeighborsOfChunk(i, j, k, chunk)
            this.noa.rendering.prepareChunkForRendering(chunk)
            this.emit('chunkAdded', chunk)
        } else {
            // else we're updating data for an existing chunk
            chunk._updateVoxelArray(array)
            // assume neighbors need remeshing
            var list = chunk._neighbors.data
            list.forEach((nab: any) => {
                if (!nab || nab === chunk) return
                if (nab._neighborCount > 20) this.queueChunkForRemesh(nab)
            })
        }
        // chunk can now be meshed...
        this.queueChunkForRemesh(chunk)
        profile_queues_hook('receive')
    }

    /** similar to above but for chunks waiting to be meshed */
    processMeshingQueue = (firstOnly: boolean) => {
        var queue = this._chunkIDsToMeshFirst
        if (queue.length === 0 && !firstOnly) queue = this._chunkIDsToMesh
        if (queue.length === 0) return true
    
        var id = queue.shift()
        if (this._chunkIDsToRemove.includes(id)) return
        var chunk = this._chunkStorage[id]
        if (chunk) this.doChunkRemesh(chunk)
    }
    
    processRemoveQueue = () => {
        var queue = this._chunkIDsToRemove
        if (queue.length === 0) return true
        this.removeChunk(queue.shift())
        return (queue.length === 0)
    }

    /** sorts a queue of chunk IDs by distance from player (ascending) */
    sortChunkIDQueue = (queue: any) => {
        var loc = this.getPlayerChunkCoords()
        var dists = queue.map((id: any) => {
            var pos = parseChunkID(id)
            var dx = pos[0] - loc[0]
            var dy = pos[1] - loc[1]
            var dz = pos[2] - loc[2]
            // bias towards keeping verticals together for now
            return 3 * (dx * dx + dz * dz) + Math.abs(dy)
        })
        sortByReferenceArray(queue, dists)
    }

    getPlayerChunkCoords = () => {
        var pos = this.noa.entities.getPosition(this.noa.playerEntity)
        var i = this._worldCoordToChunkCoord(pos[0])
        var j = this._worldCoordToChunkCoord(pos[1])
        var k = this._worldCoordToChunkCoord(pos[2])
        return [i, j, k]
    }
    
    /** process neighborhood chunks, add missing ones to "toRequest" and "inMemory" */
    findNewChunksInRange = (ci: any, cj: any, ck: any) => {
        var add = Math.ceil(this.chunkAddDistance)
        var addDistSq = this.chunkAddDistance * this.chunkAddDistance
        var known = this._chunkIDsKnown
        var toRequest = this._chunkIDsToRequest

        // search all nearby chunk locations
        for (var i = ci - add; i <= ci + add; ++i) {
            for (var j = cj - add; j <= cj + add; ++j) {
                for (var k = ck - add; k <= ck + add; ++k) {
                    var id = getChunkID(i, j, k)
                    if (known.includes(id)) continue
                    var di = i - ci
                    var dj = j - cj
                    var dk = k - ck
                    var distSq = di * di + dj * dj + dk * dk
                    if (distSq > addDistSq) continue
                    enqueueID(id, known)
                    enqueueID(id, toRequest)
                }
            }
        }

        this.sortChunkIDQueue(toRequest)
    }

    /** rebuild queue of chunks to be removed from around (ci,cj,ck) */
    findDistantChunksToRemove = (ci: number, cj: number, ck: number) => {
        var remDistSq = this.chunkRemoveDistance * this.chunkRemoveDistance
        var toRemove = this._chunkIDsToRemove
        this._chunkIDsKnown.forEach(id => {
            if (toRemove.includes(id)) return
            var loc = parseChunkID(id)
            var di = loc[0] - ci
            var dj = loc[1] - cj
            var dk = loc[2] - ck
            var distSq = di * di + dj * dj + dk * dk
            if (distSq < remDistSq) return
            // flag chunk for removal and remove it from work queues
            enqueueID(id, this._chunkIDsToRemove)
            unenqueueID(id, this._chunkIDsToRequest)
            unenqueueID(id, this._chunkIDsToMesh)
            unenqueueID(id, this._chunkIDsToMeshFirst)
        })
        this.sortChunkIDQueue(toRemove)
    }

    /** when current world changes - empty work queues and mark all for removal */
    markAllChunksForRemoval = () => {
        this._chunkIDsToRemove = this._chunkIDsKnown.slice()
        this._chunkIDsToRequest.length = 0
        this._chunkIDsToMesh.length = 0
        this._chunkIDsToMeshFirst.length = 0
        this.sortChunkIDQueue(this._chunkIDsToRemove)
    }

    /** look for chunks that could stand to be re-meshed */
    lookForChunksToMesh = () => {
        var queue = this._chunkIDsKnown
        var ct = Math.min(50, queue.length)
        var numQueued = this._chunkIDsToMesh.length + this._chunkIDsToMeshFirst.length
        for (var i = 0; i < ct; i++) {
            lookIndex = (lookIndex + 1) % queue.length
            var id = queue[lookIndex]
            var chunk = this._chunkStorage[id]
            if (!chunk) continue
            var nc = chunk._neighborCount
            if (nc < this.minNeighborsToMesh) continue
            if (nc <= chunk._maxMeshedNeighbors) continue
            this.queueChunkForRemesh(chunk)
            if (++numQueued > 10) return
        }
    }
    
    /** run through chunk tracking queues looking for work to do next */
    processRequestQueue = () => {
        var queue = this._chunkIDsToRequest
        if (queue.length === 0) return true
        // skip if too many outstanding requests, or if meshing queue is full
        var pending = this._chunkIDsPending.length
        var toMesh = this._chunkIDsToMesh.length
        if (pending >= this.maxChunksPendingCreation) return true
        if (toMesh >= this.maxChunksPendingMeshing) return true
        var id = queue.shift()
        this.requestNewChunk(id)
        return (queue.length === 0)
    }

    /**
     * create chunk object and request voxel data from client
     */
    requestNewChunk = (id: string) => {
        var pos = parseChunkID(id)
        var i = pos[0]
        var j = pos[1]
        var k = pos[2]
        var size = this.chunkSize
        var dataArr = _createVoxelArray(this.chunkSize)
        var worldName = this.noa.worldName
        var requestID = [i, j, k, worldName].join('|')
        var x = i * size
        var y = j * size
        var z = k * size
        enqueueID(id, this._chunkIDsPending)
        this.emit('worldDataNeeded', requestID, dataArr, x, y, z, worldName)
        profile_queues_hook('request')
    }

    /** remove a chunk that wound up in the remove queue */
    removeChunk = (id: string) => {
        var loc = parseChunkID(id)
        var chunk = this._getChunk(loc[0], loc[1], loc[2])
        if (chunk) {
            this.emit('chunkBeingRemoved', chunk.requestID, chunk.voxels, chunk.userData)
            this.noa.rendering.disposeChunkForRendering(chunk)
            chunk.dispose()
            profile_queues_hook('dispose')
            this.updateNeighborsOfChunk(loc[0], loc[1], loc[2], null)
        }
        this._setChunk(loc[0], loc[1], loc[2], null)
        unenqueueID(id, this._chunkIDsKnown)
        unenqueueID(id, this._chunkIDsToMesh)
        unenqueueID(id, this._chunkIDsToMeshFirst)
    }

    queueChunkForRemesh = (chunk: any) => {
        var nc = chunk._neighborCount
        var limit = Math.min(this.minNeighborsToMesh, 26)
        if (nc < limit) return
        chunk._terrainDirty = true
        var queue = (nc === 26) ?
            this._chunkIDsToMeshFirst : this._chunkIDsToMesh
        enqueueID(chunk.id, queue)
    }

    doChunkRemesh = (chunk: any) => {
        unenqueueID(chunk.id, this._chunkIDsToMesh)
        unenqueueID(chunk.id, this._chunkIDsToMeshFirst)
        chunk.updateMeshes()
        profile_queues_hook('mesh')
    }

    /** keep neighbor data updated when chunk is added or removed */
    updateNeighborsOfChunk = (ci: any, cj: any, ck: any, chunk: any) => {
        for (var i = -1; i <= 1; i++) {
            for (var j = -1; j <= 1; j++) {
                for (var k = -1; k <= 1; k++) {
                    if ((i | j | k) === 0) continue
                    var nid = getChunkID(ci + i, cj + j, ck + k)
                    var neighbor = this._chunkStorage[nid]
                    if (!neighbor) continue
                    if (chunk) {
                        chunk._neighborCount++
                        chunk._neighbors.set(i, j, k, neighbor)
                        neighbor._neighborCount++
                        neighbor._neighbors.set(-i, -j, -k, chunk)
                        // flag for remesh when chunk gets its last neighbor
                        if (neighbor._neighborCount === 26) {
                            this.queueChunkForRemesh(neighbor)
                        }
                    } else {
                        neighbor._neighborCount--
                        neighbor._neighbors.set(-i, -j, -k, null)
                    }
                }
            }
        }
    }    

    beforeRender = () => {
        // on render, quickly process the high-priority meshing queue
        // to help avoid flashes of background while neighboring chunks update
        loopForTime(this.maxProcessingPerRender, () => this.processMeshingQueue(true))
    }
}

/**
 * chunk IDs, storage, and lookup/retrieval
 */
function getChunkID(i: number, j: number, k: number) {
    // chunk coords -> canonical string ID
    return i + '|' + j + '|' + k
}

function parseChunkID(id: string) {
    // chunk ID -> coords
    var arr = id.split('|')
    return [parseInt(arr[0]), parseInt(arr[1]), parseInt(arr[2])]
}


/**
 * uniquely enqueue a string id into an array of them
 */
function enqueueID(id: string, queue: any) {
    var i = queue.indexOf(id)
    if (i >= 0) return
    queue.push(id)
}

/** remove string id from queue if it exists */
function unenqueueID(id: string, queue: any) {
    var i = queue.indexOf(id)
    if (i >= 0) queue.splice(i, 1)
}


var profile_hook = (PROFILE) ?
    makeProfileHook(100, 'world ticks:') : () => {}
var profile_queues_hook = (PROFILE_QUEUES) ?
    makeThroughputHook(100, 'chunks/sec:') : () => {}
