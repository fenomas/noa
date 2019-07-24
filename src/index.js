'use strict'

/*!
 * noa: an experimental voxel game engine.
 * @url      github.com/andyhall/noa
 * @author   Andy Hall <andy@fenomas.com>
 * @license  MIT
 */

var vec3 = require('gl-vec3')
var ndarray = require('ndarray')
var EventEmitter = require('events').EventEmitter
var createContainer = require('./lib/container')
var createRendering = require('./lib/rendering')
var createWorld = require('./lib/world')
var createInputs = require('./lib/inputs')
var createPhysics = require('./lib/physics')
var createCamera = require('./lib/camera')
var createRegistry = require('./lib/registry')
var createEntities = require('./lib/entities')
var raycast = require('fast-voxel-raycast')


module.exports = Engine



// profiling flag
var PROFILE = 0
var PROFILE_RENDER = 0
var DEBUG_QUEUES = 0




var defaults = {
    babylon: null,
    debug: false,
    silent: false,
    playerHeight: 1.8,
    playerWidth: 0.6,
    playerStart: [0, 10, 0],
    playerAutoStep: false,
    tickRate: 33, // ms per tick - not ticks per second
    blockTestDistance: 10,
    stickyPointerLock: true,
    dragCameraOutsidePointerLock: true,
    skipDefaultHighlighting: false,
}


/**
 * Main engine object.
 * Takes a big options object full of flags and settings as a parameter.
 * 
 * ```js
 * var opts = {
 *     babylon: require('babylon'), // import your preferred version of bablyon.js here!
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
 * }
 * var NoaEngine = require('noa-engine')
 * var noa = NoaEngine(opts)
 * ```
 * The only required option is `babylon`, which should be a reference to 
 * a [Babylon.js](https://www.babylonjs.com) engine. 
 * If none is specified, `noa` will use `window.BABYLON`,
 * or failing that, throw an error.
 * 
 * Note that the root `opts` parameter object is also passed to noa's child modules 
 * (e.g. `noa.rendering`) - see those modules for which options they use.
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

function Engine(opts) {
    if (!(this instanceof Engine)) return new Engine(opts)

    /**  version string, e.g. `"0.25.4"` */
    this.version = require('../package.json').version

    opts = Object.assign({}, defaults, opts)
    this._tickRate = opts.tickRate
    this._paused = false
    this._dragOutsideLock = opts.dragCameraOutsidePointerLock
    var self = this

    if (!opts.silent) {
        var debugstr = (opts.debug) ? ' (debug)' : ''
        console.log(`noa-engine v${this.version}${debugstr}`)
    }

    /** Reference to the Babylon.js engine, either passed in or from `window.BABYLON` */
    this.BABYLON = opts.babylon || window.BABYLON
    if (!this.BABYLON || !this.BABYLON.Engine) {
        throw new Error('Babylon.js engine reference not found! Abort! Abort!')
    }

    // how far engine is into the current tick. Updated each render.
    this.positionInCurrentTick = 0

    /**
     * container (html/div) manager
     * @type {Container}
     */
    this.container = createContainer(this, opts)

    /**
     * inputs manager - abstracts key/mouse input
     * @type {Inputs}
     */
    this.inputs = createInputs(this, opts, this.container.element)

    /**
     * block/item property registry
     * @type {Registry}
     */
    this.registry = createRegistry(this, opts)

    /**
     * world manager
     * @type {World}
     */
    this.world = createWorld(this, opts)

    /**
     * Rendering manager
     * @type {Rendering}
     */
    this.rendering = createRendering(this, opts, this.container.canvas)

    /**
     * physics engine - solves collisions, properties, etc.
     * @type {Physics}
     */
    this.physics = createPhysics(this, opts)

    /** Entity manager / Entity Component System (ECS) 
     * Aliased to `noa.ents` for convenience.
     * @type {Entities}
     */
    this.entities = createEntities(this, opts)
    this.ents = this.entities
    var ents = this.ents

    /** Entity id for the player entity */
    this.playerEntity = ents.add(
        opts.playerStart, // starting location
        opts.playerWidth, opts.playerHeight,
        null, null, // no mesh for now, no meshOffset, 
        true, true
    )

    // make player entity it collide with terrain and other entities
    ents.addComponent(this.playerEntity, ents.names.collideTerrain)
    ents.addComponent(this.playerEntity, ents.names.collideEntities)

    // adjust default physics parameters
    var body = ents.getPhysicsBody(this.playerEntity)
    body.gravityMultiplier = 2 // less floaty
    body.autoStep = opts.playerAutoStep // auto step onto blocks

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
    this.camera = createCamera(this, opts)


    // set up block targeting
    this.blockTestDistance = opts.blockTestDistance

    /** function for which block IDs are targetable. 
     * Defaults to a solidity check, but can be overridden */
    this.blockTargetIdCheck = this.registry.getBlockSolidity

    /** Dynamically updated object describing the currently targeted block */
    this.targetedBlock = null

    // add a default block highlighting function
    if (!opts.skipDefaultHighlighting) {
        // the default listener, defined onto noa in case people want to remove it later
        this.defaultBlockHighlightFunction = function (tgt) {
            if (tgt) {
                self.rendering.highlightBlockFace(true, tgt.position, tgt.normal)
            } else {
                self.rendering.highlightBlockFace(false)
            }
        }
        this.on('targetBlockChanged', this.defaultBlockHighlightFunction)
    }


    // expose constants, for HACKING™
    this._constants = require('./lib/constants')

    // temp hacks for development
    if (opts.debug) {
        window.noa = this
        window.scene = this.rendering._scene
        window.ndarray = ndarray
        window.vec3 = vec3
        var debug = false
        this.inputs.bind('debug', 'Z')
        this.inputs.down.on('debug', function onDebug() {
            debug = !debug
            if (debug) window.scene.debugLayer.show()
            else window.scene.debugLayer.hide()
        })
    }

    // add hooks to throw helpful errors when using deprecated methods
    deprecateStuff(this)
}

Engine.prototype = Object.create(EventEmitter.prototype)





/*
 *
 *
 *   Core Engine API
 *
 *
 */


/*
 * Tick function, called by container module at a fixed timestep. Emits #tick(dt),
 * where dt is the tick rate in ms (default 16.6)
 */

Engine.prototype.tick = function () {
    if (this._paused) return
    profile_hook('start')
    var dt = this._tickRate // fixed timesteps!
    this.world.tick(dt) // chunk creation/removal
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
    this.emit('tick', dt)
    profile_hook('tick event')
    profile_hook('end')
    if (DEBUG_QUEUES) debugQueues(this)
    // clear accumulated scroll inputs (mouseMove is cleared on render)
    var st = this.inputs.state
    st.scrollx = st.scrolly = st.scrollz = 0
}


var __qwasDone = true,
    __qstart

function debugQueues(self) {
    var a = self.world._chunkIDsToAdd.length
    var b = self.world._chunkIDsToCreate.length
    var c = self.rendering._chunksToMesh.length
    var d = self.rendering._numMeshedChunks
    if (a + b + c > 0) console.log([
        'Chunks:', 'unmade', a,
        'pending creation', b,
        'to mesh', c,
        'meshed', d,
    ].join('   \t'))
    if (__qwasDone && a + b + c > 0) {
        __qwasDone = false
        __qstart = performance.now()
    }
    if (!__qwasDone && a + b + c === 0) {
        __qwasDone = true
        console.log('Queue empty after ' + Math.round(performance.now() - __qstart) + 'ms')
    }
}






/*
 * Render function, called every animation frame. Emits #beforeRender(dt), #afterRender(dt) 
 * where dt is the time in ms *since the last tick*.
 */

Engine.prototype.render = function (framePart) {
    if (this._paused) return
    profile_hook_render('start')
    // update frame position property and calc dt
    var framesAdvanced = framePart - this.positionInCurrentTick
    if (framesAdvanced < 0) framesAdvanced += 1
    this.positionInCurrentTick = framePart
    var dt = framesAdvanced * this._tickRate // ms since last tick
    // only move camera during pointerlock or mousedown, or if pointerlock is unsupported
    if (this.container.hasPointerLock ||
        !this.container.supportsPointerLock ||
        (this._dragOutsideLock && this.inputs.state.fire)) {
        this.camera.applyInputsToCamera()
    }

    // events and render
    this.camera.updateBeforeEntityRenderSystems()
    this.emit('beforeRender', dt)
    this.camera.updateAfterEntityRenderSystems()
    profile_hook_render('before render')

    this.rendering.render(dt)
    profile_hook_render('render')

    this.emit('afterRender', dt)
    profile_hook_render('after render')
    profile_hook_render('end')

    // clear accumulated mouseMove inputs (scroll inputs cleared on render)
    this.inputs.state.dx = this.inputs.state.dy = 0
}



/*
 *   Utility APIs
 */

/** 
 * Pausing the engine will also stop render/tick events, etc.
 * @param paused
 */
Engine.prototype.setPaused = function (paused) {
    this._paused = !!paused
    // when unpausing, clear any built-up mouse inputs
    if (!paused) {
        this.inputs.state.dx = this.inputs.state.dy = 0
    }
}

/** @param x,y,z */
Engine.prototype.getBlock = function (x, y, z) {
    if (x.length) {
        return this.world.getBlockID(x[0], x[1], x[2])
    } else {
        return this.world.getBlockID(x, y, z)
    }
}

/** @param x,y,z */
Engine.prototype.setBlock = function (id, x, y, z) {
    // skips the entity collision check
    if (x.length) {
        return this.world.setBlockID(id, x[0], x[1], x[2])
    } else {
        return this.world.setBlockID(id, x, y, z)
    }
}

/**
 * Adds a block unless obstructed by entities 
 * @param id,x,y,z */
Engine.prototype.addBlock = function (id, x, y, z) {
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








/**
 * Raycast through the world, returning a result object for any non-air block
 * @param pos
 * @param vec
 * @param dist
 */
Engine.prototype.pick = function (pos, vec, dist, blockIdTestFunction) {
    if (dist === 0) return null
    // if no block ID function is specified default to solidity check
    var testFn = blockIdTestFunction || this.registry.getBlockSolidity
    var world = this.world
    var testVoxel = function (x, y, z) {
        var id = world.getBlockID(x, y, z)
        return testFn(id)
    }
    pos = pos || this.camera.getTargetPosition()
    vec = vec || this.camera.getDirection()
    dist = dist || this.blockTestDistance
    var rpos = _hitResult.position
    var rnorm = _hitResult.normal
    var hit = raycast(testVoxel, pos, vec, dist, rpos, rnorm)
    if (!hit) return null
    // position is right on a voxel border - adjust it so flooring will work as expected
    for (var i = 0; i < 3; i++) rpos[i] -= 0.01 * rnorm[i]
    return _hitResult
}
var _hitResult = {
    position: vec3.create(),
    normal: vec3.create(),
}







// Each frame, by default pick along the player's view vector 
// and tell rendering to highlight the struck block face
function updateBlockTargets(noa) {
    var newhash = ''
    var blockIdFn = noa.blockTargetIdCheck || noa.registry.getBlockSolidity
    var result = noa.pick(null, null, null, blockIdFn)
    if (result) {
        var dat = _targetedBlockDat
        for (var i = 0; i < 3; i++) {
            // position values are right on a border, so adjust them before flooring!
            var n = result.normal[i] | 0
            var p = Math.floor(result.position[i])
            dat.position[i] = p
            dat.normal[i] = n
            dat.adjacent[i] = p + n
            newhash += '|' + p + '|' + n
        }
        dat.blockID = noa.world.getBlockID(dat.position[0], dat.position[1], dat.position[2])
        newhash += '|' + result.blockID
        noa.targetedBlock = dat
    } else {
        noa.targetedBlock = null
    }
    if (newhash != _prevTargetHash) {
        noa.emit('targetBlockChanged', noa.targetedBlock)
        _prevTargetHash = newhash
    }
}

var _targetedBlockDat = {
    blockID: 0,
    position: [],
    normal: [],
    adjacent: [],
}

var _prevTargetHash = ''




/*
 * 
 *  add some hooks for guidance on removed APIs
 * 
 */

function deprecateStuff(noa) {
    var ver = `0.27`
    var dep = (loc, name, msg) => {
        var throwFn = () => { throw `This method was removed in ${ver} - ${msg}` }
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
    dep(noa.rendering, 'getCameraPosition', 'use `noa.camera.getPosition`')
    dep(noa.rendering, 'getCameraRotation', 'use `noa.camera.heading` and `noa.camera.pitch`')
    dep(noa.rendering, 'setCameraRotation', 'to customize camera behavior see API docs for `noa.camera`')
}





var profile_hook = function (s) {}
var profile_hook_render = function (s) {}
if (PROFILE)(function () {
    var timer = new(require('./lib/util').Timer)(200, 'tick   ')
    profile_hook = function (state) {
        if (state === 'start') timer.start()
        else if (state === 'end') timer.report()
        else timer.add(state)
    }
})()
if (PROFILE_RENDER)(function () {
    var timer = new(require('./lib/util').Timer)(200, 'render ')
    profile_hook_render = function (state) {
        if (state === 'start') timer.start()
        else if (state === 'end') timer.report()
        else timer.add(state)
    }
})()
