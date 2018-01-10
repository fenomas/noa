'use strict'

var extend = require('extend')
var ndarray = require('ndarray')
var ndHash = require('ndarray-hash')
var EventEmitter = require('events').EventEmitter
var Chunk = require('./chunk')


module.exports = function (noa, opts) {
    return new World(noa, opts)
}


var PROFILE = 0
var PROFILE_QUEUES = 0


var defaultOptions = {
    chunkSize: 24,
    chunkAddDistance: 3,
    chunkRemoveDistance: 4
}

/**
 * Module for managing the world, and its chunks
 * @class noa.world
 * 
 * Emits:
 *  * worldDataNeeded  (id, ndarray, x, y, z)
 *  * chunkAdded (chunk)
 *  * chunkChanged (chunk)
 *  * chunkBeingRemoved (id, ndarray, userData)
 */

function World(noa, _opts) {
    this.noa = noa
    var opts = extend(defaultOptions, _opts)

    this.userData = null
    this.playerChunkLoaded = false
    this.Chunk = Chunk

    this.chunkSize = opts.chunkSize
    this.chunkAddDistance = opts.chunkAddDistance
    this.chunkRemoveDistance = opts.chunkRemoveDistance
    if (this.chunkRemoveDistance < this.chunkAddDistance) {
        this.chunkRemoveDistance = this.chunkAddDistance
    }

    // internals
    this._chunkIDsToAdd = []
    this._chunkIDsToRemove = []
    this._chunkIDsInMemory = []
    this._chunkIDsToCreate = []
    this._chunkIDsToMesh = []
    this._chunkIDsToMeshFirst = []
    this._maxChunksPendingCreation = 20
    this._maxChunksPendingMeshing = 20
    this._maxProcessingPerTick = 9 // ms
    this._maxProcessingPerRender = 5 // ms

    // triggers a short visit to the meshing queue before renders
    var self = this
    noa.on('beforeRender', function () { beforeRender(self) })

    // actual chunk storage - hash size hard coded for now
    this._chunkHash = ndHash([1024, 1024, 1024])

    // instantiate coord conversion functions based on the chunk size
    // use bit twiddling if chunk size is a power of 2
    var cs = this.chunkSize
    if (cs & cs - 1 === 0) {
        var shift = Math.log2(cs) | 0
        var mask = (cs - 1) | 0
        worldCoordToChunkCoord = coord => (coord >> shift) | 0
        worldCoordToChunkIndex = coord => (coord & mask) | 0
    } else {
        worldCoordToChunkCoord = coord => Math.floor(coord / cs) | 0
        worldCoordToChunkIndex = coord => (((coord % cs) + cs) % cs) | 0
    }

}
World.prototype = Object.create(EventEmitter.prototype)

var worldCoordToChunkCoord
var worldCoordToChunkIndex




/*
 *   PUBLIC API 
*/



/** @param x,y,z */
World.prototype.getBlockID = function (x, y, z) {
    var chunk = this._getChunkByCoords(x, y, z)
    if (!chunk) return 0

    var ix = worldCoordToChunkIndex(x)
    var iy = worldCoordToChunkIndex(y)
    var iz = worldCoordToChunkIndex(z)
    return chunk.get(ix, iy, iz)
}

/** @param x,y,z */
World.prototype.getBlockSolidity = function (x, y, z) {
    var chunk = this._getChunkByCoords(x, y, z)
    if (!chunk) return 0

    var ix = worldCoordToChunkIndex(x)
    var iy = worldCoordToChunkIndex(y)
    var iz = worldCoordToChunkIndex(z)
    return !!chunk.getSolidityAt(ix, iy, iz)
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

    var ix = worldCoordToChunkIndex(x)
    var iy = worldCoordToChunkIndex(y)
    var iz = worldCoordToChunkIndex(z)
    return chunk.getObjectMeshAt(ix, iy, iz)
}


/** @param x,y,z */
World.prototype.setBlockID = function (val, x, y, z) {
    var i = worldCoordToChunkCoord(x)
    var j = worldCoordToChunkCoord(y)
    var k = worldCoordToChunkCoord(z)
    var ix = worldCoordToChunkIndex(x)
    var iy = worldCoordToChunkIndex(y)
    var iz = worldCoordToChunkIndex(z)

    // if update is on chunk border, update neighbor's padding data too
    _updateChunkAndBorders(this, i, j, k, this.chunkSize, ix, iy, iz, val)
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





World.prototype.tick = function () {
    profile_hook('start')

    // check player position and needed/unneeded chunks
    var pos = getPlayerChunkCoords(this)
    var chunkID = getChunkID(pos[0], pos[1], pos[2])
    if (chunkID != this._lastPlayerChunkID) {
        this.emit('playerEnteredChunk', pos[0], pos[1], pos[2])
        buildChunkAddQueue(this, pos[0], pos[1], pos[2])
        buildChunkRemoveQueue(this, pos[0], pos[1], pos[2])
    }
    this._lastPlayerChunkID = chunkID
    profile_hook('build queues')

    // process (create or mesh) some chunks. If fast enough, do several
    profile_queues(this, 'start')
    var cutoff = performance.now() + this._maxProcessingPerTick
    var done = false
    while (!done && (performance.now() < cutoff)) {
        done = processMeshingQueues(this, false)
        done &= processChunkQueues(this)
    }
    profile_queues(this, 'end')


    // track whether the player's local chunk is loaded and ready or not
    var pChunk = getChunk(this, pos[0], pos[1], pos[2])
    var okay = !!(pChunk && pChunk.isGenerated && !pChunk.isInvalid)
    this.playerChunkLoaded = okay

    profile_hook('end')
}



function beforeRender(self) {
    // on render, quickly process the high-priority meshing queue
    // to help avoid flashes of background while neighboring chunks update
    var cutoff = performance.now() + self._maxProcessingPerRender
    var done = false
    var ct = 0
    while (!done && (performance.now() < cutoff)) {
        done = processMeshingQueues(self, true)
        if (!done) ct++
    }
}




/** client should call this after creating a chunk's worth of data (as an ndarray)  
 * If userData is passed in it will be attached to the chunk
 * @param id
 * @param array
 * @param userData
 */
World.prototype.setChunkData = function (id, array, userData) {
    profile_queues(this, 'received')
    var arr = parseChunkID(id)
    var chunk = getChunk(this, arr[0], arr[1], arr[2])
    // ignore if chunk was invalidated while being prepared
    if (!chunk || chunk.isInvalid) return
    chunk.array = array
    if (userData) chunk.userData = userData
    chunk.initData()
    enqueueID(id, this._chunkIDsInMemory)
    unenqueueID(id, this._chunkIDsToCreate)

    // chunk can now be meshed...
    this.noa.rendering.prepareChunkForRendering(chunk)
    enqueueID(id, this._chunkIDsToMesh)
    this.emit('chunkAdded', chunk)
}




/*
 * Calling this causes all world chunks to get unloaded and recreated 
 * (after receiving new world data from the client). This is useful when
 * you're teleporting the player to a new world, e.g.
*/
World.prototype.invalidateAllChunks = function () {
    var toInval = this._chunkIDsInMemory.concat(this._chunkIDsToCreate)
    for (var id of toInval) {
        var loc = parseChunkID(id)
        var chunk = getChunk(this, loc[0], loc[1], loc[2])
        chunk.isInvalid = true
    }
    // this causes chunk queues to get rebuilt next tick
    this._lastPlayerChunkID = ''
}



// debugging
World.prototype.report = function () {
    console.log('World report - playerChunkLoaded: ', this.playerChunkLoaded)
    _report(this, '  to add     ', this._chunkIDsToAdd)
    _report(this, '  to remove: ', this._chunkIDsToRemove)
    _report(this, '  in memory: ', this._chunkIDsInMemory, true)
    _report(this, '  creating:  ', this._chunkIDsToCreate)
    _report(this, '  meshing:   ', this._chunkIDsToMesh)
}
function _report(world, name, arr, ext) {
    var ct = 0, full = 0, empty = 0
    for (var id of arr) {
        if (id.size) {
            if (id.isInvalid) ct++
            continue
        }
        var loc = parseChunkID(id)
        var chunk = getChunk(world, loc[0], loc[1], loc[2])
        if (chunk.isInvalid) ct++
        if (chunk.isFull) full++
        if (chunk.isEmpty) empty++
    }
    var len = (arr.length + '        ').substr(0, 6)
    var es = (ext) ? [', ', full, ' full, ', empty, ' empty'].join('') : ''
    console.log(name, len, ct, 'invalid' + es)
}




/*
 *    INTERNALS
*/


// canonical string ID handling for the i,j,k-th chunk
function getChunkID(i, j, k) {
    return i + '|' + j + '|' + k
}
function parseChunkID(id) {
    var arr = id.split('|')
    return [parseInt(arr[0]), parseInt(arr[1]), parseInt(arr[2])]
}

// canonical functions to store/retrieve a chunk held in memory
function getChunk(world, i, j, k) {
    var mi = (i | 0) & 1023
    var mj = (j | 0) & 1023
    var mk = (k | 0) & 1023
    return world._chunkHash.get(mi, mj, mk)
}

function setChunk(world, i, j, k, value) {
    var mi = (i | 0) & 1023
    var mj = (j | 0) & 1023
    var mk = (k | 0) & 1023
    world._chunkHash.set(mi, mj, mk, value)
}



function getPlayerChunkCoords(world) {
    var pos = world.noa.getPlayerPosition()
    var i = worldCoordToChunkCoord(pos[0])
    var j = worldCoordToChunkCoord(pos[1])
    var k = worldCoordToChunkCoord(pos[2])
    return [i, j, k]
}


// for internal use
World.prototype._getChunkByCoords = function (x, y, z) {
    var i = worldCoordToChunkCoord(x)
    var j = worldCoordToChunkCoord(y)
    var k = worldCoordToChunkCoord(z)
    return getChunk(this, i, j, k)
}




// run through chunk tracking queues looking for work to do next
function processChunkQueues(self) {
    var done = true
    // both queues are sorted by ascending distance
    if (self._chunkIDsToRemove.length) {
        var remove = parseChunkID(self._chunkIDsToRemove.pop())
        removeChunk(self, remove[0], remove[1], remove[2])
        profile_queues(self, 'removed')
        profile_hook('removed')
        done = false
    }
    if (self._chunkIDsToCreate.length >= self._maxChunksPendingCreation) return done
    if (self._chunkIDsToMesh.length >= self._maxChunksPendingMeshing) return done
    if (self._chunkIDsToAdd.length) {
        var id = self._chunkIDsToAdd.shift()
        requestNewChunk(self, id)
        profile_hook('requested')
        profile_queues(self, 'requested')
        done = false
    }
    return done
}


// similar to above but for chunks waiting to be meshed
function processMeshingQueues(self, firstOnly) {
    var id
    if (self._chunkIDsToMeshFirst.length) {
        id = self._chunkIDsToMeshFirst.pop()
    } else if (!firstOnly && self._chunkIDsToMesh.length) {
        id = self._chunkIDsToMesh.pop()
    } else return true

    var arr = parseChunkID(id)
    var chunk = getChunk(self, arr[0], arr[1], arr[2])
    if (chunk.isInvalid) return
    chunk.updateMeshes()

    profile_queues(self, 'meshed')
    profile_hook('meshed')
    return false
}










// make a new chunk and emit an event for it to be populated with world data
function requestNewChunk(world, id) {
    var pos = parseChunkID(id)
    var i = pos[0]
    var j = pos[1]
    var k = pos[2]
    var size = world.chunkSize
    var chunk = new Chunk(world.noa, id, i, j, k, size)
    setChunk(world, i, j, k, chunk)
    var x = i * size - 1
    var y = j * size - 1
    var z = k * size - 1
    enqueueID(id, world._chunkIDsToCreate)
    world.emit('worldDataNeeded', id, chunk.array, x, y, z)
}




// remove a chunk that wound up in the remove queue
function removeChunk(world, i, j, k) {
    var chunk = getChunk(world, i, j, k)
    world.emit('chunkBeingRemoved', chunk.id, chunk.array, chunk.userData)
    world.noa.rendering.disposeChunkForRendering(chunk)
    chunk.dispose()
    setChunk(world, i, j, k, 0)
    unenqueueID(chunk.id, world._chunkIDsInMemory)
    unenqueueID(chunk.id, world._chunkIDsToMesh)
    unenqueueID(chunk.id, world._chunkIDsToMeshFirst)
    // when removing a chunk because it was invalid, arrange for chunk queues to get rebuilt
    if (chunk.isInvalid) world._lastPlayerChunkID = ''
}





// for a given chunk (i/j/k) and local location (x/y/z), 
// update all chunks that need it (including border chunks with the 
// changed block in their 1-block padding)

function _updateChunkAndBorders(world, i, j, k, size, x, y, z, val) {
    var ilocs = [0]
    var jlocs = [0]
    var klocs = [0]
    if (x === 0) { ilocs.push(-1) } else if (x === size - 1) { ilocs.push(1) }
    if (y === 0) { jlocs.push(-1) } else if (y === size - 1) { jlocs.push(1) }
    if (z === 0) { klocs.push(-1) } else if (z === size - 1) { klocs.push(1) }

    for (var di of ilocs) {
        var lx = [size, x, -1][di + 1]
        for (var dj of jlocs) {
            var ly = [size, y, -1][dj + 1]
            for (var dk of klocs) {
                var lz = [size, z, -1][dk + 1]
                _modifyBlockData(world,
                    i + di, j + dj, k + dk,
                    lx, ly, lz, val)
            }
        }
    }
}



// internal function to modify a chunk's block

function _modifyBlockData(world, i, j, k, x, y, z, val) {
    var chunk = getChunk(world, i, j, k)
    if (!chunk) return
    chunk.set(x, y, z, val)
    enqueueID(chunk.id, world._chunkIDsToMeshFirst)
    world.emit('chunkChanged', chunk)
}




// rebuild queue of chunks to be added around (ci,cj,ck)
function buildChunkAddQueue(world, ci, cj, ck) {
    var add = Math.ceil(world.chunkAddDistance)
    var pending = world._chunkIDsToCreate
    var queue = []
    var distArr = []

    var addDistSq = world.chunkAddDistance * world.chunkAddDistance
    for (var i = ci - add; i <= ci + add; ++i) {
        for (var j = cj - add; j <= cj + add; ++j) {
            for (var k = ck - add; k <= ck + add; ++k) {
                var di = i - ci
                var dj = j - cj
                var dk = k - ck
                var distSq = di * di + dj * dj + dk * dk
                if (distSq > addDistSq) continue

                if (getChunk(world, i, j, k)) continue
                var id = getChunkID(i, j, k)
                if (pending.indexOf(id) > -1) continue
                queue.push(id)
                distArr.push(distSq)
            }
        }
    }
    world._chunkIDsToAdd = sortByReferenceArray(queue, distArr)
}


// rebuild queue of chunks to be removed from around (ci,cj,ck)
function buildChunkRemoveQueue(world, ci, cj, ck) {
    var remDistSq = world.chunkRemoveDistance * world.chunkRemoveDistance
    var list = world._chunkIDsInMemory
    var queue = []
    var distArr = []

    for (var i = 0; i < list.length; i++) {
        var id = list[i]
        var loc = parseChunkID(id)
        var di = loc[0] - ci
        var dj = loc[1] - cj
        var dk = loc[2] - ck
        var distSq = di * di + dj * dj + dk * dk
        if (distSq < remDistSq) {
            var chunk = getChunk(world, loc[0], loc[1], loc[2])
            if (!chunk.isInvalid) continue
            distSq *= -1 // rig sort so that invalidated chunks get removed first
        }
        queue.push(id)
        distArr.push(distSq)
    }
    world._chunkIDsToRemove = sortByReferenceArray(queue, distArr)
}



// sorts [A, B, C] and [3, 1, 2] into [B, C, A]
function sortByReferenceArray(data, ref) {
    var ind = Object.keys(ref)
    ind.sort((i, j) => ref[i] - ref[j])
    return ind.map(i => data[i])
}





// uniquely enqueue a string id into an array of them
function enqueueID(id, queue) {
    var i = queue.indexOf(id)
    if (i >= 0) return
    queue.push(id)
}

// remove string id from queue if it exists
function unenqueueID(id, queue) {
    var i = queue.indexOf(id)
    if (i >= 0) queue.splice(i, 1)
}





var profile_queues = function (w, s) { }
if (PROFILE_QUEUES) (function () {
    var every = 100
    var iter = 0
    var t, nrem, nreq, totalrec, nmesh
    var temprem, tempreq
    var reqcts, remcts, meshcts
    var qadd, qrem, qmem, qpend, qmesh
    profile_queues = function (world, state) {
        if (state === 'start') {
            if (iter === 0) {
                t = performance.now()
                qadd = qrem = qmem = qpend = qmesh = 0
                totalrec = 0
                remcts = []
                reqcts = []
                meshcts = []
            }
            iter++
            nrem = nreq = nmesh = 0
        } else if (state === 'removed') {
            nrem++
        } else if (state === 'received') {
            totalrec++
        } else if (state === 'requested') {
            nreq++
        } else if (state === 'meshed') {
            nmesh++
        } else if (state === 'end') {
            // counts for frames that were fully worked
            if (world._chunkIDsToAdd.length) reqcts.push(nreq)
            if (world._chunkIDsToRemove.length) remcts.push(nrem)
            if (world._chunkIDsToMesh.length + world._chunkIDsToMeshFirst.length) meshcts.push(nmesh)
            // avg queue sizes
            qadd += world._chunkIDsToAdd.length
            qrem += world._chunkIDsToRemove.length
            qmem += world._chunkIDsInMemory.length
            qpend += world._chunkIDsToCreate.length
            qmesh += world._chunkIDsToMesh.length
            // on end
            if (iter === every) {
                var dt = (performance.now() - t) / 1000
                console.log('world chunk queues:',
                    'made', Math.round(totalrec / dt), 'cps',
                    '- avg queuelen: ',
                    'add', qadd / every,
                    'rem', qrem / every,
                    'mem', qmem / every,
                    'pend', qpend / every,
                    'mesh', qmesh / every,
                    '- work/frame: ',
                    'req', Math.round(reqcts.reduce(sum, 0) / reqcts.length * 10) / 10,
                    'rem', Math.round(remcts.reduce(sum, 0) / remcts.length * 10) / 10,
                    'mesh', Math.round(meshcts.reduce(sum, 0) / meshcts.length * 10) / 10
                )
                iter = 0
            }
        }
    }
    var sum = function (num, prev) { return num + prev }
})()


var profile_hook = function (s) { }
if (PROFILE) (function () {
    var every = 200
    var timer = new (require('./util').Timer)(every, 'world ticks')
    profile_hook = function (state) {
        if (state === 'start') timer.start()
        else if (state === 'end') timer.report()
        else timer.add(state)
    }
})()


