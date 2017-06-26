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
        chunk._mergedObjectSPS = null
    }

    this.disposeChunk = function (chunk) {
        removeCurrentSPS(chunk)
        chunk._objectBlocks = null
    }

    function removeCurrentSPS(chunk) {
        var sps = chunk._mergedObjectSPS
        if (sps && sps.mesh && chunk.octreeBlock && chunk.octreeBlock.entries) {
            removeUnorderedListItem(chunk.octreeBlock.entries, sps.mesh)
        }
        if (sps && sps.mesh) sps.mesh.dispose()
        if (sps) sps.dispose()
        chunk._mergedObjectSPS = null
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
        var scene = chunk.noa.rendering.getScene()
        var objectMeshLookup = chunk.noa.registry._blockMesh
        var blockHandlerLookup = chunk.noa.registry._blockHandlers

        var x0 = chunk.i * chunk.size
        var y0 = chunk.j * chunk.size
        var z0 = chunk.k * chunk.size

        // remove the current (if any) sps/mesh
        removeCurrentSPS(chunk)

        // preprocess to build arrays of block object data, keyed by block mesh ID
        var hasObjects = false
        var shapeData = {}
        var hash = chunk._objectBlocks
        for (var key in hash) {
            var meshID = hash[key].id
            if (!shapeData[meshID]) shapeData[meshID] = []
            shapeData[meshID].push(hash[key])
            hasObjects = true
        }

        if (!hasObjects) return null // last object was removed

        // base SPS
        var sps = new BABYLON.SolidParticleSystem('merged_sps_' + chunk.id, scene, {
            updatable: false,
        })

        // for each set of shapes, create a builder function and add to the SPS
        var material
        for (var id in shapeData) {
            var mesh = objectMeshLookup[id]
            if (mesh.material) material = mesh.material

            // if (mesh.material && !mesh.material.name) console.log(mesh.name, mesh)

            var shapes = shapeData[id]
            var count = shapes.length
            var handlerFn
            var handlers = blockHandlerLookup[id]
            if (handlers) handlerFn = handlers.onCustomMeshCreate
            // jshint -W083
            var setShape = function (particle, partIndex, shapeIndex) {
                var dat = shapes[shapeIndex]
                // global positions for custom handler, if any
                particle.position.set(x0 + dat.x + 0.5, y0 + dat.y, z0 + dat.z + 0.5)
                if (handlerFn) handlerFn(particle, x0 + dat.x, y0 + dat.y, z0 + dat.z)
                // revert to local positions
                particle.position.x -= x0
                particle.position.y -= y0
                particle.position.z -= z0
            }
            sps.addShape(mesh, count, { positionFunction: setShape })
            shapes.length = 0
        }
        profile_hook('made SPS')

        // SPS now has all meshes
        var merged = sps.buildMesh()
        merged.material = material

        profile_hook('built mesh')

        merged.position.x = x0
        merged.position.y = y0
        merged.position.z = z0
        merged.freezeWorldMatrix()
        merged.freezeNormals()

        chunk.octreeBlock.entries.push(merged)

        chunk._mergedObjectSPS = sps

        profile_hook('end')
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

