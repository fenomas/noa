'use strict'


var extend = require('extend')
var glvec3 = require('gl-vec3')
var aabb = require('aabb-3d')
var sweep = require('voxel-aabb-sweep')


// For now, assume Babylon.js has been imported into the global space already
if (!BABYLON) {
    throw new Error('Babylon.js reference not found! Abort! Abort!')
}

module.exports = function (noa, opts, canvas) {
    return new Rendering(noa, opts, canvas)
}

var vec3 = BABYLON.Vector3 // not a gl-vec3, in this module only!!
var col3 = BABYLON.Color3
window.BABYLON = BABYLON


// profiling flags
var PROFILE = 0
var SHOW_FPS = 0


var defaults = {
    showFPS: false,
    antiAlias: true,
    clearColor: [0.8, 0.9, 1],
    ambientColor: [1, 1, 1],
    lightDiffuse: [1, 1, 1],
    lightSpecular: [1, 1, 1],
    groundLightColor: [0.5, 0.5, 0.5],
    initialCameraZoom: 0,
    cameraZoomSpeed: .2,
    cameraMaxAngle: (Math.PI / 2) - 0.01,
    useAO: true,
    AOmultipliers: [0.93, 0.8, 0.5],
    reverseAOmultiplier: 1.0,
}





function Rendering(noa, _opts, canvas) {
    this.noa = noa
    var opts = extend({}, defaults, _opts)
    this.zoomDistance = opts.initialCameraZoom      // zoom setting
    this._currentZoom = this.zoomDistance       // current actual zoom level
    this._cameraZoomSpeed = opts.cameraZoomSpeed
    this._maxCamAngle = opts.cameraMaxAngle

    // set up babylon scene
    initScene(this, canvas, opts)

    // internals
    this._meshedChunks = {}
    this._numMeshedChunks = 0
    this._materialCache = {}
    this.useAO = !!opts.useAO
    this.aoVals = opts.AOmultipliers
    this.revAoVal = opts.reverseAOmultiplier
    this.meshingCutoffTime = 6 // ms

    // for debugging
    window.scene = this._scene
    if (SHOW_FPS || opts.showFPS) setUpFPS()
}


// Constructor helper - set up the Babylon.js scene and basic components
function initScene(self, canvas, opts) {
    if (!BABYLON) throw new Error('BABYLON.js engine not found!')

    // init internal properties
    self._engine = new BABYLON.Engine(canvas, opts.antiAlias)
    self._scene = new BABYLON.Scene(self._engine)
    var scene = self._scene
    // remove built-in listeners
    scene.detachControl()

    // octree setup
    self._octree = new BABYLON.Octree()
    self._octree.blocks = []
    scene._selectionOctree = self._octree

    // camera, and empty mesh to hold it, and one to accumulate rotations
    self._rotationHolder = new BABYLON.Mesh('rotHolder', scene)
    self._cameraHolder = new BABYLON.Mesh('camHolder', scene)
    self._camera = new BABYLON.FreeCamera('camera', new vec3(0, 0, 0), scene)
    self._camera.parent = self._cameraHolder
    self._camera.minZ = .01
    self._cameraHolder.visibility = false
    self._rotationHolder.visibility = false

    // plane obscuring the camera - for overlaying an effect on the whole view
    self._camScreen = BABYLON.Mesh.CreatePlane('camScreen', 10, scene)
    self.addDynamicMesh(self._camScreen)
    self._camScreen.position.z = .1
    self._camScreen.parent = self._camera
    self._camScreenMat = self.makeStandardMaterial('camscreenmat')
    self._camScreenMat.specularColor = new col3(0, 0, 0)
    self._camScreen.material = self._camScreenMat
    self._camScreen.setEnabled(false)
    self._camLocBlock = 0

    // apply some defaults
    self._light = new BABYLON.HemisphericLight('light', new vec3(0.1, 1, 0.3), scene)
    function arrToColor(a) { return new col3(a[0], a[1], a[2]) }
    scene.clearColor = arrToColor(opts.clearColor)
    scene.ambientColor = arrToColor(opts.ambientColor)
    self._light.diffuse = arrToColor(opts.lightDiffuse)
    self._light.specular = arrToColor(opts.lightSpecular)
    self._light.groundColor = arrToColor(opts.groundLightColor)

    // create a flat, non-specular material to be used globally
    // for any mesh that has colored vertices and no texture
    self.flatMaterial = self.makeStandardMaterial('flatmat')
    self.flatMaterial.specularColor = BABYLON.Color3.Black()

    // same for emissive elements
    self.emissiveMat = self.makeStandardMaterial('emissivemat')
    self.emissiveMat.specularColor = BABYLON.Color3.Black()
    self.emissiveMat.emissiveColor = BABYLON.Color3.White()
}



/*
 *   PUBLIC API 
*/

// Init anything about scene that needs to wait for engine internals
Rendering.prototype.initScene = function () {
    // engine entity to follow the player and act as camera target
    this.cameraTarget = this.noa.ents.createEntity(['position'])
    this.noa.ents.addComponent(this.cameraTarget, 'followsEntity', {
        entity: this.noa.playerEntity,
        offset: [0, this.noa.playerEyeOffset, 0],
    })
}

// accessor for client app to build meshes and register materials
Rendering.prototype.getScene = function () {
    return this._scene
}

// tick function is empty at the moment..
Rendering.prototype.tick = function (dt) {

}





Rendering.prototype.render = function (dt) {
    updateCamera(this)
    this._engine.beginFrame()
    this._scene.render()
    fps_hook()
    this._engine.endFrame()
}

Rendering.prototype.resize = function (e) {
    this._engine.resize()
}

Rendering.prototype.highlightBlockFace = function (show, posArr, normArr) {
    var m = getHighlightMesh(this)
    if (show) {
        // bigger slop when zoomed out
        var dist = this._currentZoom + glvec3.distance(this.noa.getPlayerEyePosition(), posArr)
        var slop = 0.001 + 0.001 * dist
        var pos = _highlightPos
        for (var i = 0; i < 3; ++i) {
            pos[i] = posArr[i] + .5 + ((0.5 + slop) * normArr[i])
        }
        m.position.copyFromFloats(pos[0], pos[1], pos[2])
        m.rotation.x = (normArr[1]) ? Math.PI / 2 : 0
        m.rotation.y = (normArr[0]) ? Math.PI / 2 : 0
    }
    m.setEnabled(show)
}
var _highlightPos = glvec3.create()


Rendering.prototype.getCameraVector = function () {
    return vec3.TransformCoordinates(BABYLON.Axis.Z, this._rotationHolder.getWorldMatrix())
}
var zero = vec3.Zero()
Rendering.prototype.getCameraPosition = function () {
    return vec3.TransformCoordinates(zero, this._camera.getWorldMatrix())
}
Rendering.prototype.getCameraRotation = function () {
    var rot = this._rotationHolder.rotation
    return [rot.x, rot.y]
}
Rendering.prototype.setCameraRotation = function (x, y) {
    var rot = this._rotationHolder.rotation
    rot.x = Math.max(-this._maxCamAngle, Math.min(this._maxCamAngle, x))
    rot.y = y
}


// add a dynamic (mobile, non-terrain) mesh to the scene
Rendering.prototype.addDynamicMesh = function (mesh) {
    var i = this._octree.dynamicContent.indexOf(mesh)
    if (i >= 0) return
    this._octree.dynamicContent.push(mesh)
    var remover = removeUnorderedListItem.bind(null, this._octree.dynamicContent, mesh)
    if (mesh.onDisposeObservable) {
        // the babylon 2.4+ way:
        mesh.onDisposeObservable.add(remover)
    } else {
        // the babylon 2.3- way, which no longer works in 2.4+
        var prev = mesh.onDispose || function() {}
        mesh.onDispose = function() { prev(); remover() }
    }
}

// remove a dynamic (mobile, non-terrain) mesh to the scene
Rendering.prototype.removeDynamicMesh = function (mesh) {
    removeUnorderedListItem(this._octree.dynamicContent, mesh)
}

// helper to swap item to end and pop(), instead of splice()ing
function removeUnorderedListItem(list, item) {
    var i = list.indexOf(item)
    if (i < 0) { return }
    if (i === list.length - 1) {
        list.pop()
    } else {
        list[i] = list.pop()
    }
}



Rendering.prototype.makeMeshInstance = function (mesh, isTerrain) {
    var m = mesh.createInstance(mesh.name + ' instance' || 'instance')
    if (mesh.billboardMode) m.billboardMode = mesh.billboardMode
    if (!isTerrain) {
        // non-terrain stuff should be dynamic w.r.t. selection octrees
        this.addDynamicMesh(m)
    }

    // testing performance tweaks

    // make instance meshes skip over getLOD checks, since there may be lots of them
    mesh.getLOD = m.getLOD = function () { return mesh }
    m._currentLOD = mesh

    // make terrain instance meshes skip frustum checks 
    // (they'll still get culled by octree checks)
    if (isTerrain) m.isInFrustum = function () { return true }

    return m
}



// create a new standardMaterial, with any settings needed
Rendering.prototype.makeStandardMaterial = function (name) {
    var mat = new BABYLON.StandardMaterial(name, this._scene)
    setTimeout(function () { mat.freeze() }, 10)
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
    var cs = chunk.size
    var min = new vec3(chunk.x, chunk.y, chunk.z)
    var max = new vec3(chunk.x + cs, chunk.y + cs, chunk.z + cs)
    chunk.octreeBlock = new BABYLON.OctreeBlock(min, max)
    this._octree.blocks.push(chunk.octreeBlock)
    window.chunk = chunk
}


Rendering.prototype.disposeChunkForRendering = function (chunk) {
    removeTerrainMesh(this, chunk)
    removeUnorderedListItem(this._octree.blocks, chunk.octreeBlock)
    chunk.octreeBlock.entries.length = 0
    chunk.octreeBlock = null
}


Rendering.prototype.meshChunk = function (chunk) {
    meshChunkImpl(this, chunk)
}






/*
 *
 *   INTERNALS
 *
*/








/*
 *
 *  zoom/camera related internals
 *
*/


// check if obstructions are behind camera by sweeping back an AABB
// along the negative camera vector

function cameraObstructionDistance(self) {
    var size = 0.2
    if (!_camBox) {
        _camBox = new aabb([0, 0, 0], [size * 2, size * 2, size * 2])
        _getVoxel = function (x, y, z) {
            return self.noa.world.getBlockSolidity(x, y, z)
        }
    }

    var pos = self._cameraHolder.position
    glvec3.set(_posVec, pos.x - size, pos.y - size, pos.z - size)
    _camBox.setPosition(_posVec)

    var dist = -self.zoomDistance
    var cam = self.getCameraVector()
    glvec3.set(_camVec, dist * cam.x, dist * cam.y, dist * cam.z)

    return sweep(_getVoxel, _camBox, _camVec, function (dist, axis, dir, vec) {
        return true
    }, true)
}

var _posVec = glvec3.create()
var _camVec = glvec3.create()
var _camBox
var _getVoxel




// Various updates to camera position/zoom, called every render

function updateCamera(self) {
    // update cameraHolder pos/rot from rotation holder and target entity
    self._cameraHolder.rotation.copyFrom(self._rotationHolder.rotation)
    var cpos = self.noa.ents.getPositionData(self.cameraTarget).renderPosition
    self._cameraHolder.position.copyFromFloats(cpos[0], cpos[1], cpos[2])

    // check obstructions and tween camera towards clipped position
    var dist = self.zoomDistance
    var speed = self._cameraZoomSpeed
    if (dist > 0) {
        dist = cameraObstructionDistance(self)
        if (dist < self._currentZoom) self._currentZoom = dist
    }
    self._currentZoom += speed * (dist - self._currentZoom)
    self._camera.position.z = -self._currentZoom

    // check id of block camera is in for overlay effects (e.g. being in water) 
    var cam = self.getCameraPosition()
    var id = self.noa.world.getBlockID(Math.floor(cam.x), Math.floor(cam.y), Math.floor(cam.z))
    checkCameraEffect(self, id)
}



//  If camera's current location block id has alpha color (e.g. water), apply/remove an effect

function checkCameraEffect(self, id) {
    if (id === self._camLocBlock) return
    if (id === 0) {
        self._camScreen.setEnabled(false)
    } else {
        var matAccessor = self.noa.registry.getBlockFaceMaterialAccessor()
        var matId = matAccessor(id, 0)
        var matData = self.noa.registry.getMaterialData(matId)
        var col = matData.color
        var alpha = matData.alpha
        if (col && alpha && alpha < 1) {
            self._camScreenMat.diffuseColor = new col3(col[0], col[1], col[2])
            self._camScreenMat.alpha = alpha
            self._camScreen.setEnabled(true)
        }
    }
    self._camLocBlock = id
}






// make or get a mesh for highlighting active voxel
function getHighlightMesh(rendering) {
    var m = rendering._highlightMesh
    if (!m) {
        var mesh = BABYLON.Mesh.CreatePlane("highlight", 1.0, rendering._scene)
        var hlm = rendering.makeStandardMaterial('highlightMat')
        hlm.backFaceCulling = false
        hlm.emissiveColor = new col3(1, 1, 1)
        hlm.alpha = 0.2
        mesh.material = hlm
        m = rendering._highlightMesh = mesh
        // outline
        var s = 0.5
        var lines = BABYLON.Mesh.CreateLines("hightlightLines", [
            new vec3(s, s, 0),
            new vec3(s, -s, 0),
            new vec3(-s, -s, 0),
            new vec3(-s, s, 0),
            new vec3(s, s, 0)
        ], rendering._scene)
        lines.color = new col3(1, 1, 1)
        lines.parent = mesh

        rendering.addDynamicMesh(m)
        rendering.addDynamicMesh(lines)
    }
    return m
}



// manage materials/textures to avoid duplicating them
function getOrCreateMaterial(self, matID) {
    var name = 'terrain' + matID
    var mat = self._materialCache[name]
    if (!mat) {
        mat = makeTerrainMaterial(self, matID)
        self._materialCache[name] = mat
    }
    return mat
}








/*
 * 
 * 
 *      Chunking and meshing
 * 
 * 
*/


function meshChunkImpl(self, chunk) {
    profile_hook('start')

    // remove current version if this is an update to an existing chunk
    removeTerrainMesh(self, chunk)

    // runs chunk through the meshing algorithm, creating the vertex/etc. data
    var meshdata = runChunkMesher(self, chunk)
    profile_hook('meshed')

    // creates the actual terrain mesh that will be added to the scene
    if (meshdata.length) {
        var mesh = makeTerrainMesh(self, meshdata, chunk)
        addTerrainMesh(self, chunk, mesh)
        profile_hook('built terrain')
    }

    profile_hook('end')

}


function addTerrainMesh(self, chunk, mesh) {
    self._meshedChunks[chunk.id] = mesh
    self._numMeshedChunks++
    mesh.getChildren().map(function (m) {
        chunk.octreeBlock.entries.push(m)
    })
}

function removeTerrainMesh(self, chunk) {
    var mesh = self._meshedChunks[chunk.id]
    if (mesh) {
        mesh.getChildren().map(function (m) {
            removeUnorderedListItem(chunk.octreeBlock.entries, m)
        })
        mesh.dispose()
        delete self._meshedChunks[chunk.id]
        self._numMeshedChunks--
    }
}


// given an updated chunk reference, run it through mesher
function runChunkMesher(self, chunk) {
    var noa = self.noa
    var matGetter = noa.registry.getBlockFaceMaterialAccessor()
    var colGetter = noa.registry.getMaterialVertexColorAccessor()
    // returns an array of chunk#Submesh
    var blockFaceMats = noa.registry._blockMats
    return chunk.mesh(matGetter, colGetter, self.useAO, self.aoVals, self.revAoVal, blockFaceMats)
}



// single canonical function to make a Material for a materialID
function makeTerrainMaterial(self, id) {
    var url = self.noa.registry.getMaterialTexture(id)
    var matData = self.noa.registry.getMaterialData(id)
    var alpha = matData.alpha
    if (!url && alpha == 1) {
        // base material is fine for non-textured case, if no alpha
        return self.flatMaterial
    }
    var mat = self.flatMaterial.clone('terrain' + id)
    if (url) {
        var tex = new BABYLON.Texture(url, self._scene, true, false, BABYLON.Texture.NEAREST_SAMPLINGMODE)
        if (matData.textureAlpha) {
            tex.hasAlpha = true
            mat.diffuseTexture = tex
        } else {
            mat.ambientTexture = tex
        }
    }
    if (matData.alpha < 1) {
        mat.alpha = matData.alpha
    }
    return mat
}



//
// Given arrays of data for an enmeshed chunk, create a 
// babylon mesh with child meshes for each terrain material
//
function makeTerrainMesh(self, meshdata, chunk) {
    var scene = self._scene

    // create/position parent mesh
    var mesh = new BABYLON.Mesh('chunk_' + chunk.id, scene)
    var x = chunk.i * chunk.size
    var y = chunk.j * chunk.size
    var z = chunk.k * chunk.size
    mesh.position.x = x
    mesh.position.y = y
    mesh.position.z = z
    mesh.freezeWorldMatrix()
    mesh.freezeNormals()

    // preprocess meshdata entries to merge those that use default terrain material
    var mdat, i
    var first = null
    var keylist = Object.keys(meshdata)
    for (i = 0; i < keylist.length; ++i) {
        mdat = meshdata[keylist[i]]
        var url = self.noa.registry.getMaterialTexture(mdat.id)
        var alpha = self.noa.registry.getMaterialData(mdat.id).alpha
        if (url || alpha < 1) continue

        if (!first) {
            first = mdat
        } else {
            // merge data in "mdat" onto "first"
            var offset = first.positions.length / 3
            first.positions = first.positions.concat(mdat.positions)
            first.normals = first.normals.concat(mdat.normals)
            first.colors = first.colors.concat(mdat.colors)
            first.uvs = first.uvs.concat(mdat.uvs)
            // indices must be offset relative to data being merged onto
            for (var j = 0, len = mdat.indices.length; j < len; ++j) {
                first.indices.push(mdat.indices[j] + offset)
            }
            // get rid of entry that's been merged
            delete meshdata[keylist[i]]
        }
    }

    // go through (remaining) meshdata entries and create a mesh for each
    keylist = Object.keys(meshdata)
    for (i = 0; i < keylist.length; ++i) {
        mdat = meshdata[keylist[i]]
        var matID = mdat.id
        var m = new BABYLON.Mesh('terrain ' + matID, self._scene)
        m.parent = mesh

        m.material = getOrCreateMaterial(self, matID)

        var vdat = new BABYLON.VertexData()
        vdat.positions = mdat.positions
        vdat.indices = mdat.indices
        vdat.normals = mdat.normals
        vdat.colors = mdat.colors
        vdat.uvs = mdat.uvs
        vdat.applyToMesh(m)

        m.freezeWorldMatrix()
        m.freezeNormals()
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
    var mats = this._scene.materials
    this._octree.blocks.forEach(function (b) {
        for (var i in b.entries) octs.push(b.entries[i])
    })
    meshes.forEach(function (m) {
        if (m._isDisposed) warn(m, 'disposed mesh in scene')
        if (!empty(m) && missing(m, dyns, octs)) warn(m, 'non-empty mesh missing from octree')
        if (missing(m.material, mats)) warn(m.material, 'mesh material not in scene')
        if (!empty(m) && !m.material) warn(m, 'non-empty scene mesh with no material')
    })
    mats.forEach(function (mat) {
        for (var i in meshes) if (meshes[i].material === mat) return
        warn(mat, 'material not used by any mesh')
    })
    dyns.forEach(function (m) {
        if (missing(m, meshes)) warn(m, 'octree/dynamic mesh not in scene')
    })
    octs.forEach(function (m) {
        if (missing(m, meshes)) warn(m, 'octree block mesh not in scene')
    })
    function warn(obj, msg) { console.warn(obj.name + ' --- ' + msg) }
    function empty(mesh) { return (mesh.getIndices().length === 0) }
    function missing(obj, list1, list2) {
        if (!obj) return false
        if (list2) return !(list1.includes(obj) || list2.includes(obj))
        return !list1.includes(obj)
    }
    return 'done.'
}

Rendering.prototype.debug_MeshCount = function () {
    var ct = {}
    this._scene.meshes.forEach(m => {
        var n = m.name || ''
        n = n.replace(/(-|\d)+.*/, '#')
        n = n.replace(/(rotHolder|camHolder|camScreen)/, 'rendering use')
        ct[n] = ct[n] || 0
        ct[n]++
    })
    for (var s in ct) console.log('   ' + (ct[s] + '       ').substr(0, 7) + s)
}







var profile_hook = (function () {
    if (!PROFILE) return function () { }
    var every = 200
    var timer = new (require('./util').Timer)(every, 'render internals')
    return function (state) {
        if (state === 'start') timer.start()
        else if (state === 'end') timer.report()
        else timer.add(state)
    }
})()



var fps_hook = function () { }
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


