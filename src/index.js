
/*!
 * noa: an experimental voxel game engine.
 * @url      github.com/fenomas/noa
 * @author   Andy Hall <andy@fenomas.com>
 * @license  MIT
 */

import './lib/shims'

import { EventEmitter } from 'events'
import vec3 from 'gl-vec3'
import ndarray from 'ndarray'
import raycast from 'fast-voxel-raycast'

import { Inputs } from './lib/inputs'
import { Container } from './lib/container'
import { Camera } from './lib/camera'
import { Entities } from './lib/entities'
import { ObjectMesher } from './lib/objectMesher'
import { TerrainMesher } from './lib/terrainMesher'
import { Registry } from './lib/registry'
import { Rendering } from './lib/rendering'
import { Physics } from './lib/physics'
import { World } from './lib/world'
import { locationHasher } from './lib/util'
import { makeProfileHook } from './lib/util'


import packageJSON from '../package.json'
var version = packageJSON.version



// profile every N ticks/renders
var PROFILE = 0
var PROFILE_RENDER = 0


var defaultOptions = {
    debug: false,
    silent: false,
    silentBabylon: false,
    playerHeight: 1.8,
    playerWidth: 0.6,
    playerStart: [0, 10, 0],
    playerAutoStep: false,
    playerShadowComponent: true,
    tickRate: 30,           // ticks per second
    maxRenderRate: 0,       // max FPS, 0 for uncapped 
    blockTestDistance: 10,
    stickyPointerLock: true,
    dragCameraOutsidePointerLock: true,
    stickyFullscreen: false,
    skipDefaultHighlighting: false,
    originRebaseDistance: 25,
}


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
    constructor(opts = {}) {
        super()
        opts = Object.assign({}, defaultOptions, opts)

        /** Version string, e.g. `"0.25.4"` */
        this.version = version
        if (!opts.silent) {
            var debugstr = (opts.debug) ? ' (debug)' : ''
            console.log(`noa-engine v${this.version}${debugstr}`)
        }

        /** @internal */
        this._paused = false

        /** @internal */
        this._originRebaseDistance = opts.originRebaseDistance

        // world origin offset, used throughout engine for origin rebasing
        /** @internal */
        this.worldOriginOffset = [0, 0, 0]

        // how far engine is into the current tick. Updated each render.
        /** @internal */
        this.positionInCurrentTick = 0

        /** 
         * String identifier for the current world. 
         * It's safe to ignore this if your game has only one level/world. 
        */
        this.worldName = 'default'

        /**
         * Multiplier for how fast time moves. Setting this to a value other than 
         * `1` will make the game speed up or slow down. This can significantly 
         * affect how core systems behave (particularly physics!).
        */
        this.timeScale = 1

        /** Child module for managing the game's container, canvas, etc. */
        this.container = new Container(this, opts)

        /** The game's tick rate (number of ticks per second) 
         * @type {number}
         * @readonly 
        */
        this.tickRate = this.container._shell.tickRate
        Object.defineProperty(this, 'tickRate', {
            get: () => this.container._shell.tickRate
        })

        /** The game's max framerate (use `0` for uncapped)
         * @type {number}
         */
        this.maxRenderRate = this.container._shell.maxRenderRate
        Object.defineProperty(this, 'maxRenderRate', {
            get: () => this.container._shell.maxRenderRate,
            set: (v) => { this.container._shell.maxRenderRate = v || 0 },
        })


        /** Manages key and mouse input bindings */
        this.inputs = new Inputs(this, opts, this.container.element)

        /** A registry where voxel/material properties are managed */
        this.registry = new Registry(this, opts)

        /** Manages the world, chunks, and all voxel data */
        this.world = new World(this, opts)

        var _consoleLog = console.log
        if (opts.silentBabylon) console.log = () => { }

        /** Rendering manager */
        this.rendering = new Rendering(this, opts, this.container.canvas)

        if (opts.silentBabylon) console.log = _consoleLog

        /** Physics engine - solves collisions, properties, etc. */
        this.physics = new Physics(this, opts)

        /** Entity manager / Entity Component System (ECS) */
        this.entities = new Entities(this, opts)

        /** Alias to `noa.entities` */
        this.ents = this.entities
        var ents = this.entities

        /** Entity id for the player entity */
        this.playerEntity = ents.add(
            opts.playerStart, // starting location
            opts.playerWidth, opts.playerHeight,
            null, null, // no mesh for now, no meshOffset, 
            true, opts.playerShadowComponent,
        )

        // make player entity it collide with terrain and other entities
        ents.addComponent(this.playerEntity, ents.names.collideTerrain)
        ents.addComponent(this.playerEntity, ents.names.collideEntities)

        // adjust default physics parameters
        var body = ents.getPhysics(this.playerEntity).body
        body.gravityMultiplier = 2 // less floaty
        body.autoStep = opts.playerAutoStep // auto step onto blocks

        // input component - sets entity's movement state from key inputs
        ents.addComponent(this.playerEntity, ents.names.receivesInputs)

        // add a component to make player mesh fade out when zooming in
        ents.addComponent(this.playerEntity, ents.names.fadeOnZoom)

        // movement component - applies movement forces
        ents.addComponent(this.playerEntity, ents.names.movement, {
            airJumps: 1
        })

        /** Manages the game's camera, view angle, sensitivity, etc. */
        this.camera = new Camera(this, opts)

        /** How far to check for a solid voxel the player is currently looking at 
         * @type {number}
        */
        this.blockTestDistance = opts.blockTestDistance

        /** 
         * Callback to determine which voxels can be targeted. 
         * Defaults to a solidity check, but can be overridden with arbitrary logic.
         * @type {(blockID: number) => boolean} 
        */
        this.blockTargetIdCheck = this.registry.getBlockSolidity

        /** 
         * Dynamically updated object describing the currently targeted block.
         * @type {null | { 
         *      blockID:number,
         *      position: number[],
         *      normal: number[],
         *      adjacent: number[],
         * }} 
        */
        this.targetedBlock = null

        // add a default block highlighting function
        if (!opts.skipDefaultHighlighting) {
            // the default listener, defined onto noa in case people want to remove it later
            this.defaultBlockHighlightFunction = (tgt) => {
                if (tgt) {
                    this.rendering.highlightBlockFace(true, tgt.position, tgt.normal)
                } else {
                    this.rendering.highlightBlockFace(false)
                }
            }
            this.on('targetBlockChanged', this.defaultBlockHighlightFunction)
        }


        /*
         *
         *      Various internals...
         *
        */

        /** @internal */
        this._terrainMesher = new TerrainMesher(this)

        /** @internal */
        this._objectMesher = new ObjectMesher(this)

        /** @internal */
        this._targetedBlockDat = {
            blockID: 0,
            position: vec3.create(),
            normal: vec3.create(),
            adjacent: vec3.create(),
        }

        /** @internal */
        this._prevTargetHash = 0


        /** @internal */
        this._pickPos = vec3.create()

        /** @internal */
        this._pickResult = {
            _localPosition: vec3.create(),
            position: [0, 0, 0],
            normal: [0, 0, 0],
        }





        // temp hacks for development
        if (opts.debug) {
            // expose often-used classes
            /** @internal */
            this.vec3 = vec3
            /** @internal */
            this.ndarray = ndarray
            // gameplay tweaks
            ents.getMovement(1).airJumps = 999
            // decorate window while making TS happy
            var win = /** @type {any} */ (window)
            win.noa = this
            win.vec3 = vec3
            win.ndarray = ndarray
            win.scene = this.rendering.scene
        }

        // add hooks to throw helpful errors when using deprecated methods
        deprecateStuff(this)
    }



    /*
     *
     *
     *              Core Engine APIs
     *
     *
    */

    /**
     * Tick function, called by container module at a fixed timestep. 
     * Clients should not normally need to call this manually.
     * @internal
    */

    tick(dt) {
        dt *= this.timeScale || 1

        // note dt is a fixed value, not an observed delay
        if (this._paused) {
            if (this.world.worldGenWhilePaused) this.world.tick()
            return
        }
        profile_hook('start')
        checkWorldOffset(this)
        this.world.tick() // chunk creation/removal
        profile_hook('world')
        if (!this.world.playerChunkLoaded) {
            // when waiting on worldgen, just tick the meshing queue and exit
            this.rendering.tick(dt)
            return
        }
        this.physics.tick(dt) // iterates physics
        profile_hook('physics')
        this._objectMesher.tick() // rebuild objects if needed
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
        var pst = this.inputs.pointerState
        pst.scrollx = pst.scrolly = pst.scrollz = 0
    }




    /**
     * Render function, called every animation frame. Emits #beforeRender(dt), #afterRender(dt) 
     * where dt is the time in ms *since the last tick*.
     * Clients should not normally need to call this manually.
     * @internal
    */
    render(dt, framePart) {
        dt *= this.timeScale || 1

        // note: framePart is how far we are into the current tick
        // dt is the *actual* time (ms) since last render, for
        // animating things that aren't tied to game tick rate

        // frame position - for rendering movement between ticks
        this.positionInCurrentTick = framePart

        // when paused, just optionally ping worldgen, then exit
        if (this._paused) {
            if (this.world.worldGenWhilePaused) this.world.render()
            return
        }

        profile_hook_render('start')

        // rotate camera per user inputs - specific rules for this in `camera`
        this.camera.applyInputsToCamera()
        profile_hook_render('init')

        // brief run through meshing queue
        this.world.render()
        profile_hook_render('meshing')

        // entity render systems
        this.camera.updateBeforeEntityRenderSystems()
        this.entities.render(dt)
        this.camera.updateAfterEntityRenderSystems()
        profile_hook_render('entities')

        // events and render
        this.emit('beforeRender', dt)
        profile_hook_render('before render')

        this.rendering.render()
        this.rendering.postRender()
        profile_hook_render('render')

        this.emit('afterRender', dt)
        profile_hook_render('after render')
        profile_hook_render('end')

        // clear accumulated mouseMove inputs (scroll inputs cleared on render)
        this.inputs.pointerState.dx = this.inputs.pointerState.dy = 0
    }




    /** Pausing the engine will also stop render/tick events, etc. */
    setPaused(paused = false) {
        this._paused = !!paused
        // when unpausing, clear any built-up mouse inputs
        if (!paused) {
            this.inputs.pointerState.dx = this.inputs.pointerState.dy = 0
        }
    }

    /** 
     * Get the voxel ID at the specified position
    */
    getBlock(x, y = 0, z = 0) {
        if (x.length) return this.world.getBlockID(x[0], x[1], x[2])
        return this.world.getBlockID(x, y, z)
    }

    /** 
     * Sets the voxel ID at the specified position. 
     * Does not check whether any entities are in the way! 
     */
    setBlock(id, x, y = 0, z = 0) {
        if (x.length) return this.world.setBlockID(id, x[0], x[1], x[2])
        return this.world.setBlockID(id, x, y, z)
    }

    /**
     * Adds a block, unless there's an entity in the way.
    */
    addBlock(id, x, y = 0, z = 0) {
        // add a new terrain block, if nothing blocks the terrain there
        if (x.length) {
            if (this.entities.isTerrainBlocked(x[0], x[1], x[2])) return
            this.world.setBlockID(id, x[0], x[1], x[2])
            return id
        } else {
            if (this.entities.isTerrainBlocked(x, y, z)) return
            this.world.setBlockID(id, x, y, z)
            return id
        }
    }







    /*
     *              Rebasing local <-> global coords
    */


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
    globalToLocal(global, globalPrecise, local) {
        var off = this.worldOriginOffset
        if (globalPrecise) {
            for (var i = 0; i < 3; i++) {
                var coord = global[i] - off[i]
                coord += globalPrecise[i]
                local[i] = coord
            }
            return local
        } else {
            return vec3.subtract(local, global, off)
        }
    }

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
    localToGlobal(local, global, globalPrecise = null) {
        var off = this.worldOriginOffset
        if (globalPrecise) {
            for (var i = 0; i < 3; i++) {
                var floored = Math.floor(local[i])
                global[i] = floored + off[i]
                globalPrecise[i] = local[i] - floored
            }
            return global
        } else {
            return vec3.add(global, local, off)
        }
    }




    /*
     *              Picking / raycasting
    */

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
    pick(pos = null, dir = null, dist = -1, blockTestFunction = null) {
        if (dist === 0) return null
        // input position to local coords, if any
        var pickPos = this._pickPos
        if (pos) {
            this.globalToLocal(pos, null, pickPos)
            pos = pickPos
        }
        return this._localPick(pos, dir, dist, blockTestFunction)
    }


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
    _localPick(pos = null, dir = null, dist = -1, blockTestFunction = null) {
        // do a raycast in local coords - result obj will be in global coords
        if (dist === 0) return null
        var testFn = blockTestFunction || this.registry.getBlockSolidity
        var world = this.world
        var off = this.worldOriginOffset
        var testVoxel = function (x, y, z) {
            var id = world.getBlockID(x + off[0], y + off[1], z + off[2])
            return testFn(id)
        }
        if (!pos) pos = this.camera._localGetTargetPosition()
        dir = dir || this.camera.getDirection()
        dist = dist || -1
        if (dist < 0) dist = this.blockTestDistance
        var result = this._pickResult
        var rpos = result._localPosition
        var rnorm = result.normal
        var hit = raycast(testVoxel, pos, dir, dist, rpos, rnorm)
        if (!hit) return null
        // position is right on a voxel border - adjust it so that flooring works reliably
        // adjust along normal direction, i.e. away from the block struck
        vec3.scaleAndAdd(rpos, rpos, rnorm, 0.01)
        // add global result
        this.localToGlobal(rpos, result.position)
        return result
    }

}



/*
 * 
 * 
 * 
 *                  INTERNAL HELPERS
 * 
 * 
 * 
 * 
*/




/*
 *
 *      rebase world origin offset around the player if necessary
 *
*/
function checkWorldOffset(noa) {
    var lpos = noa.ents.getPositionData(noa.playerEntity)._localPosition
    var cutoff = noa._originRebaseDistance
    if (vec3.sqrLen(lpos) < cutoff * cutoff) return
    var delta = []
    for (var i = 0; i < 3; i++) {
        delta[i] = Math.floor(lpos[i])
        noa.worldOriginOffset[i] += delta[i]
    }
    noa.rendering._rebaseOrigin(delta)
    noa.entities._rebaseOrigin(delta)
    noa._objectMesher._rebaseOrigin(delta)
}





// Each frame, by default pick along the player's view vector 
// and tell rendering to highlight the struck block face
function updateBlockTargets(noa) {
    var newhash = 0
    var blockIdFn = noa.blockTargetIdCheck || noa.registry.getBlockSolidity
    var result = noa._localPick(null, null, null, blockIdFn)
    if (result) {
        var dat = noa._targetedBlockDat
        // pick stops just shy of voxel boundary, so floored pos is the adjacent voxel
        vec3.floor(dat.adjacent, result.position)
        vec3.copy(dat.normal, result.normal)
        vec3.subtract(dat.position, dat.adjacent, dat.normal)
        dat.blockID = noa.world.getBlockID(dat.position[0], dat.position[1], dat.position[2])
        noa.targetedBlock = dat
        // arbitrary hash so we know when the targeted blockID/pos/face changes
        var pos = dat.position, norm = dat.normal
        var x = locationHasher(pos[0] + dat.blockID, pos[1], pos[2])
        x ^= locationHasher(norm[0], norm[1] + dat.blockID, norm[2])
        newhash = x
    } else {
        noa.targetedBlock = null
    }
    if (newhash != noa._prevTargetHash) {
        noa.emit('targetBlockChanged', noa.targetedBlock)
        noa._prevTargetHash = newhash
    }
}



/*
 * 
 *  add some hooks for guidance on removed APIs
 * 
 */

function deprecateStuff(noa) {
    var ver = `0.27`
    var dep = (loc, name, msg) => {
        var throwFn = () => { throw `This property changed in ${ver} - ${msg}` }
        Object.defineProperty(loc, name, { get: throwFn, set: throwFn })
    }
    dep(noa, 'getPlayerEyePosition', 'to get the camera/player offset see API docs for `noa.camera.cameraTarget`')
    dep(noa, 'setPlayerEyePosition', 'to set the camera/player offset see API docs for `noa.camera.cameraTarget`')
    dep(noa, 'getPlayerPosition', 'use `noa.ents.getPosition(noa.playerEntity)` or similar')
    dep(noa, 'getCameraVector', 'use `noa.camera.getDirection`')
    dep(noa, 'getPlayerMesh', 'use `noa.ents.getMeshData(noa.playerEntity).mesh` or similar')
    dep(noa, 'playerBody', 'use `noa.ents.getPhysicsBody(noa.playerEntity)`')
    dep(noa.rendering, 'zoomDistance', 'use `noa.camera.zoomDistance`')
    dep(noa.rendering, '_currentZoom', 'use `noa.camera.currentZoom`')
    dep(noa.rendering, '_cameraZoomSpeed', 'use `noa.camera.zoomSpeed`')
    dep(noa.rendering, 'getCameraVector', 'use `noa.camera.getDirection`')
    dep(noa.rendering, 'getCameraPosition', 'use `noa.camera.getLocalPosition`')
    dep(noa.rendering, 'getCameraRotation', 'use `noa.camera.heading` and `noa.camera.pitch`')
    dep(noa.rendering, 'setCameraRotation', 'to customize camera behavior see API docs for `noa.camera`')
    ver = '0.28'
    dep(noa.rendering, 'makeMeshInstance', 'removed, use Babylon\'s `mesh.createInstance`')
    dep(noa.world, '_maxChunksPendingCreation', 'use `maxChunksPendingCreation` (no "_")')
    dep(noa.world, '_maxChunksPendingMeshing', 'use `maxChunksPendingMeshing` (no "_")')
    dep(noa.world, '_maxProcessingPerTick', 'use `maxProcessingPerTick` (no "_")')
    dep(noa.world, '_maxProcessingPerRender', 'use `maxProcessingPerRender` (no "_")')
    ver = '0.29'
    dep(noa, '_constants', 'removed, voxel IDs are no longer packed with bit flags')
    ver = '0.30'
    dep(noa, '_tickRate', 'tickRate is now at `noa.tickRate`')
    dep(noa.container, '_tickRate', 'tickRate is now at `noa.tickRate`')
    ver = '0.31'
    dep(noa.world, 'chunkSize', 'effectively an internal, so changed to `_chunkSize`')
    dep(noa.world, 'chunkAddDistance', 'set this with `noa.world.setAddRemoveDistance`')
    dep(noa.world, 'chunkRemoveDistance', 'set this with `noa.world.setAddRemoveDistance`')
    ver = '0.33'
    dep(noa.rendering, 'postMaterialCreationHook', 'Removed - use mesh post-creation hook instead`')
}



var profile_hook = (PROFILE > 0) ?
    makeProfileHook(PROFILE, 'tick   ') : () => { }
var profile_hook_render = (PROFILE_RENDER > 0) ?
    makeProfileHook(PROFILE_RENDER, 'render ') : () => { }
