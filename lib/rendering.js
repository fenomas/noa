'use strict';

var extend = require('extend')

// assume Babylon is in target app for now... TODO - encapsulate the dependency
var BABYLON = require('./babylon.2.0-beta.debug-CJS')
//var BABYLON = window.BABYLON
if (!BABYLON) throw new Error('BABYLON.js engine not found!')

module.exports = function(engine, opts, canvas) {
  return new Rendering(engine, opts, canvas)
}


var vec3 = BABYLON.Vector3
var col3 = BABYLON.Color3
window.BABYLON = BABYLON


function Rendering(engine, _opts, canvas) {
  this.engine = engine

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
  this._initScene(canvas, opts)
  // for development
  window.scene = this._scene
}


Rendering.prototype._initScene = function(canvas, opts) {
  // init internal properties
  this._babEngine = new BABYLON.Engine(canvas, opts.antiAlias)
  this._scene =     new BABYLON.Scene( this._babEngine )
//  this._camera =    new BABYLON.FreeCamera('c', new vec3(0,0,0), this._scene)
  this._camera =    new BABYLON.ArcRotateCamera("c", 1, 0.8, 20, new vec3(7, 7, 7), this._scene)
  this._light =     new BABYLON.HemisphericLight('l', new vec3(0.1,1,0.3), this._scene )
  // apply some defaults
  function arrToColor(a) { return new col3( a[0], a[1], a[2] )  }
  this._scene.clearColor =  arrToColor( opts.clearColor )
  this._scene.ambientColor= arrToColor( opts.ambientColor )
  this._light.diffuse =     arrToColor( opts.lightDiffuse )
  this._light.specular =    arrToColor( opts.lightSpecular )
  this._light.groundColor = arrToColor( opts.groundLightColor )

}






/*
 *   PUBLIC API 
*/ 

Rendering.prototype.render = function() {
  this._babEngine.beginFrame()
  this._scene.render()
  this._babEngine.endFrame()
}


Rendering.prototype.addMeshFromData = function(meshData, x, z) {
  var m = new BABYLON.Mesh( 'm', this._scene )
  var dat = new BABYLON.VertexData()
  dat.positions = meshData.positions
  dat.indices = meshData.indices
  dat.normals = meshData.normals
  dat.colors = meshData.colors
//  if (dat.uvs)      dat.uvs = meshData.uvs
  dat.applyToMesh( m )
  if (x) m.position.x = x
  if (z) m  .position.z = z
}






