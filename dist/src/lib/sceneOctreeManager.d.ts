export class SceneOctreeManager {
    /** @internal */
    constructor(rendering: any, blockSize: any);
    rebase: (offset: any) => void;
    includesMesh: (mesh: any) => any;
    addMesh: (mesh: any, isStatic: any, pos: any, chunk: any) => void;
    removeMesh: (mesh: any) => void;
}
