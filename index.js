
var ndarray = require('ndarray')
var createContainer = require('./lib/container')
var createRendering = require('./lib/rendering')
var createWorld = require('./lib/world')
var createMesher = require('./lib/mesher')
var createInputs = require('./lib/inputs')

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
  
  // world data / chunk / worldgen manager
  var worldgen = ball

  this.world = createWorld( this, opts, worldgen )

  // mesh chunk of world data and hand off to renderer
  this.mesher = createMesher( this, opts )
  
  

  // ad-hoc stuff from here on:


  // temp hacks for development
  var c = this.rendering._camera
  //  c.position = new BABYLON.Vector3(8,5,8)
  //  c.setTarget( new BABYLON.Vector3(0,0,0) )
  c.attachControl(document, false)
  window.noa = this
  window.ndarray = require('ndarray')
  var debug = false
  window.addEventListener('keydown', function(e){
    if(e.keyCode==90) { // z
      debug = !debug
      if (debug) scene.debugLayer.show(); else scene.debugLayer.hide();
    }
    if(e.keyCode==89) { runChunkTest() } // y
    //    if(e.keyCode==66) { runBitTest() } // b
  })
  scene.activeCamera.keysUp.push(87) // w
  scene.activeCamera.keysLeft.push(65) // a
  scene.activeCamera.keysDown.push(83) // s
  scene.activeCamera.keysRight.push(68) // d
  
//  this.inputs.down.on('move-right', function() {
//    console.log(scene.activeCamera.position.x)
//  })
  
}




/*
 *   Engine API
*/ 

Engine.prototype.onDomReady = function() {
  // registers noa for tick/render/resize events
  this.container.initEvents()
  // sets up key events
  this.inputs.initEvents(document)
}
  


Engine.prototype.tick = function(dt) {
  this.world.tick()
}

Engine.prototype.render = function(dt) {
  this.rendering.render()

}



// ad-hoc - TODO: this should be an event listener
Engine.prototype.onChunkAdded = function(chunk, i, j, k) {
  // colors - these should eventually come from registry
  var cols = [0,
              [ 0.4, 0.9, 0.4 ],
              [ 0.8, 0.3, 0.4 ],
              [ 0.4, 0.3, 0.7 ],
             ]
  var aovals = [ 0.7, 0.6, 0.5 ]
  var meshData = this.mesher.meshChunk( chunk, cols, aovals )
  if (meshData) { // could be false if chunk is empty
    var cs = this.world.chunkSize
    this.rendering.addMeshFromData( meshData, i*cs, j*cs, k*cs )
  }
}



