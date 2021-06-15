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
    constructor(noa: any, opts: any);
    noa: any;
    /** Hash containing the component names of built-in components. */
    names: {};
    hasPhysics: (id: any) => boolean;
    cameraSmoothed: (id: any) => boolean;
    hasPosition: (id: any) => boolean;
    hasMesh: (id: any) => boolean;
    getMeshData: (id: any) => any;
    getPositionData: (id: any) => any;
    getPosition: (id: any) => any;
    getPhysics: (id: any) => any;
    getPhysicsBody: (id: any) => any;
    getMovement: (id: any) => any;
    getCollideTerrain: (id: any) => any;
    getCollideEntities: (id: any) => any;
    onPairwiseEntityCollision: (id1: any, id2: any) => void;
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
    _localGetPosition(id: any): any;
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
    add(position: any, width: any, height: any, mesh: any, meshOffset: any, doPhysics: any, shadow: any): number;
}
import ECS from "ent-comp";
