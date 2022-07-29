export default TerrainMesher;
/** @param {import('../index').Engine} noa  */
declare function TerrainMesher(noa: import('../index').Engine): void;
declare class TerrainMesher {
    /** @param {import('../index').Engine} noa  */
    constructor(noa: import('../index').Engine);
    _defaultMaterial: import("@babylonjs/core/Materials/standardMaterial").StandardMaterial;
    initChunk: (chunk: any) => void;
    /**
     * meshing entry point and high-level flow
     * @param {import('./chunk').default} chunk
     */
    meshChunk: (chunk: import('./chunk').default, ignoreMaterials?: boolean) => void;
    disposeChunk: (chunk: any) => void;
}
