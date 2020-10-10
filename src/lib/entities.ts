import vec3 from 'gl-vec3'
import EntComp from 'ent-comp'

import { position, updatePositionExtents } from './components/position'
import { physics, setPhysicsFromPosition } from './components/physics'
import Engine, { Vector } from ".."
import { smoothCamera } from "./components/smoothCamera"
import { shadow } from "./components/shadow"
import { receivesInputs } from "./components/receivesInputs"
import { movement } from "./components/movement"
import { mesh } from "./components/mesh"
import { followsEntity } from "./components/followsEntity"
import { fadeOnZoom } from "./components/fadeOnZoom"
import { collideTerrain } from "./components/collideTerrain"
import { collideEntities } from "./components/collideEntities"

export interface IEntitiesOptions {
    shadowDistance: number;
}

const entitiesDefaults: IEntitiesOptions = {
    shadowDistance: 10,
}


/**
 * @description Wrangles entities. Aliased as `noa.ents`.
 * 
 * This class is an instance of [ECS](https://github.com/andyhall/ent-comp), 
 * and as such implements the usual ECS methods.
 * It's also decorated with helpers and accessor functions for getting component existence/state.
 * 
 * note most APIs are on the original ECS module (ent-comp)
 * these are some overlaid extras for noa
 * 
 * Expects entity definitions in a specific format - see source `components` folder for examples.
 */
export class Entities extends EntComp {
    constructor(noa: Engine, options: Partial<IEntitiesOptions>) {
        // inherit from the ECS library
        super()

        this.noa = noa
        const optionsWithDefaults = {
            ...entitiesDefaults,
            ...options
        }

        this.names = {
            collideEntities: this.createComponent(collideEntities(noa)),
            collideTerrain: this.createComponent(collideTerrain(noa)),
            fadeOnZoom: this.createComponent(fadeOnZoom(noa)),
            followsEntity: this.createComponent(followsEntity(noa)),
            mesh: this.createComponent(mesh(noa)),
            movement: this.createComponent(movement(noa)),
            physics: this.createComponent(physics(noa)),
            position: this.createComponent(position(noa)),
            receivesInputs: this.createComponent(receivesInputs(noa)),
            shadow: this.createComponent(shadow(noa, optionsWithDefaults.shadowDistance)),
            smoothCamera: this.createComponent(smoothCamera(noa)),
        }
        
        // physics
        this.getPhysicsBody = function (id: any) {
            return this.getPhysics(id).body
        }

        // misc
        this.getMeshData = this.getStateAccessor(this.names.mesh)
        this.getMovement = this.getStateAccessor(this.names.movement)
        this.getCollideTerrain = this.getStateAccessor(this.names.collideTerrain)
        this.getCollideEntities = this.getStateAccessor(this.names.collideEntities)

        // pairwise collideEntities event - this is for client to override
        this.onPairwiseEntityCollision = function (id1: any, id2: any) {}
    }

    noa: Engine;

    /** Hash containing the component names of built-in components. */
    names = {
        collideEntities: "collideEntities",
        collideTerrain: "collideTerrain",
        fadeOnZoom: "fadeOnZoom",
        followsEntity: "followsEntity",
        mesh: "mesh",
        movement: "movement",
        physics: "physics",
        position: "position",
        receivesInputs: "receivesInputs",
        shadow: "shadow",
        smoothCamera: "smoothCamera",
    };

    getMeshData: any;
    getMovement: any;
    getCollideTerrain: any;
    getCollideEntities: any;

    onPairwiseEntityCollision: any;

    isPlayer(id: number) {
        return id === this.noa.playerEntity
    }

    getPhysics(id: number) {
        return this.getStateAccessor<{ __id: number; body: any; }>(this.names.physics)(id)!
    }

    hasPhysics(id: number) {
        return this.getComponentAccessor(this.names.physics)(id)!
    }
    
    cameraSmoothed(id: number) {
        return this.getComponentAccessor(this.names.smoothCamera)(id)!
    }

    hasMesh(id: number) {
        return this.getComponentAccessor(this.names.mesh)(id)!
    }

    hasPosition(id: number) {
        return this.getComponentAccessor(this.names.position)(id)!
    }

    getPositionData(id: number) {
        return this.getStateAccessor<{ __id: number; _localPosition: Vector; _renderPosition: Vector; _extents: Vector; position: Vector; height: number; }>(this.names.position)(id)!
    }

    _localGetPosition(id: number) {
        return this.getStateAccessor<any>(this.names.position)(id)!._localPosition
    }

    getPosition(id: number) {
        return this.getStateAccessor<any>(this.names.position)(id)!.position
    }

    _localSetPosition(id: number, pos: Vector) {
        const positionData = this.getPositionData(id)
        vec3.copy(positionData._localPosition, pos)
        this.updateDerivedPositionData(id, positionData)
    }

    setPosition(id: number, position: Vector): void;
    setPosition(id: number, x: number, y: number, z: number): void;
    setPosition(id: number, position: Vector | number, y?: number, z?: number) {
        let vector: Vector;

        // check if called with "x, y, z" args
        if (Array.isArray(position)) {
            vector = position
        }
        else {
            vector = [position, y!, z!]
        }
        
        // convert to local and defer impl
        const loc = this.noa.globalToLocal(vector, null, [] as any)
        this._localSetPosition(id, loc)
    }

    setEntitySize(id: number, xs: any, ys: any, zs: any) {
        interface IPosData {
            __id: number;
            width: number;
            height: number;
        }
        
        var getPos = this.getStateAccessor<IPosData>(this.names.position)
        var posDat = getPos(id)!
        posDat.width = (xs + zs) / 2
        posDat.height = ys
        this.updateDerivedPositionData(id, posDat)
    }

    /** called when engine rebases its local coords */
    _rebaseOrigin(delta: any) {
        this.getStatesList(this.names.position).forEach((state: any) => {
            vec3.sub(state._localPosition, state._localPosition, delta)
            this.updateDerivedPositionData(state.__id, state)
        })
    }

    createComponent: any;
    getPhysicsBody: any;

    hasComponent: any;
    addComponent: any;
    createEntity: any;
    removeComponent: any;
    getStatesList: any;


    /** helper to update everything derived from `_localPosition` */
    updateDerivedPositionData(id: number, posDat: any) {
        vec3.copy(posDat._renderPosition, posDat._localPosition)
        vec3.add(posDat.position, posDat._localPosition, this.noa.worldOriginOffset)
        updatePositionExtents(posDat)

        var getPhys = this.getStateAccessor(this.names.physics)
        var physDat = getPhys(id)
        if (physDat) setPhysicsFromPosition(physDat, posDat)
    }
    
    
    addComponentAgain(id: string, name: string, state?: any) {
        // removes component first if necessary
        if (this.hasComponent(id, name)) this.removeComponent(id, name, true)
        this.addComponent(id, name, state)
    }
    
    isTerrainBlocked(x: number, y: number, z: number) {
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

    getEntitiesInAABB(box: any, withComponent: any) {
        // extents to test against
        var off = this.noa.worldOriginOffset
        var testExtents = [
            box.base[0] + off[0], box.base[1] + off[1], box.base[2] + off[2],
            box.max[0] + off[0], box.max[1] + off[1], box.max[2] + off[2],
        ]

        // entity position state list
        var entStates = (withComponent) ?
            this.getStatesList(withComponent).map((state: any) => {
                return this.getPositionData(state.__id)
            }) : this.getStatesList(this.names.position)

        // run each test
        var hits: any[] = []
        entStates.forEach((state: any) => {
            if (extentsOverlap(testExtents, state._extents)) {
                hits.push(state.__id)
            }
        })

        return hits
    }

    /** 
     * Helper to set up a general entity, and populate with some common components depending on arguments.
     */
    add(position: any, width: number, height: number, mesh?: any, meshOffset?: any, doPhysics?: boolean, shadow?: any) {
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
}

function extentsOverlap(extA: number[], extB: number[]) {
    if (extA[0] > extB[3]) return false
    if (extA[1] > extB[4]) return false
    if (extA[2] > extB[5]) return false
    if (extA[3] < extB[0]) return false
    if (extA[4] < extB[1]) return false
    if (extA[5] < extB[2]) return false
    return true
}
