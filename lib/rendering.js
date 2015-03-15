'use strict';

var extend = require('extend')
var BABYLON = require('./babylon.2.1-alpha.debug')
// TODO: consider importing babylon in the HTML page, instead of browserifying it

module.exports = function(noa, opts, canvas) {
  return new Rendering(noa, opts, canvas)
}

var vec3 = BABYLON.Vector3
var col3 = BABYLON.Color3
var halfPi = Math.PI/2
window.BABYLON = BABYLON


var defaults = {
  antiAlias: true,
  clearColor:       [ 0.8, 0.9, 1],
  ambientColor:     [ 1, 1, 1 ],
  lightDiffuse:     [ 1, 1, 1 ],
  lightSpecular:    [ 1, 1, 1 ],
  groundLightColor: [ 0.5, 0.5, 0.5 ]
}


function Rendering(noa, _opts, canvas) {
  this.noa = noa
  var opts = extend( {}, defaults, _opts )

  // set up babylon scene
  initScene(this, canvas, opts)

  // Events and handling for meshing chunks when needed
  this._meshedChunks = {}
  this._chunksToMesh = []
  noa.world.on('chunkAdded',   onChunkAdded.bind(null, this) )
  noa.world.on('chunkRemoved', onChunkRemoved.bind(null, this) )
  noa.world.on('chunkChanged', onChunkChanged.bind(null, this) )

  // for debugging
  window.scene = this._scene
  // ad-hoc for now, will later be stored in registry?
  this._materials = []
  this._spriteManagers = []
}

// Constructor helper - set up the Babylon.js scene and basic components
function initScene(self, canvas, opts) {
  if (!BABYLON) throw new Error('BABYLON.js engine not found!')
  // init internal properties
  self._engine = new BABYLON.Engine(canvas, opts.antiAlias)
  self._scene =     new BABYLON.Scene( self._engine )
  // camera, and mesh holder to contain it
  self._cameraHolder = new BABYLON.Mesh('ch',self._scene)
  self._camera =    new BABYLON.FreeCamera('c', new vec3(0,0,0), self._scene)
  self._camera.minZ = .1 // distance from eyes to top of head
  self._camera.parent = self._cameraHolder
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

// accessor for client app to build meshes and register materials
Rendering.prototype.getScene = function() {
  return this._scene
}

// tick function manages deferred meshing
Rendering.prototype.tick = function(dt) {
  doDeferredMeshing(this)
}

Rendering.prototype.render = function() {
  var eye = this.noa.getPlayerEyePosition()
  this._cameraHolder.position = new vec3( eye[0], eye[1], eye[2] )

  this._engine.beginFrame()
  this._scene.render()
  this._engine.endFrame()
}

Rendering.prototype.resize = function(e) {
  this._engine.resize()
}

Rendering.prototype.highlightBlockFace = function(show, posArr, normArr) {
  var m = getHighlightMesh(this)
  if (show) {
    var pos=[]
    for (var i=0; i<3; ++i) {
      pos[i] = posArr[i] + .5 + (.501 * normArr[i])
    }
    m.position.copyFromFloats( pos[0], pos[1], pos[2] ) 
    m.rotation.x = (normArr[1]) ? halfPi : 0
    m.rotation.y = (normArr[0]) ? halfPi : 0
  }
  m.setEnabled(show)
}


Rendering.prototype.getCameraHolder = function() {
  // make/return a container object to hold/move/rotate the camera
  return this._cameraHolder
}

// 'zooms' camera by translating back relative to its holder
Rendering.prototype.setCameraZoomLevel = function(zoom) {
  this._camera.position.z = -zoom
  // if zoom is small, fade out player mesh
  var show = 3
  var hide = 1
  var pe = this.noa.playerEntity
  if (pe && pe.mesh) {
    var alpha = zoom>show ? 1 : zoom<hide ? 0 : (zoom-hide)/(show-hide)
    if (pe.mesh instanceof BABYLON.Sprite) pe.mesh.color.a = alpha
    if (pe.mesh instanceof BABYLON.AbstractMesh) {
      // may need something more abstract for real/complicated meshes
      if (pe.mesh.material) pe.mesh.material.alpha = alpha
    }
  }
}

/*
 *   Entity sprite/mesh management
*/

Rendering.prototype.makeEntitySprite = function(sheetname, cell) {
  var id = this.noa.registry._spritesheetIDs[sheetname]
  if (!this._spriteManagers[id]) {
    var dat = this.noa.registry._spritesheetData[id]
    this._spriteManagers[id] = 
      new BABYLON.SpriteManager("sprites"+id, dat.url, dat.count, dat.size, 
                                this._scene, undefined,
                                BABYLON.Texture.NEAREST_SAMPLINGMODE)
  }
  var mgr = this._spriteManagers[id]
  var sprite = new BABYLON.Sprite('spr',mgr)
  sprite.cellIndex = cell
  return sprite
}





/*
 *   CHUNK ADD/CHANGE/REMOVE HANDLING
*/ 

function onChunkAdded( self, chunk, id, x, y, z ) {
  // newly created chunks go to the end of the queue
  var o = { chunk:chunk, id:id, x:x, y:y, z:z }
  enqueueChunkUniquely( o, self._chunksToMesh, false )
}

function onChunkChanged( self, chunk, id, x, y, z ) {
  // changed chunks go to the head of the queue
  var o = { chunk:chunk, id:id, x:x, y:y, z:z }
  enqueueChunkUniquely( o, self._chunksToMesh, true )
}

function onChunkRemoved( self, id ) {
  removeMesh( self, id )
}

function doDeferredMeshing(self) {
  if (self._chunksToMesh.length===0) return
  // first in queue has priority
  var obj = self._chunksToMesh.shift()
  // remove current version if this is an update to an existing chunk
  if (self._meshedChunks[obj.id]) removeMesh(self, obj.id)
  // mesh it and add to babylon scene
  var meshdata = meshChunk(self, obj.chunk)
  if (meshdata.length) {
    var mesh = makeSubmeshes(self, meshdata, obj.id, obj.x, obj.y, obj.z)
    self._meshedChunks[obj.id] = mesh
  }
}


/*
 *   INTERNALS
*/ 


function enqueueChunkUniquely( obj, queue, infront ) {
  // remove any duplicate chunk descriptor objects
  for (var i=0; i<queue.length; ++i) {
    if (queue[i].id==obj.id) queue.splice(i--,1);
  }
  // add to front/end of queue
  if (infront) queue.unshift(obj)
  else queue.push(obj);
}


function removeMesh(self, id) {
  var m = self._meshedChunks[id]
  if (m) m.dispose()
  delete self._meshedChunks[id]
}


// given an updated chunk reference, run it through mesher
function meshChunk(self, chunk) {
  var noa = self.noa
  // first pass chunk data to mesher
  var aovals = [ 1, 0.8, 0.6 ]
  // TODO: pass in material/colors/chunk metadata somehow
  var matGetter = noa.registry.getBlockFaceMaterial.bind(noa.registry)
  var colGetter = noa.registry.getMaterialColor.bind(noa.registry)
  // returns an array of mesher#Submesh
  return noa.mesher.meshChunk( chunk, matGetter, colGetter, aovals )
}




// make or get a mesh for highlighting active voxel
function getHighlightMesh(rendering) {
  var m = rendering._highlightMesh
  if (!m) {
    var mesh = BABYLON.Mesh.CreatePlane("hl", 1.0, rendering._scene)
    var hlm = new BABYLON.StandardMaterial("hl_mat", rendering._scene)
    hlm.backFaceCulling = false
    hlm.emissiveColor = new col3(1,1,1)
    hlm.alpha = 0.2
    mesh.material = hlm
    m = rendering._highlightMesh = mesh
    // outline
    var s = 0.5
    var lines = BABYLON.Mesh.CreateLines("l", [
      new vec3( s, s, 0),
      new vec3( s,-s, 0),
      new vec3(-s,-s, 0),
      new vec3(-s, s, 0),
      new vec3( s, s, 0)
    ], rendering._scene)
    lines.color = new col3(1,1,1)
    lines.parent = mesh
  }
  return m
}







//
// Given arrays of data for an enmeshed chunk, create a 
// babylon mesh with each terrain material as a different submesh
//
function makeSubmeshes(self, meshdata, id, x, y, z) {
  var scene = self._scene
  // create/position mesh to new submeshes
  var mesh = new BABYLON.Mesh( 'm'+id, scene )
  // make collections of data arrays
  var ids       = [],
      positions = [],
      indices   = [],
      normals   = [],
      colors    = [],
      uvs       = []
  // loop through inputs collecting data (array of arrays)
  meshdata.map(function(mdat) {
    // mdat is instance of Mesher#Submesh
    ids.push(       mdat.id )
    positions.push( mdat.positions )
    indices.push(   mdat.indices )
    normals.push(   mdat.normals )
    colors.push(    mdat.colors )
    uvs.push(       mdat.uvs )
  })
  // make a big vdat and concat all the collected array data into it
  var vdat = new BABYLON.VertexData()
  var concat = Array.prototype.concat
  vdat.positions = concat.apply( [], positions )
  vdat.normals =   concat.apply( [], normals )
  vdat.colors =    concat.apply( [], colors )
  vdat.uvs =       concat.apply( [], uvs )
  // indices are relative, so offset each set after the first
  var offset = positions[0].length/3
  for (var i=1; i<indices.length; ++i) {
    for (var j=0; j<indices[i].length; ++j) {
      indices[i][j] += offset
    }
    offset += positions[i].length/3
  }
  vdat.indices = concat.apply( [], indices )
  // populate the mesh and give it the multi material
  vdat.applyToMesh( mesh )
  var mat = getMultiMaterial(self)
  mesh.material = mat
  // create the submeshes pointing to multimaterial IDs
  mesh.subMeshes = []
  var vertStart = 0
  var indStart = 0
  for (i=0; i<ids.length; ++i) {
    var matID = ids[i]
    var verts = positions[i].length / 3
    var inds = indices[i].length
    var sub = new BABYLON.SubMesh(matID, vertStart, verts, indStart, inds, mesh)
    vertStart += verts
    indStart += inds
  }
  // position parent and done
  if (x) mesh.position.x = x
  if (y) mesh.position.y = y
  if (z) mesh.position.z = z
  return mesh
}

function getMultiMaterial( rendering ) {
  var scene = rendering._scene
  var multi = rendering.multiMat
  if (!multi) {
    // create a multimate to use for terrain..
    multi = rendering.multiMat = new BABYLON.MultiMaterial("multi", scene)
    // base material
    var base = new BABYLON.StandardMaterial("base", scene)
    // little shine to remind myself this is an engine material
    base.specularColor = new col3( 0.15, 0.15, 0.15 )
    // clone a series, each with necessary texture
    var mats = rendering.noa.registry._matData
    for (var i=0; i<mats.length; ++i) {
      var dat = mats[i]
      var mat = base.clone('submat'+i)
      if (dat.texture) {
        mat.ambientTexture = new BABYLON.Texture(dat.texture, scene, true,false, BABYLON.Texture.NEAREST_SAMPLINGMODE)
      }
      multi.subMaterials[i] = mat
    }
  }
  return multi
}







