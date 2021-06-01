
import EventEmitter from 'events'
import Chunk from './chunk'
import { LocationQueue, ChunkStorage, locationHasher } from './util'
import { loopForTime, iterateOverShellAtDistance } from './util'

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

    /** @internal @prop _chunksKnown */
    /** @internal @prop _chunksPending */
    /** @internal @prop _chunksToRequest */
    /** @internal @prop _chunksToRemove */
    /** @internal @prop _chunksToMesh */
    /** @internal @prop _chunksToMeshFirst */


    /** @internal */
    constructor(noa, opts) {
        super()
        this.noa = noa
        opts = Object.assign({}, defaultOptions, opts)

        this.playerChunkLoaded = false
        this.Chunk = Chunk // expose this class for   ..reasons

        // settings
        this.chunkSize = opts.chunkSize
        this.chunkAddDistance = [1, 1]
        this.chunkRemoveDistance = [1, 1]

        // validate add/remove sizes through a setter that clients can use later
        this.setAddRemoveDistance(opts.chunkAddDistance, opts.chunkRemoveDistance)

        // game clients should set this if they need to manually control 
        // which chunks to load and unload.
        // when set, client should call noa.world.manuallyLoadChunk / UnloadChunk
        this.manuallyControlChunkLoading = !!opts.manuallyControlChunkLoading

        // set this higher to cause chunks not to mesh until they have some neighbors
        this.minNeighborsToMesh = 6
        
        // settings for tuning worldgen behavior and throughput
        this.maxChunksPendingCreation = 10
        this.maxChunksPendingMeshing = 10
        this.maxProcessingPerTick = 9           // ms
        this.maxProcessingPerRender = 5         // ms
        this.worldGenWhilePaused = opts.worldGenWhilePaused

        // set up internal state
        this._cachedWorldName = ''
        this._lastPlayerChunkHash = 0
        this._chunkAddSearchDistance = 0
        
        this._chunksKnown = null
        this._chunksPending = null
        this._chunksToRequest = null
        this._chunksToRemove = null
        this._chunksToMesh = null
        this._chunksToMeshFirst = null
        initChunkQueues(this)

        // chunks stored in a data structure for quick lookup
        // note that the hash wraps around every 1024 chunk indexes!!
        // i.e. two chunks that far apart can't be loaded at the same time
        this._storage = new ChunkStorage()

        // coordinate converter functions - default versions first:
        var cs = this.chunkSize
        this._coordsToChunkIndexes = chunkCoordsToIndexesGeneral
        this._coordsToChunkLocals = chunkCoordsToLocalsGeneral

        // when chunk size is a power of two, override with bit-twiddling:
        var powerOfTwo = ((cs & cs - 1) === 0)
        if (powerOfTwo) {
            this._coordShiftBits = Math.log2(cs) | 0
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



/** Sets the distances within which to load new chunks, and beyond which 
 * to unload them. Generally you want the remove distance to be somewhat
 * farther, so that moving back and forth across the same chunk border doesn't
 * keep loading/unloading the same distant chunks.
 * 
 * Both arguments can be numbers (number of voxels), or arrays like:
 * `[horiz, vert]` specifying different horizontal and vertial distances.
 */
World.prototype.setAddRemoveDistance = function (addDist = 2, remDist = 3) {
    var addArr = Array.isArray(addDist) ? addDist : [addDist, addDist]
    var remArr = Array.isArray(remDist) ? remDist : [remDist, remDist]
    var minGap = 1
    if (remArr[0] < addArr[0] + minGap) remArr[0] = addArr[0] + minGap
    if (remArr[1] < addArr[1] + minGap) remArr[1] = addArr[1] + minGap
    this.chunkAddDistance = addArr
    this.chunkRemoveDistance = remArr
    // resets state of nearby chunk search
    this._chunkAddSearchDistance = 0
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


World.prototype.tick = function () {
    var tickStartTime = performance.now()

    // if world has changed, mark everything to be removed and re-requested
    if (this._cachedWorldName !== this.noa.worldName) {
        markAllChunksForRemoval(this)
        this._cachedWorldName = this.noa.worldName
        this._chunkAddSearchDistance = 0
    }

    // base logic around indexes of player's current chunk
    var [ci, cj, ck] = getPlayerChunkIndexes(this)

    // player changed chunks since last tick?
    var chunkLocHash = locationHasher(ci, cj, ck)
    var changedChunks = (chunkLocHash != this._lastPlayerChunkHash)
    if (changedChunks) {
        this.emit('playerEnteredChunk', ci, cj, ck)
        this._lastPlayerChunkHash = chunkLocHash
        this._chunkAddSearchDistance = 0
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
    var ptime = Math.max(0.5, this.maxProcessingPerTick)
    loopForTime(ptime, () => {
        var done = processRequestQueue(this)
        profile_hook('requests')
        done = done && processRemoveQueue(this)
        profile_hook('removes')
        done = done && processMeshingQueue(this, false)
        profile_hook('meshes')
        return done
    }, tickStartTime)

    // when time is left over, look for low-priority extra meshing
    var dt = performance.now() - tickStartTime
    ptime -= dt
    if (ptime > 0.5) {
        lookForChunksToMesh(this)
        profile_hook('looking')
        loopForTime(ptime, () => {
            var done = processMeshingQueue(this, false)
            profile_hook('meshes')
            return done
        }, tickStartTime)
    }

    // track whether the player's local chunk is loaded and ready or not
    var pChunk = this._storage.getChunkByIndexes(ci, cj, ck)
    this.playerChunkLoaded = !!pChunk

    profile_queues_hook('end', this)
    profile_hook('end')
}


World.prototype.render = function () {
    // on render, quickly process the high-priority meshing queue
    // to help avoid flashes of background while neighboring chunks update
    var mpr = this.maxProcessingPerRender
    if (mpr > 0) loopForTime(mpr, () => {
        return processMeshingQueue(this, true)
    })
}


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
    //    Pending:      requested, awaiting creation
    //    ToMesh:       created but not yet meshed
    //    ToMeshFirst:  priority meshing queue
    //    ToRemove:     chunks awaiting disposal
    world._chunksKnown = new LocationQueue()
    world._chunksToMesh = new LocationQueue()
    world._chunksPending = new LocationQueue()
    world._chunksToRemove = new LocationQueue()
    world._chunksToRequest = new LocationQueue()
    world._chunksToMeshFirst = new LocationQueue()
}

// internal accessor chunks to queue themeselves for remeshing
World.prototype._queueChunkForRemesh = function (chunk) {
    possiblyQueueChunkForMeshing(this, chunk)
}



// helper - chunk indexes of where the player is
function getPlayerChunkIndexes(world) {
    var pos = world.noa.entities.getPosition(world.noa.playerEntity)
    return world._coordsToChunkIndexes(pos[0], pos[1], pos[2])
}




// process neighborhood chunks, add missing ones to "toRequest" and "inMemory"
function findNewChunksInRange(world, ci, cj, ck) {
    var toRequest = world._chunksToRequest
    if (toRequest.count() > 50) return
    var addX = Math.ceil(world.chunkAddDistance[0])
    var addY = Math.ceil(world.chunkAddDistance[1])
    var addMax = Math.max(addX, addY)
    if (world._chunkAddSearchDistance > addMax) return

    var addDistSq = 2 * (addX * addX) + addY * addY
    var known = world._chunksKnown
    var toRemove = world._chunksToRemove

    // search all nearby chunk locations
    var dist = Math.max(0, world._chunkAddSearchDistance)
    var removalsFound = false
    var maxCountReached = false
    for (; dist <= addMax; dist++) {
        iterateOverShellAtDistance(dist, addX, addY, (di, dj, dk) => {
            var i = ci + di
            var j = cj + dj
            var k = ck + dk
            if (known.includes(i, j, k)) {
                if (toRemove.includes(i, j, k)) removalsFound = true
                return false
            }
            var distSq = di * di + dj * dj + dk * dk
            if (distSq > addDistSq) return false
            known.add(i, j, k)
            toRequest.add(i, j, k)
            if (toRequest.count() > 100) {
                maxCountReached = true
                return true
            }
        })
        if (maxCountReached) break
        if (!removalsFound) world._chunkAddSearchDistance = dist + 1
    }
    sortQueueByDistanceFrom(toRequest, ci, cj, ck)
}


// rebuild queue of chunks to be removed from around (ci,cj,ck)
function findDistantChunksToRemove(world, ci, cj, ck) {
    var rx = world.chunkRemoveDistance[0]
    var ry = world.chunkRemoveDistance[1]
    var remDistSqX = 2 * (rx * rx)
    var remDistSq = 2 * (rx * rx) + ry * ry
    var toRemove = world._chunksToRemove
    world._chunksKnown.forEach(loc => {
        if (toRemove.includes(loc[0], loc[1], loc[2])) return
        var di = loc[0] - ci
        var dj = loc[1] - cj
        var dk = loc[2] - ck
        var dx = di * di + dk * dk
        if ((Math.abs(dj) <= ry) &&
            (dx <= remDistSqX) &&
            (dx + dj * dj <= remDistSq)) return
        // flag chunk for removal and remove it from work queues
        world._chunksToRemove.add(loc[0], loc[1], loc[2])
        world._chunksToMesh.remove(loc[0], loc[1], loc[2])
        world._chunksToRequest.remove(loc[0], loc[1], loc[2])
        world._chunksToMeshFirst.remove(loc[0], loc[1], loc[2])
    })
    sortQueueByDistanceFrom(toRemove, ci, cj, ck)
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
    var loc = getPlayerChunkIndexes(world)
    sortQueueByDistanceFrom(world._chunksToRemove, loc[0], loc[1], loc[2])
}


// incrementally look for chunks that could be re-meshed
function lookForChunksToMesh(world) {
    var limit = 5
    var numQueued = world._chunksToMesh.count() + world._chunksToMeshFirst.count()
    if (numQueued > limit) return
    var knownLocs = world._chunksKnown.arr
    var ct = Math.min(50, knownLocs.length)
    for (var i = 0; i < ct; i++) {
        lookIndex = (lookIndex + 1) % knownLocs.length
        var loc = knownLocs[lookIndex]
        var chunk = world._storage.getChunkByIndexes(loc[0], loc[1], loc[2])
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
    var loc = toRequest.pop()
    requestNewChunk(world, loc[0], loc[1], loc[2])
    return toRequest.isEmpty()
}


function processRemoveQueue(world) {
    var toRemove = world._chunksToRemove
    if (toRemove.isEmpty()) return true
    var loc = toRemove.pop()
    removeChunk(world, loc[0], loc[1], loc[2])
    return (toRemove.isEmpty())
}


// similar to above but for chunks waiting to be meshed
function processMeshingQueue(world, firstOnly) {
    var queue = world._chunksToMeshFirst
    if (queue.isEmpty() && !firstOnly) queue = world._chunksToMesh
    if (queue.isEmpty()) return true

    var loc = queue.pop()
    if (world._chunksToRemove.includes(loc[0], loc[1], loc[2])) return
    var chunk = world._storage.getChunkByIndexes(loc[0], loc[1], loc[2])

    if (chunk) doChunkRemesh(world, chunk)
}


function possiblyQueueChunkForMeshing(world, chunk) {
    if (!(chunk._terrainDirty || chunk._objectsDirty)) return
    var nc = chunk._neighborCount
    if (nc < chunk.minNeighborsToMesh) return
    var queue = (nc === 26) ?
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
    var size = world.chunkSize
    var dataArr = Chunk._createVoxelArray(world.chunkSize)
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
        var size = world.chunkSize
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
    var cs = this.chunkSize
    return [Math.floor(x / cs) | 0, Math.floor(y / cs) | 0, Math.floor(z / cs) | 0]
}
function chunkCoordsToLocalsGeneral(x, y, z) {
    var cs = this.chunkSize
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


function sortQueueByDistanceFrom(queue, i, j, k) {
    queue.sortByDistance(loc => {
        var dx = loc[0] - i
        var dy = loc[1] - j
        var dz = loc[2] - k
        // bias towards keeping verticals together for now
        return 10 * (dx * dx + dz * dz) + Math.abs(dy)
    })
}


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