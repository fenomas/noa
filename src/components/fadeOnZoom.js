
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
        },

        onAdd: null,

        onRemove: null,

        system: function fadeOnZoomProc(dt, states) {
            var zoom = noa.camera.currentZoom
            for (var i = 0; i < states.length; i++) {
                checkZoom(states[i], zoom, noa)
            }
        }
    }
}


function checkZoom(state, zoom, noa) {
    if (!noa.ents.hasMesh(state.__id)) return
    var mesh = noa.ents.getMeshData(state.__id).mesh
    if (!mesh.metadata) return
    var shouldHide = (zoom < state.cutoff)
    noa.rendering.setMeshVisibility(mesh, !shouldHide)
}
