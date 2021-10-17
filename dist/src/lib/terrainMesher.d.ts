export default TerrainMesher;
declare function TerrainMesher(noa: any): void;
declare class TerrainMesher {
    constructor(noa: any);
    initChunk: (chunk: any) => void;
    /**
     * meshing entry point and high-level flow
     * @param {Chunk} chunk
     */
    meshChunk: (chunk: Chunk, matGetter: any, colGetter: any, ignoreMaterials: any, useAO: any, aoVals: any, revAoVal: any) => void;
    disposeChunk: (chunk: any) => void;
}
import Chunk from "./chunk";
