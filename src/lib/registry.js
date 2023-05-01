

var defaults = {
    texturePath: ''
}

// voxel ID now uses the whole Uint16Array element
var MAX_BLOCK_ID = (1 << 16) - 1





/**
 * `noa.registry` - Where you register your voxel types, 
 * materials, properties, and events.
 * 
 * This module uses the following default options (from the options
 * object passed to the {@link Engine}):
 * 
 * ```js
 * var defaults = {
 *     texturePath: ''
 * }
 * ```
*/

export class Registry {


    /** 
     * @internal 
     * @param {import('../index').Engine} noa
    */
    constructor(noa, opts) {
        opts = Object.assign({}, defaults, opts)
        /** @internal */
        this.noa = noa

        /** @internal */
        this._texturePath = opts.texturePath

        /** Maps block face material names to matIDs
         * @type {Object.<string, number>} */
        var matIDs = {}

        // lookup arrays for block props and flags - all keyed by blockID
        // fill in first value for the air block with id=0
        var blockSolidity = [false]
        var blockOpacity = [false]
        var blockIsFluid = [false]
        var blockIsObject = [false]
        var blockProps = [null]     // less-often accessed properties
        var blockMeshes = [null]    // custom mesh objects
        var blockHandlers = [null]  // block event handlers
        var blockIsPlain = [false]  // true if voxel is "boring" - solid/opaque, no special props

        // this one is keyed by `blockID*6 + faceNumber`
        var blockMats = [0, 0, 0, 0, 0, 0]

        // and these are keyed by material id
        var matColorLookup = [null]
        var matAtlasIndexLookup = [-1]

        /** 
         * Lookup array of block face material properties - keyed by matID (not blockID)
         * @typedef MatDef
         * @prop {number[]} color
         * @prop {number} alpha
         * @prop {string} texture
         * @prop {boolean} texHasAlpha
         * @prop {number} atlasIndex
         * @prop {*} renderMat
         */
        /** @type {MatDef[]} */
        var matDefs = []


        /* 
         * 
         *      Block registration methods
         * 
        */



        /**
         * Register (by integer ID) a block type and its parameters.
         *  `id` param: integer, currently 1..65535. Generally you should 
         * specify sequential values for blocks, without gaps, but this 
         * isn't technically necessary.
         * 
         * @param {number} id - sequential integer ID (from 1)
         * @param {Partial<BlockOptions>} [options] 
         * @returns the `id` value specified
         */
        this.registerBlock = function (id = 1, options = null) {
            var defaults = new BlockOptions(options && options.fluid)
            var opts = Object.assign({}, defaults, options || {})

            // console.log('register block: ', id, opts)
            if (id < 1 || id > MAX_BLOCK_ID) throw 'Block id out of range: ' + id

            // if block ID is greater than current highest ID, 
            // register fake blocks to avoid holes in lookup arrays
            while (id > blockSolidity.length) {
                this.registerBlock(blockSolidity.length, {})
            }

            // flags default to solid, opaque, nonfluid
            blockSolidity[id] = !!opts.solid
            blockOpacity[id] = !!opts.opaque
            blockIsFluid[id] = !!opts.fluid

            // store any custom mesh
            blockIsObject[id] = !!opts.blockMesh
            blockMeshes[id] = opts.blockMesh || null

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

            // special lookup for "plain"-ness
            // plain means solid, opaque, not fluid, no mesh or events
            var isPlain = blockSolidity[id] && blockOpacity[id]
                && !hasHandler && !blockIsFluid[id] && !blockIsObject[id]
            blockIsPlain[id] = isPlain

            return id
        }




        /**
         * Register (by name) a material and its parameters.
         * 
         * @param {string} name of this material
         * @param {Partial<MaterialOptions>} [options]
         */

        this.registerMaterial = function (name = '?', options = null) {
            // catch calls to earlier signature
            if (Array.isArray(options)) {
                throw 'This API changed signatures in v0.33, please use: `noa.registry.registerMaterial("name", optionsObj)`'
            }

            var opts = Object.assign(new MaterialOptions(), options || {})
            var matID = matIDs[name] || matDefs.length
            matIDs[name] = matID

            var texURL = opts.textureURL ? this._texturePath + opts.textureURL : ''
            var alpha = 1.0
            var color = opts.color || [1.0, 1.0, 1.0]
            if (color.length === 4) alpha = color.pop()
            if (texURL) color = null

            // populate lookup arrays for terrain meshing
            matColorLookup[matID] = color
            matAtlasIndexLookup[matID] = opts.atlasIndex

            matDefs[matID] = {
                color,
                alpha,
                texture: texURL,
                texHasAlpha: !!opts.texHasAlpha,
                atlasIndex: opts.atlasIndex,
                renderMat: opts.renderMaterial,
            }
            return matID
        }



        /*
         *      quick accessors for querying block ID stuff
         */

        /** 
         * block solidity (as in physics) 
         * @param id
         */
        this.getBlockSolidity = function (id) {
            return blockSolidity[id]
        }

        /**
         * block opacity - whether it obscures the whole voxel (dirt) or 
         * can be partially seen through (like a fencepost, etc)
         * @param id
         */
        this.getBlockOpacity = function (id) {
            return blockOpacity[id]
        }

        /** 
         * block is fluid or not
         * @param id
         */
        this.getBlockFluidity = function (id) {
            return blockIsFluid[id]
        }

        /** 
         * Get block property object passed in at registration
         * @param id
         */
        this.getBlockProps = function (id) {
            return blockProps[id]
        }

        // look up a block ID's face material
        // dir is a value 0..5: [ +x, -x, +y, -y, +z, -z ]
        this.getBlockFaceMaterial = function (blockId, dir) {
            return blockMats[blockId * 6 + dir]
        }


        /**
         * General lookup for all properties of a block material
         * @param {number} matID 
         * @returns {MatDef}
         */
        this.getMaterialData = function (matID) {
            return matDefs[matID]
        }


        /**
         * Given a texture URL, does any material using that 
         * texture need alpha?
         * @internal
         * @returns {boolean}
         */
        this._textureNeedsAlpha = function (tex = '') {
            return matDefs.some(def => {
                if (def.texture !== tex) return false
                return def.texHasAlpha
            })
        }





        /*
         * 
         *   Meant for internal use within the engine
         * 
         */


        // internal access to lookup arrays
        /** @internal */
        this._solidityLookup = blockSolidity
        /** @internal */
        this._opacityLookup = blockOpacity
        /** @internal */
        this._fluidityLookup = blockIsFluid
        /** @internal */
        this._objectLookup = blockIsObject
        /** @internal */
        this._blockMeshLookup = blockMeshes
        /** @internal */
        this._blockHandlerLookup = blockHandlers
        /** @internal */
        this._blockIsPlainLookup = blockIsPlain
        /** @internal */
        this._materialColorLookup = matColorLookup
        /** @internal */
        this._matAtlasIndexLookup = matAtlasIndexLookup



        /*
         * 
         *      default initialization
         * 
         */

        // add a default material and set ID=1 to it
        // this is safe since registering new block data overwrites the old
        this.registerMaterial('dirt', { color: [0.4, 0.3, 0] })
        this.registerBlock(1, { material: 'dirt' })

    }

}

/*
 * 
 *          helpers
 * 
*/



// look up material ID given its name
// if lazy is set, pre-register the name and return an ID
function getMaterialId(reg, matIDs, name, lazyInit) {
    if (!name) return 0
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




/**
 * Default options when registering a block type
 */
function BlockOptions(isFluid = false) {
    /** Solidity for physics purposes */
    this.solid = (isFluid) ? false : true
    /** Whether the block fully obscures neighboring blocks */
    this.opaque = (isFluid) ? false : true
    /** whether a nonsolid block is a fluid (buoyant, viscous..) */
    this.fluid = false
    /** The block material(s) for this voxel's faces. May be:
     *   * one (String) material name
     *   * array of 2 names: [top/bottom, sides]
     *   * array of 3 names: [top, bottom, sides]
     *   * array of 6 names: [-x, +x, -y, +y, -z, +z]
     * @type {string|string[]}
    */
    this.material = null
    /** Specifies a custom mesh for this voxel, instead of terrain  */
    this.blockMesh = null
    /** Fluid parameter for fluid blocks */
    this.fluidDensity = 1.0
    /** Fluid parameter for fluid blocks */
    this.viscosity = 0.5
    /** @type {(x:number, y:number, z:number) => void} */
    this.onLoad = null
    /** @type {(x:number, y:number, z:number) => void} */
    this.onUnload = null
    /** @type {(x:number, y:number, z:number) => void} */
    this.onSet = null
    /** @type {(x:number, y:number, z:number) => void} */
    this.onUnset = null
    /** @type {(mesh:TransformNode, x:number, y:number, z:number) => void} */
    this.onCustomMeshCreate = null
}

/** @typedef {import('@babylonjs/core/Meshes').TransformNode} TransformNode */


/**
 * Default options when registering a Block Material
 */
function MaterialOptions() {
    /** An array of 0..1 floats, either [R,G,B] or [R,G,B,A]
     * @type {number[]}
     */
    this.color = null
    /** Filename of texture image, if any
     * @type {string}
     */
    this.textureURL = null
    /** Whether the texture image has alpha */
    this.texHasAlpha = false
    /** Index into a (vertical strip) texture atlas, if applicable */
    this.atlasIndex = -1
    /**
     * An optional Babylon.js `Material`. If specified, terrain for this voxel
     * will be rendered with the supplied material (this can impact performance).
     */
    this.renderMaterial = null
}
