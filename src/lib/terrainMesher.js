/** 
 * @module 
 * @internal exclude this file from API docs 
*/

import ndarray from 'ndarray'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData'
import { TerrainMatManager } from './terrainMaterials'
import { copyNdarrayContents } from './util'

export default TerrainMesher




// enable for profiling..
var PROFILE_EVERY = 0




/*
 * 
 *          TERRAIN MESHER!!
 * 
*/


/** @param {import('../index').Engine} noa  */
function TerrainMesher(noa) {

    var terrainMatManager = new TerrainMatManager(noa)
    var greedyMesher = new GreedyMesher(noa, terrainMatManager)
    var meshBuilder = new MeshBuilder(noa, terrainMatManager)

    // internally expose the default flat material used for untextured terrain
    this._defaultMaterial = terrainMatManager._defaultMat

    /*
     * 
     *      public API
     * 
    */


    // add any properties that will get used for meshing
    this.initChunk = function (chunk) {
        chunk._terrainMeshes.length = 0
    }


    /**
     * meshing entry point and high-level flow
     * @param {import('./chunk').default} chunk 
     */
    this.meshChunk = function (chunk, ignoreMaterials = false) {
        profile_hook('start')

        // dispose any previously existing mesh
        chunk._terrainMeshes.forEach(m => m.dispose())
        chunk._terrainMeshes.length = 0
        profile_hook('cleanup')

        // copy voxel data into array padded with neighbor values
        var voxels = buildPaddedVoxelArray(chunk)
        profile_hook('copy')

        // greedy mesher creates big arrays of geometry data
        var edgesOnly = chunk._isFull || chunk._isEmpty
        var geomDataSet = greedyMesher.mesh(voxels, edgesOnly, ignoreMaterials)
        profile_hook('geom')

        // build the babylon meshes that will be added to the scene
        var meshes = meshBuilder.buildMesh(chunk, geomDataSet, ignoreMaterials)
        profile_hook('build')

        profile_hook('end')

        // add to scene and finish
        meshes.forEach((mesh) => {
            noa.rendering.addMeshToScene(mesh, true, chunk.pos, this)
            mesh.cullingStrategy = Mesh.CULLINGSTRATEGY_BOUNDINGSPHERE_ONLY
            chunk._terrainMeshes.push(mesh)
        })
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

/** @param {import('./chunk').default} chunk    */
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
                var nsrc = 0
                if (nab) nsrc = (nab._filledWithVoxel >= 0) ?
                    nab._filledWithVoxel : nab.voxels
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

function GeometryData(terrainID) {
    this.terrainID = terrainID
    this.numQuads = 0                // how many quads meshed so far
    this.quadMaterials = [1]         // list of which matID each quad used
    this.positions = [0.5]           // raw data, 12 positions per quad
    this.indices = [1]               // raw data, 6 indexes per quad
    this.normals = [0.5]             // raw data, 12 normals per quad
    this.colors = [0.5]              // raw data, 16 colors per quad
    this.uvs = [0.5]                 // raw data, 8 uvs per quad
    this.atlasIndices = [0]          // indices into vertical strip texture atlas
}
GeometryData.prototype.dispose = function () {
    this.quadMaterials = null
    this.positions = null
    this.indices = null
    this.normals = null
    this.colors = null
    this.uvs = null
    this.atlasIndices = null
}








/**
 * 
 * 
 * 
 * 
 *       Mesh Builder - consumes all the raw data in geomData to build
 *          Babylon.js mesh/submeshes, ready to be added to the scene
 * 
 * 
 * 
 * 
 * 
 */

/** @param {import('../index').Engine} noa  */
function MeshBuilder(noa, terrainMatManager) {

    // core
    this.buildMesh = function (chunk, geomDataSet, ignoreMaterials) {
        var scene = noa.rendering.getScene()

        // geometry data is already keyed by terrain type, so build
        // one mesh per geomData object in the hash
        var meshes = []
        for (var key in geomDataSet) {
            /** @type {GeometryData} */
            var geomData = geomDataSet[key]

            if (geomData.numQuads === 0) throw '?'

            // the mesh and vertexData object
            var name = `chunk_${chunk.requestID}_${geomData.terrainID}`
            var mesh = new Mesh(name, scene)
            var vdat = new VertexData()
            vdat.positions = geomData.positions
            vdat.indices = geomData.indices
            vdat.normals = geomData.normals
            vdat.colors = geomData.colors
            vdat.uvs = geomData.uvs
            vdat.applyToMesh(mesh)

            if (!ignoreMaterials) {
                // meshes using a texture atlas need atlasIndices
                if (geomData.atlasIndices.length > 1) {
                    mesh.setVerticesData('texAtlasIndices', geomData.atlasIndices, false, 1)
                }

                // materials wrangled by external module
                mesh.material = terrainMatManager.getMaterial(geomData.terrainID)
            }

            // done
            geomData.dispose()
            meshes.push(mesh)
        }

        return meshes
    }

}








/*
 * 
 * 
 * 
 *    Greedy voxel meshing algorithm
 *        based initially on algo by Mikola Lysenko:
 *          http://0fps.net/2012/07/07/meshing-minecraft-part-2/
 *          but evolved quite a bit since then
 *        AO handling by me, stitched together out of cobwebs and dreams
 *    
 *    .mesh() arguments:
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
 * 
 * 
 */

/** @param {import('../index').Engine} noa  */
function GreedyMesher(noa, terrainMatManager) {

    var maskCache = new Int16Array(16)
    var aomaskCache = new Uint16Array(16)
    var realGetTerrainID = terrainMatManager.getTerrainMatId.bind(terrainMatManager)
    var fakeGetTerrainID = (matID) => 1

    this.mesh = function (voxels, edgesOnly, ignoreMaterials) {
        var getTerrainID = (ignoreMaterials) ? fakeGetTerrainID : realGetTerrainID

        // collecion of GeomertryData objects, keyed by terrain ID
        var geomDataSet = {}

        // how to apply AO packing in first masking function
        var revAoVal = noa.rendering.revAoVal
        var skipReverseAO = (revAoVal === noa.rendering.aoVals[0])

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
                constructMeshMasks(i, d, arrT, skipReverseAO)

                // parses the masks to do greedy meshing
                constructGeometryFromMasks(i, d, u, v, len1, len2, geomDataSet, getTerrainID)

                // process edges only by jumping to other edge
                if (edgesOnly) i += (len0 - 1)

            }
        }

        // done!
        return geomDataSet
    }







    //      Greedy meshing inner loop one
    //
    // iterating across ith 2d plane, with n being index into masks

    function constructMeshMasks(i, d, arrT, skipRevAO) {
        var len = arrT.shape[1]
        var mask = maskCache
        var aomask = aomaskCache
        var doAO = noa.rendering.useAO
        var opacityLookup = noa.registry._opacityLookup
        var getMaterial = noa.registry.getBlockFaceMaterial
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

                // no face if both blocks are opaque
                var op0 = opacityLookup[id0]
                var op1 = opacityLookup[id1]
                if (op0 && op1) continue

                // also no face if both block faces have the same block material
                var m0 = getMaterial(id0, materialDir)
                var m1 = getMaterial(id1, materialDir + 1)
                if (m0 === m1) continue

                // choose which block face to draw:
                //   * if either block is opaque draw that one
                //   * if either material is missing draw the other one
                var faceDir = (op0 || m1 === 0) ? 1 :
                    (op1 || m0 === 0) ? -1 : 0

                // set regular mask value to material ID, sign indicating direction
                // also calculate AO level for each face into second mask - 
                //   AO compares i values in direction face is/isn't pointing
                if (faceDir === 1) {
                    mask[n] = m0
                    if (doAO) aomask[n] = packAOMask(arrT, i, i - 1, j, k, skipRevAO)
                } else if (faceDir === -1) {
                    mask[n] = -m1
                    if (doAO) aomask[n] = packAOMask(arrT, i - 1, i, j, k, skipRevAO)
                } else {
                    // leftover case is two different non-opaque blocks facing each other.
                    // Someday we could try to draw both, but for now we draw neither.
                }
            }
        }
    }





    // 
    //      Greedy meshing inner loop two
    //
    // construct geometry data from the masks

    function constructGeometryFromMasks(i, d, u, v, len1, len2, geomDataSet, getTerrainID) {
        var n = 0
        var mask = maskCache
        var aomask = aomaskCache

        var matColorLookup = noa.registry._materialColorLookup
        var matAtlasIndexLookup = noa.registry._matAtlasIndexLookup
        var white = [1, 1, 1]

        var x = [0, 0, 0]
        var du = [0, 0, 0]
        var dv = [0, 0, 0]
        x[d] = i
        var norms = [0, 0, 0]

        var doAO = noa.rendering.useAO
        var aoVals = noa.rendering.aoVals
        var revAoVal = noa.rendering.revAoVal

        // some logic is broken into helper functions for AO and non-AO
        // this used to fix deopts in Chrome..
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

                // terrain ID type, and geometry data for this face
                var matID = Math.abs(maskVal)
                var terrainID = getTerrainID(matID)
                if (!(terrainID in geomDataSet)) {
                    geomDataSet[terrainID] = new GeometryData(terrainID)
                }
                /** @type {GeometryData} */
                var geomData = geomDataSet[terrainID]

                // we're now ready to push a quad worth of geometry data
                var nq = geomData.numQuads

                // if block material is a texture atlas, add indices to it
                var atlasIndex = matAtlasIndexLookup[matID]
                if (atlasIndex >= 0) {
                    addAtlasIndices(geomData.atlasIndices, nq * 4, atlasIndex)
                }

                // add colors into geomData
                // tridir is boolean for which way to split the quad into triangles
                var colorsArr = geomData.colors
                var colorsIndex = nq * 16
                var matColor = matColorLookup[matID] || white
                var triDir = meshColorFcn(colorsArr, colorsIndex, matColor,
                    ao, aoVals, revAoVal)

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

    function addAtlasIndices(indArr, offset, atlasIndex) {
        for (var i = 0; i < 4; i++) {
            indArr[offset + i] = atlasIndex
        }
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

    function pushMeshColors_noAO(colors, ix, col, ao) {
        for (var off = 0; off < 16; off += 4) {
            colors[ix + off] = col[0]
            colors[ix + off + 1] = col[1]
            colors[ix + off + 2] = col[2]
            colors[ix + off + 3] = 1
        }
        return true // triangle direction doesn't matter for non-AO
    }

    function pushMeshColors(colors, ix, col, ao, aoVals, revAo) {
        var ao00 = unpackAOMask(ao, 0, 0)
        var ao10 = unpackAOMask(ao, 1, 0)
        var ao11 = unpackAOMask(ao, 1, 1)
        var ao01 = unpackAOMask(ao, 0, 1)
        pushAOColor(colors, ix, col, ao00, aoVals, revAo)
        pushAOColor(colors, ix + 4, col, ao10, aoVals, revAo)
        pushAOColor(colors, ix + 8, col, ao11, aoVals, revAo)
        pushAOColor(colors, ix + 12, col, ao01, aoVals, revAo)

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
     *
     *
     *
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
     * 
     * 
     */

    function packAOMask(data, ipos, ineg, j, k, skipReverse) {
        var solidLookup = noa.registry._solidityLookup

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
