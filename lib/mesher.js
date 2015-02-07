'use strict';

var extend = require('extend')
var ndarray = require('ndarray')


module.exports = function(engine, opts) {
  return new Mesher(engine, opts)
}


function Mesher(engine, _opts) {
  this.engine = engine
  // default options
  var defaults = { }
  var opts = extend( {}, _opts, opts )
  //  this.x = opts.x
  }


//    PUBLIC API

Mesher.prototype.meshChunk = function(chunk, useOld) {
  if (useOld) return greedy(chunk)

  return greedyND(chunk)
}




/*
 *    Greedy voxel meshing algorithm
 *    Based on algo by Mikola Lysenko, described here:
 *        http://0fps.net/2012/07/07/meshing-minecraft-part-2/
 *    and implemented here:
 *        https://github.com/mikolalysenko/mikolalysenko.github.com/blob/gh-pages/MinecraftMeshes/js/greedy.js
 *    Also see previous babylonjs implementation here:
 *        https://github.com/TriBlade9/CEWBS
 *    
 *    Arguments:
 *        arr: 3D ndarray of dimensions X,Y,Z
 *
 *    Return object:
 *        obj.vertices - ints, range 0 .. X/Y/Z
 *        obj.indices  - ints
 *        obj.normals  - ints,   -1 .. 1
 *        obj.colors   - floats,  0 .. 1
 *        obj.uvs      - floats,  0 .. X/Y/Z
*/

var mask = new Int32Array(4096)
var d, n, i, j, k, l, m, w, h, u, v, x, q, m1, m2, norm

function greedy(arr) {
  var pos = [], indices = [], norms = [], colors = [], uvs = []
  var dims = arr.shape

  //Sweep over each axis, mapping axes to [d,u,v]
  for(d=0; d<3; ++d) {
    u = (d+1)%3
    v = (d+2)%3
    x = [0,0,0] // mapped indices for iterating through slices of data
    q = [0,0,0] // mapped index offsets
    //    if (mask.length < dims[u] * dims[u]) {
    mask = new Int32Array(dims[u] * dims[u]);
    //    }
    q[d] = 1
    for(x[d]=-1; x[d]<dims[d]; ) {
      //Compute mask
      n = 0;
      for(x[v]=0; x[v]<dims[v]; ++x[v])
        for(x[u]=0; x[u]<dims[u]; ++x[u]) {
          //          mask[n++] =
          //            (0    <= x[d]      ? arr.get(x[0],      x[1],      x[2])      : false) !=
          //            (x[d] <  dims[d]-1 ? arr.get(x[0]+q[0], x[1]+q[1], x[2]+q[2]) : false);
          var m1 = 0    <= x[d]      ? arr.get(x[0],      x[1],      x[2])      : false
          var m2 = x[d] <  dims[d]-1 ? arr.get(x[0]+q[0], x[1]+q[1], x[2]+q[2]) : false
          mask[n++] = (m1 != m2) ? (m1 ? 1 : -1)  : false    // (true if we need a face between m1/m2
        }
      //Increment x[d]
      ++x[d];
      //Generate mesh for mask using lexicographic ordering
      n = 0;
      for(j=0; j<dims[v]; ++j)
        for(i=0; i<dims[u]; ) {
          if(mask[n]) {
            //Compute width
            for(w=1; mask[n+w] && i+w<dims[u]; ++w) {
            }
            //Compute height (this is slightly awkward
            var done = false;
            for(h=1; j+h<dims[v]; ++h) {
              for(k=0; k<w; ++k) {
                if(!mask[n+k+h*dims[u]]) {
                  done = true;
                  break;
                }
              }
              if(done) {
                break;
              }
            }
            //Add quad, vertices = x -> x+du -> x+du+dv -> x+dv
            x[u] = i;  x[v] = j;
            var du = [0,0,0]; du[u] = w;
            var dv = [0,0,0]; dv[v] = h;

            pos.push(x[0],             x[1],             x[2],
                     x[0]+du[0],       x[1]+du[1],       x[2]+du[2],
                     x[0]+du[0]+dv[0], x[1]+du[1]+dv[1], x[2]+du[2]+dv[2],
                     x[0]      +dv[0], x[1]      +dv[1], x[2]      +dv[2]  )

            var vs = pos.length/3 - 4

            // facing of tris depends on clockwise order of indices
            if (mask[n]>0) {
              indices.push( vs, vs+2, vs+1, vs, vs+3, vs+2 )
            } else {
              indices.push( vs, vs+1, vs+2, vs, vs+2, vs+3 )
            }

            // norms depend on which direction the mask was solid in..
            norm = [0,0,0]
            norm[d] = (mask[n]>0) ? 1 : -1
            // same norm for all vertices
            norms.push(norm[0], norm[1], norm[2], 
                       norm[0], norm[1], norm[2], 
                       norm[0], norm[1], norm[2], 
                       norm[0], norm[1], norm[2] )


            var c = 0.7
            colors.push(c, c, c, 1, 
                        c, c, c, 1, 
                        c, c, c, 1, 
                        c, c, c, 1 )


            //Zero-out mask
            for(l=0; l<h; ++l)
              for(k=0; k<w; ++k) {
                mask[n+k+l*dims[u]] = false
              }
            //Increment counters and continue
            i += w
            n += w
          } else {
            ++i;
            ++n
          }
        }
    }
  }


  // return mesh data
  return {
    positions:  pos,
    indices:    indices,
    normals:    norms,
    colors:     colors,
    uvs:        uvs
  }
}






var aomask = new Int32Array(4096)
var ao, m0, m1

function greedyND(arr) {
  var pos = [], indices = [], norms = [], colors = [], uvs = []

  //Sweep over each axis, mapping axes to [d,u,v]
  for(d=0; d<3; ++d) {
    u = (d+1)%3
    v = (d+2)%3
    // array, transposed so index i is the axis we're sweeping
    var arrT = arr.transpose(d,u,v)
    var len0 = arrT.shape[0]
    var len1 = arrT.shape[1]
    var len2 = arrT.shape[2]
    if (mask.length < len1 * len2) {
      mask =   new Int32Array(len1*len2)
      aomask = new Int32Array(len1*len2)
    }
    for( i=0; i<=len0; ++i ) {
      // make a safe (wrapped) getter for later
      var f = makeSafeGetter( arrT )

      n = 0;
      for(k=0; k<len2; ++k) {
        for(j=0; j<len1; ++j) {

          m0 = ( i<1     ? false : arrT.get(i-1, j, k))
          m1 = ( i==len0 ? false : arrT.get(  i, j, k))

          if (m0 != m1) {
            // new quad will be made

            mask[n] = (m0) ? 1 : -1

            l = (m0) ? i : i-1
            if (l<0 || l==len0) {
              aomask[n] = 0
            } else {

              // construct aomask - mask of opacity of neighbors in "l" plane
              // shape: 
              //       1     2     4   ^ K
              //     128           8   +> J
              //      64    32    16
              ao = 0
              var jpos = (j>0)
              var jneg = (j<len1-1)
              if (k>0) {
                ao |= 
                  (          arrT.get( l,   j, k-1 ) ? 32 : 0 ) |
                  ( jpos  && arrT.get( l, j-1, k-1 ) ? 64 : 0 ) |
                  ( jneg  && arrT.get( l, j+1, k-1 ) ? 16 : 0 )  
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

          } else {
            // no new quad needed for this face
            mask[n] = false
          }
          // advance mask index
          ++n
        }
      }

      // Generate mesh for mask using lexicographic ordering
      n = 0
      for(k=0; k<len2; ++k)
        for(j=0; j<len1; ) {
          if (mask[n]) {

            // dir>0 if new quad will face in direction we're sweeping
            var dir = mask[n] // -1 or 1

            // AO mask for block in facing direction
            ao = aomask[n]

            //Compute width of area with same mask/aomask values
            for(w=1; mask[n+w] && (ao==aomask[n+w] && j+w<len1); ++w) { /* nop */ }

            // Compute height (this is slightly awkward)
            var done = false;
            for(h=1; k+h<len2; ++h) {
              for(m=0; m<w; ++m) {
                if(!mask[n+m+h*len1] || (ao!=aomask[n+m+h*len1]) ) {
                  done = true
                  break
                }
              }
              if(done) { break }
            }


            // push colors based on AO values determined from aomask
            var ao00 = pushAOColor( colors, ao,  0,  0 )
            var ao10 = pushAOColor( colors, ao,  1,  0 )
            var ao11 = pushAOColor( colors, ao,  1,  1 )
            var ao01 = pushAOColor( colors, ao,  0,  1 )
            
            
            //Add quad, vertices = x -> x+du -> x+du+dv -> x+dv
            x = [0,0,0]
            x[d] = i
            x[u] = j
            x[v] = k
            var du = [0,0,0]; du[u] = w;
            var dv = [0,0,0]; dv[v] = h;

            pos.push(x[0],             x[1],             x[2],
                     x[0]+du[0],       x[1]+du[1],       x[2]+du[2],
                     x[0]+du[0]+dv[0], x[1]+du[1]+dv[1], x[2]+du[2]+dv[2],
                     x[0]      +dv[0], x[1]      +dv[1], x[2]      +dv[2]  )

            var vs = pos.length/3 - 4


            // order of indices so they are clockwise for the facing direction;
            // decide which way to split the quad based on ao colors

            var triDir = (ao00==ao11) || ao01!=ao10

            if (dir<0) {
              if (triDir) {
                indices.push( vs, vs+1, vs+2, vs, vs+2, vs+3 )
              } else {
                indices.push( vs+1, vs+2, vs+3, vs, vs+1, vs+3 )
              }
            } else {
              if (triDir) {
                indices.push( vs, vs+2, vs+1, vs, vs+3, vs+2 )
              } else {
                indices.push( vs+3, vs+1, vs, vs+3, vs+2, vs+1 )
              }
            }

            // norms depend on which direction the mask was solid in..
            norm = [0,0,0]
            norm[d] = dir
            // same norm for all vertices
            norms.push(norm[0], norm[1], norm[2], 
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
  // return mesh data
  return {
    positions:  pos,
    indices:    indices,
    normals:    norms,
    colors:     colors,
    uvs:        uvs
  }
}



// wrap an ndarray
function makeSafeGetter( arr ) {
  var l0 = arr.shape[0]
  var l1 = arr.shape[1]
  var l2 = arr.shape[2]
  return function(x,y,z) {
    if (x<0 || x>=l0) return false
    if (y<0 || y>=l1) return false
    if (z<0 || z>=l2) return false
    return arr.get(x,y,z)
  }
}

//
// aomask shape: 
//       1     2     4   ^ K
//     128           8   +> J
//      64    32    16
//
var aoval, side1, side2, corner
function pushAOColor( colArr, aomask, jplus, kplus ) {
  side1 = aomask & ((jplus) ? 8 : 128) ? 1 : 0
  side2 = aomask & ((kplus) ? 2 : 32)  ? 1 : 0
  if (side1 && side2) {
    aoval = 3
  } else if (side1 || side2) {
    aoval = 1
  } else {
    corner = aomask & ( jplus ?
                       (kplus ? 4 : 16) : (kplus ? 1 : 64) ) ? 1 : 0
    aoval = (corner) ? 1 : 0
  }
  var c3 = 0.4
  var c1 = 0.6
  var c0 = 0.7
  //  if (aoval===3) { colArr.push( 1, c3, c3, 1 ) }
  //  if (aoval===1) { colArr.push( c1, c1, 1, 1 ) }
  if (aoval===3) { colArr.push( c3, c3, c3, 1 ) }
  if (aoval===1) { colArr.push( c1, c1, c1, 1 ) }
  if (aoval===0) { colArr.push( c0, c0, c0, 1 ) }
  return aoval
}







