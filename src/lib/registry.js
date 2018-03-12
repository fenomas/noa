'use strict'

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
 *      blockSolidity:     id -> boolean
 *      blockOpacity:      id -> boolean
 *      blockIsFluid:      id -> boolean
 *      blockMats:         id -> 6x matID  [-x, +x, -y, +y, -z, +z]
 *      blockProps         id -> obj of less-often accessed properties
 *      blockMeshes:       id -> obj/null (custom mesh to instantiate)
 *      blockHandlers      id -> instance of `BlockCallbackHolder` or null 
 *      matIDs             matName -> matID
 *      matData            matID -> { color, alpha, texture, textureAlpha }
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


    /* 
     * 
     *      data structures
     * 
    */

    // lookup arrays for block props and flags - all keyed by blockID
    // fill in first value for id=0, empty space
    var blockSolidity = [false]
    var blockOpacity = [false]
    var blockIsFluid = [false]
    var blockMats = [null, null, null, null, null, null]
    var blockProps = [null]
    var blockMeshes = [null]
    var blockHandlers = [null]

    // material data structs
    var matIDs = {}             // mat name -> id
    var matData = [null]        // mat id -> { color, alpha, texture, textureAlpha }

    // option data to save
    var texturePath = opts.texturePath



    /* 
     * 
     *      Block registration methods
     * 
    */



    /**
     * Register (by integer ID) a block type and its parameters.
     * 
     *  @param id: integer, currently 1..255. This needs to be passed in by the 
     *    client because it goes into the chunk data, which someday will get serialized.
     * 
     *  @param options: Recognized fields for the options object:
     * 
     *  * material: can be:
     *      * one (String) material name
     *      * array of 2 names: [top/bottom, sides]
     *      * array of 3 names: [top, bottom, sides]
     *      * array of 6 names: [-x, +x, -y, +y, -z, +z]
     *    If not specified, terrain won't be meshed for the block type
     *  * solid: (true) solidity for physics purposes
     *  * opaque: (true) fully obscures neighboring blocks
     *  * fluid: (false) whether nonsolid block is a fluid (buoyant, viscous..)
     *  * blockMeshes: (null) if specified, noa will create an instance of the mesh instead of rendering voxel terrain
     *  * fluidDensity: (1.0) for fluid blocks
     *  * viscosity: (0.5) for fluid blocks
     *  * onLoad(): block event handler
     *  * onUnload(): block event handler
     *  * onSet(): block event handler
     *  * onUnset(): block event handler
     *  * onCustomMeshCreate(): block event handler
    */


    this.registerBlock = function (id, _options) {
        _options = _options || {}
        blockDefaults.solid = !_options.fluid
        blockDefaults.opaque = !_options.fluid
        var opts = extend({}, blockDefaults, _options)

        // console.log('register block: ', id, opts)
        if (id < 1 || id > MAX_BLOCK_IDS) throw 'Block id exceeds max: ' + id

        // if block ID is greater than current highest ID, 
        // register fake blocks to avoid holes in lookup arrays
        while (id > blockSolidity.length) {
            this.registerBlock(blockSolidity.length, {})
        }

        // flags default to solid, opaque, nonfluid
        blockSolidity[id] = !!opts.solid
        blockOpacity[id] = !!opts.opaque
        blockIsFluid[id] = !!opts.fluid

        // store any custom mesh, and if one is present assume no material
        blockMeshes[id] = opts.blockMesh || null
        if (blockMeshes[id]) opts.material = null

        // parse out material parameter
        // always store 6 material IDs per blockID, so material lookup is monomorphic
        var mat = opts.material || null
        var mats
        if (!mat) {
            mats = [null, null, null, null, null, null]
        } else if (typeof mat == 'string') {
            mats = [mat, mat, mat, mat, mat, mat]
        } else if (mat.length && mat.length == 2) {
            // interpret as [top/bottom, sides]
            mats = [mat[1], mat[1], mat[0], mat[0], mat[1], mat[1]]
        } else if (mat.length && mat.length == 3) {
            // interpret as [top, bottom, sides]
            mats = [mat[2], mat[2], mat[0], mat[1], mat[2], mat[2]]
        } else if (mat.length && mat.length == 6) {
            // interpret as [-x, +x, -y, +y, -z, +z]
            mats = mat
        } else throw 'Invalid material parameter: ' + mat

        // argument is material name, but store as material id, allocating one if needed
        for (var i = 0; i < 6; ++i) {
            blockMats[id * 6 + i] = getMaterialId(this, matIDs, mats[i], true)
        }

        // props data object - currently only used for fluid properties
        blockProps[id] = {}

        // if block is fluid, initialize properties if needed
        if (blockIsFluid[id]) {
            blockProps[id].fluidDensity = opts.fluidDensity
            blockProps[id].viscosity = opts.viscosity
        }

        // event callbacks
        var hasHandler = opts.onLoad || opts.onUnload || opts.onSet || opts.onUnset || opts.onCustomMeshCreate
        blockHandlers[id] = (hasHandler) ? new BlockCallbackHolder(opts) : null

        return id
    }




    /*
     * Register (by name) a material and its parameters.
     * 
     * @param name,color,textureURL,texHasAlpha
     * @param renderMaterial an optional BABYLON material to be used for block faces with this block material
    */

    this.registerMaterial = function (name, color, textureURL, texHasAlpha, renderMaterial) {
        // console.log('register mat: ', name, color, textureURL)
        var id = matIDs[name] || matData.length
        matIDs[name] = id
        var alpha = 1
        if (color && color.length == 4) {
            alpha = color.pop()
        }
        matData[id] = {
            color: color || [1, 1, 1],
            alpha: alpha,
            texture: textureURL ? texturePath + textureURL : '',
            textureAlpha: !!texHasAlpha,
            renderMat: renderMaterial || null,
        }
        return id
    }



    /*
     *      quick accessors for querying block ID stuff
    */

    // block solidity (as in physics)
    this.getBlockSolidity = function (id) {
        return blockSolidity[id]
    }

    // block opacity - whether it obscures the whole voxel (dirt) or 
    // can be partially seen through (like a fencepost, etc)
    this.getBlockOpacity = function (id) {
        return blockOpacity[id]
    }

    // block is fluid or not
    this.getBlockFluidity = function (id) {
        return blockIsFluid[id]
    }

    // Get block property object passed in at registration
    this.getBlockProps = function (id) {
        return blockProps[id]
    }

    // look up a block ID's face material
    // dir is a value 0..5: [ +x, -x, +y, -y, +z, -z ]
    this.getBlockFaceMaterial = function (blockId, dir) {
        return blockMats[blockId * 6 + dir]
    }





    // look up material color given ID
    this.getMaterialColor = function (matID) {
        return matData[matID].color
    }

    // look up material texture given ID
    this.getMaterialTexture = function (matID) {
        return matData[matID].texture
    }

    // look up material's properties: color, alpha, texture, textureAlpha
    this.getMaterialData = function (matID) {
        return matData[matID]
    }





    /*
     * 
     *   Meant for internal use within the engine
     * 
    */


    // internal access to lookup arrays
    this._solidityLookup = blockSolidity
    this._opacityLookup = blockOpacity
    this._blockMeshLookup = blockMeshes
    this._blockHandlerLookup = blockHandlers






    // look up color used for vertices of blocks of given material
    // - i.e. white if it has a texture, color otherwise
    this._getMaterialVertexColor = function (matID) {
        if (matData[matID].texture) return white
        return matData[matID].color
    }
    var white = [1, 1, 1]





    /*
     * 
     *      default initialization
     * 
    */

    // add a default material and set ID=1 to it
    // note that registering new block data overwrites the old
    this.registerMaterial('dirt', [0.4, 0.3, 0], null)
    this.registerBlock(1, { material: 'dirt' })



}



/*
 * 
 *          helpers
 * 
*/



// look up material ID given its name
// if lazy is set, pre-register the name and return an ID
function getMaterialId(reg, matIDs, name, lazyInit) {
    if (!name) return null
    var id = matIDs[name]
    if (id === undefined && lazyInit) id = reg.registerMaterial(name)
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








