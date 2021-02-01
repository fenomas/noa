// import vec3 from 'gl-vec3'
const vec3 = require('gl-vec3')

/**
 * 
 * Movement component. State stores settings like jump height, etc.,
 * as well as current state (running, jumping, heading angle).
 * Processor checks state and applies movement/friction/jump forces
 * to the entity's physics body. 
 * 
 */

exports.default = function (noa) {
    return {

        name: 'movement',

        order: 30,

        state: {
            // current state
            heading: 0, // radians

            moving: false, // whether player is moving at all

            running: false,
            crouching: false,

            jumping: false,
            // fb: 0,
            // rl: 0,
            // camHeading: 0,

            // options:
            maxSpeed: 4,
            moveForce: 50,
            responsiveness: 10,
            movingFriction: 0,
            standingFriction: 5,

            airMoveMult: 0.5,
            jumpForce: 0,
            jumpTime: 500, // ms

            // internal state
            _jumpCount: 0,
            _isJumping: 0,
            _currjumptime: 0,
        },

        onAdd: null,

        onRemove: null,


        system: function movementProcessor(dt, states) {
            var ents = noa.entities

            states.forEach(state => {
                var body = ents.getPhysicsBody(state.__id)
                applyMovementPhysics(noa, dt, state, body)
            })

        }


    }
}


var tempvec = vec3.create()
var tempvec2 = vec3.create()
var zeroVec = vec3.create()


function applyMovementPhysics(noa, dt, state, body) {
    // move implementation originally written as external module
    //   see https://github.com/andyhall/voxel-fps-controller
    //   for original code


    // jumping
    var onGround = (body.atRestY() < 0)
    var canjump = (onGround || state._jumpCount < noa.serverSettings.airJumpCount)
    if (onGround) {
        state._isJumping = false
        state._jumpCount = 0
    }

    const speedMultiplier = noa.serverSettings.speedMultiplier
    if (state.crouching) {
        state.maxSpeed = noa.serverSettings.crouchingSpeed*speedMultiplier
    }
    else if (state.running) {
        state.maxSpeed = noa.serverSettings.runningSpeed*speedMultiplier
    }
    else {
        // just walking
        state.maxSpeed = noa.serverSettings.walkingSpeed*speedMultiplier
    }

    // process jump input
    if (state.jumping) {
        if (state._isJumping) { // continue previous jump
            if (state._currjumptime > 0) {
                var jf = state.jumpForce
                if (state._currjumptime < dt) { jf *= state._currjumptime / dt; }
                body.applyForce([0, jf, 0])
                state._currjumptime -= dt
            }
        } else if (canjump) { // start new jump
            state._isJumping = true
            if (!onGround) state._jumpCount++
            state._currjumptime = state.jumpTime
            body.applyImpulse([0, noa.serverSettings.jumpAmount, 0])
            // clear downward velocity on airjump
            if (!onGround && body.velocity[1] < 0) body.velocity[1] = 0
        }
    } else {
        state._isJumping = false
    }

    // apply movement forces if entity is moving, otherwise just friction
    var m = tempvec
    var push = tempvec2
    if (state.moving) {

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
        body.friction = state.movingFriction
    } else {
        body.friction = state.standingFriction
    }



}
