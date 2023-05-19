export function removeUnorderedListItem(list: any, item: any): void;
export function numberOfVoxelsInSphere(rad: any): number;
export function copyNdarrayContents(src: any, tgt: any, pos: any, size: any, tgtPos: any): void;
export function iterateOverShellAtDistance(d: any, xmax: any, ymax: any, cb: any): any;
export function locationHasher(i: any, j: any, k: any): number;
export function makeProfileHook(every: any, title: string, filter: any): (state: any) => void;
export function makeThroughputHook(_every: any, _title: any, filter: any): (state: any) => void;
/** @internal */
export class ChunkStorage {
    hash: {};
    /** @returns {import('./chunk').Chunk} */
    getChunkByIndexes(i?: number, j?: number, k?: number): import('./chunk').Chunk;
    /** @param {import('./chunk').Chunk} chunk */
    storeChunkByIndexes(i: number, j: number, k: number, chunk: import('./chunk').Chunk): void;
    removeChunkByIndexes(i?: number, j?: number, k?: number): void;
}
/** @internal */
export class LocationQueue {
    arr: any[];
    hash: {};
    forEach(cb: any, thisArg: any): void;
    includes(i: any, j: any, k: any): boolean;
    add(i: any, j: any, k: any, toFront?: boolean): void;
    removeByIndex(ix: any): void;
    remove(i: any, j: any, k: any): void;
    count(): number;
    isEmpty(): boolean;
    empty(): void;
    pop(): any;
    copyFrom(queue: any): void;
    sortByDistance(locToDist: any, reverse?: boolean): void;
}
