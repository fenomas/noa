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

  this._blockIDs = {}       // Block registry
  this._blockMats = []
  this._blockData = []
  this._matIDs = {}         // Material (texture/color) registry
  this._matData = []
  this._meshIDs = {}        // Mesh registry
  this._meshData = []
  //  this._atlases = {}

  // make several special arrays for often looked-up block properties
  // (hopefully v8 will inline the lookups..)
  this._blockSolidity = [false]
  this._blockOpacity = [false]
  this._blockCustomMesh = [-1]

  // make block type 0 empty space
  this._blockData[0] = null

  // define some default values that may be overwritten
  this.registerBlock( 'dirt', 'dirt', {} )
  this.registerMaterial( 'dirt', [0.4, 0.3, 0], null )
}


/*
 *   APIs for registering game assets
 *   
 *   Block flags:
 *      solid  (true) : whether it's solid for physics purposes
 *      opaque (true) : whether it fully obscures neighboring blocks
*/

// material can be: a single material name, an array [top, bottom, sides],
// or a 6-array: [ +x, -x, +y, -y, +z, -z ]
Registry.prototype.registerBlock = function(name, material, properties,
                                             solid, opaque ) {
  // allow overwrites, for now anyway
  var id = this._blockIDs[name] || this._blockData.length
  this._blockIDs[name] = id
  this._blockData[id] = properties || null

  // always store 6 material IDs per blockID, so material lookup is monomorphic
  for (var i=0; i<6; ++i) {
    var matname
    if (typeof material=='string') matname = material
    else if (material.length==6) matname = material[i]
    else if (material.length==3) {
      matname = (i==2) ? material[0] : (i==3) ? material[1] : material[2]
    }
    if (!matname) throw new Error('Register block: "material" must be a material name, or an array of 3 or 6 of them.')
    this._blockMats[id*6 + i] = this.getMaterialId(matname, true)
  }

  // flags default to solid/opaque
  this._blockSolidity[id]   = (solid===undefined)  ? true : !!solid
  this._blockOpacity[id]    = (opaque===undefined) ? true : !!opaque

  // terrain blocks have no custom mesh
  this._blockCustomMesh[id] = -1

  return id
}




// register an object (non-terrain) block type

Registry.prototype.registerObjectBlock = function(name, meshName, properties,
                                                   solid, opaque ) {
  var id = this.registerBlock(name, ' ', properties, solid, opaque)
  var meshID = this.getMeshID(meshName, true)
  this._blockCustomMesh[id] = meshID
  return id
}





// register a material - name, ... color, texture, texHasAlpha
Registry.prototype.registerMaterial = function(name, color, textureURL, texHasAlpha) {
  var id = this._matIDs[name] || this._matData.length
  this._matIDs[name] = id
  var alpha = 1
  if (color && color.length==4) {
    alpha = color.pop()
  }
  this._matData[id] = {
    color: color ? color : [1,1,1],
    alpha: alpha,
    texture: textureURL ? this._texturePath+textureURL : null,
    textureAlpha: !!texHasAlpha
  }
  return id
}


// Atlas (spritesheet) assets

// Suspect it's better to leave atlases in client code - 
//   remove this if I still feel that way later

//Registry.prototype.registerAtlas = function(name, imgURL, jsonURL) {
//  var atlas = this.noa.rendering.createTextureAtlas(imgURL, jsonURL)
//  this._atlases[name] = atlas
//  return atlas
//}
//
//Registry.prototype.getAtlas = function(name) {
//  return this._atlases[name]
//}



// Register a mesh that can be instanced later
Registry.prototype.registerMesh = function(name, mesh, props) {
  var id = this._meshIDs[name] || this._meshData.length
  this._meshIDs[name] = id
  if (mesh) {
    this._meshData[id] = {
      mesh: mesh,
      props: props
    }
    // disable mesh so original doesn't stay in scene
    mesh.setEnabled(false)
  }
  return id
}

Registry.prototype.getMeshID = function(name, lazyInit) {
  var id = this._meshIDs[name]
  if (typeof id == 'undefined' && lazyInit) {
    id = this.registerMesh(name)
  }
  return id
}

Registry.prototype.getMesh = function(name) {
  return this._meshData[this._meshIDs[name]].mesh
}

Registry.prototype._getMeshByBlockID = function(id) {
  var mid = this._blockCustomMesh[id]
  return this._meshData[mid].mesh
}


/*
 *   APIs for querying about game assets
*/


Registry.prototype.getBlockID = function(name) {
  return this._blockIDs[name]
}

// block solidity (as in physics)
Registry.prototype.getBlockSolidity = function(id) {
  return this._blockSolidity[id]
}

// block opacity - whether it obscures the whole voxel (dirt) or 
// can be partially seen through (like a fencepost, etc)
Registry.prototype.getBlockOpacity = function(id) {
  return this._blockOpacity[id]
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
// if lazy is set, pre-register the name and return an ID
Registry.prototype.getMaterialId = function(name, lazyInit) {
  var id = this._matIDs[name]
  if (typeof id == 'undefined' && lazyInit) {
    id = this.registerMaterial(name)
  }
  return id
}




// look up material color given ID
Registry.prototype.getMaterialColor = function(matID) {
  return this._matData[matID].color
}

// color to be used for vertices of blocks with this material
// - i.e. white if it has a texture, color otherwise
Registry.prototype.getMaterialVertexColor = function(matID) {
  if (this._matData[matID].texture) return [1,1,1]
  return this._matData[matID].color
}

// look up material texture given ID
Registry.prototype.getMaterialTexture = function(matID) {
  return this._matData[matID].texture
}

// look up material's properties: color, alpha, texture, textureAlpha
Registry.prototype.getMaterialData = function(matID) {
  return this._matData[matID]
}




