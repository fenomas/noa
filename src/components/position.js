import vec3 from 'gl-vec3'

export default function (noa) {

    /**
     * 
     * 	Component holding entity's position, width, and height.
     *  By convention, entity's "position" is the bottom center of its AABB
     * 
     *  Of the various properties, _localPosition is the "real", 
     *  single-source-of-truth position. Others are derived.
     *  Local coords are relative to `noa.worldOriginOffset`.
     * 
     *  Props:
     *      position: pos in global coords (may be low precision)
     *      _localPosition: precise pos in local coords
     *      _renderPosition: [x,y,z] in LOCAL COORDS
     *      _extents: array [lo, lo, lo, hi, hi, hi] in LOCAL COORDS
     * 
     */



    return {

        name: 'position',

        order: 60,

        state: {
            position: null,
            width: +1,
            height: +1,
            _localPosition: null,
            _renderPosition: null,
            _extents: null,
        },


        onAdd: function (eid, state) {
            // copy position into a plain array
            var pos = [0, 0, 0]
            if (state.position) vec3.copy(pos, state.position)
            state.position = pos

            state._localPosition = vec3.create()
            state._renderPosition = vec3.create()
            state._extents = new Float32Array(6)

            // on init only, set local from global
            noa.globalToLocal(state.position, null, state._localPosition)
            vec3.copy(state._renderPosition, state._localPosition)
            updatePositionExtents(state)
        },

        onRemove: null,



        system: function (dt, states) {
            var off = noa.worldOriginOffset
            states.forEach(state => {
                vec3.add(state.position, state._localPosition, off)
                updatePositionExtents(state)
            })
        },


    }
}



// update an entity's position state `_extents` 
export function updatePositionExtents(state) {
    var hw = state.width / 2
    var lpos = state._localPosition
    var ext = state._extents
    ext[0] = lpos[0] - hw
    ext[1] = lpos[1]
    ext[2] = lpos[2] - hw
    ext[3] = lpos[0] + hw
    ext[4] = lpos[1] + state.height
    ext[5] = lpos[2] + hw
}
