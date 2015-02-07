'use strict';

var extend = require('extend')
var ndarray = require('ndarray')


module.exports = function(engine, opts, gen) {
  return new World(engine, opts, gen)
}



function World(engine, _opts, gen) {
  this.engine = engine
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

World.prototype.createChunk = function(size) {
  var s = size || this.chunkSize
  // TODO: what's the right type for this?
  var arr = new Uint8Array(s*s*s)
  var c = new ndarray( arr, [s,s,s] )
  for (var i=0; i<s; i++) {
    for (var j=0; j<s; j++) {
      for (var k=0; k<s; k++) {
        c.set( i,j,k, this._generator(i,j,k) )
      }
    }
  }
  return c
}





