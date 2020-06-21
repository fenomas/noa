/**
 * @class
 * @typicalname noa.camera
 * @classdesc Manages the camera, exposes camera position, direction, mouse sensitivity.
 */
export declare class Camera {
    /**
     * @class
     * @typicalname noa.camera
     * @classdesc Manages the camera, exposes camera position, direction, mouse sensitivity.
     */
    constructor(noa: any, opts: any);
    noa: any;
    /** Horizontal mouse sensitivity.
     * Same scale as Overwatch (typical values around `5..10`)
     */
    sensitivityx: number;
    /** Vertical mouse sensitivity.
     * Same scale as Overwatch (typical values around `5..10`)
     */
    sensitivityy: number;
    /** Mouse look inverse (horizontal) */
    inversex: number;
    /** Mouse look inverse (vertical) */
    inversey: number;
    /** Camera yaw angle (read only)
     *
     * Returns the camera's rotation angle around the vertical axis. Range: `0..2π`
     */
    heading: number;
    /** Camera pitch angle (read only)
     *
     * Returns the camera's up/down rotation angle. Range: `-π/2..π/2`.
     * (The pitch angle is clamped by a small epsilon, such that
     * the camera never quite points perfectly up or down.
     */
    pitch: number;
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
    cameraTarget: any;
    /** How far back the camera is zoomed from the camera target */
    zoomDistance: any;
    /** How quickly the camera moves to its `zoomDistance` (0..1) */
    zoomSpeed: any;
    /** Current actual zoom distance. This differs from `zoomDistance` when
     * the camera is in the process of moving towards the desired distance,
     * or when it's obstructed by solid terrain behind the player. */
    currentZoom: any;
    _dirVector: any;
    _localGetTargetPosition(): any;
    _localGetPosition(): any;
    getTargetPosition(): any;
    getPosition(): any;
    getDirection(): any;
    applyInputsToCamera(): void;
    updateBeforeEntityRenderSystems(): void;
    updateAfterEntityRenderSystems(): void;
}
export {};
