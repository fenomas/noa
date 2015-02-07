
var ndarray = require('ndarray')
var createContainer = require('./lib/container')
var createRendering = require('./lib/rendering')
var createWorld = require('./lib/world')
var createMesher = require('./lib/mesher')

module.exports = Engine

function Engine(opts) {
  if (!(this instanceof Engine)) return new Engine(opts)

  // container (html/div) manager
  this.container = createContainer(this, opts)

  // abstraction layer for rendering
  this.rendering = createRendering(this, opts, this.container.canvas)

  // world data / chunk / worldgen manager
  var worldgen = ball

  this.world = createWorld( this, opts, worldgen )

  // mesh chunk of world data and hand off to renderer
  this.mesher = createMesher( this, opts )






  // ad-hoc worldgen, meshing, rendering
  var chunk = this.world.createChunk()
  var meshData = this.mesher.meshChunk(chunk)
  this.rendering.addMeshFromData( meshData )



  // temp hacks for development
  var c = this.rendering._camera
  //  c.position = new BABYLON.Vector3(8,5,8)
  //  c.setTarget( new BABYLON.Vector3(0,0,0) )
  c.attachControl(document, false)
  window.noa = this
  window.chunk = chunk
  window.ndarray = require('ndarray')
  var debug = false
  window.addEventListener('keydown', function(e){
    if(e.keyCode==90) { // z
      debug = !debug
      if (debug) scene.debugLayer.show(); else scene.debugLayer.hide();
    }
    if(e.keyCode==89) { runChunkTest() } // y
    if(e.keyCode==66) { runBitTest() } // b
  })
  scene.activeCamera.keysUp.push(87) // w
  scene.activeCamera.keysLeft.push(65) // a
  scene.activeCamera.keysDown.push(83) // s
  scene.activeCamera.keysRight.push(68) // d
}


function runChunkTest() {
  var c = noa.world.createChunk(128)
  var n=3, t=0, t2=0, d, d2
  d = new Date()
  for (var i=0; i<n; i++) {
    noa.mesher.meshChunk(c,true)
    d2 = new Date()
    t += d2-d
    noa.mesher.meshChunk(c)
    d = new Date()
    t2 += d-d2
  }
  console.log('Old mesher averaged '+Math.round(t/n)+'ms.')
  console.log('New mesher averaged '+Math.round(t2/n)+'ms.')
}


/*
 *   Engine API
*/ 

Engine.prototype.tick = function(dt) {

}

Engine.prototype.render = function(dt) {
  this.rendering.render()

}




function buttons(x,y,z) {
  var lo=2, hi=9
  if ( from(x,lo,hi) && from(y,lo,hi) && from(z,lo,hi) ) return 1
  if ( y==3 && z==4 && from(x,lo-1,hi+1 ) ) return 1
  if ( y==4 && z==7 && from(x,lo-1,hi+1 ) ) return 1
  if ( x==4 && z==7 && from(y,lo-1,hi+1 ) ) return 1
  if ( x==7 && z==5 && from(y,lo-1,hi+1 ) ) return 1
  return 0
}

function ecks(x,y,z) {
  var lo=2, hi=10
  if ( from(x,lo,hi) && from(y,lo,hi) && from(z,lo,hi) ) return 1
  if (x==6 && from(z,lo+1,hi-1) && from(y,lo-1,hi+1) ) return 1
  if (z==8 && from(x,lo+1,hi-1) && from(y,lo-1,hi+1) ) return 1
  if (y==6 && from(z,lo+1,hi-1) && from(x,lo-1,hi+1) ) return 1
  if (z==8 && from(y,lo+1,hi-1) && from(x,lo-1,hi+1) ) return 1
  return 0
}

function ball(x,y,z) {
  if (x==6 && z==5 && y<2) return 1
  if (x==4 && z==8 && y<2) return 1
  if (x==4 && z==10 && y<2) return 1
//  if (x==6 && z==3) return 0
//  if (x==2 && z==8) return 0
  var rad = Math.pow(x-9,2) + Math.pow(y-8,2) + Math.pow(z-8,2)
  return (rad<55) ? 0 : 1
}

function from(val,lo,hi) {
  return val>lo-1 && val<hi+1
}


