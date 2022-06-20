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
export class PhysicsState {
    /** @type {import('voxel-physics-engine').RigidBody} */
    body: import('voxel-physics-engine').RigidBody;
}
