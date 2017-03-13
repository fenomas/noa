'use strict';

var extend = require('extend')
var ndarray = require('ndarray')
var ndHash = require('ndarray-hash')
var EventEmitter = require('events').EventEmitter
var Chunk = require('./chunk')


module.exports = function(noa, opts) {
  return new World(noa, opts)
}


var defaultOptions = {
  chunkSize: 24,
  chunkAddDistance: 3,
  chunkRemoveDistance: 4

}

/**
 * Module for managing the world, and its chunks
 * @class noa.world
 */

function World(noa, _opts) {
  this.noa = noa
  var opts = extend( defaultOptions, _opts )
  
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
  this._chunkIDsPendingCreation = []
  this._maxChunksPendingCreation = 4
  this._maxChunksPendingMeshing = 15
  this._noChunksLoaded = true
    
  // actual chunk storage - hash size hard coded for now
  this._chunkHash = ndHash([1024, 1024, 1024])
}

World.prototype = Object.create(EventEmitter.prototype)



/*
 *   PUBLIC API 
*/ 



/** @param x,y,z */ 
World.prototype.getBlockID = function (x,y,z) {
  var cs = this.chunkSize
  var i = Math.floor(x/cs)
  var j = Math.floor(y/cs)
  var k = Math.floor(z/cs)
  var chunk = getChunk(this, i, j, k)
  if (!chunk) return 0
  return chunk.get( x-i*cs, y-j*cs, z-k*cs )
  // TODO: consider constraining chunksize to be power of 2, 
  // using math tricks from voxel.js: Chunker#voxelAtCoordinates
}

/** @param x,y,z */ 
World.prototype.getBlockSolidity = function (x,y,z) {
  // very hot function, so reproduce guts of above rather than passing arrays around
  var cs = this.chunkSize
  var i = Math.floor(x/this.chunkSize)|0
  var j = Math.floor(y/this.chunkSize)|0
  var k = Math.floor(z/this.chunkSize)|0
  var chunk = getChunk(this, i, j, k)
  if (!chunk) return 0
  return chunk.getSolidityAt( x-i*cs, y-j*cs, z-k*cs )
}

/** @param x,y,z */
World.prototype.getBlockOpacity = function (x,y,z) {
  return this.noa.registry._blockOpacity[ this.getBlockID(x,y,z) ]
}

/** @param x,y,z */
World.prototype.getBlockTransparency = function (x,y,z) {
  return this.noa.registry._blockTransparency[ this.getBlockID(x,y,z) ]
}

/** @param x,y,z */
World.prototype.getBlockFluidity = function (x,y,z) {
  return this.noa.registry._blockIsFluid[ this.getBlockID(x,y,z) ]
}

/** @param x,y,z */
World.prototype.getBlockProperties = function (x,y,z) {
  return this.noa.registry._blockProps[ this.getBlockID(x,y,z) ]
}

/** @param x,y,z */
World.prototype.getBlockObjectMesh = function (x,y,z) {
  var cs = this.chunkSize
  var i = Math.floor(x/cs)
  var j = Math.floor(y/cs)
  var k = Math.floor(z/cs)
  var chunk = getChunk(this, i, j, k)
  if (!chunk) return null
  return chunk.getObjectMeshAt( x-i*cs, y-j*cs, z-k*cs )
}


/** @param x,y,z */
World.prototype.setBlockID = function (val,x,y,z) {
  var cs = this.chunkSize
  var i = Math.floor(x/cs)
  var j = Math.floor(y/cs)
  var k = Math.floor(z/cs)
  x -= i*cs
  y -= j*cs
  z -= k*cs

  // if update is on chunk border, update neighbor's padding data too
  _updateChunkAndBorders(this, i, j, k, cs, x, y, z, val)
}


/** @param x,y,z */
World.prototype.isBoxUnobstructed = function (box) {
  var floor = Math.floor
  var base = box.base
  var max = box.max
  var i0 = floor(base[0]), i1 = floor(max[0]) + 1
  var j0 = floor(base[1]), j1 = floor(max[1]) + 1
  var k0 = floor(base[2]), k1 = floor(max[2]) + 1
  for (var i=i0; i<i1; i++) {
    for (var j=j0; j<j1; j++) {
      for (var k=k0; k<k1; k++) {
        if (this.getBlockSolidity(i,j,k)) return false
      }
    }
  }
  return true
}





World.prototype.tick = function() {
  // check player position and needed/unneeded chunks
  var pos = this.noa.getPlayerPosition()
  var cs = this.chunkSize
  var i = Math.floor(pos[0]/cs)
  var j = Math.floor(pos[1]/cs)
  var k = Math.floor(pos[2]/cs)
  var chunkID = getChunkID( i,j,k )
  if (chunkID != this._lastPlayerChunkID) {
    buildChunkAddQueue( this, i, j, k )
    buildChunkRemoveQueue( this, i, j, k )
  }
  this._lastPlayerChunkID = chunkID

  // add or remove one chunk if needed. If fast, do a couple.
  var cutoff = 2 + performance.now()
  var notDone = true
  while(notDone && (performance.now() < cutoff)) {
    notDone = processChunkQueues(this, i, j, k)
  }
}


/** client should call this after creating a chunk's worth of data (as an ndarray) 
 * @param id
 * @param array
 */
World.prototype.setChunkData = function(id, array) {
  var arr = parseChunkID(id)
  var chunk = getChunk(this, arr[0], arr[1], arr[2])
  if (!chunk) return 0
  chunk.array = array
  chunk.initData()
  enqueueID(id, this._chunkIDsInMemory)
  unenqueueID(id, this._chunkIDsPendingCreation)
  this._noChunksLoaded = false
  this.emit( 'chunkAdded', chunk )
}




/*
 *    INTERNALS
*/


// canonical string ID handling for the i,j,k-th chunk
function getChunkID( i, j, k ) {
  return i+'|'+j+'|'+k
}
function parseChunkID( id ) {
  var arr = id.split('|')
  return [ parseInt(arr[0]), parseInt(arr[1]), parseInt(arr[2]) ]
}

// canonical functions to store/retrieve a chunk held in memory
function getChunk(world,i,j,k) {
  var mi = modulo1024(i|0)
  var mj = modulo1024(j|0)
  var mk = modulo1024(k|0)
  return world._chunkHash.get(mi, mj, mk)
}

function setChunk(world,i,j,k, value) {
  var mi = modulo1024(i|0)
  var mj = modulo1024(j|0)
  var mk = modulo1024(k|0)
  world._chunkHash.set(mi, mj, mk, value)
}

function modulo1024(n) {
  return (((n|0) % 1024) + 1024) % 1024
}





// run through chunk tracking queues looking for work to do next
function processChunkQueues(self, i, j, k) {
  var notDone = false
  // both queues are sorted by ascending distance
  if (self._chunkIDsToRemove.length) {
    var remove = parseChunkID( self._chunkIDsToRemove.pop() )
    removeChunk( self, remove[0], remove[1], remove[2] )
    notDone = true
  }
  if (self._chunkIDsPendingCreation.length >= self._maxChunksPendingCreation) return notDone
  if (self.noa.rendering._chunksToMesh.length >= self._maxChunksPendingMeshing) return notDone
  if (self._chunkIDsToAdd.length) {
    var id = self._chunkIDsToAdd.shift()
    var toadd = parseChunkID(id)
    requestNewChunk( self, id, toadd[0], toadd[1], toadd[2] )
    notDone = true
  }
  return notDone
}




// make a new chunk and emit an event for it to be populated with world data
function requestNewChunk( world, id, i, j, k ) {
  var cs = world.chunkSize
  var chunk = new Chunk(world.noa, i, j, k, cs)
  setChunk(world, i, j, k, chunk)
  var x = i*cs-1
  var y = j*cs-1
  var z = k*cs-1
  enqueueID(id, world._chunkIDsPendingCreation)
  world.emit('worldDataNeeded', id, chunk.array, x, y, z)
}




function removeChunk( world, i, j, k ) {
  var chunk = getChunk(world, i, j, k)
  var id = getChunkID(i,j,k)
  world.emit( 'chunkBeingRemoved', chunk, id )
  chunk.dispose()
  setChunk(world, i, j, k, 0)
  unenqueueID(id, world._chunkIDsInMemory)
  // alert the world
  world.emit( 'chunkRemoved', i, j, k )
}





// for a given chunk (i/j/k) and local location (x/y/z), 
// update all chunks that need it (including border chunks with the 
// changed block in their 1-block padding)

function _updateChunkAndBorders(world, i, j, k, size, x, y, z, val) {
  // can't for the life of me think of a more sensible way to do this...
  var iBorder = (x===0) ? -1 : (x===size-1) ? 1 : 0
  var jBorder = (y===0) ? -1 : (y===size-1) ? 1 : 0
  var kBorder = (z===0) ? -1 : (z===size-1) ? 1 : 0

  for (var di=-1; di<2; ++di) {
    for (var dj=-1; dj<2; ++dj) {
      for (var dk=-1; dk<2; ++dk) {

        if ((di===0 || di===iBorder) &&
            (dj===0 || dj===jBorder) &&
            (dk===0 || dk===kBorder) ) {
          _modifyBlockData(world, i+di, j+dj, k+dk,
                           [size, x, -1][di+1], 
                           [size, y, -1][dj+1], 
                           [size, z, -1][dk+1], 
                           val)
        }

      }
    }
  }
}



// internal function to modify a chunk's block

function _modifyBlockData( world, i, j, k, x, y, z, val ) {
  var chunk = getChunk(world, i, j, k)
  if (!chunk) return
  chunk.set(x, y, z, val)
  world.emit('chunkChanged', chunk)
}




// rebuild queue of chunks to be added around (ci,cj,ck)
function buildChunkAddQueue( world, ci, cj, ck ) {
  var add = Math.ceil(world.chunkAddDistance)
  var pending = world._chunkIDsPendingCreation
  var queue = []
  var distArr = []

  var addDistSq = world.chunkAddDistance * world.chunkAddDistance
  for (var i=ci-add; i<=ci+add; ++i) {
    for (var j=cj-add; j<=cj+add; ++j) {
      for (var k=ck-add; k<=ck+add; ++k) {
        var di = i - ci
        var dj = j - cj
        var dk = k - ck
        var distSq = di * di + dj * dj + dk * dk
        if (distSq > addDistSq) continue
        
        if (getChunk(world, i, j, k)) continue
        var id = getChunkID(i,j,k)
        if (pending.indexOf(id) > -1) continue 
        queue.push(id)
        distArr.push(distSq)
      }
    }
  }
  world._chunkIDsToAdd = sortByReferenceArray(queue, distArr)
}


// rebuild queue of chunks to be removed from around (ci,cj,ck)
function buildChunkRemoveQueue( world, ci, cj, ck ) {
  var remDistSq = world.chunkRemoveDistance * world.chunkRemoveDistance
  var list = world._chunkIDsInMemory
  var queue = []
  var distArr = []
  
  for (var i=0; i<list.length; i++) {
    var id = list[i]
    var loc = parseChunkID(id)
    var di = loc[0]-ci
    var dj = loc[1]-cj
    var dk = loc[2]-ck
    var distSq = di * di + dj * dj + dk * dk
    if (distSq < remDistSq) continue
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
function enqueueID( id, queue ) {
  var i = queue.indexOf(id)
  if (i>=0) return
  queue.push(id)
}

// remove string id from queue if it exists
function unenqueueID( id, queue ) {
  var i = queue.indexOf(id)
  if (i>=0) queue.splice(i,1)
}








