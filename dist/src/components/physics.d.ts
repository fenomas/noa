/**
 * Physics component, stores an entity's physics engbody.
 * @param {import('..').Engine} noa
*/
export default function _default(noa: import('..').Engine): {
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
 * @prop {number} airDrag
 * @prop {number} fluidDrag
 * @prop {boolean} autoStep
 * @prop {null | function} onCollide
 * @prop {null | function} onStep
 * @prop {number[]} velocity
 * @prop {number[]} resting
 * @prop {boolean} inFluid
 *
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
    airDrag: number;
    fluidDrag: number;
    autoStep: boolean;
    onCollide: null | Function;
    onStep: null | Function;
    velocity: number[];
    resting: number[];
    inFluid: boolean;
};
