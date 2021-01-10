
import { updatePositionExtents } from '../components/position.js'
import { setPhysicsFromPosition } from '../components/physics.js'

import vec3 from 'gl-vec3'
import EntComp from 'ent-comp'
// var EntComp = require('../../../../npm-modules/ent-comp')

// import collideEntities from '../components/collideEntities.js'
// import collideTerrain from '../components/collideTerrain.js'
// import fadeOnZoom from '../components/fadeOnZoom.js'
// import followsEntity from '../components/followsEntity.js'
// import mesh from '../components/mesh.js'
import movement from '../components/movement.js'
import physics from '../components/physics.js'
import position from '../components/position.js'
// import receivesInputs from '../components/receivesInputs.js'
// import shadow from '../components/shadow.js'
// import smoothCamera from '../components/smoothCamera.js'
const components = {
    // 'collideEntities': {fn: collideEntities},
    // 'collideTerrain': {fn: collideTerrain},
    // 'fadeOnZoom': {fn: fadeOnZoom},
    // 'followsEntity': {fn: followsEntity},
    // 'mesh': {fn: mesh},
    'movement': {fn: movement, server: true},
    'physics': {fn: physics, server: true},
    'position': {fn: position, server: true},
    // 'receivesInputs': {fn: receivesInputs},
    // 'shadow': {fn: shadow},
    // 'smoothCamera': {fn: smoothCamera},
    'receivesInputs': {},
    'shadow': {},
    'smoothCamera': {},
    'collideEntities': {},
    'collideTerrain': {},
    'fadeOnZoom': {},
    'followsEntity': {},
    'mesh': {},
}




export default function (noa, opts) {
    return new Entities(noa, opts)
}



var defaults = {
    shadowDistance: 10,
}


/**
 * @class Entities
 * @typicalname noa.ents
 * @classdesc Wrangles entities. Aliased as `noa.ents`.
 * 
 * This class is an instance of [ECS](https://github.com/andyhall/ent-comp), 
 * and as such implements the usual ECS methods.
 * It's also decorated with helpers and accessor functions for getting component existence/state.
 * 
 * Expects entity definitions in a specific format - see source `components` folder for examples.
 */

function Entities(noa, opts) {
    // inherit from the ECS library
    EntComp.call(this)

    this.noa = noa
    this.opts = Object.assign({}, defaults, opts)

    // properties
    /** Hash containing the component names of built-in components. */
    this.names = {}



    // Bundler magic to import everything in the ../components directory
    // each component module exports a default function: (noa) => compDefinition
    // Only imports everything on client side (where require.context is defined)



    // let myRequireContext
    // if (typeof fs.statSync !== "function") {
    //     const reqContext = require.context('../components/', false, /\.js$/)
    //     console.log(reqContext.keys())
    //     reqContext.keys().forEach(name => {
    //         // convert name ('./foo.js') to bare name ('foo')
    //         var bareName = /\.\/(.*)\.js/.exec(name)[1]
    //         var arg = componentArgs[bareName] || undefined
    //         var compFn = reqContext(name)
    //         if (compFn.default) compFn = compFn.default
    //         var compDef = compFn(noa, arg)
    //         var comp = this.createComponent(compDef)
    //         this.names[bareName] = comp
    //     })
    // }
    // else {
    //     const reqContext = requireContext('../../src/components/', false, /\.js$/)
    //     console.log(reqContext.keys())
    //     reqContext.keys().forEach(name => {
    //         console.log("hello", name, /\.\/(.*)\.js/.exec(name))
    //         // convert name ('./foo.js') to bare name ('foo')
    //         var bareName = /\.\/(.*)\.js/.exec(name)[1]
    //         var arg = componentArgs[bareName] || undefined
    //         var compFn = reqContext(name)
    //         if (compFn.default) compFn = compFn.default
    //         var compDef = compFn(noa, arg)
    //         var comp = this.createComponent(compDef)
    //         this.names[bareName] = comp
    //     })
    // }






}

// inherit from EntComp
Entities.prototype = Object.create(EntComp.prototype)
Entities.prototype.constructor = Entities

/**
 * 
 * Create components needed client-side. Call assignFieldsAndHelpers() directly after.
 * 
 */
Entities.prototype.createComponentsClient = function() {
    // optional arguments to supply to component creation functions
    var componentArgs = {
        'shadow': this.opts.shadowDistance,
    }
    const reqContext = require.context('../components/', false, /\.js$/)
    reqContext.keys().forEach(name => {
        // convert name ('./foo.js') to bare name ('foo')
        var bareName = /\.\/(.*)\.js/.exec(name)[1]
        var arg = componentArgs[bareName] || undefined
        var compFn = reqContext(name)
        if (compFn.default) compFn = compFn.default
        var compDef = compFn(this.noa, arg)
        var comp = this.createComponent(compDef)
        this.names[bareName] = comp
    })
}

/**
 * 
 * Create components needed server-side. Call assignFieldsAndHelpers() directly after.
 * 
 */
Entities.prototype.createComponentsServer = function() {
    // optional arguments to supply to component creation functions
    var componentArgs = {
        'shadow': this.opts.shadowDistance,
    }
    for (const comp in components) {
        if (components[comp].fn) {
            this.createComponent(components[comp].fn(this.noa, componentArgs[comp]))
        }
        else {
            this.createComponent({name: comp}) // polyfill
        }
        this.names[comp] = comp
    }
    console.log(this.names)
}


/**
 * 
 * Call directly after either calling either createComponentsClient or createComponentsServer
 * 
 */
Entities.prototype.assignFieldsAndHelpers = function (noa) {
    // decorate the entities object with accessor functions
    /** @param id */
    this.isPlayer = function (id) { return id === noa.playerEntity }

    /** @param id */
    this.hasPhysics = this.getComponentAccessor(this.names.physics)

    /** @param id */
    this.cameraSmoothed = this.getComponentAccessor(this.names.smoothCamera)

    /** @param id */
    this.hasMesh = this.getComponentAccessor(this.names.mesh)

    // position functions
    /** @param id */
    this.hasPosition = this.getComponentAccessor(this.names.position)
    var getPos = this.getStateAccessor(this.names.position)

    /** @param id */
    this.getPositionData = getPos

    /** @param id */
    this._localGetPosition = function (id) {
        return getPos(id)._localPosition
    }

    /** @param id */
    this.getPosition = function (id) {
        return getPos(id).position
    }

    /** @param id */
    this._localSetPosition = function (id, pos) {
        var posDat = getPos(id)
        vec3.copy(posDat._localPosition, pos)
        updateDerivedPositionData(id, posDat)
    }

    /** @param id, positionArr */
    this.setPosition = (id, pos, _yarg, _zarg) => {
        // check if called with "x, y, z" args
        if (typeof pos === 'number') pos = [pos, _yarg, _zarg]
        // convert to local and defer impl
        var loc = noa.globalToLocal(pos, null, [])
        this._localSetPosition(id, loc)
    }

    /** @param id, xs, ys, zs */
    this.setEntitySize = function (id, xs, ys, zs) {
        var posDat = getPos(id)
        posDat.width = (xs + zs) / 2
        posDat.height = ys
        updateDerivedPositionData(id, posDat)
    }

    // called when engine rebases its local coords
    this._rebaseOrigin = function (delta) {
        this.getStatesList(this.names.position).forEach(state => {
            vec3.subtract(state._localPosition, state._localPosition, delta)
            updateDerivedPositionData(state.__id, state)
        })
    }

    // helper to update everything derived from `_localPosition`
    function updateDerivedPositionData(id, posDat) {
        vec3.copy(posDat._renderPosition, posDat._localPosition)
        vec3.add(posDat.position, posDat._localPosition, noa.worldOriginOffset)
        updatePositionExtents(posDat)
        var physDat = getPhys(id)
        if (physDat) setPhysicsFromPosition(physDat, posDat)
    }



    // physics
    var getPhys = this.getStateAccessor(this.names.physics)
    this.getPhysics = getPhys
    this.getPhysicsBody = function (id) { return getPhys(id).body }

    // misc
    this.getMeshData = this.getStateAccessor(this.names.mesh)
    this.getMovement = this.getStateAccessor(this.names.movement)
    this.getCollideTerrain = this.getStateAccessor(this.names.collideTerrain)
    this.getCollideEntities = this.getStateAccessor(this.names.collideEntities)

    // pairwise collideEntities event - this is for client to override
    this.onPairwiseEntityCollision = function (id1, id2) {}
}


/*
 *
 *    ENTITY MANAGER API
 * 
 *  note most APIs are on the original ECS module (ent-comp)
 *  these are some overlaid extras for noa
 *
 */


/** @param id,name,state */
Entities.prototype.addComponentAgain = function (id, name, state) {
    // removes component first if necessary
    if (this.hasComponent(id, name)) this.removeComponent(id, name, true)
    this.addComponent(id, name, state)
}


/** @param x,y,z */
Entities.prototype.isTerrainBlocked = function (x, y, z) {
    // checks if terrain location is blocked by entities
    var off = this.noa.worldOriginOffset
    var xlocal = Math.floor(x - off[0])
    var ylocal = Math.floor(y - off[1])
    var zlocal = Math.floor(z - off[2])
    var blockExt = [
        xlocal + 0.001, ylocal + 0.001, zlocal + 0.001,
        xlocal + 0.999, ylocal + 0.999, zlocal + 0.999,
    ]
    var list = this.getStatesList(this.names.collideTerrain)
    for (var i = 0; i < list.length; i++) {
        var id = list[i].__id
        var ext = this.getPositionData(id)._extents
        if (extentsOverlap(blockExt, ext)) return true
    }
    return false
}



function extentsOverlap(extA, extB) {
    if (extA[0] > extB[3]) return false
    if (extA[1] > extB[4]) return false
    if (extA[2] > extB[5]) return false
    if (extA[3] < extB[0]) return false
    if (extA[4] < extB[1]) return false
    if (extA[5] < extB[2]) return false
    return true
}




/** @param box */
Entities.prototype.getEntitiesInAABB = function (box, withComponent) {
    // extents to test against
    var off = this.noa.worldOriginOffset
    var testExtents = [
        box.base[0] + off[0], box.base[1] + off[1], box.base[2] + off[2],
        box.max[0] + off[0], box.max[1] + off[1], box.max[2] + off[2],
    ]
    // entity position state list
    var entStates = (withComponent) ?
        this.getStatesList(withComponent).map(state => {
            return this.getPositionData(state.__id)
        }) : this.getStatesList(this.names.position)
    // run each test
    var hits = []
    entStates.forEach(state => {
        if (extentsOverlap(testExtents, state._extents)) {
            hits.push(state.__id)
        }
    })
    return hits
}



/** 
 * Helper to set up a general entity, and populate with some common components depending on arguments.
 * 
 * Parameters: position, width, height [, mesh, meshOffset, doPhysics, shadow]
 * 
 * @param position
 * @param width
 * @param height..
 */
Entities.prototype.add = function (position, width, height, // required
    mesh, meshOffset, doPhysics, shadow, customEId) {

    var self = this

    // new entity
    var eid = customEId || this.createEntity()

    // position component
    this.addComponent(eid, this.names.position, {
        position: position || [0, 0, 0],
        width: width,
        height: height
    })

    // rigid body in physics simulator
    if (doPhysics) {
        // body = this.noa.physics.addBody(box)
        this.addComponent(eid, this.names.physics)
        var body = this.getPhysicsBody(eid)

        // handler for physics engine to call on auto-step
        var smoothName = this.names.smoothCamera
        body.onStep = function () {
            self.addComponentAgain(eid, smoothName)
        }
    }

    // mesh for the entity
    if (mesh) {
        if (!meshOffset) meshOffset = vec3.create()
        this.addComponent(eid, this.names.mesh, {
            mesh: mesh,
            offset: meshOffset
        })
    }

    // add shadow-drawing component
    if (shadow) {
        this.addComponent(eid, this.names.shadow, { size: width })
    }

    return eid
}
