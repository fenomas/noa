export default TerrainMesher;
/** @param {import('../index').Engine} noa  */
declare function TerrainMesher(noa: import('../index').Engine): void;
declare class TerrainMesher {
    /** @param {import('../index').Engine} noa  */
    constructor(noa: import('../index').Engine);
    initChunk: (chunk: any) => void;
    /**
     * meshing entry point and high-level flow
     * @param {import('./chunk').default} chunk
     */
    meshChunk: (chunk: import('./chunk').default, matGetter: any, colGetter: any, ignoreMaterials: any, useAO: any, aoVals: any, revAoVal: any) => void;
    disposeChunk: (chunk: any) => void;
}
