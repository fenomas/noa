export default ObjectMesher;
/** @param {import('../index').Engine} noa*/
declare function ObjectMesher(noa: import('../index').Engine): void;
declare class ObjectMesher {
    /** @param {import('../index').Engine} noa*/
    constructor(noa: import('../index').Engine);
    rootNode: TransformNode;
    initChunk: (chunk: any) => void;
    setObjectBlock: (chunk: any, blockID: any, i: any, j: any, k: any) => void;
    buildObjectMeshes: () => void;
    disposeChunk: (chunk: any) => void;
    tick: () => void;
    _rebaseOrigin: (delta: any) => void;
}
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
