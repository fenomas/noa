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
    /** @internal @prop _noa */
    /** @internal @prop _shell */
    /** The game's DOM element container
     * @prop element
    */
    /** The `canvas` element that the game will draw into
     * @prop canvas
    */
    /** Whether the browser supports pointerLock. Read-only!
     * @prop supportsPointerLock
    */
    /** Whether the user's pointer is within the game area. Read-only!
     * @prop pointerInGame
    */
    /** Whether the game is focused. Read-only!
     * @prop isFocused
    */
    /** Gets the current state of pointerLock. Read-only!
     * @prop hasPointerLock
    */
    /** @internal */
    constructor(noa: any, opts: any);
    _noa: any;
    element: any;
    canvas: any;
    _shell: any;
    supportsPointerLock: boolean;
    pointerInGame: boolean;
    isFocused: boolean;
    hasPointerLock: boolean;
    /** @internal */
    appendTo(htmlElement: any): void;
    /**
     * Sets whether `noa` should try to acquire or release pointerLock
    */
    setPointerLock(lock?: boolean): void;
}
import { EventEmitter } from "events";
