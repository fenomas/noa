'use strict';


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
var halfPi = Math.PI / 2
window.BABYLON = BABYLON


var defaults = {
    antiAlias: true,
    clearColor: [0.8, 0.9, 1],
    ambientColor: [1, 1, 1],
    lightDiffuse: [1, 1, 1],
    lightSpecular: [1, 1, 1],
    groundLightColor: [0.5, 0.5, 0.5],
    initialCameraZoom: 0,
    cameraZoomSpeed: .2,
    cameraMaxAngle: halfPi - 0.01,
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

    // Events and handling for meshing chunks when needed
    var self = this
    this._meshedChunks = {}
    this._chunksToMesh = []
    this._numMeshedChunks = 0
    noa.world.on('chunkAdded', function (chunk) { onChunkAdded(self, chunk) })
    noa.world.on('chunkChanged', function (chunk) { onChunkChanged(self, chunk) })
    noa.world.on('chunkRemoved', function (i, j, k) { onChunkRemoved(self, i, j, k) })

    // internals
    this._materialCache = {}
    this.useAO = !!opts.useAO
    this.aoVals = opts.AOmultipliers
    this.revAoVal = opts.reverseAOmultiplier

    // for debugging
    window.scene = this._scene
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

    // engine entity to follow the player and act as camera target
    self.cameraTarget = self.noa.ents.createEntity(['position'])

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

    // create a mesh to serve as the built-in shadow mesh
    var disc = BABYLON.Mesh.CreateDisc('shadowMesh', 0.75, 30, scene)
    disc.rotation.x = halfPi
    self.noa.registry.registerMesh('shadow', disc)
    disc.material = self.makeStandardMaterial('shadowMat')
    disc.material.diffuseColor = new col3(0, 0, 0)
    disc.material.specularColor = new col3(0, 0, 0)
    disc.material.alpha = 0.5

    // create a terrain material to be the base for all terrain
    // this material is also used for colored terrain (that has no texture)
    self._terrainMaterial = self.makeStandardMaterial('terrainMat')
    self._terrainMaterial.specularColor = new col3(0, 0, 0)
}



/*
 *   PUBLIC API 
*/

// Init anything about scene that needs to wait for engine internals
Rendering.prototype.initScene = function () {
    // make camera target entity follow player's location + eye offset
    this.noa.ents.addComponent(this.cameraTarget, 'followsEntity', {
        entity: this.noa.playerEntity,
        offset: [0, this.noa.playerEyeOffset, 0],
    })
}

// accessor for client app to build meshes and register materials
Rendering.prototype.getScene = function () {
    return this._scene
}

// tick function manages deferred meshing
Rendering.prototype.tick = function (dt) {
    // chunk a mesh, or a few if they're fast
    var cutoff = 6 + performance.now()
    while (this._chunksToMesh.length && (performance.now() < cutoff)) {
        doDeferredMeshing(this)
    }
}


Rendering.prototype.render = function (dt) {
    updateCamera(this)
    this._engine.beginFrame()
    this._scene.render()
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
        m.rotation.x = (normArr[1]) ? halfPi : 0
        m.rotation.y = (normArr[0]) ? halfPi : 0
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
    // wrap or create onDispose
    var self = this
    var disp = function () {
        self.removeDynamicMesh(mesh)
    }
    if (!mesh.onDispose) {
        mesh.onDispose = disp
    } else {
        var _dispose = mesh.onDispose
        mesh.onDispose = function () {
            _dispose.call(mesh)
            disp()
        }
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



Rendering.prototype.makeMeshInstance = function (meshname, isTerrain) {
    var mesh = this.noa.registry.getMesh(meshname)
    var id = this.noa.registry.getMeshID(meshname)
    var cb = this.noa.registry._getMeshCallbackByBlockID(id)
    return instantiateMesh(this, mesh, meshname, isTerrain, cb)
}

Rendering.prototype._makeMeshInstanceByID = function (id, isTerrain) {
    var mesh = this.noa.registry._getMeshByBlockID(id)
    var cb = this.noa.registry._getMeshCallbackByBlockID(id)
    return instantiateMesh(this, mesh, mesh.name, isTerrain, cb)
}

function instantiateMesh(self, mesh, name, isTerrain, callback) {
    var m = mesh.createInstance(name)
    if (mesh.billboardMode) m.billboardMode = mesh.billboardMode
    if (!isTerrain) {
        // non-terrain stuff should be dynamic w.r.t. selection octrees
        self.addDynamicMesh(m)
    }

    // call callback if there is one, letting client adjust mesh
    if (callback) callback(mesh)

    // testing performance tweaks

    // make instance meshes skip over getLOD checks, since there may be lots of them
    mesh.getLOD = m.getLOD = function () { return mesh }
    m._currentLOD = mesh
    // make instance meshes skip frustum checks 
    // (they'll still get culled by octree checks)
    m.isInFrustum = function () { return true }

    return m
}



// create a new standardMaterial, with any settings needed
Rendering.prototype.makeStandardMaterial = function (name) {
    var mat = new BABYLON.StandardMaterial(name, this._scene)
    mat.freeze()
    return mat
}



/*
 *   CHUNK ADD/CHANGE/REMOVE HANDLING
*/

function onChunkAdded(self, chunk) {
    // newly created chunks go to the end of the queue
    enqueueChunkUniquely(chunk, self._chunksToMesh, false)
}

function onChunkChanged(self, chunk) {
    // changed chunks go to the head of the queue
    enqueueChunkUniquely(chunk, self._chunksToMesh, true)
}

function onChunkRemoved(self, i, j, k) {
    var id = i + '|' + j + '|' + k
    removeMesh(self, id)
}

function doDeferredMeshing(self) {
    var chunk = null

    // find a chunk to mesh, starting from front, skipping if not meshable
    while (self._chunksToMesh.length && !chunk) {
        var c = self._chunksToMesh.shift()
        if (!c._terrainDirty) continue
        if (c.isDisposed) continue
        chunk = c
    }
    if (!chunk) return

    var id = chunk.i + '|' + chunk.j + '|' + chunk.k
    // remove current version if this is an update to an existing chunk
    if (self._meshedChunks[id]) removeMesh(self, id)
    // mesh it and add to babylon scene
    var meshdata = meshChunk(self, chunk)
    self._numMeshedChunks++
    if (meshdata.length) {
        var mesh = makeChunkMesh(self, meshdata, id, chunk)
        self._meshedChunks[id] = mesh
    }
}

/*
 *
 *   INTERNALS
 *
*/

function enqueueChunkUniquely(obj, queue, infront) {
    // remove any duplicate chunk descriptor objects
    for (var i = 0; i < queue.length; ++i) {
        if (queue[i] === obj) queue.splice(i--, 1);
    }
    // add to front/end of queue
    if (infront) queue.unshift(obj)
    else queue.push(obj);
}


function removeMesh(self, id) {
    var m = self._meshedChunks[id]
    if (m) m.dispose()
    delete self._meshedChunks[id]
    self._numMeshedChunks--
}


// given an updated chunk reference, run it through mesher
function meshChunk(self, chunk) {
    var noa = self.noa
    var matGetter = noa.registry.getBlockFaceMaterialAccessor()
    var colGetter = noa.registry.getMaterialVertexColorAccessor()
    // returns an array of chunk#Submesh
    var blockFaceMats = noa.registry._blockMats
    return chunk.mesh(matGetter, colGetter, self.useAO, self.aoVals, self.revAoVal, blockFaceMats)
}


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

        rendering._octree.dynamicContent.push(m, lines)
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








// single canonical function to make a Material for a materialID
function makeTerrainMaterial(self, id) {
    var url = self.noa.registry.getMaterialTexture(id)
    var matData = self.noa.registry.getMaterialData(id)
    var alpha = matData.alpha
    if (!url && alpha == 1) {
        // base material is fine for non-textured case, if no alpha
        return self._terrainMaterial
    }
    var mat = self._terrainMaterial.clone('terrain' + id)
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
function makeChunkMesh(self, meshdata, id, chunk) {
    var scene = self._scene

    // create/position parent mesh
    var mesh = new BABYLON.Mesh('chunk_' + id, scene)
    var x = chunk.i * chunk.size
    var y = chunk.j * chunk.size
    var z = chunk.k * chunk.size
    mesh.position.x = x
    mesh.position.y = y
    mesh.position.z = z
    mesh.freezeWorldMatrix()

    // preprocess meshdata entries to merge those that use default terrain material
    var s, mdat, i
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
            delete meshdata[s]
        }
    }

    // go through (remaining) meshdata entries and create a mesh for each
    keylist = Object.keys(meshdata)
    for (i = 0; i < keylist.length; ++i) {
        mdat = meshdata[keylist[i]]
        var matID = mdat.id
        var m = new BABYLON.Mesh('terr' + matID, self._scene)
        m.parent = mesh

        m.material = getOrCreateMaterial(self, matID)

        var vdat = new BABYLON.VertexData()
        vdat.positions = mdat.positions
        vdat.indices = mdat.indices
        vdat.normals = mdat.normals
        vdat.colors = mdat.colors
        vdat.uvs = mdat.uvs
        vdat.applyToMesh(m)

        m.freezeWorldMatrix();
    }

    createOctreeBlock(self, mesh, chunk, x, y, z)

    return mesh
}



function createOctreeBlock(self, mesh, chunk, x, y, z) {
    var octree = self._octree

    if (chunk.octreeBlock) {
        var b = chunk.octreeBlock
        var i = octree.blocks.indexOf(b)
        if (i >= 0) octree.blocks.splice(i, 1)
        if (b.entries) b.entries.length = 0
        chunk.octreeBlock = null
    }

    var cs = chunk.size
    var min = new vec3(x, y, z)
    var max = new vec3(x + cs, y + cs, z + cs)
    var block = new BABYLON.OctreeBlock(min, max)
    mesh.getChildren().map(function (m) {
        block.entries.push(m)
    })
    chunk.octreeBlock = block

    octree.blocks.push(block)
    for (var key in chunk._objectMeshes) {
        block.entries.push(chunk._objectMeshes[key])
    }
}







