export default Engine;

type EngineOptions = Partial<
    {
        debug: boolean;
        silent: boolean;
        playerHeight: number;
        playerWidth: number;
        playerStart: number[];
        playerAutoStep: number;
        tickRate: number;
        blockTestDistance: number;
        stickyPointerLock: boolean;
        dragCameraOutsidePointerLock: boolean;
        skipDefaultHighlighting: boolean;
        originRebaseDistance: number;
    } & RenderingOptions
>;
/**
 * Main engine object.
 * Takes a big options object full of flags and settings as a parameter.
 *
 * ```js
 * var opts = {
 *     debug: false,
 *     silent: false,
 *     playerHeight: 1.8,
 *     playerWidth: 0.6,
 *     playerStart: [0, 10, 0],
 *     playerAutoStep: false,
 *     tickRate: 33, // ms per tick - not ticks per second
 *     blockTestDistance: 10,
 *     stickyPointerLock: true,
 *     dragCameraOutsidePointerLock: true,
 *     skipDefaultHighlighting: false,
 *     originRebaseDistance: 25,
 * }
 * var NoaEngine = require('noa-engine')
 * var noa = NoaEngine(opts)
 * ```
 *
 * All option parameters are, well, optional. Note that
 * the root `opts` parameter object is also passed to
 * noa's child modules (rendering, camera, etc).
 * See docs for each module for which options they use.
 *
 * @class
 * @alias Noa
 * @typicalname noa
 * @emits tick(dt)
 * @emits beforeRender(dt)
 * @emits afterRender(dt)
 * @emits targetBlockChanged(blockDesc)
 * @classdesc Root class of the noa engine
 *
 * Extends: `EventEmitter`
 */
declare module "noa-engine" {
    export class Engine {
        /**
         * Main engine object.
         * Takes a big options object full of flags and settings as a parameter.
         *
         * ```js
         * var opts = {
         *     debug: false,
         *     silent: false,
         *     playerHeight: 1.8,
         *     playerWidth: 0.6,
         *     playerStart: [0, 10, 0],
         *     playerAutoStep: false,
         *     tickRate: 33, // ms per tick - not ticks per second
         *     blockTestDistance: 10,
         *     stickyPointerLock: true,
         *     dragCameraOutsidePointerLock: true,
         *     skipDefaultHighlighting: false,
         *     originRebaseDistance: 25,
         * }
         * var NoaEngine = require('noa-engine')
         * var noa = NoaEngine(opts)
         * ```
         *
         * All option parameters are, well, optional. Note that
         * the root `opts` parameter object is also passed to
         * noa's child modules (rendering, camera, etc).
         * See docs for each module for which options they use.
         *
         * @class
         * @alias Noa
         * @typicalname noa
         * @emits tick(dt)
         * @emits beforeRender(dt)
         * @emits afterRender(dt)
         * @emits targetBlockChanged(blockDesc)
         * @classdesc Root class of the noa engine
         *
         * Extends: `EventEmitter`
         */
        constructor(opts: EngineOptions);
        /**  version string, e.g. `"0.25.4"` */
        version: any;
        _tickRate: any;
        _lastRenderTime: number;
        _paused: boolean;
        _dragOutsideLock: any;
        worldOriginOffset: number[];
        _originRebaseDistance: any;
        vec3: any;
        positionInCurrentTick: number;
        /** String identifier for the current world. (It's safe to ignore this if
         * your game doesn't need to swap between levels/worlds.)
         */
        worldName: string;
        /**
         * container (html/div) manager
         * @type {Container}
         */
        container: Container;
        /**
         * inputs manager - abstracts key/mouse input
         * @type {Inputs}
         */
        inputs: any;
        /**
         * block/item property registry
         * @type {Registry}
         */
        registry: Registry;
        /**
         * world manager
         * @type {World}
         */
        world: World;
        /**
         * Rendering manager
         * @type {Rendering}
         */
        rendering: Rendering;
        /**
         * physics engine - solves collisions, properties, etc.
         * @type {Physics}
         */
        physics: any;
        /** Entity manager / Entity Component System (ECS)
         * Aliased to `noa.ents` for convenience.
         * @type {Entities}
         */
        entities: Entities;
        ents: Entities;
        /** Entity id for the player entity */
        playerEntity: number;
        /**
         * Manages camera, view angle, etc.
         * @type {Camera}
         */
        camera: Camera;
        blockTestDistance: number;
        /** function for which block IDs are targetable.
         * Defaults to a solidity check, but can be overridden */
        blockTargetIdCheck: any;
        /** Dynamically updated object describing the currently targeted block.
         * Gets updated each tick, to `null` if not block is targeted, or
         * to an object like:
         *
         *     {
         *        blockID,   // voxel ID
         *        position,  // the (solid) block being targeted
         *        adjacent,  // the (non-solid) block adjacent to the targeted one
         *        normal,    // e.g. [0, 1, 0] when player is targting the top face of a voxel
         *     }
         */
        targetedBlock: any;
        defaultBlockHighlightFunction: (tgt: any) => void;
        _constants: typeof constants;
        setViewDistance: (dist: any) => void;
        tick(): void;
        render(framePart: any): void;
        globalToLocal(global: any, globalPrecise: any, local: any): any;
        localToGlobal(local: any, global: any, globalPrecise: any): any;
        setPaused(paused: any): void;
        getBlock(x: number, y: number, z: number): any;
        setBlock(id: number, x: number, y: number, z: number): any;
        addBlock(id: number, x: number, y: number, z: number): any;
        pick(
            pos: number[],
            vec: number[],
            dist: number,
            blockIdTestFunction: any
        ): {
            _localPosition: any;
            position: number[];
            normal: number[];
        };
        _localPick(
            pos: number[],
            vec: number[],
            dist: number,
            blockIdTestFunction: any
        ): {
            _localPosition: any;
            position: number[];
            normal: number[];
        };
    }
}

import { constants } from "./lib/constants";
import { Registry } from "./lib/registry";
import { Camera } from "./lib/camera";
import { Entities } from "./lib/entities";
import { Rendering, RenderingOptions } from "./lib/rendering";
import { World } from "./lib/world";
import { Container } from "./lib/container";
