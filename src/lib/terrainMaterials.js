
import { MaterialPluginBase, Texture } from '@babylonjs/core/Materials'

/**
 * @module 
 * @internal exclude this file from API docs 
 * 
 * 
 *      This module creates and manages Materials for terrain meshes. 
 *      It tells the terrain mesher which block face materials can share
 *      the same material (and should thus be joined into a single mesh),
 *      and also creates the materials when needed.
 * 
*/

export class TerrainMatManager {

    /** @param {import('../index').Engine} noa  */
    constructor(noa) {

        // internals
        this.noa = noa
        this._idCounter = 1000
        this._blockMatIDtoTerrainID = {}
        this._terrainIDtoMatObject = {}
        this._texURLtoTerrainID = {}
        this._renderMatToTerrainID = new Map()
    }



    /** 
     * Maps a given `matID` (from noa.registry) to a unique ID of which 
     * terrain material can be used for that block material.
     * This lets the terrain mesher map which blocks can be merged into
     * the same meshes.
     * Internally, this accessor also creates the material for each 
     * terrainMatID as they are first encountered.
     */

    getTerrainMatId(blockMatID) {
        // fast case where matID has been seen before
        if (blockMatID in this._blockMatIDtoTerrainID) {
            return this._blockMatIDtoTerrainID[blockMatID]
        }
        // decide a unique terrainID for this block material
        var terrID = decideTerrainMatID(this, blockMatID)
        // create a mat object for it, if needed
        if (!(terrID in this._terrainIDtoMatObject)) {
            var mat = createTerrainMat(this, blockMatID)
            this._terrainIDtoMatObject[terrID] = mat
        }
        // cache results and done
        this._blockMatIDtoTerrainID[blockMatID] = terrID
        return terrID
    }


    /**
     * Get a Babylon Material object, given a terrainMatID (gotten from this module)
     */
    getMaterial(terrainMatID = 1) {
        return this._terrainIDtoMatObject[terrainMatID]
    }





}




/**
 * 
 * 
 *      Implementations of creating/disambiguating terrain Materials
 * 
 * 
*/

/** 
 * Decide a unique terrainID, based on block material ID properties
 * @param {TerrainMatManager} self 
*/
function decideTerrainMatID(self, blockMatID = 0) {
    var matInfo = self.noa.registry.getMaterialData(blockMatID)

    // custom render materials get one unique terrainID per material
    if (matInfo.renderMat) {
        var mat = matInfo.renderMat
        if (!self._renderMatToTerrainID.has(mat)) {
            self._renderMatToTerrainID.set(mat, self._idCounter++)
        }
        return self._renderMatToTerrainID.get(mat)
    }

    // ditto for textures, unique URL
    if (matInfo.texture) {
        var url = matInfo.texture
        if (!(url in self._texURLtoTerrainID)) {
            self._texURLtoTerrainID[url] = self._idCounter++
        }
        return self._texURLtoTerrainID[url]
    }

    // plain color materials with an alpha value are unique by alpha
    var alpha = matInfo.alpha
    if (alpha > 0 && alpha < 1) return 10 + Math.round(alpha * 100)

    // the only remaining case is the baseline, which always reuses one fixed ID
    return 1
}


/** 
 * Create (choose) a material for a given set of block material properties
 * @param {TerrainMatManager} self 
*/
function createTerrainMat(self, blockMatID = 0) {
    var matInfo = self.noa.registry.getMaterialData(blockMatID)

    // custom render mats are just reused
    if (matInfo.renderMat) return matInfo.renderMat

    // if no texture: use a basic flat material, possibly with alpha
    if (!matInfo.texture) {
        var needsAlpha = (matInfo.alpha > 0 && matInfo.alpha < 1)
        var matName = 'terrain-base-' + blockMatID
        if (needsAlpha) matName += '-alpha'
        var plainMat = self.noa.rendering.makeStandardMaterial(matName)
        if (needsAlpha) plainMat.alpha = matInfo.alpha
        return plainMat
    }

    // remaining case is a new material with a diffuse texture
    var scene = self.noa.rendering.getScene()
    var mat = self.noa.rendering.makeStandardMaterial('terrain-textured-' + blockMatID)
    var url = matInfo.texture
    var tex = new Texture(url, scene, true, false, Texture.NEAREST_SAMPLINGMODE)
    if (matInfo.texHasAlpha) tex.hasAlpha = true
    mat.diffuseTexture = tex
    return mat
}

