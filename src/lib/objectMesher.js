'use strict'


var removeUnorderedListItem = require('./util').removeUnorderedListItem


module.exports = new ObjectMesher()


// enable for profiling..
var PROFILE = 0




// helper class to hold data about a single object mesh
function ObjMeshDat(id, x, y, z) {
    this.id = id | 0
    this.x = x | 0
    this.y = y | 0
    this.z = z | 0
}







/*
 * 
 * 
 *          Object meshing
 *  Per-chunk handling of the creation/disposal of voxels with static meshes
 * 
 * 
*/


function ObjectMesher() {


    // adds properties to the new chunk that will be used when processing
    this.initChunk = function (chunk) {
        chunk._objectBlocks = {}
        chunk._mergedObjectSystems = []
    }

    this.disposeChunk = function (chunk) {
        removeCurrentSystems(chunk)
        chunk._objectBlocks = null
    }

    function removeCurrentSystems(chunk) {
        var systems = chunk._mergedObjectSystems
        while (systems.length) {
            var sps = systems.pop()
            if (sps.mesh && chunk.octreeBlock && chunk.octreeBlock.entries) {
                removeUnorderedListItem(chunk.octreeBlock.entries, sps.mesh)
            }
            if (sps.mesh) sps.mesh.dispose()
            sps.dispose()
        }
    }



    // accessors for the chunk to regester as object voxels are set/unset
    this.addObjectBlock = function (chunk, id, x, y, z) {
        var key = x + '|' + y + '|' + z
        chunk._objectBlocks[key] = new ObjMeshDat(id, x, y, z, null)
    }

    this.removeObjectBlock = function (chunk, x, y, z) {
        var key = x + '|' + y + '|' + z
        if (chunk._objectBlocks[key]) delete chunk._objectBlocks[key]
    }




    /*
     * 
     *    main implementation - re-creates all needed object mesh instances
     * 
    */

    this.buildObjectMesh = function (chunk) {
        profile_hook('start')
        // remove the current (if any) sps/mesh
        removeCurrentSystems(chunk)

        var scene = chunk.noa.rendering.getScene()
        var objectMeshLookup = chunk.noa.registry._blockMeshLookup

        // preprocess everything to build lists of object block keys
        // hashed by material ID and then by block ID
        var matIndexes = {}
        for (var key in chunk._objectBlocks) {
            var blockDat = chunk._objectBlocks[key]
            var blockID = blockDat.id
            var mat = objectMeshLookup[blockID].material
            var matIndex = (mat) ? scene.materials.indexOf(mat) : -1
            if (!matIndexes[matIndex]) matIndexes[matIndex] = {}
            if (!matIndexes[matIndex][blockID]) matIndexes[matIndex][blockID] = []
            matIndexes[matIndex][blockID].push(key)
        }
        profile_hook('preprocess')

        // data structure now looks like:
        // matIndexes = {
        //      2: {                    // i.e. 2nd material in scene
        //          14: {               // i.e. voxel ID 14 from registry
        //              [ '2|3|4' ]     // key of block's local coords
        //          }
        //      }
        // }

        var x0 = chunk.i * chunk.size
        var y0 = chunk.j * chunk.size
        var z0 = chunk.k * chunk.size

        // build one SPS for each material
        for (var ix in matIndexes) {

            var meshHash = matIndexes[ix]
            var sps = buildSPSforMaterialIndex(chunk, scene, meshHash, x0, y0, z0)
            profile_hook('made SPS')

            // build SPS into the scene
            var merged = sps.buildMesh()
            profile_hook('built mesh')

            // finish up
            merged.material = (ix > -1) ? scene.materials[ix] : null
            merged.position.x = x0
            merged.position.y = y0
            merged.position.z = z0
            merged.freezeWorldMatrix()
            merged.freezeNormals()

            chunk.octreeBlock.entries.push(merged)
            chunk._mergedObjectSystems.push(sps)
        }

        profile_hook('end')
    }




    function buildSPSforMaterialIndex(chunk, scene, meshHash, x0, y0, z0) {
        var blockHash = chunk._objectBlocks
        // base sps
        var sps = new BABYLON.SolidParticleSystem('object_sps_' + chunk.id, scene, {
            updatable: false,
        })

        var blockHandlerLookup = chunk.noa.registry._blockHandlerLookup
        var objectMeshLookup = chunk.noa.registry._blockMeshLookup

        // run through mesh hash adding shapes and position functions
        for (var blockID in meshHash) {
            var mesh = objectMeshLookup[blockID]
            var blockArr = meshHash[blockID]
            var count = blockArr.length

            var handlerFn
            var handlers = blockHandlerLookup[blockID]
            if (handlers) handlerFn = handlers.onCustomMeshCreate
            // jshint -W083
            var setShape = function (particle, partIndex, shapeIndex) {
                var key = blockArr[shapeIndex]
                var dat = blockHash[key]
                // set global positions for the custom handler, if any
                particle.position.set(x0 + dat.x + 0.5, y0 + dat.y, z0 + dat.z + 0.5)
                if (handlerFn) handlerFn(particle, x0 + dat.x, y0 + dat.y, z0 + dat.z)
                // revert to local positions
                particle.position.x -= x0
                particle.position.y -= y0
                particle.position.z -= z0
            }
            sps.addShape(mesh, count, { positionFunction: setShape })
            blockArr.length = 0
        }

        return sps
    }




}









var profile_hook = (function () {
    if (!PROFILE) return function () { }
    var every = 50
    var timer = new (require('./util').Timer)(every, 'Object meshing')
    return function (state) {
        if (state === 'start') timer.start()
        else if (state === 'end') timer.report()
        else timer.add(state)
    }
})()

