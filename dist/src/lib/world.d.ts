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
    /** @internal */
    constructor(noa: any, opts: any);
    /** @internal */
    noa: any;
    /** @internal */
    playerChunkLoaded: boolean;
    /** @internal */
    Chunk: typeof Chunk;
    /**
     * Game clients should set this if they need to manually control
     * which chunks to load and unload. When set, client should call
     * `noa.world.manuallyLoadChunk` / `manuallyUnloadChunk` as needed.
     */
    manuallyControlChunkLoading: boolean;
    /**
     * Defining this function sets a custom order in which to create chunks.
     * The function should look like:
     * ```js
     *   (i, j, k) => 1 // return a smaller number for chunks to process first
     * ```
     */
    chunkSortingDistFn: (i: any, j: any, k: any) => number;
    /**
     * Set this higher to cause chunks not to mesh until they have some neighbors.
     * Max legal value is 26 (each chunk will mesh only when all neighbors are present)
     */
    minNeighborsToMesh: number;
    /** When true, worldgen queues will keep running if engine is paused. */
    worldGenWhilePaused: boolean;
    /** Limit the size of internal chunk processing queues
     * @type {number}
    */
    maxChunksPendingCreation: number;
    /** Limit the size of internal chunk processing queues
     * @type {number}
    */
    maxChunksPendingMeshing: number;
    /** Cutoff (in ms) of time spent each **tick**
     * @type {number}
    */
    maxProcessingPerTick: number;
    /** Cutoff (in ms) of time spent each **render**
     * @type {number}
    */
    maxProcessingPerRender: number;
    /** @internal */
    _chunkSize: any;
    /** @internal */
    _chunkAddDistance: number[];
    /** @internal */
    _chunkRemoveDistance: number[];
    /** @internal */
    _addDistanceFn: (i: any, j: any, k: any) => boolean;
    /** @internal */
    _remDistanceFn: (i: any, j: any, k: any) => boolean;
    /** @internal */
    _prevWorldName: string;
    /** @internal */
    _prevPlayerChunkHash: number;
    /** @internal */
    _chunkAddSearchFrom: number;
    /** @internal */
    _prevSortingFn: any;
    /** @internal */
    _chunksKnown: any;
    /** @internal */
    _chunksPending: any;
    /** @internal */
    _chunksToRequest: any;
    /** @internal */
    _chunksToRemove: any;
    /** @internal */
    _chunksToMesh: any;
    /** @internal */
    _chunksToMeshFirst: any;
    /** @internal */
    _chunksSortedLocs: any;
    /** @internal */
    _storage: ChunkStorage;
    /** @internal */
    _coordsToChunkIndexes: typeof chunkCoordsToIndexesGeneral;
    /** @internal */
    _coordsToChunkLocals: typeof chunkCoordsToLocalsGeneral;
    /** @internal */
    _coordShiftBits: number;
    /** @internal */
    _coordMask: number;
    /** @param x,y,z */
    getBlockID(x: any, y: any, z: any): any;
    /** @param x,y,z */
    getBlockSolidity(x: any, y: any, z: any): boolean;
    /** @param x,y,z */
    getBlockOpacity(x: any, y: any, z: any): any;
    /** @param x,y,z */
    getBlockFluidity(x: any, y: any, z: any): any;
    /** @param x,y,z */
    getBlockProperties(x: any, y: any, z: any): any;
    /** @param val,x,y,z */
    setBlockID(val: any, x: any, y: any, z: any): any;
    /** @param box */
    isBoxUnobstructed(box: any): boolean;
    /** client should call this after creating a chunk's worth of data (as an ndarray)
     * If userData is passed in it will be attached to the chunk
     * @param id
     * @param array
     * @param userData
     */
    setChunkData(id: any, array: any, userData: any): void;
    /**
     * Sets the distances within which to load new chunks, and beyond which
     * to unload them. Generally you want the remove distance to be somewhat
     * farther, so that moving back and forth across the same chunk border doesn't
     * keep loading/unloading the same distant chunks.
     *
     * Both arguments can be numbers (number of voxels), or arrays like:
     * `[horiz, vert]` specifying different horizontal and vertical distances.
     * @param {number | number[]} addDist
     * @param {number | number[]} remDist
     */
    setAddRemoveDistance(addDist?: number | number[], remDist?: number | number[]): void;
    /** Tells noa to discard voxel data within a given `AABB` (e.g. because
     * the game client received updated data from a server).
     * The engine will mark all affected chunks for disposal, and will later emit
     * new `worldDataNeeded` events (if the chunk is still in draw range).
     * Note that chunks invalidated this way will not emit a `chunkBeingRemoved` event
     * for the client to save data from.
     */
    invalidateVoxelsInAABB(box: any): void;
    /** When manually controlling chunk loading, tells the engine that the
     * chunk containing the specified (x,y,z) needs to be created and loaded.
     * > Note: has no effect when `noa.world.manuallyControlChunkLoading` is not set.
     * @param x, y, z
     */
    manuallyLoadChunk(x: any, y: any, z: any): void;
    /** When manually controlling chunk loading, tells the engine that the
     * chunk containing the specified (x,y,z) needs to be unloaded and disposed.
     * > Note: has no effect when `noa.world.manuallyControlChunkLoading` is not set.
     * @param x, y, z
     */
    manuallyUnloadChunk(x: any, y: any, z: any): void;
    /** @internal */
    tick(): void;
    /** @internal */
    render(): void;
    /** @internal */
    _getChunkByCoords(x: any, y: any, z: any): any;
    _queueChunkForRemesh(chunk: any): void;
    /** @internal */
    report(): void;
}
import EventEmitter from "events";
import Chunk from "./chunk";
import { ChunkStorage } from "./util";
declare function chunkCoordsToIndexesGeneral(x: any, y: any, z: any): number[];
declare function chunkCoordsToLocalsGeneral(x: any, y: any, z: any): number[];
export {};
