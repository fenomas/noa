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
  generator: defaultGenerator,
  chunkSize: 16,
  chunkAddDistance: 2,
  chunkRemoveDistance: 3

}



function World(noa, _opts) {
  this.noa = noa
  var opts = extend( defaultOptions, _opts )

  this.chunkSize = opts.chunkSize
  this.generator = opts.generator
  this.chunkAddDistance = opts.chunkAddDistance
  this.chunkRemoveDistance = opts.chunkRemoveDistance
  if (this.chunkRemoveDistance < this.chunkAddDistance) {
    this.chunkRemoveDistance = this.chunkAddDistance
  }

  // internals
  this._chunksToAdd = []
  this._chunksToRemove = []
  this._chunks = {}
}

inherits( World, EventEmitter )



/*
 *   PUBLIC API 
*/ 

World.prototype.getBlockID = function (x,y,z) {
  var cs = this.chunkSize
  var i = Math.floor(x/cs)
  var j = Math.floor(y/cs)
  var k = Math.floor(z/cs)
  var chunk = this._chunks[ getChunkID(i,j,k) ]
  if (!chunk) return 0
  x -= i*cs
  y -= j*cs
  z -= k*cs
  return chunk.get( x, y, z )
  // TODO: consider constraining chunksize to be power of 2, 
  // using math tricks from voxel.js: Chunker#voxelAtCoordinates
}

World.prototype.getBlockSolidity = function (x,y,z) {
  return this.noa.registry._blockSolidity[ this.getBlockID(x,y,z) ]
}

World.prototype.getBlockOpacity = function (x,y,z) {
  return this.noa.registry._blockOpacity[ this.getBlockID(x,y,z) ]
}

World.prototype.getBlockTransparency = function (x,y,z) {
  return this.noa.registry._blockTransparency[ this.getBlockID(x,y,z) ]
}


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

function processChunkQueues(self, i, j, k) {
  if (self._chunksToRemove.length) {
    var remove = self._chunksToRemove.shift()
    removeChunk( self, remove[0], remove[1], remove[2] )
  } else if (self._chunksToAdd.length) {
    var index = findClosestChunk( i, j, k, self._chunksToAdd )
    var toadd = self._chunksToAdd.splice(index,1)[0]
    addNewChunk( self, toadd[0], toadd[1], toadd[2] )
  } else {
    return false
  }
  return true
}



/*
 *    INTERNALS
*/


// canonical string ID handling for the i,j,k-th chunk
function getChunkID( i, j, k ) {
  return [i, j, k].join('|')
}
function parseChunkID( id ) {
  var arr = id.split('|')
  return [ parseInt(arr[0]), parseInt(arr[1]), parseInt(arr[2]) ]
}


// add a new chunk to the world, based on string id
function addNewChunk( world, i, j, k ) {
  var id = getChunkID(i,j,k)
  var chunk = createChunk( world, i, j, k )
  world._chunks[id] = chunk
  // alert the world
  var cs = world.chunkSize
  world.emit( 'chunkAdded', chunk )
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




var DEBUG = 1
var genTime = 0, ccTime = 0, genCt = 0, ccCt = 0, t1, t2, t3

// create a given chunk, using the world's generator and chunkSize
function createChunk( world, i, j, k ) {
  if (DEBUG) t1 = performance.now()
  // create ndarray to hold the data
  var cs = world.chunkSize
  var chunk = new Chunk(world.noa, i, j, k, cs)
  if (DEBUG) t2 = performance.now()
  // hand raw ndarray to generator function, not wrapper
  world.generator( world.noa, chunk.array, i*cs-1, j*cs-1, k*cs-1 )
  if (DEBUG) t3 = performance.now()
  chunk.initData()

  if (DEBUG) {
    var gt = t3-t2
    var ct = performance.now() - t1 - gt
    genTime += gt
    ccTime += ct;
    ++genCt;
    ++ccCt
    var id = [chunk.i,chunk.j,chunk.k].join(',')
    console.log('chunk ', id, ' done. Create/init time: ', 
                ct.toFixed(2),' (avg. ', (ccTime/ccCt).toFixed(2), ') worldgen: ',
                gt.toFixed(2),' (avg. ', (genTime/genCt).toFixed(2), ')' )
  }
  //  if (dt > 15) throw new Error()
  return chunk
}


// check for needed/unneeded chunks around (ci,cj,ck)
function updateChunkQueues( world, ci, cj, ck ) {
  var chunks = world._chunks,
      add = world.chunkAddDistance,
      rem = world.chunkRemoveDistance,
      loc
  // enqueue chunks needing to be added
  for (var i=ci-add; i<=ci+add; ++i) {
    for (var j=cj-add; j<=cj+add; ++j) {
      for (var k=ck-add; k<=ck+add; ++k) {
        var id = getChunkID(i,j,k)
        if (chunks[id]) continue
        enqueueChunk( [i,j,k], world._chunksToAdd );
      }
    }
  }
  // enqueue chunks needing to be removed
  for (var s in world._chunks) {
    loc = parseChunkID(s)
    if ((Math.abs(loc[0]-ci) > rem) ||
        (Math.abs(loc[1]-cj) > rem) ||
        (Math.abs(loc[2]-ck) > rem)) {
      enqueueChunk( loc, world._chunksToRemove )
    }
  }
}


// enqueue an [i,j,k] chunk location into an array of them
function enqueueChunk( arr, queue ) {
  for (var i=0; i<queue.length; ++i) {
    var qarr = queue[i]
    if ( arr[0]==qarr[0] && arr[1]==qarr[1] && arr[2]==qarr[2] ) return;
  }
  queue.push(arr)
}

// find index of nearest chunk in queue of [i,j,k] arrays
function findClosestChunk( ci, cj, ck, queue ) {
  var index = -1, dist = Number.POSITIVE_INFINITY
  for (var i=0; i<queue.length; ++i) {
    var qarr = queue[i]
    var d = Math.pow(qarr[0]-ci,2) + Math.pow(qarr[1]-cj,2) + Math.pow(qarr[2]-ck,2)
    if (d<dist) {
      dist = d
      index = i
    }
  }
  return index
}






// sample generator function
//   takes an empty chunk, and an x/y/z to start from
//   writes data into the chunk (ndarray)

function defaultGenerator( chunk, x, y, z ) {
  var dx = chunk.shape[0]
  var dy = chunk.shape[1]
  var dz = chunk.shape[2]
  // default case - just return 1/2 for everything below y=5
  for (var i=0; i<dx; ++i) {
    for (var j=0; j<dy; ++j) {
      for (var k=0; k<dz; ++k) {
        var cy = y + j
        var blockID = (cy<4) ? 1 : (cy==4) ? 2 : 0
        if (cy==5 && Math.random()>0.8)  blockID = 2
        chunk.set( i,j,k, blockID )
      }
    }
  }
}



