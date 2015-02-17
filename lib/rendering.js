'use strict';

var extend = require('extend')

// assume Babylon is in target app for now... TODO - encapsulate the dependency
var BABYLON = require('./babylon.2.0-beta.debug-CJS')
//var BABYLON = window.BABYLON
if (!BABYLON) throw new Error('BABYLON.js engine not found!')

module.exports = function(noa, opts, canvas) {
  return new Rendering(noa, opts, canvas)
}


var vec3 = BABYLON.Vector3
var col3 = BABYLON.Color3
window.BABYLON = BABYLON


function Rendering(noa, _opts, canvas) {
  this.noa = noa

  // default options
  var defaults = {
    antiAlias: true,
    clearColor:       [ 0.8, 0.9, 1],
    ambientColor:     [ 1, 1, 1 ],
    lightDiffuse:     [ 1, 1, 1 ],
    lightSpecular:    [ 1, 1, 1 ],
    groundLightColor: [ 0.5, 0.5, 0.5 ]
  }
  var opts = extend( {}, defaults, _opts )
  initScene(this, canvas, opts)
  // for development
  window.scene = this._scene
  // ad-hoc for now, will later be stored in registry?
  this._materials = []
}


function initScene(self, canvas, opts) {
  // init internal properties
  self._engine = new BABYLON.Engine(canvas, opts.antiAlias)
  self._scene =     new BABYLON.Scene( self._engine )
  self._camera =    new BABYLON.FreeCamera('c', new vec3(0,0,0), self._scene)
  //  self._camera =    new BABYLON.ArcRotateCamera("c", 1, 0.8, 20, new vec3(0, 0, 0), self._scene)
  self._light =     new BABYLON.HemisphericLight('l', new vec3(0.1,1,0.3), self._scene )
  // apply some defaults
  function arrToColor(a) { return new col3( a[0], a[1], a[2] )  }
  self._scene.clearColor =  arrToColor( opts.clearColor )
  self._scene.ambientColor= arrToColor( opts.ambientColor )
  self._light.diffuse =     arrToColor( opts.lightDiffuse )
  self._light.specular =    arrToColor( opts.lightSpecular )
  self._light.groundColor = arrToColor( opts.groundLightColor )

}






/*
 *   PUBLIC API 
*/ 

Rendering.prototype.render = function() {
  var cpos = this.noa.getCameraPosition()
  this._camera.position.copyFromFloats( cpos[0], cpos[1], cpos[2] )

  this._engine.beginFrame()
  this._scene.render()
  this._engine.endFrame()
}

Rendering.prototype.resize = function(e) {
  this._engine.resize()
}


Rendering.prototype.updateMeshDataArr = function(meshArr, id, x, y, z) {
  var m = this._scene.getMeshByName('m_'+id)
  if (m) m.dispose()
  this.addMeshDataArray(meshArr, id, x, y, z)
}

Rendering.prototype.addMeshDataArray = function(meshArr, id, x, y, z) {
  //  return this.addMultiMesh(meshArr,x,y,z)
  
  // holder mesh - this is what we dispose to get rid of the whole mesh chunk
  var chunkMesh = new BABYLON.Mesh( 'm_'+id, this._scene )
  // meshArr is what comes from mesher - sparsely keyed
  for (var i in meshArr) {
    // mdat is instance of Mesher#Submesh
    var mdat = meshArr[i]
    // get or create babylon material
    var mat = getMaterial(this, mdat.id)
    
    var m = new BABYLON.Mesh( "sub", this._scene )
    m.material = mat
    m.parent = chunkMesh

    var vdat = new BABYLON.VertexData()
    vdat.positions = mdat.positions
    vdat.indices =   mdat.indices
    vdat.normals =   mdat.normals
    vdat.colors =    mdat.colors
    vdat.uvs =       mdat.uvs

    vdat.applyToMesh( m )
    if (x) m.position.x = x
    if (y) m.position.y = y
    if (z) m.position.z = z;
  }
}



// internal helper..
function getMaterial( rendering, id ) {
  var mat = rendering._materials[id]
  if (!mat) {
    var scene = rendering._scene
    // make a new material
    mat = new BABYLON.StandardMaterial("mat_"+id, scene)
    // little shine to remind myself this is an engine material
    mat.specularColor = new col3( 0.15, 0.15, 0.15 )
    // apply texture if there is one
    var tex = rendering.noa.materialTextures[id]
    if (tex) {
      mat.ambientTexture = new BABYLON.Texture(tex, scene, true,false,BABYLON.Texture.NEAREST_SAMPLINGMODE)
    }
    rendering._materials[id] = mat
  }
  return mat
}



Rendering.prototype.highlightBlock = function(show,x,y,z) {
  var m = getHighlightMesh(this)
  if (show) {
    m.position.x = x + 0.5
    m.position.y = y + 0.5
    m.position.z = z + 0.5
  }
  m.visibility = show
}

// internal helper..
function getHighlightMesh(rendering) {
  var m = rendering._highlightMesh
  if (!m) {
    var box = BABYLON.Mesh.CreateBox("hl", 1.0, rendering._scene)
    box.scaling = new vec3( 1.01, 1.01, 1.01 )
    var hlm = new BABYLON.StandardMaterial("hl_mat", rendering._scene)
    hlm.wireframe = true
    hlm.diffuseColor = new col3(1,0,0)
    box.material = hlm
    m = rendering._highlightMesh = box
  }
  return m
}







//
// Experimental Multi-material version that didn't help performance..
//
//Rendering.prototype.addMultiMesh = function(meshArr, x, y, z) {
//  var scene = this._scene
//  // mesh to contain combined inputted geometries
//  var mesh = new BABYLON.Mesh( 'm'+[x,y,z].join('-'), scene )
//  // make collections of data arrays
//  var ids       = [],
//      positions = [],
//      indices   = [],
//      normals   = [],
//      colors    = [],
//      uvs       = []
//  // loop through inputs collecting data (array of arrays)
//  for (var i in meshArr) {
//    var mdat = meshArr[i]
//    // mdat is instance of Mesher#Submesh
//    ids.push(       mdat.id )
//    positions.push( mdat.positions )
//    indices.push(   mdat.indices )
//    normals.push(   mdat.normals )
//    colors.push(    mdat.colors )
//    uvs.push(       mdat.uvs )
//  }
//  // make a big vdat and concat all the collected array data into it
//  var vdat = new BABYLON.VertexData()
//  var arr = []
//  vdat.positions = arr.concat.apply( [], positions )
//  vdat.indices =   arr.concat.apply( [], indices )
//  vdat.normals =   arr.concat.apply( [], normals )
//  vdat.colors =    arr.concat.apply( [], colors )
//  vdat.uvs =       arr.concat.apply( [], uvs )
//  // populate the mesh and give it the multi material
//  vdat.applyToMesh( mesh )
//  var mat = getMultiMaterial(this)
//  mesh.material = mat
//  // create the submeshes pointing to multimaterial IDs
//  var vertStart = 0
//  var indStart = 0
//  for (i=0; i<ids.length; ++i) {
//    var matID = ids[i]
////    var verts = positions[i].length / 3
////    var verts = vdat.positions.length / 3
//    var verts = mesh.getTotalVertices()
//    var inds = indices[i].length
//    var sub = new BABYLON.SubMesh(matID, vertStart, verts, indStart, inds, mesh)
//    vertStart += verts
//    indStart += inds
////    mesh.subMeshes.push(sub)
//  }
////  throw new Error()
//  // position the created mesh
//  if (x) mesh.position.x = x
//  if (y) mesh.position.y = y
//  if (z) mesh.position.z = z;
//}
//
//function getMultiMaterial( rendering ) {
//  var scene = rendering._scene
//  var multi = rendering.multiMat
//  if (!multi) {
//    // create a multimate to use for terrain..
//    multi = rendering.multiMat = new BABYLON.MultiMaterial("multi", scene)
//    // base material
//    var base = new BABYLON.StandardMaterial("base", scene)
//    // little shine to remind myself this is an engine material
//    base.specularColor = new col3( 0.15, 0.15, 0.15 )
//    // clone a series, each with necessary texture
//    var texarr = rendering.noa.materialTextures
//    for (var i=0; i<texarr.length; ++i) {
//      var mat = base.clone('submat'+i)
//      if (texarr[i]) {
//        mat.ambientTexture = new BABYLON.Texture(texarr[i], scene, true,false, BABYLON.Texture.NEAREST_SAMPLINGMODE)
//      }
//      multi.subMaterials.push(mat)
//    }
//  }
//  return multi
//}







