
var vec3 = require('gl-vec3')
var aabb = require('aabb-3d')
var sweep = require('voxel-aabb-sweep')


export default function (noa, opts) {
    return new Camera(noa, opts)
}




var defaults = {
    inverseX: false,
    inverseY: false,
    sensitivityX: 10,
    sensitivityY: 10,
    initialZoom: 0,
    zoomSpeed: 0.2,
}


/** 
 * @class
 * @typicalname noa.camera
 * @classdesc Manages the camera, exposes camera position, direction, mouse sensitivity.
 */


function Camera(noa, opts) {
    this.noa = noa

    /**
     * `noa.camera` uses the following options (from the root `noa(opts)` options):
     * ```js
     * {
     *   inverseX: false,
     *   inverseY: false,
     *   sensitivityX: 15,
     *   sensitivityY: 15,
     *   initialZoom: 0,
     *   zoomSpeed: 0.2,
     * }
     * ```
     */
    opts = Object.assign({}, defaults, opts)

    /** Horizontal mouse sensitivity. 
     * Same scale as Overwatch (typical values around `5..10`)
     */
    this.sensitivityX = opts.sensitivityX

    /** Vertical mouse sensitivity.
     * Same scale as Overwatch (typical values around `5..10`)
     */
    this.sensitivityY = opts.sensitivityY

    /** Mouse look inverse (horizontal) */
    this.inverseX = opts.inverseX

    /** Mouse look inverse (vertical) */
    this.inverseY = opts.inverseY


    /** Camera yaw angle (read only) 
     * 
     * Returns the camera's rotation angle around the vertical axis. Range: `0..2π`
     */
    this.heading = 0

    /** Camera pitch angle (read only)
     * 
     * Returns the camera's up/down rotation angle. Range: `-π/2..π/2`. 
     * (The pitch angle is clamped by a small epsilon, such that 
     * the camera never quite points perfectly up or down.
     */
    this.pitch = 0


    /** Entity ID of a special entity that exists for the camera to point at.
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

    // follow component and default offset
    var eyeOffset = 0.9 * noa.ents.getPositionData(noa.playerEntity).height
    noa.ents.addComponent(this.cameraTarget, 'followsEntity', {
        entity: noa.playerEntity,
        offset: [0, eyeOffset, 0],
    })

    /** How far back the camera is zoomed from the camera target */
    this.zoomDistance = opts.initialZoom

    /** How quickly the camera moves to its `zoomDistance` (0..1) */
    this.zoomSpeed = opts.zoomSpeed

    /** Current actual zoom distance. This differs from `zoomDistance` when
     * the camera is in the process of moving towards the desired distance, 
     * or when it's obstructed by solid terrain behind the player. */
    this.currentZoom = opts.initialZoom

    // internals
    this._dirVector = vec3.fromValues(0, 1, 0)
}


/*
 * 
 *  Local position functions for high precision
 * 
 */
Camera.prototype._localGetTargetPosition = function () {
    var pdat = this.noa.ents.getPositionData(this.cameraTarget)
    return vec3.copy(_camPos, pdat._renderPosition)
}

Camera.prototype._localGetPosition = function () {
    var loc = this._localGetTargetPosition()
    if (this.currentZoom === 0) return loc
    return vec3.scaleAndAdd(loc, loc, this._dirVector, -this.currentZoom)
}
var _camPos = vec3.create()




/**
 * Camera target position (read only)
 * 
 * This returns the point the camera looks at - i.e. the player's 
 * eye position. When the camera is zoomed 
 * all the way in, this is equivalent to `camera.getPosition()`.
 */
Camera.prototype.getTargetPosition = function () {
    var loc = this._localGetTargetPosition()
    return this.noa.localToGlobal(loc, globalCamPos)
}
var globalCamPos = []

/**
 * Returns the current camera position (read only)
 */
Camera.prototype.getPosition = function () {
    var loc = this._localGetPosition()
    return this.noa.localToGlobal(loc, globalCamPos)
}



/**
 * Returns the camera direction vector (read only)
 */
Camera.prototype.getDirection = function () {
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


/*
 *  Called before render, if mouseLock etc. is applicable.
 *  Consumes input mouse events x/y, updates camera angle and zoom
 */

Camera.prototype.applyInputsToCamera = function () {
    // dx/dy from input state
    var state = this.noa.inputs.state
    console.debug(state.dx, state.dy)
    bugFix(state) // TODO: REMOVE EVENTUALLY
    bugFix2(state)

    // convert to rads, using (sens * 0.0066 deg/pixel), like Overwatch
    var conv = 0.0066 * Math.PI / 180
    var dy = state.dy * this.sensitivityY * conv
    var dx = state.dx * this.sensitivityX * conv
    if (this.inverseY) dy = -dy
    if (this.inverseX) dx = -dx

    // normalize/clamp angles, update direction vector
    var twopi = 2 * Math.PI
    this.heading += (dx < 0) ? dx + twopi : dx
    if (this.heading > twopi) this.heading -= twopi
    var maxPitch = Math.PI / 2 - 0.001
    this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch + dy))

    vec3.set(this._dirVector, 0, 0, 1)
    vec3.rotateX(this._dirVector, this._dirVector, origin, this.pitch)
    vec3.rotateY(this._dirVector, this._dirVector, origin, this.heading)
}
var origin = vec3.create()



/*
 *  Called before all renders, pre- and post- entity render systems
 */

Camera.prototype.updateBeforeEntityRenderSystems = function () {
    // zoom update
    this.currentZoom += (this.zoomDistance - this.currentZoom) * this.zoomSpeed
}

Camera.prototype.updateAfterEntityRenderSystems = function () {
    // clamp camera zoom not to clip into solid terrain
    var maxZoom = cameraObstructionDistance(this)
    if (this.currentZoom > maxZoom) this.currentZoom = maxZoom
}






/*
 *  check for obstructions behind camera by sweeping back an AABB
 */

function cameraObstructionDistance(self) {
    if (!_camBox) {
        var off = self.noa.worldOriginOffset
        _camBox = new aabb([0, 0, 0], vec3.clone(_camBoxVec))
        _getVoxel = (x, y, z) => self.noa.world.getBlockSolidity(x + off[0], y + off[1], z + off[2])
        vec3.scale(_camBoxVec, _camBoxVec, -0.5)
    }
    _camBox.setPosition(self._localGetTargetPosition())
    _camBox.translate(_camBoxVec)
    var dist = Math.max(self.zoomDistance, self.currentZoom) + 0.1
    vec3.scale(_sweepVec, self.getDirection(), -dist)
    return sweep(_getVoxel, _camBox, _sweepVec, _hitFn, true)
}

var _camBoxVec = vec3.fromValues(0.2, 0.2, 0.2)
var _sweepVec = vec3.create()
var _camBox
var _getVoxel
var _hitFn = () => true






// workaround for this Chrome 63 + Win10 bug
// https://bugs.chromium.org/p/chromium/issues/detail?id=781182
function bugFix(state) {
    var dx = state.dx
    var dy = state.dy
    var wval = document.body.clientWidth / 6
    var hval = document.body.clientHeight / 6
    var badx = (Math.abs(dx) > wval && (dx / oldlastx) < -1)
    var bady = (Math.abs(dy) > hval && (dy / oldlasty) < -1)
    if (badx || bady) {
        state.dx = oldlastx
        state.dy = oldlasty
        oldlastx = (dx > 0) ? 1 : -1
        oldlasty = (dy > 0) ? 1 : -1
    } else {
        if (dx) oldlastx = dx
        if (dy) oldlasty = dy
    }
}

var oldlastx = 0
var oldlasty = 0


// my bugfix2, replacing with andy's
// function bugFix2(state) {
//     const newDx = state.dx
//     if (newDx > lx && lx > 0 && newDx-lx > 150) {
//         state.dx = lx
//     }
//     else if (newDx < lx && lx < 0 && newDx-lx < -150) {
//         state.dx = lx
//     }
//     lx = newDx
// }

// let lx = 0


// later updated to also address: https://github.com/andyhall/noa/issues/153
function bugFix2(state) {
    var dx = state.dx
    var dy = state.dy
    var badx = (Math.abs(dx) > 400 && Math.abs(dx / lastx) > 4)
    var bady = (Math.abs(dy) > 400 && Math.abs(dy / lasty) > 4)
    if (badx || bady) {
        state.dx = lastx
        state.dy = lasty
        lastx = (lastx + dx) / 2
        lasty = (lasty + dy) / 2
    } else {
        lastx = dx || 1
        lasty = dy || 1
    }
}

var lastx = 0
var lasty = 0
