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
 * @emits tick(dt)
 * @emits beforeRender(dt)
 * @emits afterRender(dt)
 * @emits targetBlockChanged(blockDesc)
*/
export class Engine extends EventEmitter {
    /** Version string, e.g. `"0.25.4"`
     * @prop version
    */
    /** The game's tick rate (ticks per second)
     * @prop tickRate
    */
    /** The game's max framerate (use `0` for uncapped)
     * @prop maxRenderRate
    */
    /**  String identifier for the current world. It's safe to ignore this if your game has only one level/world.
     * @prop worldName
    */
    /** How far to check for a solid voxel the player is currently looking at
     * @prop blockTestDistance
    */
    /** Callback to determine which voxels can be targeted. Defaults to a solidity check, but can be overridden
     * @type {(id: number) => boolean}
     * @prop blockTargetIdCheck
    */
    /**
     * @typedef {Object} TargetedBlock - value of `noa.targetedBlock`, updated each tick
     * @prop {number} blockID the ID of the targeted voxel
     * @prop {number[]} position position of the (solid) block being targeted
     * @prop {number[]} adjacent the (non-solid) block adjacent to the targeted one
     * @prop {number[]} normal - e.g. `[0,1,0]` when player is targting the **top** face of a voxel
    */
    /**
     * Dynamically updated object describing the currently targeted block.
     * @prop targetedBlock
     * @type {null | TargetedBlock}
    */
    /**
     * Child module for managing the game's container, canvas, etc.
     * @prop container
     * @type {Container}
     */
    /**
     * Manages the game's camera, view angle, etc.
     * @prop camera
     * @type {Camera}
     */
    /**
     * inputs manager - abstracts key/mouse input
     * @prop inputs
     * @type {import('./lib/inputs').Inputs}
    */
    /** Entity manager / Entity Component System (ECS)
     * Aliased to `noa.ents` for convenience.
     * @prop entities
     * @type {Entities}
    */
    /**
     * @prop ents
     * @type {Entities}
    */
    /**
     * physics engine - solves collisions, properties, etc.
     * @prop physics
     * @type {Physics}
    */
    /**
     * A registry where voxel/material properties are managed
     * @prop registry
     * @type {Registry}
    */
    /**
     * Rendering manager
     * @prop rendering
     * @type {Rendering}
    */
    /**
     * Manages the world, chunks, and all voxel data
     * @prop world
     * @type {World}
    */
    /** @internal @prop _paused */
    /** @internal @prop _dragOutsideLock */
    /** @internal @prop _originRebaseDistance */
    /** @internal @prop positionInCurrentTick */
    /** @internal @prop worldOriginOffset */
    /** @internal @prop _terrainMesher */
    /** @internal @prop _objectMesher */
    /** @internal @prop _targetedBlockDat */
    /** @internal @prop _prevTargetHash */
    /** @internal @prop makeTargetHash */
    /** @internal @prop _pickPos */
    /** @internal @prop _pickResult */
    /** `vec3` class used throughout the engine
     * @type {vec3}
     * @prop vec3 */
    /** `ndarray` class used internally throughout the engine
     * @type {ndarray}
     * @prop ndarray */
    /**
     * @typedef {Object} PickResult
     * @prop {number[]} position position of the picked voxel
     * @prop {number[]} normal specifying which face of the voxel was hit
     * @prop {number[]} _localPosition position in local coordinates
    */
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
    */
    constructor(opts?: {});
    version: string;
    _paused: boolean;
    _dragOutsideLock: any;
    worldOriginOffset: number[];
    _originRebaseDistance: any;
    positionInCurrentTick: number;
    worldName: string;
    container: Container;
    tickRate: any;
    maxRenderRate: any;
    inputs: import("./lib/inputs").Inputs;
    registry: Registry;
    world: World;
    rendering: Rendering;
    physics: Physics;
    entities: Entities;
    ents: Entities;
    /** Entity id for the player entity */
    playerEntity: number;
    camera: Camera;
    blockTestDistance: any;
    blockTargetIdCheck: (id: any) => boolean;
    targetedBlock: any;
    defaultBlockHighlightFunction: (tgt: any) => void;
    _terrainMesher: TerrainMesher;
    _objectMesher: ObjectMesher;
    _targetedBlockDat: {
        blockID: number;
        position: any;
        normal: any;
        adjacent: any;
    };
    _prevTargetHash: number;
    makeTargetHash: (pos: any, norm: any, id: any) => number;
    _pickPos: any;
    _pickResult: {
        _localPosition: any;
        position: number[];
        normal: number[];
    };
    vec3: typeof vec3;
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
    setBlock(id: any, x: any, y?: number, z?: number): any;
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
     * @returns {PickResult}
    */
    pick(pos?: number[], dir?: number[], dist?: number, blockTestFunction?: (id: number) => boolean): PickResult;
    /**
     * Do a raycast in local coords.
     * See `/docs/positions.md` for more info.
     * @param {number[]} pos where to pick from (default: player's eye pos)
     * @param {number[]} dir direction to pick along (default: camera vector)
     * @param {number} dist pick distance (default: `noa.blockTestDistance`)
     * @param {(id:number) => boolean} blockTestFunction which voxel IDs can be picked (default: any solid voxel)
     * @returns {PickResult}
     */
    _localPick(pos?: number[], dir?: number[], dist?: number, blockTestFunction?: (id: number) => boolean): PickResult;
}
/**
 * - value of `noa.targetedBlock`, updated each tick
 */
export type TargetedBlock = {
    /**
     * the ID of the targeted voxel
     */
    blockID: number;
    /**
     * position of the (solid) block being targeted
     */
    position: number[];
    /**
     * the (non-solid) block adjacent to the targeted one
     */
    adjacent: number[];
    /**
     * - e.g. `[0,1,0]` when player is targting the **top** face of a voxel
     */
    normal: number[];
};
export type PickResult = {
    /**
     * position of the picked voxel
     */
    position: number[];
    /**
     * specifying which face of the voxel was hit
     */
    normal: number[];
    /**
     * position in local coordinates
     */
    _localPosition: number[];
};
import { EventEmitter } from "events";
import { Container } from "./lib/container";
import { Registry } from "./lib/registry";
import { World } from "./lib/world";
import { Rendering } from "./lib/rendering";
import { Physics } from "./lib/physics";
import { Entities } from "./lib/entities";
import { Camera } from "./lib/camera";
import TerrainMesher from "./lib/terrainMesher";
import ObjectMesher from "./lib/objectMesher";
import vec3 from "gl-vec3";
