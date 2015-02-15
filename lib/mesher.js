'use strict';

var extend = require('extend')
var ndarray = require('ndarray')


module.exports = function(noa, opts) {
  return new Mesher(noa, opts)
}


function Mesher(noa, _opts) {
  this.noa = noa
  // default options
  var defaults = { }
  var opts = extend( {}, _opts, opts )
  //  this.x = opts.x
  }


//    PUBLIC API

Mesher.prototype.meshChunk = function(chunk, getMaterial, matColors, aoValues, noAO) {
  if (!aoValues) aoValues = [ 1, 0.75, 0.5 ]
  return greedyND(chunk, getMaterial, matColors, aoValues, !noAO)
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




/*
 *    Greedy voxel meshing algorithm with AO
 *        Meshing based on algo by Mikola Lysenko:
 *        http://0fps.net/2012/07/07/meshing-minecraft-part-2/
 *    
 *    Arguments:
 *        arr: 3D ndarray of block ID, dimensions X,Y,Z
 *             Assumes for now that truthy values are opaque.
 *        getMaterial: function( blockID, dir )
 *             returns a material ID based on block id and which cube face it is
 *             (assume for now that each mat ID should get its own mesh)
 *        aoValues: array of multipliers for AO levels 0-2 (0 is no occlusion)
 *        ao: whether or not to bake ambient occlusion into vertex colors
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


function greedyND(arr, getMaterial, matColors, aoValues, doAO) {
  var meshes = [] // return object, holder for Submeshes

  //Sweep over each axis, mapping axes to [d,u,v]
  for(d=0; d<3; ++d) {
    u = (d+1)%3
    v = (d+2)%3
    
    // make transposed ndarray so index i is the axis we're sweeping
    arrT = arr.transpose(d,u,v)
    len0 = arrT.shape[0]
    len1 = arrT.shape[1]
    len2 = arrT.shape[2]

    // preallocate mask arrays if needed
    if (mask.length < len1 * len2) {
      mask =   new Int8Array(len1*len2)
      aomask = new Int8Array(len1*len2)
    }

    // iterate along current axis
    for( i=0; i<=len0; ++i ) {

      // iterate across 2d plane, with n being index into masks
      n = 0;
      for(k=0; k<len2; ++k) {
        for(j=0; j<len1; ++j) {

          // set mask to 0 if no face needed (if id0/id1 have equal truthiness),
          // otherwise to material ID, with sign indicating face direction
          id0 = ( i<1     ? false : arrT.get(i-1, j, k))
          id1 = ( i==len0 ? false : arrT.get(  i, j, k))
          cmp = id0 ? (id1 ? 0 : 1) : (id1 ? -1 : 0)
          if (cmp === 0) {
            mask[n] = 0
          } else {
            // convert id. face is 0..5 ==> +x, -x, +y, -y, +z, -z 
            block = (id0) ? id0 : id1
            dir = d*2 + (cmp>0 ? 0 : 1)
            mask[n] = cmp * getMaterial(block,dir)
          }
          

          if (mask[n] && doAO) {
            // construct ao mask from data on the non-opaque side of the face
            l = (mask[n]>0) ? i : i-1
            if (l<0 || l==len0) aomask[n] = 0
            else {

              // construct aomask - mask of opacity of neighbors in "l" plane
              // shape: 
              //       1     2     4   ^ K
              //     128           8   +> J
              //      64    32    16
              ao = 0
              jpos = (j>0)
              jneg = (j<len1-1)
              if (k>0) {
                ao |= 
                  (         arrT.get( l,   j, k-1 ) ? 32 : 0 ) |
                  ( jpos && arrT.get( l, j-1, k-1 ) ? 64 : 0 ) |
                  ( jneg && arrT.get( l, j+1, k-1 ) ? 16 : 0 )  
              }
              if (k<len2-1) {
                ao |= 
                  (         arrT.get( l,   j, k+1 ) ?  2 : 0 ) |
                  ( jpos && arrT.get( l, j-1, k+1 ) ?  1 : 0 ) |
                  ( jneg && arrT.get( l, j+1, k+1 ) ?  4 : 0 ) 
              }
              ao |= 
                ( jpos  && arrT.get( l, j-1, k ) ? 128 : 0 ) |
                ( jneg  && arrT.get( l, j+1, k ) ?   8 : 0 ) 

              aomask[n] = ao
            }

          }
          // done, advance mask index
          ++n
        }
      }

      // Masks are set, now step through them generating meshes
      n = 0
      for(k=0; k<len2; ++k)
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

            // material and mesh for this face
            matID = Math.abs(maskVal)
            mesh = meshes[matID]
            if (!mesh) mesh = meshes[matID] = new Submesh(matID)
            c = matColors[matID]
            
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
                mask[n+m+l*len1] = false
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
  // done, return array of submeshes
  return meshes
}




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




