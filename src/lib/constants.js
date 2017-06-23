'use strict'

var constants = {}
module.exports = constants


/* 
 *  Internal voxel data representation
 *
 *  Each voxel is stored as a Uint16.
 *  Voxel id is stored in lowest bits, and flags stored in upper bits for fast retrieval
 *  
 *  Stores, from right to left:
 *     9 bits of voxel ID
 *     4 bits of variation (e.g. orientation)  --- Not yet being used!
 *     1 bit solidity (i.e. physics-wise)
 *     1 bit opacity (whether voxel obscures neighboring faces)
 *     1 bit object marker (marks non-terrain blocks with custom meshes)
*/


var ID_BITS = 9
var ID_MASK = (1 << ID_BITS) - 1

var VAR_BITS = 4
var VAR_OFFSET = ID_BITS
var VAR_MASK = ((1 << VAR_BITS) - 1) << VAR_OFFSET

var n = ID_BITS + VAR_BITS
var SOLID_BIT = 1 << n++
var OPAQUE_BIT = 1 << n++
var OBJECT_BIT = 1 << n++

// exports

constants.ID_MASK = ID_MASK
constants.VAR_MASK = VAR_MASK
constants.SOLID_BIT =  SOLID_BIT
constants.OPAQUE_BIT = OPAQUE_BIT
constants.OBJECT_BIT = OBJECT_BIT


