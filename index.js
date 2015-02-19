
var ndarray = require('ndarray')
var aabb = require('aabb-3d')
var vec3 = require('gl-vec3')
var createContainer = require('./lib/container')
var createRendering = require('./lib/rendering')
var createWorld = require('./lib/world')
var createMesher = require('./lib/mesher')
var createInputs = require('./lib/inputs')
var createPhysics = require('./lib/physics')
var createControls = require('./lib/controls')
var raycast = require('voxel-raycast')

module.exports = Engine

function Engine(opts) {
  if (!(this instanceof Engine)) return new Engine(opts)

  // container (html/div) manager
  this.container = createContainer(this, opts)

  // rendering manager - abstracts all draws to 3D context
  this.rendering = createRendering(this, opts, this.container.canvas)

  // inputs manager - abstracts key/mouse input
  this.inputs = createInputs(this, opts, this.container._element)

  // create world manager
  this.world = createWorld( this, opts )

  // mesh chunk of world data and hand off to renderer
  this.mesher = createMesher( this, opts )

  // physics engine - solves collisions, properties, etc.
  this.physics = createPhysics( this, opts )

  // controls - hooks up input events to physics of player, etc.
  this.controls = createControls( this, opts )


  



  // ad-hoc stuff to set up player and camera
  //  ..this should be modularized somewhere


  var pbox = new aabb( [0,30,0], [2/3, 3/2, 2/3] )
  this.playerBody = this.physics.addBody( {}, pbox )

  var cameraOffset = [ 1/3, 3/2, 1/3 ]
  this.getCameraPosition = function() {
    var pos = vec3.create()
    vec3.add( pos, this.playerBody.aabb.base, cameraOffset )
    return pos
  }

  var c = this.rendering._camera
  this.controls.setTarget( this.playerBody )
  var accessor = {
    getRotationXY: function() {
      return [ c.rotation.x, c.rotation.y ]
    },
    setRotationXY: function(x,y) {
      c.rotation.x = x
      c.rotation.y = y
    }
  }
  this.controls.setCameraAccessor( accessor )




  // ad-hoc stuff for managing blockIDs and materials
  // this should be modularized into a registry of some kind
  
  
  // accessor for mapping block IDs to material ID of a given face
  // dir is a value 0..5: [ +x, -x, +y, -y, +z, -z ]
  this.blockToMaterial = function(id, dir) {
    var m = this.blockMaterialMap[id]
    return (m.length) ? m[dir] : m
  }
  
  // data structures mapping block IDs to materials/colors
  // array maps block ID to material by face: [ +x, -x, +y, -y, +z, -z ]
  this.blockMaterialMap = [ null ]  // 0: air
  this.materialColors =   [ null ]  // 0: air
  this.materialTextures = [ null ]  // 0: air
  
  // makeshift registry
  this.defineBlock = function( id, matID ) {
    this.blockMaterialMap[id] = matID
  }
  this.defineMaterial = function( id, col, tex ) {
    this.materialColors[id] = col
    this.materialTextures[id] = tex ? opts.texturePath+tex+'.png' : null
  }
  
  this.defineBlock( 1, 1 )    // dirt
  this.defineBlock( 2, [3,3,2,1,3,3] ) // grass
  this.defineBlock( 3, 4 )    // stone
  this.defineBlock( 4, 5 )
  this.defineBlock( 5, 6 )
  this.defineBlock( 6, 7 )    // colors
  this.defineBlock( 7, 8 )
  this.defineBlock( 8, 9 )
  this.defineBlock( 9,10 )
  this.defineBlock(10,11 )
  
  
  
  this.defineMaterial( 1, [1,1,1], "dirt" )
  this.defineMaterial( 2, [1,1,1], "grass" )
  this.defineMaterial( 3, [1,1,1], "grass_dirt" )
  this.defineMaterial( 4, [1,1,1], "cobblestone" )
  this.defineMaterial( 5, [ 0.9, 0.9, 0.95 ], null )
  this.defineMaterial( 6, [ 0.3, 0.9, 0.4 ], null )
  this.defineMaterial( 7, [ 0.9, 0.5, 0.4 ], null )
  this.defineMaterial( 8, [ 0.3, 0.4, 0.9 ], null )
  this.defineMaterial( 9, [ 0.7, 0.9, 0.4 ], null )
  this.defineMaterial(10, [ 0.3, 0.7, 0.9 ], null )
  this.defineMaterial(11, [ 0.8, 0.2, 0.7 ], null )
  
  
  
  
  // ad-hoc raycasting/highlighting stuff
  var traceRay = raycast.bind({}, this.world)
  this.pick = function(distance) {
    var cpos = this.getCameraPosition()
    var crot = this.rendering._camera.rotation
    var cvec = vec3.fromValues( 0,0,10 ) // +z is forward direction
    vec3.rotateX( cvec, cvec, [0,0,0], crot.x )
    vec3.rotateY( cvec, cvec, [0,0,0], crot.y )
    var hit_normal = []
    var hit_position = []
    var hit_block = traceRay(cpos, cvec, distance, hit_position, hit_normal)
    currTargetBlock = hit_block
    if (currTargetBlock) currTargetLoc = hit_position.map(Math.floor)
    if (currTargetBlock) currTargetNorm = hit_normal
    return !!hit_block
  }
  
  var currTargetBlock = 0
  var currTargetLoc = []
  var currTargetNorm = []

  this.highlightPickedBlock = function() {
    var hit = this.pick(10)
    var loc = currTargetLoc
    this.rendering.highlightBlock( hit, loc[0], loc[1], loc[2] )
  }
  
  this.pickTest = function() {
    var cpos = this.getCameraPosition()
    var crot = this.rendering._camera.rotation
    var cvec = vec3.fromValues( 0,0,10 ) // +z is forward direction
    vec3.rotateY( cvec, cvec, [0,0,0], crot.y )
    vec3.rotateX( cvec, cvec, [0,0,0], crot.x )
    console.log(crot)
  }
  
  var placeBlockID = 1
  var _world = this.world
  this.inputs.down.on("fire", function() {
    var loc = currTargetLoc
    if (currTargetBlock) _world.setBlock( 0, loc[0], loc[1], loc[2] )
  })
  this.inputs.down.on("mid-fire", function() {
    if (currTargetBlock) placeBlockID = currTargetBlock
  })
  var pbody = this.playerBody
  this.inputs.down.on("alt-fire", function() {
    if (!currTargetBlock) return
    var loc = [
      currTargetLoc[0] + currTargetNorm[0],
      currTargetLoc[1] + currTargetNorm[1],
      currTargetLoc[2] + currTargetNorm[2]
    ]
    var blockbb = new aabb(loc, [1,1,1])
    if (blockbb.intersects(pbody.aabb)) return
    _world.setBlock( placeBlockID, loc[0], loc[1], loc[2] )
  })
  


  // temp hacks for development

  window.noa = this
  window.ndarray = ndarray
  window.vec3 = vec3
  var debug = false
  window.addEventListener('keydown', function(e){
    if(e.keyCode==90) { // z
      debug = !debug
      if (debug) scene.debugLayer.show(); else scene.debugLayer.hide();
    }
  })



}




/*
 *   Engine API
*/ 



// TODO: revisit this timing handling - e.g. option for fixed timesteps
var lastTick = 0
function getTickTime() {
  var d = new Date()
  var dt = d-lastTick
  if (dt>100) dt=100
  lastTick = d
  return dt
}

Engine.prototype.tick = function() {
  var dt = getTickTime()
  checkForPointerlock(this)
  this.world.tick(dt)     // currently just does chunking
  this.controls.tick(dt)  // key state -> movement forces
  this.physics.tick(dt)   // iterates physics
  this.highlightPickedBlock()
  this.inputs.tick(dt)    // clears cumulative frame values
}

Engine.prototype.render = function(dt) {
  this.rendering.render()
}


// ad-hoc - TODO: this should be an event listener
Engine.prototype.onChunkAdded = function(chunk, id, i, j, k) {
  // TODO: pass in material/colors/chunk metadata somehow
  var aovals = [ 1, 0.8, 0.6 ]
  var getMaterial = this.blockToMaterial.bind(this)
  var meshDataArr = this.mesher.meshChunk( chunk, getMaterial, this.materialColors, aovals )
  if (meshDataArr.length) { // empty if the chunk is empty
    var cs = this.world.chunkSize
    this.rendering.addMeshDataArray( meshDataArr, id, i*cs, j*cs, k*cs )
  }
}

// ad-hoc - TODO: this should be an event listener
Engine.prototype.onChunkChanged = function(chunk, id, i, j, k) {
  // TODO: pass in material/colors/chunk metadata somehow
  var aovals = [ 1, 0.8, 0.6 ]
  var getMaterial = this.blockToMaterial.bind(this)
  var meshDataArr = this.mesher.meshChunk( chunk, getMaterial, this.materialColors, aovals )
  var cs = this.world.chunkSize
  this.rendering.updateMeshDataArr( meshDataArr, id, i*cs, j*cs, k*cs )
}



// this is a hack for now. TODO: find a more elegant approach
function checkForPointerlock(noa) {
  // prevent the camera from turning unless pointerlock or mouse is down
  var turn = noa.container._shell.pointerLock ||
      noa.inputs.state.fire
  if (!turn) {
    noa.inputs.state.dx = noa.inputs.state.dy = 0
  }
}



