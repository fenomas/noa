'use strict'

var vec3 = require('gl-vec3')


/*
 * Indicates that an entity should be moved to another entity's position each tick,
 * possibly by a fixed offset, and the same for renderPositions each render
 */

module.exports = function (noa) {

    return {

        name: 'followsEntity',

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
            states.forEach(state => {
                updatePosition(state)
            })
        },


        // on render, copy over render positions
        renderSystem: function followEntityMesh(dt, states) {
            states.forEach(state => {
                updateRenderPosition(state)
            })
        }
    }



    function updatePosition(state) {
        var id = state.__id
        var self = noa.ents.getPositionData(id)
        var other = noa.ents.getPositionData(state.entity)
        if (other) {
            vec3.add(self.position, other.position, state.offset)
            self._extentsChanged = true
        } else {
            noa.ents.removeComponent(id, noa.ents.names.followsEntity)
        }
    }

    function updateRenderPosition(state) {
        var id = state.__id
        var self = noa.ents.getPositionData(id)
        var other = noa.ents.getPositionData(state.entity)
        if (other) {
            vec3.add(self.renderPosition, other.renderPosition, state.offset)
        } else {
            noa.ents.removeComponent(id, noa.ents.names.followsEntity)
        }
    }

}
