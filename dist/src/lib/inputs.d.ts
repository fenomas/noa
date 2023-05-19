/**
 * `noa.inputs` - Handles key and mouse input bindings.
 *
 * This module extends
 * [game-inputs](https://github.com/fenomas/game-inputs),
 * so turn on "Inherited" to see its APIs here, or view the base module
 * for full docs.
 *
 * This module uses the following default options (from the options
 * object passed to the {@link Engine}):
 *
 * ```js
 *   defaultBindings: {
 *     "forward":  ["KeyW", "ArrowUp"],
 *     "backward": ["KeyS", "ArrowDown"],
 *     "left":     ["KeyA", "ArrowLeft"],
 *     "right":    ["KeyD", "ArrowRight"],
 *     "fire":     "Mouse1",
 *     "mid-fire": ["Mouse2", "KeyQ"],
 *     "alt-fire": ["Mouse3", "KeyE"],
 *     "jump":     "Space",
 *   }
 * ```
 */
export class Inputs extends GameInputs {
    /** @internal */
    constructor(noa: any, opts: any, element: any);
}
import { GameInputs } from 'game-inputs';
