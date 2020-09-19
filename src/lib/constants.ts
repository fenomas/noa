/**
 * Internal voxel data representation
 *
 * Each voxel is stored as a Uint16.
 * Voxel id is stored in lowest bits, and flags stored in upper bits for fast retrieval
 * 
 * Stores, from right to left:
 *    9 bits of voxel ID
 *    4 bits of variation (e.g. orientation)  --- Not yet being used!
 *    1 bit solidity (i.e. physics-wise)
 *    1 bit opacity (whether voxel obscures neighboring faces)
 *    1 bit object marker (marks non-terrain blocks with custom meshes)
 */
const ID_BITS = 9
const ID_MASK = (1 << ID_BITS) - 1

const VAR_BITS = 4
const VAR_OFFSET = ID_BITS
const VAR_MASK = ((1 << VAR_BITS) - 1) << VAR_OFFSET

let n = ID_BITS + VAR_BITS
const SOLID_BIT = 1 << n++
const OPAQUE_BIT = 1 << n++
const OBJECT_BIT = 1 << n++


export const constants = {
    ID_MASK: ID_MASK,
    VAR_MASK: VAR_MASK,
    SOLID_BIT: SOLID_BIT,
    OPAQUE_BIT: OPAQUE_BIT,
    OBJECT_BIT: OBJECT_BIT,
}
