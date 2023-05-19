
import ndarray from 'ndarray'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData'
import { TerrainMatManager } from './terrainMaterials'
import { makeProfileHook } from './util'



// enable for profiling..
var PROFILE_EVERY = 0




/*
 * 
 *          TERRAIN MESHER!!
 * 
 * 
 *  top-level entry point:
 *      takes a chunk, passes it to the greedy mesher,
 *      gets back an intermediate struct of face data,
 *      passes that to the mesh builder,
 *      gets back an array of Mesh objects,
 *      and finally puts those into the 3D engine
 *      
*/


/** 
 * @internal
 * @param {import('../index').Engine} noa 
*/
export function TerrainMesher(noa) {

    // wrangles which block materials can be merged into the same mesh
    var terrainMatManager = new TerrainMatManager(noa)
    this.allTerrainMaterials = terrainMatManager.allMaterials

    // internally expose the default flat material used for untextured terrain
    this._defaultMaterial = terrainMatManager._defaultMat

    // two-pass implementations for this module
    var greedyMesher = new GreedyMesher(noa, terrainMatManager)
    var meshBuilder = new MeshBuilder(noa, terrainMatManager)


    /*
     * 
     *      API
     * 
    */

    // set or clean up any per-chunk properties needed for terrain meshing
    this.initChunk = function (chunk) {
        chunk._terrainMeshes.length = 0
    }

    this.disposeChunk = function (chunk) {
        chunk._terrainMeshes.forEach(mesh => {
            noa.emit('removingTerrainMesh', mesh)
            mesh.dispose()
        })
        chunk._terrainMeshes.length = 0
    }


    /**
     * meshing entry point and high-level flow
     * @param {import('./chunk').Chunk} chunk 
     */
    this.meshChunk = function (chunk, ignoreMaterials = false) {
        profile_hook('start')

        // remove any previous terrain meshes
        this.disposeChunk(chunk)
        profile_hook('cleanup')

        // greedy mesher generates struct of face data
        var faceDataSet = greedyMesher.mesh(chunk, ignoreMaterials)
        profile_hook('geom')

        // builder generates mesh data (positions, normals, etc)
        var meshes = meshBuilder.buildMesh(chunk, faceDataSet, ignoreMaterials)
        profile_hook('build')

        profile_hook('end')

        // add meshes to scene and finish
        meshes.forEach((mesh) => {
            mesh.cullingStrategy = Mesh.CULLINGSTRATEGY_BOUNDINGSPHERE_ONLY
            noa.rendering.addMeshToScene(mesh, true, chunk.pos, this)
            noa.emit('addingTerrainMesh', mesh)
            mesh.freezeNormals()
            mesh.freezeWorldMatrix()
            chunk._terrainMeshes.push(mesh)
            if (!mesh.metadata) mesh.metadata = {}
            mesh.metadata[terrainMeshFlag] = true
        })
    }
    var terrainMeshFlag = 'noa_chunk_terrain_mesh'

}







/*
 * 
 * 
 * 
 * 
 *      Intermediate struct to hold data for a bunch of merged block faces
 * 
 *      The greedy mesher produces these (one per terrainID), 
 *      and the mesh builder turns each one into a Mesh instance.
 *
 * 
 * 
 * 
 * 
*/

function MeshedFaceData() {
    this.terrainID = 0
    this.numFaces = 0
    // following arrays are all one element per quad
    this.matIDs = []
    this.dirs = []
    this.is = []
    this.js = []
    this.ks = []
    this.wids = []
    this.hts = []
    this.packedAO = []
}















/**
 * 
 * 
 * 
 *      Greedy meshing algorithm
 *      
 *      Originally based on algo by Mikola Lysenko:
 *          http://0fps.net/2012/07/07/meshing-minecraft-part-2/
 *      but probably no code remaining from there anymore.
 *      Ad-hoc AO handling by me, made of cobwebs and dreams
 * 
 *    
 *      Takes in a Chunk instance, and returns an object containing 
 *      GeometryData structs, keyed by terrain material ID, 
 *      which the terrain builder can then make into meshes.
 * 
 * 
 * @param {import('../index').Engine} noa
 * @param {import('./terrainMaterials').TerrainMatManager} terrainMatManager
*/

function GreedyMesher(noa, terrainMatManager) {

    // class-wide cached structs and getters
    var maskCache = new Int16Array(16)
    var aoMaskCache = new Int16Array(16)

    // terrain ID accessor can be overridded for hacky reasons
    var realGetTerrainID = terrainMatManager.getTerrainMatId.bind(terrainMatManager)
    var fakeGetTerrainID = (matID) => 1
    var terrainIDgetter = realGetTerrainID





    /** 
     * Entry point
     * 
     * @param {import('./chunk').Chunk} chunk
     * @returns {Object.<string, MeshedFaceData>} keyed by terrain material ID 
     */
    this.mesh = function (chunk, ignoreMaterials) {
        var cs = chunk.size
        terrainIDgetter = (ignoreMaterials) ? fakeGetTerrainID : realGetTerrainID

        // no internal faces for empty or entirely solid chunks
        var edgesOnly = (chunk._isEmpty || chunk._isFull)

        /** @type {Object.<string, MeshedFaceData>} */
        var faceDataSet = {}
        faceDataPool.reset()

        // Sweep over each axis, mapping axes to [d,u,v]
        for (var d = 0; d < 3; ++d) {
            var u = (d === 2) ? 0 : 2
            var v = (d === 1) ? 0 : 1

            // transposed ndarrays of nearby chunk voxels (self and neighbors)
            var nabVoxelsArr = chunk._neighbors.data.map(c => {
                if (c && c.voxels) return c.voxels.transpose(d, u, v)
                return null
            })

            // ndarray of the previous, similarly transposed
            var nabVoxelsT = ndarray(nabVoxelsArr, [3, 3, 3])
                .lo(1, 1, 1)
                .transpose(d, u, v)

            // embiggen the cached mask arrays if needed
            if (maskCache.length < cs * cs) {
                maskCache = new Int16Array(cs * cs)
                aoMaskCache = new Int16Array(cs * cs)
            }

            // sets up transposed accessor for querying solidity of (i,j,k):
            prepareSolidityLookup(nabVoxelsT, cs)


            // ACTUAL MASK AND GEOMETRY CREATION


            // mesh plane between this chunk and previous neighbor on i axis?
            var prev = nabVoxelsT.get(-1, 0, 0)
            var here = nabVoxelsT.get(0, 0, 0)
            if (prev) {
                // offset version of neighbor to make queries work at i=-1
                var prevOff = prev.lo(cs, 0, 0)
                var nFaces = constructMeshMask(d, prevOff, -1, here, 0)

                if (nFaces > 0) {
                    constructGeometryFromMasks(0, d, u, v, cs, cs, nFaces, faceDataSet)
                }
            }

            // if only doing edges, we're done with this axis
            if (edgesOnly) continue


            // mesh the rest of the planes internal to this chunk
            // note only looping up to (size-1), skipping final coord so as 
            // not to duplicate faces at chunk borders
            for (var i = 0; i < cs - 1; i++) {

                // maybe skip y axis, if both layers are all the same voxel
                if (d === 1) {
                    var v1 = chunk._wholeLayerVoxel[i]
                    if (v1 >= 0 && v1 === chunk._wholeLayerVoxel[i + 1]) {
                        continue
                    }
                }

                // pass in layer array for skip checks, only if not already checked
                var layerVoxRef = (d === 1) ? null : chunk._wholeLayerVoxel

                var nf = constructMeshMask(d, here, i, here, i + 1, layerVoxRef)
                if (nf > 0) {
                    constructGeometryFromMasks(i + 1, d, u, v, cs, cs, nf, faceDataSet)
                }
            }

            // we skip the i-positive neighbor so as not to duplicate edge faces
        }

        // done!
        return faceDataSet
    }






    /**
     * Rigging for a transposed (i,j,k) => boolean solidity lookup, 
     * that knows how to query into neigboring chunks at edges.
     * This sets up the indirection used by `voxelIsSolid` below.
    */
    function prepareSolidityLookup(nabVoxelsT, size) {
        if (solidityLookupInittedSize !== size) {
            solidityLookupInittedSize = size
            voxelIDtoSolidity = noa.registry._solidityLookup

            for (var x = -1; x < size + 1; x++) {
                var loc = (x < 0) ? 0 : (x < size) ? 1 : 2
                coordToLoc[x + 1] = [0, 1, 2][loc]
                edgeCoordLookup[x + 1] = [size - 1, x, 0][loc]
                missingCoordLookup[x + 1] = [0, x, size - 1][loc]
            }
        }

        var centerChunk = nabVoxelsT.get(0, 0, 0)
        for (var i = 0; i < 3; i++) {
            for (var j = 0; j < 3; j++) {
                for (var k = 0; k < 3; k++) {
                    var ix = i * 9 + j * 3 + k
                    var nab = nabVoxelsT.get(i - 1, j - 1, k - 1)
                    var type = 0
                    if (!nab) type = 1
                    if (nab === centerChunk) type = 2
                    voxTypeLookup[ix] = type
                    voxLookup[ix] = nab || centerChunk
                }
            }
        }
    }

    var solidityLookupInittedSize = -1
    var voxelIDtoSolidity = [false, true]
    var voxLookup = Array(27).fill(null)
    var voxTypeLookup = Array(27).fill(0)
    var coordToLoc = [0, 1, 1, 1, 1, 1, 2]
    var edgeCoordLookup = [3, 0, 1, 2, 3, 0]
    var missingCoordLookup = [0, 0, 1, 2, 3, 3]


    function voxelIsSolid(i, j, k) {
        var li = coordToLoc[i + 1]
        var lj = coordToLoc[j + 1]
        var lk = coordToLoc[k + 1]
        var ix = li * 9 + lj * 3 + lk
        var voxArray = voxLookup[ix]
        var type = voxTypeLookup[ix]
        if (type === 2) {
            return voxelIDtoSolidity[voxArray.get(i, j, k)]
        }
        var lookup = [edgeCoordLookup, missingCoordLookup][type]
        var ci = lookup[i + 1]
        var cj = lookup[j + 1]
        var ck = lookup[k + 1]
        return voxelIDtoSolidity[voxArray.get(ci, cj, ck)]
    }








    /**
     * 
     *      Build a 2D array of mask values representing whether a 
     *      mesh face is needed at each position
     * 
     *      Each mask value is a terrain material ID, negative if
     *      the face needs to point in the -i direction (towards voxel arr A)
     * 
     * @returns {number} number of mesh faces found
     */

    function constructMeshMask(d, arrA, iA, arrB, iB, wholeLayerVoxel = null) {
        var len = arrA.shape[1]
        var mask = maskCache
        var aoMask = aoMaskCache
        var doAO = noa.rendering.useAO
        var skipRevAo = (noa.rendering.revAoVal === noa.rendering.aoVals[0])

        var opacityLookup = noa.registry._opacityLookup
        var getMaterial = noa.registry.getBlockFaceMaterial
        var materialDir = d * 2

        // mask is iterated by a simple integer, both here and later when
        // merging meshes, so the j/k order must be the same in both places
        var n = 0

        // set up for quick ndarray traversals
        var indexA = arrA.index(iA, 0, 0)
        var jstrideA = arrA.stride[1]
        var kstrideA = arrA.stride[2]
        var indexB = arrB.index(iB, 0, 0)
        var jstrideB = arrB.stride[1]
        var kstrideB = arrB.stride[2]

        var facesFound = 0

        for (var k = 0; k < len; ++k) {
            var dA = indexA
            var dB = indexB
            indexA += kstrideA
            indexB += kstrideB

            // skip this second axis, if whole layer is same voxel?
            if (wholeLayerVoxel && wholeLayerVoxel[k] >= 0) {
                n += len
                continue
            }

            for (var j = 0; j < len; j++, n++, dA += jstrideA, dB += jstrideB) {

                // mask[n] represents the face needed between the two voxel layers
                // for now, assume we never have two faces in both directions

                // note that mesher zeroes out the mask as it goes, so there's 
                // no need to zero it here when no face is needed

                // IDs at i-1,j,k  and  i,j,k
                var id0 = arrA.data[dA]
                var id1 = arrB.data[dB]

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
                if (op0 || m1 === 0) {
                    mask[n] = m0
                    if (doAO) aoMask[n] = packAOMask(voxelIsSolid, iB, iA, j, k, skipRevAo)
                    facesFound++
                } else if (op1 || m0 === 0) {
                    mask[n] = -m1
                    if (doAO) aoMask[n] = packAOMask(voxelIsSolid, iA, iB, j, k, skipRevAo)
                    facesFound++
                } else {
                    // leftover case is two different non-opaque blocks facing each other.
                    // Someday we could try to draw both, but for now we draw neither.
                }
            }
        }
        return facesFound
    }






    // 
    //      Greedy meshing inner loop two
    //
    // construct geometry data from the masks

    function constructGeometryFromMasks(i, d, u, v, len1, len2, numFaces, faceDataSet) {
        var doAO = noa.rendering.useAO
        var mask = maskCache
        var aomask = aoMaskCache

        var n = 0
        var materialDir = d * 2
        var x = [0, 0, 0]
        x[d] = i

        var maskCompareFcn = (doAO) ? maskCompare : maskCompare_noAO

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

                //  materialID and terrain ID type for the face
                var matID = Math.abs(maskVal)
                var terrainID = terrainIDgetter(matID)

                // if terrainID not seen before, start a new MeshedFaceData
                // from the extremely naive object pool
                if (!(terrainID in faceDataSet)) {
                    var fdFromPool = faceDataPool.get()
                    fdFromPool.numFaces = 0
                    fdFromPool.terrainID = terrainID
                    faceDataSet[terrainID] = fdFromPool
                }

                // pack one face worth of data into the return struct

                var faceData = faceDataSet[terrainID]
                var nf = faceData.numFaces
                faceData.numFaces++

                faceData.matIDs[nf] = matID
                x[u] = j
                x[v] = k
                faceData.is[nf] = x[0]
                faceData.js[nf] = x[1]
                faceData.ks[nf] = x[2]
                faceData.wids[nf] = w
                faceData.hts[nf] = h
                faceData.packedAO[nf] = ao
                faceData.dirs[nf] = (maskVal > 0) ? materialDir : materialDir + 1


                // Face now finished, zero out the used part of the mask
                for (var hx = 0; hx < h; ++hx) {
                    for (var wx = 0; wx < w; ++wx) {
                        mask[n + wx + hx * len1] = 0
                    }
                }

                // exit condition where no more faces are left to mesh
                numFaces -= w * h
                if (numFaces === 0) return
            }
        }
    }

    function maskCompare(index, mask, maskVal, aomask, aoVal) {
        if (maskVal !== mask[index]) return false
        if (aoVal !== aomask[index]) return false
        return true
    }

    function maskCompare_noAO(index, mask, maskVal, aomask, aoVal) {
        if (maskVal !== mask[index]) return false
        return true
    }

}


/**
 * Extremely naive object pool for MeshedFaceData objects
*/
var faceDataPool = (() => {
    var arr = [], ix = 0
    var get = () => {
        if (ix >= arr.length) arr.push(new MeshedFaceData)
        ix++
        return arr[ix - 1]
    }
    var reset = () => { ix = 0 }
    return { get, reset }
})()
















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

    /** 
     * Consume the intermediate FaceData struct and produce
     * actual mesehes the 3D engine can render
     * @param {Object.<string, MeshedFaceData>} faceDataSet  
    */
    this.buildMesh = function (chunk, faceDataSet, ignoreMaterials) {
        var scene = noa.rendering.getScene()

        var doAO = noa.rendering.useAO
        var aoVals = noa.rendering.aoVals
        var revAoVal = noa.rendering.revAoVal

        var atlasIndexLookup = noa.registry._matAtlasIndexLookup
        var matColorLookup = noa.registry._materialColorLookup
        var white = [1, 1, 1]




        // geometry data is already keyed by terrain type, so build
        // one mesh per geomData object in the hash
        var meshes = []
        for (var key in faceDataSet) {
            var faceData = faceDataSet[key]
            var terrainID = faceData.terrainID

            // will this mesh need texture atlas indexes?
            var usesAtlas = false
            if (!ignoreMaterials) {
                var firstIx = atlasIndexLookup[faceData.matIDs[0]]
                usesAtlas = (firstIx >= 0)
            }

            // build the necessary arrays
            var nf = faceData.numFaces
            var indices = new Uint16Array(nf * 6)
            var positions = new Float32Array(nf * 12)
            var normals = new Float32Array(nf * 12)
            var colors = new Float32Array(nf * 16)
            var uvs = new Float32Array(nf * 8)
            var atlasIndexes
            if (usesAtlas) atlasIndexes = new Float32Array(nf * 4)

            // scan all faces in the struct, creating data for each
            for (var f = 0; f < faceData.numFaces; f++) {

                // basic data from struct
                var matID = faceData.matIDs[f]
                var materialDir = faceData.dirs[f]  // 0..5: x,-x, y,-y, z,-z

                var i = faceData.is[f]
                var j = faceData.js[f]
                var k = faceData.ks[f]
                var w = faceData.wids[f]
                var h = faceData.hts[f]
                var axis = (materialDir / 2) | 0
                var dir = (materialDir % 2) ? -1 : 1


                addPositionValues(positions, f, i, j, k, axis, w, h)
                addUVs(uvs, f, axis, w, h, dir)

                var norms = [0, 0, 0]
                norms[axis] = dir
                addNormalValues(normals, f, norms)

                var ao = faceData.packedAO[f]
                var [A, B, C, D] = unpackAOMask(ao)
                var triDir = decideTriDir(A, B, C, D)

                addIndexValues(indices, f, axis, dir, triDir)

                if (usesAtlas) {
                    var atlasIndex = atlasIndexLookup[matID]
                    addAtlasIndices(atlasIndexes, f, atlasIndex)
                }

                var matColor = matColorLookup[matID] || white
                if (doAO) {
                    pushMeshColors(colors, f, matColor, aoVals, revAoVal, A, B, C, D)
                } else {
                    pushMeshColors_noAO(colors, f, matColor)
                }
            }



            // the mesh and vertexData object
            var name = `chunk_${chunk.requestID}_${terrainID}`
            var mesh = new Mesh(name, scene)
            var vdat = new VertexData()

            // finish the mesh
            vdat.positions = positions
            vdat.indices = indices
            vdat.normals = normals
            vdat.colors = colors
            vdat.uvs = uvs
            vdat.applyToMesh(mesh)

            // meshes using a texture atlas need atlasIndices
            if (usesAtlas) {
                mesh.setVerticesData('texAtlasIndices', atlasIndexes, false, 1)
            }

            // disable some unnecessary bounding checks
            mesh.isPickable = false
            mesh.doNotSyncBoundingInfo = true
            mesh._refreshBoundingInfo = () => mesh

            // materials wrangled by external module
            if (!ignoreMaterials) {
                mesh.material = terrainMatManager.getMaterial(terrainID)
            }

            // done
            meshes.push(mesh)
        }

        return meshes
    }




    // HELPERS ---- these could probably be simplified and less magical

    function addPositionValues(posArr, faceNum, i, j, k, axis, w, h) {
        var offset = faceNum * 12

        var loc = [i, j, k]
        var du = [0, 0, 0]
        var dv = [0, 0, 0]
        du[(axis === 2) ? 0 : 2] = w
        dv[(axis === 1) ? 0 : 1] = h

        for (var ix = 0; ix < 3; ix++) {
            posArr[offset + ix] = loc[ix]
            posArr[offset + 3 + ix] = loc[ix] + du[ix]
            posArr[offset + 6 + ix] = loc[ix] + du[ix] + dv[ix]
            posArr[offset + 9 + ix] = loc[ix] + dv[ix]
        }
    }



    function addUVs(uvArr, faceNum, d, w, h, dir) {
        var offset = faceNum * 8
        var epsilon = 0
        for (var i = 0; i < 8; i++) uvArr[offset + i] = epsilon
        if (d === 0) {
            uvArr[offset + 1] = uvArr[offset + 3] = h - epsilon
            uvArr[offset + 2] = uvArr[offset + 4] = dir * w
        } else if (d === 1) {
            uvArr[offset + 1] = uvArr[offset + 7] = w - epsilon
            uvArr[offset + 4] = uvArr[offset + 6] = dir * h
        } else {
            uvArr[offset + 1] = uvArr[offset + 3] = h - epsilon
            uvArr[offset + 2] = uvArr[offset + 4] = -dir * w
        }
    }

    function addNormalValues(normArr, faceNum, norms) {
        var offset = faceNum * 12
        for (var i = 0; i < 12; i++) {
            normArr[offset + i] = norms[i % 3]
        }
    }

    function addIndexValues(indArr, faceNum, axis, dir, triDir) {
        var offset = faceNum * 6
        var baseIndex = faceNum * 4
        if (axis === 0) dir = -dir
        var ix = (dir < 0) ? 0 : 1
        if (!triDir) ix += 2
        var indexVals = indexLists[ix]
        for (var i = 0; i < 6; i++) {
            indArr[offset + i] = baseIndex + indexVals[i]
        }
    }
    var indexLists = [
        [0, 1, 2, 0, 2, 3], // base
        [0, 2, 1, 0, 3, 2], // flipped
        [1, 2, 3, 1, 3, 0], // opposite triDir
        [1, 3, 2, 1, 0, 3], // opposite triDir
    ]




    function addAtlasIndices(indArr, faceNum, atlasIndex) {
        var offset = faceNum * 4
        for (var i = 0; i < 4; i++) {
            indArr[offset + i] = atlasIndex
        }
    }

    function decideTriDir(A, B, C, D) {
        // this bit is pretty magical..
        // (true means split along the a00-a11 axis)
        if (A === C) {
            return (D === B) ? (D === 2) : true
        } else {
            return (D === B) ? false : (A + C > D + B)
        }
    }

    function pushMeshColors_noAO(colors, faceNum, col) {
        var offset = faceNum * 16
        for (var i = 0; i < 16; i += 4) {
            colors[offset + i] = col[0]
            colors[offset + i + 1] = col[1]
            colors[offset + i + 2] = col[2]
            colors[offset + i + 3] = 1
        }
    }

    function pushMeshColors(colors, faceNum, col, aoVals, revAo, A, B, C, D) {
        var offset = faceNum * 16
        pushAOColor(colors, offset, col, A, aoVals, revAo)
        pushAOColor(colors, offset + 4, col, D, aoVals, revAo)
        pushAOColor(colors, offset + 8, col, C, aoVals, revAo)
        pushAOColor(colors, offset + 12, col, B, aoVals, revAo)
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








/*
 *
 *
 *
 *
 *          SHARED HELPERS - used by both main classes
 *
 *
 *
 *
 *
*/




/**
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
 * 
 *      B(2)  -  C(6)   ^  K
 *       -        -     +> J
 *      A(0)  -  D(4)
 * 
*/

function packAOMask(isSolid, ipos, ineg, j, k, skipReverse = false) {
    var A = 1
    var B = 1
    var D = 1
    var C = 1

    // inc occlusion of vertex next to obstructed side
    if (isSolid(ipos, j + 1, k)) { ++D; ++C }
    if (isSolid(ipos, j - 1, k)) { ++A; ++B }
    if (isSolid(ipos, j, k + 1)) { ++B; ++C }
    if (isSolid(ipos, j, k - 1)) { ++A; ++D }

    // facing into a solid (non-opaque) block?
    var facingSolid = isSolid(ipos, j, k)
    if (facingSolid) {
        // always 2, or 3 in corners
        C = (C === 3 || isSolid(ipos, j + 1, k + 1)) ? 3 : 2
        B = (B === 3 || isSolid(ipos, j - 1, k + 1)) ? 3 : 2
        D = (D === 3 || isSolid(ipos, j + 1, k - 1)) ? 3 : 2
        A = (A === 3 || isSolid(ipos, j - 1, k - 1)) ? 3 : 2
        return C << 6 | D << 4 | B << 2 | A
    }

    // simpler logic if skipping reverse AO?
    if (skipReverse) {
        // treat corner as occlusion 3 only if not occluded already
        if (C === 1 && (isSolid(ipos, j + 1, k + 1))) { C = 2 }
        if (B === 1 && (isSolid(ipos, j - 1, k + 1))) { B = 2 }
        if (D === 1 && (isSolid(ipos, j + 1, k - 1))) { D = 2 }
        if (A === 1 && (isSolid(ipos, j - 1, k - 1))) { A = 2 }
        return C << 6 | D << 4 | B << 2 | A
    }

    // check each corner, and if not present do reverse AO
    if (C === 1) {
        if (isSolid(ipos, j + 1, k + 1)) {
            C = 2
        } else if (!(isSolid(ineg, j, k + 1)) ||
            !(isSolid(ineg, j + 1, k)) ||
            !(isSolid(ineg, j + 1, k + 1))) {
            C = 0
        }
    }

    if (D === 1) {
        if (isSolid(ipos, j + 1, k - 1)) {
            D = 2
        } else if (!(isSolid(ineg, j, k - 1)) ||
            !(isSolid(ineg, j + 1, k)) ||
            !(isSolid(ineg, j + 1, k - 1))) {
            D = 0
        }
    }

    if (B === 1) {
        if (isSolid(ipos, j - 1, k + 1)) {
            B = 2
        } else if (!(isSolid(ineg, j, k + 1)) ||
            !(isSolid(ineg, j - 1, k)) ||
            !(isSolid(ineg, j - 1, k + 1))) {
            B = 0
        }
    }

    if (A === 1) {
        if (isSolid(ipos, j - 1, k - 1)) {
            A = 2
        } else if (!(isSolid(ineg, j, k - 1)) ||
            !(isSolid(ineg, j - 1, k)) ||
            !(isSolid(ineg, j - 1, k - 1))) {
            A = 0
        }
    }

    return C << 6 | D << 4 | B << 2 | A
}

/**
 * 
 *      Takes in a packed AO value representing a face,
 *      and returns four 2-bit numbers for the AO levels
 *      at the four corners.
 *      
*/
function unpackAOMask(aomask) {
    var A = aomask & 3
    var B = (aomask >> 2) & 3
    var D = (aomask >> 4) & 3
    var C = (aomask >> 6) & 3
    return [A, B, C, D]
}








var profile_hook = (PROFILE_EVERY) ?
    makeProfileHook(PROFILE_EVERY, 'Meshing') : () => { }

