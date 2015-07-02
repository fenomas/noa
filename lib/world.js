'use strict';

var extend = require('extend')
var ndarray = require('ndarray')
var inherits = require('inherits')
var EventEmitter = require('events').EventEmitter
var Chunk = require('./chunk')


module.exports = function(noa, opts) {
  return new World(noa, opts)
}


var defaultOptions = {
  chunkSize: 24,
  chunkAddDistance: 2,
  chunkRemoveDistance: 3

}



function World(noa, _opts) {
  this.noa = noa
  var opts = extend( defaultOptions, _opts )

  this.chunkSize = opts.chunkSize
  this.chunkAddDistance = opts.chunkAddDistance
  this.chunkRemoveDistance = opts.chunkRemoveDistance
  if (this.chunkRemoveDistance < this.chunkAddDistance) {
    this.chunkRemoveDistance = this.chunkAddDistance
  }

  // internals
  this._chunkIDsToAdd = []
  this._chunkIDsToRemove = []
  this._chunks = {}
}

inherits( World, EventEmitter )



/*
 *   PUBLIC API 
*/ 

var cs, i, j, k, chunk

World.prototype.getBlockID = function (x,y,z) {
  cs = this.chunkSize
  i = Math.floor(x/cs)
  j = Math.floor(y/cs)
  k = Math.floor(z/cs)
  chunk = this._chunks[ getChunkID(i,j,k) ]
  if (chunk === void 0) return 0
  return chunk.get( x-i*cs, y-j*cs, z-k*cs )
  // TODO: consider constraining chunksize to be power of 2, 
  // using math tricks from voxel.js: Chunker#voxelAtCoordinates
}

// very hot function, so reproduce guts of above rather than passing arrays around
World.prototype.getBlockSolidity = function (x,y,z) {
  cs = this.chunkSize
  i = Math.floor(x/this.chunkSize)|0
  j = Math.floor(y/this.chunkSize)|0
  k = Math.floor(z/this.chunkSize)|0
  chunk = this._chunks[ getChunkID(i,j,k) ]
  if (chunk === void 0) return 0
  return chunk.getSolidityAt( x-i*cs, y-j*cs, z-k*cs )
}

World.prototype.getBlockOpacity = function (x,y,z) {
  return this.noa.registry._blockOpacity[ this.getBlockID(x,y,z) ]
}

World.prototype.getBlockTransparency = function (x,y,z) {
  return this.noa.registry._blockTransparency[ this.getBlockID(x,y,z) ]
}

World.prototype.getBlockFluidity = function (x,y,z) {
  return this.noa.registry._blockIsFluid[ this.getBlockID(x,y,z) ]
}

World.prototype.getBlockProperties = function (x,y,z) {
  return this.noa.registry._blockProps[ this.getBlockID(x,y,z) ]
}


World.prototype.setBlockID = function (val,x,y,z) {
  cs = this.chunkSize
  i = Math.floor(x/cs)
  j = Math.floor(y/cs)
  k = Math.floor(z/cs)
  x -= i*cs
  y -= j*cs
  z -= k*cs

  // if update is on chunk border, update neighbor's padding data too
  _updateChunkAndBorders(this, i, j, k, cs, x, y, z, val)
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
    updateChunkQueues( this, i, j, k )
  }
  this._lastPlayerChunkID = chunkID

  // add or remove one chunk if needed. If fast, do a couple.
  var d = performance.now()
  var notDone = true
  while(notDone && (performance.now() < d+3)) {
    notDone = processChunkQueues(this, i, j, k)
  }
}


// client calls this after creating one chunk's worth of data (as an ndarray)
World.prototype.setChunkData = function(id, array) {
  var chunk = this._chunks[id]
  chunk.array = array
  chunk.initData()
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



// run through chunk tracking queues looking for work to do next
function processChunkQueues(self, i, j, k) {
  if (self._chunkIDsToRemove.length) {
    var remove = parseChunkID( self._chunkIDsToRemove.shift() )
    removeChunk( self, remove[0], remove[1], remove[2] )
  } else if (self._chunkIDsToAdd.length) {
    var index = findClosestChunk( i, j, k, self._chunkIDsToAdd )
    var id = self._chunkIDsToAdd.splice(index,1)[0]
    var toadd = parseChunkID(id)
    requestNewChunk( self, toadd[0], toadd[1], toadd[2] )
  } else {
    return false
  }
  return true
}




// make a new chunk and emit an event for it to be populated with world data
function requestNewChunk( world, i, j, k ) {
  var id = getChunkID(i,j,k)
  var cs = world.chunkSize
  var chunk = new Chunk(world.noa, i, j, k, cs)
  world._chunks[id] = chunk
  var x = i*cs-1
  var y = j*cs-1
  var z = k*cs-1
  world.emit('worldDataNeeded', id, chunk.array, x, y, z)
}




function removeChunk( world, i, j, k ) {
  var id = getChunkID(i,j,k)
  world._chunks[id].dispose()
  delete world._chunks[id]
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
  var id = getChunkID(i,j,k)
  var chunk = world._chunks[id]
  if (!chunk) return
  chunk.set(x, y, z, val)
  world.emit('chunkChanged', chunk)
}




// check for needed/unneeded chunks around (ci,cj,ck)
function updateChunkQueues( world, ci, cj, ck ) {
  var chunks = world._chunks,
      add = world.chunkAddDistance,
      rem = world.chunkRemoveDistance,
      id
  // enqueue chunks needing to be added
  for (var i=ci-add; i<=ci+add; ++i) {
    for (var j=cj-add; j<=cj+add; ++j) {
      for (var k=ck-add; k<=ck+add; ++k) {
        id = getChunkID(i,j,k)
        if (chunks[id]) continue
        enqueueID(   id, world._chunkIDsToAdd )
        unenqueueID( id, world._chunkIDsToRemove )
      }
    }
  }
  // enqueue chunks needing to be removed
  for (id in world._chunks) {
    var loc = parseChunkID(id)
    if ((Math.abs(loc[0]-ci) > rem) ||
        (Math.abs(loc[1]-cj) > rem) ||
        (Math.abs(loc[2]-ck) > rem)) {
      enqueueID(   id, world._chunkIDsToRemove )
      unenqueueID( id, world._chunkIDsToAdd )
    }
  }
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

// find index of nearest chunk in queue of [i,j,k] arrays
function findClosestChunk( ci, cj, ck, queue ) {
  var index = -1, 
      dist = Number.POSITIVE_INFINITY
  for (var i=0; i<queue.length; ++i) {
    var qarr = parseChunkID(queue[i])
    var di = qarr[0]-ci
    var dj = qarr[1]-cj
    var dk = qarr[2]-ck
    var dsq = di*di + dj*dj + dk*dk
    if (dsq<dist) {
      dist = dsq
      index = i
      // bail early if very closeby
      if (dsq<3) return i
    }
  }
  return index
}







