export default function _default(
    noa: any,
    dist: any
): {
    name: string;
    order: number;
    state: {
        size: number;
        _mesh: any;
    };
    onAdd: (eid: number, state: any) => void;
    onRemove: (eid: number, state: any) => void;
    system: (dt: any, states: any) => void;
    renderSystem: (dt: any, states: any) => void;
};
