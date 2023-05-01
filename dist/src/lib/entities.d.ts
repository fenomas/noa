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
    constructor(noa: any, opts: any);
    /**
     * @internal
     * @type {import('../index').Engine}
    */
    noa: import('../index').Engine;
    /** Hash containing the component names of built-in components.
     * @type {{ [key:string]: string }}
    */
    names: {
        [key: string]: string;
    };
    /** @internal */
    cameraSmoothed: (id: any) => boolean;
    /**
     * Returns whether the entity has a physics body
     * @type {(id:number) => boolean}
    */
    hasPhysics: (id: number) => boolean;
    /**
     * Returns whether the entity has a position
     * @type {(id:number) => boolean}
    */
    hasPosition: (id: number) => boolean;
    /**
     * Returns the entity's position component state
     * @type {(id:number) => null | import("../components/position").PositionState}
    */
    getPositionData: (id: number) => null | import("../components/position").PositionState;
    /**
     * Returns the entity's position vector.
     * @type {(id:number) => number[]}
    */
    getPosition: (id: number) => number[];
    /**
     * Get the entity's `physics` component state.
     * @type {(id:number) => null | import("../components/physics").PhysicsState}
    */
    getPhysics: (id: number) => null | import("../components/physics").PhysicsState;
    /**
     * Returns the entity's physics body
     * Note, will throw if the entity doesn't have the position component!
     * @type {(id:number) => null | import("voxel-physics-engine").RigidBody}
    */
    getPhysicsBody: (id: number) => null | import("voxel-physics-engine").RigidBody;
    /**
     * Returns whether the entity has a mesh
     * @type {(id:number) => boolean}
    */
    hasMesh: (id: number) => boolean;
    /**
     * Returns the entity's `mesh` component state
     * @type {(id:number) => {mesh:any, offset:number[]}}
    */
    getMeshData: (id: number) => {
        mesh: any;
        offset: number[];
    };
    /**
     * Returns the entity's `movement` component state
     * @type {(id:number) => import('../components/movement').MovementState}
    */
    getMovement: (id: number) => import('../components/movement').MovementState;
    /**
     * Returns the entity's `collideTerrain` component state
     * @type {(id:number) => {callback: function}}
    */
    getCollideTerrain: (id: number) => {
        callback: Function;
    };
    /**
     * Returns the entity's `collideEntities` component state
     * @type {(id:number) => {
     *      cylinder:boolean, collideBits:number,
     *      collideMask:number, callback: function}}
    */
    getCollideEntities: (id: number) => {
        cylinder: boolean;
        collideBits: number;
        collideMask: number;
        callback: Function;
    };
    /**
     * Pairwise collideEntities event - assign your own function to this
     * property if you want to handle entity-entity overlap events.
     * @type {(id1:number, id2:number) => void}
     */
    onPairwiseEntityCollision: (id1: number, id2: number) => void;
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
    setPosition(id: number, pos: any, y?: number, z?: number): void;
    /** Set an entity's size
     * @param {number} xs
     * @param {number} ys
     * @param {number} zs
    */
    setEntitySize(id: any, xs: number, ys: number, zs: number): void;
    /**
     * called when engine rebases its local coords
     * @internal
     */
    _rebaseOrigin(delta: any): void;
    /** @internal */
    _localGetPosition(id: any): number[];
    /** @internal */
    _localSetPosition(id: any, pos: any): void;
    /**
     * helper to update everything derived from `_localPosition`
     * @internal
    */
    _updateDerivedPositionData(id: any, posDat: any): void;
    /**
     * Safely add a component - if the entity already had the
     * component, this will remove and re-add it.
    */
    addComponentAgain(id: any, name: any, state: any): void;
    /**
     * Checks whether a voxel is obstructed by any entity (with the
     * `collidesTerrain` component)
    */
    isTerrainBlocked(x: any, y: any, z: any): boolean;
    /**
     * Gets an array of all entities overlapping the given AABB
    */
    getEntitiesInAABB(box: any, withComponent: any): any[];
    /**
     * Helper to set up a general entity, and populate with some common components depending on arguments.
    */
    add(position?: any, width?: number, height?: number, mesh?: any, meshOffset?: any, doPhysics?: boolean, shadow?: boolean): number;
}
import ECS from 'ent-comp';
