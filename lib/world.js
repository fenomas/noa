'use strict';

var extend = require('extend')
var ndarray = require('ndarray')


module.exports = function(noa, opts) {
  return new World(noa, opts)
}


var defaultOptions = {
  generator: defaultGenerator,
  chunkSize: 16,
  chunkAddDistance: 3,
  chunkHideDistance: 4 // NYI

}



function World(noa, _opts) {
  this.noa = noa
  var opts = extend( defaultOptions, _opts )

  this.chunkSize = opts.chunkSize
  this.generator = opts.generator
  this.chunkAddDistance = opts.chunkAddDistance
  this.chunkHideDistance = opts.chunkHideDistance

  // this is ad-hoc for now
  this._neededChunks = []

  // internals
  this._chunks = {}
}



/*
 *   PUBLIC API 
*/ 

World.prototype.getBlock = function (x,y,z) {
  var cs = this.chunkSize
  var i = Math.floor(x/cs)
  var j = Math.floor(y/cs)
  var k = Math.floor(z/cs)
  var chunk = this._chunks[ getChunkID(i,j,k) ]
  if (!chunk) return 0
  x = (x<0) ? x-i*cs : x%cs
  y = (y<0) ? y-j*cs : y%cs
  z = (z<0) ? z-k*cs : z%cs
  return chunk.get( x, y, z )
  // TODO: above bit could be made faster by constraining chunksize
  // to be a power of 2, and using math tricks from 
  // voxel - Chunker#voxelAtCoordinates
}



World.prototype.tick = function() {
  // TODO: make noa an emitter and send a movedToNewChunk(?) event
  var loc = [0,0,0] // TODO: get from noa.playerEntity.position or similar
  var chunkID = getChunkID( loc[0], loc[1], loc[2] )
  if (chunkID != prevChunkID) {
    checkForMissingChunks( this, loc[0], loc[1], loc[2] )
  }
  prevChunkID = chunkID
  
  if (this._neededChunks.length) {
    addNewChunk( this, this._neededChunks.shift() )
  }
}
var prevChunkID = ''





/*
 *    INTERNALS
*/


// add a new chunk to the world, based on string id
function addNewChunk( world, id ) {
  var loc = parseChunkID(id)
  var chunk = createChunk( world, loc[0], loc[1], loc[2] )
  world._chunks[id] = chunk
  
  // TODO: make world (or noa) an emitter and have this be an event
  world.noa.onChunkAdded( chunk, loc[0], loc[1], loc[2] )
}



// create a given chunk, using the world's generator and chunkSize
function createChunk( world, i, j, k ) {
  var gen = world.generator
  var cs = world.chunkSize
  var chunk = world.generator( i*cs, j*cs, k*cs, cs, cs, cs )
  return chunk
}

// canonical string ID handling for the i,j,k-th chunk
function getChunkID( i, j, k ) {
  return [i, j, k].join('|')
}
function parseChunkID( id ) {
  var arr = id.split('|')
  return [ parseInt(arr[0]), parseInt(arr[1]), parseInt(arr[2]) ]
}



// check for missing chunks around the current (ci,cj,ck) one
function checkForMissingChunks( world, ci, cj, ck ) {
  var chunks = world._chunks,
      dist = world.chunkAddDistance,
      id, arr = []
  for (var i=ci-dist; i<=ci+dist; ++i) {
    for (var j=cj-dist; j<=cj+dist; ++j) {
      for (var k=ck-dist; k<=ck+dist; ++k) {
        id = getChunkID(i,j,k)
        if (chunks[id]) continue
        arr.push({
          id: id,
          dist: Math.abs(ci-i) + Math.abs(cj-j)*2 + Math.abs(ck-k)
        });
      }
    }
  }
  // sort the adds so that chunks fill in from the middle
  arr.sort( function(a,b){ return a.dist>b.dist ? 1:-1 } )
  for (i=0; i<arr.length; ++i) {
    world._neededChunks.push( arr[i].id )
  }
}








// sample generator function
//   args are x/y/z to start from, and size (dx/dy/dz) to generate
//   returns an ndarray of block IDs
// TODO: which typedarray is best?

function defaultGenerator( x, y, z, dx, dy, dz ) {
  var arr = new Uint8Array(dx*dy*dz)
  var chunk = new ndarray( arr, [dx,dy,dz] )
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
  return chunk
}






