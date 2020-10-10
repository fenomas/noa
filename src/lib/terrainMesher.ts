import ndarray from 'ndarray'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { SubMesh } from '@babylonjs/core/Meshes/subMesh'
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData'
import { MultiMaterial } from '@babylonjs/core/Materials/multiMaterial'
import { Texture } from '@babylonjs/core/Materials/Textures/texture'
// import '@babylonjs/core/Meshes/meshBuilder'
import { copyNdarrayContents } from './util'


// enable for profiling..
var PROFILE_EVERY = 0 // 100


/**
 * Padded voxel data assembler
 * 
 * Takes the chunk of size n, and copies its data into center of an (n+2) ndarray
 * Then copies in edge data from neighbors, or if not available zeroes it out
 * Actual mesher will then run on the padded ndarray
 */
export class TerrainMesher {
    constructor(noa: Engine) {
        this.noa = noa;
        this.greedyMesher = new GreedyMesher(noa)
        this.meshBuilder = new MeshBuilder(noa)
    }

    noa: Engine;
    greedyMesher: GreedyMesher
    meshBuilder: MeshBuilder

    meshChunk = (
        chunk: Chunk,
        matGetter?: (blockId: number, dir: number) => number[],
        colGetter?: (matID: number) => [number, number, number],
        ignoreMaterials?: boolean,
        useAO?: boolean | undefined,
        aoVals?: [number, number, number] | undefined,
        revAoVal?: number
    ) => {
        profile_hook('start')

        // args
        const mats = matGetter ?? this.noa.registry.getBlockFaceMaterial
        const cols = colGetter ?? this.noa.registry._getMaterialVertexColor
        const ignoreMaterialsDefault = ignoreMaterials ?? false
        const ao = useAO ?? this.noa.rendering.useAO
        const vals = aoVals ?? this.noa.rendering.aoVals
        const rev = isNaN(revAoVal!) ? this.noa.rendering.revAoVal : revAoVal

        // copy voxel data into array padded with neighbor values
        const voxels = buildPaddedVoxelArray(chunk)
        profile_hook('copy')

        // greedy mesher creates an array of Submesh structs
        const edgesOnly = chunk.isFull || chunk.isEmpty
        const subMeshes = this.greedyMesher.mesh(voxels, mats, cols, ao, vals, rev, edgesOnly)

        // builds the babylon mesh that will be added to the scene
        let mesh
        if (subMeshes.length) {
            mesh = this.meshBuilder.build(chunk, subMeshes, ignoreMaterialsDefault)
            profile_hook('terrain')
        }

        profile_hook('end')
        return mesh || null
    }
}


function buildPaddedVoxelArray(chunk: Chunk) {
    var src = chunk.voxels
    var cs = src.shape[0]
    var tgt = cachedPadded

    // embiggen cached target array
    if (cs + 2 !== tgt.shape[0]) {
        var s2 = cs + 2
        tgt = ndarray(new Uint16Array(s2 * s2 * s2), [s2, s2, s2])
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
                copyNdarrayContents(nsrc, tgt, pos as [number, number, number], size as [number, number, number], tgtPos as [number, number, number])
            }
        }
    }

    return tgt
}

var cachedPadded = ndarray(new Uint16Array(27), [3, 3, 3])
var _vecs = Array.from(Array(10)).map(n => [0, 0, 0])
var _cachedVecSize: any
function allocateVectors(size: number, posValues: number[], sizeValues: any[], tgtPosValues: any[]) {
    for (var i = 0; i < 3; i++) {
        posValues[i] = [size - 1, 0, 0][i]
        sizeValues[i] = [1, size, 1][i]
        tgtPosValues[i] = [0, 1, size + 1][i]
    }
}


/**
 * Submesh - holds one submesh worth of greedy-meshed data
 * Basically, the greedy mesher builds these and the mesh builder consumes them
 */
export class Submesh {
    // todo fix
    constructor (id: number) {
        this.id = id | 0
    }
    
    id: number
    positions: number[] = []
    indices: any[] = []
    normals: number[] = []
    colors: number[] = []
    uvs: number[] = []
    
    /** flag used during terrain meshing */
    mergeable: boolean = false
    renderMat: any

    dispose = () => {
        this.positions = null as any
        this.indices = null as any
        this.normals = null as any
        this.colors = null as any
        this.uvs = null as any
    }
}



/**
 * Mesh Builder - turns an array of Submesh data into a 
 * Babylon.js mesh/submeshes, ready to be added to the scene
 */
class MeshBuilder {
    constructor(noa: Engine) {
        this.noa = noa;
    }

    noa: Engine;

    // Material wrangling
    materialCache: { [key: string]: any } = {}

    build(chunk: Chunk, meshDataList: Submesh[], ignoreMaterials: boolean) {
        // flag and merge submesh data that can share the default terrain material
        let numMergeable = 0

        for (let i = 0; i < meshDataList.length; i++) {
            const mdat = meshDataList[i]
            if (ignoreMaterials) {
                mdat.mergeable = true
            }
            else {
                const url = this.noa.registry.getMaterialTexture(mdat.id)
                const matData = this.noa.registry.getMaterialData(mdat.id)
                mdat.mergeable = (!url)
                    && (matData.alpha === 1)
                    && (!matData.renderMat)
            }
            if (mdat.mergeable) {
                numMergeable++
            }
        }

        if (numMergeable > 1) {
            this.mergeSubmeshes(meshDataList, false)
        }

        // now merge everything, keeping track of vertices/indices/materials
        const results = this.mergeSubmeshes(meshDataList, true)

        // merge sole remaining submesh instance into a babylon mesh
        const merged = meshDataList[0]
        const name = `chunk_${chunk.id}`
        const mats = results.matIDs.map(id => this.getTerrainMaterial(id, ignoreMaterials))
        const mesh = this.buildMeshFromSubmesh(merged, name, mats, results.vertices, results.indices)

        // done, mesh will be positioned later when added to the scene
        return mesh
    }
        
    /**
     * given a set of submesh objects, merge some or all of them while tracking vertex/index offsets for each material ID
     * Note: modifies meshDataList in place!
     */
    mergeSubmeshes(meshDataList: Submesh[], mergeAll: boolean) {
        let vertices = []
        let indices = []
        let matIDs = []

        let target = null
        for (var i = 0; i < meshDataList.length; ++i) {
            var mdat = meshDataList[i]
            if (!(mergeAll || mdat.mergeable)) continue

            vertices.push(mdat.positions.length)
            indices.push(mdat.indices.length)
            matIDs.push(mdat.id)

            if (!target) {
                target = mdat
            }
            else {
                let indexOffset = target.positions.length / 3
                // merge data in "mdat" onto "target"
                mergeArrays(target.positions, mdat.positions)
                mergeArrays(target.normals, mdat.normals)
                mergeArrays(target.colors, mdat.colors)
                mergeArrays(target.uvs, mdat.uvs)

                // indices must be offset relative to data being merged onto
                for (let j = 0, len = mdat.indices.length; j < len; ++j) {
                    target.indices.push(mdat.indices[j] + indexOffset)
                }

                // get rid of entry that's been merged
                meshDataList.splice(i, 1)
                mdat.dispose()
                i--
            }
        }

        function mergeArrays(tgt: number[], src: number[]) {
            for (var i = 0; i < src.length; i++) {
                tgt.push(src[i])
            }
        }

        return {
            vertices: vertices,
            indices: indices,
            matIDs: matIDs,
        }
    }


    buildMeshFromSubmesh(submesh: Submesh, name: string, mats: Nullable<Material>[], verts: any[], inds: any[]) {
        // base mesh and vertexData object
        const scene = this.noa.rendering.getScene()
        const mesh = new Mesh(name, scene)
        const vdat = new VertexData()
        vdat.positions = submesh.positions
        vdat.indices = submesh.indices
        vdat.normals = submesh.normals
        vdat.colors = submesh.colors
        vdat.uvs = submesh.uvs
        vdat.applyToMesh(mesh)
        submesh.dispose()

        if (mats.length === 1) {
            // if only one material ID, assign as a regular mesh and return
            mesh.material = mats[0]
        }
        else {
            // else we need to make a multimaterial and define (babylon) submeshes
            var multiMat = new MultiMaterial('multimat ' + name, scene)
            mesh.subMeshes = []
            // var totalVerts = vdat.positions.length
            // var totalInds = vdat.indices.length
            var vertStart = 0
            var indStart = 0
            for (var i = 0; i < mats.length; i++) {
                multiMat.subMaterials[i] = mats[i]
                mesh.subMeshes[i] = new SubMesh(i, vertStart, verts[i], indStart, inds[i], mesh)
                vertStart += verts[i]
                indStart += inds[i]
            }
            mesh.material = multiMat
        }

        return mesh
    }

    // manage materials/textures to avoid duplicating them
    getTerrainMaterial(matID: number, ignore: boolean) {
        if (ignore) {
            return this.noa.rendering.flatMaterial
        }

        const name = 'terrain mat ' + matID
        if (!this.materialCache[name]) {
            this.materialCache[name] = this.makeTerrainMaterial(matID)
        }
        
        return this.materialCache[name]
    }

    // canonical function to make a terrain material
    makeTerrainMaterial(id: number) {
        // if user-specified render material is defined, use it
        var matData = this.noa.registry.getMaterialData(id)
        if (matData.renderMat) return matData.renderMat
        // otherwise determine which built-in material to use
        var url = this.noa.registry.getMaterialTexture(id)
        var alpha = matData.alpha
        if (!url && alpha === 1) {
            // base material is fine for non-textured case, if no alpha
            return this.noa.rendering.flatMaterial
        }
        var mat = this.noa.rendering.flatMaterial.clone('terrain' + id)
        if (url) {
            var scene = this.noa.rendering.getScene()
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



/**
 * Greedy voxel meshing algorithm
 *    based initially on algo by Mikola Lysenko:
 *    http://0fps.net/2012/07/07/meshing-minecraft-part-2/
 *    but evolved quite a bit since then
 *    AO handling by me, stitched together out of cobwebs and dreams
 *    
 * Arguments:
 *    arr: 3D ndarray of dimensions X,Y,Z
 *        packed with solidity/opacity booleans in higher bits
 *    getMaterial: function( blockID, dir )
 *        returns a material ID based on block id and which cube face it is
 *        (assume for now that each mat ID should get its own mesh)
 *    getColor: function( materialID )
 *        looks up a color (3-array) by material ID
 *        TODO: replace this with a lookup array?
 *    doAO: whether or not to bake ambient occlusion into vertex colors
 *    aoValues: array[3] of color multipliers for AO (least to most occluded)
 *    revAoVal: "reverse ao" - color multiplier for unoccluded exposed edges
 *
 *    Return object: array of mesh objects keyed by material ID
 *    arr[id] = {
 *        id: material id for mesh
 *        vertices: ints, range 0 .. X/Y/Z
 *        indices:  ints
 *        normals:  ints,   -1 .. 1
 *        colors:   floats,  0 .. 1
 *        uvs: floats,  0 .. X/Y/Z
 *    }
 */
class GreedyMesher {
    constructor(noa: Engine) {
        this.noa = noa

        this.aoPackFunction = null;

        this.solidLookup = noa.registry._solidityLookup
        this.opacityLookup = noa.registry._opacityLookup
    }

    opacityLookup: boolean[];
    solidLookup: boolean[];
    aoPackFunction: null | ((arrT: number[], i: number, iPrev: number, j: number, k: number) => any);
    noa: Engine;
    maskCache: Int16Array = new Int16Array(16)
    aomaskCache: Uint16Array = new Uint16Array(16)

    mesh = (voxels: ndarray, getMaterial: any, getColor: any, doAO: any, aoValues: any, revAoVal: any, edgesOnly: boolean) => {
        this.solidLookup = this.noa.registry._solidityLookup
        this.opacityLookup = this.noa.registry._opacityLookup


        // return object, holder for Submeshes
        var subMeshes: { [key: string]: Submesh } = {}

        // precalc how to apply AO packing in first masking function
        var skipReverseAO = (revAoVal === aoValues[0])
        this.aoPackFunction = (!doAO) ? null : (skipReverseAO) ? this.packAOMaskNoReverse : this.packAOMask

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
            if (this.maskCache.length < len1 * len2) {
                this.maskCache = new Int16Array(len1 * len2)
                this.aomaskCache = new Uint16Array(len1 * len2)
            }

            // iterate along current major axis..
            for (var i = 0; i <= len0; ++i) {

                // fills mask and aomask arrays with values
                this.constructMeshMasks(i, d, arrT, getMaterial)
                profile_hook('masks')

                // parses the masks to do greedy meshing
                this.constructMeshDataFromMasks(i, d, u, v, len1, len2, doAO, subMeshes, getColor, aoValues, revAoVal)

                // process edges only by jumping to other edge
                if (edgesOnly) {
                    i += (len0 - 1)
                }

                profile_hook('submeshes')
            }
        }

        // done, return hash of subMeshes as an array
        return Object.keys(subMeshes).map(k => subMeshes[k])
    }
    
    /**
     * Greedy meshing inner loop one
     * iterating across ith 2d plane, with n being index into mask
     */
    constructMeshMasks = (i: any, d: any, arrT: any, getMaterial: any) => {
        var len = arrT.shape[1]
        var mask = this.maskCache
        var aomask = this.aomaskCache
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

                var faceDir = this.getFaceDir(id0, id1, getMaterial, materialDir)
                if (faceDir) {
                    // set regular mask value to material ID, sign indicating direction
                    mask[n] = (faceDir > 0) ? getMaterial(id0, materialDir) : -getMaterial(id1, materialDir + 1)

                    // if doing AO, precalculate AO level for each face into second mask
                    if (this.aoPackFunction) {
                        // i values in direction face is/isn't pointing
                        aomask[n] = (faceDir > 0) ? this.aoPackFunction(arrT, i, i - 1, j, k) : this.aoPackFunction(arrT, i - 1, i, j, k)
                    }
                }
            }
        }
    }

    getFaceDir = (id0: number, id1: number, getMaterial: (id: number, materialDir: number) => number, materialDir: number) => {
        // no face if both blocks are opaque
        var op0 = this.opacityLookup[id0]
        var op1 = this.opacityLookup[id1]

        if (op0 && op1) {
            return 0
        }

        // if either block is opaque draw a face for it
        if (op0) {
            return 1
        }
        if (op1) {
            return -1
        }

        // can't tell from block IDs, so compare block materials of each face
        var m0 = getMaterial(id0, materialDir)
        var m1 = getMaterial(id1, materialDir + 1)

        // if same material, draw no face. If one is missing, draw the other
        if (m0 === m1) {
            return 0
        }
        else if (m0 === 0) {
            return -1
        }
        else if (m1 === 0) {
            return 1
        }

        // remaining case is two different non-opaque block materials
        // facing each other. for now, draw neither..
        return 0
    }
    
    /**
     * Greedy meshing inner loop two
     * construct data for mesh using the masks
     */
    constructMeshDataFromMasks = (
        i: number, d: number, u: number, v: number,
        len1: number, len2: number, doAO: any,
        submeshes: { [key: number]: Submesh },
        getColor: (id: number) => number[],
        aoValues: any, revAoVal: any
    ) => {
        var n = 0
        var mask = this.maskCache
        var aomask = this.aomaskCache

        var x = [0, 0, 0]
        var du = [0, 0, 0]
        var dv = [0, 0, 0]
        x[d] = i
        var norms = [0, 0, 0]

        // some logic is broken into helper functions for AO and non-AO
        // this fixes deopts in Chrome (for reasons unknown)
        var maskCompareFcn = (doAO) ? this.maskCompare : this.maskCompare_noAO
        var meshColorFcn = (doAO) ? this.pushMeshColors : this.pushMeshColors_noAO

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
                // w=h=1
                // material and mesh for this face
                var matID = Math.abs(maskVal)
                if (!submeshes[matID]) submeshes[matID] = new Submesh(matID)
                var mesh = submeshes[matID]
                var colors = mesh.colors! as Color4
                var c = getColor(matID)

                // colors are pushed in helper function - avoids deopts
                // tridir is boolean for which way to split the quad into triangles
                var triDir = meshColorFcn(colors, c, ao, aoValues, revAoVal)

                // Add quad, vertices = x -> x+du -> x+du+dv -> x+dv
                x[u] = j
                x[v] = k
                
                du[u] = w
                dv[v] = h

                var pos = mesh.positions!
                pos.push(
                    x[0], x[1], x[2],
                    x[0] + du[0], x[1] + du[1], x[2] + du[2],
                    x[0] + du[0] + dv[0], x[1] + du[1] + dv[1], x[2] + du[2] + dv[2],
                    x[0] + dv[0], x[1] + dv[1], x[2] + dv[2])

                // add uv values, with the order and sign depending on 
                // axis and direction so as to avoid mirror-image textures
                var dir = sign(maskVal)

                if (d === 2) {
                    mesh.uvs!.push(
                        0, h,
                        -dir * w, h,
                        -dir * w, 0,
                        0, 0)
                } else {
                    mesh.uvs!.push(
                        0, w,
                        0, 0,
                        dir * h, 0,
                        dir * h, w)
                }

                // Add indexes, ordered clockwise for the facing direction;
                var vs = pos.length / 3 - 4

                if (maskVal < 0) {
                    if (triDir) {
                        mesh.indices!.push(vs, vs + 1, vs + 2, vs, vs + 2, vs + 3)
                    } else {
                        mesh.indices!.push(vs + 1, vs + 2, vs + 3, vs, vs + 1, vs + 3)
                    }
                } else {
                    if (triDir) {
                        mesh.indices!.push(vs, vs + 2, vs + 1, vs, vs + 3, vs + 2)
                    } else {
                        mesh.indices!.push(vs + 3, vs + 1, vs, vs + 3, vs + 2, vs + 1)
                    }
                }

                // norms depend on which direction the mask was solid in..
                norms[d] = dir

                // same norm for all vertices
                mesh.normals!.push(
                    norms[0], norms[1], norms[2],
                    norms[0], norms[1], norms[2],
                    norms[0], norms[1], norms[2],
                    norms[0], norms[1], norms[2])

                // Zero-out mask
                for (var hx = 0; hx < h; ++hx) {
                    for (var wx = 0; wx < w; ++wx) {
                        mask[n + wx + hx * len1] = 0
                    }
                }

            }
        }
    }
    

    /** Helper functions with AO and non-AO implementations: */
    maskCompare = (index: number, mask: any, maskVal: any, aomask: any, aoVal: any) => {
        if (maskVal !== mask[index]) return false
        if (aoVal !== aomask[index]) return false
        return true
    }

    maskCompare_noAO = (index: number, mask: any, maskVal: any, aomask: any, aoVal: any) => {
        if (maskVal !== mask[index]) return false
        return true
    }


    pushMeshColors_noAO = (colors: Color4, c: number[], ao: any, aoValues: any, revAoVal: any) => {
        colors.push(c[0], c[1], c[2], 1)
        colors.push(c[0], c[1], c[2], 1)
        colors.push(c[0], c[1], c[2], 1)
        colors.push(c[0], c[1], c[2], 1)

        return true // triangle direction doesn't matter for non-AO
    }

    pushMeshColors = (colors: number[], c: number[], ao: any, aoValues: any, revAoVal: any) => {
        let ao00 = this.unpackAOMask(ao, 0, 0)
        let ao10 = this.unpackAOMask(ao, 1, 0)
        let ao11 = this.unpackAOMask(ao, 1, 1)
        let ao01 = this.unpackAOMask(ao, 0, 1)
        this.pushAOColor(colors, c, ao00, aoValues, revAoVal)
        this.pushAOColor(colors, c, ao10, aoValues, revAoVal)
        this.pushAOColor(colors, c, ao11, aoValues, revAoVal)
        this.pushAOColor(colors, c, ao01, aoValues, revAoVal)

        // this bit is pretty magical..
        let triDir = true
        if (ao00 === ao11) {
            triDir = (ao01 === ao10) ? (ao01 === 2) : true
        } else {
            triDir = (ao01 === ao10) ? false : (ao00 + ao11 > ao01 + ao10)
        }
        return triDir
    }
    

    /**
     * packAOMask:
     *   For a given face, find occlusion levels for each vertex, then
     *   pack 4 such (2-bit) values into one Uint8 value
     * 
     * Occlusion levels:
     *    1 is flat ground, 2 is partial occlusion, 3 is max (corners)
     *    0 is "reverse occlusion" - an unoccluded exposed edge 
     * 
     * Packing order var(bit offset):
     *      a01(2)  -   a11(6)   ^  K
     *        -     -            +> J
     *      a00(0)  -   a10(4)
     * 
     * when skipping reverse AO, uses this simpler version of the function:
     */
    packAOMaskNoReverse = (data: any, ipos: any, ineg: any, j: any, k: any) => {
        var a00 = 1
        var a01 = 1
        var a10 = 1
        var a11 = 1

        // inc occlusion of vertex next to obstructed side
        if (this.solidLookup[data.get(ipos, j + 1, k)]) {++a10;++a11 }
        if (this.solidLookup[data.get(ipos, j - 1, k)]) {++a00;++a01 }
        if (this.solidLookup[data.get(ipos, j, k + 1)]) {++a01;++a11 }
        if (this.solidLookup[data.get(ipos, j, k - 1)]) {++a00;++a10 }

        // facing into a solid (non-opaque) block?
        var facingSolid = this.solidLookup[data.get(ipos, j, k)]
        if (facingSolid) {
            // always 2, or 3 in corners
            a11 = (a11 === 3 || this.solidLookup[data.get(ipos, j + 1, k + 1)]) ? 3 : 2
            a01 = (a01 === 3 || this.solidLookup[data.get(ipos, j - 1, k + 1)]) ? 3 : 2
            a10 = (a10 === 3 || this.solidLookup[data.get(ipos, j + 1, k - 1)]) ? 3 : 2
            a00 = (a00 === 3 || this.solidLookup[data.get(ipos, j - 1, k - 1)]) ? 3 : 2
        } else {
            // treat corner as occlusion 3 only if not occluded already
            if (a11 === 1 && (this.solidLookup[data.get(ipos, j + 1, k + 1)])) { a11 = 2 }
            if (a01 === 1 && (this.solidLookup[data.get(ipos, j - 1, k + 1)])) { a01 = 2 }
            if (a10 === 1 && (this.solidLookup[data.get(ipos, j + 1, k - 1)])) { a10 = 2 }
            if (a00 === 1 && (this.solidLookup[data.get(ipos, j - 1, k - 1)])) { a00 = 2 }
        }

        return a11 << 6 | a10 << 4 | a01 << 2 | a00
    }

    // more complicated AO packing when doing reverse AO on corners
    packAOMask = (data: any, ipos: any, ineg: any, j: any, k: any) => {
        var a00 = 1
        var a01 = 1
        var a10 = 1
        var a11 = 1

        // inc occlusion of vertex next to obstructed side
        if (this.solidLookup[data.get(ipos, j + 1, k)]) {++a10;++a11 }
        if (this.solidLookup[data.get(ipos, j - 1, k)]) {++a00;++a01 }
        if (this.solidLookup[data.get(ipos, j, k + 1)]) {++a01;++a11 }
        if (this.solidLookup[data.get(ipos, j, k - 1)]) {++a00;++a10 }

        // facing into a solid (non-opaque) block?
        var facingSolid = this.solidLookup[data.get(ipos, j, k)]
        if (facingSolid) {
            // always 2, or 3 in corners
            a11 = (a11 === 3 || this.solidLookup[data.get(ipos, j + 1, k + 1)]) ? 3 : 2
            a01 = (a01 === 3 || this.solidLookup[data.get(ipos, j - 1, k + 1)]) ? 3 : 2
            a10 = (a10 === 3 || this.solidLookup[data.get(ipos, j + 1, k - 1)]) ? 3 : 2
            a00 = (a00 === 3 || this.solidLookup[data.get(ipos, j - 1, k - 1)]) ? 3 : 2
        } else {

            // check each corner, and if not present do reverse AO
            if (a11 === 1) {
                if (this.solidLookup[data.get(ipos, j + 1, k + 1)]) {
                    a11 = 2
                }
                else if (!(this.solidLookup[data.get(ineg, j, k + 1)]) ||
                    !(this.solidLookup[data.get(ineg, j + 1, k)]) ||
                    !(this.solidLookup[data.get(ineg, j + 1, k + 1)])) {
                    a11 = 0
                }
            }

            if (a10 === 1) {
                if (this.solidLookup[data.get(ipos, j + 1, k - 1)]) {
                    a10 = 2
                } else if (!(this.solidLookup[data.get(ineg, j, k - 1)]) ||
                    !(this.solidLookup[data.get(ineg, j + 1, k)]) ||
                    !(this.solidLookup[data.get(ineg, j + 1, k - 1)])) {
                    a10 = 0
                }
            }

            if (a01 === 1) {
                if (this.solidLookup[data.get(ipos, j - 1, k + 1)]) {
                    a01 = 2
                } else if (!(this.solidLookup[data.get(ineg, j, k + 1)]) ||
                    !(this.solidLookup[data.get(ineg, j - 1, k)]) ||
                    !(this.solidLookup[data.get(ineg, j - 1, k + 1)])) {
                    a01 = 0
                }
            }

            if (a00 === 1) {
                if (this.solidLookup[data.get(ipos, j - 1, k - 1)]) {
                    a00 = 2
                } else if (!(this.solidLookup[data.get(ineg, j, k - 1)]) ||
                    !(this.solidLookup[data.get(ineg, j - 1, k)]) ||
                    !(this.solidLookup[data.get(ineg, j - 1, k - 1)])) {
                    a00 = 0
                }
            }
        }

        return a11 << 6 | a10 << 4 | a01 << 2 | a00
    }

    // unpack (2 bit) ao value from ao mask
    // see above for details
    unpackAOMask = (aomask: number, jpos: number, kpos: number) => {
        var offset = jpos ? (kpos ? 6 : 4) : (kpos ? 2 : 0)
        return aomask >> offset & 3
    }

    // premultiply vertex colors by value depending on AO level
    // then push them into color array
    pushAOColor = (colors: number[], baseCol: number[], ao: any, aoVals: any, revAoVal: any) => {
        var mult = (ao === 0) ? revAoVal : aoVals[ao - 1]
        colors.push(baseCol[0] * mult, baseCol[1] * mult, baseCol[2] * mult, 1)
    }
}



function sign(num: number) {
    return (num > 0) ? 1 : -1
}




import { makeProfileHook } from './util'
import Engine, { Material } from ".."
import { Nullable, FloatArray, IndicesArray } from "@babylonjs/core"
import { Chunk } from "./chunk"
import { Color4 } from "./types"
var profile_hook = (PROFILE_EVERY) ?
    makeProfileHook(PROFILE_EVERY, 'Terrain meshing') : () => {}
