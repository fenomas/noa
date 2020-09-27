import Engine from ".."

import vec3 from 'gl-vec3'
import aabb from 'aabb-3d'
import sweep from 'voxel-aabb-sweep'

export interface ICameraOptions {
    /**
     * @default false
     */
    inverseX: boolean;

    /**
     * @default false
     */
    inverseY: boolean;

    /**
     * @default 10
     */
    sensitivityX: number;

    /**
     * @default 10
     */
    sensitivityY: number;

    /**
     * @default 0
     */
    initialZoom: number;

    /**
     * @default 0.2
     */
    zoomSpeed: number;
}

const cameraDefaults: ICameraOptions = {
    inverseX: false,
    inverseY: false,
    sensitivityX: 10,
    sensitivityY: 10,
    initialZoom: 0,
    zoomSpeed: 0.2,
}


/**
 * @typicalname noa.camera
 * @description Manages the camera, exposes camera position, direction, mouse sensitivity.
 */
export class Camera {
    constructor(noa: Engine, options: Partial<ICameraOptions>) {
        const optionsWithDefaults = {
            ...cameraDefaults,
            ...options
        }

        this.noa = noa
    
        this.sensitivityX = optionsWithDefaults.sensitivityX
        this.sensitivityY = optionsWithDefaults.sensitivityY
        this.inverseX = optionsWithDefaults.inverseX
        this.inverseY = optionsWithDefaults.inverseY
        
        this.heading = 0
        this.pitch = 0
    
        this.cameraTarget = this.noa.ents.createEntity(['position'])
    
        // follow component and default offset
        var eyeOffset = 0.9 * noa.ents.getPositionData(noa.playerEntity).height
        noa.ents.addComponent(this.cameraTarget, 'followsEntity', {
            entity: noa.playerEntity,
            offset: [0, eyeOffset, 0],
        })
    
        this.zoomDistance = optionsWithDefaults.initialZoom
        this.zoomSpeed = optionsWithDefaults.zoomSpeed
        this.currentZoom = optionsWithDefaults.initialZoom
    
        // internals
        this._dirVector = vec3.fromValues(0, 1, 0)
    }

    noa: Engine;

    _dirVector: number[];

    /**
     * Current actual zoom distance. This differs from `zoomDistance` when
     * the camera is in the process of moving towards the desired distance, 
     * or when it's obstructed by solid terrain behind the player.
     */
    currentZoom: number;

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
    cameraTarget: any;

    /** How quickly the camera moves to its `zoomDistance` (0..1) */
    zoomSpeed: number;

    /** How far back the camera is zoomed from the camera target */
    zoomDistance: number;
    
    /**
     * Horizontal mouse sensitivity. 
     * Same scale as Overwatch (typical values around `5..10`)
     */
    sensitivityX: number;

    /**
     * Vertical mouse sensitivity.
     * Same scale as Overwatch (typical values around `5..10`)
     */
    sensitivityY: number;

    /** Mouse look inverse (horizontal) */
    inverseX: boolean;

    /** Mouse look inverse (vertical) */
    inverseY: boolean;


    /**
     * Camera yaw angle (read only) 
     * Returns the camera's rotation angle around the vertical axis. Range: `0..2π`
     * 
     * @default 0
     */
    heading: number = 0;

    /**
     * Camera pitch angle (read only)
     * 
     * Returns the camera's up/down rotation angle. Range: `-π/2..π/2`. 
     * (The pitch angle is clamped by a small epsilon, such that 
     * the camera never quite points perfectly up or down.
     * 
     * @default 0
     */
    pitch: number = 0

    /**
     * Local position functions for high precision
     */
    _localGetTargetPosition = () => {
        var pdat = this.noa.ents.getPositionData(this.cameraTarget)
        return vec3.copy(_camPos, pdat._renderPosition)
    }
    
    _localGetPosition = () => {
        var loc = this._localGetTargetPosition()
        if (this.currentZoom === 0) return loc
        return vec3.scaleAndAdd(loc, loc, this._dirVector, -this.currentZoom)
    }

    /**
     * Camera target position (read only)
     * 
     * This returns the point the camera looks at - i.e. the player's 
     * eye position. When the camera is zoomed 
     * all the way in, this is equivalent to `camera.getPosition()`.
     */
    getTargetPosition = () => {
        var loc = this._localGetTargetPosition()
        return this.noa.localToGlobal(loc, globalCamPos)
    }

    /**
     * Returns the current camera position (read only)
     */
    getPosition = () => {
        var loc = this._localGetPosition()
        return this.noa.localToGlobal(loc, globalCamPos)
    }

    /**
     * Returns the camera direction vector (read only)
     */
    getDirection = () => {
        return this._dirVector
    }

    /**
     * Called before render, if mouseLock etc. is applicable.
     * Consumes input mouse events x/y, updates camera angle and zoom
     */
    applyInputsToCamera = () => {
        // dx/dy from input state
        var state = this.noa.inputs.state
        bugFix(state) // TODO: REMOVE EVENTUALLY    
    
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

    /**
     * Called before all renders, pre- and post- entity render systems
     */
    updateBeforeEntityRenderSystems = () => {
        // zoom update
        this.currentZoom += (this.zoomDistance - this.currentZoom) * this.zoomSpeed
    }
    
    updateAfterEntityRenderSystems = () => {
        // clamp camera zoom not to clip into solid terrain
        var maxZoom = cameraObstructionDistance(this)
        if (this.currentZoom > maxZoom) this.currentZoom = maxZoom
    }
}

var _camPos = vec3.create()
var globalCamPos: any[] = []
var origin = vec3.create()

var _camBoxVec = vec3.fromValues(0.2, 0.2, 0.2)
var _sweepVec = vec3.create()
var _camBox: any
var _getVoxel: any
var _hitFn = () => true


/**
 * check for obstructions behind camera by sweeping back an AABB
 */
function cameraObstructionDistance(self: Camera) {
    if (!_camBox) {
        var off = self.noa.worldOriginOffset
        _camBox = new aabb([0, 0, 0], vec3.clone(_camBoxVec))
        _getVoxel = (x: number, y: number, z: number) => self.noa.world.getBlockSolidity(x + off[0], y + off[1], z + off[2])
        vec3.scale(_camBoxVec, _camBoxVec, -0.5)
    }
    _camBox.setPosition(self._localGetTargetPosition())
    _camBox.translate(_camBoxVec)
    var dist = Math.max(self.zoomDistance, self.currentZoom) + 0.1
    vec3.scale(_sweepVec, self.getDirection(), -dist)
    return sweep(_getVoxel, _camBox, _sweepVec, _hitFn, true)
}

/**
 * workaround for this Chrome 63 + Win10 bug
 * https://bugs.chromium.org/p/chromium/issues/detail?id=781182
 */
function bugFix(state: any) {
    var dx = state.dx
    var dy = state.dy
    var wval = document.body.clientWidth / 6
    var hval = document.body.clientHeight / 6
    var badx = (Math.abs(dx) > wval && (dx / lastx) < -1)
    var bady = (Math.abs(dy) > hval && (dy / lasty) < -1)
    if (badx || bady) {
        state.dx = lastx
        state.dy = lasty
        lastx = (dx > 0) ? 1 : -1
        lasty = (dy > 0) ? 1 : -1
    } else {
        if (dx) lastx = dx
        if (dy) lasty = dy
    }
}

var lastx = 0
var lasty = 0
