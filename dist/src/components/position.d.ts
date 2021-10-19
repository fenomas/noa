/**
 * 	Component holding entity's position, width, and height.
 *  By convention, entity's "position" is the bottom center of its AABB
 *
 *  Of the various properties, _localPosition is the "real",
 *  single-source-of-truth position. Others are derived.
 *  Local coords are relative to `noa.worldOriginOffset`.
 * @param {import('..').Engine} noa
*/
export default function _default(noa: import('..').Engine): {
    name: string;
    order: number;
    state: PositionState;
    onAdd: (eid: any, state: any) => void;
    onRemove: any;
    system: (dt: any, states: any) => void;
};
export function updatePositionExtents(state: any): void;
export class PositionState {
    /** Position in global coords (may be low precision)
     * @type {null | number[]} */
    position: null | number[];
    width: number;
    height: number;
    /** Precise position in local coords
     * @type {null | number[]} */
    _localPosition: null | number[];
    /** [x,y,z] in LOCAL COORDS
     * @type {null | number[]} */
    _renderPosition: null | number[];
    /** [lo,lo,lo, hi,hi,hi] in LOCAL COORDS
     * @type {null | number[]} */
    _extents: null | number[];
}
