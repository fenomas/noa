'use strict'

var vec3 = require('gl-vec3')


module.exports = function (noa) {


    return {

        name: 'physics',

        order: 40,

        state: {
            body: null,
        },


        onAdd: function (entID, state) {
            state.body = noa.physics.addBody()
            // implicitly assume body has a position component, to get size
            var dat = noa.ents.getPositionData(state.__id)
            noa.ents.setEntitySize(state.__id, dat.width, dat.height, dat.width)
        },


        onRemove: function (entID, state) {
            // update position before removing
            // this lets entity wind up at e.g. the result of a collision
            // even if physics component is removed in collision handler
            if (noa.ents.hasPosition(state.__id)) {
                var pdat = noa.ents.getPositionData(state.__id)
                updatePositionFromPhysics(state, pdat)
                backtrackRenderPos(state, pdat, 0, false)
            }
            noa.physics.removeBody(state.body)
        },


        system: function (dt, states) {
            states.forEach(state => {
                var pdat = noa.ents.getPositionData(state.__id)
                updatePositionFromPhysics(state, pdat)
            })
        },


        renderSystem: function (dt, states) {

            var tickPos = noa.positionInCurrentTick
            var tickMS = tickPos * noa._tickRate

            // tickMS is time since last physics engine tick
            // to avoid temporal aliasing, render the state as if lerping between
            // the last position and the next one 
            // since the entity data is the "next" position this amounts to 
            // offsetting each entity into the past by tickRate - dt
            // http://gafferongames.com/game-physics/fix-your-timestep/

            var backtrackAmt = (tickMS - noa._tickRate) / 1000
            states.forEach(state => {
                var id = state.__id
                var pdat = noa.ents.getPositionData(id)
                var smoothed = noa.ents.cameraSmoothed(id)
                backtrackRenderPos(state, pdat, backtrackAmt, smoothed)
            })
        }

    }

}



var offset = vec3.create()
var pos = vec3.create()



function updatePositionFromPhysics(state, posDat) {
    offset[0] = offset[2] = posDat.width / 2
    offset[1] = 0
    var pos = posDat.position
    var base = state.body.aabb.base
    var max = state.body.aabb.max
    var ext = posDat._extents
    for (var j = 0; j < 3; j++) {
        pos[j] = base[j] + offset[j]
        ext[j] = base[j]
        ext[j + 3] = max[j]
    }
}


function backtrackRenderPos(state, posDat, backtrackAmt, smoothed) {
    // pos = pos + backtrack * body.velocity
    vec3.scaleAndAdd(pos, posDat.position, state.body.velocity, backtrackAmt)

    // smooth out update if component is present
    // (this is set after sudden movements like auto-stepping)
    if (smoothed) vec3.lerp(pos, posDat.renderPosition, pos, 0.3)

    // copy values over to renderPosition, 
    vec3.copy(posDat.renderPosition, pos)
}
