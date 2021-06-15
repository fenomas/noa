/**
 * `noa.registry` - Where you register your voxel types,
 * materials, properties, and events.
 *
 * This module uses the following default options (from the options
 * object passed to the [[Engine]]):
 *
 * ```js
 * var defaults = {
 *     texturePath: ''
 * }
 * ```
*/
export class Registry {
    /** @internal @prop noa */
    /** @internal @prop _texturePath */
    /** @internal */
    constructor(noa: any, opts: any);
    noa: any;
    _texturePath: any;
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
    registerBlock: (id: any, options?: any) => any;
    /**
     * Register (by name) a material and its parameters.
     *
     * @param name
     * @param color
     * @param textureURL
     * @param texHasAlpha
     * @param renderMaterial an optional BABYLON material to be used for block faces with this block material
     */
    registerMaterial: (name: any, color?: number[], textureURL?: string, texHasAlpha?: boolean, renderMaterial?: any) => any;
    /**
     * block solidity (as in physics)
     * @param id
     */
    getBlockSolidity: (id: any) => boolean;
    /**
     * block opacity - whether it obscures the whole voxel (dirt) or
     * can be partially seen through (like a fencepost, etc)
     * @param id
     */
    getBlockOpacity: (id: any) => boolean;
    /**
     * block is fluid or not
     * @param id
     */
    getBlockFluidity: (id: any) => boolean;
    /**
     * Get block property object passed in at registration
     * @param id
     */
    getBlockProps: (id: any) => any;
    getBlockFaceMaterial: (blockId: any, dir: any) => number;
    getMaterialColor: (matID: any) => any;
    getMaterialTexture: (matID: any) => any;
    getMaterialData: (matID: any) => any;
    _solidityLookup: boolean[];
    _opacityLookup: boolean[];
    _fluidityLookup: boolean[];
    _objectLookup: boolean[];
    _blockMeshLookup: any[];
    _blockHandlerLookup: any[];
    _getMaterialVertexColor: (matID: any) => any;
}
