'use strict';

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

var n = ID_BITS + VAR_BITS
var SOLID_BIT = 1 << n++
var OPAQUE_BIT = 1 << n++
var OBJECT_BIT = 1 << n++



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

    // packed data storage
    var s = size + 2 // 1 block of padding on each side
    var arr = new Uint16Array(s * s * s)
    this.array = new ndarray(arr, [s, s, s])
    this.i = i
    this.j = j
    this.k = k
    this.size = size
    // storage for object meshes
    this._objectMeshes = {}
    // used only once for init
    this._objMeshCoordList = []
    this._objectMeshesInitted = false

    // vars to track if terrain needs re-meshing
    this._terrainDirty = false

    // lookup arrays mapping block ID to block properties
    this._solidLookup = noa.registry._blockSolidity
    this._opaqueLookup = noa.registry._blockOpacity
    this._objectMeshLookup = noa.registry._blockCustomMesh

    // view onto block data without padding
    this._unpaddedView = this.array.lo(1, 1, 1).hi(size, size, size)

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
    return SOLID_BIT & this._unpaddedView.get(x, y, z)
}

Chunk.prototype.set = function (x, y, z, id) {
    var oldID = this._unpaddedView.get(x, y, z)
    if (id === (oldID & ID_MASK)) return

    // manage data
    var newID = packID(id, this._solidLookup, this._opaqueLookup, this._objectMeshLookup)
    this._unpaddedView.set(x, y, z, newID)

    // handle object meshes
    if (oldID & OBJECT_BIT) removeObjectMeshAt(this, x, y, z)
    if (newID & OBJECT_BIT) addObjectMeshAt(this, id, x, y, z)

    // mark terrain dirty unless neither block was terrain
    if (isTerrain(oldID) || isTerrain(newID)) this._terrainDirty = true;
}



// helper to determine if a block counts as "terrain" (non-air, non-object)
function isTerrain(id) {
    if (id === 0) return false
    // treat object blocks as terrain if solid (they affect AO)
    if (id & OBJECT_BIT) return !!(id & SOLID_BIT)
    return true
}

// helper to pack a block ID into the internally stored form, given lookup tables
function packID(id, sol, op, obj) {
    var newID = id
    if (sol[id]) newID |= SOLID_BIT
    if (op[id]) newID |= OPAQUE_BIT
    if (obj[id] >= 0) newID |= OBJECT_BIT
    return newID
}










Chunk.prototype.initData = function () {
    // assuming data has been filled with block IDs, pack it with opacity/etc.
    var arr = this.array.data,
        len = arr.length,
        sol = this._solidLookup,
        op = this._opaqueLookup,
        obj = this._objectMeshLookup

    for (var i = 0; i < len; ++i) {
        arr[i] = packID(arr[i], sol, op, obj)
    }
    this._terrainDirty = true

    // remake local view on assumption that data has changed
    this._unpaddedView = this.array.lo(1, 1, 1).hi(this.size, this.size, this.size)

    // do one scan through looking for object blocks (for later meshing)
    var view = this._unpaddedView
    var len0 = view.shape[0]
    var len1 = view.shape[1]
    var len2 = view.shape[2]
    var objList = this._objMeshCoordList
    for (i = 0; i < len0; ++i) {
        for (var j = 0; j < len1; ++j) {
            for (var k = 0; k < len2; ++k) {
                if (OBJECT_BIT & view.get(i, j, k)) objList.push(i, j, k)
            }
        }
    }

    this.isGenerated = true
}







// dispose function - just clears properties and references

Chunk.prototype.dispose = function () {
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
    this._solidLookup = null
    this._opaqueLookup = null
    this._customMeshLookup = null

    if (this.octreeBlock) {
        var octree = this.noa.rendering.getScene()._selectionOctree
        var i = octree.blocks.indexOf(this.octreeBlock)
        if (i >= 0) octree.blocks.splice(i, 1)
        this.octreeBlock.entries = null
        this.octreeBlock = null
    }

    this.isMeshed = false
    this.isGenerated = false
    this.isDisposed = true
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
    var m = chunk.noa.rendering._makeMeshInstanceByID(id, true)
    // place object mesh's origin at bottom-center of block
    m.position.x = x + chunk.i * chunk.size + 0.5
    m.position.y = y + chunk.j * chunk.size
    m.position.z = z + chunk.k * chunk.size + 0.5
    // add them to tracking hash
    chunk._objectMeshes[key] = m

    if (chunk.octreeBlock) {
        chunk.octreeBlock.entries.push(m)
    }

    if (!m.billboardMode) m.freezeWorldMatrix()
}










/*
 *    Greedy voxel meshing algorithm with AO
 *        Meshing based on algo by Mikola Lysenko:
 *        http://0fps.net/2012/07/07/meshing-minecraft-part-2/
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


var maskCache = new Int16Array(4096),
    aomaskCache = new Uint16Array(4096)

var t0 = 0, t1 = 0, t3 = 0, ct = 0

function greedyND(arr, getMaterial, getColor, doAO, aoValues, revAoVal) {

    var DEBUG = 0, timeStart, time0, time1, time2
    if (DEBUG) { timeStart = performance.now() }

    // return object, holder for Submeshes
    var submeshes = []

    // precalc whether we can skip reverse AO inside first loop
    var skipReverseAO = (doAO && (revAoVal === aoValues[0]))

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

            if (DEBUG) time0 = performance.now()

            // inner loop part 1
            constructMeshMasks(i, d, arrT, getMaterial, doAO, skipReverseAO)

            if (DEBUG) time1 = performance.now()

            // inner loop part 2
            constructMeshDataFromMasks(i, d, u, v, len1, len2,
                doAO, submeshes, getColor, aoValues, revAoVal)

            if (DEBUG) {
                time2 = performance.now();
                t0 += time1 - time0; t1 += time2 - time1
            }

        }
    }

    if (DEBUG) {
        t3 += time2 - timeStart; ct++
        console.log('took: ', (time2 - timeStart).toFixed(2),
            'avg masking:', (t0 / ct).toFixed(2),
            ' - meshing:', (t1 / ct).toFixed(2),
            ' - overall', (t3 / ct).toFixed(2))
        if (window.resetDebug) {
            window.resetDebug = false
            t0 = t1 = t3 = ct = 0
        }
    }

    // done, return array of submeshes
    return submeshes
}





//      Greedy meshing inner loop one
//
// iterating across ith 2d plane, with n being index into masks

function constructMeshMasks(i, d, arrT, getMaterial, doAO, skipReverseAO) {
    var n = 0
    var len1 = arrT.shape[1]
    var len2 = arrT.shape[2]
    var mask = maskCache
    var aomask = aomaskCache
    var aoPackFcn = (skipReverseAO) ? packAOMaskNoReverse : packAOMask
    for (var k = 0; k < len2; ++k) {
        for (var j = 0; j < len1; ++j) {

            // mask[n] represents the face needed between i,j,k and i+1,j,k
            // for now, assume we never have two faces in both directions
            // So mask value is face material id, sign is direction

            var id0 = arrT.get(i - 1, j, k)
            var id1 = arrT.get(i, j, k)

            var op0 = id0 & OPAQUE_BIT
            var op1 = id1 & OPAQUE_BIT

            // draw no face if both blocks are opaque, or if ids match
            // otherwise, draw a face if one block is opaque or the other is air
            // (and the first isn't an object block)

            var maskVal = 0

            if (!(id0 === id1 || op0 && op1)) {
                if (op0 || (id1 === 0 && !(id0 & OBJECT_BIT))) {
                    maskVal = getMaterial(id0 & ID_MASK, d * 2)
                }
                if (op1 || (id0 === 0 && !(id1 & OBJECT_BIT))) {
                    maskVal = -getMaterial(id1 & ID_MASK, d * 2 + 1)
                }
            }
            mask[n] = maskVal

            // if doing AO, precalculate AO level for each face into second mask
            if (maskVal && doAO) {
                // i values in direction face is/isn't pointing
                var ipos = (maskVal > 0) ? i : i - 1
                var ineg = (maskVal > 0) ? i - 1 : i

                // this got so big I rolled it into a function
                aomask[n] = aoPackFcn(arrT, ipos, ineg, j, k)
            }
            // done, advance mask index
            ++n
        }
    }
}


//      Greedy meshing inner loop two
//
// construct data for mesh using the masks
//(i, d, len1, len2, arrT, getMaterial, mask, aomask, doAO, skipReverseAO) {
function constructMeshDataFromMasks(i, d, u, v, len1, len2,
    doAO, submeshes, getColor, aoValues, revAoVal) {
    var n = 0
    var mask = maskCache
    var aomask = aomaskCache
    for (var k = 0; k < len2; ++k) {
        for (var j = 0; j < len1;) {
            if (mask[n]) {

                var maskVal = mask[n]
                var dir = (maskVal > 0) ? 1 : -1
                var ao = aomask[n]

                //Compute width of area with same mask/aomask values
                var w
                if (doAO) {
                    for (w = 1; maskVal === mask[n + w] && ao === aomask[n + w] && j + w < len1; ++w) { }
                } else {
                    for (w = 1; maskVal === mask[n + w] && j + w < len1; ++w) { }
                }

                // Compute height (this is slightly awkward)
                var h, m
                heightloop:
                for (h = 1; k + h < len2; ++h) {
                    for (m = 0; m < w; ++m) {
                        if (doAO) {
                            if (maskVal !== mask[n + m + h * len1] || (ao !== aomask[n + m + h * len1]))
                                break heightloop;
                        } else {
                            if (maskVal !== mask[n + m + h * len1])
                                break heightloop;
                        }
                    }
                }

                // for testing: doing the following will disable greediness
                //w=h=1

                // material and mesh for this face
                var matID = Math.abs(maskVal)
                if (!submeshes[matID]) submeshes[matID] = new Submesh(matID)
                var mesh = submeshes[matID]
                var c = getColor(matID)

                var ao00, ao10, ao11, ao01
                // push AO-modified vertex colors (or just colors)
                if (doAO) {
                    ao00 = unpackAOMask(ao, 0, 0)
                    ao10 = unpackAOMask(ao, 1, 0)
                    ao11 = unpackAOMask(ao, 1, 1)
                    ao01 = unpackAOMask(ao, 0, 1)
                    pushAOColor(mesh.colors, c, ao00, aoValues, revAoVal)
                    pushAOColor(mesh.colors, c, ao10, aoValues, revAoVal)
                    pushAOColor(mesh.colors, c, ao11, aoValues, revAoVal)
                    pushAOColor(mesh.colors, c, ao01, aoValues, revAoVal)
                } else {
                    mesh.colors.push(c[0], c[1], c[2], 1)
                    mesh.colors.push(c[0], c[1], c[2], 1)
                    mesh.colors.push(c[0], c[1], c[2], 1)
                    mesh.colors.push(c[0], c[1], c[2], 1)
                }

                //Add quad, vertices = x -> x+du -> x+du+dv -> x+dv
                var x = [0, 0, 0]
                x[d] = i
                x[u] = j
                x[v] = k
                var du = [0, 0, 0]; du[u] = w;
                var dv = [0, 0, 0]; dv[v] = h;

                var pos = mesh.positions
                pos.push(x[0], x[1], x[2],
                    x[0] + du[0], x[1] + du[1], x[2] + du[2],
                    x[0] + du[0] + dv[0], x[1] + du[1] + dv[1], x[2] + du[2] + dv[2],
                    x[0] + dv[0], x[1] + dv[1], x[2] + dv[2])


                // add uv values, with the order and sign depending on 
                // axis and direction so as to avoid mirror-image textures
                if (d === 2) {
                    mesh.uvs.push(0, h)
                    mesh.uvs.push(-dir * w, h)
                    mesh.uvs.push(-dir * w, 0)
                    mesh.uvs.push(0, 0)
                } else {
                    mesh.uvs.push(0, w)
                    mesh.uvs.push(0, 0)
                    mesh.uvs.push(dir * h, 0)
                    mesh.uvs.push(dir * h, w)
                }

                // Add indexes, ordered clockwise for the facing direction;
                // decide which way to split the quad based on ao colors

                var triDir = true
                if (doAO) {
                    // this bit is pretty magical..
                    if (ao00 === ao11) {
                        triDir = (ao01 === ao10) ? (ao01 == 2) : true
                    } else {
                        triDir = (ao01 === ao10) ? false : (ao00 + ao11 > ao01 + ao10)
                    }
                }

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
                mesh.normals.push(norm0, norm1, norm2,
                    norm0, norm1, norm2,
                    norm0, norm1, norm2,
                    norm0, norm1, norm2)


                //Zero-out mask
                for (var l = 0; l < h; ++l) {
                    for (m = 0; m < w; ++m) {
                        mask[n + m + l * len1] = 0
                    }
                }
                //Increment counters and continue
                j += w
                n += w
            } else {
                ++j;
                ++n
            }
        }
    }
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
function pushAOColor(colors, baseCol, ao, aoVals, revAOval) {
    var mult = (ao === 0) ? revAOval : aoVals[ao - 1]
    colors.push(baseCol[0] * mult, baseCol[1] * mult, baseCol[2] * mult, 1)
}






