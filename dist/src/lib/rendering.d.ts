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
    /** @internal @prop _scene */
    /** @internal @prop _engine */
    /** @internal @prop _octree */
    /** @internal @prop _octreeManager */
    /** @internal */
    constructor(noa: any, opts: any, canvas: any);
    noa: any;
    renderOnResize: boolean;
    useAO: boolean;
    aoVals: any;
    revAoVal: any;
    meshingCutoffTime: number;
    _scene: any;
    _engine: any;
    _octree: any;
    _octreeManager: any;
    getScene(): any;
    tick(dt: any): void;
    render(): void;
    postRender(): void;
    resize(): void;
    highlightBlockFace(show: any, posArr: any, normArr: any): void;
    addMeshToScene(mesh: any, isStatic?: boolean, pos?: any, containingChunk?: any): void;
    makeStandardMaterial(name: any): StandardMaterial;
    postMaterialCreationHook(mat: any): void;
    prepareChunkForRendering(chunk: any): void;
    disposeChunkForRendering(chunk: any): void;
    _rebaseOrigin(delta: any): void;
    debug_SceneCheck(): string;
    debug_MeshCount(): void;
}
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
