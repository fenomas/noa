
var EventEmitter = require('events').EventEmitter
import Chunk from './chunk'
import { StringList } from './util'
import { loopForTime, numberOfVoxelsInSphere } from './util'

var PROFILE = 0
var PROFILE_QUEUES = 0


export default function (noa, opts) {
    return new World(noa, opts)
}




var defaultOptions = {
    chunkSize: 24,
    chunkAddDistance: 3,
    chunkRemoveDistance: 4,
    worldGenWhilePaused: false,
}

/**
 * @class
 * @typicalname noa.world
 * @emits worldDataNeeded(id, ndarray, x, y, z, worldName)
 * @emits chunkAdded(chunk)
 * @emits chunkBeingRemoved(id, ndarray, userData)
 * @classdesc Manages the world and its chunks
 * 
 * Extends `EventEmitter`
 */

function World(noa, opts) {
    this.noa = noa
    opts = Object.assign({}, defaultOptions, opts)

    this.playerChunkLoaded = false
    this.Chunk = Chunk

    this.chunkSize = opts.chunkSize
    this.chunkAddDistance = opts.chunkAddDistance
    this.chunkRemoveDistance = opts.chunkRemoveDistance
    if (this.chunkRemoveDistance < this.chunkAddDistance) {
        this.chunkRemoveDistance = this.chunkAddDistance
    }

    // set this higher to cause chunks not to mesh until they have some neighbors
    this.minNeighborsToMesh = 6

    // settings for tuning worldgen behavior and throughput
    this.maxChunksPendingCreation = 10
    this.maxChunksPendingMeshing = 10
    this.maxProcessingPerTick = 9      // ms
    this.maxProcessingPerRender = 5    // ms
    this.worldGenWhilePaused = opts.worldGenWhilePaused

    // set up internal state
    this._cachedWorldName = ''
    this._lastPlayerChunkID = ''
    this._chunkStorage = {}
    initChunkQueues(this)
    initChunkStorage(this)

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
World.prototype = Object.create(EventEmitter.prototype)






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
    var chunk = this._getChunkByCoords(x, y, z)
    if (!chunk) return 0
    return chunk.get(
        this._worldCoordToChunkIndex(x),
        this._worldCoordToChunkIndex(y),
        this._worldCoordToChunkIndex(z))
}

/** @param x,y,z */
World.prototype.getBlockSolidity = function (x, y, z) {
    var chunk = this._getChunkByCoords(x, y, z)
    if (!chunk) return false
    return !!chunk.getSolidityAt(
        this._worldCoordToChunkIndex(x),
        this._worldCoordToChunkIndex(y),
        this._worldCoordToChunkIndex(z))
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

/** @param x,y,z */
World.prototype.getBlockObjectMesh = function (x, y, z) {
    var chunk = this._getChunkByCoords(x, y, z)
    if (!chunk) return 0
    return chunk.getObjectMeshAt(
        this._worldCoordToChunkIndex(x),
        this._worldCoordToChunkIndex(y),
        this._worldCoordToChunkIndex(z))
}


/** @param x,y,z */
World.prototype.setBlockID = function (val, x, y, z) {
    var i = this._worldCoordToChunkCoord(x)
    var j = this._worldCoordToChunkCoord(y)
    var k = this._worldCoordToChunkCoord(z)
    var ix = this._worldCoordToChunkIndex(x)
    var iy = this._worldCoordToChunkIndex(y)
    var iz = this._worldCoordToChunkIndex(z)

    // logic inside the chunk will trigger a remesh for chunk and 
    // any neighbors that need it
    var chunk = this._getChunk(i, j, k)
    if (chunk) chunk.set(ix, iy, iz, val)
}


/** @param x,y,z */
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
    }

    // current player chunk changed since last tick?
    var pos = getPlayerChunkCoords(this)
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
        findDistantChunksToRemove(this, pos[0], pos[1], pos[2])
        profile_hook('remQueue')
    }
    var numChunks = numberOfVoxelsInSphere(this.chunkAddDistance)
    if (changedChunks || (this._chunkIDsKnown.count() < numChunks)) {
        findNewChunksInRange(this, pos[0], pos[1], pos[2])
        profile_hook('addQueue')
    }

    // process (create or mesh) some chunks, up to max iteration time
    loopForTime(this.maxProcessingPerTick, () => {
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
    if (dt + 2 < this.maxProcessingPerTick) {
        lookForChunksToMesh(this)
        profile_hook('looking')
        loopForTime(this.maxProcessingPerTick, () => {
            var done = processMeshingQueue(this, false)
            profile_hook('meshes')
            return done
        }, tickStartTime, true)
    }

    // track whether the player's local chunk is loaded and ready or not
    var pChunk = this._getChunk(pos[0], pos[1], pos[2])
    this.playerChunkLoaded = !!pChunk

    profile_queues_hook('end', this)
    profile_hook('end')
}


World.prototype.render = function () {
    // on render, quickly process the high-priority meshing queue
    // to help avoid flashes of background while neighboring chunks update
    loopForTime(this.maxProcessingPerRender, () => {
        return processMeshingQueue(this, true)
    })
}








/*
 * 
 * 
 * 
 *              chunk IDs, storage, and lookup/retrieval
 * 
 * 
 * 
*/

function getChunkID(i, j, k) {
    // chunk coords -> canonical string ID
    return i + '|' + j + '|' + k
}

function parseChunkID(id) {
    // chunk ID -> coords
    return id.split('|').map(s => parseInt(s))
}

function initChunkStorage(world) {
    // var chunkHash = ndHash([1024, 1024, 1024])
    world._getChunk = (i, j, k) => {
        var id = getChunkID(i, j, k)
        return world._chunkStorage[id] || null
    }
    world._setChunk = (i, j, k, value) => {
        var id = getChunkID(i, j, k)
        if (value) {
            world._chunkStorage[id] = value
        } else {
            delete world._chunkStorage[id]
        }
    }
    // chunk accessor for internal use
    world._getChunkByCoords = function (x, y, z) {
        var i = world._worldCoordToChunkCoord(x)
        var j = world._worldCoordToChunkCoord(y)
        var k = world._worldCoordToChunkCoord(z)
        return world._getChunk(i, j, k)
    }
}

function getPlayerChunkCoords(world) {
    var pos = world.noa.entities.getPosition(world.noa.playerEntity)
    var i = world._worldCoordToChunkCoord(pos[0])
    var j = world._worldCoordToChunkCoord(pos[1])
    var k = world._worldCoordToChunkCoord(pos[2])
    return [i, j, k]
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
    world._chunkIDsKnown = new StringList()
    world._chunkIDsToRequest = new StringList()
    world._chunkIDsPending = new StringList()
    world._chunkIDsToMesh = new StringList()
    world._chunkIDsToMeshFirst = new StringList()
    world._chunkIDsToRemove = new StringList()
    // accessor for chunks to queue themselves for remeshing
    world._queueChunkForRemesh = (chunk) => {
        queueChunkForRemesh(world, chunk)
    }
}


// process neighborhood chunks, add missing ones to "toRequest" and "inMemory"
function findNewChunksInRange(world, ci, cj, ck) {
    var add = Math.ceil(world.chunkAddDistance)
    var addDistSq = world.chunkAddDistance * world.chunkAddDistance
    var known = world._chunkIDsKnown
    var toRequest = world._chunkIDsToRequest
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
                known.add(id)
                toRequest.add(id)
            }
        }
    }
    sortIDListByDistanceFrom(toRequest, ci, cj, ck)
}


// rebuild queue of chunks to be removed from around (ci,cj,ck)
function findDistantChunksToRemove(world, ci, cj, ck) {
    var remDistSq = world.chunkRemoveDistance * world.chunkRemoveDistance
    var toRemove = world._chunkIDsToRemove
    world._chunkIDsKnown.forEach(id => {
        if (toRemove.includes(id)) return
        var loc = parseChunkID(id)
        var di = loc[0] - ci
        var dj = loc[1] - cj
        var dk = loc[2] - ck
        var distSq = di * di + dj * dj + dk * dk
        if (distSq < remDistSq) return
        // flag chunk for removal and remove it from work queues
        world._chunkIDsToRemove.add(id)
        world._chunkIDsToRequest.remove(id)
        world._chunkIDsToMesh.remove(id)
        world._chunkIDsToMeshFirst.remove(id)
    })
    sortIDListByDistanceFrom(toRemove, ci, cj, ck)
}


// invalidate chunks overlapping the given AABB
function invalidateChunksInBox(world, box) {
    var min = box.base.map(n => Math.floor(world._worldCoordToChunkCoord(n)))
    var max = box.max.map(n => Math.floor(world._worldCoordToChunkCoord(n)))
    world._chunkIDsKnown.forEach(id => {
        var pos = parseChunkID(id)
        for (var i = 0; i < 3; i++) {
            if (pos[i] < min[i] || pos[i] > max[i]) return
        }
        if (world._chunkIDsToRemove.includes(id)) return
        world._chunkIDsToRequest.add(id)
    })
}

// when current world changes - empty work queues and mark all for removal
function markAllChunksForRemoval(world) {
    world._chunkIDsToRemove.copyFrom(world._chunkIDsKnown)
    world._chunkIDsToRequest.empty()
    world._chunkIDsToMesh.empty()
    world._chunkIDsToMeshFirst.empty()
    var loc = getPlayerChunkCoords(world)
    sortIDListByDistanceFrom(world._chunkIDsToRemove, loc[0], loc[1], loc[2])
}


// incrementally look for chunks that could stand to be re-meshed
function lookForChunksToMesh(world) {
    var queue = world._chunkIDsKnown.arr
    var ct = Math.min(50, queue.length)
    var numQueued = world._chunkIDsToMesh.count() + world._chunkIDsToMeshFirst.count()
    for (var i = 0; i < ct; i++) {
        lookIndex = (lookIndex + 1) % queue.length
        var id = queue[lookIndex]
        var chunk = world._chunkStorage[id]
        if (!chunk) continue
        var nc = chunk._neighborCount
        if (nc < world.minNeighborsToMesh) continue
        if (nc <= chunk._maxMeshedNeighbors) continue
        queueChunkForRemesh(world, chunk)
        if (++numQueued > 10) return
    }
}
var lookIndex = -1



// run through chunk tracking queues looking for work to do next
function processRequestQueue(world) {
    var toRequest = world._chunkIDsToRequest
    if (toRequest.isEmpty()) return true
    // skip if too many outstanding requests, or if meshing queue is full
    var pending = world._chunkIDsPending.count()
    var toMesh = world._chunkIDsToMesh.count()
    if (pending >= world.maxChunksPendingCreation) return true
    if (toMesh >= world.maxChunksPendingMeshing) return true
    var id = toRequest.pop()
    requestNewChunk(world, id)
    return toRequest.isEmpty()
}


function processRemoveQueue(world) {
    var toRemove = world._chunkIDsToRemove
    if (toRemove.isEmpty()) return true
    removeChunk(world, toRemove.pop())
    return (toRemove.isEmpty())
}


// similar to above but for chunks waiting to be meshed
function processMeshingQueue(world, firstOnly) {
    var queue = world._chunkIDsToMeshFirst
    if (queue.isEmpty() && !firstOnly) queue = world._chunkIDsToMesh
    if (queue.isEmpty()) return true

    var id = queue.pop()
    if (world._chunkIDsToRemove.includes(id)) return
    var chunk = world._chunkStorage[id]
    if (chunk) doChunkRemesh(world, chunk)
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
function requestNewChunk(world, id) {
    var pos = parseChunkID(id)
    var i = pos[0]
    var j = pos[1]
    var k = pos[2]
    var size = world.chunkSize
    var dataArr = Chunk._createVoxelArray(world.chunkSize)
    var worldName = world.noa.worldName
    var requestID = [i, j, k, worldName].join('|')
    var x = i * size
    var y = j * size
    var z = k * size
    world._chunkIDsPending.add(id)
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
    var id = getChunkID(i, j, k)
    world._chunkIDsPending.remove(id)
    // discard data if it's for a world that's no longer current
    if (worldName !== world.noa.worldName) return
    // discard if chunk is no longer needed
    if (!world._chunkIDsKnown.includes(id)) return
    if (world._chunkIDsToRemove.includes(id)) return
    var chunk = world._chunkStorage[id]
    if (!chunk) {
        // if chunk doesn't exist, create and init
        var size = world.chunkSize
        chunk = new Chunk(world.noa, id, i, j, k, size, array)
        world._setChunk(i, j, k, chunk)
        chunk.requestID = reqID
        chunk.userData = userData
        updateNeighborsOfChunk(world, i, j, k, chunk)
        world.noa.rendering.prepareChunkForRendering(chunk)
        world.emit('chunkAdded', chunk)
    } else {
        // else we're updating data for an existing chunk
        chunk._updateVoxelArray(array)
        // assume neighbors need remeshing
        var list = chunk._neighbors.data
        list.forEach(nab => {
            if (!nab || nab === chunk) return
            if (nab._neighborCount > 20) queueChunkForRemesh(world, nab)
        })
    }
    // chunk can now be meshed...
    queueChunkForRemesh(world, chunk)
    profile_queues_hook('receive')
}



// remove a chunk that wound up in the remove queue
function removeChunk(world, id) {
    var loc = parseChunkID(id)
    var chunk = world._getChunk(loc[0], loc[1], loc[2])
    if (chunk) {
        world.emit('chunkBeingRemoved', chunk.requestID, chunk.voxels, chunk.userData)
        world.noa.rendering.disposeChunkForRendering(chunk)
        chunk.dispose()
        profile_queues_hook('dispose')
        updateNeighborsOfChunk(world, loc[0], loc[1], loc[2], null)
    }
    world._setChunk(loc[0], loc[1], loc[2], null)
    world._chunkIDsKnown.remove(id)
    world._chunkIDsToMesh.remove(id)
    world._chunkIDsToMeshFirst.remove(id)
}


function queueChunkForRemesh(world, chunk) {
    var nc = chunk._neighborCount
    var limit = Math.min(world.minNeighborsToMesh, 26)
    if (nc < limit) return
    chunk._terrainDirty = true
    var queue = (nc === 26) ?
        world._chunkIDsToMeshFirst : world._chunkIDsToMesh
    queue.add(chunk.id)
}


function doChunkRemesh(world, chunk) {
    world._chunkIDsToMesh.remove(chunk.id)
    world._chunkIDsToMeshFirst.remove(chunk.id)
    chunk.updateMeshes()
    profile_queues_hook('mesh')
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


function sortIDListByDistanceFrom(list, i, j, k) {
    list.sort(id => {
        var pos = parseChunkID(id)
        var dx = pos[0] - i
        var dy = pos[1] - j
        var dz = pos[2] - k
        // bias towards keeping verticals together for now
        return (dx * dx + dz * dz) + Math.abs(dy)
    })
}


// keep neighbor data updated when chunk is added or removed
function updateNeighborsOfChunk(world, ci, cj, ck, chunk) {
    for (var i = -1; i <= 1; i++) {
        for (var j = -1; j <= 1; j++) {
            for (var k = -1; k <= 1; k++) {
                if ((i | j | k) === 0) continue
                var nid = getChunkID(ci + i, cj + j, ck + k)
                var neighbor = world._chunkStorage[nid]
                if (!neighbor) continue
                if (chunk) {
                    chunk._neighborCount++
                    chunk._neighbors.set(i, j, k, neighbor)
                    neighbor._neighborCount++
                    neighbor._neighbors.set(-i, -j, -k, chunk)
                    // flag for remesh when chunk gets its last neighbor
                    if (neighbor._neighborCount === 26) {
                        queueChunkForRemesh(world, neighbor)
                    }
                } else {
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
    _report(this, '  known:     ', this._chunkIDsKnown.arr, true)
    _report(this, '  to request:', this._chunkIDsToRequest.arr)
    _report(this, '  to remove: ', this._chunkIDsToRemove.arr)
    _report(this, '  creating:  ', this._chunkIDsPending.arr)
    _report(this, '  to mesh:   ', this._chunkIDsToMesh.arr.concat(this._chunkIDsToMeshFirst.arr))
}

function _report(world, name, arr, ext) {
    var full = 0,
        empty = 0,
        exist = 0,
        surrounded = 0,
        remeshes = []
    arr.forEach(id => {
        var chunk = world._chunkStorage[id]
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
var profile_hook = (PROFILE) ?
    makeProfileHook(100, 'world ticks:') : () => { }
var profile_queues_hook = () => { }
if (PROFILE_QUEUES) profile_queues_hook = ((every) => {
    var iter = 0
    var counts = {}
    var queues = {}
    var started = performance.now()
    return function profile_queues_hook(state, world) {
        if (state === 'start') return
        if (state !== 'end') return counts[state] = (counts[state] || 0) + 1
        queues.toreq = (queues.toreq || 0) + world._chunkIDsToRequest.count()
        queues.toget = (queues.toget || 0) + world._chunkIDsPending.count()
        queues.tomesh = (queues.tomesh || 0) + world._chunkIDsToMesh.count() + world._chunkIDsToMeshFirst.count()
        queues.tomesh1 = (queues.tomesh1 || 0) + world._chunkIDsToMeshFirst.count()
        queues.torem = (queues.torem || 0) + world._chunkIDsToRemove.count()
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
            `${res.toreq}-> ${res.request} req/s  `,
            `${res.toget}-> ${res.receive} got/s  `,
            `${(res.tomesh)}-> ${res.mesh} mesh/s  `,
            `${res.torem}-> ${res.dispose} rem/s  `,
            `(meshFirst: ${res.tomesh1.trim()})`,
        )
        iter = 0
        counts = {}
        queues = {}
        started = performance.now()
    }
})(100)