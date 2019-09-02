

/**
 * 
 * 	Component holding entity's position, width, and height.
 *  By convention, "position" is the bottom center of the entity's AABB
 * 
 */


export default function (noa) {

    return {

        name: 'position',

        order: 60,

        state: {
            localPosition: null,
            renderPosition: null,
            width: +0,
            height: +0,
            _extents: null,
            _extentsChanged: true,
        },


        onAdd: function (eid, state) {
            if (state.localPosition) {
                var p = noa.vec3.create()
                noa.vec3.copy(p, state.localPosition)
                state.localPosition = p
            } else {
                state.localPosition = noa.vec3.create()
            }

            state.renderPosition = noa.vec3.create()
            noa.vec3.copy(state.renderPosition, state.localPosition)
            state._extents = new Float32Array(6)
        },

        onRemove: null,



        system: function (dt, states) {
            states.forEach(state => {
                if (!state._extentsChanged) return
                updateExtents(state._extents, state.localPosition, state.height, state.width)
                state._extentsChanged = false
            })
        },


    }
}


function updateExtents(ext, pos, height, width) {
    var hw = width / 2
    ext[0] = pos[0] - hw
    ext[1] = pos[1]
    ext[2] = pos[2] - hw
    ext[3] = pos[0] + hw
    ext[4] = pos[1] + height
    ext[5] = pos[2] + hw
}
