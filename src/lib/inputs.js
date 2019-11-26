
var createInputs = require('game-inputs')
// var createInputs = require('../../../../npm-modules/game-inputs')


export default function (noa, opts, element) {
    return makeInputs(noa, opts, element)
}


/**
 * @class Inputs
 * @typicalname noa.inputs
 * @classdesc Abstracts key/mouse input. 
 * For docs see [andyhall/game-inputs](https://github.com/andyhall/game-inputs)
 */


var defaultBindings = {
    bindings: {
        "forward": ["W", "<up>"],
        "left": ["A", "<left>"],
        "backward": ["S", "<down>"],
        "right": ["D", "<right>"],
        "fire": "<mouse 1>",
        "mid-fire": ["<mouse 2>", "Q"],
        "alt-fire": ["<mouse 3>", "E"],
        "jump": "<space>",
        "sprint": "<shift>",
        "crouch": "<control>"
    }
}


function makeInputs(noa, opts, element) {
    opts = Object.assign({}, defaultBindings, opts)
    var inputs = createInputs(element, opts)
    var b = opts.bindings
    for (var name in b) {
        var arr = (Array.isArray(b[name])) ? b[name] : [b[name]]
        arr.unshift(name)
        inputs.bind.apply(inputs, arr)
    }
    return inputs
}
