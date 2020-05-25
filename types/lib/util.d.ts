export function removeUnorderedListItem(list: any, item: any): void;
export function loopForTime(
    maxTimeInMS: any,
    callback: any,
    startTime: any
): void;
export function numberOfVoxelsInSphere(rad: any): number;
export function copyNdarrayContents(
    src: any,
    tgt: any,
    pos: any,
    size: any,
    tgtPos: any
): void;
export function StringList(): void;
export class StringList {
    arr: any[];
    hash: {};
    includes(key: number): any;
    add(key: number): void;
    remove(key: number): void;
    count(): number;
    forEach(a: any, b: any): void;
    slice(a: any, b: any): any[];
    isEmpty(): boolean;
    empty(): void;
    pop(): any;
    sort(keyToDistanceFn: any): void;
    copyFrom(list: any): void;
}
export function makeProfileHook(
    _every: number,
    _title: any
): (state: any) => void;
export function makeThroughputHook(
    _every: number,
    _title: any
): (state: any) => void;
