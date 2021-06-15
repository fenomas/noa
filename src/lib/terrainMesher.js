/** @internal */ /** works around typedoc bug #842 */

import ndarray from 'ndarray'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { SubMesh } from '@babylonjs/core/Meshes/subMesh'
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData'
import { MultiMaterial } from '@babylonjs/core/Materials/multiMaterial'
import { Texture } from '@babylonjs/core/Materials/Textures/texture'

import { copyNdarrayContents } from './util'

export default TerrainMesher




// enable for profiling..
var PROFILE_EVERY = 0




/*
 * 
 *          TERRAIN MESHER!!
 * 
*/


function TerrainMesher(noa) {

    var greedyMesher = new GreedyMesher(noa)
    var meshBuilder = new MeshBuilder(noa)


    /*
     * 
     *      public API
     * 
    */


    // add any properties that will get used for meshing
    this.initChunk = function (chunk) {
        chunk._terrainMeshes = []
    }


    // meshing entry point and high-level flow
    this.meshChunk = function (chunk, matGetter, colGetter, ignoreMaterials, useAO, aoVals, revAoVal) {
        profile_hook('start')

        // dispose any previously existing mesh
        chunk._terrainMeshes.forEach(m => m.dispose())
        chunk._terrainMeshes.length = 0
        profile_hook('cleanup')

        // args
        var mats = matGetter || noa.registry.getBlockFaceMaterial
        var cols = colGetter || noa.registry._getMaterialVertexColor
        var ao = (useAO === undefined) ? noa.rendering.useAO : useAO
        var vals = aoVals || noa.rendering.aoVals
        var rev = isNaN(revAoVal) ? noa.rendering.revAoVal : revAoVal

        // copy voxel data into array padded with neighbor values
        var voxels = buildPaddedVoxelArray(chunk)
        profile_hook('copy')

        // greedy mesher creates big arrays of geometry data
        var edgesOnly = chunk.isFull || chunk.isEmpty
        var geomData = greedyMesher.mesh(voxels, mats, cols, ao, vals, rev, edgesOnly)
        profile_hook('geom')

        // builds the babylon mesh that will be added to the scene
        var mesh = (geomData.numQuads === 0) ? null :
            meshBuilder.build(chunk, geomData, ignoreMaterials)
        profile_hook('build')

        profile_hook('end')

        // add to scene and finish
        if (mesh && mesh.getIndices().length > 0) {
            noa.rendering.addMeshToScene(mesh, true, chunk.pos, this)
            chunk._terrainMeshes.push(mesh)
        }
    }


    // nothing to do on dispose except remove the previous mesh
    this.disposeChunk = function (chunk) {
        chunk._terrainMeshes.forEach(m => m.dispose())
        chunk._terrainMeshes.length = 0
    }



}









/*
 * 
 *      Padded voxel data assembler
 * 
 * Takes the chunk of size n, and copies its data into center of an (n+2) ndarray
 * Then copies in edge data from neighbors, or if not available zeroes it out
 * Actual mesher will then run on the padded ndarray
 * 
*/

function buildPaddedVoxelArray(chunk) {
    var src = chunk.voxels
    var cs = src.shape[0]
    var tgt = cachedPadded

    // embiggen cached target array
    if (cs + 2 !== tgt.shape[0]) {
        var s2 = cs + 2
        tgt = new ndarray(new Uint16Array(s2 * s2 * s2), [s2, s2, s2])
        cachedPadded = tgt
    }

    // loop through neighbors (neighbor(0,0,0) is the chunk itself)
    // copying or zeroing voxel body/edge data into padded target array
    var loc = _vecs[0]
    var pos = _vecs[1]
    var size = _vecs[2]
    var tgtPos = _vecs[3]
    var posValues = _vecs[4]
    var sizeValues = _vecs[5]
    var tgtPosValues = _vecs[6]
    if (cs !== _cachedVecSize) {
        _cachedVecSize = cs
        allocateVectors(cs, posValues, sizeValues, tgtPosValues)
    }

    for (var i = 0; i < 3; i++) {
        loc[0] = i
        for (var j = 0; j < 3; j++) {
            loc[1] = j
            for (var k = 0; k < 3; k++) {
                loc[2] = k
                for (var n = 0; n < 3; n++) {
                    var coord = loc[n]
                    pos[n] = posValues[coord]
                    size[n] = sizeValues[coord]
                    tgtPos[n] = tgtPosValues[coord]
                }
                var nab = chunk._neighbors.get(i - 1, j - 1, k - 1)
                var nsrc = (nab) ? nab.voxels : null
                copyNdarrayContents(nsrc, tgt, pos, size, tgtPos)
            }
        }
    }
    return tgt
}
var cachedPadded = new ndarray(new Uint16Array(27), [3, 3, 3])
var _vecs = Array.from(Array(10), () => [0, 0, 0])
var _cachedVecSize
function allocateVectors(size, posValues, sizeValues, tgtPosValues) {
    for (var i = 0; i < 3; i++) {
        posValues[i] = [size - 1, 0, 0][i]
        sizeValues[i] = [1, size, 1][i]
        tgtPosValues[i] = [0, 1, size + 1][i]
    }
}








/*
 * 
 *  A single reusable struct to hold all geometry data for the chunk 
 *  currently being meshed.
 * 
 *  Basically, the greedy mesher builds this and the mesh builder consumes it
 * 
*/

var cachedGeometryData = {
    numQuads: 0,                // how many quads meshed so far
    materialQuadCounts: {},     // how many quads use each material ID
    quadMaterials: [1],         // list of which matID each quad used
    positions: [0.5],           // raw data, 12 positions per quad
    indices: [1],               // raw data, 6 indexes per quad
    normals: [0.5],             // raw data, 12 normals per quad
    colors: [0.5],              // raw data, 16 colors per quad
    uvs: [0.5],                 // raw data, 8 uvs per quad

    reset: function () {
        this.numQuads = 0
        this.materialQuadCounts = {}
    }
}









/*
 * 
 *  Mesh Builder - consumes all the raw data in geomData to build
 *  Babylon.js mesh/submeshes, ready to be added to the scene
 * 
 */

function MeshBuilder(noa) {

    // core
    this.build = function (chunk, geomData, ignoreMaterials) {
        var nq = geomData.numQuads
        var quadCounts = geomData.materialQuadCounts

        // find any used materials that can share the scene default
        // and move their quad counts to matID 0
        var matLookup = { '0': '0' }
        quadCounts['0'] = 0
        for (var matID in quadCounts) {
            if (matID === '0') continue
            if (ignoreMaterials || canUseDefaultMat(matID)) {
                quadCounts['0'] += quadCounts[matID]
                quadCounts[matID] = 0
                matLookup[matID] = '0'
            } else {
                matLookup[matID] = matID
            }
        }

        // arbitrarily choose a starting offset for quads using each material
        var matOffsets = {}
        var currOffset = 0
        for (var matID2 in quadCounts) {
            if (quadCounts[matID2] === 0) continue
            matOffsets[matID2] = currOffset
            currOffset += quadCounts[matID2]
        }

        // allocate the typed data arrays we'll hand off to Babylon
        var pos = new Float32Array(nq * 12)
        var ind = new Uint16Array(nq * 6)
        var nor = new Float32Array(nq * 12)
        var col = new Float32Array(nq * 16)
        var uvs = new Float32Array(nq * 8)

        // copy data from dataGeom into typed arrays, reordering it as we go
        // so that geometry sharing the same material is contiguous
        for (var ix = 0; ix < nq; ix++) {
            var mergedID = matLookup[geomData.quadMaterials[ix]]
            var off = matOffsets[mergedID]
            // note: indices need a flat offset to point to their original data
            var indexAdjust = (off - ix) * 4
            copyArraySubset(geomData.positions, ix, pos, off, 12, 0)
            copyArraySubset(geomData.indices, ix, ind, off, 6, indexAdjust)
            copyArraySubset(geomData.normals, ix, nor, off, 12, 0)
            copyArraySubset(geomData.colors, ix, col, off, 16, 0)
            copyArraySubset(geomData.uvs, ix, uvs, off, 8, 0)
            matOffsets[mergedID]++
        }

        // build the mesh and vertexData object
        var scene = noa.rendering.getScene()
        var name = 'chunk_' + chunk.requestID
        var mesh = new Mesh(name, scene)
        var vdat = new VertexData()
        vdat.positions = pos
        vdat.indices = ind
        vdat.normals = nor
        vdat.colors = col
        vdat.uvs = uvs
        vdat.applyToMesh(mesh)

        // array of the materialIDs we need, in stable order
        var matIDsUsed = Object.keys(matOffsets).sort((a, b) => (a < b) ? -1 : 1)

        // assign a material or make a multimaterial
        if (matIDsUsed.length === 1) {
            var onlyMatID = matLookup[geomData.quadMaterials[0]]
            mesh.material = getTerrainMaterial(onlyMatID, ignoreMaterials)
        } else {
            // make a multimaterial and define (babylon) submeshes
            mesh.subMeshes = []
            var matNum = 0
            for (var matID4 of matIDsUsed) {
                // note that offsets are currently at END of their respective spans
                var qct = quadCounts[matID4]
                var start = matOffsets[matID4] - qct
                new SubMesh(
                    matNum, // index into multmat
                    start * 12, qct * 12, // vertex start, count - these appear to be used
                    start * 6, qct * 6, // indices start, length
                    mesh)
                matNum++
            }
            mesh.material = getMultiMatForIDs(matIDsUsed, scene)
        }

        // done, mesh will be positioned later when added to the scene
        return mesh
    }

    function canUseDefaultMat(matID) {
        if (noa.registry.getMaterialTexture(matID)) return false
        var matData = noa.registry.getMaterialData(matID)
        return (matData.alpha === 1 && !matData.renderMat)
    }

    function copyArraySubset(src, sbase, tgt, tbase, count, addValue) {
        var soff = sbase * count
        var toff = tbase * count
        for (var i = 0; i < count; i++) {
            tgt[toff + i] = src[soff + i] + addValue
        }
    }









    //                         Material wrangling


    function getMultiMatForIDs(matIDs, scene) {
        var name = 'terrain_multi:' + matIDs.join(',')
        var multiMat = new MultiMaterial('multimat ' + name, scene)
        multiMat.subMaterials = matIDs.map(matID => getTerrainMaterial(matID, false))
        return multiMat
    }

    // manage materials/textures to avoid duplicating them
    function getTerrainMaterial(matID, ignore) {
        if (ignore || matID == 0) return noa.rendering.flatMaterial
        var name = 'terrain_mat:' + matID
        if (!materialCache[name]) {
            materialCache[name] = makeTerrainMaterial(matID, name)
        }
        return materialCache[name]
    }
    var materialCache = {}


    // canonical function to make a terrain material
    function makeTerrainMaterial(id, name) {
        // if user-specified render material is defined, use it
        var matData = noa.registry.getMaterialData(id)
        if (matData.renderMat) return matData.renderMat
        // otherwise determine which built-in material to use
        var url = noa.registry.getMaterialTexture(id)
        var alpha = matData.alpha
        if (!url && alpha === 1) {
            // base material is fine for non-textured case, if no alpha
            return noa.rendering.flatMaterial
        }
        var mat = noa.rendering.makeStandardMaterial(name)
        if (url) {
            var scene = noa.rendering.getScene()
            var tex = new Texture(url, scene, true, false, Texture.NEAREST_SAMPLINGMODE)
            if (matData.textureAlpha) tex.hasAlpha = true
            mat.diffuseTexture = tex
        }
        if (matData.alpha < 1) {
            mat.alpha = matData.alpha
        }
        return mat
    }
}








/*
 *    Greedy voxel meshing algorithm
 *        based initially on algo by Mikola Lysenko:
 *          http://0fps.net/2012/07/07/meshing-minecraft-part-2/
 *          but evolved quite a bit since then
 *        AO handling by me, stitched together out of cobwebs and dreams
 *    
 *    Arguments:
 *        arr: 3D ndarray of dimensions X,Y,Z
 *             packed with solidity/opacity booleans in higher bits
 *        getMaterial: function( blockID, dir )
 *             returns a material ID based on block id and which cube face it is
 *             (assume for now that each mat ID should get its own mesh)
 *        getColor: function( materialID )
 *             looks up a color (3-array) by material ID
 *             TODO: replace this with a lookup array?
 *        doAO: whether or not to bake ambient occlusion into vertex colors
 *        aoValues: array[3] of color multipliers for AO (least to most occluded)
 *        revAoVal: "reverse ao" - color multiplier for unoccluded exposed edges
 *
 *    Return object: array of mesh objects keyed by material ID
 *        arr[id] = {
 *          id:       material id for mesh
 *          vertices: ints, range 0 .. X/Y/Z
 *          indices:  ints
 *          normals:  ints,   -1 .. 1
 *          colors:   floats,  0 .. 1
 *          uvs:      floats,  0 .. X/Y/Z
 *        }
 */

function GreedyMesher(noa) {

    var maskCache = new Int16Array(16)
    var aomaskCache = new Uint16Array(16)

    var solidLookup = noa.registry._solidityLookup
    var opacityLookup = noa.registry._opacityLookup


    this.mesh = function (voxels, getMaterial, getColor, doAO, aoValues, revAoVal, edgesOnly) {
        solidLookup = noa.registry._solidityLookup
        opacityLookup = noa.registry._opacityLookup

        // collected geometry data for the current mesh
        var geomData = cachedGeometryData
        geomData.reset()

        // how to apply AO packing in first masking function
        var skipReverseAO = (revAoVal === aoValues[0])

        //Sweep over each axis, mapping axes to [d,u,v]
        for (var d = 0; d < 3; ++d) {
            var u = (d + 1) % 3
            var v = (d + 2) % 3

            // make transposed ndarray so index i is the axis we're sweeping
            var shape = voxels.shape
            var arrT = voxels.transpose(d, u, v).lo(1, 1, 1).hi(shape[d] - 2, shape[u] - 2, shape[v] - 2)

            // shorten len0 by 1 so faces at edges don't get drawn in both chunks
            var len0 = arrT.shape[0] - 1
            var len1 = arrT.shape[1]
            var len2 = arrT.shape[2]

            // embiggen mask arrays as needed
            if (maskCache.length < len1 * len2) {
                maskCache = new Int16Array(len1 * len2)
                aomaskCache = new Uint16Array(len1 * len2)
            }

            // iterate along current major axis..
            for (var i = 0; i <= len0; ++i) {

                // fills mask and aomask arrays with values
                constructMeshMasks(i, d, arrT, getMaterial, doAO, skipReverseAO)

                // parses the masks to do greedy meshing
                constructGeometryFromMasks(i, d, u, v, len1, len2,
                    doAO, geomData, getColor, aoValues, revAoVal)

                // process edges only by jumping to other edge
                if (edgesOnly) i += (len0 - 1)

            }
        }

        // done!
        return geomData
    }







    //      Greedy meshing inner loop one
    //
    // iterating across ith 2d plane, with n being index into masks

    function constructMeshMasks(i, d, arrT, getMaterial, doAO, skipRevAO) {
        var len = arrT.shape[1]
        var mask = maskCache
        var aomask = aomaskCache
        // set up for quick array traversals
        var n = 0
        var materialDir = d * 2
        var data = arrT.data
        var dbase = arrT.index(i - 1, 0, 0)
        var istride = arrT.stride[0]
        var jstride = arrT.stride[1]
        var kstride = arrT.stride[2]

        for (var k = 0; k < len; ++k) {
            var d0 = dbase
            dbase += kstride
            for (var j = 0; j < len; j++, n++, d0 += jstride) {

                // mask[n] will represent the face needed between i-1,j,k and i,j,k
                // for now, assume we never have two faces in both directions

                // note that mesher zeroes out the mask as it goes, so there's 
                // no need to zero it here when no face is needed

                // IDs at i-1,j,k  and  i,j,k
                var id0 = data[d0]
                var id1 = data[d0 + istride]

                // most common case: never a face between same voxel IDs, 
                // so skip out early
                if (id0 === id1) continue

                var faceDir = getFaceDir(id0, id1, getMaterial, materialDir)
                if (faceDir) {
                    // set regular mask value to material ID, sign indicating direction
                    mask[n] = (faceDir > 0) ?
                        getMaterial(id0, materialDir) :
                        -getMaterial(id1, materialDir + 1)

                    // if doing AO, precalculate AO level for each face into second mask
                    if (doAO) {
                        // i values in direction face is/isn't pointing{
                        aomask[n] = (faceDir > 0) ?
                            packAOMask(arrT, i, i - 1, j, k, skipRevAO) :
                            packAOMask(arrT, i - 1, i, j, k, skipRevAO)
                    }
                }
            }
        }
    }



    function getFaceDir(id0, id1, getMaterial, materialDir) {
        // no face if both blocks are opaque
        var op0 = opacityLookup[id0]
        var op1 = opacityLookup[id1]
        if (op0 && op1) return 0
        // if either block is opaque draw a face for it
        if (op0) return 1
        if (op1) return -1
        // can't tell from block IDs, so compare block materials of each face
        var m0 = getMaterial(id0, materialDir)
        var m1 = getMaterial(id1, materialDir + 1)
        // if same material, draw no face. If one is missing, draw the other
        if (m0 === m1) { return 0 }
        else if (m0 === 0) { return -1 }
        else if (m1 === 0) { return 1 }
        // remaining case is two different non-opaque block materials
        // facing each other. for now, draw neither..
        return 0
    }






    // 
    //      Greedy meshing inner loop two
    //
    // construct geometry data from the masks

    function constructGeometryFromMasks(i, d, u, v, len1, len2,
        doAO, geomData, getColor, aoValues, revAoVal) {
        var n = 0
        var mask = maskCache
        var aomask = aomaskCache

        var x = [0, 0, 0]
        var du = [0, 0, 0]
        var dv = [0, 0, 0]
        x[d] = i
        var norms = [0, 0, 0]

        // some logic is broken into helper functions for AO and non-AO
        // this fixes deopts in Chrome (for reasons unknown)
        var maskCompareFcn = (doAO) ? maskCompare : maskCompare_noAO
        var meshColorFcn = (doAO) ? pushMeshColors : pushMeshColors_noAO

        for (var k = 0; k < len2; ++k) {
            var w = 1
            var h = 1
            for (var j = 0; j < len1; j += w, n += w) {

                var maskVal = mask[n] | 0
                if (!maskVal) {
                    w = 1
                    continue
                }
                var ao = aomask[n] | 0

                // Compute width and height of area with same mask/aomask values
                for (w = 1; w < len1 - j; ++w) {
                    if (!maskCompareFcn(n + w, mask, maskVal, aomask, ao)) break
                }

                OUTER:
                for (h = 1; h < len2 - k; ++h) {
                    for (var m = 0; m < w; ++m) {
                        var ix = n + m + h * len1
                        if (!maskCompareFcn(ix, mask, maskVal, aomask, ao)) break OUTER
                    }
                }

                // for testing: doing the following will disable greediness
                //w=h=1

                // material and mesh for this face
                var matID = Math.abs(maskVal)

                // we're now ready to push a quad worth of geometry data
                var nq = geomData.numQuads
                geomData.quadMaterials[nq] = matID | 0
                geomData.materialQuadCounts[matID] =
                    (geomData.materialQuadCounts[matID] || 0) + 1

                // add colors into geomData
                // tridir is boolean for which way to split the quad into triangles
                var colorsArr = geomData.colors
                var colorsIndex = nq * 16
                var triDir = meshColorFcn(colorsArr, colorsIndex,
                    getColor(matID), ao, aoValues, revAoVal)

                //Add quad positions - vertices = x -> x+du -> x+du+dv -> x+dv
                x[u] = j
                x[v] = k
                du[u] = w
                dv[v] = h
                addPositionValues(geomData.positions, nq * 12, x, du, dv)

                // add uv values, with the order and sign depending on 
                // axis and direction so as to avoid mirror-image textures
                var dir = sign(maskVal)
                addUVs(geomData.uvs, nq * 8, d, w, h, dir)

                // add same normals for all vertices, depending on
                // which direction the mask was solid in..
                norms[d] = dir
                addNormalValues(geomData.normals, nq * 12, norms)

                // Add indexes, ordered clockwise for the facing direction;
                var inds = geomData.indices
                var ioff = nq * 6
                var voff = nq * 4
                addIndexValues(inds, ioff, voff, maskVal, triDir)

                // finished adding  quad geometry data
                geomData.numQuads++

                //Zero-out mask
                for (var hx = 0; hx < h; ++hx) {
                    for (var wx = 0; wx < w; ++wx) {
                        mask[n + wx + hx * len1] = 0
                    }
                }

            }
        }
    }


    // small helpers to add values to raw data geometry arrays:

    function addPositionValues(posArr, offset, x, du, dv) {
        for (var i = 0; i < 3; i++) {
            posArr[offset + i] = x[i]
            posArr[offset + 3 + i] = x[i] + du[i]
            posArr[offset + 6 + i] = x[i] + du[i] + dv[i]
            posArr[offset + 9 + i] = x[i] + dv[i]
        }
    }

    function addUVs(uvArr, offset, d, w, h, dir) {
        for (var i = 0; i < 8; i++) uvArr[offset + i] = 0
        if (d === 2) {
            uvArr[offset + 1] = uvArr[offset + 3] = h
            uvArr[offset + 2] = uvArr[offset + 4] = -dir * w
        } else {
            uvArr[offset + 1] = uvArr[offset + 7] = w
            uvArr[offset + 4] = uvArr[offset + 6] = dir * h
        }
    }

    function addNormalValues(normArr, offset, norms) {
        for (var i = 0; i < 12; i++) {
            normArr[offset + i] = norms[i % 3]
        }
    }

    function addIndexValues(indArr, offset, baseIndex, maskVal, triDir) {
        var indexVals = (maskVal < 0) ?
            (triDir ? indexLists.A : indexLists.B) :
            (triDir ? indexLists.C : indexLists.D)
        for (var i = 0; i < 6; i++) {
            indArr[offset + i] = baseIndex + indexVals[i]
        }
    }
    var indexLists = {
        A: [0, 1, 2, 0, 2, 3],
        B: [1, 2, 3, 0, 1, 3],
        C: [0, 2, 1, 0, 3, 2],
        D: [3, 1, 0, 3, 2, 1],
    }




    // Helper functions with AO and non-AO implementations:

    function maskCompare(index, mask, maskVal, aomask, aoVal) {
        if (maskVal !== mask[index]) return false
        if (aoVal !== aomask[index]) return false
        return true
    }

    function maskCompare_noAO(index, mask, maskVal, aomask, aoVal) {
        if (maskVal !== mask[index]) return false
        return true
    }

    function pushMeshColors_noAO(colors, ix, c, ao, aoValues, revAoVal) {
        for (var off = 0; off < 16; off += 4) {
            colors[ix + off] = c[0]
            colors[ix + off + 1] = c[1]
            colors[ix + off + 2] = c[2]
            colors[ix + off + 3] = 1
        }
        return true // triangle direction doesn't matter for non-AO
    }

    function pushMeshColors(colors, ix, c, ao, aoValues, revAoVal) {
        var ao00 = unpackAOMask(ao, 0, 0)
        var ao10 = unpackAOMask(ao, 1, 0)
        var ao11 = unpackAOMask(ao, 1, 1)
        var ao01 = unpackAOMask(ao, 0, 1)
        pushAOColor(colors, ix, c, ao00, aoValues, revAoVal)
        pushAOColor(colors, ix + 4, c, ao10, aoValues, revAoVal)
        pushAOColor(colors, ix + 8, c, ao11, aoValues, revAoVal)
        pushAOColor(colors, ix + 12, c, ao01, aoValues, revAoVal)

        // this bit is pretty magical..
        var triDir = true
        if (ao00 === ao11) {
            triDir = (ao01 === ao10) ? (ao01 === 2) : true
        } else {
            triDir = (ao01 === ao10) ? false : (ao00 + ao11 > ao01 + ao10)
        }
        return triDir
    }

    function sign(num) {
        return (num > 0) ? 1 : -1
    }




    /* 
     *  packAOMask:
     *
     *    For a given face, find occlusion levels for each vertex, then
     *    pack 4 such (2-bit) values into one Uint8 value
     * 
     *  Occlusion levels:
     *    1 is flat ground, 2 is partial occlusion, 3 is max (corners)
     *    0 is "reverse occlusion" - an unoccluded exposed edge 
     *  Packing order var(bit offset):
     *      a01(2)  -   a11(6)   ^  K
     *        -     -            +> J
     *      a00(0)  -   a10(4)
     */

    function packAOMask(data, ipos, ineg, j, k, skipReverse) {
        var a00 = 1
        var a01 = 1
        var a10 = 1
        var a11 = 1

        // inc occlusion of vertex next to obstructed side
        if (solidLookup[data.get(ipos, j + 1, k)]) { ++a10; ++a11 }
        if (solidLookup[data.get(ipos, j - 1, k)]) { ++a00; ++a01 }
        if (solidLookup[data.get(ipos, j, k + 1)]) { ++a01; ++a11 }
        if (solidLookup[data.get(ipos, j, k - 1)]) { ++a00; ++a10 }

        // facing into a solid (non-opaque) block?
        var facingSolid = solidLookup[data.get(ipos, j, k)]
        if (facingSolid) {
            // always 2, or 3 in corners
            a11 = (a11 === 3 || solidLookup[data.get(ipos, j + 1, k + 1)]) ? 3 : 2
            a01 = (a01 === 3 || solidLookup[data.get(ipos, j - 1, k + 1)]) ? 3 : 2
            a10 = (a10 === 3 || solidLookup[data.get(ipos, j + 1, k - 1)]) ? 3 : 2
            a00 = (a00 === 3 || solidLookup[data.get(ipos, j - 1, k - 1)]) ? 3 : 2
            return a11 << 6 | a10 << 4 | a01 << 2 | a00
        }

        // simpler logic if skipping reverse AO?
        if (skipReverse) {
            // treat corner as occlusion 3 only if not occluded already
            if (a11 === 1 && (solidLookup[data.get(ipos, j + 1, k + 1)])) { a11 = 2 }
            if (a01 === 1 && (solidLookup[data.get(ipos, j - 1, k + 1)])) { a01 = 2 }
            if (a10 === 1 && (solidLookup[data.get(ipos, j + 1, k - 1)])) { a10 = 2 }
            if (a00 === 1 && (solidLookup[data.get(ipos, j - 1, k - 1)])) { a00 = 2 }
            return a11 << 6 | a10 << 4 | a01 << 2 | a00
        }

        // check each corner, and if not present do reverse AO
        if (a11 === 1) {
            if (solidLookup[data.get(ipos, j + 1, k + 1)]) {
                a11 = 2
            } else if (!(solidLookup[data.get(ineg, j, k + 1)]) ||
                !(solidLookup[data.get(ineg, j + 1, k)]) ||
                !(solidLookup[data.get(ineg, j + 1, k + 1)])) {
                a11 = 0
            }
        }

        if (a10 === 1) {
            if (solidLookup[data.get(ipos, j + 1, k - 1)]) {
                a10 = 2
            } else if (!(solidLookup[data.get(ineg, j, k - 1)]) ||
                !(solidLookup[data.get(ineg, j + 1, k)]) ||
                !(solidLookup[data.get(ineg, j + 1, k - 1)])) {
                a10 = 0
            }
        }

        if (a01 === 1) {
            if (solidLookup[data.get(ipos, j - 1, k + 1)]) {
                a01 = 2
            } else if (!(solidLookup[data.get(ineg, j, k + 1)]) ||
                !(solidLookup[data.get(ineg, j - 1, k)]) ||
                !(solidLookup[data.get(ineg, j - 1, k + 1)])) {
                a01 = 0
            }
        }

        if (a00 === 1) {
            if (solidLookup[data.get(ipos, j - 1, k - 1)]) {
                a00 = 2
            } else if (!(solidLookup[data.get(ineg, j, k - 1)]) ||
                !(solidLookup[data.get(ineg, j - 1, k)]) ||
                !(solidLookup[data.get(ineg, j - 1, k - 1)])) {
                a00 = 0
            }
        }

        return a11 << 6 | a10 << 4 | a01 << 2 | a00
    }



    // unpack (2 bit) ao value from ao mask
    // see above for details
    function unpackAOMask(aomask, jpos, kpos) {
        var offset = jpos ? (kpos ? 6 : 4) : (kpos ? 2 : 0)
        return aomask >> offset & 3
    }


    // premultiply vertex colors by value depending on AO level
    // then push them into color array
    function pushAOColor(colors, ix, baseCol, ao, aoVals, revAoVal) {
        var mult = (ao === 0) ? revAoVal : aoVals[ao - 1]
        colors[ix] = baseCol[0] * mult
        colors[ix + 1] = baseCol[1] * mult
        colors[ix + 2] = baseCol[2] * mult
        colors[ix + 3] = 1
    }

}







import { makeProfileHook } from './util'
var profile_hook = (PROFILE_EVERY) ?
    makeProfileHook(PROFILE_EVERY, 'Terrain meshing') : () => { }
