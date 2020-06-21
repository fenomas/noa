export declare class ObjectMesher {
    initChunk: (chunk: any) => void;
    disposeChunk: (chunk: any) => void;
    addObjectBlock: (
        chunk: any,
        id: number,
        x: number,
        y: number,
        z: number
    ) => void;
    removeObjectBlock: (chunk: any, x: number, y: number, z: number) => void;
    removeObjectMeshes: (chunk: any) => void;
    buildObjectMeshes: (chunk: any) => any[];
}
