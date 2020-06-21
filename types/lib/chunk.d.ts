export declare class Chunk {
    constructor(
        noa: any,
        id: string,
        i: any,
        j: any,
        k: any,
        size: any,
        dataArray: number,
        userData: any
    );
    id: string;
    requestID: string;
    noa: any;
    isDisposed: boolean;
    octreeBlock: any;
    voxels: any;
    userData: any;
    i: any;
    j: any;
    k: any;
    size: any;
    x: number;
    y: number;
    z: number;
    _terrainDirty: boolean;
    _objectsDirty: boolean;
    _terrainMesh: any;
    _objectBlocks: any;
    _objectSystems: any;
    isFull: boolean;
    isEmpty: boolean;
    _neighbors: any;
    _neighborCount: number;
    _maxMeshedNeighbors: number;
    _timesMeshed: number;
    _updateVoxelArray(dataArray: number): void;
    get(x: number, y: number, z: number): number;
    getSolidityAt(x: number, y: number, z: number): boolean;
    set(x: number, y: number, z: number, id: number): void;
    mesh(
        matGetter: any,
        colGetter: any,
        useAO: any,
        aoVals: any,
        revAoVal: any
    ): any;
    updateMeshes(): void;
    dispose(): void;
}
