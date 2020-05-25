/**
 *
 * Movement component. State stores settings like jump height, etc.,
 * as well as current state (running, jumping, heading angle).
 * Processor checks state and applies movement/friction/jump forces
 * to the entity's physics body.
 *
 */
export default function _default(noa: any): {
    name: string;
    order: number;
    state: {
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
        _isJumping: number;
        _currjumptime: number;
    };
    onAdd: any;
    onRemove: any;
    system: (dt: any, states: any) => void;
};
