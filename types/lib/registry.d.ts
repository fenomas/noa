export declare class Registry {
    /**
     * @class
     * @typicalname noa.registry
     * @classdesc for registering block types, materials & properties
     */
    constructor(noa: any, opts: any);
    noa: any;
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
    registerBlock: any;
    /**
     * Register (by name) a material and its parameters.
     *
     * @param name
     * @param color
     * @param textureURL
     * @param texHasAlpha
     * @param renderMaterial an optional BABYLON material to be used for block faces with this block material
     */
    registerMaterial: (
        name: any,
        color: any,
        textureURL: any,
        texHasAlpha: any,
        renderMaterial: any
    ) => any;
    /**
     * block solidity (as in physics)
     * @param id
     */
    getBlockSolidity: (id: number) => boolean;
    /**
     * block opacity - whether it obscures the whole voxel (dirt) or
     * can be partially seen through (like a fencepost, etc)
     * @param id
     */
    getBlockOpacity: (id: number) => boolean;
    /**
     * block is fluid or not
     * @param id
     */
    getBlockFluidity: (id: number) => boolean;
    /**
     * Get block property object passed in at registration
     * @param id
     */
    getBlockProps: (id: number) => any;
    getBlockFaceMaterial: (blockid: number, dir: any) => number;
    getMaterialColor: (matid: number) => any;
    getMaterialTexture: (matid: number) => any;
    getMaterialData: (matid: number) => any;
    _solidityLookup: boolean[];
    _opacityLookup: boolean[];
    _blockMeshLookup: any[];
    _blockHandlerLookup: any[];
    _getMaterialVertexColor: (matid: number) => any;
}
