
import vec3 from 'gl-vec3'
import aabb from 'aabb-3d'
import sweep from 'voxel-aabb-sweep'



// default options
function CameraDefaults() {
    this.inverseX = false
    this.inverseY = false
    this.sensitivityMult = 1
    this.sensitivityMultOutsidePointerlock = 0
    this.sensitivityX = 10
    this.sensitivityY = 10
    this.initialZoom = 0
    this.zoomSpeed = 0.2
}


// locals
var tempVectors = [
    vec3.create(),
    vec3.create(),
    vec3.create(),
]
var originVector = vec3.create()


/**
 * `noa.camera` - manages the camera, its position and direction, 
 * mouse sensitivity, and so on.
 * 
 * This module uses the following default options (from the options
 * object passed to the {@link Engine}):
 * ```js
 * var defaults = {
 *     inverseX: false,
 *     inverseY: false,
 *     sensitivityX: 10,
 *     sensitivityY: 10,
 *     initialZoom: 0,
 *     zoomSpeed: 0.2,
 * }
 * ```
*/

export class Camera {

    /** 
     * @internal 
     * @param {import('../index').Engine} noa
     * @param {Partial.<CameraDefaults>} opts
    */
    constructor(noa, opts) {
        opts = Object.assign({}, new CameraDefaults, opts)
        this.noa = noa

        /** Horizontal mouse sensitivity. Same scale as Overwatch (typical values around `5..10`) */
        this.sensitivityX = +opts.sensitivityX

        /** Vertical mouse sensitivity. Same scale as Overwatch (typical values around `5..10`) */
        this.sensitivityY = +opts.sensitivityY

        /** Mouse look inverse (horizontal) */
        this.inverseX = !!opts.inverseX

        /** Mouse look inverse (vertical) */
        this.inverseY = !!opts.inverseY

        /** 
         * Multiplier for temporarily altering mouse sensitivity.
         * Set this to `0` to temporarily disable camera controls.
        */
        this.sensitivityMult = opts.sensitivityMult

        /** 
         * Multiplier for altering mouse sensitivity when pointerlock
         * is not active - default of `0` means no camera movement.
         * Note this setting is ignored if pointerLock isn't supported.
         */
        this.sensitivityMultOutsidePointerlock = opts.sensitivityMultOutsidePointerlock

        /** 
         * Camera yaw angle. 
         * Returns the camera's rotation angle around the vertical axis. 
         * Range: `0..2π`  
         * This value is writeable, but it's managed by the engine and 
         * will be overwritten each frame.
        */
        this.heading = 0

        /** Camera pitch angle. 
         * Returns the camera's up/down rotation angle. The pitch angle is 
         * clamped by a small epsilon, such that the camera never quite 
         * points perfectly up or down.  
         * Range: `-π/2..π/2`.  
         * This value is writeable, but it's managed by the engine and 
         * will be overwritten each frame.
        */
        this.pitch = 0

        /** 
         * Entity ID of a special entity that exists for the camera to point at.
         * 
         * By default this entity follows the player entity, so you can 
         * change the player's eye height by changing the `follow` component's offset:
         * ```js
         * var followState = noa.ents.getState(noa.camera.cameraTarget, 'followsEntity')
         * followState.offset[1] = 0.9 * myPlayerHeight
         * ```
         * 
         * For customized camera controls you can change the follow 
         * target to some other entity, or override the behavior entirely:
         * ```js
         * // make cameraTarget stop following the player
         * noa.ents.removeComponent(noa.camera.cameraTarget, 'followsEntity')
         * // control cameraTarget position directly (or whatever..)
         * noa.ents.setPosition(noa.camera.cameraTarget, [x,y,z])
         * ```
        */
        this.cameraTarget = this.noa.ents.createEntity(['position'])

        // make the camera follow the cameraTarget entity
        var eyeOffset = 0.9 * noa.ents.getPositionData(noa.playerEntity).height
        noa.ents.addComponent(this.cameraTarget, 'followsEntity', {
            entity: noa.playerEntity,
            offset: [0, eyeOffset, 0],
        })

        /** How far back the camera should be from the player's eye position */
        this.zoomDistance = opts.initialZoom

        /** How quickly the camera moves to its `zoomDistance` (0..1) */
        this.zoomSpeed = opts.zoomSpeed

        /** Current actual zoom distance. This differs from `zoomDistance` when
         * the camera is in the process of moving towards the desired distance, 
         * or when it's obstructed by solid terrain behind the player.
         * This value will get overwritten each tick, but you may want to write to it
         * when overriding the camera zoom speed.
        */
        this.currentZoom = opts.initialZoom

        /** @internal */
        this._dirVector = vec3.fromValues(0, 0, 1)
    }




    /*
     * 
     * 
     *          API
     * 
     * 
    */


    /*
     *      Local position functions for high precision
    */
    /** @internal */
    _localGetTargetPosition() {
        var pdat = this.noa.ents.getPositionData(this.cameraTarget)
        var pos = tempVectors[0]
        return vec3.copy(pos, pdat._renderPosition)
    }
    /** @internal */
    _localGetPosition() {
        var loc = this._localGetTargetPosition()
        if (this.currentZoom === 0) return loc
        return vec3.scaleAndAdd(loc, loc, this._dirVector, -this.currentZoom)
    }



    /**
     * Returns the camera's current target position - i.e. the player's 
     * eye position. When the camera is zoomed all the way in, 
     * this returns the same location as `camera.getPosition()`.
    */
    getTargetPosition() {
        var loc = this._localGetTargetPosition()
        var globalCamPos = tempVectors[1]
        return this.noa.localToGlobal(loc, globalCamPos)
    }


    /**
     * Returns the current camera position (read only)
    */
    getPosition() {
        var loc = this._localGetPosition()
        var globalCamPos = tempVectors[2]
        return this.noa.localToGlobal(loc, globalCamPos)
    }


    /**
     * Returns the camera direction vector (read only)
    */
    getDirection() {
        return this._dirVector
    }




    /*
     * 
     * 
     * 
     *          internals below
     * 
     * 
     * 
    */



    /**
     * Called before render, if mouseLock etc. is applicable.
     * Applies current mouse x/y inputs to the camera angle and zoom
     * @internal
    */

    applyInputsToCamera() {

        // conditional changes to mouse sensitivity
        var senseMult = this.sensitivityMult
        if (this.noa.container.supportsPointerLock) {
            if (!this.noa.container.hasPointerLock) {
                senseMult *= this.sensitivityMultOutsidePointerlock
            }
        }
        if (senseMult === 0) return

        // dx/dy from input state
        var pointerState = this.noa.inputs.pointerState
        bugFix(pointerState) // TODO: REMOVE EVENTUALLY    

        // convert to rads, using (sens * 0.0066 deg/pixel), like Overwatch
        var conv = 0.0066 * Math.PI / 180
        var dx = pointerState.dx * this.sensitivityX * senseMult * conv
        var dy = pointerState.dy * this.sensitivityY * senseMult * conv
        if (this.inverseX) dx = -dx
        if (this.inverseY) dy = -dy

        // normalize/clamp angles, update direction vector
        var twopi = 2 * Math.PI
        this.heading += (dx < 0) ? dx + twopi : dx
        if (this.heading > twopi) this.heading -= twopi
        var maxPitch = Math.PI / 2 - 0.001
        this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch + dy))

        vec3.set(this._dirVector, 0, 0, 1)
        var dir = this._dirVector
        var origin = originVector
        vec3.rotateX(dir, dir, origin, this.pitch)
        vec3.rotateY(dir, dir, origin, this.heading)
    }



    /**
     *  Called before all renders, pre- and post- entity render systems
     * @internal
    */
    updateBeforeEntityRenderSystems() {
        // zoom update
        this.currentZoom += (this.zoomDistance - this.currentZoom) * this.zoomSpeed
    }

    /** @internal */
    updateAfterEntityRenderSystems() {
        // clamp camera zoom not to clip into solid terrain
        var maxZoom = cameraObstructionDistance(this)
        if (this.currentZoom > maxZoom) this.currentZoom = maxZoom
    }

}




/*
 *  check for obstructions behind camera by sweeping back an AABB
*/

function cameraObstructionDistance(self) {
    if (!self._sweepBox) {
        self._sweepBox = new aabb([0, 0, 0], [0.2, 0.2, 0.2])
        self._sweepGetVoxel = self.noa.world.getBlockSolidity.bind(self.noa.world)
        self._sweepVec = vec3.create()
        self._sweepHit = () => true
    }
    var pos = vec3.copy(self._sweepVec, self._localGetTargetPosition())
    vec3.add(pos, pos, self.noa.worldOriginOffset)
    for (var i = 0; i < 3; i++) pos[i] -= 0.1
    self._sweepBox.setPosition(pos)
    var dist = Math.max(self.zoomDistance, self.currentZoom) + 0.1
    vec3.scale(self._sweepVec, self.getDirection(), -dist)
    return sweep(self._sweepGetVoxel, self._sweepBox, self._sweepVec, self._sweepHit, true)
}






// workaround for this Chrome 63 + Win10 bug
// https://bugs.chromium.org/p/chromium/issues/detail?id=781182
// later updated to also address: https://github.com/fenomas/noa/issues/153
function bugFix(pointerState) {
    var dx = pointerState.dx
    var dy = pointerState.dy
    var badx = (Math.abs(dx) > 400 && Math.abs(dx / lastx) > 4)
    var bady = (Math.abs(dy) > 400 && Math.abs(dy / lasty) > 4)
    if (badx || bady) {
        pointerState.dx = lastx
        pointerState.dy = lasty
        lastx = (lastx + dx) / 2
        lasty = (lasty + dy) / 2
    } else {
        lastx = dx || 1
        lasty = dy || 1
    }
}

var lastx = 0
var lasty = 0
