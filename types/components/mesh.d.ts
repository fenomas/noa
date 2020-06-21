export default function _default(
    noa: any
): {
    name: string;
    order: number;
    state: {
        mesh: any;
        offset: any;
    };
    onAdd: (eid: number, state: any) => void;
    onRemove: (eid: number, state: any) => void;
    renderSystem: (dt: any, states: any) => void;
};
