/**
 * `noa.container` - manages the game's HTML container element, canvas,
 * fullscreen, pointerLock, and so on.
 *
 * This module wraps `micro-game-shell`, which does most of the implementation.
 *
 * @emits DOMready
 * @emits gainedPointerLock
 * @emits lostPointerLock
 */
export class Container extends EventEmitter {
    /** @internal */
    constructor(noa: any, opts: any);
    /**
     * @internal
     * @type {import('../index').Engine}
    */
    noa: import('../index').Engine;
    /** The game's DOM element container */
    element: any;
    /** The `canvas` element that the game will draw into */
    canvas: any;
    /** Whether the browser supports pointerLock. @readonly */
    supportsPointerLock: boolean;
    /** Whether the user's pointer is within the game area. @readonly */
    pointerInGame: boolean;
    /** Whether the game is focused. @readonly */
    isFocused: boolean;
    /** Gets the current state of pointerLock. @readonly */
    hasPointerLock: boolean;
    /** @internal */
    _shell: any;
    /** @internal */
    appendTo(htmlElement: any): void;
    /**
     * Sets whether `noa` should try to acquire or release pointerLock
    */
    setPointerLock(lock?: boolean): void;
}
import { EventEmitter } from "events";
