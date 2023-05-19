/**
 * Main engine class.
 * Takes an object full of optional settings as a parameter.
 *
 * ```js
 * import { Engine } from 'noa-engine'
 * var noa = new Engine({
 *    debug: false,
 * })
 * ```
 *
 * Note that the options object is also passed to noa's
 * child modules ({@link Rendering}, {@link Container}, etc).
 * See docs for each module for their options.
 *
*/
export class Engine extends EventEmitter {
    /**
     * The core Engine constructor uses the following options:
     *
     * ```js
     * var defaultOptions = {
     *    debug: false,
     *    silent: false,
     *    playerHeight: 1.8,
     *    playerWidth: 0.6,
     *    playerStart: [0, 10, 0],
     *    playerAutoStep: false,
     *    playerShadowComponent: true,
     *    tickRate: 30,           // ticks per second
     *    maxRenderRate: 0,       // max FPS, 0 for uncapped
     *    blockTestDistance: 10,
     *    stickyPointerLock: true,
     *    dragCameraOutsidePointerLock: true,
     *    stickyFullscreen: false,
     *    skipDefaultHighlighting: false,
     *    originRebaseDistance: 25,
     * }
     * ```
     *
     * **Events:**
     *  + `tick => (dt)`
     *    Tick update, `dt` is (fixed) tick duration in ms
     *  + `beforeRender => (dt)`
     *    `dt` is the time (in ms) since the most recent tick
     *  + `afterRender => (dt)`
     *    `dt` is the time (in ms) since the most recent tick
     *  + `targetBlockChanged => (blockInfo)`
     *    Emitted each time the user's targeted world block changes
     *  + `addingTerrainMesh => (mesh)`
     *    Alerts client about a terrain mesh being added to the scene
     *  + `removingTerrainMesh => (mesh)`
     *    Alerts client before a terrain mesh is removed.
    */
    constructor(opts?: {});
    /** Version string, e.g. `"0.25.4"` */
    version: string;
    /** @internal */
    _paused: boolean;
    /** @internal */
    _originRebaseDistance: any;
    /** @internal */
    worldOriginOffset: number[];
    /** @internal */
    positionInCurrentTick: number;
    /**
     * String identifier for the current world.
     * It's safe to ignore this if your game has only one level/world.
    */
    worldName: string;
    /**
     * Multiplier for how fast time moves. Setting this to a value other than
     * `1` will make the game speed up or slow down. This can significantly
     * affect how core systems behave (particularly physics!).
    */
    timeScale: number;
    /** Child module for managing the game's container, canvas, etc. */
    container: Container;
    /** The game's tick rate (number of ticks per second)
     * @type {number}
     * @readonly
    */
    readonly tickRate: number;
    /** The game's max framerate (use `0` for uncapped)
     * @type {number}
     */
    maxRenderRate: number;
    /** Manages key and mouse input bindings */
    inputs: Inputs;
    /** A registry where voxel/material properties are managed */
    registry: Registry;
    /** Manages the world, chunks, and all voxel data */
    world: World;
    /** Rendering manager */
    rendering: Rendering;
    /** Physics engine - solves collisions, properties, etc. */
    physics: Physics;
    /** Entity manager / Entity Component System (ECS) */
    entities: Entities;
    /** Alias to `noa.entities` */
    ents: Entities;
    /** Entity id for the player entity */
    playerEntity: number;
    /** Manages the game's camera, view angle, sensitivity, etc. */
    camera: Camera;
    /** How far to check for a solid voxel the player is currently looking at
     * @type {number}
    */
    blockTestDistance: number;
    /**
     * Callback to determine which voxels can be targeted.
     * Defaults to a solidity check, but can be overridden with arbitrary logic.
     * @type {(blockID: number) => boolean}
    */
    blockTargetIdCheck: (blockID: number) => boolean;
    /**
     * Dynamically updated object describing the currently targeted block.
     * @type {null | {
     *      blockID:number,
     *      position: number[],
     *      normal: number[],
     *      adjacent: number[],
     * }}
    */
    targetedBlock: {
        blockID: number;
        position: number[];
        normal: number[];
        adjacent: number[];
    };
    defaultBlockHighlightFunction: (tgt: any) => void;
    /** @internal */
    _terrainMesher: TerrainMesher;
    /** @internal */
    _objectMesher: ObjectMesher;
    /** @internal */
    _targetedBlockDat: {
        blockID: number;
        position: any;
        normal: any;
        adjacent: any;
    };
    /** @internal */
    _prevTargetHash: number;
    /** @internal */
    _pickPos: any;
    /** @internal */
    _pickResult: {
        _localPosition: any;
        position: number[];
        normal: number[];
    };
    /** @internal */
    vec3: typeof vec3;
    /** @internal */
    ndarray: any;
    /**
     * Tick function, called by container module at a fixed timestep.
     * Clients should not normally need to call this manually.
     * @internal
    */
    tick(dt: any): void;
    /**
     * Render function, called every animation frame. Emits #beforeRender(dt), #afterRender(dt)
     * where dt is the time in ms *since the last tick*.
     * Clients should not normally need to call this manually.
     * @internal
    */
    render(dt: any, framePart: any): void;
    /** Pausing the engine will also stop render/tick events, etc. */
    setPaused(paused?: boolean): void;
    /**
     * Get the voxel ID at the specified position
    */
    getBlock(x: any, y?: number, z?: number): any;
    /**
     * Sets the voxel ID at the specified position.
     * Does not check whether any entities are in the way!
     */
    setBlock(id: any, x: any, y?: number, z?: number): void;
    /**
     * Adds a block, unless there's an entity in the way.
    */
    addBlock(id: any, x: any, y?: number, z?: number): any;
    /**
     * Precisely converts a world position to the current internal
     * local frame of reference.
     *
     * See `/docs/positions.md` for more info.
     *
     * Params:
     *  * `global`: input position in global coords
     *  * `globalPrecise`: (optional) sub-voxel offset to the global position
     *  * `local`: output array which will receive the result
     */
    globalToLocal(global: any, globalPrecise: any, local: any): any;
    /**
     * Precisely converts a world position to the current internal
     * local frame of reference.
     *
     * See `/docs/positions.md` for more info.
     *
     * Params:
     *  * `local`: input array of local coords
     *  * `global`: output array which receives the result
     *  * `globalPrecise`: (optional) sub-voxel offset to the output global position
     *
     * If both output arrays are passed in, `global` will get int values and
     * `globalPrecise` will get fractional parts. If only one array is passed in,
     * `global` will get the whole output position.
    */
    localToGlobal(local: any, global: any, globalPrecise?: any): any;
    /**
     * Raycast through the world, returning a result object for any non-air block
     *
     * See `/docs/positions.md` for info on working with precise positions.
     *
     * @param {number[]} pos where to pick from (default: player's eye pos)
     * @param {number[]} dir direction to pick along (default: camera vector)
     * @param {number} dist pick distance (default: `noa.blockTestDistance`)
     * @param {(id:number) => boolean} blockTestFunction which voxel IDs can be picked (default: any solid voxel)
    */
    pick(pos?: number[], dir?: number[], dist?: number, blockTestFunction?: (id: number) => boolean): {
        position: number[];
        normal: number[];
        _localPosition: number[];
    };
    /**
     * @internal
     * Do a raycast in local coords.
     * See `/docs/positions.md` for more info.
     * @param {number[]} pos where to pick from (default: player's eye pos)
     * @param {number[]} dir direction to pick along (default: camera vector)
     * @param {number} dist pick distance (default: `noa.blockTestDistance`)
     * @param {(id:number) => boolean} blockTestFunction which voxel IDs can be picked (default: any solid voxel)
     * @returns { null | {
     *      position: number[],
     *      normal: number[],
     *      _localPosition: number[],
     * }}
     */
    _localPick(pos?: number[], dir?: number[], dist?: number, blockTestFunction?: (id: number) => boolean): null | {
        position: number[];
        normal: number[];
        _localPosition: number[];
    };
}
import { EventEmitter } from 'events';
import { Container } from './lib/container';
import { Inputs } from './lib/inputs';
import { Registry } from './lib/registry';
import { World } from './lib/world';
import { Rendering } from './lib/rendering';
import { Physics } from './lib/physics';
import { Entities } from './lib/entities';
import { Camera } from './lib/camera';
import { TerrainMesher } from './lib/terrainMesher';
import { ObjectMesher } from './lib/objectMesher';
import vec3 from 'gl-vec3';
