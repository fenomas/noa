
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
        "crouch": ["Z", "<caps-lock>"],
    }
}



//Prevent Ctrl+S (and Ctrl+W for old browsers and Edge)
document.onkeydown = function (e) {
    e = e || window.event;//Get event

    var code = e.which || e.keyCode //Get key code

    if (!e.ctrlKey) return;


    switch (code) {
        case 220: 
        case 83://Block Ctrl+S
        case 87://Block Ctrl+W -- Not work in Chrome and new Firefox
            console.log("yee")
            e.preventDefault()
            e.stopPropagation()
            break;
    }
};


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
