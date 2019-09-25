var vec3 = require('gl-vec3')


/*
 * Indicates that an entity should be moved to another entity's position each tick,
 * possibly by a fixed offset, and the same for renderPositions each render
 */

export default function (noa) {

    return {

        name: 'followsEntity',

        order: 50,

        state: {
            entity: 0 | 0,
            offset: null,
        },

        onAdd: function (eid, state) {
            var off = vec3.create()
            state.offset = (state.offset) ? vec3.copy(off, state.offset) : off
            updatePosition(state)
            updateRenderPosition(state)
        },

        onRemove: null,


        // on tick, copy over regular positions
        system: function followEntity(dt, states) {
            states.forEach(state => updatePosition(state))
        },


        // on render, copy over render positions
        renderSystem: function followEntityMesh(dt, states) {
            states.forEach(state => updateRenderPosition(state))
        }
    }



    function updatePosition(state) {
        var id = state.__id
        var self = noa.ents.getPositionData(id)
        var other = noa.ents.getPositionData(state.entity)
        if (!other) {
            return noa.ents.removeComponent(id, noa.ents.names.followsEntity)
        }
        vec3.add(self._localPosition, other._localPosition, state.offset)
    }
    
    function updateRenderPosition(state) {
        var id = state.__id
        var self = noa.ents.getPositionData(id)
        var other = noa.ents.getPositionData(state.entity)
        if (!other) {
            return noa.ents.removeComponent(id, noa.ents.names.followsEntity)
        }
        vec3.add(self._renderPosition, other._renderPosition, state.offset)
    }

}
