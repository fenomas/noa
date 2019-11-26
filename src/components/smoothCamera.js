

export default function (noa) {
    return {

        name: 'smooth-camera',

        order: 99,

        state: {
            time: 100.1
        },

        onAdd: null,

        onRemove: null,

        system: function (dt, states) {
            // remove self after time elapses
            states.forEach(state => {
                state.time -= dt
                if (state.time < 0) noa.ents.removeComponent(state.__id, 'smooth-camera')
            })
        },

    }
}
