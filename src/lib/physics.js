
var createPhysics = require('voxel-physics-engine')
// var createPhysics = require('../../../../npm-modules/voxel-physics-engine')


export default function (noa, opts) {
    return makePhysics(noa, opts)
}


/**
 * @class Physics
 * @typicalname noa.physics
 * @classdesc Wrapper module for the physics engine. For docs see 
 * [andyhall/voxel-physics-engine](https://github.com/andyhall/voxel-physics-engine)
 */


var defaults = {
    gravity: [0, -10, 0],
    airDrag: 0.1,
}


function makePhysics(noa, opts) {
    opts = Object.assign({}, defaults, opts)
    var world = noa.world
    var solidLookup = noa.registry._solidityLookup
    var fluidLookup = noa.registry._fluidityLookup
    
    // physics engine runs in offset coords, so voxel getters need to match
    var offset = noa.worldOriginOffset

    var blockGetter = (x, y, z) => {
        var id = world.getBlockID(x + offset[0], y + offset[1], z + offset[2])
        return solidLookup[id]
    }
    var isFluidGetter = (x, y, z) => {
        var id = world.getBlockID(x + offset[0], y + offset[1], z + offset[2])
        return fluidLookup[id]
    }

    var physics = createPhysics(opts, blockGetter, isFluidGetter)

    return physics
}
