import glvec3 from 'gl-vec3'
import { removeUnorderedListItem } from './util'
import Engine from ".."

import { Scene } from '@babylonjs/core/scene'
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera'
import { Octree } from '@babylonjs/core/Culling/Octrees/octree'
import { OctreeBlock } from '@babylonjs/core/Culling/Octrees/octreeBlock'
import { AbstractMesh, Engine as BabylonEngine, Material } from "@babylonjs/core"
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { Vector3, Color3 as Color3Babylon, Color4 as Color4Babylon } from '@babylonjs/core/Maths/math'
import { Mesh as BabylonMesh } from '@babylonjs/core/Meshes/mesh'
import { OctreeSceneComponent } from '@babylonjs/core/Culling/Octrees/'
import '@babylonjs/core/Meshes/meshBuilder'
import { makeProfileHook } from './util'
import { Chunk } from "./chunk"
import { Color3, Color4 } from "./types"


export type noaMesh = BabylonMesh & { _noaContainingChunk: Chunk | null | undefined; _isWorldMatrixFrozen: boolean | undefined; };


// profiling flag
var PROFILE = 0
var pendingResize = false
var hlpos: [number, number, number] = [] as any


export interface IRenderingOptions {
    /** @default false */
    showFPS: boolean;

    /** @default true */
    antiAlias: boolean;

    /** @default [0.8, 0.9, 1, 1] */
    clearColor: Color4;

    /** @default [1, 1, 1] */
    ambientColor: Color3;

    /** @default [1, 1, 1] */
    lightDiffuse: [number, number, number];
    
    /** @default [1, 1, 1] */
    lightSpecular: Color3;
    
    /** @default [0.5, 0.5, 0.5] */
    groundLightColor: Color3;
    
    /** @default true */
    useAO: boolean;
    
    /** @default [0.93, 0.8, 0.5] */
    AOmultipliers: [number, number, number];
    
    /** @default 1.0 */
    reverseAOmultiplier: number;
    
    /** @default true */
    preserveDrawingBuffer: boolean;
}

const renderingDefaults: IRenderingOptions = {
    showFPS: false,
    antiAlias: true,
    clearColor: [0.8, 0.9, 1, 1],
    ambientColor: [1, 1, 1],
    lightDiffuse: [1, 1, 1],
    lightSpecular: [1, 1, 1],
    groundLightColor: [0.5, 0.5, 0.5],
    useAO: true,
    AOmultipliers: [0.93, 0.8, 0.5],
    reverseAOmultiplier: 1.0,
    preserveDrawingBuffer: true,
}



/**
 * @description Manages all rendering, and the BABYLON scene, materials, etc.
 */
export class Rendering {
    constructor(noa: Engine, options: Partial<IRenderingOptions>, canvas: HTMLCanvasElement | WebGLRenderingContext) {
        const optionsWithDefaults = {
            ...renderingDefaults,
            ...options
        }

        this.noa = noa
        
        this.useAO = optionsWithDefaults.useAO
        this.aoVals = optionsWithDefaults.AOmultipliers
        this.revAoVal = optionsWithDefaults.reverseAOmultiplier
        this.meshingCutoffTime = 6 // ms
        this._resizeDebounce = 250 // ms

        // init internal properties
        this._engine = new BabylonEngine(canvas, optionsWithDefaults.antiAlias, {
            preserveDrawingBuffer: optionsWithDefaults.preserveDrawingBuffer,
        })
        
        this._scene = new Scene(this._engine)

        this._octree = new Octree(() => {})
        
        // remove built-in listeners
        this._scene.detachControl()

        // octree setup
        this._scene._addComponent(new OctreeSceneComponent(this._scene))
        this._octree.blocks = []
        this._scene._selectionOctree = this._octree

        // camera, and empty mesh to hold it, and one to accumulate rotations
        this._cameraHolder = new BabylonMesh('camHolder', this._scene) as noaMesh
        this._camera = new FreeCamera('camera', new Vector3(0, 0, 0), this._scene)
        this._camera.parent = this._cameraHolder
        this._camera.minZ = .01
        this._cameraHolder.visibility = 0 // false

        // plane obscuring the camera - for overlaying an effect on the whole view
        this._camScreen = BabylonMesh.CreatePlane('camScreen', 10, this._scene) as noaMesh
        this.addMeshToScene(this._camScreen)
        this._camScreen.position.z = .1
        this._camScreen.parent = this._camera
        this._camScreenMat = this.makeStandardMaterial('camscreenmat')
        this._camScreen.material = this._camScreenMat
        this._camScreen.setEnabled(false)
        this._camLocBlock = 0

        // apply some defaults
        var lightVec = new Vector3(0.1, 1, 0.3)
        this._light = new HemisphericLight('light', lightVec, this._scene)

        function arrToColor3(a: Color3) { return new Color3Babylon(a[0], a[1], a[2]) }
        function arrToColor4(a: Color4) { return new Color4Babylon(a[0], a[1], a[2], a[3]) }

        this._scene.clearColor = arrToColor4(optionsWithDefaults.clearColor)
        this._scene.ambientColor = arrToColor3(optionsWithDefaults.ambientColor)
        this._light.diffuse = arrToColor3(optionsWithDefaults.lightDiffuse)
        this._light.specular = arrToColor3(optionsWithDefaults.lightSpecular)
        this._light.groundColor = arrToColor3(optionsWithDefaults.groundLightColor)

        // make a default flat material (used or clone by terrain, etc)
        this.flatMaterial = this.makeStandardMaterial('flatmat')

        // for debugging
        if (optionsWithDefaults.showFPS) {
            setUpFPS()
        }
    }

    noa: Engine;

    useAO: boolean;
    aoVals: [number, number, number];
    revAoVal: number;
    meshingCutoffTime: number;
    _resizeDebounce: number;

    _engine: BabylonEngine;
    _scene: Scene;
    _octree: Octree<AbstractMesh>;
    
    _cameraHolder: noaMesh;
    _camera: FreeCamera;
    _camScreen: noaMesh;
    _camScreenMat: Material;

    _camLocBlock: number;

    _light: HemisphericLight;
    _highlightMesh: noaMesh | undefined;

    flatMaterial: any;

    /**
     * The Babylon `scene` object representing the game world.
     */
    getScene = () => {
        return this._scene
    }

    /** per-tick listener for rendering-related stuff */
    tick = (dt: number) => {
        // nothing here at the moment
    }

    render = (dt: number) => {
        profile_hook('start')
        this.updateCameraForRender()
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

    resize = (e: any) => {
        if (!pendingResize) {
            pendingResize = true
            setTimeout(() => {
                this._engine.resize()
                pendingResize = false
            }, this._resizeDebounce)
        }
    }

    /** make or get a mesh for highlighting active voxel */
    getHighlightMesh = () => {
        var mesh = this._highlightMesh
        if (!mesh) {
            mesh = BabylonMesh.CreatePlane("highlight", 1.0, this._scene) as noaMesh
            var hlm = this.makeStandardMaterial('highlightMat')
            hlm.backFaceCulling = false
            hlm.emissiveColor = new Color3Babylon(1, 1, 1)
            hlm.alpha = 0.2
            mesh.material = hlm
    
            // outline
            var s = 0.5
            var lines = BabylonMesh.CreateLines("hightlightLines", [
                new Vector3(s, s, 0),
                new Vector3(s, -s, 0),
                new Vector3(-s, -s, 0),
                new Vector3(-s, s, 0),
                new Vector3(s, s, 0)
            ], this._scene)
            lines.color = new Color3Babylon(1, 1, 1)
            lines.parent = mesh
    
            this.addMeshToScene(mesh)
            this.addMeshToScene(lines as any)
            
            this._highlightMesh = mesh
        }

        return mesh
    }

    highlightBlockFace(show: false): void;
    highlightBlockFace(show: true, posArr: [number, number, number], normArr: number[]): void;
    highlightBlockFace(show: boolean, posArr?: [number, number, number], normArr?: number[]): void {
        var m = this.getHighlightMesh()

        if (show) {
            // floored local coords for highlight mesh
            this.noa.globalToLocal(posArr!, null, hlpos)
            // offset to avoid z-fighting, bigger when camera is far away
            var dist = glvec3.dist(this.noa.camera._localGetPosition(), hlpos)
            var slop = 0.001 + 0.001 * dist
            for (var i = 0; i < 3; i++) {
                if (normArr![i] === 0) {
                    hlpos[i] += 0.5
                } else {
                    hlpos[i] += (normArr![i] > 0) ? 1 + slop : -slop
                }
            }
            m.position.copyFromFloats(hlpos[0], hlpos[1], hlpos[2])
            m.rotation.x = (normArr![1]) ? Math.PI / 2 : 0
            m.rotation.y = (normArr![0]) ? Math.PI / 2 : 0
        }
        
        m.setEnabled(show)
    }

    /**
     * Add a mesh to the scene's octree setup so that it renders. 
     * 
     * @param mesh: the mesh to add to the scene
     * @param isStatic: pass in true if mesh never moves (i.e. change octree blocks)
     * @param position: (optional) global position where the mesh should be
     * @param chunk: (optional) chunk to which the mesh is statically bound
     */
    addMeshToScene = (mesh: noaMesh, isStatic: boolean = false, pos?: [number, number, number], _containingChunk?: any) => {
        // exit silently if mesh has already been added and not removed
        if (mesh._noaContainingChunk) return
        if (this._octree.dynamicContent.includes(mesh)) return

        // find local position for mesh and move it there (unless it's parented)
        if (!mesh.parent) {
            if (!pos) pos = [mesh.position.x, mesh.position.y, mesh.position.z]
            const lpos: [number, number, number] = [] as any
            this.noa.globalToLocal(pos, null, lpos)
            mesh.position.copyFromFloats(lpos[0], lpos[1], lpos[2])
        }

        // statically tie to a chunk's octree, or treat as dynamic?
        var addToOctree = false
        if (isStatic) {
            var chunk = _containingChunk ||
                this.noa.world._getChunkByCoords(pos![0], pos![1], pos![2])
            addToOctree = !!(chunk && chunk.octreeBlock)
        }

        if (addToOctree) {
            chunk.octreeBlock.entries.push(mesh)
            mesh._noaContainingChunk = chunk
        } else {
            this._octree.dynamicContent.push(mesh)
        }

        if (isStatic) {
            mesh.freezeWorldMatrix()
            mesh.freezeNormals()
        }

        // add dispose event to undo everything done here
        var remover = this.removeMeshFromScene.bind(this, mesh)
        mesh.onDisposeObservable.add(remover)
    }


    /**
     * Undoes everything `addMeshToScene` does
     */
    removeMeshFromScene = (mesh: noaMesh) => {
        if (mesh._noaContainingChunk && mesh._noaContainingChunk.octreeBlock) {
            removeUnorderedListItem(mesh._noaContainingChunk.octreeBlock.entries, mesh)
        }
        mesh._noaContainingChunk = null
        removeUnorderedListItem(this._octree.dynamicContent, mesh)
    }

    /**
     * Create a default standardMaterial: flat, nonspecular, fully reflects diffuse and ambient light
     */
    makeStandardMaterial = (name: string) => {
        var mat = new StandardMaterial(name, this._scene)
        mat.specularColor.copyFromFloats(0, 0, 0)
        mat.ambientColor.copyFromFloats(1, 1, 1)
        mat.diffuseColor.copyFromFloats(1, 1, 1)
        return mat
    }

    prepareChunkForRendering = (chunk: Chunk) => {
        var cs = chunk.size
        var loc: [number, number, number] = [] as any
        this.noa.globalToLocal([chunk.x, chunk.y, chunk.z], null, loc)
        var min = new Vector3(loc[0], loc[1], loc[2])
        var max = new Vector3(loc[0] + cs, loc[1] + cs, loc[2] + cs)

        chunk.octreeBlock = new (OctreeBlock as any)(min, max, undefined, undefined, undefined, () => {})
        this._octree.blocks.push(chunk.octreeBlock)
    }

    disposeChunkForRendering = (chunk: Chunk) => {
        if (!chunk.octreeBlock) return
        removeUnorderedListItem(this._octree.blocks, chunk.octreeBlock)
        chunk.octreeBlock.entries.length = 0
        chunk.octreeBlock = null
    }

    /**
     * change world origin offset, and rebase everything with a position
     */
    _rebaseOrigin = (delta: [number, number, number]) => {
        var dvec = new Vector3(delta[0], delta[1], delta[2]);

        (this._scene.meshes as noaMesh[]).forEach(mesh => {
            // parented meshes don't live in the world coord system
            if (mesh.parent) return

            // move each mesh by delta (even though most are managed by components)
            mesh.position.subtractInPlace(dvec)

            if (mesh._isWorldMatrixFrozen) {
                (mesh as any).markAsDirty()
            }
        })

        // update octree block extents
        this._octree.blocks.forEach(octreeBlock => {
            octreeBlock.minPoint.subtractInPlace(dvec);
            octreeBlock.maxPoint.subtractInPlace(dvec);
            ((octreeBlock as any)._boundingVectors as Vector3[]).forEach((v: Vector3) => {
                v.subtractInPlace(dvec)
            })
        })
    }


    /**
     * updates camera position/rotation to match settings from noa.camera
     */
    updateCameraForRender = () => {
        var cam = this.noa.camera
        var tgtLoc = cam._localGetTargetPosition()
        this._cameraHolder.position.copyFromFloats(tgtLoc[0], tgtLoc[1], tgtLoc[2])
        this._cameraHolder.rotation.x = cam.pitch
        this._cameraHolder.rotation.y = cam.heading
        this._camera.position.z = -cam.currentZoom
    
        // applies screen effect when camera is inside a transparent voxel
        var cloc = cam._localGetPosition()
        var off = this.noa.worldOriginOffset
        var cx = Math.floor(cloc[0] + off[0])
        var cy = Math.floor(cloc[1] + off[1])
        var cz = Math.floor(cloc[2] + off[2])
        var id = this.noa.getBlock(cx, cy, cz)
        this.checkCameraEffect(id)
    }

    /** If camera's current location block id has alpha color (e.g. water), apply/remove an effect */
    checkCameraEffect = (id: number) => {
        if (id === this._camLocBlock) {
            return
        }


        if (id === 0) {
            this._camScreen.setEnabled(false)
        }
        else {
            var matId = this.noa.registry.getBlockFaceMaterial(id, 0)
            if (matId) {
                var matData = this.noa.registry.getMaterialData(matId)
                var col = matData.color
                var alpha = matData.alpha
                if (col && alpha && alpha < 1) {
                    (this._camScreenMat as any).diffuseColor.set(0, 0, 0)
                    (this._camScreenMat as any).ambientColor.set(col[0], col[1], col[2])
                    this._camScreenMat.alpha = alpha
                    this._camScreen.setEnabled(true)
                }
            }
        }

        this._camLocBlock = id
    }


    debug_SceneCheck = () => {
        var meshes = this._scene.meshes
        var dyns = this._octree.dynamicContent
        var octs: AbstractMesh[] = []
        var numOcts = 0
        var numSubs = 0
        var mats = this._scene.materials
        var allmats: Material[] = []
        mats.forEach(mat => {
            if ((mat as any).subMaterials) {
                (mat as any).subMaterials.forEach((mat: Material) => allmats.push(mat))
            }
            else {
                allmats.push(mat)
            }
        })
        this._octree.blocks.forEach(function (block) {
            numOcts++
            block.entries.forEach(m => octs.push(m))
        })
        meshes.forEach(function (m) {
            if (m._isDisposed) {
                warn(m, 'disposed mesh in scene')
            }
            if (empty(m)) {
                return
            }
            if (missing(m, dyns, octs)) {
                warn(m, 'non-empty mesh missing from octree')
            }
            if (!m.material) {
                warn(m, 'non-empty scene mesh with no material');
                return
            }

            numSubs += (m.subMeshes) ? m.subMeshes.length : 1
            var mats = (m.material as any).subMaterials || [m.material]

            mats.forEach(function (mat: Material) {
                if (missing(mat, mats)) {
                    warn(mat, 'mesh material not in scene')
                }
            })
        })
        var unusedMats: string[] = []
        allmats.forEach(mat => {
            var used = false
            meshes.forEach(mesh => {
                if (mesh.material === mat) used = true
                if (!mesh.material || !(mesh.material as any).subMaterials) return
                if ((mesh.material as any).subMaterials.includes(mat)) used = true
            })
            if (!used) {
                unusedMats.push(mat.name)
            }
        })
        if (unusedMats.length) {
            console.warn('Materials unused by any mesh: ', unusedMats.join(', '))
        }
        dyns.forEach(function (m) {
            if (missing(m, meshes)) {
                warn(m, 'octree/dynamic mesh not in scene')
            }
        })
        octs.forEach(function (m) {
            if (missing(m, meshes)) {
                warn(m, 'octree block mesh not in scene')
            }
        })
        var avgPerOct = Math.round(10 * octs.length / numOcts) / 10
        console.log('meshes - octree:', octs.length, '  dynamic:', dyns.length, '   subMeshes:', numSubs, '   avg meshes/octreeBlock:', avgPerOct)

        function warn(obj: AbstractMesh | Material, message: string) {
            console.warn(obj.name + ' --- ' + message)
        }

        function empty(mesh: AbstractMesh) {
            return mesh.getIndices()!.length === 0
        }

        function missing<T>(obj: T, list1: T[], list2?: T[]) {
            if (!obj) return false
            if (list1.includes(obj)) return false
            if (list2 && list2.includes(obj)) return false
            return true
        }
        return 'done.'
    }

    debug_MeshCount = () => {
        var ct: { [key: string]: number } = {}
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
}




var profile_hook = (PROFILE) ?
    makeProfileHook(200, 'render internals') : () => {}



var fps_hook = function () {}

function setUpFPS() {
    var div = document.createElement('div')
    div.id = 'noa_fps'

    div.setAttribute("style", `
        position: absolute;
        top: 0;
        right: 0;
        z-index: 0;
        color: white;
        background-color: rgba(0,0,0,0.5);
        font: 14px monospace;
        text-align: center;
        min-width: 2em;
        margin: 4px;
    `)
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
