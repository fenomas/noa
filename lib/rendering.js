'use strict';
/* globals BABYLON */

var extend = require('extend')
var glvec3 = require('gl-vec3')

// For now, assume Babylon.js has been imported into the global space already
if (!BABYLON) {
  throw new Error('Babylon.js reference not found! Abort! Abort!')
}

module.exports = function(noa, opts, canvas) {
  return new Rendering(noa, opts, canvas)
}

var vec3 = BABYLON.Vector3 // not a gl-vec3, in this module only!!
var col3 = BABYLON.Color3
var halfPi = Math.PI/2
window.BABYLON = BABYLON


var defaults = {
  antiAlias: true,
  clearColor:       [ 0.8, 0.9, 1],
  ambientColor:     [ 1, 1, 1 ],
  lightDiffuse:     [ 1, 1, 1 ],
  lightSpecular:    [ 1, 1, 1 ],
  groundLightColor: [ 0.5, 0.5, 0.5 ],
  // camera 'zoom' stuff
  minCameraZoom: 0,
  maxCameraZoom: 10,
  cameraZoomStep: 1.5,
  cameraZoomSpeed: .3
}


function Rendering(noa, _opts, canvas) {
  this.noa = noa
  var opts = extend( {}, defaults, _opts )
  this._zoomDistance = opts.minCameraZoom
  this._zoomTarget = opts.minCameraZoom
  this._zoomMin = opts.minCameraZoom
  this._zoomMax = opts.maxCameraZoom
  this._zoomStep = opts.cameraZoomStep
  this._zoomSpeed = opts.cameraZoomSpeed

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
  self._scene =  new BABYLON.Scene( self._engine )
  // camera and empty mesh to hold camera rotations
  self._rotationHolder = new BABYLON.Mesh('',self._scene)
  self._camera = new BABYLON.FreeCamera('c', new vec3(0,0,0), self._scene)
  self._camera.minZ = .01
  // apply some defaults
  self._light = new BABYLON.HemisphericLight('l', new vec3(0.1,1,0.3), self._scene )
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
  findMaxZoomDistance(this)

  // chunk a mesh, or a few if they're fast
  var time = performance.now()
  while(this._chunksToMesh.length && (performance.now() < time+3)) {
    doDeferredMeshing(this)
  }
}

Rendering.prototype.render = function(dt) {
  updateCamera(this)
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
      pos[i] = posArr[i] + .5 + (.505 * normArr[i])
    }
    m.position.copyFromFloats( pos[0], pos[1], pos[2] ) 
    m.rotation.x = (normArr[1]) ? halfPi : 0
    m.rotation.y = (normArr[0]) ? halfPi : 0
  }
  m.setEnabled(show)
}


Rendering.prototype.getCameraVector = function() {
  var vec = new vec3(0,0,1)
  return vec3.TransformCoordinates(vec, this._rotationHolder.getWorldMatrix())
}
Rendering.prototype.getCameraRotation = function() {
  var rot = this._rotationHolder.rotation
  return [ rot.x, rot.y ]
}
Rendering.prototype.setCameraRotation = function(x,y) {
  var rot = this._rotationHolder.rotation
  rot.x = x
  rot.y = y
}

// change 'zoom' level based on scroll inputs
Rendering.prototype.zoomInOrOut = function(dir) {
  if (!dir) return
  var z = this._zoomTarget
  z += (dir>0) ? this._zoomStep : -this._zoomStep
  if (z<this._zoomMin) z = this._zoomMin
  if (z>this._zoomMax) z = this._zoomMax
  this._zoomTarget = z
}



/*
 *   Entity sprite/mesh management
 *   Makes a sprite-like mesh with billboarding set to face camera
*/

Rendering.prototype.makeEntitySpriteMesh = function(matname, cellw, cellh, cellnum) {
  var id = this.noa.registry.getMaterialId(matname)
  var url = this.noa.registry.getMaterialTexture(id)
  var tex = new BABYLON.Texture(url, this._scene, true, true, 
                                BABYLON.Texture.NEAREST_SAMPLINGMODE)
  tex.hasAlpha = true
  var mat = new BABYLON.StandardMaterial('', this._scene)
  var mesh = BABYLON.Mesh.CreatePlane('esm', 1, this._scene)
  mat.diffuseTexture = tex
  mat.useAlphaFromDiffuseTexture = true
  mat.specularColor = new col3(0,0,0)
  mat.emissiveColor = new col3(1,1,1)
  mat.backFaceCulling = false
  mesh.material = mat
  mesh.billboardMode = BABYLON.Mesh.BILLBOARDMODE_Y
  mesh._cellwidth = cellw
  mesh._cellheight = cellh
  mesh._lastcell = -1
  mesh._setCell = setSpriteMeshCell.bind(mesh)
//  mesh._setCell(cellnum)
  return mesh
}

function setSpriteMeshCell(cell) {
  /* jshint validthis:true */
  if (cell==this._lastcell) return
  var tex = this.material.diffuseTexture
  if (!tex.isReady()) { return }
  var s = tex.getSize()
  var cols = s.width/this._cellwidth
  var rows = s.height/this._cellheight
  tex.uScale = 1/cols
  tex.vScale = 1/rows
  var wholecols = cols>>0
  var upos = cell % wholecols
  var vpos = Math.floor(cell/wholecols)
  tex.uOffset =  cols/2 - upos - 0.5
  tex.vOffset = -rows/2 + vpos + 0.5
  this._lastcell = cell
}



Rendering.prototype.makeMeshInstance = function(meshname) {
  var mesh = this.noa.registry._getMesh(meshname)
  return mesh.createInstance('')
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


// zoom/camera related internals

function getMeshEyePosition(self) {
  // eye position relative to player mesh (not physics body)
  var pos = self.noa.playerEntity.mesh.position.clone() // mesh center
  pos.y += .4 * self.noa.playerEntity.bb.vec[1] // center+.4*height
  return pos
}

function findMaxZoomDistance(self) {
  // pick backwards from eye position to camera zoom depth
  var pos = getMeshEyePosition(self)
  var cam = self.getCameraVector().scaleInPlace(-1)
  // need gl-vec3 vectors to pass to noa#pick
  var vpos = glvec3.fromValues(pos.x, pos.y, pos.z)
  var vcam = glvec3.fromValues(cam.x, cam.y, cam.z)
  var result = self.noa.pick(vpos, vcam, self._zoomTarget)
  var z = self._zoomTarget
  if (result) {
    var dist = glvec3.distance( vpos, result.position )
    dist -= 0.2 // slop to cut down on seeing through floors
    z = Math.min(dist, self._zoomTarget)
  }
  self._zoomDistance += self._zoomSpeed * (z-self._zoomDistance)
}

function updateCamera(self) {
  // vecs for camera position and camera target behind and in front of player mesh
  var pos = getMeshEyePosition(self)
  var cam = self.getCameraVector()
  // camera pos target = eyePosition - cameraVec * zoomDistance
  var cpos = pos.subtract( cam.scale(self._zoomDistance) )
  var tgt = pos.add( cam.scale(.1) )
  // lerp actual camera position/target towards values
  self._camera.position.copyFrom(cpos)
  self._camera.setTarget(tgt)
  fadePlayerMesh(self)
}

function fadePlayerMesh(self) {
  // fade player model when zoomed in close
  var m = self.noa.playerEntity.mesh
  if (!m) return
  var show = 3
  var hide = 2
  var z = self._zoomDistance
  m.visibility = (z>hide)
  if (m.material) {
    m.material.alpha = (z>show) ? 1 : (z<=hide) ? 0 : (z-hide)/(show-hide)
  }
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







