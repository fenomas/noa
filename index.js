
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
var raycast = require('fast-voxel-raycast')


module.exports = Engine




var defaults = {
  playerHeight: 1.8,
  playerWidth: 0.6,
  playerStart: [0,10,0],
  playerAutoStep: false,
  tickRate: 30,
  blockTestDistance: 10,
  stickyPointerLock: true,
}

/**
 * Main engine object.  
 * Emits: *tick, beforeRender, afterRender*
 * 
 * ```js
 * var noaEngine = require('noa-engine')
 * var noa = noaEngine(opts)
 * ```
 * 
 * @class noa
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

  // Entity manager / Entity Component System (ECS)
  this.entities = createEntities( this, opts )
  // convenience
  this.ents = this.entities
  this.ents.comps = this.entities.components
  
  // rendering manager - abstracts all draws to 3D context
  this.rendering = createRendering(this, opts, this.container.canvas)

  // physics engine - solves collisions, properties, etc.
  this.physics = createPhysics( this, opts )

  // camera controller
  this.cameraControls = createCamControls( this, opts )
  

  var ents = this.ents
  
  /** Entity id for the player entity */
  this.playerEntity = ents.add(
    opts.playerStart,    // starting location- TODO: get from options
    opts.playerWidth, opts.playerHeight,
    null, null,          // no mesh for now, no meshOffset, 
    true, true
  )
  
  // tag the entity as the player, make it collide with terrain and other entities
  ents.addComponent(this.playerEntity, ents.components.player)
	ents.addComponent(this.playerEntity, ents.components.collideTerrain)
	ents.addComponent(this.playerEntity, ents.components.collideEntities)

  // adjust default physics parameters
  var body = ents.getPhysicsBody(this.playerEntity)
  body.gravityMultiplier = 2 // less floaty
  body.autoStep = opts.playerAutoStep // auto step onto blocks
  
  /** reference to player entity's physics body */
  this.playerBody = body
  
  // input component - sets entity's movement state from key inputs
  ents.addComponent(this.playerEntity, ents.components.receivesInputs)
  
  // add a component to make player mesh fade out when zooming in
  ents.addComponent(this.playerEntity, ents.components.fadeOnZoom)
  
  // movement component - applies movement forces
  // todo: populate movement settings from options
  var moveOpts = {
    airJumps: 1
  }
  ents.addComponent(this.playerEntity, ents.components.movement, moveOpts)
  
  // how high above the player's position the eye is (for picking, camera tracking)  
  this.playerEyeOffset = 0.9 * opts.playerHeight
  




  // Set up block picking functions
  this.blockTestDistance = opts.blockTestDistance || 10

  // plumbing for picking/raycasting
  var world = this.world
  var blockAccessor = function(x,y,z) {
    return world.getBlock(x,y,z)
  }
  var solidAccessor = function(x,y,z) {
    return world.getBlockSolidity(x,y,z)
  }
  
  // accessors
  this._traceWorldRay = function(pos, vec, dist, hitPos, hitNorm) {
    return raycast(blockAccessor, pos, vec, dist, hitPos, hitNorm)
  }
  
  this._traceWorldRayCollision = function(pos, vec, dist, hitPos, hitNorm) {
    return raycast(solidAccessor, pos, vec, dist, hitPos, hitNorm)
  }
  
  
  this._blockTargetLoc = vec3.create()
  this._blockPlacementLoc = vec3.create()

  
  // init rendering stuff that needed to wait for engine internals
  this.rendering.initScene()


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




/*
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



/*
 * Render function, called every animation frame. Emits #beforeRender(dt), #afterRender(dt) 
 * where dt is the time in ms *since the last tick*.
*/

Engine.prototype.render = function(framePart) {
  if (this._paused) return
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

/** 
 * Pausing the engine will also stop render/tick events, etc.
 * @param paused
*/
Engine.prototype.setPaused = function(paused) {
  this._paused = !!paused
  // when unpausing, clear any built-up mouse inputs
  if (!paused) {
    this.inputs.state.dx = this.inputs.state.dy = 0
  }
}

/** @param x,y,z */
Engine.prototype.getBlock = function(x, y, z) {
  var arr = (x.length) ? x : [x,y,z]
  return this.world.getBlockID( arr[0], arr[1], arr[2] );
}

/** @param x,y,z */
Engine.prototype.setBlock = function(id, x, y, z) {
  // skips the entity collision check
  var arr = (x.length) ? x : [x,y,z]
  this.world.setBlockID( id, arr[0], arr[1], arr[2] );
}

/**
 * Adds a block unless obstructed by entities 
 * @param id,x,y,z */
Engine.prototype.addBlock = function(id, x, y, z) {
  // add a new terrain block, if nothing blocks the terrain there
  var arr = (x.length) ? x : [x,y,z]
  if (this.entities.isTerrainBlocked(arr[0], arr[1], arr[2])) return
  this.world.setBlockID( id, arr[0], arr[1], arr[2] );
}

/**
 * Returns location of currently targeted block
 */
Engine.prototype.getTargetBlock = function() {
  return this._blockTargetLoc
}

/**
 * Returns location adjactent to target (e.g. for block placement)
 */
Engine.prototype.getTargetBlockAdjacent = function() {
  return this._blockPlacementLoc
}


/** */
Engine.prototype.getPlayerPosition = function() {
  return this.entities.getPositionData(this.playerEntity).position
}

/** */
Engine.prototype.getPlayerMesh = function() {
  return this.entities.getMeshData(this.playerEntity).mesh
}

/** */
Engine.prototype.getPlayerEyePosition = function() {
  var pos = this.entities.getPositionData(this.playerEntity).position
  vec3.copy(_eyeLoc, pos)
  _eyeLoc[1] += this.playerEyeOffset
  return _eyeLoc
}
var _eyeLoc = vec3.create()

/** */
Engine.prototype.getCameraVector = function() {
  // rendering works with babylon's xyz vectors
  var v = this.rendering.getCameraVector()
  vec3.set(_camVec, v.x, v.y, v.z)
  return _camVec
}
var _camVec = vec3.create()

/**
 * Determine which block if any is targeted and within range
 * @param pos
 * @param vec
 * @param dist
 */
Engine.prototype.pick = function(pos, vec, dist) {
  if (dist===0) return null
  pos = pos || this.getPlayerEyePosition()
  vec = vec || this.getCameraVector()
  dist = dist || this.blockTestDistance
  var hitBlock = this._traceWorldRayCollision(pos, vec, dist, _hitPos, _hitNorm)
  if (hitBlock) return {
    block: hitBlock,
    position: _hitPos,
    normal: _hitNorm
  }
  return null
}
var last = ''
var _hitPos = vec3.create()
var _hitNorm = vec3.create()


// Determine which block if any is targeted and within range
// also tell rendering to highlight the struck block face
Engine.prototype.setBlockTargets = function() {
  var result = this.pick()
  // process and cache results
  if (result) {
    var hit = result.position
    var norm = result.normal
    
    // hit will be on a voxel's face, so avoid tolerance issues by 
    // sinking back along the normal before flooring
    vec3.scaleAndAdd(hit, hit, norm, -0.5)
    for (var i=0; i<3; i++) hit[i] = Math.floor(hit[i])
    
    // save for use by engine, and highlight
    vec3.copy(this._blockTargetLoc, hit)
    vec3.add(this._blockPlacementLoc, hit, norm)
    this.rendering.highlightBlockFace(true, hit, norm)
  } else {
    this.rendering.highlightBlockFace( false )
  }
}







