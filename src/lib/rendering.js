'use strict'

var glvec3 = require('gl-vec3')
var removeUnorderedListItem = require('./util').removeUnorderedListItem


module.exports = function (noa, opts, canvas) {
    return new Rendering(noa, opts, canvas)
}



// profiling flags
var PROFILE = 0



var defaults = {
    showFPS: false,
    antiAlias: true,
    clearColor: [0.8, 0.9, 1],
    ambientColor: [1, 1, 1],
    lightDiffuse: [1, 1, 1],
    lightSpecular: [1, 1, 1],
    groundLightColor: [0.5, 0.5, 0.5],
    useAO: true,
    AOmultipliers: [0.93, 0.8, 0.5],
    reverseAOmultiplier: 1.0,
    useOctreesForDynamicMeshes: true,
    preserveDrawingBuffer: true,
}



/**
 * @class
 * @typicalname noa.rendering
 * @classdesc Manages all rendering, and the BABYLON scene, materials, etc.
 */

function Rendering(noa, opts, canvas) {
    this.noa = noa

    /**
     * `noa.rendering` uses the following options (from the root `noa(opts)` options):
     * ```js
     * {
     *   showFPS: false,
     *   antiAlias: true,
     *   clearColor: [0.8, 0.9, 1],
     *   ambientColor: [1, 1, 1],
     *   lightDiffuse: [1, 1, 1],
     *   lightSpecular: [1, 1, 1],
     *   groundLightColor: [0.5, 0.5, 0.5],
     *   useAO: true,
     *   AOmultipliers: [0.93, 0.8, 0.5],
     *   reverseAOmultiplier: 1.0,
     *   useOctreesForDynamicMeshes: true,
     *   preserveDrawingBuffer: true,
     * }
     * ```
     */
    opts = Object.assign({}, defaults, opts)

    // internals
    this._dynamicMeshes = []
    this.useAO = !!opts.useAO
    this.aoVals = opts.AOmultipliers
    this.revAoVal = opts.reverseAOmultiplier
    this.meshingCutoffTime = 6 // ms
    this._dynamicMeshOctrees = opts.useOctreesForDynamicMeshes
    this._resizeDebounce = 250 // ms

    // set up babylon scene
    initScene(this, canvas, opts)

    // for debugging
    if (opts.showFPS) setUpFPS()
}


// Constructor helper - set up the Babylon.js scene and basic components
function initScene(self, canvas, opts) {
    var BABYLON = self.noa.BABYLON

    // init internal properties
    self._engine = new BABYLON.Engine(canvas, opts.antiAlias, {
        preserveDrawingBuffer: opts.preserveDrawingBuffer,
    })
    self._scene = new BABYLON.Scene(self._engine)
    var scene = self._scene
    // remove built-in listeners
    scene.detachControl()

    // octree setup
    self._octree = new BABYLON.Octree($ => {})
    self._octree.blocks = []
    scene._selectionOctree = self._octree

    // camera, and empty mesh to hold it, and one to accumulate rotations
    self._cameraHolder = new BABYLON.Mesh('camHolder', scene)
    self._camera = new BABYLON.FreeCamera('camera', new BABYLON.Vector3(0, 0, 0), scene)
    self._camera.parent = self._cameraHolder
    self._camera.minZ = .01
    self._cameraHolder.visibility = false

    // plane obscuring the camera - for overlaying an effect on the whole view
    self._camScreen = BABYLON.Mesh.CreatePlane('camScreen', 10, scene)
    self.addMeshToScene(self._camScreen)
    self._camScreen.position.z = .1
    self._camScreen.parent = self._camera
    self._camScreenMat = self.makeStandardMaterial('camscreenmat')
    self._camScreen.material = self._camScreenMat
    self._camScreen.setEnabled(false)
    self._camLocBlock = 0

    // apply some defaults
    var lightVec = new BABYLON.Vector3(0.1, 1, 0.3)
    self._light = new BABYLON.HemisphericLight('light', lightVec, scene)

    function arrToColor(a) { return new BABYLON.Color3(a[0], a[1], a[2]) }
    scene.clearColor = arrToColor(opts.clearColor)
    scene.ambientColor = arrToColor(opts.ambientColor)
    self._light.diffuse = arrToColor(opts.lightDiffuse)
    self._light.specular = arrToColor(opts.lightSpecular)
    self._light.groundColor = arrToColor(opts.groundLightColor)

    // make a default flat material (used or clone by terrain, etc)
    self.flatMaterial = self.makeStandardMaterial('flatmat')

}



/*
 *   PUBLIC API 
 */


/**
 * The Babylon `scene` object representing the game world.
 * @member
 */
Rendering.prototype.getScene = function () {
    return this._scene
}

// per-tick listener for rendering-related stuff
Rendering.prototype.tick = function (dt) {
    if (this._dynamicMeshOctrees) updateDynamicMeshOctrees(this)
}





Rendering.prototype.render = function (dt) {
    profile_hook('start')
    updateCameraForRender(this)
    profile_hook('updateCamera')
    this._engine.beginFrame()
    profile_hook('beginFrame')
    this._scene.render()
    profile_hook('render')
    fps_hook()
    this._engine.endFrame()
    profile_hook('endFrame')
    profile_hook('end')
}



Rendering.prototype.resize = function (e) {
    if (!pendingResize) {
        pendingResize = true
        setTimeout(() => {
            this._engine.resize()
            pendingResize = false
        }, this._resizeDebounce)
    }
}
var pendingResize = false



Rendering.prototype.highlightBlockFace = function (show, posArr, normArr) {
    var m = getHighlightMesh(this)
    if (show) {
        // bigger slop when camera is far from highlight
        var dist = glvec3.dist(this.noa.camera.getPosition(), posArr)
        var slop = 0.0005 * dist
        var pos = _highlightPos
        for (var i = 0; i < 3; ++i) {
            pos[i] = Math.floor(posArr[i]) + .5 + ((0.5 + slop) * normArr[i])
        }
        m.position.copyFromFloats(pos[0], pos[1], pos[2])
        m.rotation.x = (normArr[1]) ? Math.PI / 2 : 0
        m.rotation.y = (normArr[0]) ? Math.PI / 2 : 0
    }
    m.setEnabled(show)
}
var _highlightPos = glvec3.create()





/**
 * add a mesh to the scene's octree setup so that it renders
 * pass in isStatic=true if the mesh won't move (i.e. change octree blocks)
 * @method
 */
Rendering.prototype.addMeshToScene = function (mesh, isStatic) {
    // exit silently if mesh has already been added and not removed
    if (mesh._currentNoaChunk || this._octree.dynamicContent.includes(mesh)) {
        return
    }
    var pos = mesh.position
    var chunk = this.noa.world._getChunkByCoords(pos.x, pos.y, pos.z)
    if (this._dynamicMeshOctrees && chunk && chunk.octreeBlock) {
        // add to an octree
        chunk.octreeBlock.entries.push(mesh)
        mesh._currentNoaChunk = chunk
    } else {
        // mesh added outside an active chunk - so treat as scene-dynamic
        this._octree.dynamicContent.push(mesh)
    }
    // remember for updates if it's not static
    if (!isStatic) this._dynamicMeshes.push(mesh)
    // handle remover when mesh gets disposed
    var remover = this.removeMeshFromScene.bind(this, mesh)
    mesh.onDisposeObservable.add(remover)
}



/**  Undoes everything `addMeshToScene` does
 * @method
 */
Rendering.prototype.removeMeshFromScene = function (mesh) {
    if (mesh._currentNoaChunk && mesh._currentNoaChunk.octreeBlock) {
        removeUnorderedListItem(mesh._currentNoaChunk.octreeBlock.entries, mesh)
    }
    mesh._currentNoaChunk = null
    removeUnorderedListItem(this._octree.dynamicContent, mesh)
    removeUnorderedListItem(this._dynamicMeshes, mesh)
}




// runs once per tick - move any dynamic meshes to correct chunk octree
function updateDynamicMeshOctrees(self) {
    for (var i = 0; i < self._dynamicMeshes.length; i++) {
        var mesh = self._dynamicMeshes[i]
        if (mesh._isDisposed) continue // shouldn't be possible
        var pos = mesh.position
        var prev = mesh._currentNoaChunk || null
        var next = self.noa.world._getChunkByCoords(pos.x, pos.y, pos.z) || null
        if (prev === next) continue
        // mesh has moved chunks since last update
        // remove from previous location...
        if (prev && prev.octreeBlock) {
            removeUnorderedListItem(prev.octreeBlock.entries, mesh)
        } else {
            removeUnorderedListItem(self._octree.dynamicContent, mesh)
        }
        // ... and add to new location
        if (next && next.octreeBlock) {
            next.octreeBlock.entries.push(mesh)
        } else {
            self._octree.dynamicContent.push(mesh)
        }
        mesh._currentNoaChunk = next
    }
}



Rendering.prototype.makeMeshInstance = function (mesh, isStatic) {
    var m = mesh.createInstance(mesh.name + ' instance' || 'instance')
    if (mesh.billboardMode) m.billboardMode = mesh.billboardMode
    // add to scene so as to render
    this.addMeshToScene(m, isStatic)

    // testing performance tweaks

    // make instance meshes skip over getLOD checks, since there may be lots of them
    // mesh.getLOD = m.getLOD = function () { return mesh }
    m._currentLOD = mesh

    // make terrain instance meshes skip frustum checks 
    // (they'll still get culled by octree checks)
    // if (isStatic) m.isInFrustum = function () { return true }

    return m
}



// Create a default standardMaterial:
//      flat, nonspecular, fully reflects diffuse and ambient light
Rendering.prototype.makeStandardMaterial = function (name) {
    var StdMat = this.noa.BABYLON.StandardMaterial
    var mat = new StdMat(name, this._scene)
    mat.specularColor.copyFromFloats(0, 0, 0)
    mat.ambientColor.copyFromFloats(1, 1, 1)
    mat.diffuseColor.copyFromFloats(1, 1, 1)
    return mat
}







/*
 *
 * 
 *   ACCESSORS FOR CHUNK ADD/REMOVAL/MESHING
 *
 * 
 */

Rendering.prototype.prepareChunkForRendering = function (chunk) {
    var BABYLON = this.noa.BABYLON
    var cs = chunk.size
    var min = new BABYLON.Vector3(chunk.x, chunk.y, chunk.z)
    var max = new BABYLON.Vector3(chunk.x + cs, chunk.y + cs, chunk.z + cs)
    chunk.octreeBlock = new BABYLON.OctreeBlock(min, max, undefined, undefined, undefined, $ => {})
    this._octree.blocks.push(chunk.octreeBlock)
}

Rendering.prototype.disposeChunkForRendering = function (chunk) {
    this.removeTerrainMesh(chunk)
    removeUnorderedListItem(this._octree.blocks, chunk.octreeBlock)
    chunk.octreeBlock.entries.length = 0
    chunk.octreeBlock = null
}

Rendering.prototype.addTerrainMesh = function (chunk, mesh) {
    this.removeTerrainMesh(chunk)
    if (mesh.getIndices().length) this.addMeshToScene(mesh, true)
    chunk._terrainMesh = mesh
}

Rendering.prototype.removeTerrainMesh = function (chunk) {
    if (!chunk._terrainMesh) return
    chunk._terrainMesh.dispose()
    chunk._terrainMesh = null
}









/*
 *
 *   INTERNALS
 *
 */






// updates camera position/rotation to match settings from noa.camera

function updateCameraForRender(self) {
    var cam = self.noa.camera
    var tgt = cam.getTargetPosition()
    self._cameraHolder.position.copyFromFloats(tgt[0], tgt[1], tgt[2])
    self._cameraHolder.rotation.x = cam.pitch
    self._cameraHolder.rotation.y = cam.heading
    self._camera.position.z = -cam.currentZoom

    // applies screen effect when camera is inside a transparent voxel
    var id = self.noa.getBlock(self.noa.camera.getPosition())
    checkCameraEffect(self, id)
}



//  If camera's current location block id has alpha color (e.g. water), apply/remove an effect

function checkCameraEffect(self, id) {
    if (id === self._camLocBlock) return
    if (id === 0) {
        self._camScreen.setEnabled(false)
    } else {
        var matId = self.noa.registry.getBlockFaceMaterial(id, 0)
        if (matId) {
            var matData = self.noa.registry.getMaterialData(matId)
            var col = matData.color
            var alpha = matData.alpha
            if (col && alpha && alpha < 1) {
                self._camScreenMat.diffuseColor.set(0, 0, 0)
                self._camScreenMat.ambientColor.set(col[0], col[1], col[2])
                self._camScreenMat.alpha = alpha
                self._camScreen.setEnabled(true)
            }
        }
    }
    self._camLocBlock = id
}






// make or get a mesh for highlighting active voxel
function getHighlightMesh(rendering) {
    var BABYLON = rendering.noa.BABYLON
    var m = rendering._highlightMesh
    if (!m) {
        var mesh = BABYLON.Mesh.CreatePlane("highlight", 1.0, rendering._scene)
        var hlm = rendering.makeStandardMaterial('highlightMat')
        hlm.backFaceCulling = false
        hlm.emissiveColor = new BABYLON.Color3(1, 1, 1)
        hlm.alpha = 0.2
        mesh.material = hlm
        m = rendering._highlightMesh = mesh
        // outline
        var s = 0.5
        var lines = BABYLON.Mesh.CreateLines("hightlightLines", [
            new BABYLON.Vector3(s, s, 0),
            new BABYLON.Vector3(s, -s, 0),
            new BABYLON.Vector3(-s, -s, 0),
            new BABYLON.Vector3(-s, s, 0),
            new BABYLON.Vector3(s, s, 0)
        ], rendering._scene)
        lines.color = new BABYLON.Color3(1, 1, 1)
        lines.parent = mesh

        rendering.addMeshToScene(m)
        rendering.addMeshToScene(lines)
    }
    return m
}









/*
 * 
 *      sanity checks:
 * 
 */

Rendering.prototype.debug_SceneCheck = function () {
    var meshes = this._scene.meshes
    var dyns = this._octree.dynamicContent
    var octs = []
    var numOcts = 0
    var mats = this._scene.materials
    var allmats = []
    mats.forEach(mat => {
        if (mat.subMaterials) mat.subMaterials.forEach(mat => allmats.push(mat))
        else allmats.push(mat)
    })
    this._octree.blocks.forEach(function (block) {
        numOcts++
        block.entries.forEach(m => octs.push(m))
    })
    meshes.forEach(function (m) {
        if (m._isDisposed) warn(m, 'disposed mesh in scene')
        if (empty(m)) return
        if (missing(m, dyns, octs)) warn(m, 'non-empty mesh missing from octree')
        if (!m.material) { warn(m, 'non-empty scene mesh with no material'); return }
        (m.material.subMaterials || [m.material]).forEach(function (mat) {
            if (missing(mat, mats)) warn(mat, 'mesh material not in scene')
        })
    })
    var unusedMats = []
    allmats.forEach(mat => {
        var used = false
        meshes.forEach(mesh => {
            if (mesh.material === mat) used = true
            if (!mesh.material || !mesh.material.subMaterials) return
            if (mesh.material.subMaterials.includes(mat)) used = true
        })
        if (!used) unusedMats.push(mat.name)
    })
    if (unusedMats.length) {
        console.warn('Materials unused by any mesh: ', unusedMats.join(', '))
    }
    dyns.forEach(function (m) {
        if (missing(m, meshes)) warn(m, 'octree/dynamic mesh not in scene')
    })
    octs.forEach(function (m) {
        if (missing(m, meshes)) warn(m, 'octree block mesh not in scene')
    })
    var avgPerOct = Math.round(10 * octs.length / numOcts) / 10
    console.log('meshes - octree:', octs.length, '  dynamic:', dyns.length,
        '   avg meshes/octreeBlock:', avgPerOct)

    function warn(obj, msg) { console.warn(obj.name + ' --- ' + msg) }

    function empty(mesh) { return (mesh.getIndices().length === 0) }

    function missing(obj, list1, list2) {
        if (!obj) return false
        if (list1.includes(obj)) return false
        if (list2 && list2.includes(obj)) return false
        return true
    }
    return 'done.'
}

Rendering.prototype.debug_MeshCount = function () {
    var ct = {}
    this._scene.meshes.forEach(m => {
        var n = m.name || ''
        n = n.replace(/-\d+.*/, '#')
        n = n.replace(/\d+.*/, '#')
        n = n.replace(/(rotHolder|camHolder|camScreen)/, 'rendering use')
        n = n.replace(/atlas sprite .*/, 'atlas sprites')
        ct[n] = ct[n] || 0
        ct[n]++
    })
    for (var s in ct) console.log('   ' + (ct[s] + '       ').substr(0, 7) + s)
}







var profile_hook = (function () {
    if (!PROFILE) return function () {}
    var every = 200
    var timer = new(require('./util').Timer)(every, 'render internals')
    return function (state) {
        if (state === 'start') timer.start()
        else if (state === 'end') timer.report()
        else timer.add(state)
    }
})()



var fps_hook = function () {}

function setUpFPS() {
    var div = document.createElement('div')
    div.id = 'noa_fps'
    var style = 'position:absolute; top:0; right:0; z-index:0;'
    style += 'color:white; background-color:rgba(0,0,0,0.5);'
    style += 'font:14px monospace; text-align:center;'
    style += 'min-width:2em; margin:4px;'
    div.style = style
    document.body.appendChild(div)
    var every = 1000
    var ct = 0
    var longest = 0
    var start = performance.now()
    var last = start
    fps_hook = function () {
        ct++
        var nt = performance.now()
        if (nt - last > longest) longest = nt - last
        last = nt
        if (nt - start < every) return
        var fps = Math.round(ct / (nt - start) * 1000)
        var min = Math.round(1 / longest * 1000)
        div.innerHTML = fps + '<br>' + min
        ct = 0
        longest = 0
        start = nt
    }
}
