'use strict'


var removeUnorderedListItem = require('./util').removeUnorderedListItem


module.exports = new ObjectMesher()


// enable for profiling..
var PROFILE = 0




// helper class to hold data about a single object mesh
function ObjMeshDat(id, x, y, z, mesh) {
    this.id = id | 0
    this.x = x | 0
    this.y = y | 0
    this.z = z | 0
    this.mesh = mesh || null
}
ObjMeshDat.prototype.dispose = function () {
    this.mesh = null
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
        chunk._objectMeshes = {}
    }

    this.disposeChunk = function (chunk) {
        // dispose unmerged object meshes
        for (var s in chunk._objectMeshes) {
            var dat = chunk._objectMeshes[s]
            if (dat.mesh) dat.mesh.dispose()
        }
        chunk._objectMeshes = null
    }



    // accessors for the chunk to regester as object voxels are set/unset
    this.addObjectBlock = function (chunk, id, x, y, z) {
        var key = x + '|' + y + '|' + z
        chunk._objectMeshes[key] = new ObjMeshDat(id, x, y, z, null)
    }

    this.removeObjectBlock = function (chunk, x, y, z) {
        var key = x + '|' + y + '|' + z
        var dat = chunk._objectMeshes[key]
        if (!dat) return
        if (dat.mesh) {
            removeUnorderedListItem(chunk.octreeBlock.entries, dat.mesh)
            dat.mesh.dispose()
        }
        delete chunk._objectMeshes[key]
    }


    /*
     * 
     *    main implementation - re-creates all needed object mesh instances
     * 
    */


    this.processChunk = function (chunk) {

        var x0 = chunk.i * chunk.size
        var y0 = chunk.j * chunk.size
        var z0 = chunk.k * chunk.size
        var objectMeshLookup = chunk.noa.registry._blockMesh
        var blockHandlerLookup = chunk.noa.registry._blockHandlers

        var objHash = chunk._objectMeshes
        for (var s in objHash) {
            var dat = objHash[s]
            if (dat.mesh) continue // skip anything already built

            var srcMesh = objectMeshLookup[dat.id]
            // var mesh = srcMesh.createInstance('object mesh instance')
            var mesh = srcMesh.clone('object mesh instance')
            mesh.position.x = x0 + dat.x + 0.5
            mesh.position.y = y0 + dat.y
            mesh.position.z = z0 + dat.z + 0.5

            mesh.computeWorldMatrix(true)
            if (!mesh.billboardMode) {
                mesh.freezeWorldMatrix()
                mesh.freezeNormals()
            }

            // call custom handler to let it, say, rotate the mesh
            var handlers = blockHandlerLookup[dat.id]
            if (handlers && handlers.onCustomMeshCreate) {
                handlers.onCustomMeshCreate(mesh, x0 + dat.x, y0 + dat.y, z0 + dat.z)
            }

            // stuff necessary to add mesh to scene
            chunk.octreeBlock.entries.push(mesh)

            dat.mesh = mesh
        }




    }




}






