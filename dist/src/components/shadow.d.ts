/** @param {import('../index').Engine} noa  */
export default function _default(noa: import('../index').Engine, distance?: number): {
    name: string;
    order: number;
    state: {
        size: number;
        _mesh: any;
    };
    onAdd: (eid: any, state: any) => void;
    onRemove: (eid: any, state: any) => void;
    system: (dt: any, states: any) => void;
    renderSystem: (dt: any, states: any) => void;
};
