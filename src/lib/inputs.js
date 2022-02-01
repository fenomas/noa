/** 
 * The Inputs class is found at [[Inputs | `noa.inputs`]].
 * @module noa.inputs
 */


import { GameInputs } from 'game-inputs'

var defaultOptions = {
    preventDefaults: false,
    stopPropagation: false,
    allowContextMenu: false,
}

var defaultBindings = {
    "forward": ["KeyW", "ArrowUp"],
    "backward": ["KeyS", "ArrowDown"],
    "left": ["KeyA", "ArrowLeft"],
    "right": ["KeyD", "ArrowRight"],
    "fire": "Mouse1",
    "mid-fire": ["Mouse2", "KeyQ"],
    "alt-fire": ["Mouse3", "KeyE"],
    "jump": "Space",
}

/**
 * @internal
 * @returns {GameInputs}
 */
export function createInputs(noa, opts, element) {
    opts = Object.assign({}, defaultOptions, opts)
    var inputs = new GameInputs(element, opts)
    var b = opts.bindings || defaultBindings
    for (var name in b) {
        var keys = Array.isArray(b[name]) ? b[name] : [b[name]]
        inputs.bind(name, ...keys)
    }
    return inputs
}

