
import EventEmitter from 'events'
import { Chunk } from './chunk'
import { LocationQueue, ChunkStorage, locationHasher } from './util'

var PROFILE_EVERY = 0               // ticks
var PROFILE_QUEUES_EVERY = 0        // ticks






var defaultOptions = {
    chunkSize: 24,
    chunkAddDistance: [2, 2],           // [horizontal, vertical]
    chunkRemoveDistance: [3, 3],        // [horizontal, vertical]
    worldGenWhilePaused: false,
    manuallyControlChunkLoading: false,
}

/**
 * `noa.world` - manages world data, chunks, voxels.
 * 
 * This module uses the following default options (from the options
 * object passed to the {@link Engine}):
 * ```js
 * var defaultOptions = {
 *   chunkSize: 24,
 *   chunkAddDistance: [2, 2],           // [horizontal, vertical]
 *   chunkRemoveDistance: [3, 3],        // [horizontal, vertical]
 *   worldGenWhilePaused: false,
 *   manuallyControlChunkLoading: false,
 * }
 * ```
 * 
 * **Events:**
 *  + `worldDataNeeded = (requestID, dataArr, x, y, z, worldName)`  
 *    Alerts client that a new chunk of world data is needed.
 *  + `playerEnteredChunk => (i, j, k)`    
 *    Fires when player enters a new chunk
 *  + `chunkAdded => (chunk)`  
 *    Fires after a new chunk object is added to the world
 *  + `chunkBeingRemoved = (requestID, dataArr, userData)`  
 *    Fires before a chunk is removed from world
*/
export class World extends EventEmitter {

    /** @internal */
    constructor(noa, opts) {
        super()
        opts = Object.assign({}, defaultOptions, opts)
        /** @internal */
        this.noa = noa

        /** @internal */
        this.playerChunkLoaded = false

        /** @internal */
        this.Chunk = Chunk // expose this class for ...reasons

        /**
         * Game clients should set this if they need to manually control 
         * which chunks to load and unload. When set, client should call 
         * `noa.world.manuallyLoadChunk` / `manuallyUnloadChunk` as needed.
         */
        this.manuallyControlChunkLoading = !!opts.manuallyControlChunkLoading

        /**
         * Defining this function sets a custom order in which to create chunks.
         * The function should look like:
         * ```js
         *   (i, j, k) => 1 // return a smaller number for chunks to process first
         * ```
         */
        this.chunkSortingDistFn = defaultSortDistance

        /**
         * Set this higher to cause chunks not to mesh until they have some neighbors.
         * Max legal value is 26 (each chunk will mesh only when all neighbors are present)
         */
        this.minNeighborsToMesh = 6

        /** When true, worldgen queues will keep running if engine is paused. */
        this.worldGenWhilePaused = !!opts.worldGenWhilePaused

        /** Limit the size of internal chunk processing queues 
         * @type {number} 
        */
        this.maxChunksPendingCreation = 50

        /** Limit the size of internal chunk processing queues 
         * @type {number} 
        */
        this.maxChunksPendingMeshing = 50

        /** Cutoff (in ms) of time spent each **tick** 
         * @type {number}
        */
        this.maxProcessingPerTick = 5

        /** Cutoff (in ms) of time spent each **render** 
         * @type {number}
        */
        this.maxProcessingPerRender = 3


        // set up internal state


        /** @internal */
        this._chunkSize = opts.chunkSize
        /** @internal */
        this._chunkAddDistance = [2, 2]
        /** @internal */
        this._chunkRemoveDistance = [3, 3]
        /** @internal */
        this._addDistanceFn = null
        /** @internal */
        this._remDistanceFn = null
        /** @internal */
        this._prevWorldName = ''
        /** @internal */
        this._prevPlayerChunkHash = 0
        /** @internal */
        this._chunkAddSearchFrom = 0
        /** @internal */
        this._prevSortingFn = null
        /** @internal */
        this._sortMeshQueueEvery = 0


        // Init internal chunk queues:

        /** @internal All chunks existing in any queue */
        this._chunksKnown = new LocationQueue()

        /** @internal in range but not yet requested from client */
        this._chunksToRequest = new LocationQueue()
        /** @internal known to have invalid data (wrong world, eg) */
        this._chunksInvalidated = new LocationQueue()
        /** @internal out of range, and waiting to be removed */
        this._chunksToRemove = new LocationQueue()

        /** @internal requested, awaiting data event from client */
        this._chunksPending = new LocationQueue()
        /** @internal has data, waiting to be (re-)meshed */
        this._chunksToMesh = new LocationQueue()
        /** @internal priority queue for chunks to re-mesh */
        this._chunksToMeshFirst = new LocationQueue()

        /** 
         * @internal A queue of chunk locations, rather than chunk references.
         * Has only the positive 1/16 quadrant, sorted (reverse order!) */
        this._chunksSortedLocs = new LocationQueue()

        // validate add/remove sizes through a setter that clients can use later
        this.setAddRemoveDistance(opts.chunkAddDistance, opts.chunkRemoveDistance)

        // chunks stored in a data structure for quick lookup
        // note that the hash wraps around every 1024 chunk indexes!!
        // i.e. two chunks that far apart can't be loaded at the same time
        /** @internal */
        this._storage = new ChunkStorage()

        // coordinate converter functions - default versions first:
        var cs = this._chunkSize
        /** @internal */
        this._coordsToChunkIndexes = chunkCoordsToIndexesGeneral
        /** @internal */
        this._coordsToChunkLocals = chunkCoordsToLocalsGeneral

        // when chunk size is a power of two, override with bit-twiddling:
        var powerOfTwo = ((cs & cs - 1) === 0)
        if (powerOfTwo) {
            /** @internal */
            this._coordShiftBits = Math.log2(cs) | 0
            /** @internal */
            this._coordMask = (cs - 1) | 0
            this._coordsToChunkIndexes = chunkCoordsToIndexesPowerOfTwo
            this._coordsToChunkLocals = chunkCoordsToLocalsPowerOfTwo
        }
    }
}





/*
 *
 *
 *
 *
 *                  PUBLIC API 
 *
 *
 *
 *
*/

World.prototype.getBlockID = function (x = 0, y = 0, z = 0) {
    var [ci, cj, ck] = this._coordsToChunkIndexes(x, y, z)
    var chunk = this._storage.getChunkByIndexes(ci, cj, ck)
    if (!chunk) return 0
    var [i, j, k] = this._coordsToChunkLocals(x, y, z)
    return chunk.voxels.get(i, j, k)
}

World.prototype.getBlockSolidity = function (x = 0, y = 0, z = 0) {
    var [ci, cj, ck] = this._coordsToChunkIndexes(x, y, z)
    var chunk = this._storage.getChunkByIndexes(ci, cj, ck)
    if (!chunk) return false
    var [i, j, k] = this._coordsToChunkLocals(x, y, z)
    return !!chunk.getSolidityAt(i, j, k)
}

World.prototype.getBlockOpacity = function (x = 0, y = 0, z = 0) {
    var id = this.getBlockID(x, y, z)
    return this.noa.registry.getBlockOpacity(id)
}

World.prototype.getBlockFluidity = function (x = 0, y = 0, z = 0) {
    var id = this.getBlockID(x, y, z)
    return this.noa.registry.getBlockFluidity(id)
}

World.prototype.getBlockProperties = function (x = 0, y = 0, z = 0) {
    var id = this.getBlockID(x, y, z)
    return this.noa.registry.getBlockProps(id)
}


World.prototype.setBlockID = function (id = 0, x = 0, y = 0, z = 0) {
    var [ci, cj, ck] = this._coordsToChunkIndexes(x, y, z)
    var chunk = this._storage.getChunkByIndexes(ci, cj, ck)
    if (!chunk) return
    var [i, j, k] = this._coordsToChunkLocals(x, y, z)
    return chunk.set(i, j, k, id)
}


/** @param box */
World.prototype.isBoxUnobstructed = function (box) {
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


/** 
 * Clients should call this after creating a chunk's worth of data (as an ndarray)  
 * If userData is passed in it will be attached to the chunk
 * @param {string} id - the string specified when the chunk was requested 
 * @param {*} array - an ndarray of voxel data
 * @param {*} userData - an arbitrary value for game client use
 * @param {number} fillVoxelID - specify a voxel ID here if you want to signify that 
 * the entire chunk should be solidly filled with that voxel (e.g. `0` for air). 
 * If you do this, the voxel array data will be overwritten and the engine will 
 * take a fast path through some initialization steps.
 */
World.prototype.setChunkData = function (id, array, userData = null, fillVoxelID = -1) {
    setChunkData(this, id, array, userData, fillVoxelID)
}



/** 
 * Sets the distances within which to load new chunks, and beyond which 
 * to unload them. Generally you want the remove distance to be somewhat
 * farther, so that moving back and forth across the same chunk border doesn't
 * keep loading/unloading the same distant chunks.
 * 
 * Both arguments can be numbers (number of voxels), or arrays like:
 * `[horiz, vert]` specifying different horizontal and vertical distances.
 * @param {number | number[]} addDist
 * @param {number | number[]} remDist
 */
World.prototype.setAddRemoveDistance = function (addDist = 2, remDist = 3) {
    var addArr = Array.isArray(addDist) ? addDist : [addDist, addDist]
    var remArr = Array.isArray(remDist) ? remDist : [remDist, remDist]
    var minGap = 1
    if (remArr[0] < addArr[0] + minGap) remArr[0] = addArr[0] + minGap
    if (remArr[1] < addArr[1] + minGap) remArr[1] = addArr[1] + minGap
    this._chunkAddDistance = addArr
    this._chunkRemoveDistance = remArr
    // rebuild chunk distance functions and add search locations
    this._addDistanceFn = makeDistanceTestFunction(addArr[0], addArr[1])
    this._remDistanceFn = makeDistanceTestFunction(remArr[0], remArr[1])
    this._chunksSortedLocs.empty()
    // this queue holds only 1/16th the search space: i=0..max, j=0..i, k=0..max
    for (var i = 0; i <= addArr[0]; i++) {
        for (var k = 0; k <= i; k++) {
            for (var j = 0; j <= addArr[1]; j++) {
                if (!this._addDistanceFn(i, j, k)) continue
                this._chunksSortedLocs.add(i, j, k)
            }
        }
    }
    // resets state of nearby chunk search
    this._prevSortingFn = null
    this._chunkAddSearchFrom = 0
}






/** 
 * Tells noa to discard voxel data within a given `AABB` (e.g. because 
 * the game client received updated data from a server). 
 * The engine will mark all affected chunks for removal, and will later emit 
 * new `worldDataNeeded` events (if the chunk is still in draw range).
 */
World.prototype.invalidateVoxelsInAABB = function (box) {
    invalidateChunksInBox(this, box)
}


/** When manually controlling chunk loading, tells the engine that the 
 * chunk containing the specified (x,y,z) needs to be created and loaded.
 * > Note: throws unless `noa.world.manuallyControlChunkLoading` is set.
 * @param x, y, z
 */
World.prototype.manuallyLoadChunk = function (x = 0, y = 0, z = 0) {
    if (!this.manuallyControlChunkLoading) throw manualErr
    var [i, j, k] = this._coordsToChunkIndexes(x, y, z)
    this._chunksKnown.add(i, j, k)
    this._chunksToRequest.add(i, j, k)
}

/** When manually controlling chunk loading, tells the engine that the 
 * chunk containing the specified (x,y,z) needs to be unloaded and disposed.
 * > Note: throws unless `noa.world.manuallyControlChunkLoading` is set.
 * @param x, y, z
 */
World.prototype.manuallyUnloadChunk = function (x = 0, y = 0, z = 0) {
    if (!this.manuallyControlChunkLoading) throw manualErr
    var [i, j, k] = this._coordsToChunkIndexes(x, y, z)
    this._chunksToRemove.add(i, j, k)
    this._chunksToMesh.remove(i, j, k)
    this._chunksToRequest.remove(i, j, k)
    this._chunksToMeshFirst.remove(i, j, k)
}
var manualErr = 'Set `noa.world.manuallyControlChunkLoading` if you need this API'




/*
 * 
 * 
 * 
 *                  internals:
 * 
 *          tick functions that process queues and trigger events
 * 
 * 
 * 
*/

/** @internal */
World.prototype.tick = function () {
    var tickStartTime = performance.now()

    // get indexes of player's current chunk, and has it changed since last tick?
    var [ci, cj, ck] = getPlayerChunkIndexes(this)
    var chunkLocHash = locationHasher(ci, cj, ck)
    var changedChunks = (chunkLocHash !== this._prevPlayerChunkHash)
    if (changedChunks) {
        this.emit('playerEnteredChunk', ci, cj, ck)
        this._prevPlayerChunkHash = chunkLocHash
        this._chunkAddSearchFrom = 0
    }

    // if world has changed, invalidate everything and ping
    // removals queue so that player's chunk gets loaded back quickly
    if (this._prevWorldName !== this.noa.worldName) {
        if (!this.manuallyControlChunkLoading) {
            markAllChunksInvalid(this)
            this._chunkAddSearchFrom = 0
            processRemoveQueue(this)
        }
        this._prevWorldName = this.noa.worldName
    }

    profile_hook('start')
    profile_queues_hook('start')

    // scan for chunks to add/remove (unless client handles manually)
    if (!this.manuallyControlChunkLoading) {
        findDistantChunksToRemove(this, ci, cj, ck)
        profile_hook('remQueue')
        findChunksToRequest(this, ci, cj, ck)
        profile_hook('addQueue')
    }

    // possibly scan for additions to meshing queue if it's empty
    findChunksToMesh(this)

    // process (create or mesh) some chunks, up to max iteration time
    var t = performance.now()
    var t1 = tickStartTime + (this.maxProcessingPerTick || 0)
    if (t < t1) t1 = t + 1
    var done1 = false
    var done2 = false
    var done3 = false
    while (t < t1) {
        if (!done1) {
            done1 = processRemoveQueue(this)
                || processRemoveQueue(this)
            profile_hook('removes')
        }
        if (!done2) {
            done2 = processRequestQueue(this)
            profile_hook('requests')
        }
        if (!done3) {
            done3 = processMeshingQueue(this, false)
            profile_hook('meshes')
        }
        if (done1 && done2 && done3) break
        t = performance.now()
    }

    // track whether the player's local chunk is loaded and ready or not
    var pChunk = this._storage.getChunkByIndexes(ci, cj, ck)
    this.playerChunkLoaded = !!pChunk

    profile_queues_hook('end', this)
    profile_hook('end')
}


/** @internal */
World.prototype.render = function () {
    // on render, quickly process the high-priority meshing queue
    // to help avoid flashes of background while neighboring chunks update
    var t = performance.now()
    var t1 = t + this.maxProcessingPerRender
    while (t < t1) {
        var done = processMeshingQueue(this, true)
        if (done) break
        t = performance.now()
    }
}


/** @internal */
World.prototype._getChunkByCoords = function (x = 0, y = 0, z = 0) {
    // let internal modules request a chunk object
    var [i, j, k] = this._coordsToChunkIndexes(x, y, z)
    return this._storage.getChunkByIndexes(i, j, k)
}










/*
 * 
 * 
 * 
 *              chunk queues and queue processing
 * 
 * 
 * 
*/

// internal accessor for chunks to queue themeselves for remeshing 
// after their data changes
World.prototype._queueChunkForRemesh = function (chunk) {
    possiblyQueueChunkForMeshing(this, chunk)
}



/** 
 * helper - chunk indexes of where the player is
 * @param {World} world 
*/
function getPlayerChunkIndexes(world) {
    var [x, y, z] = world.noa.entities.getPosition(world.noa.playerEntity)
    return world._coordsToChunkIndexes(x, y, z)
}




/** 
 * Gradually scan neighborhood chunk locs; add missing ones to "toRequest".
 * @param {World} world 
*/
function findChunksToRequest(world, ci, cj, ck) {
    var toRequest = world._chunksToRequest
    var numQueued = toRequest.count()
    var maxQueued = 50
    if (numQueued >= maxQueued) return

    // handle changes to chunk sorting function
    var sortDistFn = world.chunkSortingDistFn || defaultSortDistance
    if (sortDistFn !== world._prevSortingFn) {
        sortQueueByDistanceFrom(world, world._chunksSortedLocs, 0, 0, 0, true)
        world._prevSortingFn = sortDistFn
    }

    // consume the pre-sorted positions array, checking each loc and 
    // its reflections for locations that need to be added to request queue
    var locsArr = world._chunksSortedLocs.arr
    var ix = world._chunkAddSearchFrom
    var maxIter = Math.min(20, locsArr.length / 10)
    for (var ct = 0; ct < maxIter; ct++) {
        var [di, dj, dk] = locsArr[ix++ % locsArr.length]
        checkReflectedLocations(world, ci, cj, ck, di, dj, dk)
        if (toRequest.count() >= maxQueued) break
    }

    // only advance start point if nothing is invalidated, 
    // so that nearyby chunks stay at high priority in that case
    if (world._chunksInvalidated.isEmpty()) {
        world._chunkAddSearchFrom = ix % locsArr.length
    }

    // queue should be mostly sorted, but may not have been empty
    sortQueueByDistanceFrom(world, toRequest, ci, cj, ck, false)
}

// Helpers for checking whether to add a location, and reflections of it
var checkReflectedLocations = (world, ci, cj, ck, i, j, k) => {
    checkOneLocation(world, ci + i, cj + j, ck + k)
    if (i !== k) checkOneLocation(world, ci + k, cj + j, ck + i)
    if (i > 0) checkReflectedLocations(world, ci, cj, ck, -i, j, k)
    if (j > 0) checkReflectedLocations(world, ci, cj, ck, i, -j, k)
    if (k > 0) checkReflectedLocations(world, ci, cj, ck, i, j, -k)
}
// finally, the logic for each reflected location checked
var checkOneLocation = (world, i, j, k) => {
    if (world._chunksKnown.includes(i, j, k)) return
    world._chunksKnown.add(i, j, k)
    world._chunksToRequest.add(i, j, k, true)
}





/** 
 * Incrementally scan known chunks for any that are no longer in range.
 * Assume that the order they're removed in isn't very important.
 * @param {World} world 
*/
function findDistantChunksToRemove(world, ci, cj, ck) {
    var distCheck = world._remDistanceFn
    var toRemove = world._chunksToRemove
    var numQueued = toRemove.count() + world._chunksInvalidated.count()
    var maxQueued = 50
    if (numQueued >= maxQueued) return

    var knownArr = world._chunksKnown.arr
    if (knownArr.length === 0) return
    var maxIter = Math.min(100, knownArr.length / 10)
    var found = false
    for (var ct = 0; ct < maxIter; ct++) {
        var [i, j, k] = knownArr[removeCheckIndex++ % knownArr.length]
        if (toRemove.includes(i, j, k)) continue
        if (distCheck(i - ci, j - cj, k - ck)) continue
        // flag chunk for removal and remove it from work queues
        world._chunksToRemove.add(i, j, k)
        world._chunksToRequest.remove(i, j, k)
        world._chunksToMesh.remove(i, j, k)
        world._chunksToMeshFirst.remove(i, j, k)
        found = true
        numQueued++
        if (numQueued > maxQueued) break
    }
    removeCheckIndex = removeCheckIndex % knownArr.length
    if (found) sortQueueByDistanceFrom(world, toRemove, ci, cj, ck)
}
var removeCheckIndex = 0


/** 
 * Incrementally look for chunks that could be re-meshed
 * @param {World} world 
*/
function findChunksToMesh(world) {
    var maxQueued = 10
    var numQueued = world._chunksToMesh.count() + world._chunksToMeshFirst.count()
    if (numQueued > maxQueued) return
    var knownArr = world._chunksKnown.arr
    var maxIter = Math.min(50, knownArr.length / 10)
    for (var ct = 0; ct < maxIter; ct++) {
        var [i, j, k] = knownArr[meshCheckIndex++ % knownArr.length]
        var chunk = world._storage.getChunkByIndexes(i, j, k)
        if (!chunk) continue
        var res = possiblyQueueChunkForMeshing(world, chunk)
        if (res) numQueued++
        if (numQueued > maxQueued) break
    }
    meshCheckIndex %= knownArr.length
}
var meshCheckIndex = 0






/** 
 * invalidate chunks overlapping the given AABB
 * @param {World} world 
*/
function invalidateChunksInBox(world, box) {
    var min = world._coordsToChunkIndexes(box.base[0], box.base[1], box.base[2])
    var max = world._coordsToChunkIndexes(box.max[0], box.max[1], box.max[2])
    for (var i = 0; i < 3; i++) {
        if (!Number.isFinite(box.base[i])) min[i] = box.base[i]
        if (!Number.isFinite(box.max[i])) max[i] = box.max[i]
    }
    world._chunksKnown.forEach(loc => {
        var [i, j, k] = loc
        if (i < min[0] || i >= max[0]) return
        if (j < min[1] || j >= max[1]) return
        if (k < min[2] || k >= max[2]) return
        world._chunksInvalidated.add(i, j, k)
        world._chunksToRemove.remove(i, j, k)
        world._chunksToRequest.remove(i, j, k)
        world._chunksToMesh.remove(i, j, k)
        world._chunksToMeshFirst.remove(i, j, k)
    })
}



/** 
 * when current world changes - empty work queues and mark all for removal
 * @param {World} world 
*/
function markAllChunksInvalid(world) {
    world._chunksInvalidated.copyFrom(world._chunksKnown)
    world._chunksToRemove.empty()
    world._chunksToRequest.empty()
    world._chunksToMesh.empty()
    world._chunksToMeshFirst.empty()
    sortQueueByDistanceFrom(world, world._chunksInvalidated)
}








/** 
 * Run through chunk tracking queues looking for work to do next
 * @param {World} world 
*/
function processRequestQueue(world) {
    var toRequest = world._chunksToRequest
    if (toRequest.isEmpty()) return true
    // skip if too many outstanding requests, or if meshing queue is full
    var pending = world._chunksPending.count()
    var toMesh = world._chunksToMesh.count()
    if (pending >= world.maxChunksPendingCreation) return true
    if (toMesh >= world.maxChunksPendingMeshing) return true
    var [i, j, k] = toRequest.pop()
    requestNewChunk(world, i, j, k)
    return toRequest.isEmpty()
}


/** @param {World} world */
function processRemoveQueue(world) {
    var queue = world._chunksInvalidated
    if (queue.isEmpty()) queue = world._chunksToRemove
    if (queue.isEmpty()) return true
    var [i, j, k] = queue.pop()
    removeChunk(world, i, j, k)
    return (queue.isEmpty())
}


/** 
 * similar to above but for chunks waiting to be meshed
 * @param {World} world 
*/
function processMeshingQueue(world, firstOnly) {
    var queue = world._chunksToMeshFirst
    if (queue.isEmpty() && !firstOnly) queue = world._chunksToMesh
    if (queue.isEmpty()) return true
    var [i, j, k] = queue.pop()
    if (world._chunksToRemove.includes(i, j, k)) return
    var chunk = world._storage.getChunkByIndexes(i, j, k)
    if (chunk) doChunkRemesh(world, chunk)
}


/** @param {World} world */
function possiblyQueueChunkForMeshing(world, chunk) {
    if (!(chunk._terrainDirty || chunk._objectsDirty)) return false
    if (chunk._neighborCount < chunk.minNeighborsToMesh) return false
    if (world._chunksToMesh.includes(chunk.i, chunk.j, chunk.k)) return false
    if (world._chunksToMeshFirst.includes(chunk.i, chunk.j, chunk.k)) return false
    var queue = (chunk._neighborCount === 26) ?
        world._chunksToMeshFirst : world._chunksToMesh
    queue.add(chunk.i, chunk.j, chunk.k)
    world._sortMeshQueueEvery++
    if (world._sortMeshQueueEvery > 20) {
        sortQueueByDistanceFrom(world, queue)
        world._sortMeshQueueEvery = 0
    }
    return true
}






/*
 * 
 * 
 * 
 *              chunk lifecycle - create / set / remove / modify
 * 
 * 
 * 
*/


/** 
 * create chunk object and request voxel data from client
 * @param {World} world 
*/
function requestNewChunk(world, i, j, k) {
    var size = world._chunkSize
    var dataArr = Chunk._createVoxelArray(world._chunkSize)
    var worldName = world.noa.worldName
    var requestID = [i, j, k, worldName].join('|')
    var x = i * size
    var y = j * size
    var z = k * size
    world._chunksPending.add(i, j, k)
    world.emit('worldDataNeeded', requestID, dataArr, x, y, z, worldName)
    profile_queues_hook('request')
}

/** 
 * called when client sets a chunk's voxel data
 * If userData is passed in it will be attached to the chunk
 * @param {World} world 
*/
function setChunkData(world, reqID, array, userData, fillVoxelID) {
    var arr = reqID.split('|')
    var i = parseInt(arr.shift())
    var j = parseInt(arr.shift())
    var k = parseInt(arr.shift())
    var worldName = arr.join('|')
    world._chunksPending.remove(i, j, k)
    // discard data if it's for a world that's no longer current
    if (worldName !== world.noa.worldName) return
    // discard if chunk is no longer needed
    if (!world._chunksKnown.includes(i, j, k)) return
    if (world._chunksToRemove.includes(i, j, k)) return

    var chunk = world._storage.getChunkByIndexes(i, j, k)
    if (!chunk) {
        // if chunk doesn't exist, create and init
        var size = world._chunkSize
        chunk = new Chunk(world.noa, reqID, i, j, k, size, array, fillVoxelID)
        world._storage.storeChunkByIndexes(i, j, k, chunk)
        chunk.userData = userData
        world.noa.rendering.prepareChunkForRendering(chunk)
        world.emit('chunkAdded', chunk)
    } else {
        // else we're updating data for an existing chunk
        chunk._updateVoxelArray(array, fillVoxelID)
    }
    // chunk can now be meshed, and ping neighbors
    possiblyQueueChunkForMeshing(world, chunk)
    updateNeighborsOfChunk(world, i, j, k, chunk)

    profile_queues_hook('receive')
}



/** 
 * remove a chunk that wound up in the remove queue
 * @param {World} world 
*/
function removeChunk(world, i, j, k) {
    var chunk = world._storage.getChunkByIndexes(i, j, k)

    if (chunk) {
        world.emit('chunkBeingRemoved', chunk.requestID, chunk.voxels, chunk.userData)
        world.noa.rendering.disposeChunkForRendering(chunk)
        chunk.dispose()
        profile_queues_hook('dispose')
        updateNeighborsOfChunk(world, i, j, k, null)
    }

    world._storage.removeChunkByIndexes(i, j, k)
    world._chunksKnown.remove(i, j, k)
    world._chunksToMesh.remove(i, j, k)
    world._chunksToRemove.remove(i, j, k)
    world._chunksToMeshFirst.remove(i, j, k)
}


/** @param {World} world */
function doChunkRemesh(world, chunk) {
    world._chunksToMesh.remove(chunk.i, chunk.j, chunk.k)
    world._chunksToMeshFirst.remove(chunk.i, chunk.j, chunk.k)
    chunk.updateMeshes()
    profile_queues_hook('mesh')
}










/*
 * 
 * 
 *          two different versions of logic to convert
 *          chunk coords to chunk indexes or local scope
 * 
 * 
*/

function chunkCoordsToIndexesGeneral(x, y, z) {
    var cs = this._chunkSize
    return [Math.floor(x / cs) | 0, Math.floor(y / cs) | 0, Math.floor(z / cs) | 0]
}
function chunkCoordsToLocalsGeneral(x, y, z) {
    var cs = this._chunkSize
    var i = (x % cs) | 0; if (i < 0) i += cs
    var j = (y % cs) | 0; if (j < 0) j += cs
    var k = (z % cs) | 0; if (k < 0) k += cs
    return [i, j, k]
}
function chunkCoordsToIndexesPowerOfTwo(x, y, z) {
    var shift = this._coordShiftBits
    return [(x >> shift) | 0, (y >> shift) | 0, (z >> shift) | 0]
}
function chunkCoordsToLocalsPowerOfTwo(x, y, z) {
    var mask = this._coordMask
    return [(x & mask) | 0, (y & mask) | 0, (z & mask) | 0]
}







/*
 * 
 * 
 * 
 *          misc helpers and implementation functions
 * 
 * 
 * 
*/

/** 
 * sorts DESCENDING, unless reversed
 * @param {World} world 
*/
function sortQueueByDistanceFrom(world, queue, pi, pj, pk, reverse = false) {
    var distFn = world.chunkSortingDistFn || defaultSortDistance
    var localDist = (i, j, k) => distFn(pi - i, pj - j, pk - k)
    if (pi === undefined) {
        [pi, pj, pk] = getPlayerChunkIndexes(world)
    }
    queue.sortByDistance(localDist, reverse)
}
var defaultSortDistance = (i, j, k) => (i * i) + (j * j) + (k * k)




/** 
 * keep neighbor data updated when chunk is added or removed
 * @param {World} world 
*/
function updateNeighborsOfChunk(world, ci, cj, ck, chunk) {
    var terrainChanged = (!chunk) || (chunk && !chunk.isEmpty)
    for (var i = -1; i <= 1; i++) {
        for (var j = -1; j <= 1; j++) {
            for (var k = -1; k <= 1; k++) {
                if ((i | j | k) === 0) continue
                var neighbor = world._storage.getChunkByIndexes(ci + i, cj + j, ck + k)
                if (!neighbor) continue
                // flag neighbor, assume terrain needs remeshing
                if (terrainChanged) neighbor._terrainDirty = true
                // update neighbor counts and references, both ways
                if (chunk && !chunk._neighbors.get(i, j, k)) {
                    chunk._neighborCount++
                    chunk._neighbors.set(i, j, k, neighbor)
                }
                var nabRef = neighbor._neighbors.get(-i, -j, -k)
                if (chunk && !nabRef) {
                    neighbor._neighborCount++
                    neighbor._neighbors.set(-i, -j, -k, chunk)
                    // immediately queue neighbor if it's surrounded
                    if (neighbor._neighborCount === 26) {
                        possiblyQueueChunkForMeshing(world, neighbor)
                    }
                }
                if (!chunk && nabRef) {
                    neighbor._neighborCount--
                    neighbor._neighbors.set(-i, -j, -k, null)
                }
            }
        }
    }
}


// make a function to check if an (i,j,k) is within a sphere/ellipse of given size
function makeDistanceTestFunction(xsize, ysize) {
    var asq = xsize * xsize
    var bsq = ysize * ysize
    // spherical case
    if (xsize === ysize) return (i, j, k) => (i * i + j * j + k * k <= asq)
    // otherwise do clipped spheres for now
    if (xsize > ysize) return (i, j, k) => {
        if (Math.abs(j) > ysize) return false
        return (i * i + j * j + k * k <= asq)
    }
    return (i, j, k) => {
        var dxsq = i * i + k * k
        if (dxsq > asq) return false
        return (dxsq + j * j <= bsq)
    }
}










/*
 * 
 * 
 * 
 * 
 *                  debugging
 * 
 * 
 * 
 * 
*/

/** @internal */
World.prototype.report = function () {
    console.log('World report - playerChunkLoaded: ', this.playerChunkLoaded)
    _report(this, '  known:     ', this._chunksKnown.arr, true)
    _report(this, '  to request:', this._chunksToRequest.arr, 0)
    _report(this, '  to remove: ', this._chunksToRemove.arr, 0)
    _report(this, '  invalid:   ', this._chunksInvalidated.arr, 0)
    _report(this, '  creating:  ', this._chunksPending.arr, 0)
    _report(this, '  to mesh:   ', this._chunksToMesh.arr, 0)
    _report(this, '  mesh 1st:  ', this._chunksToMeshFirst.arr, 0)
}

function _report(world, name, arr, ext) {
    var full = 0,
        empty = 0,
        exist = 0,
        surrounded = 0,
        remeshes = []
    arr.forEach(loc => {
        var chunk = world._storage.getChunkByIndexes(loc[0], loc[1], loc[2])
        if (!chunk) return
        exist++
        remeshes.push(chunk._timesMeshed)
        if (chunk._isFull) full++
        if (chunk._isEmpty) empty++
        if (chunk._neighborCount === 26) surrounded++
    })
    var out = arr.length.toString().padEnd(8)
    out += ('exist: ' + exist).padEnd(12)
    out += ('full: ' + full).padEnd(12)
    out += ('empty: ' + empty).padEnd(12)
    out += ('surr: ' + surrounded).padEnd(12)
    if (ext) {
        var sum = remeshes.reduce((acc, val) => acc + val, 0)
        var max = remeshes.reduce((acc, val) => Math.max(acc, val), 0)
        var min = remeshes.reduce((acc, val) => Math.min(acc, val), 0)
        out += 'times meshed: avg ' + (sum / exist).toFixed(2)
        out += '  max ' + max
        out += '  min ' + min
    }
    console.log(name, out)
}


import { makeProfileHook } from './util'
var profile_hook = makeProfileHook(PROFILE_EVERY, 'world ticks:', 1)
var profile_queues_hook = ((every) => {
    if (!(every > 0)) return () => { }
    var iter = 0
    var counts = {}
    var queues = {}
    var started = performance.now()
    return function profile_queues_hook(state, world) {
        if (state === 'start') return
        if (state !== 'end') return counts[state] = (counts[state] || 0) + 1
        queues.toreq = (queues.toreq || 0) + world._chunksToRequest.count()
        queues.toget = (queues.toget || 0) + world._chunksPending.count()
        queues.tomesh = (queues.tomesh || 0) + world._chunksToMesh.count() + world._chunksToMeshFirst.count()
        queues.tomesh1 = (queues.tomesh1 || 0) + world._chunksToMeshFirst.count()
        queues.torem = (queues.torem || 0) + world._chunksToRemove.count()
        if (++iter < every) return
        var t = performance.now(), dt = t - started
        var res = {}
        Object.keys(queues).forEach(k => {
            var num = Math.round((queues[k] || 0) / iter)
            res[k] = `[${num}]`.padStart(5)
        })
        Object.keys(counts).forEach(k => {
            var num = Math.round((counts[k] || 0) * 1000 / dt)
            res[k] = ('' + num).padStart(3)
        })
        console.log('chunk flow: ',
            `${res.toreq}-> ${res.request || 0} req/s  `,
            `${res.toget}-> ${res.receive || 0} got/s  `,
            `${(res.tomesh)}-> ${res.mesh || 0} mesh/s  `,
            `${res.torem}-> ${res.dispose || 0} rem/s  `,
            `(meshFirst: ${res.tomesh1.trim()})`,
        )
        iter = 0
        counts = {}
        queues = {}
        started = performance.now()
    }
})(PROFILE_QUEUES_EVERY)
