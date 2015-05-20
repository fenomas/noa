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
 *    12 bits of voxel ID
 *    1 bit solidity (i.e. physics-wise)
 *    1 bit opacity (whether voxel obscures neighboring faces)
 *    1 bit object marker (marks non-terrain blocks with custom meshes)
*/


// internal data representation
var ID_BITS = 12
var ID_MASK = (1<<ID_BITS)-1
var SOLID_BIT  = 1<<ID_BITS
var OPAQUE_BIT = 1<<ID_BITS+1
var OBJECT_BIT = 1<<ID_BITS+2




/*
 *
 *    Chunk constructor
 *
*/

function Chunk( noa, i, j, k, size ) {
  this.noa = noa
  this._disposed = false
  // packed data storage
  var s = size+2 // 1 block of padding on each side
  var arr = new Uint16Array(s*s*s)
  this.array = new ndarray( arr, [s, s, s] )
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
  this._unpaddedView = this.array.lo(1,1,1).hi(size,size,size)

  // testing
  if (window.DEBUG_OCTREES) this.octreeBlock = null;
}




/*
 *
 *    Chunk API
 *
*/

// get/set deal with block IDs, so that this class acts like an ndarray

Chunk.prototype.get = function( x, y, z ) {
  return ID_MASK & this._unpaddedView.get(x,y,z)
}

Chunk.prototype.set = function( x, y, z, id ) {
  var oldID = this._unpaddedView.get(x,y,z)
  if (id===(oldID & ID_MASK)) return

  // manage data
  var newID = packID(id, this._solidLookup, this._opaqueLookup, this._objectMeshLookup)
  this._unpaddedView.set( x,y,z, newID )

  // handle object meshes
  if (oldID & OBJECT_BIT) removeObjectMeshAt(this, x,y,z)
  if (newID & OBJECT_BIT) addObjectMeshAt(this, id, x,y,z)

  // mark terrain dirty unless neither block was terrain
  if (isTerrain(oldID) || isTerrain(newID)) this._terrainDirty = true;
}



// helper to determine if a block counts as "terrain" (non-air, non-object)
function isTerrain(id) {
  if (id===0) return false
  if (id & OBJECT_BIT) return false
  return true
}

// helper to pack a block ID into the internally stored form, given lookup tables
function packID(id, sol, op, obj) {
  var newID = id
  if (sol[id])    newID |= SOLID_BIT
  if (op[id])     newID |= OPAQUE_BIT
  if (obj[id]>=0) newID |= OBJECT_BIT
  return newID
}










Chunk.prototype.initData = function() {
  // assuming data has been filled with block IDs, pack it with opacity/etc.

  var arr = this.array.data,
      len = arr.length,
      sol = this._solidLookup,
      op  = this._opaqueLookup,
      obj = this._objectMeshLookup
  var i, j, k
  for (i=0; i<len; ++i) {
    arr[i] = packID(arr[i], sol, op, obj)
  }
  this._terrainDirty = true

  // do one scan through looking for object blocks (for later meshing)
  var view = this._unpaddedView
  var len0 = view.shape[0]
  var len1 = view.shape[1]
  var len2 = view.shape[2]
  var list = this._objMeshCoordList
  for (i=0; i<len0; ++i) {
    for (j=0; j<len1; ++j) {
      for (k=0; k<len2; ++k) {
        if (view.get(i,j,k) & OBJECT_BIT) {
          list.push(i,j,k)
        }
      }
    }
  }
}







// dispose function - just clears properties and references

Chunk.prototype.dispose = function() {
  // dispose any object meshes - TODO: pool?
  for (var key in this._objectMeshes) {
    var m = this._objectMeshes[key]
    m.dispose()
    delete(this._objectMeshes[key])
  }
  // apparently there's no way to dispose typed arrays, so just null everything
  this.array.data = null
  this.array = null
  this._unpaddedView = null
  this._solidLookup = null
  this._opaqueLookup = null
  this._customMeshLookup = null

  if (window.DEBUG_OCTREES && this.octreeBlock) {
    var octree = this.noa.rendering.getScene()._selectionOctree
    var i = octree.blocks.indexOf(this.octreeBlock)
    if (i>=0) octree.blocks.splice(i,1)
    this.octreeBlock.entries = null
    this.octreeBlock = null
  }

  this._disposed = true
}







// create a Submesh (class below) of meshes needed for this chunk

Chunk.prototype.mesh = function(getMaterial, getColor, doAO, aoValues) {
  if (!this._objectMeshesInitted) this.initObjectMeshes()
  this._terrainDirty = false
  if (!aoValues) aoValues = [ 1, 0.75, 0.5 ]
  return greedyND(this.array, getMaterial, getColor, doAO, aoValues)
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
  while(list.length>2) {
    var z = list.pop()
    var y = list.pop()
    var x = list.pop()
    // instantiate custom meshe
    var id = this.get(x,y,z)
    addObjectMeshAt(this, id, x, y, z)
  }
  // this is never needed again
  this._objMeshCoordList = null
}


// helper to remove object meshes
function removeObjectMeshAt(chunk,x,y,z) {
  var key = [x,y,z].join('|')
  var m = chunk._objectMeshes[key]

  if (window.DEBUG_OCTREES && chunk.octreeBlock) {
    var i = chunk.octreeBlock.entries.indexOf(m)
    if (i>=0) chunk.octreeBlock.entries.splice(i,1);
  }

  if (m) {
    m.dispose()
    delete(chunk._objectMeshes[key])
  }
}


// helper to add object meshes
function addObjectMeshAt(chunk, id, x,y,z) {
  var key = [x,y,z].join('|')
  var m = chunk.noa.rendering._makeMeshInstanceByID(id, true)
  // place object mesh's origin at bottom-center of block
  m.position.x = x + chunk.i*chunk.size + 0.5
  m.position.y = y + chunk.j*chunk.size
  m.position.z = z + chunk.k*chunk.size + 0.5
  // add them to tracking hash
  chunk._objectMeshes[key] = m

  if (window.DEBUG_OCTREES && chunk.octreeBlock) {
    chunk.octreeBlock.entries.push(m)
  }

  if (window.DEBUG_FREEZE && !m.billboardMode) m.freezeWorldMatrix();
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
 *        ao: whether or not to bake ambient occlusion into vertex colors
 *        aoValues: array of multipliers for AO levels 0-2 (0 is no occlusion)
 *
 *    Return object: array of mesh objects keyed by material ID
 *        arr[id].vertices - ints, range 0 .. X/Y/Z
 *        arr[id].indices  - ints
 *        arr[id].normals  - ints,   -1 .. 1
 *        arr[id].colors   - floats,  0 .. 1
 *        arr[id].uvs      - floats,  0 .. X/Y/Z
*/


var mask = new Int8Array(4096),
    aomask = new Int8Array(4096)

var d, u, v, 
    arrT, len0, len1, len2,
    i, j, k, n, 
    id0, id1, cmp, id, dir, maskVal, block, l, m, w, h,
    ao, jpos, jneg,
    ao00, ao01, ao10, ao11, du, dv, 
    x, q, m1, m2, pos, norm,
    matID, mesh, c, triDir, vs

var DEBUG = 1
if (DEBUG) { var t0=0, t1=0, t3=0, timeStart, time0, time1, time2, ct=0 }

function greedyND(arr, getMaterial, getColor, doAO, aoValues) {

  if (DEBUG) timeStart = performance.now()

  // return object, holder for Submeshes
  var submeshes = []

  //Sweep over each axis, mapping axes to [d,u,v]
  for(d=0; d<3; ++d) {
    u = (d+1)%3
    v = (d+2)%3

    // make transposed ndarray so index i is the axis we're sweeping
    var tmp = arr.transpose(d,u,v)
    arrT = tmp.lo(1,1,1).hi(tmp.shape[0]-2, tmp.shape[1]-2, tmp.shape[2]-2)
    len0 = arrT.shape[0]-1
    len1 = arrT.shape[1]
    len2 = arrT.shape[2]

    // preallocate mask arrays if needed
    if (mask.length < len1 * len2) {
      mask =   new Int8Array(len1*len2)
      aomask = new Int8Array(len1*len2)
    }

    // iterate along current major axis
    for( i=0; i<=len0; ++i ) {

      if (DEBUG) time0 = performance.now()

      // iterate across ith 2d plane, with n being index into masks
      n = 0;
      for(k=0; k<len2; ++k) {
        for(j=0; j<len1; ++j) {

          // mask[n] represents the face needed between i,j,k and i+1,j,k
          // for now, assume we never have two faces in both directions
          // So mask value is face material id, sign is direction

          id0 = arrT.get(i-1, j, k)
          id1 = arrT.get(  i, j, k)

          var op0 = id0 & OPAQUE_BIT
          var op1 = id1 & OPAQUE_BIT


          // draw no face if both blocks are opaque, or if ids match
          // otherwise, draw a face if one block is opaque or the other is air
          // (and the first isn't an object block)

          maskVal = 0

          if ( ! (id0===id1 || op0&&op1)) {
            if (op0 || (id1===0 && !(id0 & OBJECT_BIT) )) {
              id = id0 & ID_MASK
              maskVal =  getMaterial(id, d*2)
            }
            if (op1 || (id0===0 && !(id1 & OBJECT_BIT) )) {
              id = id1 & ID_MASK
              maskVal = -getMaterial(id, d*2+1)
            }
          }
          mask[n] = maskVal

          // if doing AO, for each box that needs a face precalculate the 
          // occluded-ness of its neighbors (on side the face points)

          if (maskVal && doAO) {

            l = (maskVal>0) ? i : i-1

            if (arrT.get(l,j,k) & SOLID_BIT) {
              // face points into non-zero block, so treat as fully occluded
              aomask[n] = 255 // i.e. (1<<8)-1, or 8 bits of occlusion
            } else {
              // construct aomask - mask of nonzero-ness of neighbors in "l" plane
              // shape: 
              //       1     2     4   ^ K
              //     128           8   +> J
              //      64    32    16
              ao = 0

              ao |= 
                (arrT.get(l, j-1, k+1) & SOLID_BIT  ?   1 : 0)  |
                (arrT.get(l,   j, k+1) & SOLID_BIT  ?   2 : 0)  |
                (arrT.get(l, j+1, k+1) & SOLID_BIT  ?   4 : 0)  |
                (arrT.get(l, j-1,   k) & SOLID_BIT  ? 128 : 0)  |
                (arrT.get(l, j+1,   k) & SOLID_BIT  ?   8 : 0)  |
                (arrT.get(l, j-1, k-1) & SOLID_BIT  ?  64 : 0)  |
                (arrT.get(l,   j, k-1) & SOLID_BIT  ?  32 : 0)  |
                (arrT.get(l, j+1, k-1) & SOLID_BIT  ?  16 : 0) 

              aomask[n] = ao
            }


          }
          // done, advance mask index
          ++n
        }
      }

      if (DEBUG) time1=performance.now()



      // Masks are set, now step through them generating meshes
      n = 0
      for(k=0; k<len2; ++k) {
        for(j=0; j<len1; ) {
          if (mask[n]) {

            maskVal = mask[n]
            dir = (maskVal > 0)
            ao = aomask[n]

            //Compute width of area with same mask/aomask values
            if (doAO) {
              for(w=1; maskVal==mask[n+w] && ao==aomask[n+w] && j+w<len1; ++w) { }
            } else {
              for(w=1; maskVal==mask[n+w] && j+w<len1; ++w) { }
            }

            // Compute height (this is slightly awkward)
            heightloop:
            for(h=1; k+h<len2; ++h) {
              for(m=0; m<w; ++m) {
                if (doAO) {
                  if(maskVal!=mask[n+m+h*len1] || (ao!=aomask[n+m+h*len1]) )
                    break heightloop;
                } else {
                  if(maskVal!=mask[n+m+h*len1]) 
                    break heightloop;
                }
              }
            }

            // for testing: doing the following will disable greediness
            //w=h=1

            // material and mesh for this face
            matID = Math.abs(maskVal)
            mesh = submeshes[matID]
            if (!mesh) mesh = submeshes[matID] = new Submesh(matID)
            c = getColor(matID)

            // push AO-modified vertex colors (or just colors)
            if (doAO) {
              ao00 = determineAO( ao,  0,  0 )
              ao10 = determineAO( ao,  1,  0 )
              ao11 = determineAO( ao,  1,  1 )
              ao01 = determineAO( ao,  0,  1 )
              pushAOColor( mesh.colors, c, ao00, aoValues )
              pushAOColor( mesh.colors, c, ao10, aoValues )
              pushAOColor( mesh.colors, c, ao11, aoValues )
              pushAOColor( mesh.colors, c, ao01, aoValues )
            } else {
              mesh.colors.push( c[0], c[1], c[2], 1 )
              mesh.colors.push( c[0], c[1], c[2], 1 )
              mesh.colors.push( c[0], c[1], c[2], 1 )
              mesh.colors.push( c[0], c[1], c[2], 1 )
            }

            //Add quad, vertices = x -> x+du -> x+du+dv -> x+dv
            x = [0,0,0]
            x[d] = i
            x[u] = j
            x[v] = k
            du = [0,0,0]; du[u] = w;
            dv = [0,0,0]; dv[v] = h;

            pos = mesh.positions
            pos.push(x[0],             x[1],             x[2],
                     x[0]+du[0],       x[1]+du[1],       x[2]+du[2],
                     x[0]+du[0]+dv[0], x[1]+du[1]+dv[1], x[2]+du[2]+dv[2],
                     x[0]      +dv[0], x[1]      +dv[1], x[2]      +dv[2]  )


            // add uv values
            if (d===0) {
              // draw +x/-x faces in different order, so that
              // texture-space's V axis matches world-space's Y
              mesh.uvs.push( 0, w )
              mesh.uvs.push( 0, 0 )
              mesh.uvs.push( h, 0 )
              mesh.uvs.push( h, w )
            } else {
              mesh.uvs.push( 0, h )
              mesh.uvs.push( w, h )
              mesh.uvs.push( w, 0 )
              mesh.uvs.push( 0, 0 )
            }

            // Add indexes, ordered clockwise for the facing direction;
            // decide which way to split the quad based on ao colors

            triDir = (doAO) ? (ao00==ao11) || ao01!=ao10 : true
            vs = pos.length/3 - 4

            if (maskVal<0) {
              if (triDir) {
                mesh.indices.push( vs, vs+1, vs+2, vs, vs+2, vs+3 )
              } else {
                mesh.indices.push( vs+1, vs+2, vs+3, vs, vs+1, vs+3 )
              }
            } else {
              if (triDir) {
                mesh.indices.push( vs, vs+2, vs+1, vs, vs+3, vs+2 )
              } else {
                mesh.indices.push( vs+3, vs+1, vs, vs+3, vs+2, vs+1 )
              }
            }

            // norms depend on which direction the mask was solid in..
            norm = [0,0,0]
            norm[d] = maskVal>0 ? 1 : -1
            // same norm for all vertices
            mesh.normals.push(norm[0], norm[1], norm[2], 
                              norm[0], norm[1], norm[2], 
                              norm[0], norm[1], norm[2], 
                              norm[0], norm[1], norm[2] )


            //Zero-out mask
            for(l=0; l<h; ++l) {
              for(m=0; m<w; ++m) {
                mask[n+m+l*len1] = 0
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

      if (DEBUG) time2 = performance.now();
      t0 += time1-time0; t1+=time2-time1

    }
  }

  if (DEBUG) {
    t3 += time2-timeStart; ct++
    console.log('avg masking:', f(t0/ct),
                ' - meshing:', f(t1/ct),
                ' - overall', f(t3/ct) )
  }

  // done, return array of submeshes
  return submeshes
}

function f(n) { return n.toFixed(2) }


//
// aomask shape: 
//       1     2     4   ^ K
//     128           8   +> J
//      64    32    16
//
var side1, side2, corner
function determineAO( aomask, jplus, kplus ) {
  side1 = aomask & ((jplus) ? 8 : 128) ? 1 : 0
  side2 = aomask & ((kplus) ? 2 : 32)  ? 1 : 0
  if (side1 && side2) return 3
  if (side1 || side2) return 1
  corner = aomask & ( jplus ?
                     (kplus ? 4 : 16) : (kplus ? 1 : 64) ) ? 1 : 0
  return corner ? 1 : 0
}

var mult
function pushAOColor( colors, baseCol, ao, aoVals ) {
  // ao values are 0/1/3 (most occluded); aoVals is [ least, medium, most ]
  mult = (ao<3) ? aoVals[ao] : aoVals[2]
  colors.push( baseCol[0]*mult, baseCol[1]*mult, baseCol[2]*mult, 1 )
}









