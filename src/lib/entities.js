
import ECS from 'ent-comp'
import vec3 from 'gl-vec3'
import { updatePositionExtents } from '../components/position'
import { setPhysicsFromPosition } from '../components/physics'


// Component definitions
import collideEntitiesComp from "../components/collideEntities.js"
import collideTerrainComp from "../components/collideTerrain.js"
import fadeOnZoomComp from "../components/fadeOnZoom.js"
import followsEntityComp from "../components/followsEntity.js"
import meshComp from "../components/mesh.js"
import movementComp from "../components/movement.js"
import physicsComp from "../components/physics.js"
import positionComp from "../components/position.js"
import receivesInputsComp from "../components/receivesInputs.js"
import shadowComp from "../components/shadow.js"
import smoothCameraComp from "../components/smoothCamera.js"



var defaultOptions = {
    shadowDistance: 10,
}


/**
 * `noa.entities` - manages entities and components.
 * 
 * This class extends [ent-comp](https://github.com/fenomas/ent-comp), 
 * a general-purpose ECS. It's also decorated with noa-specific helpers and 
 * accessor functions for querying entity positions, etc.
 * 
 * Expects entity definitions in a specific format - see source `components` 
 * folder for examples.
 * 
 * This module uses the following default options (from the options
 * object passed to the {@link Engine}):
 * 
 * ```js
 * var defaults = {
 *     shadowDistance: 10,
 * }
 * ```
*/

export class Entities extends ECS {


    /** @internal */
    constructor(noa, opts) {
        super()
        opts = Object.assign({}, defaultOptions, opts)
        // optional arguments to supply to component creation functions
        var componentArgs = {
            'shadow': opts.shadowDistance,
        }

        /** 
         * @internal
         * @type {import('../index').Engine}
        */
        this.noa = noa

        /** Hash containing the component names of built-in components.
         * @type {{ [key:string]: string }} 
        */
        this.names = {}


        // call `createComponent` on all component definitions, and
        // store their names in ents.names
        var compDefs = {
            collideEntities: collideEntitiesComp,
            collideTerrain: collideTerrainComp,
            fadeOnZoom: fadeOnZoomComp,
            followsEntity: followsEntityComp,
            mesh: meshComp,
            movement: movementComp,
            physics: physicsComp,
            position: positionComp,
            receivesInputs: receivesInputsComp,
            shadow: shadowComp,
            smoothCamera: smoothCameraComp,
        }

        Object.keys(compDefs).forEach(bareName => {
            var arg = componentArgs[bareName] || undefined
            var compFn = compDefs[bareName]
            var compDef = compFn(noa, arg)
            this.names[bareName] = this.createComponent(compDef)
        })



        /*
         *
         *
         * 
         *          ENTITY ACCESSORS
         *
         * A whole bunch of getters and such for accessing component state.
         * These are moderately faster than `ents.getState(whatever)`.
         * 
         * 
         * 
        */

        /** @internal */
        this.cameraSmoothed = this.getComponentAccessor(this.names.smoothCamera)


        /**
         * Returns whether the entity has a physics body
         * @type {(id:number) => boolean}
        */
        this.hasPhysics = this.getComponentAccessor(this.names.physics)

        /**
         * Returns whether the entity has a position
         * @type {(id:number) => boolean}
        */
        this.hasPosition = this.getComponentAccessor(this.names.position)

        /**
         * Returns the entity's position component state
         * @type {(id:number) => null | import("../components/position").PositionState} 
        */
        this.getPositionData = this.getStateAccessor(this.names.position)

        /**
         * Returns the entity's position vector.
         * @type {(id:number) => number[]}
        */
        this.getPosition = (id) => {
            var state = this.getPositionData(id)
            return (state) ? state.position : null
        }

        /**
         * Get the entity's `physics` component state.
         * @type {(id:number) => null | import("../components/physics").PhysicsState} 
        */
        this.getPhysics = this.getStateAccessor(this.names.physics)

        /**
         * Returns the entity's physics body
         * Note, will throw if the entity doesn't have the position component!
         * @type {(id:number) => null | import("voxel-physics-engine").RigidBody} 
        */
        this.getPhysicsBody = (id) => {
            var state = this.getPhysics(id)
            return (state) ? state.body : null
        }

        /**
         * Returns whether the entity has a mesh
         * @type {(id:number) => boolean}
        */
        this.hasMesh = this.getComponentAccessor(this.names.mesh)

        /**
         * Returns the entity's `mesh` component state
         * @type {(id:number) => {mesh:any, offset:number[]}}
        */
        this.getMeshData = this.getStateAccessor(this.names.mesh)

        /**
         * Returns the entity's `movement` component state
         * @type {(id:number) => import('../components/movement').MovementState}
        */
        this.getMovement = this.getStateAccessor(this.names.movement)

        /**
         * Returns the entity's `collideTerrain` component state
         * @type {(id:number) => {callback: function}}
        */
        this.getCollideTerrain = this.getStateAccessor(this.names.collideTerrain)

        /**
         * Returns the entity's `collideEntities` component state
         * @type {(id:number) => {
         *      cylinder:boolean, collideBits:number, 
         *      collideMask:number, callback: function}}
        */
        this.getCollideEntities = this.getStateAccessor(this.names.collideEntities)


        /**
         * Pairwise collideEntities event - assign your own function to this 
         * property if you want to handle entity-entity overlap events.
         * @type {(id1:number, id2:number) => void}
         */
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
            box.base[0] - off[0], box.base[1] - off[1], box.base[2] - off[2],
            box.max[0] - off[0], box.max[1] - off[1], box.max[2] - off[2],
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
    add(position = null, width = 1, height = 1,
        mesh = null, meshOffset = null, doPhysics = false, shadow = false) {

        var self = this

        // new entity
        var eid = this.createEntity()

        // position component
        this.addComponent(eid, this.names.position, {
            position: position || vec3.create(),
            width: width,
            height: height,
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

