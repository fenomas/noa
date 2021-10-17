/**
 * `noa.rendering` -
 * Manages all rendering, and the BABYLON scene, materials, etc.
 *
 * This module uses the following default options (from the options
 * object passed to the [[Engine]]):
 * ```js
 * {
 *     showFPS: false,
 *     antiAlias: true,
 *     clearColor: [0.8, 0.9, 1],
 *     ambientColor: [1, 1, 1],
 *     lightDiffuse: [1, 1, 1],
 *     lightSpecular: [1, 1, 1],
 *     groundLightColor: [0.5, 0.5, 0.5],
 *     useAO: true,
 *     AOmultipliers: [0.93, 0.8, 0.5],
 *     reverseAOmultiplier: 1.0,
 *     preserveDrawingBuffer: true,
 *     octreeBlockSize: 2,
 *     renderOnResize: true,
 * }
 * ```
*/
export class Rendering {
    /** @internal */
    constructor(noa: any, opts: any, canvas: any);
    /** @internal */
    noa: any;
    /** Whether to redraw the screen when the game is resized while paused */
    renderOnResize: boolean;
    /** @internal */
    useAO: boolean;
    /** @internal */
    aoVals: any;
    /** @internal */
    revAoVal: any;
    /** @internal */
    meshingCutoffTime: number;
    /** @internal */
    _scene: any;
    /** @internal */
    _engine: any;
    /** @internal */
    _octreeManager: any;
    /** The Babylon `scene` object representing the game world. */
    getScene(): any;
    /** @internal */
    tick(dt: any): void;
    /** @internal */
    render(): void;
    /** @internal */
    postRender(): void;
    /** @internal */
    resize(): void;
    /** @internal */
    highlightBlockFace(show: any, posArr: any, normArr: any): void;
    /**
     * Add a mesh to the scene's octree setup so that it renders.
     *
     * @param mesh the mesh to add to the scene
     * @param isStatic pass in true if mesh never moves (i.e. change octree blocks)
     * @param pos (optional) global position where the mesh should be
     * @param containingChunk (optional) chunk to which the mesh is statically bound
     */
    addMeshToScene(mesh: any, isStatic?: boolean, pos?: any, containingChunk?: any): void;
    /**
     * Create a default standardMaterial:
     * flat, nonspecular, fully reflects diffuse and ambient light
     */
    makeStandardMaterial(name: any): StandardMaterial;
    /** Exposed hook for if the client wants to do something to newly created materials */
    postMaterialCreationHook(mat: any): void;
    /** @internal */
    prepareChunkForRendering(chunk: any): void;
    /** @internal */
    disposeChunkForRendering(chunk: any): void;
    /** @internal */
    _rebaseOrigin(delta: any): void;
    /** @internal */
    debug_SceneCheck(): string;
    /** @internal */
    debug_MeshCount(): void;
}
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
