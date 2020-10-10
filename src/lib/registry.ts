import Engine, { Material, Mesh } from ".."
import { Color3, Color4 } from "./types"

export interface IRegistryOptions {
    /**
     * @default ''
     */
    texturePath: string;
}

const registryDefaults: IRegistryOptions = {
    texturePath: ''
}

interface IMeshData {
    color: Color3;
    alpha: number;
    texture: string;
    textureAlpha: boolean;
    renderMat: Material | null;
}

export interface IBlockProps {
    fluidDensity?: number;
    viscosity?: number;
}

export type blockHandler = (arg0: any, arg1: any, arg2: any, arg3: any) => void

interface IBlockOptions {
    solid: boolean;
    opaque: boolean;
    fluid: boolean;
    fluidDensity: number;
    viscosity: number;
    blockMesh: Mesh | null;
    material: any | null;

    onLoad: null | blockHandler;
    onUnload: null | blockHandler;
    onSet: null | blockHandler;
    onUnset: null | blockHandler;
    onCustomMeshCreate: null | blockHandler;
}

const blockDefaults: IBlockOptions = {
    solid: true,
    opaque: true,
    fluid: false,
    fluidDensity: 1.0,
    viscosity: 0.5,
    blockMesh: null,
    material: null,
    onLoad: null,
    onUnload: null,
    onSet: null,
    onUnset: null,
    onCustomMeshCreate: null,
}


/**
 * data structs in the registry:
 * registry 
 *      blockSolidity:     id -> boolean
 *      blockOpacity:      id -> boolean
 *      blockIsFluid:      id -> boolean
 *      blockMats:         id -> 6x matID  [-x, +x, -y, +y, -z, +z]
 *      blockProps         id -> obj of less-often accessed properties
 *      blockMeshes:       id -> obj/null (custom mesh to instantiate)
 *      blockHandlers      id -> instance of `BlockCallbackHolder` or null 
 *      matIDs             matName -> matID (int)
 *      matData            matID -> { color, alpha, texture, textureAlpha }
 */


/** voxel ID now uses the whole Uint16Array element */
const MAX_BLOCK_ID = (1 << 16) - 1


/**
 * @typicalname noa.registry
 * @classdesc for registering block types, materials & properties
 */
export class Registry {
    constructor(noa: Engine, options: Partial<IRegistryOptions>) {
        const optionsWithDefaults = {
            ...registryDefaults,
            ...options
        }

        this.noa = noa
        this.texturePath = optionsWithDefaults.texturePath

        this.registerMaterial('dirt', [0.4, 0.3, 0])
        this.registerBlock(1, { material: 'dirt' })
    }

    noa: Engine

    texturePath: string
    
    _blockMats = [0, 0, 0, 0, 0, 0]
    _blockProps: { [key: number]: IBlockProps } = {} // was [null]

    _blockIsFluidLookup: boolean[] = [false]
    _solidityLookup: boolean[] = [false]
    _fluidityLookup: boolean[] = [false]
    _opacityLookup: boolean[] = [false]
    _objectLookup: boolean[] = [false]
    _blockMeshLookup: Mesh[] = [] // was [null]

    _blockHandlerLookup: (BlockCallbackHolder | null)[] = [] // was [null]

    // mat name -> id
    matIDs: { [key: string]: number } = {}

    // mat id -> { color, alpha, texture, textureAlpha }
    matData: { [key: number]: IMeshData } = [] // was [null]

    /**
     * Register (by integer ID) a block type and its parameters.
     * 
     *  `id` param: integer, currently 1..255. This needs to be passed in by the 
     *    client because it goes into the chunk data, which someday will get serialized.
     * 
     *  `options` param: Recognized fields for the options object:
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
     *  * blockMesh: (null) if specified, noa will create a copy this mesh in the voxel
     *  * fluidDensity: (1.0) for fluid blocks
     *  * viscosity: (0.5) for fluid blocks
     *  * onLoad(): block event handler
     *  * onUnload(): block event handler
     *  * onSet(): block event handler
     *  * onUnset(): block event handler
     *  * onCustomMeshCreate(): block event handler
     */

    registerBlock = (id: number, options: Partial<IBlockOptions>) => {
        const optionsWithDefaults = {
            ...blockDefaults,
            ...options
        };

        // console.log('register block: ', id, opts)
        if (id < 1 || id > MAX_BLOCK_ID) {
            throw new Error(`Block id out of range: ${id}`)
        }

        // if block ID is greater than current highest ID, 
        // register fake blocks to avoid holes in lookup arrays
        while (id > this._solidityLookup.length) {
            this.registerBlock(this._solidityLookup.length, {})
        }

        // flags default to solid, opaque, nonfluid
        this._solidityLookup[id] = optionsWithDefaults.solid
        this._opacityLookup[id] = optionsWithDefaults.opaque
        this._blockIsFluidLookup[id] = optionsWithDefaults.fluid

        // store any custom mesh
        this._objectLookup[id] = optionsWithDefaults.blockMesh!
        this._blockMeshLookup[id] = optionsWithDefaults.blockMesh!

        // parse out material parameter
        // always store 6 material IDs per blockID, so material lookup is monomorphic
        const mat = optionsWithDefaults.material
        let mats
        if (!mat) {
            mats = [null, null, null, null, null, null]
        }
        else if (typeof mat == 'string') {
            mats = [mat, mat, mat, mat, mat, mat]
        }
        else if (mat.length && mat.length == 2) {
            // interpret as [top/bottom, sides]
            mats = [mat[1], mat[1], mat[0], mat[0], mat[1], mat[1]]
        }
        else if (mat.length && mat.length == 3) {
            // interpret as [top, bottom, sides]
            mats = [mat[2], mat[2], mat[0], mat[1], mat[2], mat[2]]
        }
        else if (mat.length && mat.length == 6) {
            // interpret as [-x, +x, -y, +y, -z, +z]
            mats = mat
        }
        else {
            throw new Error(`Invalid material parameter: ${mat}`)
        }

        // argument is material name, but store as material id, allocating one if needed
        for (var i = 0; i < 6; ++i) {
            this._blockMats[id * 6 + i] = this.getMaterialId(mats[i], true)
        }

        // props data object - currently only used for fluid properties
        this._blockProps[id] = {}

        // if block is fluid, initialize properties if needed
        if (this._blockIsFluidLookup[id]) {
            this._blockProps[id].fluidDensity = optionsWithDefaults.fluidDensity
            this._blockProps[id].viscosity = optionsWithDefaults.viscosity
        }

        // event callbacks
        var hasHandler = optionsWithDefaults.onLoad || optionsWithDefaults.onUnload || optionsWithDefaults.onSet || optionsWithDefaults.onUnset || optionsWithDefaults.onCustomMeshCreate
        this._blockHandlerLookup[id] = hasHandler ? new BlockCallbackHolder(optionsWithDefaults) : null

        return id
    }


    /**
     * Register (by name) a material and its parameters.
     * 
     * @param name
     * @param color RGB [number, number, number] or RGBA [number, number, number, number]
     * @param textureURL
     * @param texHasAlpha
     * @param renderMaterial an optional BABYLON material to be used for block faces with this block material
     */
    registerMaterial = (name: string, color: Color3 | Color4 = [1, 1, 1], textureURL: string | undefined = undefined, texHasAlpha: boolean = false, renderMaterial: Material | null = null) => {
        // console.log('register mat: ', name, color, textureURL)
        const id = this.matIDs[name] || Object.values(this.matData).length
        this.matIDs[name] = id

        let alpha = 1
        if (color && color.length == 4) {
            alpha = color.pop()!
        }

        this.matData[id] = {
            color: color as Color3,
            alpha: alpha,
            texture: textureURL ? this.texturePath + textureURL : '',
            textureAlpha: texHasAlpha,
            renderMat: renderMaterial,
        }
        return id
    }

    /** 
     * block solidity (as in physics) 
     * @param id
     */
    getBlockSolidity = (id: number): boolean => {
        return this._solidityLookup[id]
    }

    /**
     * block opacity - whether it obscures the whole voxel (dirt) or 
     * can be partially seen through (like a fencepost, etc)
     * @param id
     */
    getBlockOpacity = (id: number) => {
        return this._opacityLookup[id]
    }

    /** 
     * block is fluid or not
     * @param id
     */
    getBlockFluidity = (id: number) => {
        return this._blockIsFluidLookup[id]
    }

    /** 
     * Get block property object passed in at registration
     * @param id
     */
    getBlockProps = (id: number) => {
        return this._blockProps[id]
    }

    // look up a block ID's face material
    // dir is a value 0..5: [ +x, -x, +y, -y, +z, -z ]
    getBlockFaceMaterial = (blockId: number, dir: number) => {
        return this._blockMats[blockId * 6 + dir]
    }

    /** look up material color given ID */
    getMaterialColor = (matID: number) => {
        return this.matData[matID].color
    }

    /** look up material texture given ID */
    getMaterialTexture = (matID: number) => {
        return this.matData[matID].texture
    }

    /** look up material's properties: color, alpha, texture, textureAlpha */
    getMaterialData = (matID: number) => {
        return this.matData[matID]
    }

    /**
     * look up color used for vertices of blocks of given material
     * - i.e. white if it has a texture, color otherwise
     */
    _getMaterialVertexColor = (matID: number): Color3 => {
        if (this.matData[matID].texture) {
            return [1, 1, 1]
        }

        return this.matData[matID].color
    }

    // look up material ID given its name
    // if lazy is set, pre-register the name and return an ID
    getMaterialId = (name: string, lazyInit: boolean = false) => {
        if (!name) {
            return 0
        }
    
        var id = this.matIDs[name]
        if (id === undefined && lazyInit) {
            id = this.registerMaterial(name)
        }
        return id
    }    
}


// data class for holding block callback references
export class BlockCallbackHolder {
    constructor(options: IBlockOptions) {
        this.onLoad = options.onLoad
        this.onUnload = options.onUnload
        this.onSet = options.onSet
        this.onUnset = options.onUnset
        this.onCustomMeshCreate = options.onCustomMeshCreate
    }

    onLoad: null | blockHandler
    onUnload: null | blockHandler
    onSet: null | blockHandler
    onUnset: null | blockHandler
    onCustomMeshCreate: null | blockHandler
}
