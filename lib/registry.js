'use strict';

var extend = require('extend')

module.exports = function(noa, opts) {
  return new Registry(noa, opts)
}


/*
 *   Registry = very ad-hoc for now
*/

var defaults = {
  texturePath: ""
}

function Registry(noa, opts) {
  this.noa = noa
  var _opts = extend( defaults, opts )
  this._texturePath = _opts.texturePath

  this._blockMaterialArrMap = [ null ]  // 0: air
  this._materialColors =   [ null ]  // 0: air
  this._materialTextures = [ null ]  // 0: air

  // define some default values that may be overwritten
  this.defineBlock( 1, 1 )
  this.defineBlock( 2, 2 )
  this.defineMaterial( 1, [0.4, 0.4, 0.4], null )
  this.defineMaterial( 2, [0.4, 0.9, 0.4], null )
}


/*
 *   API
*/


// look up material ID given block id and face
// dir is a value 0..5: [ +x, -x, +y, -y, +z, -z ]
Registry.prototype.getBlockFaceMaterial = function(blockId, dir) {
  return this._blockMaterialArrMap[blockId*6 + dir]
}

// look up material color given ID
Registry.prototype.getMaterialColor = function(matID) {
  return this._materialColors[matID]
}

// look up material texture given ID
Registry.prototype.getMaterialTexture = function(matID) {
  return this._materialTextures[matID]
}


// matID may be an array of matIDs by face: [ +x, -x, +y, -y, +z, -z ]
Registry.prototype.defineBlock = function(blockID, matID) {
  // always store 6 values per blockID, so that material lookup is monomorphic
  for (var i=0; i<6; ++i) {
    var id = blockID*6 + i
    var m = (matID.length) ? matID[i] : matID
    this._blockMaterialArrMap[id] = m
  }
}

Registry.prototype.defineMaterial = function(matID, col, tex) {
  this._materialColors[matID] = col
  this._materialTextures[matID] = tex ? this._texturePath+tex : null
}






