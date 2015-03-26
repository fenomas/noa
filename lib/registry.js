'use strict';

var extend = require('extend')

module.exports = function(noa, opts) {
  return new Registry(noa, opts)
}


/*
 *   Registry - registering game assets and data abstractly
*/

var defaults = {
  texturePath: ''
}

function Registry(noa, opts) {
  this.noa = noa
  var _opts = extend( defaults, opts )
  this._texturePath = _opts.texturePath

  this._blockIDs = {}
  this._blockProps = [ null ]
  this._blockMats = [ null ]
  
  this._matIDs = {}
  this._matData = []

  this._spritesheetIDs = {}
  this._spritesheetData = []
  
  this._meshIDs = {}
  this._meshes = []

  // define some default values that may be overwritten
  this.registerBlock( 'dirt', 'dirt', {} )
  this.registerMaterial( 'dirt', [0.4, 0.4, 0.4], null )
}


/*
 *   APIs for registering game assets
*/

// material can be: a single material name, an array [top, bottom, sides],
// or a 6-array: [ +x, -x, +y, -y, +z, -z ]
Registry.prototype.registerBlock = function(name, material, properties) {
  // allow overwrites, for now anyway
  var id = this._blockIDs[name] || this._blockProps.length
  this._blockIDs[name] = id
  this._blockProps[id] = properties || null
  // always store 6 material IDs per blockID, so material lookup is monomorphic
  for (var i=0; i<6; ++i) {
    var matname
    if (typeof material=='string') matname = material
    else if (material.length==6) matname = material[i]
    else if (material.length==3) {
      matname = (i==2) ? material[0] : (i==3) ? material[1] : material[2]
    }
    if (!matname) throw new Error('Register block: "material" must be a material name, or an array of 3 or 6 of them.')
    this._blockMats[id*6 + i] = lazyGetMatID(this,matname)
  }
  return id
}
// pre-register mat names so that blocks/mats can be registered in either order
function lazyGetMatID(reg, name) {
  var id = reg._matIDs[name]
  if (!id) id = reg.registerMaterial(name)
  return id
}


// register a material - name, [color, texture]
Registry.prototype.registerMaterial = function(name, color, textureURL) {
  var id = this._matIDs[name] || this._matData.length
  this._matIDs[name] = id
  this._matData[id] = {
    color: color ? color : [1,1,1],
    texture: textureURL ? this._texturePath+textureURL : null
  }
  return id
}


// Sprite sheet assets for sprite-meshed entities
Registry.prototype.registerSpritesheet = function(name, url, count, size) {
  var id = this._spritesheetIDs[name] || this._spritesheetData.length
  this._spritesheetIDs[name] = id
  this._spritesheetData[id] = {
    count: count,
    size: size,
    url: this._texturePath+url
  }
  return id
}

// Register a mesh that can be instanced later
Registry.prototype.registerMesh = function(name, mesh) {
  var id = this._meshIDs[name] || this._meshes.length
  this._meshIDs[name] = id
  this._meshes[id] = mesh
  // disable mesh so original doesn't stay in scene
  mesh.setEnabled(false)
  return id
}

Registry.prototype._getMesh = function(name) {
  var id = this._meshIDs[name]
  return this._meshes[id]
}


/*
 *   APIs for querying about game assets
*/


Registry.prototype.getBlockID = function(name) {
  return this._blockIDs[name]
}




/*
 *   Meant for internal use within the engine
*/


// look up material ID given block id and face
// dir is a value 0..5: [ +x, -x, +y, -y, +z, -z ]
Registry.prototype.getBlockFaceMaterial = function(blockId, dir) {
  return this._blockMats[blockId*6 + dir]
}

// look up material color given ID
Registry.prototype.getMaterialColor = function(matID) {
  return this._matData[matID].color
}

// look up material texture given ID
Registry.prototype.getMaterialTexture = function(matID) {
  return this._matData[matID].texture
}




