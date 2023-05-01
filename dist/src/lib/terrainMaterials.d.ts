/**
 *
 *
 *      This module creates and manages Materials for terrain meshes.
 *      It tells the terrain mesher which block face materials can share
 *      the same material (and should thus be joined into a single mesh),
 *      and also creates the materials when needed.
 *
 * @internal
*/
export class TerrainMatManager {
    /** @param {import('../index').Engine} noa  */
    constructor(noa: import('../index').Engine);
    _defaultMat: import("@babylonjs/core/Materials/standardMaterial").StandardMaterial;
    allMaterials: import("@babylonjs/core/Materials/standardMaterial").StandardMaterial[];
    noa: import("../index").Engine;
    _idCounter: number;
    _blockMatIDtoTerrainID: {};
    _terrainIDtoMatObject: {};
    _texURLtoTerrainID: {};
    _renderMatToTerrainID: Map<any, any>;
    /**
     * Maps a given `matID` (from noa.registry) to a unique ID of which
     * terrain material can be used for that block material.
     * This lets the terrain mesher map which blocks can be merged into
     * the same meshes.
     * Internally, this accessor also creates the material for each
     * terrainMatID as they are first encountered.
     */
    getTerrainMatId(blockMatID: any): any;
    /**
     * Get a Babylon Material object, given a terrainMatID (gotten from this module)
     */
    getMaterial(terrainMatID?: number): any;
}
