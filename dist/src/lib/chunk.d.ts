export default Chunk;
/** @param {import('../index').Engine} noa */
declare function Chunk(noa: import('../index').Engine, requestID: any, ci: any, cj: any, ck: any, size: any, dataArray: any, fillVoxelID?: number): void;
declare class Chunk {
    /** @param {import('../index').Engine} noa */
    constructor(noa: import('../index').Engine, requestID: any, ci: any, cj: any, ck: any, size: any, dataArray: any, fillVoxelID?: number);
    noa: import("../index").Engine;
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
    _terrainMeshes: any[];
    _isFull: boolean;
    _isEmpty: boolean;
    _wholeLayerVoxel: any[];
    _neighbors: any;
    _neighborCount: number;
    _timesMeshed: number;
    _blockHandlerLocs: LocationQueue;
    _updateVoxelArray(dataArray: any, fillVoxelID?: number): void;
    get(i: any, j: any, k: any): any;
    getSolidityAt(i: any, j: any, k: any): boolean;
    set(i: any, j: any, k: any, newID: any): void;
    updateMeshes(): void;
    dispose(): void;
}
declare namespace Chunk {
    function _createVoxelArray(size: any): any;
}
import { LocationQueue } from "./util";
