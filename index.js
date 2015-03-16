
var aabb = require('aabb-3d')
var vec3 = require('gl-vec3')
var extend = require('extend')
var ndarray = require('ndarray')
var inherits = require('inherits')
var EventEmitter = require('events').EventEmitter
var createContainer = require('./lib/container')
var createRendering = require('./lib/rendering')
var createWorld = require('./lib/world')
var createMesher = require('./lib/mesher')
var createInputs = require('./lib/inputs')
var createPhysics = require('./lib/physics')
var createControls = require('./lib/controls')
var createRegistry = require('./lib/registry')
var createEntities = require('./lib/entities')
var raycast = require('voxel-raycast')


module.exports = Engine


var defaults = {
  playerHeight: 1.8,
  playerWidth: 0.6,
  playerStart: [0,10,0],

}

/*
 *    Main game engine object
 *  Emits: tick
*/

function Engine(opts) {
  if (!(this instanceof Engine)) return new Engine(opts)
  opts = extend(defaults, opts)

  // container (html/div) manager
  this.container = createContainer(this, opts)

  // inputs manager - abstracts key/mouse input
  this.inputs = createInputs(this, opts, this.container._element)

  // create block/item property registry
  this.registry = createRegistry( this, opts )

  // create world manager
  this.world = createWorld( this, opts )

  // rendering manager - abstracts all draws to 3D context
  this.rendering = createRendering(this, opts, this.container.canvas)

  // mesh chunk of world data and hand off to renderer
  this.mesher = createMesher( this, opts )

  // physics engine - solves collisions, properties, etc.
  this.physics = createPhysics( this, opts )

  // controls - hooks up input events to physics of player, etc.
  this.controls = createControls( this, opts )

  // entity manager
  this.entities = createEntities( this, opts )


  // create an entity for the player and hook up controller to its physics body
  this.playerEntity = this.entities.add(
    opts.playerStart,    // starting location- TODO: get from options
    opts.playerWidth, opts.playerHeight,
    null, null,     // no mesh, no meshOffset, 
    {}, true,       // empty data object, do physics
    true, true      // collideTerrain, collideEntities
  )
  this.playerEntity.body.gravityMultiplier = 2 // less floaty
  this.controls.setTarget( this.playerEntity.body )



  // Set up block picking and fire events
  this.blockTestDistance = opts.blockTestDistance || 10
  this._traceWorldRay = raycast.bind(null, this.world)


  // ad-hoc stuff to set up player and camera
  var cam = this.rendering.getCameraHolder()
  var accessor = {
    getRotationXY: function() {
      return [ cam.rotation.x, cam.rotation.y ]
    },
    setRotationXY: function(x,y) {
      cam.rotation.x = x
      cam.rotation.y = y
    }
  }
  this.controls.setCameraAccessor( accessor )




  // temp hacks for development

  window.noa = this
  window.ndarray = ndarray
  window.vec3 = vec3
  var debug = false
  this.inputs.bind( 'debug', 'Z' )
  this.inputs.down.on('debug', function() {
    debug = !debug
    if (debug) scene.debugLayer.show(); else scene.debugLayer.hide();
  })



}

inherits( Engine, EventEmitter )


/*
 *   Core Engine API
*/ 


Engine.prototype.tick = function() {
  var dt = getTickTime(this)
  checkForPointerlock(this)
  this.world.tick(dt)        // chunk creation/removal
  this.rendering.tick(dt)    // deferred remeshing of updated chunks
  this.controls.tick(dt)     // applies movement forces
  this.physics.tick(dt)      // iterates physics
  this.setBlockTargets()     // finds targeted blocks, and highlights one if needed
  this.entities.tick(dt)     // move entities and call their tick functions
  this.emit('tick', dt)
  this.inputs.tick(dt)       // clears cumulative input values
}





/*
 *   Utility APIs
*/ 

Engine.prototype.getBlock = function(x, y, z) {
  var arr = (x.length) ? x : [x,y,z]
  return this.world.getBlock( arr[0], arr[1], arr[2] );
}

Engine.prototype.setBlock = function(id, x, y, z) {
  // skips the entity collision check
  var arr = (x.length) ? x : [x,y,z]
  this.world.setBlock( id, arr[0], arr[1], arr[2] );
}

Engine.prototype.addBlock = function(id, x, y, z) {
  // add a new terrain block, if nothing blocks the terrain there
  var arr = (x.length) ? x : [x,y,z]
  if (this.entities.isTerrainBlocked(arr[0], arr[1], arr[2])) return
  this.world.setBlock( id, arr[0], arr[1], arr[2] );
}

Engine.prototype.getTargetBlock = function() {
  return this._blockTargetLoc
}

Engine.prototype.getTargetBlockAdjacent = function() {
  return this._blockPlacementLoc
}


Engine.prototype.getPlayerPosition = function() {
  return this.playerEntity.getPosition()
}

Engine.prototype.getPlayerEyePosition = function() {
  var height = this.playerEntity.bb.vec[1]
  var loc = this.playerEntity.getPosition()
  loc[1] += height * .9 // eyes below top of head
  return loc
}

Engine.prototype.getCameraVector = function() {
  var crot = this.rendering.getCameraHolder().rotation
  var cvec = vec3.fromValues( 0,0,1 ) // +z is forward direction
  vec3.rotateX( cvec, cvec, [0,0,0], crot.x )
  vec3.rotateY( cvec, cvec, [0,0,0], crot.y )
  return cvec
}

// Determine which block if any is targeted and within range
Engine.prototype.pick = function(pos, vec, dist) {
  pos = pos || this.getPlayerEyePosition()
  vec = vec || this.getCameraVector()
  dist = dist || this.blockTestDistance
  var hitNorm = []
  var hitPos = []
  var hitBlock = this._traceWorldRay(pos, vec, dist, hitPos, hitNorm)
  if (hitBlock) return {
    block: hitBlock,
    position: hitPos,
    normal: hitNorm
  }
  return null
}


// Determine which block if any is targeted and within range
// also tell rendering to highlight the struck block face
Engine.prototype.setBlockTargets = function() {
  var result = this.pick()
  // process and cache results
  if (result) {
    var loc = result.position.map(Math.floor)
    var norm = result.normal
    this._blockTargetLoc = loc
    this._blockPlacementLoc = [ loc[0]+norm[0], loc[1]+norm[1], loc[2]+norm[2] ]
    var axis = norm[0] ? 0 : norm[1] ? 1 : 2
    this.rendering.highlightBlockFace(true, loc, norm)
  } else {
    this._blockTargetLoc = this._blockPlacementLoc = null
    this.rendering.highlightBlockFace( false )
  }
}


// set a mesh and position offset for the player entity.
Engine.prototype.setPlayerMesh = function(mesh, meshOffset) {
  this.playerEntity.mesh = mesh
  this.playerEntity.meshOffset = meshOffset
}

/*
 *   Internals
*/ 



// Manually track tick times.. consider changing this to fixed timesteps?
var lastTick = 0
function getTickTime(noa) {
  var last = noa._lastTick || 0
  var d = new Date()
  var dt = d-last
  if (dt>100) dt=100 // clamp timestep to 100ms to prevent blowups
  noa._lastTick = d
  return dt
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



