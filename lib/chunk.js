'use strict'

var ndarray = require('ndarray')

window.ndarray = ndarray

module.exports = Chunk


/* 
 *   BabylonJS Voxel Chunk
 *
 *  Stores block ids and related data for each voxel within chunk
 *  
 *  
 *  Stores, from right to left:
 *    9 bits of voxel ID
 *    4 bits of variation (e.g. orientation)
 *    1 bit solidity (i.e. physics-wise)
 *    1 bit opacity (whether voxel obscures neighboring faces)
 *    1 bit object marker (marks non-terrain blocks with custom meshes)
*/


// internal data representation
var ID_BITS = 9
var ID_MASK = (1 << ID_BITS) - 1
var VAR_BITS = 4
var VAR_OFFSET = ID_BITS
var VAR_MASK = ((1 << VAR_BITS) - 1) << VAR_OFFSET

var __n = ID_BITS + VAR_BITS
var SOLID_BIT = 1 << __n++
var OPAQUE_BIT = 1 << __n++
var OBJECT_BIT = 1 << __n++


// local references to lookup arrays inside noa.registry
var solidLookup
var opaqueLookup
var objectMeshLookup
var blockHandlerLookup


// profiling flag (implementation at end of file)
var PROFILE = 0


/*
 *
 *    Chunk constructor
 *
*/

function Chunk(noa, i, j, k, size) {
    this.noa = noa
    this.isDisposed = false
    this.isGenerated = false
    this.isMeshed = false
    this.inInvalid = false

    this.isEmpty = false
    this.isFull = false

    // packed data storage
    var s = size + 2 // 1 block of padding on each side
    var arr = new Uint16Array(s * s * s)
    this.array = new ndarray(arr, [s, s, s])
    this.i = i
    this.j = j
    this.k = k
    this.size = size
    this.x = i * size
    this.y = j * size
    this.z = k * size
    // storage for object meshes
    this._objectMeshes = {}
    // used only once for init
    this._objMeshCoordList = []
    this._objectMeshesInitted = false

    // vars to track if terrain needs re-meshing
    this._terrainDirty = false

    // lookup arrays mapping block ID to block properties
    if (!solidLookup) {
        solidLookup = noa.registry._blockSolidity
        opaqueLookup = noa.registry._blockOpacity
        objectMeshLookup = noa.registry._blockMesh
        blockHandlerLookup = noa.registry._blockHandlers
    }

    // build unpadded and transposed array views for internal use
    rebuildArrayViews(this)

    // storage for block for selection octree
    this.octreeBlock = null;
}




/*
 *
 *    Chunk API
 *
*/

// get/set deal with block IDs, so that this class acts like an ndarray

Chunk.prototype.get = function (x, y, z) {
    return ID_MASK & this._unpaddedView.get(x, y, z)
}

Chunk.prototype.getSolidityAt = function (x, y, z) {
    return (SOLID_BIT & this._unpaddedView.get(x, y, z)) ? true : false
}

Chunk.prototype.set = function (x, y, z, id) {
    var oldID = this._unpaddedView.get(x, y, z)
    var oldIDnum = oldID & ID_MASK
    if (id === oldIDnum) return

    // manage data
    var newID = packID(id)
    this._unpaddedView.set(x, y, z, newID)

    // handle object meshes
    if (oldID & OBJECT_BIT) removeObjectMeshAt(this, x, y, z)
    if (newID & OBJECT_BIT) addObjectMeshAt(this, id, x, y, z)

    // track full/emptyness
    if (newID !== 0) this.isEmpty = false
    if (!(newID & OPAQUE_BIT)) this.isFull = false

    // call block handlers
    callBlockHandler(this, oldIDnum, 'onUnset', x, y, z)
    callBlockHandler(this, id, 'onSet', x, y, z)

    // mark terrain dirty unless neither block was terrain
    if (isTerrain(oldID) || isTerrain(newID)) this._terrainDirty = true;
}



// helper to call handler of a given type at a particular xyz

function callBlockHandler(chunk, blockID, type, x, y, z) {
    var hobj = blockHandlerLookup[blockID]
    if (!hobj) return
    var handler = hobj[type]
    if (!handler) return
    // ignore all handlers if block is in chunk's edge padding blocks
    var s = chunk.size
    if (x < 0 || y < 0 || z < 0 || x >= s || y >= s || z >= s) return
    handler(chunk.x + x, chunk.y + y, chunk.z + z)
}









// helper to determine if a block counts as "terrain" (non-air, non-object)
function isTerrain(id) {
    if (id === 0) return false
    // treat object blocks as terrain if solid (they affect AO)
    if (id & OBJECT_BIT) return !!(id & SOLID_BIT)
    return true
}

// helper to pack a block ID into the internally stored form, given lookup tables
function packID(id) {
    var newID = id
    if (solidLookup[id]) newID |= SOLID_BIT
    if (opaqueLookup[id]) newID |= OPAQUE_BIT
    if (objectMeshLookup[id]) newID |= OBJECT_BIT
    return newID
}










Chunk.prototype.initData = function () {
    // remake other views, assuming that data has changed
    rebuildArrayViews(this)
    // flags for tracking if chunk is entirely opaque or transparent
    var fullyOpaque = OPAQUE_BIT
    var fullyAir = true

    // init everything in one big scan
    var arr = this.array
    var data = arr.data
    var len = arr.shape[0]
    var kstride = arr.stride[2]
    var objList = this._objMeshCoordList
    for (var i = 0; i < len; ++i) {
        var edge1 = (i === 0 || i === len - 1)
        for (var j = 0; j < len; ++j) {
            var d0 = arr.index(i, j, 0)
            var edge2 = edge1 || (j === 0 || j === len - 1)
            for (var k = 0; k < len; ++k, d0 += kstride) {
                // pull raw ID - could in principle be packed, so mask it
                var id = data[d0] & ID_MASK
                // skip air blocks
                if (id === 0) {
                    fullyOpaque = 0
                    continue
                }
                // store ID as packed internal representation
                var packed = packID(id) | 0
                data[d0] = packed
                // track whether chunk is entirely full or empty
                fullyOpaque &= packed
                fullyAir = false
                // within unpadded view, handle object blocks and handlers
                var atEdge = edge2 || (k === 0 || k === len - 1)
                if (!atEdge) {
                    if (OBJECT_BIT & packed) objList.push(i - 1, j - 1, k - 1)
                    callBlockHandler(this, id, 'onLoad', i - 1, j - 1, k - 1)
                }
            }
        }
    }

    this.isFull = !!(fullyOpaque & OPAQUE_BIT)
    this.isEmpty = !!(fullyAir)
    this._terrainDirty = !(this.isFull || this.isEmpty)

    this.isGenerated = true
}



// helper to rebuild several transformed views on the data array

function rebuildArrayViews(chunk) {
    var arr = chunk.array
    var size = chunk.size
    chunk._unpaddedView = arr.lo(1, 1, 1).hi(size, size, size)
}







// dispose function - just clears properties and references

Chunk.prototype.dispose = function () {
    // look through the data for onUnload handlers
    callAllBlockHandlers(this, 'onUnload')

    // dispose any object meshes - TODO: pool?
    for (var key in this._objectMeshes) {
        var m = this._objectMeshes[key]
        m.dispose()
        delete (this._objectMeshes[key])
    }
    // apparently there's no way to dispose typed arrays, so just null everything
    this.array.data = null
    this.array = null
    this._unpaddedView = null

    if (this.octreeBlock) {
        var octree = this.noa.rendering.getScene()._selectionOctree
        var ind = octree.blocks.indexOf(this.octreeBlock)
        if (ind >= 0) octree.blocks.splice(ind, 1)
        this.octreeBlock.entries = null
        this.octreeBlock = null
    }

    this.isMeshed = false
    this.isGenerated = false
    this.isDisposed = true
}





// helper to call a given handler for all blocks in the chunk

function callAllBlockHandlers(chunk, type) {
    var view = chunk._unpaddedView
    var data = view.data
    var si = view.stride[0]
    var sj = view.stride[1]
    var sk = view.stride[2]
    var size = view.shape[0]
    var d0 = view.offset
    for (var i = 0; i < size; ++i) {
        for (var j = 0; j < size; ++j) {
            for (var k = 0; k < size; ++k) {
                var id = ID_MASK & data[d0]
                callBlockHandler(chunk, id, type, i, j, k)
                d0 += sk
            }
            d0 -= sk * size
            d0 += sj
        }
        d0 -= sj * size
        d0 += si
    }
}








// create a Submesh (class below) of meshes needed for this chunk

Chunk.prototype.mesh = function (getMaterial, getColor, doAO, aoValues, revAoVal) {
    if (!this._objectMeshesInitted) this.initObjectMeshes()
    this._terrainDirty = false
    var res = greedyND(this.array, getMaterial, getColor, doAO, aoValues, revAoVal)
    this.isMeshed = true
    return res
}


// helper class to hold submeshes.
function Submesh(id) {
    this.id = id
    this.positions = []
    this.indices = []
    this.normals = []
    this.colors = []
    this.uvs = []
}



// one-time processing of object block custom meshes

Chunk.prototype.initObjectMeshes = function () {
    this._objectMeshesInitted = true
    var list = this._objMeshCoordList
    while (list.length > 2) {
        var z = list.pop()
        var y = list.pop()
        var x = list.pop()
        // instantiate custom meshes..
        var id = this.get(x, y, z)
        addObjectMeshAt(this, id, x, y, z)
    }
    // this is never needed again
    this._objMeshCoordList = null
}

Chunk.prototype.getObjectMeshAt = function (x, y, z) {
    var key = x + '|' + y + '|' + z
    return this._objectMeshes[key]
}


// helper to remove object meshes
function removeObjectMeshAt(chunk, x, y, z) {
    var key = x + '|' + y + '|' + z
    var m = chunk._objectMeshes[key]

    if (m) {
        // object mesh may not exist in this chunk, if we're on a border

        if (chunk.octreeBlock) {
            var i = chunk.octreeBlock.entries.indexOf(m)
            if (i >= 0) chunk.octreeBlock.entries.splice(i, 1);
        }

        m.dispose()
        delete (chunk._objectMeshes[key])
    }
}


// helper to add object meshes
function addObjectMeshAt(chunk, id, x, y, z) {
    var key = x + '|' + y + '|' + z
    var srcMesh = objectMeshLookup[id]
    var mesh = chunk.noa.rendering.makeMeshInstance(srcMesh, true)
    // place object mesh's origin at bottom-center of block
    mesh.position.x = x + chunk.i * chunk.size + 0.5
    mesh.position.y = y + chunk.j * chunk.size
    mesh.position.z = z + chunk.k * chunk.size + 0.5
    // add them to tracking hash
    chunk._objectMeshes[key] = mesh

    if (chunk.octreeBlock) {
        chunk.octreeBlock.entries.push(mesh)
    }

    var handlers = blockHandlerLookup[id]
    if (handlers && handlers.onCustomMeshCreate) {
        handlers.onCustomMeshCreate(mesh, x, y, z)
    }

    if (!mesh.billboardMode) mesh.freezeWorldMatrix()
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


var maskCache = new Int16Array(256),
    aomaskCache = new Uint16Array(256)



function greedyND(arr, getMaterial, getColor, doAO, aoValues, revAoVal) {

    // return object, holder for Submeshes
    var submeshes = []

    // precalc how to apply AO packing in first masking function
    var skipReverseAO = (doAO && (revAoVal === aoValues[0]))
    var aoPackFcn
    if (doAO) aoPackFcn = (skipReverseAO) ? packAOMaskNoReverse : packAOMask

    profile_hook('start')

    //Sweep over each axis, mapping axes to [d,u,v]
    for (var d = 0; d < 3; ++d) {
        var u = (d + 1) % 3
        var v = (d + 2) % 3

        // make transposed ndarray so index i is the axis we're sweeping
        var arrT = arr.transpose(d, u, v).lo(1, 1, 1).hi(arr.shape[d] - 2, arr.shape[u] - 2, arr.shape[v] - 2)

        // shorten len0 by 1 so faces at edges don't get drawn in both chunks
        var len0 = arrT.shape[0] - 1
        var len1 = arrT.shape[1]
        var len2 = arrT.shape[2]

        // preallocate mask arrays if needed
        if (maskCache.length < len1 * len2) {
            maskCache = new Int16Array(len1 * len2)
            aomaskCache = new Uint16Array(len1 * len2)
        }

        // iterate along current major axis..
        for (var i = 0; i <= len0; ++i) {

            // fills mask and aomask arrays with values
            constructMeshMasks(i, d, arrT, getMaterial, aoPackFcn)
            profile_hook('mesh masks')

            // parses the masks to do greedy meshing
            constructMeshDataFromMasks(i, d, u, v, len1, len2,
                doAO, submeshes, getColor, aoValues, revAoVal)

            profile_hook('mesh data')
        }
    }

    profile_hook('end')

    // done, return array of submeshes
    return submeshes
}







//      Greedy meshing inner loop one
//
// iterating across ith 2d plane, with n being index into masks

function constructMeshMasks(i, d, arrT, getMaterial, aoPackFcn) {
    var len = arrT.shape[1]
    var mask = maskCache
    var aomask = aomaskCache
    // set up for quick array traversals
    var n = 0
    var data = arrT.data
    var dbase = arrT.index(i - 1, 0, 0)
    var istride = arrT.stride[0]
    var jstride = arrT.stride[1]
    var kstride = arrT.stride[2]

    for (var k = 0; k < len; ++k) {
        var d0 = dbase
        dbase += kstride
        for (var j = 0; j < len; j++ , n++ , d0 += jstride) {

            // mask[n] will represent the face needed between i-1,j,k and i,j,k
            // for now, assume we never have two faces in both directions

            // IDs at i-1,j,k  and  i,j,k
            var id0 = data[d0]
            var id1 = data[d0 + istride]

            var faceDir = getFaceDir(id0, id1)
            if (faceDir) {
                // set regular mask value to material ID, sign indicating direction
                mask[n] = (faceDir > 0) ?
                    getMaterial(id0 & ID_MASK, d * 2) :
                    -getMaterial(id1 & ID_MASK, d * 2 + 1)

                // if doing AO, precalculate AO level for each face into second mask
                if (aoPackFcn) {
                    // i values in direction face is/isn't pointing
                    var ipos = (faceDir > 0) ? i : i - 1
                    var ineg = (faceDir > 0) ? i - 1 : i

                    // this got so big I rolled it into a function
                    aomask[n] = aoPackFcn(arrT, ipos, ineg, j, k)
                }
            }

        }
    }
}

function constructMeshMasksB(i, d, arrT, getMaterial, aoPackFcn) {
    var len = arrT.shape[1]
    var mask = maskCache
    var aomask = aomaskCache

    // traversal
    var n = 0
    var data = arrT.data
    var dbase = arrT.index(i - 1, 0, 0)
    var istride = arrT.stride[0]
    var jstride = arrT.stride[1]
    var kstride = arrT.stride[2]

    for (var k = 0; k < len; ++k) {
        var d0 = dbase
        dbase += kstride
        for (var j = 0; j < len; ++j) {

            // mask[n] will represent the face needed between i-1,j,k and i,j,k
            // for now, assume we never have two faces in both directions
            // So mask value is face material id, sign is direction

            // IDs at i-1,j,k  and  i,j,k
            var id0 = data[d0]
            var id1 = data[d0 + istride]

            var faceDir = getFaceDir(id0, id1)
            if (faceDir) {
                // set regular mask value to material ID, sign indicating direction
                mask[n] = (faceDir > 0) ?
                    getMaterial(id0 & ID_MASK, d * 2) :
                    -getMaterial(id1 & ID_MASK, d * 2 + 1)

                // if doing AO, precalculate AO level for each face into second mask
                if (aoPackFcn) {
                    // i values in direction face is/isn't pointing
                    var ipos = (faceDir > 0) ? i : i - 1
                    var ineg = (faceDir > 0) ? i - 1 : i

                    // this got so big I rolled it into a function
                    aomask[n] = aoPackFcn(arrT, ipos, ineg, j, k)
                }
            }

            // done, move to next mask index
            d0 += jstride
            n++
        }
    }
}


function getFaceDir(id0, id1) {
    // no face if both blocks are opaque, or if ids match
    if (id0 === id1) return 0
    var op0 = id0 & OPAQUE_BIT
    var op1 = id1 & OPAQUE_BIT
    if (op0 && op1) return 0
    // if either block is opaque draw a face for it
    if (op0) return 1
    if (op1) return -1
    // if one block is air or an object block draw face for the other
    if (id1 === 0 || (id1 & OBJECT_BIT)) return 1
    if (id0 === 0 || (id0 & OBJECT_BIT)) return -1
    // only remaining case is two different non-opaque non-air blocks that are adjacent
    // really we should draw both faces here; draw neither for now
    return 0
}







//      Greedy meshing inner loop two
//
// construct data for mesh using the masks

function constructMeshDataFromMasks(i, d, u, v, len1, len2,
    doAO, submeshes, getColor, aoValues, revAoVal) {
    var n = 0
    var mask = maskCache
    var aomask = aomaskCache

    // some logic is broken into helper functions for AO and non-AO
    // this fixes deopts in Chrome (for reasons unknown)
    var maskCompareFcn = (doAO) ? maskCompare : maskCompare_noAO
    var meshColorFcn = (doAO) ? pushMeshColors : pushMeshColors_noAO

    for (var k = 0; k < len2; ++k) {
        var w = 1
        var h = 1
        for (var j = 0; j < len1; j += w, n += w) {

            var maskVal = mask[n]
            if (!maskVal) {
                w = 1
                continue
            }
            var ao = aomask[n]

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
            if (!submeshes[matID]) submeshes[matID] = new Submesh(matID)
            var mesh = submeshes[matID]
            var colors = mesh.colors
            var c = getColor(matID)

            // colors are pushed in helper function - avoids deopts
            // tridir is boolean for which way to split the quad into triangles

            var triDir = meshColorFcn(colors, c, ao, aoValues, revAoVal)


            //Add quad, vertices = x -> x+du -> x+du+dv -> x+dv
            var x = [0, 0, 0]
            x[d] = i
            x[u] = j
            x[v] = k
            var du = [0, 0, 0]; du[u] = w;
            var dv = [0, 0, 0]; dv[v] = h;

            var pos = mesh.positions
            pos.push(
                x[0], x[1], x[2],
                x[0] + du[0], x[1] + du[1], x[2] + du[2],
                x[0] + du[0] + dv[0], x[1] + du[1] + dv[1], x[2] + du[2] + dv[2],
                x[0] + dv[0], x[1] + dv[1], x[2] + dv[2])


            // add uv values, with the order and sign depending on 
            // axis and direction so as to avoid mirror-image textures
            var dir = (maskVal > 0) ? 1 : -1

            if (d === 2) {
                mesh.uvs.push(
                    0, h,
                    -dir * w, h,
                    -dir * w, 0,
                    0, 0)
            } else {
                mesh.uvs.push(
                    0, w,
                    0, 0,
                    dir * h, 0,
                    dir * h, w)
            }


            // Add indexes, ordered clockwise for the facing direction;

            var vs = pos.length / 3 - 4

            if (maskVal < 0) {
                if (triDir) {
                    mesh.indices.push(vs, vs + 1, vs + 2, vs, vs + 2, vs + 3)
                } else {
                    mesh.indices.push(vs + 1, vs + 2, vs + 3, vs, vs + 1, vs + 3)
                }
            } else {
                if (triDir) {
                    mesh.indices.push(vs, vs + 2, vs + 1, vs, vs + 3, vs + 2)
                } else {
                    mesh.indices.push(vs + 3, vs + 1, vs, vs + 3, vs + 2, vs + 1)
                }
            }


            // norms depend on which direction the mask was solid in..
            var norm0 = d === 0 ? dir : 0
            var norm1 = d === 1 ? dir : 0
            var norm2 = d === 2 ? dir : 0

            // same norm for all vertices
            mesh.normals.push(
                norm0, norm1, norm2,
                norm0, norm1, norm2,
                norm0, norm1, norm2,
                norm0, norm1, norm2)


            //Zero-out mask
            for (var hx = 0; hx < h; ++hx) {
                for (var wx = 0; wx < w; ++wx) {
                    mask[n + wx + hx * len1] = 0
                }
            }

        }
    }
}



// Two helper functions with AO and non-AO implementations:

function maskCompare(index, mask, maskVal, aomask, aoVal) {
    if (maskVal !== mask[index]) return false
    if (aoVal !== aomask[index]) return false
    return true
}

function maskCompare_noAO(index, mask, maskVal, aomask, aoVal) {
    if (maskVal !== mask[index]) return false
    return true
}

function pushMeshColors_noAO(colors, c, ao, aoValues, revAoVal) {
    colors.push(c[0], c[1], c[2], 1)
    colors.push(c[0], c[1], c[2], 1)
    colors.push(c[0], c[1], c[2], 1)
    colors.push(c[0], c[1], c[2], 1)
    return true // triangle direction doesn't matter for non-AO
}

function pushMeshColors(colors, c, ao, aoValues, revAoVal) {
    var ao00 = unpackAOMask(ao, 0, 0)
    var ao10 = unpackAOMask(ao, 1, 0)
    var ao11 = unpackAOMask(ao, 1, 1)
    var ao01 = unpackAOMask(ao, 0, 1)
    pushAOColor(colors, c, ao00, aoValues, revAoVal)
    pushAOColor(colors, c, ao10, aoValues, revAoVal)
    pushAOColor(colors, c, ao11, aoValues, revAoVal)
    pushAOColor(colors, c, ao01, aoValues, revAoVal)

    // this bit is pretty magical..
    var triDir = true
    if (ao00 === ao11) {
        triDir = (ao01 === ao10) ? (ao01 == 2) : true
    } else {
        triDir = (ao01 === ao10) ? false : (ao00 + ao11 > ao01 + ao10)
    }
    return triDir
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

// when skipping reverse AO, uses this simpler version of the function:

function packAOMaskNoReverse(data, ipos, ineg, j, k) {
    var a00 = 1
    var a01 = 1
    var a10 = 1
    var a11 = 1
    var solidBit = SOLID_BIT

    // facing into a solid (non-opaque) block?
    var facingSolid = (solidBit & data.get(ipos, j, k))

    // inc occlusion of vertex next to obstructed side
    if (data.get(ipos, j + 1, k) & solidBit) { ++a10; ++a11 }
    if (data.get(ipos, j - 1, k) & solidBit) { ++a00; ++a01 }
    if (data.get(ipos, j, k + 1) & solidBit) { ++a01; ++a11 }
    if (data.get(ipos, j, k - 1) & solidBit) { ++a00; ++a10 }

    // treat corners differently based when facing a solid block
    if (facingSolid) {
        // always 2, or 3 in corners
        a11 = (a11 == 3 || data.get(ipos, j + 1, k + 1) & solidBit) ? 3 : 2
        a01 = (a01 == 3 || data.get(ipos, j - 1, k + 1) & solidBit) ? 3 : 2
        a10 = (a10 == 3 || data.get(ipos, j + 1, k - 1) & solidBit) ? 3 : 2
        a00 = (a00 == 3 || data.get(ipos, j - 1, k - 1) & solidBit) ? 3 : 2
    } else {
        // treat corner as occlusion 3 only if not occluded already
        if (a11 === 1 && (data.get(ipos, j + 1, k + 1) & solidBit)) { a11 = 2 }
        if (a01 === 1 && (data.get(ipos, j - 1, k + 1) & solidBit)) { a01 = 2 }
        if (a10 === 1 && (data.get(ipos, j + 1, k - 1) & solidBit)) { a10 = 2 }
        if (a00 === 1 && (data.get(ipos, j - 1, k - 1) & solidBit)) { a00 = 2 }
    }

    return a11 << 6 | a10 << 4 | a01 << 2 | a00
}

// more complicated AO packing when doing reverse AO on corners

function packAOMask(data, ipos, ineg, j, k) {
    var a00 = 1
    var a01 = 1
    var a10 = 1
    var a11 = 1
    var solidBit = SOLID_BIT

    // facing into a solid (non-opaque) block?
    var facingSolid = (solidBit & data.get(ipos, j, k))

    // inc occlusion of vertex next to obstructed side
    if (data.get(ipos, j + 1, k) & solidBit) { ++a10; ++a11 }
    if (data.get(ipos, j - 1, k) & solidBit) { ++a00; ++a01 }
    if (data.get(ipos, j, k + 1) & solidBit) { ++a01; ++a11 }
    if (data.get(ipos, j, k - 1) & solidBit) { ++a00; ++a10 }

    if (facingSolid) {
        // always 2, or 3 in corners
        a11 = (a11 == 3 || data.get(ipos, j + 1, k + 1) & solidBit) ? 3 : 2
        a01 = (a01 == 3 || data.get(ipos, j - 1, k + 1) & solidBit) ? 3 : 2
        a10 = (a10 == 3 || data.get(ipos, j + 1, k - 1) & solidBit) ? 3 : 2
        a00 = (a00 == 3 || data.get(ipos, j - 1, k - 1) & solidBit) ? 3 : 2
    } else {

        // check each corner, and if not present do reverse AO
        if (a11 === 1) {
            if (data.get(ipos, j + 1, k + 1) & solidBit) { a11 = 2 }
            else if (!(data.get(ineg, j, k + 1) & solidBit) ||
                !(data.get(ineg, j + 1, k) & solidBit) ||
                !(data.get(ineg, j + 1, k + 1) & solidBit)) {
                a11 = 0
            }
        }

        if (a10 === 1) {
            if (data.get(ipos, j + 1, k - 1) & solidBit) { a10 = 2 }
            else if (!(data.get(ineg, j, k - 1) & solidBit) ||
                !(data.get(ineg, j + 1, k) & solidBit) ||
                !(data.get(ineg, j + 1, k - 1) & solidBit)) {
                a10 = 0
            }
        }

        if (a01 === 1) {
            if (data.get(ipos, j - 1, k + 1) & solidBit) { a01 = 2 }
            else if (!(data.get(ineg, j, k + 1) & solidBit) ||
                !(data.get(ineg, j - 1, k) & solidBit) ||
                !(data.get(ineg, j - 1, k + 1) & solidBit)) {
                a01 = 0
            }
        }

        if (a00 === 1) {
            if (data.get(ipos, j - 1, k - 1) & solidBit) { a00 = 2 }
            else if (!(data.get(ineg, j, k - 1) & solidBit) ||
                !(data.get(ineg, j - 1, k) & solidBit) ||
                !(data.get(ineg, j - 1, k - 1) & solidBit)) {
                a00 = 0
            }
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
function pushAOColor(colors, baseCol, ao, aoVals, revAoVal) {
    var mult = (ao === 0) ? revAoVal : aoVals[ao - 1]
    colors.push(baseCol[0] * mult, baseCol[1] * mult, baseCol[2] * mult, 1)
}










var profile_hook = function (s) { }
if (PROFILE) (function () {
    var every = 200
    var timer = new (require('./util').Timer)(every)
    profile_hook = function (state) {
        if (state === 'start') timer.start()
        else if (state === 'end') timer.report()
        else timer.add(state)
    }
})()


