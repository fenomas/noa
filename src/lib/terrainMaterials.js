
import { Engine } from '@babylonjs/core/Engines/engine'
import { Texture } from '@babylonjs/core/Materials/Textures/texture'
import { MaterialPluginBase } from '@babylonjs/core/Materials/materialPluginBase'
import { RawTexture2DArray } from '@babylonjs/core/Materials/Textures/rawTexture2DArray'

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
    constructor(noa) {
        // make a baseline default material for untextured terrain with no alpha
        this._defaultMat = noa.rendering.makeStandardMaterial('base-terrain')
        this._defaultMat.freeze()

        this.allMaterials = [this._defaultMat]

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
            this.allMaterials.push(mat)
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
        if (!needsAlpha) return self._defaultMat
        var matName = 'terrain-alpha-' + blockMatID
        var plainMat = self.noa.rendering.makeStandardMaterial(matName)
        plainMat.alpha = matInfo.alpha
        plainMat.freeze()
        return plainMat
    }

    // remaining case is a new material with a diffuse texture
    var scene = self.noa.rendering.getScene()
    var mat = self.noa.rendering.makeStandardMaterial('terrain-textured-' + blockMatID)
    var texURL = matInfo.texture
    var sampling = Texture.NEAREST_SAMPLINGMODE
    var tex = new Texture(texURL, scene, true, false, sampling)
    if (matInfo.texHasAlpha) tex.hasAlpha = true
    mat.diffuseTexture = tex

    // it texture is an atlas, apply material plugin
    // and check whether any material for the atlas needs alpha
    if (matInfo.atlasIndex >= 0) {
        new TerrainMaterialPlugin(mat, tex)
        if (self.noa.registry._textureNeedsAlpha(matInfo.texture)) {
            tex.hasAlpha = true
        }
    }

    mat.freeze()
    return mat
}











/**
 * 
 *      Babylon material plugin - twiddles the defines/shaders/etc so that
 *      a standard material can use textures from a 2D texture atlas.
 * 
*/

class TerrainMaterialPlugin extends MaterialPluginBase {
    constructor(material, texture) {
        var priority = 200
        var defines = { 'NOA_TWOD_ARRAY_TEXTURE': false }
        super(material, 'TestPlugin', priority, defines)
        this._enable(true)
        this._atlasTextureArray = null

        texture.onLoadObservable.add((tex) => {
            this.setTextureArrayData(tex)
        })
    }

    setTextureArrayData(texture) {
        var { width, height } = texture.getSize()
        var numLayers = Math.round(height / width)
        height = width
        var data = texture._readPixelsSync()

        var format = Engine.TEXTUREFORMAT_RGBA
        var genMipMaps = true
        var invertY = false
        var mode = Texture.NEAREST_SAMPLINGMODE
        var scene = texture.getScene()

        this._atlasTextureArray = new RawTexture2DArray(
            data, width, height, numLayers,
            format, scene, genMipMaps, invertY, mode,
        )
    }

    prepareDefines(defines, scene, mesh) {
        defines['NOA_TWOD_ARRAY_TEXTURE'] = true
    }

    getClassName() {
        return 'TerrainMaterialPluginName'
    }

    getSamplers(samplers) {
        samplers.push('atlasTexture')
    }

    getAttributes(attributes) {
        attributes.push('texAtlasIndices')
    }

    getUniforms() {
        return { ubo: [] }
    }

    bindForSubMesh(uniformBuffer, scene, engine, subMesh) {
        if (this._atlasTextureArray) {
            uniformBuffer.setTexture('atlasTexture', this._atlasTextureArray)
        }
    }

    getCustomCode(shaderType) {
        if (shaderType === 'vertex') return {
            'CUSTOM_VERTEX_MAIN_BEGIN': `
                texAtlasIndex = texAtlasIndices;
            `,
            'CUSTOM_VERTEX_DEFINITIONS': `
                uniform highp sampler2DArray atlasTexture;
                attribute float texAtlasIndices;
                varying float texAtlasIndex;
            `,
        }
        if (shaderType === 'fragment') return {
            '!baseColor\\=texture2D\\(diffuseSampler,vDiffuseUV\\+uvOffset\\);':
                `baseColor = texture(atlasTexture, vec3(vDiffuseUV, texAtlasIndex));`,
            'CUSTOM_FRAGMENT_DEFINITIONS': `
                uniform highp sampler2DArray atlasTexture;
                varying float texAtlasIndex;
            `,
        }
        return null
    }
}
