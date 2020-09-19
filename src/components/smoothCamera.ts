import Engine from ".."

interface IComponent {
    name: string;
    order: number;
    state: Partial<{
        position: null;
        time: number;
        size: number;
        _mesh: null;
        mesh: null;
        offset: null;
        entity: number;

        cylinder: boolean;
        collideBits: number;
        collideMask: number;

        callback: null;

        cutoff: number;
        _showing: true;
        
        body: null;
        width: number;
        height: number;
        _localPosition: null;
        _renderPosition: null;
        _extents: null;
    
        // current state
        heading: number; // radians
        running: boolean;
        jumping: boolean;

        // options:
        maxSpeed: number;
        moveForce: number;
        responsiveness: number;
        runningFriction: number;
        standingFriction: number;

        airMoveMult: number;
        jumpImpulse: number;
        jumpForce: number;
        
        /** ms */
        jumpTime: number;
        airJumps: number;

        // internal state
        _jumpCount: number;
        _isJumping: number;
        _currjumptime: number;
    }>;
    onAdd: null | ((eid: any, state: any) => any);
    onRemove: null | ((eid: any, state: any) => any);
    system: null | ((dt: any, states: any) => any);
    renderSystem?: (dt: any, states: any) => any;
}


export default function (noa: Engine): IComponent {
    return {
        name: 'smooth-camera',
        order: 99,
        state: {
            time: 100.1
        },
        onAdd: null,
        onRemove: null,
        system: function (dt, states) {
            // remove self after time elapses
            states.forEach((state: any) => {
                state.time -= dt
                if (state.time < 0) noa.ents.removeComponent(state.__id, 'smooth-camera')
            })
        }
    }
}
