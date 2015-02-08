'use strict';

var vkey = require('vkey')
var EventEmitter = require('events').EventEmitter;


module.exports = function(noa, opts) {
  return new Inputs(noa, opts)
}


/*
 *    Simple inputs manager.
 *  
 *  Exposes a way to bind/unbind action names to (vkey) codes.
 *  
 *  inputs.registerBinding( 'right', 'R' )
 *  inputs.registerBinding( 'go-left', 'A' )
 *  inputs.unregisterBinding( 'go-left', 'A' )
 *  inputs.down.on( 'left', function( binding, event ){} )
 *  inputs.up.on( 'right',  function( binding, event ){} )
 *  inputs.isDown( 'right' )  // returns boolean
 *  
*/


function Inputs(noa, opts) {
  opts = opts || {}
  this._noa = noa
  this._shell = noa.container._shell
  this._element = null
  
  this.down = new EventEmitter()
  this.up = new EventEmitter()
  this.preventDefaults = !!opts.preventDefaults
  
  this._bindings = {}
  this._keystates = {}
  this._boundstates = {}
}




/*
 *   PUBLIC API 
*/ 

Inputs.prototype.initEvents = function(element) {
  this._element = element
  element.addEventListener( 'keydown', this._keyDown.bind(this) )
  element.addEventListener( 'keyup', this._keyUp.bind(this) )
}


// _bindings maps vkey codes to binding names
//    e.g. this._bindings['a'] = 'move-left'
Inputs.prototype.registerBinding = function(binding, vkeyCode) {
  if (! this._bindings[vkeyCode]) {
    this._bindings[vkeyCode] = []
  }
  var b = this._bindings[vkeyCode]
  if (b.indexOf(binding) == -1) {
    b.push(binding)
  }
}

Inputs.prototype.unregisterBinding = function(binding, vkeyCode) {
  if (! this._bindings[vkeyCode] ) return
  var b = this._bindings[vkeyCode]
  var i = b.indexOf(binding)
  if (i>-1) {
    b.splice(i,1)
  }
}

// checks (cached) state of a keybinding
//   e.g.   inputs.isDown('move-left')
Inputs.prototype.isDown = function(binding) {
  return !!this._boundstates[binding]
}


Inputs.prototype.getBindingList = function() {
  // NYI
}



/*
 *   INTERNALS
*/ 


Inputs.prototype._keyDown = function(ev) {
  if (this.preventDefaults) ev.preventDefault()
  
  var kc = ev.keyCode
  if (!this._keystates[kc]) {
    emitBoundEvents( kc, this.down, this._bindings, ev )
    setBoundStates( kc, true, this._bindings, this._boundstates )
  }
  this._keystates[kc] = 1
}

Inputs.prototype._keyUp = function(ev) {
  if (this.preventDefaults) ev.preventDefault()
  
  var kc = ev.keyCode
  if (this._keystates[kc]) { // is this necessary?
    emitBoundEvents( kc, this.up, this._bindings, ev )
    setBoundStates( kc, false, this._bindings, this._boundstates )
  }
  this._keystates[kc] = 0
}




// helper - emit events for any bindings of a given keycode
function emitBoundEvents( keycode, emitter, bindings, event ) {
  var v = vkey[keycode]
  var b = bindings[v]
  if (b) {
    for (var i=0; i<b.length; ++i) {
      emitter.emit( b[i], event )
    }
  }
}

// helper - for a given keycode and state, cache that state for 
// any bound meanings of that keycode
function setBoundStates( keycode, isDown, bindings, boundStates ) {
  var v = vkey[keycode]
  var b = bindings[v]
  if (b) {
    for (var i=0; i<b.length; ++i) {
      boundStates[ b[i] ] = isDown
    }
  }
}



