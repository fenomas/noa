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
    constructor(noa: import('../index').Engine, opts: Partial<CameraDefaults>);
    noa: import("../index").Engine;
    /** Horizontal mouse sensitivity. Same scale as Overwatch (typical values around `5..10`) */
    sensitivityX: number;
    /** Vertical mouse sensitivity. Same scale as Overwatch (typical values around `5..10`) */
    sensitivityY: number;
    /** Mouse look inverse (horizontal) */
    inverseX: boolean;
    /** Mouse look inverse (vertical) */
    inverseY: boolean;
    /**
     * Multiplier for temporarily altering mouse sensitivity.
     * Set this to `0` to temporarily disable camera controls.
    */
    sensitivityMult: number;
    /**
     * Multiplier for altering mouse sensitivity when pointerlock
     * is not active - default of `0` means no camera movement.
     * Note this setting is ignored if pointerLock isn't supported.
     */
    sensitivityMultOutsidePointerlock: number;
    /**
     * Camera yaw angle.
     * Returns the camera's rotation angle around the vertical axis.
     * Range: `0..2π`
     * This value is writeable, but it's managed by the engine and
     * will be overwritten each frame.
    */
    heading: number;
    /** Camera pitch angle.
     * Returns the camera's up/down rotation angle. The pitch angle is
     * clamped by a small epsilon, such that the camera never quite
     * points perfectly up or down.
     * Range: `-π/2..π/2`.
     * This value is writeable, but it's managed by the engine and
     * will be overwritten each frame.
    */
    pitch: number;
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
    cameraTarget: number;
    /** How far back the camera should be from the player's eye position */
    zoomDistance: number;
    /** How quickly the camera moves to its `zoomDistance` (0..1) */
    zoomSpeed: number;
    /** Current actual zoom distance. This differs from `zoomDistance` when
     * the camera is in the process of moving towards the desired distance,
     * or when it's obstructed by solid terrain behind the player.
     * This value will get overwritten each tick, but you may want to write to it
     * when overriding the camera zoom speed.
    */
    currentZoom: number;
    /** @internal */
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
     * Applies current mouse x/y inputs to the camera angle and zoom
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
declare function CameraDefaults(): void;
declare class CameraDefaults {
    inverseX: boolean;
    inverseY: boolean;
    sensitivityMult: number;
    sensitivityMultOutsidePointerlock: number;
    sensitivityX: number;
    sensitivityY: number;
    initialZoom: number;
    zoomSpeed: number;
}
export {};
