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
  minCameraZoom: 0,
  cameraZoomSpeed: .3,
  useAO: true,
  AOmultipliers: [ 1, 0.8, 0.6 ],
}





function Rendering(noa, _opts, canvas) {
  this.noa = noa
  var opts = extend( {}, defaults, _opts )
  this.zoomDistance = opts.minCameraZoom      // zoom setting
  this._cappedZoom = this.zoomDistance        // zoom, capped by obstacles
  this._currentZoom = this.zoomDistance       // current actual zoom level
  this._cameraZoomSpeed = opts.cameraZoomSpeed

  // set up babylon scene
  initScene(this, canvas, opts)

  // Events and handling for meshing chunks when needed
  this._meshedChunks = {}
  this._chunksToMesh = []
  noa.world.on('chunkAdded',   onChunkAdded.bind(null, this) )
  noa.world.on('chunkRemoved', onChunkRemoved.bind(null, this) )
  noa.world.on('chunkChanged', onChunkChanged.bind(null, this) )

  // internals
  this._materialCache = {}
  this.doAO = !!opts.useAO
  this.aoVals = opts.AOmultipliers

  if (DEBUG_OCTREES) {
    this._octree = new BABYLON.Octree()
    this._octree.blocks = []
    this._scene._selectionOctree = this._octree
  }

  // for debugging
  window.scene = this._scene
}


// Constructor helper - set up the Babylon.js scene and basic components
function initScene(self, canvas, opts) {
  if (!BABYLON) throw new Error('BABYLON.js engine not found!')

  // init internal properties
  self._engine = new BABYLON.Engine(canvas, opts.antiAlias)
  self._scene =  new BABYLON.Scene( self._engine )

  // camera and empty mesh to hold camera rotations
  self._rotationHolder = new BABYLON.Mesh('rotHolder',self._scene)
  self._cameraHolder = new BABYLON.Mesh('camHolder',self._scene)
  self._camera = new BABYLON.FreeCamera('c', new vec3(0,0,0), self._scene)
  self._camera.parent = self._cameraHolder
  self._camera.minZ = .01
  self._cameraHolder.visibility = false
  self._rotationHolder.visibility = false

  // apply some defaults
  self._light = new BABYLON.HemisphericLight('l', new vec3(0.1,1,0.3), self._scene )
  function arrToColor(a) { return new col3( a[0], a[1], a[2] )  }
  self._scene.clearColor =  arrToColor( opts.clearColor )
  self._scene.ambientColor= arrToColor( opts.ambientColor )
  self._light.diffuse =     arrToColor( opts.lightDiffuse )
  self._light.specular =    arrToColor( opts.lightSpecular )
  self._light.groundColor = arrToColor( opts.groundLightColor )

  // create a mesh to serve as the built-in shadow mesh
  var disc = BABYLON.Mesh.CreateDisc('shadow base', 0.5, 30, self._scene)
  disc.rotation.x = halfPi
  self.noa.registry.registerMesh('shadow', disc)
  disc.material = new BABYLON.StandardMaterial('shadMat', self._scene)
  disc.material.diffuseColor = new col3(0,0,0)
  disc.material.specularColor = new col3(0,0,0)
  disc.material.alpha = 0.5
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
  setCameraZoom(this)

  // chunk a mesh, or a few if they're fast
  var time = performance.now()
  while(this._chunksToMesh.length && (performance.now() < time+3)) {
    doDeferredMeshing(this)
  }

  if (DEBUG_OCTREES) {
    --tmp_octree_check_count
    if (tmp_octree_check_count===0) {
      tmp_octree_check_count = 100
      var arr = this._octree.dynamicContent
      for (var i=0; i<arr.length; ++i) {
        if (arr[i]._isDisposed) {
          arr.splice(i--, 1)
        }
      }
    }
  }
}
var tmp_octree_check_count = 100


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
  var mesh = BABYLON.Mesh.CreatePlane(matname, 1, this._scene)
  // uncached material since cell frame is tied to it
  var mat = getEntitySpriteMaterial(this._scene).clone()
  mat.diffuseTexture = tex
  mesh.material = mat
  mesh.billboardMode = BABYLON.Mesh.BILLBOARDMODE_Y
  mesh._cellwidth = cellw
  mesh._cellheight = cellh
  mesh._lastcell = -1
  mesh._setCell = setSpriteMeshCell.bind(mesh)
  //  mesh._setCell(cellnum)

  if (DEBUG_OCTREES) this._octree.dynamicContent.push(mesh)

  return mesh
}

var _spriteMat
function getEntitySpriteMaterial(scene) {
  if (!_spriteMat) {
    _spriteMat = new BABYLON.StandardMaterial('', scene)
    _spriteMat.specularColor = new col3(0,0,0)
    _spriteMat.emissiveColor = new col3(1,1,1)
    _spriteMat.backFaceCulling = false
  }
  return _spriteMat
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



Rendering.prototype.makeMeshInstance = function(meshname, isTerrain) {
  var mesh = this.noa.registry.getMesh(meshname)
  return instantiateMesh(this, mesh, isTerrain)
}

Rendering.prototype._makeMeshInstanceByID = function(id, isTerrain) {
  var mesh = this.noa.registry._getMeshByBlockID(id)
  return instantiateMesh(this, mesh, isTerrain)
}

function instantiateMesh(self, mesh, isTerrain) {
  var m = mesh.createInstance('')
  if (mesh.billboardMode) m.billboardMode = mesh.billboardMode
  if (!isTerrain) {
    // non-terrain stuff should be dynamic w.r.t. selection octrees
    if (DEBUG_OCTREES) {
      self._octree.dynamicContent.push(m)
    }
  }
  return m
}



/*
 *   CHUNK ADD/CHANGE/REMOVE HANDLING
*/ 

function onChunkAdded( self, chunk ){
  // newly created chunks go to the end of the queue
  enqueueChunkUniquely( chunk, self._chunksToMesh, false )
}

function onChunkChanged( self, chunk ) {
  // changed chunks go to the head of the queue
  enqueueChunkUniquely( chunk, self._chunksToMesh, true )
}

function onChunkRemoved( self, i, j, k ) {
  removeMesh( self, [i,j,k].join('|') )
}

function doDeferredMeshing(self) {
  var chunk = null

  // find a chunk to mesh, starting from front, skipping if not meshable
  while(self._chunksToMesh.length && !chunk) {
    var c = self._chunksToMesh.shift()
    if (!c._terrainDirty) continue
    if (c._disposed) continue
    chunk = c
  }
  if (!chunk) return

  var id = [chunk.i,chunk.j,chunk.k].join('|')
  // remove current version if this is an update to an existing chunk
  if (self._meshedChunks[id]) removeMesh(self, id)
  // mesh it and add to babylon scene
  var meshdata = meshChunk(self, chunk)
  if (meshdata.length) {

    var s = chunk.size
    var mesh
    if (DEBUG_OCTREES) {
      mesh = makeChunkMesh(self, meshdata, id, chunk )
    } else {
      mesh = makeSubmeshes(self, meshdata, id, chunk )
    }

    self._meshedChunks[id] = mesh
  }
}


/*
 *
 *   INTERNALS
 *
*/ 

function enqueueChunkUniquely( obj, queue, infront ) {
  // remove any duplicate chunk descriptor objects
  for (var i=0; i<queue.length; ++i) {
    if (queue[i]===obj) queue.splice(i--,1);
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
  var opacityGetter = noa.registry._blockOpacity
  var matGetter = noa.registry.getBlockFaceMaterial.bind(noa.registry)
  var colGetter = noa.registry.getMaterialColor.bind(noa.registry)
  // returns an array of chunk#Submesh
  return chunk.mesh(matGetter, colGetter, self.doAO, self.aoVals )
}


/*
 *
 *  zoom/camera related internals
 *
*/

function getMeshEyePosition(self) {
  // eye position relative to player mesh (not physics body)
  var pos = self.noa.playerEntity.mesh.position.clone() // mesh center
  pos.y += .4 * self.noa.playerEntity.bb.vec[1] // center+.4*height
  return pos
}

function setCameraZoom(self) {
  // find target camera location by raycasting back from 
  // eye position to camera zoom depth
  var pos = getMeshEyePosition(self)
  var cam = self.getCameraVector()
  // need gl-vec3 vectors to pass to noa#pick
  var z = self.zoomDistance
  var vpos = glvec3.fromValues( pos.x,  pos.y,  pos.z)
  var vcam = glvec3.fromValues(-cam.x, -cam.y, -cam.z)
  var result = self.noa.pick(vpos, vcam, z)
  if (result) {
    var dist = glvec3.distance( vpos, result.position )
    dist -= 0.2 // slop to cut down on seeing through floors
    z = dist // Math.min(dist, self.zoomDistance)
  }
  self._cappedZoom = z
}

function updateCamera(self) {
  self._currentZoom += self._cameraZoomSpeed * (self._cappedZoom-self._currentZoom)
  var pos = getMeshEyePosition(self)
  self._cameraHolder.position.copyFrom(pos)
  self._cameraHolder.rotation.copyFrom(self._rotationHolder.rotation)
  self._camera.position.z = -self._currentZoom
  fadePlayerMesh(self)
}

function fadePlayerMesh(self) {
  // fade player model when zoomed in close
  var m = self.noa.playerEntity.mesh
  if (!m) return
  var show = 3
  var hide = 2
  var z = self._currentZoom
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
  if (DEBUG_OCTREES) rendering._octree.dynamicContent.push(m)
  return m
}



// manage materials/textures to avoid duplicating them
function getOrCreateMaterial(self, name, createFcn) {
  var mat = self._materialCache[name]
  if (!mat) {
    mat = createFcn()
    self._materialCache[name] = mat
  }
  return mat
}











//
// Given arrays of data for an enmeshed chunk, create a 
// babylon mesh with each terrain material as a different submesh
//


function makeSubmeshes(self, meshdata, id, chunk) {
  var scene = self._scene
  var x = chunk.i * chunk.size
  var y = chunk.j * chunk.size
  var z = chunk.k * chunk.size
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
    // mdat is instance of Chunk#Submesh
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

var terrainMultiMat
function getMultiMaterial( self ) {
  if (!terrainMultiMat) {
    // one single multimat for all terrain
    terrainMultiMat = new BABYLON.MultiMaterial("multi", self._scene)
    var mats = self.noa.registry._matData
    for (var i=0; i<mats.length; ++i) {
      var dat = mats[i]
      var mat = makeTerrainMaterial(self, i)
      terrainMultiMat.subMaterials[i] = mat
    }
  }
  return terrainMultiMat
}


// single canonical function to make a Material for a materialID
function makeTerrainMaterial(self, id) {
  var mat = new BABYLON.StandardMaterial('terrain'+id, self._scene)
  mat.specularColor = new col3(0,0,0)
  var url = self.noa.registry.getMaterialTexture(id)
  if (url) {
    var tex = new BABYLON.Texture(url, self._scene, true,false, BABYLON.Texture.NEAREST_SAMPLINGMODE)
    var alpha = self.noa.registry.getMaterialHasAlpha(id)
    if (alpha) {
      tex.hasAlpha = true
      mat.diffuseTexture = tex
      mat.useAlphaFromDiffuseTexture = true
    } else {
      mat.ambientTexture = tex
    }
  }
  return mat
}






var DEBUG_OCTREES = window.DEBUG_OCTREES = 1
var DEBUG_FREEZE = window.DEBUG_FREEZE = 1

//
// Given arrays of data for an enmeshed chunk, create a 
// babylon mesh child meshes for each terrain material
//
function makeChunkMesh(self, meshdata, id, chunk) {
  var scene = self._scene
  var x = chunk.i * chunk.size
  var y = chunk.j * chunk.size
  var z = chunk.k * chunk.size
  // create/position parent mesh
  var mesh = new BABYLON.Mesh( 'c'+id, scene )
  if (x) mesh.position.x = x
  if (y) mesh.position.y = y
  if (z) mesh.position.z = z

  // meshdata is a sparse array-like object keyed by material ID
  for (var s in meshdata) {
    var mdat = meshdata[s]
    
    var m = new BABYLON.Mesh( 'terr', self._scene )
    m.parent = mesh

    var matID = mdat.id
    var makeMat = makeTerrainMaterial.bind(null,self,matID)
    m.material = getOrCreateMaterial(self, 'terrain'+matID, makeMat)

    var vdat = new BABYLON.VertexData()
    vdat.positions = mdat.positions
    vdat.indices =   mdat.indices
    vdat.normals =   mdat.normals
    vdat.colors =    mdat.colors
    vdat.uvs =       mdat.uvs
    vdat.applyToMesh( m )

    if (DEBUG_FREEZE) m.freezeWorldMatrix();
  } 

  if (DEBUG_FREEZE) mesh.freezeWorldMatrix()

  createOrUpdateOctrees(self, mesh, chunk, x, y, z)

  return mesh
}



function createOrUpdateOctrees(self, mesh, chunk, x, y, z) {
  var scene = self._scene
  var octree = self._octree

  var cs = chunk.size
  var min = new vec3(   x,    y,    z)
  var max = new vec3(x+cs, y+cs, z+cs)
  var block = new BABYLON.OctreeBlock(min, max)
  mesh.getChildren().map(function(m) {
    block.entries.push(m)
  })
  chunk.octreeBlock = block

  octree.blocks.push(block)
  for (var key in chunk._objectMeshes) {
    block.entries.push( chunk._objectMeshes[key] )
  }
}







