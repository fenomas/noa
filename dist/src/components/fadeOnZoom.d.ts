/**
 * Component for the player entity, when active hides the player's mesh
 * when camera zoom is less than a certain amount
 */
export default function _default(noa: any): {
    name: string;
    order: number;
    state: {
        cutoff: number;
        _showing: any;
    };
    onAdd: any;
    onRemove: any;
    system: (dt: any, states: any) => void;
};
