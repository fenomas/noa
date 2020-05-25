export declare class World {
    /**
     * @class
     * @typicalname noa.world
     * @emits worldDataNeeded(id, ndarray, x, y, z, worldName)
     * @emits chunkAdded(chunk)
     * @emits chunkBeingRemoved(id, ndarray, userData)
     * @classdesc Manages the world and its chunks
     *
     * Extends `EventEmitter`
     */
    constructor(noa: any, opts: any);
    noa: any;
    playerChunkLoaded: boolean;
    Chunk: typeof Chunk;
    chunkSize: any;
    chunkAddDistance: any;
    chunkRemoveDistance: any;
    minNeighborsToMesh: number;
    maxChunksPendingCreation: number;
    maxChunksPendingMeshing: number;
    maxProcessingPerTick: number;
    maxProcessingPerRender: number;
    worldGenWhilePaused: any;
    _cachedWorldName: string;
    _lastPlayerChunkID: string;
    _chunkStorage: {};
    _worldCoordToChunkCoord: (coord: any) => number;
    _worldCoordToChunkIndex: (coord: any) => number;
    getBlockID(x: number, y: number, z: number): any;
    getBlockSolidity(x: number, y: number, z: number): boolean;
    getBlockOpacity(x: number, y: number, z: number): any;
    getBlockFluidity(x: number, y: number, z: number): any;
    getBlockProperties(x: number, y: number, z: number): any;
    getBlockObjectMesh(x: number, y: number, z: number): any;
    setBlockID(val: any, x: number, y: number, z: number): void;
    isBoxUnobstructed(box: number): boolean;
    setChunkData(id: number, array: number, userData: any): void;
    invalidateVoxelsInAABB(box: number): void;
    tick(): void;
    render(): void;
    report(): void;
}
import Chunk from "./chunk";
export {};
