'use strict';

var extend = require('extend')

module.exports = function (noa, opts) {
    return new Registry(noa, opts)
}


/**
 * This is where clients register block types and their materials & properties.
 * @class noa.registry
 */


/*
 *  data structs in the registry:
 *  registry 
 *      _blockSolidity:     id -> boolean
 *      _blockOpacity:      id -> boolean
 *      _blockIsFluid:      id -> boolean
 *      _blockMats:         id -> 6x matID  [-x, +x, -y, +y, -z, +z]
 *      _blockProps         id -> obj of less-often accessed properties
 *      _blockMesh:         id -> obj/null (custom mesh to instantiate)
 *      _blockHandlers      id -> instance of `BlockCallbackHolder` or null 
 *      _matIDs             matName -> matID
 *      _matData            matID -> { color, alpha, texture, textureAlpha }
*/


var defaults = {
    texturePath: ''
}

var blockDefaults = {
    solid: true,
    opaque: true,
    fluidDensity: 1.0,
    viscosity: 0.5,
}

var MAX_BLOCK_IDS = 255 // currently stored in chunks as int8


function Registry(noa, _options) {
    this.noa = noa
    var opts = extend({}, defaults, _options)
    this._texturePath = opts.texturePath

    // lookup arrays for block props and flags
    // fill in first value for id=0, empty space
    this._blockSolidity = [false]
    this._blockOpacity = [false]
    this._blockIsFluid = [false]
    this._blockMats = [null, null, null, null, null, null]
    this._blockProps = [null]
    this._blockMesh = [null]
    this._blockHandlers = [null]

    // materials
    this._matIDs = {}           // mat name -> id
    this._matData = []          // mat id -> { color, alpha, texture, textureAlpha }

    // register a bunch of ids to seed the property arrays and avoid holes
    for (var i = 1; i <= 32; i++) {
        this.registerBlock(i)
    }

    // add a default material and set ID=1 to it
    // note that registering new block data overwrites the old
    this.registerMaterial('dirt', [0.4, 0.3, 0], null)
    this.registerBlock(1, 'dirt')
}



/*
 *
 *   APIs for registering game assets
 *
*/



/*
 * Register (by name) a block type and its parameters.
 * 
 *  @param id: integer, currently 1..255. This needs to be passed in by the 
 *    client because it goes into the chunk data, which someday will get serialized.
 * 
 * Recognized fields for the options object:
 * 
 *  * material: can be a single material name, or [top, bottom, sides], 
 *    or [-x, +x, -y, +y, -z, +z]. If not specified, terrain won't be meshed for the block type
 *  * solid: (true) solidity for physics purposes
 *  * opaque: (true) fully obscures neighboring blocks
 *  * fluid: (false) whether nonsolid block is a fluid (buoyant, viscous..)
 *  * blockMesh: (null) if specified, noa will create an instance of the mesh instead of rendering voxel terrain
 *  * fluidDensity: (1.0) for fluid blocks
 *  * viscosity: (0.5) for fluid blocks
 *  * onLoad(): block event handler
 *  * onUnload(): block event handler
 *  * onSet(): block event handler
 *  * onUnset(): block event handler
 *  * onCustomMeshCreate(): block event handler
*/


Registry.prototype.registerBlock = function (id, _options) { // material, properties, solid, opaque, fluid) {
    _options = _options || {}
    blockDefaults.solid = !_options.fluid
    blockDefaults.opaque = !_options.fluid
    var opts = extend({}, blockDefaults, _options)

    // console.log('register block: ', id, opts)
    if (id < 1 || id > MAX_BLOCK_IDS) throw 'Invalid block id: ' + id
    if (id > this._blockSolidity.length) console.warn('Probably better to register block IDs in counting order without gaps!')

    // flags default to solid, opaque, nonfluid
    this._blockSolidity[id] = !!opts.solid
    this._blockOpacity[id] = !!opts.opaque
    this._blockIsFluid[id] = !!opts.fluid

    // store any custom mesh, and if one is present assume no material
    this._blockMesh[id] = opts.blockMesh || null
    if (this._blockMesh[id]) opts.material = null

    // parse out material parameter
    // always store 6 material IDs per blockID, so material lookup is monomorphic
    var mat = opts.material || null
    var mats
    if (!mat) {
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
        this._blockMats[id * 6 + i] = getMaterialId(this, mats[i], true)
    }

    // props data object - currently only used for fluid properties
    this._blockProps[id] = {}

    // if block is fluid, initialize properties if needed
    if (this._blockIsFluid[id]) {
        this._blockProps[id].fluidDensity = opts.fluidDensity
        this._blockProps[id].viscosity = opts.viscosity
    }

    // event callbacks
    var hasHandler = opts.onLoad || opts.onUnload || opts.onSet || opts.onUnset || opts.onCustomMeshCreate
    this._blockHandlers[id] = (hasHandler) ? new BlockCallbackHolder(opts) : null

    return id
}

// data class for holding block callback references
function BlockCallbackHolder(opts) {
    this.onLoad = opts.onLoad || null
    this.onUnload = opts.onUnload || null
    this.onSet = opts.onSet || null
    this.onUnset = opts.onUnset || null
    this.onCustomMeshCreate = opts.onCustomMeshCreate || null
}



/*
 * Register (by name) a material and its parameters.
 * 
 * @param name,color,textureURL,texHasAlpha
*/

Registry.prototype.registerMaterial = function (name, color, textureURL, texHasAlpha) {
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
        texture: textureURL ? this._texturePath + textureURL : '',
        textureAlpha: !!texHasAlpha
    }
    return id
}



/*
 *   APIs for querying about game assets
*/

// block solidity (as in physics)
Registry.prototype.getBlockSolidity = function (id) {
    return this._blockSolidity[id]
}

// block opacity - whether it obscures the whole voxel (dirt) or 
// can be partially seen through (like a fencepost, etc)
Registry.prototype.getBlockOpacity = function (id) {
    return this._blockOpacity[id]
}

// block is fluid or not
Registry.prototype.getBlockFluidity = function (id) {
    return this._blockIsFluid[id]
}

// Get block property object passed in at registration
Registry.prototype.getBlockProps = function (id) {
    return this._blockProps[id]
}






/*
 *   Meant for internal use within the engine
*/


// Returns accessor to look up material ID given block id and face
//    accessor is function(blockID, dir)
//    dir is a value 0..5: [ +x, -x, +y, -y, +z, -z ]
Registry.prototype.getBlockFaceMaterialAccessor = function () {
    if (!this._storedBFMAccessor) {
        var bms = this._blockMats
        this._storedBFMAccessor = function (blockId, dir) {
            return bms[blockId * 6 + dir]
        }
    }
    return this._storedBFMAccessor
}


// look up material ID given its name
// if lazy is set, pre-register the name and return an ID
function getMaterialId(reg, name, lazyInit) {
    var id = reg._matIDs[name]
    if (id === undefined && lazyInit) {
        id = reg.registerMaterial(name)
    }
    return id
}




// look up material color given ID
Registry.prototype.getMaterialColor = function (matID) {
    return this._matData[matID].color
}

// returns accessor to look up color used for vertices of blocks of given material
// - i.e. white if it has a texture, color otherwise
Registry.prototype.getMaterialVertexColorAccessor = function () {
    if (!_storedMVCAccessor) {
        var matData = this._matData
        _storedMVCAccessor = function (matID) {
            if (matData[matID].texture) return white
            return matData[matID].color
        }
    }
    return _storedMVCAccessor
}
var _storedMVCAccessor
var white = [1, 1, 1]


// look up material texture given ID
Registry.prototype.getMaterialTexture = function (matID) {
    return this._matData[matID].texture
}

// look up material's properties: color, alpha, texture, textureAlpha
Registry.prototype.getMaterialData = function (matID) {
    return this._matData[matID]
}




