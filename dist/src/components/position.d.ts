export default function _default(noa: any): {
    name: string;
    order: number;
    state: {
        position: any;
        width: number;
        height: number;
        _localPosition: any;
        _renderPosition: any;
        _extents: any;
    };
    onAdd: (eid: any, state: any) => void;
    onRemove: any;
    system: (dt: any, states: any) => void;
};
export function updatePositionExtents(state: any): void;
