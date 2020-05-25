export declare class Container {
    /**
     * @class
     * @typicalname noa.container
     * @emits DOMready
     * @classdesc Wraps `game-shell` module
     * and manages HTML container, canvas, etc.
     */
    constructor(noa: any, opts: any);
    _noa: any;
    element: any;
    canvas: any;
    _shell: any;
    hasPointerLock: boolean;
    supportsPointerLock: boolean;
    pointerInGame: boolean;
    isFocused: boolean;
    appendTo(htmlElement: any): void;
    setPointerLock(lock: any): void;
}
