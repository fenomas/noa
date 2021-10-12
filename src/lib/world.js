/** 
 * The World class is found at [[World | `noa.world`]].
 * @module noa.world
 */


import EventEmitter from 'events'
import Chunk from './chunk'
import { LocationQueue, ChunkStorage, locationHasher, loopForTime } from './util'

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
 * object passed to the [[Engine]]):
 * ```js
 * var defaultOptions = {
 *   chunkSize: 24,
 *   chunkAddDistance: [2, 2],           // [horizontal, vertical]
 *   chunkRemoveDistance: [3, 3],        // [horizontal, vertical]
 *   worldGenWhilePaused: false,
 *   manuallyControlChunkLoading: false,
 * }
 * ```
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
        this.maxChunksPendingCreation = 10

        /** Limit the size of internal chunk processing queues 
         * @type {number} 
        */
        this.maxChunksPendingMeshing = 10

        /** Cutoff (in ms) of time spent each **tick** 
         * @type {number}
        */
        this.maxProcessingPerTick = 9

        /** Cutoff (in ms) of time spent each **render** 
         * @type {number}
        */
        this.maxProcessingPerRender = 5


        // set up internal state


        /** @internal */
        this._chunkSize = opts.chunkSize
        /** @internal */
        this._chunkAddDistance = [1, 1]
        /** @internal */
        this._chunkRemoveDistance = [1, 1]
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
        this._chunksKnown = null
        /** @internal */
        this._chunksPending = null
        /** @internal */
        this._chunksToRequest = null
        /** @internal */
        this._chunksToRemove = null
        /** @internal */
        this._chunksToMesh = null
        /** @internal */
        this._chunksToMeshFirst = null
        /** @internal */
        this._chunksSortedLocs = null
        initChunkQueues(this)

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
            /** @internal */
            this._coordsToChunkIndexes = chunkCoordsToIndexesPowerOfTwo
            /** @internal */
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

/** @param x,y,z */
World.prototype.getBlockID = function (x, y, z) {
    var [ci, cj, ck] = this._coordsToChunkIndexes(x, y, z)
    var chunk = this._storage.getChunkByIndexes(ci, cj, ck)
    if (!chunk) return 0
    var [i, j, k] = this._coordsToChunkLocals(x, y, z)
    return chunk.voxels.get(i, j, k)
}

/** @param x,y,z */
World.prototype.getBlockSolidity = function (x, y, z) {
    var [ci, cj, ck] = this._coordsToChunkIndexes(x, y, z)
    var chunk = this._storage.getChunkByIndexes(ci, cj, ck)
    if (!chunk) return false
    var [i, j, k] = this._coordsToChunkLocals(x, y, z)
    return !!chunk.getSolidityAt(i, j, k)
}

/** @param x,y,z */
World.prototype.getBlockOpacity = function (x, y, z) {
    var id = this.getBlockID(x, y, z)
    return this.noa.registry.getBlockOpacity(id)
}

/** @param x,y,z */
World.prototype.getBlockFluidity = function (x, y, z) {
    var id = this.getBlockID(x, y, z)
    return this.noa.registry.getBlockFluidity(id)
}

/** @param x,y,z */
World.prototype.getBlockProperties = function (x, y, z) {
    var id = this.getBlockID(x, y, z)
    return this.noa.registry.getBlockProps(id)
}



/** @param val,x,y,z */
World.prototype.setBlockID = function (val, x, y, z) {
    var [ci, cj, ck] = this._coordsToChunkIndexes(x, y, z)
    var chunk = this._storage.getChunkByIndexes(ci, cj, ck)
    if (!chunk) return
    var [i, j, k] = this._coordsToChunkLocals(x, y, z)
    return chunk.set(i, j, k, val, x, y, z)
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


/** client should call this after creating a chunk's worth of data (as an ndarray)  
 * If userData is passed in it will be attached to the chunk
 * @param id
 * @param array
 * @param userData
 */
World.prototype.setChunkData = function (id, array, userData) {
    setChunkData(this, id, array, userData)
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






/** Tells noa to discard voxel data within a given `AABB` (e.g. because 
 * the game client received updated data from a server). 
 * The engine will mark all affected chunks for disposal, and will later emit 
 * new `worldDataNeeded` events (if the chunk is still in draw range).
 * Note that chunks invalidated this way will not emit a `chunkBeingRemoved` event 
 * for the client to save data from.
 */
World.prototype.invalidateVoxelsInAABB = function (box) {
    invalidateChunksInBox(this, box)
}


/** When manually controlling chunk loading, tells the engine that the 
 * chunk containing the specified (x,y,z) needs to be created and loaded.
 * > Note: has no effect when `noa.world.manuallyControlChunkLoading` is not set.
 * @param x, y, z
 */
World.prototype.manuallyLoadChunk = function (x, y, z) {
    if (!this.manuallyControlChunkLoading) throw manualErr
    var [i, j, k] = this._coordsToChunkIndexes(x, y, z)
    this._chunksKnown.add(i, j, k)
    this._chunksToRequest.add(i, j, k)
}

/** When manually controlling chunk loading, tells the engine that the 
 * chunk containing the specified (x,y,z) needs to be unloaded and disposed.
 * > Note: has no effect when `noa.world.manuallyControlChunkLoading` is not set.
 * @param x, y, z
 */
World.prototype.manuallyUnloadChunk = function (x, y, z) {
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

    // if world has changed, mark everything to be removed, and ping 
    // removals queue so that player's chunk gets loaded back quickly
    if (this._prevWorldName !== this.noa.worldName) {
        markAllChunksForRemoval(this)
        this._prevWorldName = this.noa.worldName
        this._chunkAddSearchFrom = 0
        processRemoveQueue(this)
    }

    profile_hook('start')
    profile_queues_hook('start')

    // scan for chunks to add/remove (unless client handles manually)
    if (!this.manuallyControlChunkLoading) {
        if (changedChunks) {
            findDistantChunksToRemove(this, ci, cj, ck)
            profile_hook('remQueue')
        }
        findNewChunksInRange(this, ci, cj, ck)
        profile_hook('addQueue')
    }

    // process (create or mesh) some chunks, up to max iteration time
    var ptime = Math.max(1, this.maxProcessingPerTick || 0)
    var done1 = false
    var done2 = false
    var done3 = false
    loopForTime(ptime, () => {
        if (!done1) done1 = processRequestQueue(this); profile_hook('requests')
        if (!done2) done2 = processMeshingQueue(this, false); profile_hook('meshes')
        if (!done3) {
            done3 = processRemoveQueue(this)
                || processRemoveQueue(this)
                || processRemoveQueue(this)
            profile_hook('removes')
        }
        return (done1 && done2 && done3)
    }, tickStartTime)

    // if time is left over, look for low-priority extra meshing
    var dt = performance.now() - tickStartTime
    ptime -= dt
    if (ptime > 0.5) {
        lookForChunksToMesh(this)
        profile_hook('looking')
        loopForTime(ptime, () => processMeshingQueue(this, false), tickStartTime)
        profile_hook('meshes')
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
    var mpr = this.maxProcessingPerRender
    if (mpr > 0) loopForTime(mpr, () => {
        return processMeshingQueue(this, true)
    })
}


/** @internal */
World.prototype._getChunkByCoords = function (x, y, z) {
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


function initChunkQueues(world) {
    // queue meanings:
    //    Known:        all chunks existing in any queue
    //    ToRequest:    needed but not yet requested from client
    //    Pending:      requested, awaiting data event from client
    //    ToMesh:       has data, but not yet meshed (or re-meshed)
    //    ToMeshFirst:  priority version of the previous
    //    ToRemove:     chunks awaiting disposal
    //    SortedLocs:   locations in 1/16th quadrant of add area, sorted (reverse order of other queues!)
    world._chunksKnown = new LocationQueue()
    world._chunksToMesh = new LocationQueue()
    world._chunksPending = new LocationQueue()
    world._chunksToRemove = new LocationQueue()
    world._chunksToRequest = new LocationQueue()
    world._chunksToMeshFirst = new LocationQueue()
    world._chunksSortedLocs = new LocationQueue()
}

// internal accessor for chunks to queue themeselves for remeshing 
// after their data changes
World.prototype._queueChunkForRemesh = function (chunk) {
    possiblyQueueChunkForMeshing(this, chunk)
}



// helper - chunk indexes of where the player is
function getPlayerChunkIndexes(world) {
    var [x, y, z] = world.noa.entities.getPosition(world.noa.playerEntity)
    return world._coordsToChunkIndexes(x, y, z)
}




// process neighborhood chunks, add missing ones to "toRequest" and "inMemory"
function findNewChunksInRange(world, ci, cj, ck) {
    var toRequest = world._chunksToRequest
    var startIx = world._chunkAddSearchFrom
    var locs = world._chunksSortedLocs
    if (startIx >= locs.arr.length) return

    // don't bother if in progress and request queue is backed up
    if (world._chunksToRequest.count() > 50) return

    // conform of chunk location sorting function
    if (world._prevSortingFn !== world.chunkSortingDistFn) {
        if (!world.chunkSortingDistFn) world.chunkSortingDistFn = defaultSortDistance
        sortQueueByDistanceFrom(locs, 0, 0, 0, world.chunkSortingDistFn, true)
        world._prevSortingFn = world.chunkSortingDistFn
    }

    // consume the pre-sorted positions array, checking each loc and its reflections
    // add new locations, and remember if any have been seen that are pending removal
    // store the recursion state in a little object to keep things clean (er?)
    checkingState.removals = 0
    checkingState.ci = ci
    checkingState.cj = cj
    checkingState.ck = ck
    var posArr = world._chunksSortedLocs.arr
    for (var i = startIx; i < posArr.length; i++) {
        var [di, dj, dk] = posArr[i]
        checkReflectedLocations(world, checkingState, di, dj, dk)
        // store progress and break early differently depending on if removals were seen
        if (checkingState.removals === 0) {
            world._chunkAddSearchFrom = i + 1
            if (toRequest.count() > 100) break
            if (i - startIx > 50) break
        } else {
            if (toRequest.count() > 50) break
            if (i - startIx > 5) break
        }
    }

    // queue should be mostly sorted, but may not have been empty
    sortQueueByDistanceFrom(toRequest, ci, cj, ck, world.chunkSortingDistFn)
}

// Helpers for checking whether to add a location, and reflections of it
var checkingState = {}
var checkReflectedLocations = (world, state, i, j, k) => {
    checkOneLocation(world, state, state.ci + i, state.cj + j, state.ck + k)
    if (i !== k) checkOneLocation(world, state, state.ci + k, state.cj + j, state.ck + i)
    if (i > 0) checkReflectedLocations(world, state, -i, j, k)
    if (j > 0) checkReflectedLocations(world, state, i, -j, k)
    if (k > 0) checkReflectedLocations(world, state, i, j, -k)
}
var checkOneLocation = (world, state, i, j, k) => {
    if (world._chunksKnown.includes(i, j, k)) {
        if (world._chunksToRemove.includes(i, j, k)) state.removals++
    } else {
        world._chunksKnown.add(i, j, k)
        world._chunksToRequest.addToFront(i, j, k)
    }
}







// rebuild queue of chunks to be removed from around (ci,cj,ck)
function findDistantChunksToRemove(world, ci, cj, ck) {
    var distFn = world._remDistanceFn
    var toRemove = world._chunksToRemove
    world._chunksKnown.forEach(([i, j, k]) => {
        if (toRemove.includes(i, j, k)) return
        if (distFn(i - ci, j - cj, k - ck)) return
        // flag chunk for removal and remove it from work queues
        world._chunksToRemove.add(i, j, k)
        world._chunksToMesh.remove(i, j, k)
        world._chunksToRequest.remove(i, j, k)
        world._chunksToMeshFirst.remove(i, j, k)
    })
    sortQueueByDistanceFrom(toRemove, ci, cj, ck, world.chunkSortingDistFn)
}


// invalidate chunks overlapping the given AABB
function invalidateChunksInBox(world, box) {
    var min = world._coordsToChunkIndexes(box.base[0], box.base[1], box.base[2])
    var max = world._coordsToChunkIndexes(box.max[0], box.max[1], box.max[2])
    for (var i = 0; i < 3; i++) {
        if (!Number.isFinite(box.base[i])) min[i] = box.base[i]
        if (!Number.isFinite(box.max[i])) max[i] = box.max[i]
    }
    world._chunksKnown.forEach(loc => {
        for (var i = 0; i < 3; i++) {
            if (loc[i] < min[i] || loc[i] >= max[i]) return
        }
        world._chunksToRemove.add(loc[0], loc[1], loc[2])
        world._chunksToMesh.remove(loc[0], loc[1], loc[2])
        world._chunksToRequest.remove(loc[0], loc[1], loc[2])
        world._chunksToMeshFirst.remove(loc[0], loc[1], loc[2])
    })
}



// when current world changes - empty work queues and mark all for removal
function markAllChunksForRemoval(world) {
    world._chunksToRemove.copyFrom(world._chunksKnown)
    world._chunksToRequest.empty()
    world._chunksToMesh.empty()
    world._chunksToMeshFirst.empty()
    var [i, j, k] = getPlayerChunkIndexes(world)
    sortQueueByDistanceFrom(world._chunksToRemove, i, j, k, world.chunkSortingDistFn)
}



// incrementally look for chunks that could be re-meshed
function lookForChunksToMesh(world) {
    var limit = 5
    var numQueued = world._chunksToMesh.count() + world._chunksToMeshFirst.count()
    if (numQueued > limit) return
    var knownLocs = world._chunksKnown.arr
    var ct = Math.min(50, knownLocs.length)
    for (var n = 0; n < ct; n++) {
        lookIndex = (lookIndex + 1) % knownLocs.length
        var [i, j, k] = knownLocs[lookIndex]
        var chunk = world._storage.getChunkByIndexes(i, j, k)
        if (!chunk) continue
        var res = possiblyQueueChunkForMeshing(world, chunk)
        if (res) numQueued++
        if (numQueued > limit) return
    }
}
var lookIndex = -1



// run through chunk tracking queues looking for work to do next
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


function processRemoveQueue(world) {
    var toRemove = world._chunksToRemove
    if (toRemove.isEmpty()) return true
    var [i, j, k] = toRemove.pop()
    removeChunk(world, i, j, k)
    return (toRemove.isEmpty())
}


// similar to above but for chunks waiting to be meshed
function processMeshingQueue(world, firstOnly) {
    var queue = world._chunksToMeshFirst
    if (queue.isEmpty() && !firstOnly) queue = world._chunksToMesh
    if (queue.isEmpty()) return true
    var [i, j, k] = queue.pop()
    if (world._chunksToRemove.includes(i, j, k)) return
    var chunk = world._storage.getChunkByIndexes(i, j, k)
    if (chunk) doChunkRemesh(world, chunk)
}


function possiblyQueueChunkForMeshing(world, chunk) {
    if (!(chunk._terrainDirty || chunk._objectsDirty)) return false
    if (chunk._neighborCount < chunk.minNeighborsToMesh) return false
    if (world._chunksToMesh.includes(chunk.i, chunk.j, chunk.k)) return false
    if (world._chunksToMeshFirst.includes(chunk.i, chunk.j, chunk.k)) return false
    var queue = (chunk._neighborCount === 26) ?
        world._chunksToMeshFirst : world._chunksToMesh
    queue.add(chunk.i, chunk.j, chunk.k)
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


// create chunk object and request voxel data from client
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

// called when client sets a chunk's voxel data
// If userData is passed in it will be attached to the chunk
function setChunkData(world, reqID, array, userData) {
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
        chunk = new Chunk(world.noa, reqID, i, j, k, size, array)
        world._storage.storeChunkByIndexes(i, j, k, chunk)
        chunk.userData = userData
        world.noa.rendering.prepareChunkForRendering(chunk)
        world.emit('chunkAdded', chunk)
    } else {
        // else we're updating data for an existing chunk
        chunk._updateVoxelArray(array)
    }
    // chunk can now be meshed, and ping neighbors
    possiblyQueueChunkForMeshing(world, chunk)
    updateNeighborsOfChunk(world, i, j, k, chunk)

    profile_queues_hook('receive')
}



// remove a chunk that wound up in the remove queue
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
    world._chunksToMeshFirst.remove(i, j, k)
}


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


function sortQueueByDistanceFrom(queue, pi, pj, pk, distFn, reverse = false) {
    if (reverse) {
        queue.sortByDistance((i, j, k) => -distFn(pi - i, pj - j, pk - k))
    } else {
        queue.sortByDistance((i, j, k) => distFn(pi - i, pj - j, pk - k))
    }
}
var defaultSortDistance = (i, j, k) => (i * i) + (j * j) + (k * k)




// keep neighbor data updated when chunk is added or removed
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
    _report(this, '  creating:  ', this._chunksPending.arr, 0)
    _report(this, '  to mesh:   ', this._chunksToMesh.arr.concat(this._chunksToMeshFirst.arr), 0)
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