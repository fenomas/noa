/** @internal */ /** works around typedoc bug #842 */
export function removeUnorderedListItem(list: any, item: any): void;
export function loopForTime(maxTimeInMS: any, callback: any, startTime: any): void;
export function numberOfVoxelsInSphere(rad: any): number;
export function copyNdarrayContents(src: any, tgt: any, pos: any, size: any, tgtPos: any): void;
export function iterateOverShellAtDistance(d: any, xmax: any, ymax: any, cb: any): any;
export function locationHasher(i: any, j: any, k: any): number;
export function ChunkStorage(): void;
export class ChunkStorage {
    getChunkByIndexes: (i: any, j: any, k: any) => any;
    storeChunkByIndexes: (i: any, j: any, k: any, chunk: any) => void;
    removeChunkByIndexes: (i: any, j: any, k: any) => void;
}
export function LocationQueue(): void;
export class LocationQueue {
    arr: any[];
    hash: {};
    forEach(a: any, b: any): void;
    includes(i: any, j: any, k: any): boolean;
    add(i: any, j: any, k: any): void;
    removeByIndex(ix: any): void;
    remove(i: any, j: any, k: any): void;
    count(): number;
    isEmpty(): boolean;
    empty(): void;
    pop(): any;
    copyFrom(queue: any): void;
    sortByDistance(locToDist: any): void;
}
export function makeProfileHook(every: any, title: any, filter: any): (state: any) => void;
export function makeThroughputHook(_every: any, _title: any, filter: any): (state: any) => void;
