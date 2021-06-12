export default ObjectMesher;
declare function ObjectMesher(noa: any): void;
declare class ObjectMesher {
    constructor(noa: any);
    rootNode: TransformNode;
    initChunk: (chunk: any) => void;
    setObjectBlock: (chunk: any, blockID: any, i: any, j: any, k: any) => void;
    buildObjectMeshes: () => void;
    disposeChunk: (chunk: any) => void;
    tick: () => void;
    _rebaseOrigin: (delta: any) => void;
}
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
