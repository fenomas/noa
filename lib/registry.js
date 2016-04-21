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


var MAX_BLOCK_IDS = 255 // currently stored in chunks as int8


function Registry(noa, opts) {
    this.noa = noa
    var _opts = extend(defaults, opts)
    this._texturePath = _opts.texturePath

    // lookup arrays for block props and flags
    // fill in first value for id=0, empty space
    this._blockSolidity = [false]
    this._blockOpacity = [false]
    this._blockIsFluid = [false]
    this._blockCustomMesh = [-1]
    this._blockMats = [null, null, null, null, null, null]
    this._blockProps = [null]

    // materials and meshes
    this._matIDs = {}         // Material (texture/color) registry
    this._matData = []
    this._meshIDs = {}        // Mesh registry
    this._meshData = []
    this._objectCBs = [] // callbacks for when object mesh is placed

    // further register a bunch of ids to seed the property arrays
    // avoids holes, gives v8 a hint as to types, etc.
    for (var i = 1; i <= 64; i++) {
        this.registerBlock(i)
    }

    // add a default material and set ID=1 to it
    this.registerMaterial('dirt', [0.4, 0.3, 0], null)
    this.registerBlock(1, 'dirt')
}


/*
 *   APIs for registering game assets
 *  
 * registerBlock paramaters: 
 *  * id: integer, currently 1..255. This needs to be passed in by the 
 *    client because it goes into the chunk data, which someday will get serialized.
 *  * material: can be a single material name, or [top, bottom, sides], 
 *    or [-x, +x, -y, +y, -z, +z]
 *  * properties: not used yet?
 *  * solid: (true) solidity for physics purposes
 *  * opaque: (true) fully obscures neighboring blocks
 *  * fluid: (false) whether nonsolid block is a fluid (buoyant, viscous..)
 * 
 * registerBlock returns the id for convenience.
*/

Registry.prototype.registerBlock = function(id, material, properties, solid, opaque, fluid) {
    // console.log('register block: ', id, material, solid, opaque, fluid, properties)
    if (id < 1 || id > MAX_BLOCK_IDS) throw 'Invalid block id: ' + id
    if (id > this._blockSolidity.length) console.warn('Probably better to register block IDs in counting order without gaps!')

    // flags default to solid, opaque, nonfluid
    this._blockSolidity[id] = (solid == void 0) ? true : !!solid
    this._blockOpacity[id] = (opaque == void 0) ? true : !!opaque
    this._blockIsFluid[id] = !solid && !!fluid
    
    // props data object - currently unused except for fluid properties?
    this._blockProps[id] = properties || {}

    // parse out material parameter
    // always store 6 material IDs per blockID, so material lookup is monomorphic
    var mat = material
    var mats
    if (mat == void 0) {
        mats = [null, null, null, null, null, null]
    } else if (typeof mat == 'string') {
        mats = [mat, mat, mat, mat, mat, mat]
    } else if (mat.length && mat.length == 3) {
        // interpret as [top, bottom, sides]
        mats = [mat[2], mat[2], mat[0], mat[1], mat[2], mat[2]]
    } else if (mat.length && mat.length == 6) {
        // interpret as [-x, +x, -y, +y, -z, +z]
        mats = mat
    } else throw 'Invalid material parameter: ' + mat

    // argument is material name, but store as material id, allocating one if needed
    for (var i = 0; i < 6; ++i) {
        this._blockMats[id * 6 + i] = this.getMaterialId(mats[i], true)
    }

    // if block is fluid, initialize properties if needed
    if (this._blockIsFluid[id]) {
        var p = this._blockProps[id]
        if (p.fluidDensity == void 0) { p.fluidDensity = 1.0 }
        if (p.viscosity == void 0) { p.viscosity = 0.5 }
    }

    // terrain blocks have no custom mesh
    this._blockCustomMesh[id] = -1

    return id
}




// register an object (non-terrain) block type

Registry.prototype.registerObjectBlock = function(id, meshName, properties, solid, opaque, fluid) {
    // console.log('register object block: ', id, meshName, solid, opaque, fluid, properties)
    this.registerBlock(id, null, properties, solid, opaque, fluid)
    var meshID = this.getMeshID(meshName, true)
    this._blockCustomMesh[id] = meshID
    return id
}

Registry.prototype.registerObjectMeshCallback = function(meshName, cb) {
    var meshID = this.getMeshID(meshName, true)
    this._objectCBs[meshID] = cb
}

Registry.prototype._getMeshCallbackByBlockID = function(id) {
    var meshID = this._blockCustomMesh[id]
    return this._objectCBs[meshID]
}



// register a material by name -- color, texture, texHasAlpha
Registry.prototype.registerMaterial = function(name, color, textureURL, texHasAlpha) {
    // console.log('register mat: ', name, color, textureURL)
    var id = this._matIDs[name] || this._matData.length
    this._matIDs[name] = id
    var alpha = 1
    if (color && color.length == 4) {
        alpha = color.pop()
    }
    this._matData[id] = {
        color: color ? color : [1, 1, 1],
        alpha: alpha,
        texture: textureURL ? this._texturePath + textureURL : null,
        textureAlpha: !!texHasAlpha
    }
    return id
}




// Register a mesh that can be instanced later
Registry.prototype.registerMesh = function(name, mesh, props) {
    // console.log('registerMesh: ', name, mesh, props)
    var id = this._meshIDs[name] || this._meshData.length
    this._meshIDs[name] = id
    this._meshData[id] = {}
    if (mesh) {
        this._meshData[id].mesh = mesh
        this._meshData[id].props = props
        // disable mesh so original doesn't stay in scene
        mesh.setEnabled(false)
    }
    if (this._objectCBs[id] === undefined) this._objectCBs[id] = null
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

// block is fluid or not
Registry.prototype.getBlockFluidity = function(id) {
    return this._blockIsFluid[id]
}

// Get block property object passed in at registration
Registry.prototype.getBlockProps = function(id) {
    return this._blockProps[id]
}






/*
 *   Meant for internal use within the engine
*/


// Returns accessor to look up material ID given block id and face
//    accessor is function(blockID, dir)
//    dir is a value 0..5: [ +x, -x, +y, -y, +z, -z ]
Registry.prototype.getBlockFaceMaterialAccessor = function() {
    if (!this._storedBFMAccessor) {
        var bms = this._blockMats
        this._storedBFMAccessor = function(blockId, dir) {
            return bms[blockId * 6 + dir]
        }
    }
    return this._storedBFMAccessor
}

// look up material color given ID
// if lazy is set, pre-register the name and return an ID
Registry.prototype.getMaterialId = function(name, lazyInit) {
    var id = this._matIDs[name]
    if (id === undefined && lazyInit) {
        id = this.registerMaterial(name)
    }
    return id
}




// look up material color given ID
Registry.prototype.getMaterialColor = function(matID) {
    return this._matData[matID].color
}

// returns accessor to look up color used for vertices of blocks of given material
// - i.e. white if it has a texture, color otherwise
Registry.prototype.getMaterialVertexColorAccessor = function() {
    if (!this._storedMVCAccessor) {
        var matData = this._matData
        this._storedMVCAccessor = function(matID) {
            if (matData[matID].texture) return [1, 1, 1]
            return matData[matID].color
        }
    }
    return this._storedMVCAccessor
}

// look up material texture given ID
Registry.prototype.getMaterialTexture = function(matID) {
    return this._matData[matID].texture
}

// look up material's properties: color, alpha, texture, textureAlpha
Registry.prototype.getMaterialData = function(matID) {
    return this._matData[matID]
}




