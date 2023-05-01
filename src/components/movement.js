
import vec3 from 'gl-vec3'





/** 
 * 
 * State object of the `movement` component
 * 
*/
export function MovementState() {
    this.heading = 0 // radians
    this.running = false
    this.jumping = false

    // options
    this.maxSpeed = 10
    this.moveForce = 30
    this.responsiveness = 15
    this.runningFriction = 0
    this.standingFriction = 2

    // jumps
    this.airMoveMult = 0.5
    this.jumpImpulse = 10
    this.jumpForce = 12
    this.jumpTime = 500 // ms
    this.airJumps = 1

    // internal state
    this._jumpCount = 0
    this._currjumptime = 0
    this._isJumping = false
}





/**
 * Movement component. State stores settings like jump height, etc.,
 * as well as current state (running, jumping, heading angle).
 * Processor checks state and applies movement/friction/jump forces
 * to the entity's physics body. 
 * @param {import('..').Engine} noa
*/

export default function (noa) {
    return {

        name: 'movement',

        order: 30,

        state: new MovementState(),

        onAdd: null,

        onRemove: null,


        system: function movementProcessor(dt, states) {
            var ents = noa.entities
            for (var i = 0; i < states.length; i++) {
                var state = states[i]
                var phys = ents.getPhysics(state.__id)
                if (phys) applyMovementPhysics(dt, state, phys.body)
            }
        }


    }
}


var tempvec = vec3.create()
var tempvec2 = vec3.create()
var zeroVec = vec3.create()


/**
 * @param {number} dt 
 * @param {MovementState} state 
 * @param {*} body 
*/

function applyMovementPhysics(dt, state, body) {
    // move implementation originally written as external module
    //   see https://github.com/fenomas/voxel-fps-controller
    //   for original code

    // jumping
    var onGround = (body.atRestY() < 0)
    var canjump = (onGround || state._jumpCount < state.airJumps)
    if (onGround) {
        state._isJumping = false
        state._jumpCount = 0
    }

    // process jump input
    if (state.jumping) {
        if (state._isJumping) { // continue previous jump
            if (state._currjumptime > 0) {
                var jf = state.jumpForce
                if (state._currjumptime < dt) jf *= state._currjumptime / dt
                body.applyForce([0, jf, 0])
                state._currjumptime -= dt
            }
        } else if (canjump) { // start new jump
            state._isJumping = true
            if (!onGround) state._jumpCount++
            state._currjumptime = state.jumpTime
            body.applyImpulse([0, state.jumpImpulse, 0])
            // clear downward velocity on airjump
            if (!onGround && body.velocity[1] < 0) body.velocity[1] = 0
        }
    } else {
        state._isJumping = false
    }

    // apply movement forces if entity is moving, otherwise just friction
    var m = tempvec
    var push = tempvec2
    if (state.running) {

        var speed = state.maxSpeed
        // todo: add crouch/sprint modifiers if needed
        // if (state.sprint) speed *= state.sprintMoveMult
        // if (state.crouch) speed *= state.crouchMoveMult
        vec3.set(m, 0, 0, speed)

        // rotate move vector to entity's heading
        vec3.rotateY(m, m, zeroVec, state.heading)

        // push vector to achieve desired speed & dir
        // following code to adjust 2D velocity to desired amount is patterned on Quake: 
        // https://github.com/id-Software/Quake-III-Arena/blob/master/code/game/bg_pmove.c#L275
        vec3.subtract(push, m, body.velocity)
        push[1] = 0
        var pushLen = vec3.length(push)
        vec3.normalize(push, push)

        if (pushLen > 0) {
            // pushing force vector
            var canPush = state.moveForce
            if (!onGround) canPush *= state.airMoveMult

            // apply final force
            var pushAmt = state.responsiveness * pushLen
            if (canPush > pushAmt) canPush = pushAmt

            vec3.scale(push, push, canPush)
            body.applyForce(push)
        }

        // different friction when not moving
        // idea from Sonic: http://info.sonicretro.org/SPG:Running
        body.friction = state.runningFriction
    } else {
        body.friction = state.standingFriction
    }
}
