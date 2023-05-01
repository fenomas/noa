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
    constructor(noa: import('../index').Engine, opts: any);
    /** @internal */
    noa: import("../index").Engine;
    /** @internal */
    _texturePath: any;
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
    registerBlock: (id?: number, options?: Partial<BlockOptions>) => number;
    /**
     * Register (by name) a material and its parameters.
     *
     * @param {string} name of this material
     * @param {Partial<MaterialOptions>} [options]
     */
    registerMaterial: (name?: string, options?: Partial<MaterialOptions>) => number;
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
    /**
     * General lookup for all properties of a block material
     * @param {number} matID
     * @returns {MatDef}
     */
    getMaterialData: (matID: number) => {
        color: number[];
        alpha: number;
        texture: string;
        texHasAlpha: boolean;
        atlasIndex: number;
        renderMat: any;
    };
    /**
     * Given a texture URL, does any material using that
     * texture need alpha?
     * @internal
     * @returns {boolean}
     */
    _textureNeedsAlpha: (tex?: string) => boolean;
    /** @internal */
    _solidityLookup: boolean[];
    /** @internal */
    _opacityLookup: boolean[];
    /** @internal */
    _fluidityLookup: boolean[];
    /** @internal */
    _objectLookup: boolean[];
    /** @internal */
    _blockMeshLookup: any[];
    /** @internal */
    _blockHandlerLookup: any[];
    /** @internal */
    _blockIsPlainLookup: boolean[];
    /** @internal */
    _materialColorLookup: any[];
    /** @internal */
    _matAtlasIndexLookup: number[];
}
export type TransformNode = import('@babylonjs/core/Meshes').TransformNode;
/**
 * Default options when registering a block type
 */
declare function BlockOptions(isFluid?: boolean): void;
declare class BlockOptions {
    /**
     * Default options when registering a block type
     */
    constructor(isFluid?: boolean);
    /** Solidity for physics purposes */
    solid: boolean;
    /** Whether the block fully obscures neighboring blocks */
    opaque: boolean;
    /** whether a nonsolid block is a fluid (buoyant, viscous..) */
    fluid: boolean;
    /** The block material(s) for this voxel's faces. May be:
     *   * one (String) material name
     *   * array of 2 names: [top/bottom, sides]
     *   * array of 3 names: [top, bottom, sides]
     *   * array of 6 names: [-x, +x, -y, +y, -z, +z]
     * @type {string|string[]}
    */
    material: string | string[];
    /** Specifies a custom mesh for this voxel, instead of terrain  */
    blockMesh: any;
    /** Fluid parameter for fluid blocks */
    fluidDensity: number;
    /** Fluid parameter for fluid blocks */
    viscosity: number;
    /** @type {(x:number, y:number, z:number) => void} */
    onLoad: (x: number, y: number, z: number) => void;
    /** @type {(x:number, y:number, z:number) => void} */
    onUnload: (x: number, y: number, z: number) => void;
    /** @type {(x:number, y:number, z:number) => void} */
    onSet: (x: number, y: number, z: number) => void;
    /** @type {(x:number, y:number, z:number) => void} */
    onUnset: (x: number, y: number, z: number) => void;
    /** @type {(mesh:TransformNode, x:number, y:number, z:number) => void} */
    onCustomMeshCreate: (mesh: TransformNode, x: number, y: number, z: number) => void;
}
/** @typedef {import('@babylonjs/core/Meshes').TransformNode} TransformNode */
/**
 * Default options when registering a Block Material
 */
declare function MaterialOptions(): void;
declare class MaterialOptions {
    /** An array of 0..1 floats, either [R,G,B] or [R,G,B,A]
     * @type {number[]}
     */
    color: number[];
    /** Filename of texture image, if any
     * @type {string}
     */
    textureURL: string;
    /** Whether the texture image has alpha */
    texHasAlpha: boolean;
    /** Index into a (vertical strip) texture atlas, if applicable */
    atlasIndex: number;
    /**
     * An optional Babylon.js `Material`. If specified, terrain for this voxel
     * will be rendered with the supplied material (this can impact performance).
     */
    renderMaterial: any;
}
export {};
