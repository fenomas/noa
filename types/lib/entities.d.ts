export declare class Entities {
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
    constructor(noa: any, opts: any);
    noa: any;
    /** Hash containing the component names of built-in components. */
    names: {};
    /** @param id */
    isPlayer: (id: number) => boolean;
    /** @param id */
    hasPhysics: any;
    /** @param id */
    cameraSmoothed: any;
    /** @param id */
    hasMesh: any;
    /** @param id */
    hasPosition: any;
    /** @param id */
    getPositionData: any;
    /** @param id */
    _localGetPosition: (id: number) => any;
    /** @param id */
    getPosition: (id: number) => any;
    /** @param id */
    _localSetPosition: (id: number, pos: any) => void;
    /** @param id, positionArr */
    setPosition: (id: number, pos: any, _yarg: any, _zarg: any) => void;
    /** @param id, xs, ys, zs */
    setEntitySize: (id: number, xs: any, ys: any, zs: any) => void;
    _rebaseOrigin: (delta: any) => void;
    getPhysics: any;
    getPhysicsBody: (id: number) => any;
    getMeshData: any;
    getMovement: any;
    getCollideTerrain: any;
    getCollideEntities: any;
    onPairwiseEntityCollision: (id1: any, id2: any) => void;
    constructor: typeof Entities;
    addComponentAgain(id: number, name: any, state: any): void;
    isTerrainBlocked(x: number, y: number, z: number): boolean;
    getEntitiesInAABB(box: number, withComponent: any): any[];
    add(position: any, width: any, height: any, mesh: any, meshOffset: any, doPhysics: any, shadow: any): any;
}
export {};
