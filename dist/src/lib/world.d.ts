/**
 * `noa.world` - manages world data, chunks, voxels.
 *
 * This module uses the following default options (from the options
 * object passed to the [[Engine]]):
 * ```js
 * var defaultOptions = {
 *   chunkSize: 24,
 *   chunkAddDistance: [2, 2],           // [horizontal, vertical]
 *   chunkRemoveDistance: [3, 3],        // [horizontal, vertical]
 *   worldGenWhilePaused: false,
 *   manuallyControlChunkLoading: false,
 * }
 * ```
*/
export class World extends EventEmitter {
    /** @internal @prop _chunksKnown */
    /** @internal @prop _chunksPending */
    /** @internal @prop _chunksToRequest */
    /** @internal @prop _chunksToRemove */
    /** @internal @prop _chunksToMesh */
    /** @internal @prop _chunksToMeshFirst */
    /** @internal */
    constructor(noa: any, opts: any);
    noa: any;
    playerChunkLoaded: boolean;
    Chunk: typeof Chunk;
    chunkSize: any;
    chunkAddDistance: number[];
    chunkRemoveDistance: number[];
    manuallyControlChunkLoading: boolean;
    minNeighborsToMesh: number;
    maxChunksPendingCreation: number;
    maxChunksPendingMeshing: number;
    maxProcessingPerTick: number;
    maxProcessingPerRender: number;
    worldGenWhilePaused: any;
    _cachedWorldName: string;
    _lastPlayerChunkHash: number;
    _chunkAddSearchDistance: number;
    _chunksKnown: any;
    _chunksPending: any;
    _chunksToRequest: any;
    _chunksToRemove: any;
    _chunksToMesh: any;
    _chunksToMeshFirst: any;
    _storage: ChunkStorage;
    _coordsToChunkIndexes: typeof chunkCoordsToIndexesGeneral;
    _coordsToChunkLocals: typeof chunkCoordsToLocalsGeneral;
    _coordShiftBits: number;
    _coordMask: number;
    getBlockID(x: any, y: any, z: any): any;
    getBlockSolidity(x: any, y: any, z: any): boolean;
    getBlockOpacity(x: any, y: any, z: any): any;
    getBlockFluidity(x: any, y: any, z: any): any;
    getBlockProperties(x: any, y: any, z: any): any;
    setBlockID(val: any, x: any, y: any, z: any): any;
    isBoxUnobstructed(box: any): boolean;
    setChunkData(id: any, array: any, userData: any): void;
    setAddRemoveDistance(addDist?: number, remDist?: number): void;
    invalidateVoxelsInAABB(box: any): void;
    manuallyLoadChunk(x: any, y: any, z: any): void;
    manuallyUnloadChunk(x: any, y: any, z: any): void;
    tick(): void;
    render(): void;
    _getChunkByCoords(x: any, y: any, z: any): any;
    _queueChunkForRemesh(chunk: any): void;
    report(): void;
}
import EventEmitter from "events";
import Chunk from "./chunk";
import { ChunkStorage } from "./util";
declare function chunkCoordsToIndexesGeneral(x: any, y: any, z: any): number[];
declare function chunkCoordsToLocalsGeneral(x: any, y: any, z: any): number[];
export {};
