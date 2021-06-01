/**
 * `noa.camera` - manages the camera, its position and direction,
 * mouse sensitivity, and so on.
 *
 * This module uses the following default options (from the options
 * object passed to the [[Engine]]):
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
    /** Horizontal mouse sensitivity. Same scale as Overwatch (typical values around `5..10`)
     * @prop sensitivityX
    */
    /** Vertical mouse sensitivity. Same scale as Overwatch (typical values around `5..10`)
     * @prop sensitivityY
    */
    /** Mouse look inverse (horizontal)
     * @prop inverseX
    */
    /** Mouse look inverse (vertical)
     * @prop inverseY
    */
    /**
     * Camera yaw angle.
     * Returns the camera's rotation angle around the vertical axis.
     * Range: `0..2π`
     * This value is writeable, but it's managed by the engine and
     * will be overwritten each frame.
     * @prop heading
    */
    /** Camera pitch angle.
     * Returns the camera's up/down rotation angle. The pitch angle is
     * clamped by a small epsilon, such that the camera never quite
     * points perfectly up or down.
     * Range: `-π/2..π/2`.
     * This value is writeable, but it's managed by the engine and
     * will be overwritten each frame.
     * @prop pitch
    */
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
     * @prop cameraTarget
    */
    /** How far back the camera should be from the player's eye position
     * @prop zoomDistance
     */
    /** How quickly the camera moves to its `zoomDistance` (0..1)
     * @prop zoomSpeed
     */
    /** Current actual zoom distance. This differs from `zoomDistance` when
     * the camera is in the process of moving towards the desired distance,
     * or when it's obstructed by solid terrain behind the player.
     * @readonly
     * @prop currentZoom
    */
    /** @internal @prop _currentZoom */
    /** @internal @prop _dirVector */
    /**
     * @internal
     * @type {import('../index').Engine}
     * @prop noa
    */
    /** @internal */
    constructor(noa: any, opts: any);
    noa: any;
    sensitivityX: number;
    sensitivityY: number;
    inverseX: boolean;
    inverseY: boolean;
    heading: number;
    pitch: number;
    zoomDistance: any;
    zoomSpeed: any;
    cameraTarget: any;
    currentZoom: any;
    _currentZoom: any;
    _dirVector: any;
    /** @internal */
    _localGetTargetPosition(): any;
    /** @internal */
    _localGetPosition(): any;
    /**
     * Returns the camera's current target position - i.e. the player's
     * eye position. When the camera is zoomed all the way in,
     * this returns the same location as `camera.getPosition()`.
    */
    getTargetPosition(): any;
    /**
     * Returns the current camera position (read only)
    */
    getPosition(): any;
    /**
     * Returns the camera direction vector (read only)
    */
    getDirection(): any;
    /**
     * Called before render, if mouseLock etc. is applicable.
     * Consumes input mouse events x/y, updates camera angle and zoom
     * @internal
    */
    applyInputsToCamera(): void;
    /**
     *  Called before all renders, pre- and post- entity render systems
     * @internal
    */
    updateBeforeEntityRenderSystems(): void;
    /** @internal */
    updateAfterEntityRenderSystems(): void;
}
