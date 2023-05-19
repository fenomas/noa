/**
 * `noa.rendering` -
 * Manages all rendering, and the BABYLON scene, materials, etc.
 *
 * This module uses the following default options (from the options
 * object passed to the {@link Engine}):
 * ```js
 * {
 *     showFPS: false,
 *     antiAlias: true,
 *     clearColor: [0.8, 0.9, 1],
 *     ambientColor: [0.5, 0.5, 0.5],
 *     lightDiffuse: [1, 1, 1],
 *     lightSpecular: [1, 1, 1],
 *     lightVector: [1, -1, 0.5],
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
    /**
     * @internal
     * @param {import('../index').Engine} noa
    */
    constructor(noa: import('../index').Engine, opts: any, canvas: any);
    /** @internal */
    noa: import("../index").Engine;
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
    /** the Babylon.js Engine object for the scene */
    engine: Engine;
    /** the Babylon.js Scene object for the world */
    scene: Scene;
    /** a Babylon.js DirectionalLight that is added to the scene */
    light: DirectionalLight;
    /** the Babylon.js FreeCamera that renders the scene */
    camera: FreeCamera;
    /**
     * Constructor helper - set up the Babylon.js scene and basic components
     * @internal
     */
    _initScene(canvas: any, opts: any): void;
    /** @internal */
    _octreeManager: SceneOctreeManager;
    /** @internal */
    _cameraHolder: TransformNode;
    /** @internal */
    _camScreen: import("@babylonjs/core/Meshes").Mesh;
    /** @internal */
    _camScreenMat: StandardMaterial;
    /** @internal */
    _camLocBlock: number;
    /** The Babylon `scene` object representing the game world. */
    getScene(): Scene;
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
     * Adds a mesh to the engine's selection/octree logic so that it renders.
     *
     * @param mesh the mesh to add to the scene
     * @param isStatic pass in true if mesh never moves (i.e. never changes chunks)
     * @param pos (optional) global position where the mesh should be
     * @param containingChunk (optional) chunk to which the mesh is statically bound
     */
    addMeshToScene(mesh: any, isStatic?: boolean, pos?: any, containingChunk?: any): void;
    /**
     * Use this to toggle the visibility of a mesh without disposing it or
     * removing it from the scene.
     *
     * @param {import('@babylonjs/core/Meshes').Mesh} mesh
     * @param {boolean} visible
     */
    setMeshVisibility(mesh: import("@babylonjs/core/Meshes").Mesh, visible?: boolean): void;
    /**
     * Create a default standardMaterial:
     * flat, nonspecular, fully reflects diffuse and ambient light
     * @returns {StandardMaterial}
     */
    makeStandardMaterial(name: any): StandardMaterial;
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
import { Engine as Engine_1 } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { SceneOctreeManager } from './sceneOctreeManager';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
