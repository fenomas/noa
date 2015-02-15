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


Rendering.prototype.addMeshDataArray = function(meshArr, x, y, z) {
  // meshArr is what comes from mesher - sparsely keyed
  for (var i in meshArr) {
    // mdat is instance of Mesher#Submesh
    var mdat = meshArr[i]
    // get or create babylon material
    var mat = getMaterial(this, mdat.id)

    var m = new BABYLON.Mesh( 'mesh_'+mdat.id, this._scene )
    m.material = mat
    
    var vdat = new BABYLON.VertexData()
    vdat.positions = mdat.positions
    vdat.indices =   mdat.indices
    vdat.normals =   mdat.normals
    vdat.colors =    mdat.colors
    vdat.uvs =       mdat.uvs
    
    vdat.applyToMesh( m )
    if (x) m.position.x = x
    if (y) m.position.y = y
    if (z) m.position.z = z
  }
}


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



