export default TerrainMesher;
declare function TerrainMesher(noa: any): void;
declare class TerrainMesher {
    constructor(noa: any);
    initChunk: (chunk: any) => void;
    meshChunk: (chunk: any, matGetter: any, colGetter: any, ignoreMaterials: any, useAO: any, aoVals: any, revAoVal: any) => void;
    disposeChunk: (chunk: any) => void;
}
