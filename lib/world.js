'use strict';

var extend = require('extend')
var ndarray = require('ndarray')


module.exports = function(noa, opts, gen) {
  return new World(noa, opts, gen)
}



function World(noa, _opts, gen) {
  this.noa = noa
  this._generator = gen
  
  // default options
  var defaults = {
    chunkSize: 12
  }
  var opts = extend( defaults, _opts )
  this.chunkSize = opts.chunkSize
}



/*
 *   PUBLIC API 
*/ 

World.prototype.createChunk = function(size, gen) {
  var s = size || this.chunkSize
  var generator = gen || this._generator
  // TODO: what's the right type for this?
  var arr = new Uint8Array(s*s*s)
  var c = new ndarray( arr, [s,s,s] )
  for (var i=0; i<s; i++) {
    for (var j=0; j<s; j++) {
      for (var k=0; k<s; k++) {
        c.set( i,j,k, generator(i,j,k) )
      }
    }
  }
  return c
}





