
var glvec3 = require('gl-vec3')

import { SceneOctreeManager } from './sceneOctreeManager'

import { Scene } from '@babylonjs/core/scene'
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera'
import { Engine } from '@babylonjs/core/Engines/engine'
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { TransformNode } from '@babylonjs/core/Meshes/transformNode'
import '@babylonjs/core/Meshes/Builders/planeBuilder'
import '@babylonjs/core/Meshes/Builders/linesBuilder'





// profiling flag
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
    preserveDrawingBuffer: true,
    octreeBlockSize: 2,
    renderOnResize: true,
}



/**
 * `noa.rendering` - 
 * Manages all rendering, and the BABYLON scene, materials, etc.
 * 
 * This module uses the following default options (from the options
 * object passed to the [[Engine]]):
 * ```js
 * {
 *     showFPS: false,
 *     antiAlias: true,
 *     clearColor: [0.8, 0.9, 1],
 *     ambientColor: [1, 1, 1],
 *     lightDiffuse: [1, 1, 1],
 *     lightSpecular: [1, 1, 1],
 *     groundLightColor: [0.5, 0.5, 0.5],
 *     useAO: true,
 *     AOmultipliers: [0.93, 0.8, 0.5],
 *     reverseAOmultiplier: 1.0,
 *     preserveDrawingBuffer: true,
 *     octreeBlockSize: 2,
 *     renderOnResize: true,
 * }
 * ```
*/

export class Rendering {

    /** @internal @prop _scene */
    /** @internal @prop _engine */
    /** @internal @prop _octree */
    /** @internal @prop _octreeManager */

    /** @internal */
    constructor(noa, opts, canvas) {

        this.noa = noa
        opts = Object.assign({}, defaults, opts)

        // settings
        this.renderOnResize = !!opts.renderOnResize

        // internals
        this.useAO = !!opts.useAO
        this.aoVals = opts.AOmultipliers
        this.revAoVal = opts.reverseAOmultiplier
        this.meshingCutoffTime = 6 // ms

        // set up babylon scene
        this._scene = null
        this._engine = null
        this._octree = null
        this._octreeManager = null
        initScene(this, canvas, opts)

        // for debugging
        if (opts.showFPS) setUpFPS()
    }
}

// Constructor helper - set up the Babylon.js scene and basic components
function initScene(self, canvas, opts) {

    // init internal properties
    self._engine = new Engine(canvas, opts.antiAlias, {
        preserveDrawingBuffer: opts.preserveDrawingBuffer,
    })
    self._scene = new Scene(self._engine)
    var scene = self._scene
    // remove built-in listeners
    scene.detachControl()

    // octree manager class
    var blockSize = Math.round(opts.octreeBlockSize)
    self._octreeManager = new SceneOctreeManager(self, blockSize)

    // camera, and a node to hold it and accumulate rotations
    self._cameraHolder = new TransformNode('camHolder', scene)
    self._camera = new FreeCamera('camera', new Vector3(0, 0, 0), scene)
    self._camera.parent = self._cameraHolder
    self._camera.minZ = .01
    self._cameraHolder.visibility = false

    // plane obscuring the camera - for overlaying an effect on the whole view
    self._camScreen = Mesh.CreatePlane('camScreen', 10, scene)
    self.addMeshToScene(self._camScreen)
    self._camScreen.position.z = .1
    self._camScreen.parent = self._camera
    self._camScreenMat = self.makeStandardMaterial('camscreenmat')
    self._camScreen.material = self._camScreenMat
    self._camScreen.setEnabled(false)
    self._camLocBlock = 0

    // apply some defaults
    var lightVec = new Vector3(0.1, 1, 0.3)
    self._light = new HemisphericLight('light', lightVec, scene)

    function arrToColor(a) { return new Color3(a[0], a[1], a[2]) }
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
    // nothing here at the moment
}





Rendering.prototype.render = function () {
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


Rendering.prototype.postRender = function () {
    // nothing currently
}



Rendering.prototype.resize = function () {
    this._engine.resize()
    if (this.noa._paused && this.renderOnResize) {
        this._scene.render()
    }
}



Rendering.prototype.highlightBlockFace = function (show, posArr, normArr) {
    var m = getHighlightMesh(this)
    if (show) {
        // floored local coords for highlight mesh
        this.noa.globalToLocal(posArr, null, hlpos)
        // offset to avoid z-fighting, bigger when camera is far away
        var dist = glvec3.dist(this.noa.camera._localGetPosition(), hlpos)
        var slop = 0.001 + 0.001 * dist
        for (var i = 0; i < 3; i++) {
            if (normArr[i] === 0) {
                hlpos[i] += 0.5
            } else {
                hlpos[i] += (normArr[i] > 0) ? 1 + slop : -slop
            }
        }
        m.position.copyFromFloats(hlpos[0], hlpos[1], hlpos[2])
        m.rotation.x = (normArr[1]) ? Math.PI / 2 : 0
        m.rotation.y = (normArr[0]) ? Math.PI / 2 : 0
    }
    m.setEnabled(show)
}
var hlpos = []




/**
 * Add a mesh to the scene's octree setup so that it renders. 
 * 
 * @param mesh the mesh to add to the scene
 * @param isStatic pass in true if mesh never moves (i.e. change octree blocks)
 * @param pos (optional) global position where the mesh should be
 * @param containingChunk (optional) chunk to which the mesh is statically bound
 */
Rendering.prototype.addMeshToScene = function (mesh, isStatic = false, pos = null, containingChunk = null) {
    // exit silently if mesh has already been added and not removed
    if (this._octreeManager.includesMesh(mesh)) return

    // find local position for mesh and move it there (unless it's parented)
    if (!mesh.parent) {
        if (!pos) pos = [mesh.position.x, mesh.position.y, mesh.position.z]
        var lpos = []
        this.noa.globalToLocal(pos, null, lpos)
        mesh.position.copyFromFloats(lpos[0], lpos[1], lpos[2])
    }

    // save CPU by freezing terrain meshes
    if (isStatic) {
        mesh.freezeWorldMatrix()
        if (mesh.freezeNormals) mesh.freezeNormals()
    }

    // add to the octree, and add dispose handler to remove it
    this._octreeManager.addMesh(mesh, isStatic, pos, containingChunk)
    mesh.onDisposeObservable.add(() => {
        this._octreeManager.removeMesh(mesh)
    })
}











/**
 * Create a default standardMaterial:      
 * flat, nonspecular, fully reflects diffuse and ambient light
 */
Rendering.prototype.makeStandardMaterial = function (name) {
    var mat = new StandardMaterial(name, this._scene)
    mat.specularColor.copyFromFloats(0, 0, 0)
    mat.ambientColor.copyFromFloats(1, 1, 1)
    mat.diffuseColor.copyFromFloats(1, 1, 1)
    this.postMaterialCreationHook(mat)
    return mat
}

/** Exposed hook for if the client wants to do something to newly created materials */
Rendering.prototype.postMaterialCreationHook = function (mat) { }







/*
 *
 * 
 *   ACCESSORS FOR CHUNK ADD/REMOVAL/MESHING
 *
 * 
 */

Rendering.prototype.prepareChunkForRendering = function (chunk) {
    // currently no logic needed here, but I may need it again...
}

Rendering.prototype.disposeChunkForRendering = function (chunk) {
    // nothing currently
}









/*
 *
 *   INTERNALS
 *
 */



// change world origin offset, and rebase everything with a position

Rendering.prototype._rebaseOrigin = function (delta) {
    var dvec = new Vector3(delta[0], delta[1], delta[2])

    this._scene.meshes.forEach(mesh => {
        // parented meshes don't live in the world coord system
        if (mesh.parent) return

        // move each mesh by delta (even though most are managed by components)
        mesh.position.subtractInPlace(dvec)

        if (mesh._isWorldMatrixFrozen) {
            // paradoxically this unfreezes, then re-freezes the matrix
            mesh.freezeWorldMatrix()
        }
    })

    // updates position of all octree blocks
    this._octreeManager.rebase(dvec)
}





// updates camera position/rotation to match settings from noa.camera

function updateCameraForRender(self) {
    var cam = self.noa.camera
    var tgtLoc = cam._localGetTargetPosition()
    self._cameraHolder.position.copyFromFloats(tgtLoc[0], tgtLoc[1], tgtLoc[2])
    self._cameraHolder.rotation.x = cam.pitch
    self._cameraHolder.rotation.y = cam.heading
    self._camera.position.z = -cam.currentZoom

    // applies screen effect when camera is inside a transparent voxel
    var cloc = cam._localGetPosition()
    var off = self.noa.worldOriginOffset
    var cx = Math.floor(cloc[0] + off[0])
    var cy = Math.floor(cloc[1] + off[1])
    var cz = Math.floor(cloc[2] + off[2])
    var id = self.noa.getBlock(cx, cy, cz)
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
    var mesh = rendering._highlightMesh
    if (!mesh) {
        mesh = Mesh.CreatePlane("highlight", 1.0, rendering._scene)
        var hlm = rendering.makeStandardMaterial('highlightMat')
        hlm.backFaceCulling = false
        hlm.emissiveColor = new Color3(1, 1, 1)
        hlm.alpha = 0.2
        mesh.material = hlm

        // outline
        var s = 0.5
        var lines = Mesh.CreateLines("hightlightLines", [
            new Vector3(s, s, 0),
            new Vector3(s, -s, 0),
            new Vector3(-s, -s, 0),
            new Vector3(-s, s, 0),
            new Vector3(s, s, 0)
        ], rendering._scene)
        lines.color = new Color3(1, 1, 1)
        lines.parent = mesh

        rendering.addMeshToScene(mesh)
        rendering.addMeshToScene(lines)
        rendering._highlightMesh = mesh
    }
    return mesh
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
    var numSubs = 0
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
        numSubs += (m.subMeshes) ? m.subMeshes.length : 1
        var mats = m.material.subMaterials || [m.material]
        mats.forEach(function (mat) {
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
        '   subMeshes:', numSubs,
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







import { makeProfileHook } from './util'
var profile_hook = (PROFILE) ?
    makeProfileHook(200, 'render internals') : () => { }



var fps_hook = function () { }

function setUpFPS() {
    var div = document.createElement('div')
    div.id = 'noa_fps'
    div.style.position = 'absolute'
    div.style.top = '0'
    div.style.right = '0'
    div.style.zIndex = '0'
    div.style.color = 'white'
    div.style.backgroundColor = 'rgba(0,0,0,0.5)'
    div.style.font = '14px monospace'
    div.style.textAlign = 'center'
    div.style.minWidth = '2em'
    div.style.margin = '4px'
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
