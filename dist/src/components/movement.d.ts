/**
 * State object of the `movement` component
 * @class
*/
export function MovementState(): void;
export class MovementState {
    heading: number;
    running: boolean;
    jumping: boolean;
    maxSpeed: number;
    moveForce: number;
    responsiveness: number;
    runningFriction: number;
    standingFriction: number;
    airMoveMult: number;
    jumpImpulse: number;
    jumpForce: number;
    jumpTime: number;
    airJumps: number;
    _jumpCount: number;
    _currjumptime: number;
    _isJumping: boolean;
}
/**
 * Movement component. State stores settings like jump height, etc.,
 * as well as current state (running, jumping, heading angle).
 * Processor checks state and applies movement/friction/jump forces
 * to the entity's physics body.
 * @param {import('..').Engine} noa
 * @internal
*/
export default function _default(noa: import('..').Engine): {
    name: string;
    order: number;
    state: MovementState;
    onAdd: any;
    onRemove: any;
    system: (dt: any, states: any) => void;
};
