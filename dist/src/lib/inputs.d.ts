/**
 * @internal
 * @returns {Inputs}
 */
export function createInputs(noa: any, opts: any, element: any): Inputs;
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
 */
export type Inputs = {
    disabled: boolean;
    /**
     * Maps key binding names to input states.
     */
    state: any;
    /**
     * Binds one or more keycodes to a binding.
     */
    bind: (binding: string, ...keyCodes: string[]) => void;
    /**
     * Unbinds all keyCodes from a binding.
     */
    unbind: (binding: string) => void;
    /**
     * Emits input start events (i.e. keyDown).
     */
    down: import('events').EventEmitter;
    /**
     * Emits input end events (i.e. keyUp).
     */
    up: import('events').EventEmitter;
};
