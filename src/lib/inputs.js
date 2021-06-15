
import makeInputs from 'game-inputs'
// import { Inputs as GameInputs } from '../../../../npm-modules/game-inputs'



var defaultOptions = {
    preventDefaults: false,
    stopPropagation: false,
    allowContextMenu: false,
}

var defaultBindings = {
    "forward": ["W", "<up>"],
    "left": ["A", "<left>"],
    "backward": ["S", "<down>"],
    "right": ["D", "<right>"],
    "fire": "<mouse 1>",
    "mid-fire": ["<mouse 2>", "Q"],
    "alt-fire": ["<mouse 3>", "E"],
    "jump": "<space>",
    "sprint": "<shift>",
    "crouch": "<control>",
}

/**
 * @internal
 * @returns {Inputs}
 */
export function createInputs(noa, opts, element) {
    opts = Object.assign({}, defaultOptions, opts)
    var inputs = makeInputs(element, opts)
    var b = opts.bindings || defaultBindings
    for (var name in b) {
        var arr = (Array.isArray(b[name])) ? b[name] : [b[name]]
        arr.unshift(name)
        inputs.bind.apply(inputs, arr)
    }
    return inputs
}







/**
 * `noa.inputs` - manages keybinds and mouse input.
 *
 * Extends [andyhall/game-inputs](https://github.com/andyhall/game-inputs),
 * see there for implementation and docs.
 * 
 * By default, the following bindings will be made automatically. 
 * You can undo bindings with `unbind`, or specify your own with a 
 * `bindings` property on the options object passed to the [[Engine]].
 * 
 * ```js
 * var defaultBindings = {
 *     "forward": ["W", "<up>"],
 *     "left": ["A", "<left>"],
 *     "backward": ["S", "<down>"],
 *     "right": ["D", "<right>"],
 *     "fire": "<mouse 1>",
 *     "mid-fire": ["<mouse 2>", "Q"],
 *     "alt-fire": ["<mouse 3>", "E"],
 *     "jump": "<space>",
 *     "sprint": "<shift>",
 *     "crouch": "<control>",
 * }
 * ```
 *
 * @typedef {Object} Inputs
 * @prop {boolean} disabled
 * @prop {Object} state Maps key binding names to input states.
 * @prop {(binding:string, ...keyCodes:string[]) => void} bind Binds one or more keycodes to a binding.
 * @prop {(binding:string) => void} unbind Unbinds all keyCodes from a binding.
 * @prop {import('events').EventEmitter} down Emits input start events (i.e. keyDown).
 * @prop {import('events').EventEmitter} up Emits input end events (i.e. keyUp).
*/


