
/**
 * 
 * Input processing component - gets (key) input state and  
 * applies it to receiving entities by updating their movement 
 * component state (heading, movespeed, jumping, etc.)
 * 
 */

export default function (noa) {
    return {

        name: 'receivesInputs',

        order: 20,

        state: {},

        onAdd: null,

        onRemove: null,

        system: function inputProcessor(dt, states) {
            var ents = noa.entities
            var inputState = noa.inputs.state
            var camHeading = noa.camera.heading

            for (var i = 0; i < states.length; i++) {
                var state = states[i]
                var moveState = ents.getMovement(state.__id)
                setMovementState(moveState, inputState, camHeading)
            }
        }

    }
}



/**
 * @param {import('../components/movement').MovementState} state 
 * @param {Object<string, boolean>} inputs 
 * @param {number} camHeading 
*/

function setMovementState(state, inputs, camHeading) {
    state.jumping = !!inputs.jump

    var fb = inputs.forward ? (inputs.backward ? 0 : 1) : (inputs.backward ? -1 : 0)
    var rl = inputs.right ? (inputs.left ? 0 : 1) : (inputs.left ? -1 : 0)

    if ((fb | rl) === 0) {
        state.running = false
    } else {
        state.running = true
        if (fb) {
            if (fb == -1) camHeading += Math.PI
            if (rl) {
                camHeading += Math.PI / 4 * fb * rl // didn't plan this but it works!
            }
        } else {
            camHeading += rl * Math.PI / 2
        }
        state.heading = camHeading
    }

}
