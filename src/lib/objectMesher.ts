import { Chunk } from "./chunk"
import { blockHandler } from "./registry"
import { makeProfileHook } from './util'
import { SolidParticleSystem } from "@babylonjs/core/Particles/solidParticleSystem"

// enable for profiling..
var PROFILE = 0

/** helper class to hold data about a single object mesh */
export class ObjMeshDat {
    constructor(id: number, x: number, y: number, z: number) {
        this.id = id | 0
        this.x = x | 0
        this.y = y | 0
        this.z = z | 0
    }

    id: number;
    x: number;
    y: number;
    z: number;
}


/**
 * Object meshing
 * Per-chunk handling of the creation/disposal of voxels with static meshes
 */


/** adds properties to the new chunk that will be used when processing */
export function initChunk(chunk: Chunk) {
    chunk._objectBlocks = {}
    chunk._objectSystems = []
}

export function disposeChunk(chunk: Chunk) {
    removeObjectMeshes(chunk)
    chunk._objectBlocks = null
}

/** accessors for the chunk to regester as object voxels are set/unset */
export function addObjectBlock(chunk: Chunk, id: number, x: number, y: number, z: number) {
    var key = x + '|' + y + '|' + z
    chunk._objectBlocks[key] = new ObjMeshDat(id, x, y, z)
}

export function removeObjectBlock(chunk: Chunk, x: number, y: number, z: number) {
    var key = x + '|' + y + '|' + z
    if (chunk._objectBlocks[key]) delete chunk._objectBlocks[key]
}

/**
 * main implementation - remove / rebuild all needed object mesh instances
 */
export function removeObjectMeshes(chunk: Chunk) {
    // remove the current (if any) sps/mesh
    var systems = chunk._objectSystems || []
    while (systems.length) {
        var sps = systems.pop()
        if (sps.mesh) sps.mesh.dispose()
        sps.dispose()
    }
}

export function buildObjectMeshes(chunk: Chunk) {
    profile_hook('start')

    var scene = chunk.noa.rendering.getScene()
    var objectMeshLookup = chunk.noa.registry._blockMeshLookup

    // preprocess everything to build lists of object block keys
    // hashed by material ID and then by block ID
    // data structure looks like:
    // matIndexes = {
    //      2: {                    // i.e. 2nd material in scene
    //          14: {               // i.e. voxel ID 14 from registry
    //              [ '2|3|4' ]     // key of block's local coords
    //          }
    //      }
    // }
    var matIndexes: {
        /**
         * @example 2nd material in scene
         */
        [key: number]: {
            /**
             * voxel ID
             * value is key of block's local coords '2|3|4'
             * @example voxel ID 14 from registry
             */
            [key: number]: number[]
        }
    } = {}

    for (var key in chunk._objectBlocks) {
        // todo ObjMeshDat can be removed once mesher is typed
        var blockDat: ObjMeshDat = chunk._objectBlocks[key]
        var blockID = blockDat.id
        var mat = objectMeshLookup[blockID].material
        var matIndex = (mat) ? scene.materials.indexOf(mat) : -1
        
        if (!matIndexes[matIndex]) {
            matIndexes[matIndex] = {}
        }

        if (!matIndexes[matIndex][blockID]) {
            matIndexes[matIndex][blockID] = []
        }

        matIndexes[matIndex][blockID].push(key as any)
    }
    profile_hook('preprocess')

    var x0 = chunk.i * chunk.size
    var y0 = chunk.j * chunk.size
    var z0 = chunk.k * chunk.size

    // build one SPS mesh for each material
    var meshes = []
    for (var ix in matIndexes) {
        var meshHash = matIndexes[ix]
        var sps = buildSPSforMaterialIndex(chunk, scene, meshHash, x0, y0, z0)
        profile_hook('made SPS')

        // build SPS into the scene
        var merged = sps.buildMesh()
        profile_hook('built mesh')

        // finish up
        merged.material = (ix as any > -1) ? scene.materials[ix] : null
        meshes.push(merged)
        chunk._objectSystems.push(sps)
    }

    profile_hook('end')
    return meshes
}

export function buildSPSforMaterialIndex(chunk: Chunk, scene: any, meshHash: any, x0: number, y0: number, z0: number) {
    var blockHash = chunk._objectBlocks
    // base sps
    var sps = new SolidParticleSystem('object_sps_' + chunk.id, scene, {
        updatable: false,
    })

    var blockHandlerLookup = chunk.noa.registry._blockHandlerLookup
    var objectMeshLookup = chunk.noa.registry._blockMeshLookup

    // run through mesh hash adding shapes and position functions
    for (var blockID in meshHash) {
        var mesh = objectMeshLookup[blockID as any]
        var blockArr = meshHash[blockID]
        var count = blockArr.length

        var handlerFn: blockHandler
        var handlers = blockHandlerLookup[blockID as any]
        if (handlers) {
            handlerFn = handlers.onCustomMeshCreate!
        }

        var setShape = function (particle: any, partIndex: number, shapeIndex: number) {
            var key = blockArr[shapeIndex]
            var dat = blockHash[key]

            // set (local) pos and call handler (with global coords)
            particle.position.set(dat.x + 0.5, dat.y, dat.z + 0.5)
            if (handlerFn) {
                handlerFn(particle, x0 + dat.x, y0 + dat.y, z0 + dat.z)
            }
        }
        sps.addShape(mesh, count, { positionFunction: setShape })
        blockArr.length = 0
    }

    return sps;
}



var profile_hook = (PROFILE) ?
    makeProfileHook(50, 'Object meshing') : () => { }
