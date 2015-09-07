
var aabb = require('aabb-3d')
var vec3 = require('gl-vec3')
var extend = require('extend')
var ndarray = require('ndarray')
var inherits = require('inherits')
var EventEmitter = require('events').EventEmitter
var createContainer = require('./lib/container')
var createRendering = require('./lib/rendering')
var createWorld = require('./lib/world')
var createInputs = require('./lib/inputs')
var createPhysics = require('./lib/physics')
var createCamControls = require('./lib/camera')
var createRegistry = require('./lib/registry')
var createEntities = require('./lib/entities')
var raycast = require('voxel-raycast')


module.exports = Engine




var defaults = {
  playerHeight: 1.8,
  playerWidth: 0.6,
  playerStart: [0,10,0],
  playerAutoStep: false,
  tickRate: 30,
  blockTestDistance: 10
}

/*
 *    Main game engine object
 *  Emits: tick
*/

function Engine(opts) {
  if (!(this instanceof Engine)) return new Engine(opts)
  opts = extend(defaults, opts)
  this._tickRate = opts.tickRate
  this._paused = false

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

  // physics engine - solves collisions, properties, etc.
  this.physics = createPhysics( this, opts )

  // camera controller
  this.cameraControls = createCamControls( this, opts )
  
  // entity manager
  this.entities = createEntities( this, opts )


  // keep reference to the player's mesh for convenience
  // use placeholder to start with (to be overwritten by client)
  this.playerMesh = this.rendering.makePlaceholderMesh()
  
  // create an entity for the player and hook up controller to its physics body
  this.playerEntity = this.entities.add(
    opts.playerStart,    // starting location- TODO: get from options
    opts.playerWidth, opts.playerHeight,
    this.playerMesh, null, // box mesh, no meshOffset, 
    true,                  // do physics
    true, null,            // collideTerrain, onCollide
    true, null,            // collideEntities, onCollide
    true, false            // shadow, isSprite
  )
  
  var body = this.entities.getPhysicsBody(this.playerEntity)
  body.gravityMultiplier = 2 // less floaty
  body.autoStep = opts.playerAutoStep // auto step onto blocks
  this.playerBody = body
  
  // tag the entity as the player
  this.entities.addComponent(this.playerEntity, this.entities.components.player)
  
  // input component - sets entity's movement state from key inputs
  this.entities.addComponent(this.playerEntity, this.entities.components.receivesInputs)
  
  // movement component - applies movement forces
  // todo: populate movement settings from options
  var moveOpts = {
    airJumps: 1
  }
  this.entities.addComponent(this.playerEntity, this.entities.components.movement, moveOpts)

  // Set up block picking functions
  this.blockTestDistance = opts.blockTestDistance || 10

  // plumbing for picking/raycasting
  var world = this.world
  var blockGetter = { getBlock:function(x,y,z) {
    return world.getBlock(x,y,z)
  }}
  var solidGetter = { getBlock:function(x,y,z) {
    return world.getBlockSolidity(x,y,z)
  }}
  
  // accessors
  this._traceWorldRay = function(pos, vec, dist, hitPos, hitNorm) {
    return raycast(blockGetter, pos, vec, dist, hitPos, hitNorm)
  }
  
  this._traceWorldRayCollision = function(pos, vec, dist, hitPos, hitNorm) {
    return raycast(solidGetter, pos, vec, dist, hitPos, hitNorm)
  }
  



  // temp hacks for development

  window.noa = this
  window.ndarray = ndarray
  window.vec3 = vec3
  var debug = false
  this.inputs.bind( 'debug', 'Z' )
  this.inputs.down.on('debug', function onDebug() {
    debug = !debug
    if (debug) window.scene.debugLayer.show(); else window.scene.debugLayer.hide();
  })



}

inherits( Engine, EventEmitter )


/*
 *   Core Engine API
*/ 




/**
 * Tick function, called by container module at a fixed timestep. Emits #tick(dt),
 * where dt is the tick rate in ms (default 16.6)
 */

Engine.prototype.tick = function() {
  if (this._paused) return
  var dt = this._tickRate         // fixed timesteps!
  this.world.tick(dt)             // chunk creation/removal
  this.cameraControls.tickCamera(dt) // ticks camera zoom based on scroll events
  this.rendering.tick(dt)         // zooms camera, does deferred chunk meshing
// t0()
  this.physics.tick(dt)           // iterates physics
// t1('physics tick')
  this.entities.update(dt)        // tells ECS to run all processors
  this.setBlockTargets()          // finds targeted blocks, and highlights one if needed
  this.emit('tick', dt)
}


// hacky temporary profiling substitute 
// since chrome profiling drops fps so much... :(
var t, tt=0, tc=0, tlc
function t0() {
  t = performance.now()
}
function t1(s) {
  tt += performance.now()-t
  tc += 1
  tlc += 1
  if (tlc<100) return
  tlc = 0
  console.log( s, ': avg ', (tt/tc).toFixed(2), 'ms')
}



/**
 * Render function, called every animation frame. Emits #beforeRender(dt), #afterRender(dt) 
 * where dt is the time in ms *since the last tick*.
 */

Engine.prototype.render = function(framePart) {
  if (this._paused) {console.log(this.inputs.state.dx);return}
  var dt = framePart*this._tickRate // ms since last tick
  // only move camera during pointerlock or mousedown, or if pointerlock is unsupported
  if (this.container.hasPointerLock() || 
      !this.container.supportsPointerLock() || 
      this.inputs.state.fire) {
    this.cameraControls.updateForRender()
  }
  // clear cumulative mouse inputs
  this.inputs.state.dx = this.inputs.state.dy = 0
  // events and render
  this.emit('beforeRender', dt)
  this.rendering.render(dt)
  this.emit('afterRender', dt)
}




/*
 *   Utility APIs
*/ 

Engine.prototype.setPaused = function(paused) {
  this._paused = !!paused
  // when unpausing, clear any built-up mouse inputs
  if (!paused) {
    this.inputs.state.dx = this.inputs.state.dy = 0
  }
}

Engine.prototype.getBlock = function(x, y, z) {
  var arr = (x.length) ? x : [x,y,z]
  return this.world.getBlockID( arr[0], arr[1], arr[2] );
}

Engine.prototype.setBlock = function(id, x, y, z) {
  // skips the entity collision check
  var arr = (x.length) ? x : [x,y,z]
  this.world.setBlockID( id, arr[0], arr[1], arr[2] );
}

Engine.prototype.addBlock = function(id, x, y, z) {
  // add a new terrain block, if nothing blocks the terrain there
  var arr = (x.length) ? x : [x,y,z]
  if (this.entities.isTerrainBlocked(arr[0], arr[1], arr[2])) return
  this.world.setBlockID( id, arr[0], arr[1], arr[2] );
}

Engine.prototype.getTargetBlock = function() {
  return this._blockTargetLoc
}

Engine.prototype.getTargetBlockAdjacent = function() {
  return this._blockPlacementLoc
}


Engine.prototype.getPlayerPosition = function() {
  return this.entities.getPosition(this.playerEntity)
}

Engine.prototype.getPlayerEyePosition = function() {
  var box = this.entities.getAABB(this.playerEntity)
  var height = box.vec[1]
  var loc = this.getPlayerPosition()
  loc[1] += height * .9 // eyes below top of head
  return loc
}

Engine.prototype.getCameraVector = function() {
  // rendering works with babylon's xyz vectors
  var v = this.rendering.getCameraVector()
  return vec3.fromValues( v.x, v.y, v.z )
}

// Determine which block if any is targeted and within range
Engine.prototype.pick = function(pos, vec, dist) {
  if (dist===0) return null
  pos = pos || this.getPlayerEyePosition()
  vec = vec || this.getCameraVector()
  dist = dist || this.blockTestDistance
  var hitNorm = []
  var hitPos = []
  var hitBlock = this._traceWorldRayCollision(pos, vec, dist, hitPos, hitNorm)
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
    this.rendering.highlightBlockFace(true, loc, norm)
  } else {
    this._blockTargetLoc = this._blockPlacementLoc = null
    this.rendering.highlightBlockFace( false )
  }
}


// set a mesh and position offset for the player entity.
Engine.prototype.setPlayerMesh = function(mesh, meshOffset, isSprite) {
  // update ecs data
  var meshData = this.entities.getMeshData(this.playerEntity)
  meshData.mesh = mesh
  meshData.offset = meshOffset
  
  if (this.playerMesh) this.playerMesh.dispose()
  this.playerMesh = mesh
  this.rendering.addDynamicMesh(mesh)

  if (isSprite) {
    this.entities.addComponent(this.playerEntity, this.entities.components.sprite)
    this.rendering.setUpSpriteMesh(mesh)
  } else {
    this.entities.removeComponent(this.playerEntity, this.entities.components.sprite)
  }
}

/*
 *   Internals
*/ 








