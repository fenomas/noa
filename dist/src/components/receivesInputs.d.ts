/**
 *
 * Input processing component - gets (key) input state and
 * applies it to receiving entities by updating their movement
 * component state (heading, movespeed, jumping, etc.)
 *
 */
export default function _default(noa: any): {
    name: string;
    order: number;
    state: {};
    onAdd: any;
    onRemove: any;
    system: (dt: any, states: any) => void;
};
