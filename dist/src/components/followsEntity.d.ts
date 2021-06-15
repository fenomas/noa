export default function _default(noa: any): {
    name: string;
    order: number;
    state: {
        entity: number;
        offset: any;
        onTargetMissing: any;
    };
    onAdd: (eid: any, state: any) => void;
    onRemove: any;
    system: (dt: any, states: any) => void;
    renderSystem: (dt: any, states: any) => void;
};
