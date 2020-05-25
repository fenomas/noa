export default function _default(
    noa: any
): {
    name: string;
    order: number;
    state: {
        entity: number;
        offset: any;
    };
    onAdd: (eid: number, state: any) => void;
    onRemove: any;
    system: (dt: any, states: any) => void;
    renderSystem: (dt: any, states: any) => void;
};
