declare module "rigidBody" {
    export = RigidBody;
    function RigidBody(_aabb: any, mass: any, friction: any, restitution: any, gravMult: any, onCollide: any, autoStep: any): void;
    class RigidBody {
        constructor(_aabb: any, mass: any, friction: any, restitution: any, gravMult: any, onCollide: any, autoStep: any);
        aabb: any;
        mass: any;
        friction: any;
        restitution: any;
        gravityMultiplier: any;
        onCollide: any;
        autoStep: boolean;
        airDrag: number;
        fluidDrag: number;
        onStep: any;
        velocity: any;
        resting: number[];
        inFluid: boolean;
        _ratioInFluid: number;
        _forces: any;
        _impulses: any;
        _sleepFrameCount: number;
        setPosition(p: any): void;
        getPosition(): any;
        applyForce(f: any): void;
        applyImpulse(i: any): void;
        _markActive(): void;
        atRestX(): number;
        atRestY(): number;
        atRestZ(): number;
    }
}
declare module "voxel-physics-engine" {
    export function Physics(opts: any, testSolid: any, testFluid: any): void;
    export class Physics {
        constructor(opts: any, testSolid: any, testFluid: any);
        gravity: any;
        airDrag: any;
        fluidDensity: any;
        fluidDrag: any;
        minBounceImpulse: any;
        bodies: any[];
        testSolid: any;
        testFluid: any;
        addBody(_aabb: any, mass: any, friction: any, restitution: any, gravMult: any, onCollide: any): RigidBody;
        removeBody(b: any): any;
        tick(dt: any): void;
    }
    import RigidBody = require("rigidBody");
}
