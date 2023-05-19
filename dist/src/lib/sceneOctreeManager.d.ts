/** @internal */
export class SceneOctreeManager {
    /** @internal */
    constructor(rendering: any, blockSize: any);
    rebase: (offset: any) => void;
    addMesh: (mesh: any, isStatic: any, pos: any, chunk: any) => void;
    removeMesh: (mesh: any) => void;
    setMeshVisibility: (mesh: any, visible?: boolean) => void;
}
