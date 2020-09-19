/*!
 * noa: an experimental voxel game engine.
 * @url      github.com/andyhall/noa
 * @author   Andy Hall <andy@fenomas.com>
 * @license  MIT
 */

/*
var vec3 = require('gl-vec3')
var ndarray = require('ndarray')
var raycast = require('fast-voxel-raycast')
var EventEmitter = require('events').EventEmitter
*/

import vec3 from 'gl-vec3'
import ndarray from 'ndarray'
import raycast from 'fast-voxel-raycast'

import { EventEmitter } from 'events'
import { Camera, ICameraOptions } from './lib/camera'
import { Entities, IEntitiesOptions } from './lib/entities'
import { Container, IContainerOptions } from "./lib/container"
import { World, IWorldOptions } from "./lib/world"

import { makePhysics, IPhysicsOptions } from "./lib/physics"
import { makeInputs, IInputOptions } from "./lib/inputs"

import { makeProfileHook } from './lib/util'
import createRendering from './lib/rendering'
import { Registry, IRegistryOptions } from './lib/registry'
import { constants } from './lib/constants'


// todo these types need to pull from babylonjs
export type Material = any
export type Mesh = any
export type Scene = any

declare global {
    interface Window {
        noa: Engine;
        scene: Scene; // this.rendering._scene
        ndarray: ndarray<Uint32Array>;
        vec3: Vector;
    }
}


// profiling flags
const PROFILE = 0
const PROFILE_RENDER = 0

var _pickPos = vec3.create() as Vector

var _hitResult = {
    _localPosition: vec3.create(),
    position: [0, 0, 0],
    normal: [0, 0, 0],
}


interface IEngineOptions extends Partial<ICameraOptions>, Partial<IEntitiesOptions>, Partial<IContainerOptions>, Partial<IPhysicsOptions>, Partial<IInputOptions>, Partial<IWorldOptions>, Partial<IRegistryOptions> {
    /**
     * @default false
     */
    debug: boolean;

    /**
     * @default false
     */
    silent: boolean;

    /**
     * @default 1.8
     */
    playerHeight: number;

    /**
     * @default 0.6
     */
    playerWidth: number;
    playerStart: [0, 10, 0];

    /**
     * @default false
     */
    playerAutoStep: boolean;
    
    /**
     * ms per tick - not ticks per second
     * @default 33
    */
    tickRate: number;

    /**
     * ms per tick - not ticks per second
     * @default 10
    */
    blockTestDistance: number;

    /**
     * @default true
     */
    stickyPointerLock: boolean;

    /**
     * @default true
     */
    dragCameraOutsidePointerLock: boolean;

    /**
     * @default false
     */
    skipDefaultHighlighting: boolean;

    /**
     * @default 25
     */
    originRebaseDistance: 25;
}


const engineDefaults: IEngineOptions = {
    debug: false,
    silent: false,
    playerHeight: 1.8,
    playerWidth: 0.6,
    playerStart: [0, 10, 0],
    playerAutoStep: false,
    tickRate: 33,
    blockTestDistance: 10,
    stickyPointerLock: true,
    dragCameraOutsidePointerLock: true,
    skipDefaultHighlighting: false,
    originRebaseDistance: 25,
}


type Vector = [number, number, number];

type Block = {
    /** voxel ID */
    blockID: number;

    /** the (solid) block being targeted */
    position: Vector;

    /** the (non-solid) block adjacent to the targeted one */
    adjacent: Vector;

    /** position of vector when player is targting the top face of a voxel */
    normal: Vector;
}


/**
 * Main engine object.
 * Takes a big options object full of flags and settings as a parameter.
 * 
 * ```js
 * const NoaEngine = require('noa-engine')
 * const noa = NoaEngine({
 *  blockTestDistance: 8
 * })
 * ```
 * 
 * All option parameters are, well, optional. Note that 
 * the root `options` parameter object is also passed to 
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
class Engine {
    constructor (options: Partial<IEngineOptions>) {
        const optionsWithDefaults = {
            ...engineDefaults,
            ...options
        }
        
        /** version string, e.g. `"0.25.4"` */
        this.version = "!! 3.0-" + require('../package.json').version
        console.log(this.version);
        
        this._tickRate = optionsWithDefaults.tickRate
        this._paused = false
        this._dragOutsideLock = optionsWithDefaults.dragCameraOutsidePointerLock
        var self = this
    
        if (!optionsWithDefaults.silent) {
            var debugstr = (optionsWithDefaults.debug) ? ' (debug)' : ''
            console.log(`noa-engine v${this.version}${debugstr}`)
        }
    
        // world origin offset, used throughout engine for origin rebasing
        this.worldOriginOffset = [0, 0, 0]
        this._originRebaseDistance = optionsWithDefaults.originRebaseDistance
    
        // vec3 library used throughout the engine
        this.vec3 = vec3
    
        // how far engine is into the current tick. Updated each render.
        this.positionInCurrentTick = 0
    
        this.worldName = 'default'
    
        /**
         * container (html/div) manager
         */
        this.container = new Container(this, optionsWithDefaults)
    
        /**
         * inputs manager - abstracts key/mouse input
         * @type {Inputs}
         */
        this.inputs = makeInputs(this, optionsWithDefaults, this.container.element)
    
        /**
         * block/item property registry
         * @type {Registry}
         */
        this.registry = new Registry(this, optionsWithDefaults)
    
        /**
         * world manager
         * @type {World}
         */
        this.world = new World(this, optionsWithDefaults)
    
        /**
         * Rendering manager
         * @type {Rendering}
         */
        this.rendering = createRendering(this, optionsWithDefaults, this.container.canvas)
    
        /**
         * physics engine - solves collisions, properties, etc.
         * @type {Physics}
         */
        this.physics = makePhysics(this, optionsWithDefaults)
    
        /** Entity manager / Entity Component System (ECS) 
         * Aliased to `noa.ents` for convenience.
         * @type {Entities}
         */
        this.entities = new Entities(this, optionsWithDefaults)
        this.ents = this.entities
        var ents = this.ents
    
        /** Entity id for the player entity */
        this.playerEntity = ents.add(
            optionsWithDefaults.playerStart, // starting location
            optionsWithDefaults.playerWidth, optionsWithDefaults.playerHeight,
            null, null, // no mesh for now, no meshOffset, 
            true, true
        )
    
        // make player entity it collide with terrain and other entities
        ents.addComponent(this.playerEntity, ents.names.collideTerrain)
        ents.addComponent(this.playerEntity, ents.names.collideEntities)
    
        // adjust default physics parameters
        var body = ents.getPhysicsBody(this.playerEntity)
        body.gravityMultiplier = 2 // less floaty
        body.autoStep = optionsWithDefaults.playerAutoStep // auto step onto blocks
    
        // input component - sets entity's movement state from key inputs
        ents.addComponent(this.playerEntity, ents.names.receivesInputs)
    
        // add a component to make player mesh fade out when zooming in
        ents.addComponent(this.playerEntity, ents.names.fadeOnZoom)
    
        // movement component - applies movement forces
        // todo: populate movement settings from options
        var moveOpts = {
            airJumps: 1
        }
        ents.addComponent(this.playerEntity, ents.names.movement, moveOpts)
    
    
        /**
         * Manages camera, view angle, etc.
         * @type {Camera}
         */
        this.camera = new Camera(this, optionsWithDefaults)
    
    
        // set up block targeting
        this.blockTestDistance = optionsWithDefaults.blockTestDistance
    
        this.blockTargetIdCheck = this.registry.getBlockSolidity
    
        this.targetedBlock = null
    
        // add a default block highlighting function
        if (!optionsWithDefaults.skipDefaultHighlighting) {
            // the default listener, defined onto noa in case people want to remove it later
            this.defaultBlockHighlightFunction = function (tgt: any) {
                if (tgt) {
                    self.rendering.highlightBlockFace(true, tgt.position, tgt.normal)
                } else {
                    self.rendering.highlightBlockFace(false)
                }
            }
            this.on('targetBlockChanged', this.defaultBlockHighlightFunction)
        }
    
    
        // expose constants, for HACKING™
        this._constants = constants
    
        // temp hacks for development
        if (optionsWithDefaults.debug) {
            window.noa = this
            window.scene = this.rendering._scene
            window.ndarray = ndarray as unknown as ndarray<Uint32Array>
            window.vec3 = vec3 as unknown as Vector
            ents.getMovement(1).airJumps = 999
            this.setViewDistance = function (dist) {
                var cs = this.world.chunkSize
                this.world.chunkAddDistance = dist / cs
                this.world.chunkRemoveDistance = dist / cs + 1
                this.world._lastPlayerChunkID = '' // pings noa's chunk queues
            }
        }
    
        // add hooks to throw helpful errors when using deprecated methods
        deprecateStuff(this)
    }

    private _paused: boolean;
    private _tickRate: number;
    private _dragOutsideLock: boolean;
    private _originRebaseDistance: number;
    private _constants: any;

    version: string;

    defaultBlockHighlightFunction: any;
    positionInCurrentTick: number;
    worldOriginOffset: any;
    vec3: any;


    container: Container;
    inputs: any;
    camera: Camera;
    registry: Registry;
    world: World;
    rendering: any;
    physics: any;
    entities: Entities;

    /**
     * String identifier for the current world. (It's safe to ignore this if
     * your game doesn't need to swap between levels/worlds.)
     */
    worldName: any;

    blockTestDistance: any;

    
    /**
     * Dynamically updated object describing the currently targeted block.
     * Gets updated each tick, to `null` if no block is targeted, or to an object like
     */
    targetedBlock: Block | null;

    
    /**
     * function for which block IDs are targetable. 
     * Defaults to a solidity check, but can be overridden
     */
    blockTargetIdCheck: any;

    ents: any;
    playerEntity: string;

    emit = (event: 'tick' | 'beforeRender' | 'afterRender' | 'targetBlockChanged', callback: any) => {

    }

    on = (event: 'tick' | 'beforeRender' | 'afterRender' | 'targetBlockChanged', callback: (dt: number) => void) => {

    }

    setViewDistance = (dist: number) => {
        var cs = this.world.chunkSize
        this.world.chunkAddDistance = dist / cs
        this.world.chunkRemoveDistance = dist / cs + 1
        this.world._lastPlayerChunkID = '' // pings noa's chunk queues
    }

    /*
     * Tick function, called by container module at a fixed timestep. Emits #tick(dt),
     * where dt is the tick rate in ms (default 16.6)
     */
    tick = () => {
        if (this._paused) {
            return
        }

        profile_hook('start')
        this.checkWorldOffset()
        var dt = this._tickRate // fixed timesteps!
        this.world.tick() // chunk creation/removal
        profile_hook('world')
        if (!this.world.playerChunkLoaded) {
            // when waiting on worldgen, just tick the meshing queue and exit
            this.rendering.tick(dt)
            return
        }
        this.physics.tick(dt) // iterates physics
        profile_hook('physics')
        this.rendering.tick(dt) // does deferred chunk meshing
        profile_hook('rendering')
        updateBlockTargets(this) // finds targeted blocks, and highlights one if needed
        profile_hook('targets')
        this.entities.tick(dt) // runs all entity systems
        profile_hook('entities')
        this.emit('tick', dt)
        profile_hook('tick event')
        profile_hook('end')
        // clear accumulated scroll inputs (mouseMove is cleared on render)
        var st = this.inputs.state
        st.scrollx = st.scrolly = st.scrollz = 0
    }

    /**
     * Render function, called every animation frame. Emits #beforeRender(dt), #afterRender(dt) 
     * where dt is the time in ms *since the last tick*.
     */
    render = (framePart: number) => {
        if (this._paused) {
            return
        }

        profile_hook_render('start')
        // update frame position property and calc dt
        let framesAdvanced = framePart - this.positionInCurrentTick
        if (framesAdvanced < 0) {
            framesAdvanced += 1
        }

        this.positionInCurrentTick = framePart
        const dt = framesAdvanced * this._tickRate // ms since last tick

        // only move camera during pointerlock or mousedown, or if pointerlock is unsupported
        if (this.container.hasPointerLock ||
            !this.container.supportsPointerLock ||
            (this._dragOutsideLock && this.inputs.state.fire)) {
            this.camera.applyInputsToCamera()
        }
        profile_hook('init')
    
        // entity render systems
        this.camera.updateBeforeEntityRenderSystems()
        this.entities.render(dt)
        this.camera.updateAfterEntityRenderSystems()
        profile_hook('entities')
    
        // events and render
        this.emit('beforeRender', dt)
        profile_hook_render('before render')
    
        this.rendering.render(dt)
        profile_hook_render('render')
    
        this.emit('afterRender', dt)
        profile_hook_render('after render')
        profile_hook_render('end')
    
        // clear accumulated mouseMove inputs (scroll inputs cleared on render)
        this.inputs.state.dx = this.inputs.state.dy = 0
    }

    /** 
     * Precisely converts a world position to the current internal 
     * local frame of reference.
     * 
     * See `/doc/positions.md` for more info.
     * 
     * @param global input position in global coords
     * @param globalPrecise sub-voxel offset to the global position
     * @param local output array which will receive the result
     */
    globalToLocal = (global: [number, number, number], globalPrecise: [number, number, number] | null, local: [number, number, number]): [number, number, number] => {
        const off = this.worldOriginOffset

        if (globalPrecise) {
            for (let i = 0; i < 3; i++) {
                let coord = global[i] - off[i]
                coord += globalPrecise[i]
                local[i] = coord
            }
            return local
        } else {
            return vec3.sub(local, global, off) as [number, number, number]
        }
    }

    /**
     * Precisely converts a world position to the current internal 
     * local frame of reference.
     * 
     * See `/doc/positions.md` for more info.
     * 
     * @param local input array of local coords
     * @param global output array which receives the result
     * @param globalPrecise sub-voxel offset to the output global position
     */
    localToGlobal = (local: number[], global: number[], globalPrecise?: number[]) => {
        const off = this.worldOriginOffset

        if (globalPrecise) {
            for (let i = 0; i < 3; i++) {
                let floored = Math.floor(local[i])
                global[i] = floored + off[i]
                globalPrecise[i] = local[i] - floored
            }
            return global
        } else {
            return vec3.add(global, local, off)
        }
    }

    /** 
     * Pausing the engine will also stop render/tick events, etc.
     * @param paused
     */
    setPaused = (paused: boolean) => {
        this._paused = paused
        // when unpausing, clear any built-up mouse inputs
        if (!paused) {
            this.inputs.state.dx = this.inputs.state.dy = 0
        }
    }

    getBlock = (x: any, y: any, z: any) => {
        if (x.length) {
            return this.world.getBlockID(x[0], x[1], x[2])
        } else {
            return this.world.getBlockID(x, y, z)
        }
    }

    setBlock = (id: string, x: any, y: any, z: any) => {
        // skips the entity collision check
        if (x.length) {
            return this.world.setBlockID(id, x[0], x[1], x[2])
        } else {
            return this.world.setBlockID(id, x, y, z)
        }
    }

    /**
     * Adds a block unless obstructed by entities
     */
    addBlock = (id: string, x: any, y: any, z: any): any => {
        // add a new terrain block, if nothing blocks the terrain there
        if (x.length) {
            if (this.entities.isTerrainBlocked(x[0], x[1], x[2])) {
                return
            }

            this.world.setBlockID(id, x[0], x[1], x[2])
            return id
        } else {
            if (this.entities.isTerrainBlocked(x, y, z)) {
                return
            }

            this.world.setBlockID(id, x, y, z)
            return id
        }
    }

    /**
     * Raycast through the world, returning a result object for any non-air block
     * 
     * See `/doc/positions.md` for info on working with precise positions.
     * 
     * @param pos (default: to player eye position)
     * @param vec (default: to camera vector)
     * @param dist (default: `noa.blockTestDistance`)
     * @param blockIdTestFunction (default: voxel solidity)
     * 
     * @returns null, or an object with array properties: `position`, `normal`, `_localPosition`. 
     */
    pick = (pos?: any, vec?: any, dist?: any, blockIdTestFunction?: any) => {
        if (dist === 0) return null
        // input position to local coords, if any
        if (pos) {
            this.globalToLocal(pos, null, _pickPos)
            pos = _pickPos
        }
        return this._localPick(pos, vec, dist, blockIdTestFunction)
    }

    /**
     * Do a raycast in local coords. 
     * 
     * See `/doc/positions.md` for more info.
     * 
     * @param pos
     * @param vec
     * @param dist
     * @param blockIdTestFunction
     */
    _localPick = (pos: number[] | null, vec: any, dist: any, blockIdTestFunction: any) => {
        // do a raycast in local coords - result obj will be in global coords
        if (dist === 0) {
            return null
        }

        const testFn = blockIdTestFunction || this.registry.getBlockSolidity
        const world = this.world
        const off = this.worldOriginOffset
        const testVoxel = function (x: number, y: number, z: number) {
            const id = world.getBlockID(x + off[0], y + off[1], z + off[2])
            return testFn(id)
        }

        if (!pos) {
            pos = this.camera._localGetTargetPosition()
        }

        vec = vec || this.camera.getDirection()
        dist = dist || this.blockTestDistance
        const rpos = _hitResult._localPosition
        const rnorm = _hitResult.normal
        const hit = raycast(testVoxel, pos, vec, dist, rpos, rnorm)
        
        if (!hit) {
            return null
        }

        // position is right on a voxel border - adjust it so that flooring works reliably
        // adjust along normal direction, i.e. away from the block struck
        vec3.scaleAndAdd(rpos, rpos, rnorm, 0.01)
        // add global result
        this.localToGlobal(rpos, _hitResult.position)

        return _hitResult
    }

    /**
     * rebase world origin offset around the player if necessary
     */
    checkWorldOffset = () => {
        const lpos = this.ents.getPositionData(this.playerEntity)._localPosition
        const cutoff = this._originRebaseDistance
        const sqrLen = vec3.sqrLen(lpos) as unknown as number
        if (sqrLen < cutoff * cutoff) {
            return
        }
    
        const delta = []
        for (let i = 0; i < 3; i++) {
            let d = Math.floor(lpos[i])
            delta[i] = d
            this.worldOriginOffset[i] += d
        }
        this.rendering._rebaseOrigin(delta)
        this.entities._rebaseOrigin(delta)
    }
}

Engine.prototype = Object.create(EventEmitter.prototype)





/**
 * Each frame, by default pick along the player's view vector 
 * and tell rendering to highlight the struck block face
 */
function updateBlockTargets(noa: Engine) {
    var newhash = ''
    var blockIdFn = noa.blockTargetIdCheck || noa.registry.getBlockSolidity
    var result = noa._localPick(null, null, null, blockIdFn)
    if (result) {
        var dat = _targetedBlockDat
        // pick stops just shy of voxel boundary, so floored pos is the adjacent voxel
        vec3.floor(dat.adjacent, result.position)
        vec3.copy(dat.normal, result.normal)
        vec3.sub(dat.position, dat.adjacent, dat.normal)
        dat.blockID = noa.world.getBlockID(dat.position[0], dat.position[1], dat.position[2])
        noa.targetedBlock = dat
        newhash = dat.position.join('|') + dat.normal.join('|') + '|' + dat.blockID
    } else {
        noa.targetedBlock = null
    }
    if (newhash != _prevTargetHash) {
        noa.emit('targetBlockChanged', noa.targetedBlock)
        _prevTargetHash = newhash
    }
}

var _targetedBlockDat: Block = {
    blockID: 0,
    position: [0, 0, 0],
    normal: [0, 0, 0],
    adjacent: [0, 0, 0],
}

var _prevTargetHash = ''




/**
 * add some hooks for guidance on removed APIs
 */
function deprecateStuff(noa: Engine) {
    function deprecate(location: any, version: '0.27' | '0.28', name: string, message: string) {
        var throwFn = () => {
            throw new Error(`This property changed in ${version} - ${message}`)
        }
        Object.defineProperty(location, name, {
            get: throwFn,
            set: throwFn
        })
    }

    deprecate(noa, '0.27', 'getPlayerEyePosition', 'to get the camera/player offset see API docs for `noa.camera.cameraTarget`')
    deprecate(noa, '0.27', 'setPlayerEyePosition', 'to set the camera/player offset see API docs for `noa.camera.cameraTarget`')
    deprecate(noa, '0.27', 'getPlayerPosition', 'use `noa.ents.getPosition(noa.playerEntity)` or similar')
    deprecate(noa, '0.27', 'getCameraVector', 'use `noa.camera.getDirection`')
    deprecate(noa, '0.27', 'getPlayerMesh', 'use `noa.ents.getMeshData(noa.playerEntity).mesh` or similar')
    deprecate(noa, '0.27', 'playerBody', 'use `noa.ents.getPhysicsBody(noa.playerEntity)`')
    deprecate(noa.rendering, '0.27', 'zoomDistance', 'use `noa.camera.zoomDistance`')
    deprecate(noa.rendering, '0.27', '_currentZoom', 'use `noa.camera.currentZoom`')
    deprecate(noa.rendering, '0.27', '_cameraZoomSpeed', 'use `noa.camera.zoomSpeed`')
    deprecate(noa.rendering, '0.27', 'getCameraVector', 'use `noa.camera.getDirection`')
    deprecate(noa.rendering, '0.27', 'getCameraPosition', 'use `noa.camera.getLocalPosition`')
    deprecate(noa.rendering, '0.27', 'getCameraRotation', 'use `noa.camera.heading` and `noa.camera.pitch`')
    deprecate(noa.rendering, '0.27', 'setCameraRotation', 'to customize camera behavior see API docs for `noa.camera`')

    deprecate(noa.rendering, '0.28', 'makeMeshInstance', 'removed, use Babylon\'s `mesh.createInstance`')
    deprecate(noa.world, '0.28', '_maxChunksPendingCreation', 'use `maxChunksPendingCreation` (no "_")')
    deprecate(noa.world, '0.28', '_maxChunksPendingMeshing', 'use `maxChunksPendingMeshing` (no "_")')
    deprecate(noa.world, '0.28', '_maxProcessingPerTick', 'use `maxProcessingPerTick` (no "_")')
    deprecate(noa.world, '0.28', '_maxProcessingPerRender', 'use `maxProcessingPerRender` (no "_")')
}


var profile_hook = (PROFILE) ? makeProfileHook(200, 'tick   ') : () => {}
var profile_hook_render = (PROFILE_RENDER) ? makeProfileHook(200, 'render ') : () => {}




export default Engine