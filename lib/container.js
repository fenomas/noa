'use strict';

var extend = require('extend')
var createGameShell = require('game-shell')
var inherits = require('inherits')
var EventEmitter = require('events').EventEmitter


module.exports = function(noa, opts) {
  return new Container(noa, opts)
}

/*
 *  Container module
 *    Wraps game-shell module and manages HTML container, canvas, etc.
 *    Emits: DOMready
*/

function Container(noa, opts) {
  opts = opts || {}
  this._noa = noa
  this._element = opts.domElement || createContainerDiv()
  this._shell = createShell( this._element, opts )
  this.canvas = getOrCreateCanvas(this._element)

  // feature detection
  this._pointerLockSupported = false

  this._shell.on('init', onShellInit.bind(null,this))
}

inherits(Container, EventEmitter)



/*
 *   SHELL EVENTS
*/ 

function onShellInit(self) {
  // create shell listeners that drive engine functions
  var noa = self._noa
  var shell = self._shell
  shell.on('tick',   noa.tick.bind(noa) )
  shell.on('render', noa.render.bind(noa) )
  shell.on('resize', noa.rendering.resize.bind(noa.rendering) )

  detectPointerLock(self)
  // let other components know DOM is ready
  self.emit( 'DOMready' )
}


/*
 *   PUBLIC API 
*/ 

Container.prototype.appendTo = function(htmlElement) {
  this._element.appendChild( htmlElement )
}





/*
 *   INTERNALS
*/ 



function createContainerDiv() {
  // based on github.com/mikolalysenko/game-shell - makeDefaultContainer()
  var container = document.createElement("div")
  container.tabindex = 1
  container.style.position = "absolute"
  container.style.left = "0px"
  container.style.right = "0px"
  container.style.top = "0px"
  container.style.bottom = "0px"
  container.style.height = "100%"
  container.style.overflow = "hidden"
  document.body.appendChild(container)
  document.body.style.overflow = "hidden" //Prevent bounce
  document.body.style.height = "100%"
  container.id = 'noa-container'
  return container
}


function createShell(container, _opts) {
  var shellDefaults = {
    pointerLock: true,
    preventDefaults: false
  }
  var opts = extend( shellDefaults, _opts )
  opts.element = container
  var shell = createGameShell(opts)
  shell.preventDefaults = opts.preventDefaults
  return shell
}

function getOrCreateCanvas(el) {
  // based on github.com/stackgl/gl-now - default canvas
  var canvas = el.querySelector('canvas')
  if (!canvas) {
    canvas = document.createElement('canvas')
    canvas.style.position = "absolute"
    canvas.style.left = "0px"
    canvas.style.top = "0px"
    canvas.style.height = "100%"
    canvas.style.width = "100%"
    canvas.id = 'noa-canvas'
    el.appendChild(canvas)
  }
  return canvas
}


// set up stuff to detect pointer lock support.
// Needlessly complex because Chrome/Android claims to support but doesn't.
// For now, just feature detect, but assume no support if a touch event occurs
// TODO: see if this makes sense on hybrid touch/mouse devices
function detectPointerLock(self) {
  var lockElementExists = 
      ('pointerLockElement' in document) ||
      ('mozPointerLockElement' in document) ||
      ('webkitPointerLockElement' in document)
  if (lockElementExists) {
    self._pointerLockSupported = true
    var listener = function(e) {
      self._pointerLockSupported = false
      document.removeEventListener(e.type, listener)
    }
    document.addEventListener('touchmove', listener)
  }
}



