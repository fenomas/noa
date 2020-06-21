import { Mesh } from "@babylonjs/core";

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
    _localSetPosition: (id: number, pos: number[]) => void;
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
    onPairwiseEntityCollision: (id1: number, id2: number) => void;
    addComponentAgain(id: number, name: string, state?: Object): void;
    addComponent(id: number, name: string, state?: Object): void;
    isTerrainBlocked(x: number, y: number, z: number): boolean;
    getEntitiesInAABB(box: number, withComponent: any): any[];

    /** Helper to set up a general entity, and populate with some common components depending on arguments. */
    add(
        position: number[],
        width: number,
        height: number,
        mesh: Mesh,
        meshOffset?: number[],
        doPhysics?: boolean,
        shadow?: boolean
    ): any;
}
export {};
