'use strict';

var extend = require('extend')
//var Stats = require('./stats')
//var Detector = require('./detector')
var createGameShell = require('game-shell')

module.exports = function(noa, opts) {
  return new Container(noa, opts)
}



function Container(noa, opts) {
  opts = opts || {}
  this._noa = noa
  this._element = opts.domElement || createContainerDiv()
  this._shell = createShell( this._element, opts )
  
  this.canvas = getOrCreateCanvas(this._element)
}




/*
 *   PUBLIC API 
*/ 



Container.prototype.appendTo = function(htmlElement) {
  this._element.appendChild( htmlElement )
}



/*
 *   SHELL EVENTS
*/ 

Container.prototype.initEvents = function() {
  var e = this._noa
  this._shell.on('tick', e.tick.bind(e) )
  this._shell.on('render', e.render.bind(e) )
  this._shell.on('resize', e.rendering.resize.bind(e.rendering  ) )
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




