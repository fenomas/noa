
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

module.exports = Engine

function Engine(opts) {
  if (!(this instanceof Engine)) return new Engine(opts)

  // container (html/div) manager
  this.container = createContainer(this, opts)

  // rendering manager - abstracts all draws to 3D context
  this.rendering = createRendering(this, opts, this.container.canvas)

  // inputs manager - abstracts key/mouse input
  this.inputs = createInputs(this, opts, this.container._element)

  // register for domReady event to sent up GL events, etc.
  this.container._shell.on('init', this.onDomReady.bind(this))

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
  
  // data structure for mapping block IDs to material ID
  // array means values for each face: [ +x, -x, +y, -y, +z, -z ]
  this.blockMaterialMap = [
    null,             // 0: air
    1,                // 1: dirt
    [3,3,2,1,3,3],    // 2: grass block
    4,                // 3: cobblestone block
    5                 // 4: gray color
  ]

  // maps material IDs to base colors (i.e. vertex colors)
  this.materialColors = [
    null,               // 0: air
    [ 1,1,1 ],          // 1: dirt
    [ 1,1,1 ],          // 2: grass
    [ 1,1,1 ],          // 3: grass_dirt
    [ 1,1,1 ],          // 4: cobblestone
    [ 0.9, 0.9, 0.95 ]  // 5: solid white color
  ]
  
  // maps material IDs to texture paths
  this.materialTextures = [
    null,                                    // 0: air
    opts.texturePath + "dirt.png",           // 1: dirt
    opts.texturePath + "grass.png",          // 2: grass
    opts.texturePath + "grass_dirt.png",     // 3: grass_dirt
    opts.texturePath + "cobblestone.png",    // 4: cobblestone
    null                                     // 5: solid white color
  ]
  
  




  // temp hacks for development

  window.noa = this
  window.ndarray = require('ndarray')
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

// TODO: this should really be made a listener
Engine.prototype.onDomReady = function() {
  // registers noa for tick/render/resize events
  this.container.initEvents()
  // sets up key events
  this.inputs.initEvents(document)
}


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
  this.inputs.tick(dt)    // clears cumulative frame values
}

Engine.prototype.render = function(dt) {
  this.rendering.render()
}


// ad-hoc - TODO: this should be an event listener
Engine.prototype.onChunkAdded = function(chunk, i, j, k) {
  // TODO: pass in material/colors/chunk metadata somehow
  var aovals = [ 1, 0.8, 0.6 ]
  var getMaterial = this.blockToMaterial.bind(this)
  var meshDataArr = this.mesher.meshChunk( chunk, getMaterial, this.materialColors, aovals )
  if (meshDataArr.length) { // empty if the chunk is empty
    var cs = this.world.chunkSize
    this.rendering.addMeshDataArray( meshDataArr, i*cs, j*cs, k*cs )
  }
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



