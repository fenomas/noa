export default function _default(noa: any): {
    name: string;
    order: number;
    state: {
        body: any;
    };
    onAdd: (entID: any, state: any) => void;
    onRemove: (entID: any, state: any) => void;
    system: (dt: any, states: any) => void;
    renderSystem: (dt: any, states: any) => void;
};
export function setPhysicsFromPosition(physState: any, posState: any): void;
