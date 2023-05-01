/**
 * @internal
 * @param {import('../index').Engine} noa
*/
export function ObjectMesher(noa: import('../index').Engine): void;
export class ObjectMesher {
    /**
     * @internal
     * @param {import('../index').Engine} noa
    */
    constructor(noa: import('../index').Engine);
    rootNode: TransformNode;
    allBaseMeshes: any[];
    initChunk: (chunk: any) => void;
    setObjectBlock: (chunk: any, blockID: any, i: any, j: any, k: any) => void;
    buildObjectMeshes: () => void;
    disposeChunk: (chunk: any) => void;
    tick: () => void;
    _rebaseOrigin: (delta: any) => void;
}
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
