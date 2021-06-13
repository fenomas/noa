
import vec3 from 'gl-vec3'
import ECS from 'ent-comp'
// var ECS = require('../../../../npm-modules/ent-comp')

import { updatePositionExtents } from '../components/position'
import { setPhysicsFromPosition } from '../components/physics'



var defaultOptions = {
    shadowDistance: 10,
}


/**
 * `noa.entities` - manages entities and components.
 * 
 * This class extends [ent-comp](https://github.com/andyhall/ent-comp), 
 * a general-purpose ECS. It's also decorated with noa-specific helpers and 
 * accessor functions for querying entity positions, etc.
 * 
 * Expects entity definitions in a specific format - see source `components` 
 * folder for examples.
 * 
 * This module uses the following default options (from the options
 * object passed to the [[Engine]]):
 * 
 * ```js
 * var defaults = {
 *     shadowDistance: 10,
 * }
 * ```
*/

export class Entities extends ECS {

    /** @internal @prop noa */
    /** @internal @prop cameraSmoothed */

    // declare some accessors that will get made later

    /**
     * Returns whether the entity has a physics body
     * @type {(id:number) => boolean}
     * @prop hasPhysics
    */

    /**
     * Returns whether the entity has a mesh
     * @type {(id:number) => boolean}
     * @prop hasMesh
    */

    /**
     * Returns whether the entity has a position
     * @type {(id:number) => boolean}
     * @prop hasPosition
    */

    /**
     * Returns the entity's position component state
     * @type {(id:number) => {
     *      position: number[], width: number, height: number,
     *      _localPosition: any, _renderPosition: any, _extents: any,
     * }}
     * @prop getPositionData
    */

    /**
     * Returns the entity's position vector.
     * Note, will throw if the entity doesn't have the position component!
     * @type {(id:number) => number[]}
     * @prop getPosition
    */

    /**
     * Returns the entity's `physics` component state.
     * @type {(id:number) => { body:any }}
     * @prop getPhysics
    */

    /**
     * Returns the entity's physics body
     * Note, will throw if the entity doesn't have the position component!
     * @type {(id:number) => { any }}
     * @prop getPhysicsBody
    */

    /**
     * Returns the entity's `mesh` component state
     * @type {(id:number) => {mesh:any, offset:number[]}}
     * @prop getMeshData
    */

    /**
     * Returns the entity's `movement` component state
     * @type {(id:number) => import('../components/movement').MovementState}
     * @prop getMovement
    */

    /**
     * Returns the entity's `collideTerrain` component state
     * @type {(id:number) => {callback: function}}
     * @prop etCollideTerrain
    */

    /**
     * Returns the entity's `collideEntities` component state
     * @type {(id:number) => {
     *      cylinder:boolean, collideBits:number, 
     *      collideMask:number, callback: function}}
     * @prop getCollideEntities
    */

    /** 
     * A hash of the names of all registered components.
     * @type {Object<string, string>}
     * @prop names
    */


    /** @internal */
    constructor(noa, opts) {
        super()

        this.noa = noa
        opts = Object.assign({}, defaultOptions, opts)

        // properties
        /** Hash containing the component names of built-in components. */
        this.names = {}

        // optional arguments to supply to component creation functions
        var componentArgs = {
            'shadow': opts.shadowDistance,
        }

        // Bundler magic to import everything in the ../components directory
        // each component module exports a default function: (noa) => compDefinition
        //@ts-expect-error
        var reqContext = require.context('../components/', false, /\.js$/)
        for (var name of reqContext.keys()) {
            // convert name ('./foo.js') to bare name ('foo')
            var bareName = /\.\/(.*)\.js/.exec(name)[1]
            var arg = componentArgs[bareName] || undefined
            var compFn = reqContext(name)
            if (compFn.default) compFn = compFn.default
            var compDef = compFn(noa, arg)
            var comp = this.createComponent(compDef)
            this.names[bareName] = comp
        }

        // create some ECS state accessors
        // (these are moderately faster than the general case APIs)

        // general
        this.hasPhysics = this.getComponentAccessor(this.names.physics)
        this.cameraSmoothed = this.getComponentAccessor(this.names.smoothCamera)
        this.hasPosition = this.getComponentAccessor(this.names.position)
        this.hasMesh = this.getComponentAccessor(this.names.mesh)
        this.getMeshData = this.getStateAccessor(this.names.mesh)

        // position
        var getPos = this.getStateAccessor(this.names.position)
        this.getPositionData = getPos
        this.getPosition = (id) => getPos(id).position

        // physics
        var getPhys = this.getStateAccessor(this.names.physics)
        this.getPhysics = getPhys
        this.getPhysicsBody = (id) => getPhys(id).body

        // misc
        this.getMovement = this.getStateAccessor(this.names.movement)
        this.getCollideTerrain = this.getStateAccessor(this.names.collideTerrain)
        this.getCollideEntities = this.getStateAccessor(this.names.collideEntities)

        // pairwise collideEntities event - this is for client to override
        this.onPairwiseEntityCollision = function (id1, id2) { }
    }




    /*
     * 
     * 
     *      PUBLIC ENTITY STATE ACCESSORS
     * 
     * 
    */


    /** Set an entity's position, and update all derived state.
     * 
     * In general, always use this to set an entity's position unless
     * you're familiar with engine internals.
     * 
     * ```js
     * noa.ents.setPosition(playerEntity, [5, 6, 7])
     * noa.ents.setPosition(playerEntity, 5, 6, 7)  // also works
     * ```
     * 
     * @param {number} id
     */
    setPosition(id, pos, y = 0, z = 0) {
        if (typeof pos === 'number') pos = [pos, y, z]
        // convert to local and defer impl
        var loc = this.noa.globalToLocal(pos, null, [])
        this._localSetPosition(id, loc)
    }

    /** Set an entity's size 
     * @param {number} xs
     * @param {number} ys
     * @param {number} zs
    */
    setEntitySize(id, xs, ys, zs) {
        var posDat = this.getPositionData(id)
        posDat.width = (xs + zs) / 2
        posDat.height = ys
        this._updateDerivedPositionData(id, posDat)
    }




    /**
     * called when engine rebases its local coords
     * @internal
     */
    _rebaseOrigin(delta) {
        for (var state of this.getStatesList(this.names.position)) {
            var locPos = state._localPosition
            var hw = state.width / 2
            nudgePosition(locPos, 0, -hw, hw, state.__id)
            nudgePosition(locPos, 1, 0, state.height, state.__id)
            nudgePosition(locPos, 2, -hw, hw, state.__id)
            vec3.subtract(locPos, locPos, delta)
            this._updateDerivedPositionData(state.__id, state)
        }
    }

    /** @internal */
    _localGetPosition(id) {
        return this.getPositionData(id)._localPosition
    }

    /** @internal */
    _localSetPosition(id, pos) {
        var posDat = this.getPositionData(id)
        vec3.copy(posDat._localPosition, pos)
        this._updateDerivedPositionData(id, posDat)
    }


    /** 
     * helper to update everything derived from `_localPosition`
     * @internal 
    */
    _updateDerivedPositionData(id, posDat) {
        vec3.copy(posDat._renderPosition, posDat._localPosition)
        var offset = this.noa.worldOriginOffset
        vec3.add(posDat.position, posDat._localPosition, offset)
        updatePositionExtents(posDat)
        var physDat = this.getPhysics(id)
        if (physDat) setPhysicsFromPosition(physDat, posDat)
    }





    /*
     *
     *
     *      OTHER ENTITY MANAGEMENT APIs
     * 
     *      note most APIs are on the original ECS module (ent-comp)
     *      these are some overlaid extras for noa
     *
     *
    */


    /** 
     * Safely add a component - if the entity already had the 
     * component, this will remove and re-add it.
    */
    addComponentAgain(id, name, state) {
        // removes component first if necessary
        if (this.hasComponent(id, name)) this.removeComponent(id, name)
        this.addComponent(id, name, state)
    }


    /** 
     * Checks whether a voxel is obstructed by any entity (with the 
     * `collidesTerrain` component)
    */
    isTerrainBlocked(x, y, z) {
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



    /** 
     * Gets an array of all entities overlapping the given AABB
    */
    getEntitiesInAABB(box, withComponent) {
        // extents to test against
        var off = this.noa.worldOriginOffset
        var testExtents = [
            box.base[0] + off[0], box.base[1] + off[1], box.base[2] + off[2],
            box.max[0] + off[0], box.max[1] + off[1], box.max[2] + off[2],
        ]
        // entity position state list
        var entStates
        if (withComponent) {
            entStates = []
            for (var compState of this.getStatesList(withComponent)) {
                var pdat = this.getPositionData(compState.__id)
                if (pdat) entStates.push(pdat)
            }
        } else {
            entStates = this.getStatesList(this.names.position)
        }

        // run each test
        var hits = []
        for (var i = 0; i < entStates.length; i++) {
            var state = entStates[i]
            if (extentsOverlap(testExtents, state._extents)) {
                hits.push(state.__id)
            }
        }
        return hits
    }



    /** 
     * Helper to set up a general entity, and populate with some common components depending on arguments.
    */
    add(position, width, height, // required
        mesh, meshOffset, doPhysics, shadow) {

        var self = this

        // new entity
        var eid = this.createEntity()

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
            var body = this.getPhysics(eid).body

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
}


/*
 * 
 * 
 * 
 *          HELPERS
 * 
 * 
 * 
*/

// safety helper - when rebasing, nudge extent away from 
// voxel boudaries, so floating point error doesn't carry us accross
function nudgePosition(pos, index, dmin, dmax, id) {
    var min = pos[index] + dmin
    var max = pos[index] + dmax
    if (Math.abs(min - Math.round(min)) < 0.002) pos[index] += 0.002
    if (Math.abs(max - Math.round(max)) < 0.001) pos[index] -= 0.001
}

// compare extent arrays
function extentsOverlap(extA, extB) {
    if (extA[0] > extB[3]) return false
    if (extA[1] > extB[4]) return false
    if (extA[2] > extB[5]) return false
    if (extA[3] < extB[0]) return false
    if (extA[4] < extB[1]) return false
    if (extA[5] < extB[2]) return false
    return true
}

