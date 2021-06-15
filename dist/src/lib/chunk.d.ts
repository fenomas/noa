export default Chunk;
declare function Chunk(noa: any, requestID: any, ci: any, cj: any, ck: any, size: any, dataArray: any): void;
declare class Chunk {
    constructor(noa: any, requestID: any, ci: any, cj: any, ck: any, size: any, dataArray: any);
    noa: any;
    isDisposed: boolean;
    requestID: any;
    voxels: any;
    i: any;
    j: any;
    k: any;
    size: any;
    x: number;
    y: number;
    z: number;
    pos: number[];
    _terrainDirty: boolean;
    _objectsDirty: boolean;
    isFull: boolean;
    isEmpty: boolean;
    _neighbors: any;
    _neighborCount: number;
    _timesMeshed: number;
    _updateVoxelArray(dataArray: any): void;
    get(i: any, j: any, k: any): any;
    getSolidityAt(i: any, j: any, k: any): any;
    set(i: any, j: any, k: any, newID: any): void;
    updateMeshes(): void;
    dispose(): void;
}
declare namespace Chunk {
    function _createVoxelArray(size: any): any;
}
