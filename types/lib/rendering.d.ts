export declare class Rendering {
    /**
     * @class
     * @typicalname noa.rendering
     * @classdesc Manages all rendering, and the BABYLON scene, materials, etc.
     */
    constructor(noa: any, opts: RenderingOptions, canvas: any);
    noa: any;
    useAO: boolean;
    aoVals: any;
    revAoVal: any;
    meshingCutoffTime: number;
    _resizeDebounce: number;
    getScene(): any;
    tick(dt: any): void;
    render(dt: any): void;
    resize(e: any): void;
    highlightBlockFace(show: any, posArr: any, normArr: any): void;
    addMeshToScene(
        mesh: any,
        isStatic: any,
        pos: any,
        _containingChunk: any
    ): void;
    removeMeshFromScene(mesh: any): void;
    makeStandardMaterial(name: any): any;
    prepareChunkForRendering(chunk: any): void;
    disposeChunkForRendering(chunk: any): void;
    _rebaseOrigin(delta: any): void;
    debug_SceneCheck(): string;
    debug_MeshCount(): void;
}

type ColorNumbers = number[];

export type RenderingOptions = {
    showFPS: boolean;
    antiAlias: boolean;
    clearColor: ColorNumbers;
    ambientColor: ColorNumbers;
    lightDiffuse: ColorNumbers;
    lightSpecular: ColorNumbers;
    groundLightColor: ColorNumbers;
    useAO: boolean;
    AOmultipliers: number[];
    reverseAOmultiplier: number;
    preserveDrawingBuffer: boolean;
};
