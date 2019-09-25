'use strict'


export default function (noa) {
    return {

        name: 'collideTerrain',

        order: 0,

        state: {
            callback: null
        },

        onAdd: function (eid, state) {
            // add collide handler for physics engine to call
            var ents = noa.entities
            if (ents.hasPhysics(eid)) {
                var body = ents.getPhysicsBody(eid)
                body.onCollide = function bodyOnCollide(impulse) {
                    var cb = noa.ents.getCollideTerrain(eid).callback
                    if (cb) cb(impulse, eid)
                }
            }
        },

        onRemove: function (eid, state) {
            var ents = noa.entities
            if (ents.hasPhysics(eid)) {
                ents.getPhysicsBody(eid).onCollide = null
            }
        },



    }
}
