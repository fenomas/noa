'use strict';

var createInputs = require('game-inputs')
var extend = require('extend')


module.exports = function(noa, opts, element) {
  return makeInputs(noa, opts, element)
}


var defaultBindings = {
  bindings: {
    "move-up":    [ "W", "<up>" ],
    "move-left":  [ "A", "<left>" ],
    "move-down":  [ "S", "<down>" ],
    "move-right": [ "D", "<right>" ],
    "jump": "<space>"
  }
}


function makeInputs(noa, opts, element) {
  opts = extend( {}, defaultBindings, opts )
  var inputs = createInputs( element, opts )
  var b = opts.bindings
  for (var name in b) {
    var arr = ( Array.isArray(b[name]) ) ? b[name] : [b[name]]
    arr.unshift(name)
    inputs.bind.apply(inputs, arr)
  }
  return inputs
}





