/**
 * `noa.physics` - Wrapper module for the physics engine.
 *
 * This module extends
 * [voxel-physics-engine](https://github.com/fenomas/voxel-physics-engine),
 * so turn on "Inherited" to see its APIs here, or view the base module
 * for full docs.
 *
 * This module uses the following default options (from the options
 * object passed to the {@link Engine}):
 *
 * ```js
 * {
 *     gravity: [0, -10, 0],
 *     airDrag: 0.1,
 *     fluidDrag: 0.4,
 *     fluidDensity: 2.0,
 *     minBounceImpulse: .5,      // cutoff for a bounce to occur
 * }
 * ```
*/
export class Physics extends VoxelPhysics {
    /**
     * @internal
     * @param {import('../index').Engine} noa
    */
    constructor(noa: import('../index').Engine, opts: any);
}
import { Physics as VoxelPhysics } from 'voxel-physics-engine';
