
/**
 * Component for the player entity, when active hides the player's mesh 
 * when camera zoom is less than a certain amount
 */

export default function (noa) {
    return {

        name: 'fadeOnZoom',

        order: 99,

        state: {
            cutoff: 1.5,
            _showing: null,
        },

        onAdd: null,

        onRemove: null,

        system: function fadeOnZoomProc(dt, states) {
            var zoom = noa.camera.currentZoom
            var ents = noa.entities
            for (var i = 0; i < states.length; i++) {
                var state = states[i]
                checkZoom(state, zoom, ents)
            }
        }
    }
}


function checkZoom(state, zoom, ents) {
    if (!ents.hasMesh(state.__id)) return

    var shouldShow = (zoom > state.cutoff)
    if (state._showing !== shouldShow) {
        ents.getMeshData(state.__id).mesh.visibility = shouldShow
        state._showing = shouldShow
    }
}
