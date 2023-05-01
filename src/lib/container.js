
import { EventEmitter } from 'events'
import { MicroGameShell } from 'micro-game-shell'





/**
 * `noa.container` - manages the game's HTML container element, canvas, 
 * fullscreen, pointerLock, and so on.
 * 
 * This module wraps `micro-game-shell`, which does most of the implementation.
 * 
 * **Events**
 *  + `DOMready => ()`  
 *    Relays the browser DOMready event, after noa does some initialization
 *  + `gainedPointerLock => ()`  
 *    Fires when the game container gains pointerlock.
 *  + `lostPointerLock => ()`  
 *    Fires when the game container loses pointerlock.
 */

export class Container extends EventEmitter {

    /** @internal */
    constructor(noa, opts) {
        super()
        opts = opts || {}

        /** 
         * @internal
         * @type {import('../index').Engine}
        */
        this.noa = noa

        /** The game's DOM element container */
        var domEl = opts.domElement || null
        if (typeof domEl === 'string') {
            domEl = document.querySelector(domEl)
        }
        this.element = domEl || createContainerDiv()

        /** The `canvas` element that the game will draw into */
        this.canvas = getOrCreateCanvas(this.element)
        doCanvasBugfix(noa, this.canvas) // grumble...


        /** Whether the browser supports pointerLock. @readonly */
        this.supportsPointerLock = false

        /** Whether the user's pointer is within the game area. @readonly */
        this.pointerInGame = false

        /** Whether the game is focused. @readonly */
        this.isFocused = !!document.hasFocus()

        /** Gets the current state of pointerLock. @readonly */
        this.hasPointerLock = false



        // shell manages tick/render rates, and pointerlock/fullscreen
        var pollTime = 10
        /** @internal */
        this._shell = new MicroGameShell(this.element, pollTime)
        this._shell.tickRate = opts.tickRate
        this._shell.maxRenderRate = opts.maxRenderRate
        this._shell.stickyPointerLock = opts.stickyPointerLock
        this._shell.stickyFullscreen = opts.stickyFullscreen
        this._shell.maxTickTime = 50



        // core timing events
        this._shell.onTick = noa.tick.bind(noa)
        this._shell.onRender = noa.render.bind(noa)

        // shell listeners
        this._shell.onPointerLockChanged = (hasPL) => {
            this.hasPointerLock = hasPL
            this.emit((hasPL) ? 'gainedPointerLock' : 'lostPointerLock')
            // this works around a Firefox bug where no mouse-in event 
            // gets issued after starting pointerlock
            if (hasPL) this.pointerInGame = true
        }

        // catch and relay domReady event
        this._shell.onInit = () => {
            this._shell.onResize = noa.rendering.resize.bind(noa.rendering)
            // listeners to track when game has focus / pointer
            detectPointerLock(this)
            this.element.addEventListener('mouseenter', () => { this.pointerInGame = true })
            this.element.addEventListener('mouseleave', () => { this.pointerInGame = false })
            window.addEventListener('focus', () => { this.isFocused = true })
            window.addEventListener('blur', () => { this.isFocused = false })
            // catch edge cases for initial states
            var onFirstMousedown = () => {
                this.pointerInGame = true
                this.isFocused = true
                this.element.removeEventListener('mousedown', onFirstMousedown)
            }
            this.element.addEventListener('mousedown', onFirstMousedown)
            // emit for engine core
            this.emit('DOMready')
            // done and remove listener
            this._shell.onInit = null
        }
    }


    /*
     *
     *
     *              PUBLIC API 
     *
     *
    */

    /** @internal */
    appendTo(htmlElement) {
        this.element.appendChild(htmlElement)
    }

    /** 
     * Sets whether `noa` should try to acquire or release pointerLock
    */
    setPointerLock(lock = false) {
        // not sure if this will work robustly
        this._shell.pointerLock = !!lock
    }
}



/*
 *
 *
 *              INTERNALS
 *
 *
*/


function createContainerDiv() {
    // based on github.com/mikolalysenko/game-shell - makeDefaultContainer()
    var container = document.createElement("div")
    container.tabIndex = 1
    container.style.position = "fixed"
    container.style.left = "0px"
    container.style.right = "0px"
    container.style.top = "0px"
    container.style.bottom = "0px"
    container.style.height = "100%"
    container.style.overflow = "hidden"
    document.body.appendChild(container)
    document.body.style.overflow = "hidden" //Prevent bounce
    document.body.style.height = "100%"
    container.id = 'noa-container'
    return container
}


function getOrCreateCanvas(el) {
    // based on github.com/stackgl/gl-now - default canvas
    var canvas = el.querySelector('canvas')
    if (!canvas) {
        canvas = document.createElement('canvas')
        canvas.style.position = "absolute"
        canvas.style.left = "0px"
        canvas.style.top = "0px"
        canvas.style.height = "100%"
        canvas.style.width = "100%"
        canvas.id = 'noa-canvas'
        el.insertBefore(canvas, el.firstChild)
    }
    return canvas
}


// set up stuff to detect pointer lock support.
// Needlessly complex because Chrome/Android claims to support but doesn't.
// For now, just feature detect, but assume no support if a touch event occurs
// TODO: see if this makes sense on hybrid touch/mouse devices
function detectPointerLock(self) {
    var lockElementExists =
        ('pointerLockElement' in document) ||
        ('mozPointerLockElement' in document) ||
        ('webkitPointerLockElement' in document)
    if (lockElementExists) {
        self.supportsPointerLock = true
        var listener = function (e) {
            self.supportsPointerLock = false
            document.removeEventListener(e.type, listener)
        }
        document.addEventListener('touchmove', listener)
    }
}


/**
 * This works around a weird bug that seems to be chrome/mac only?
 * Without this, the page sometimes initializes with the canva
 * zoomed into its lower left quadrant. 
 * Resizing the canvas fixes the issue (also: resizing page, changing zoom...)
 */
function doCanvasBugfix(noa, canvas) {
    var ct = 0
    var fixCanvas = () => {
        var w = canvas.width
        canvas.width = w + 1
        canvas.width = w
        if (ct++ > 10) noa.off('beforeRender', fixCanvas)
    }
    noa.on('beforeRender', fixCanvas)
}
