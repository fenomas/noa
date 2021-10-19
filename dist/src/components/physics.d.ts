export default function _default(noa: any): {
    name: string;
    order: number;
    state: PhysicsState;
    onAdd: (entID: any, state: any) => void;
    onRemove: (entID: any, state: any) => void;
    system: (dt: any, states: any) => void;
    renderSystem: (dt: any, states: any) => void;
};
export function setPhysicsFromPosition(physState: any, posState: any): void;
/**
 * @typedef {Object} RigidBody
 * @prop {import('aabb-3d')} aabb
 * @prop {number} mass
 * @prop {number} friction
 * @prop {number} restitution
 * @prop {number} gravityMultiplier
 * @prop {number} autoStep
 * @prop {number} airDrag
 * @prop {number} fluidDrag
 * @prop {function} onCollide
 * @prop {function} onStep
 */
export class PhysicsState {
    /** @type {null | RigidBody} */
    body: null | RigidBody;
}
export type RigidBody = {
    aabb: import('aabb-3d');
    mass: number;
    friction: number;
    restitution: number;
    gravityMultiplier: number;
    autoStep: number;
    airDrag: number;
    fluidDrag: number;
    onCollide: Function;
    onStep: Function;
};
