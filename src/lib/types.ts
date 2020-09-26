

export type Color3 = [number, number, number];

export type Color4 = [number, number, number, number];

export interface IComponent {
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
    system?: null | ((dt: any, states: any) => any);
    renderSystem?: (dt: any, states: any) => any;
}