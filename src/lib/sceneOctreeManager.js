/** @internal */ /** works around typedoc bug #842 */

import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { Octree } from '@babylonjs/core/Culling/Octrees/octree'
import { OctreeBlock } from '@babylonjs/core/Culling/Octrees/octreeBlock'
import { OctreeSceneComponent } from '@babylonjs/core/Culling/Octrees/'

import { locationHasher, removeUnorderedListItem } from './util'


/*
 * 
 * 
 * 
 *          simple class to manage scene octree and octreeBlocks
 * 
 * 
 * 
*/

export class SceneOctreeManager {

    /** @internal */
    constructor(rendering, blockSize) {
        var scene = rendering._scene
        scene._addComponent(new OctreeSceneComponent(scene))

        // the root octree object
        var octree = new Octree(NOP)
        scene._selectionOctree = octree
        octree.blocks = []
        var octBlocksHash = {}


        /*
         * 
         *          public API
         * 
        */

        this.rebase = (offset) => { recurseRebaseBlocks(octree, offset) }
        this.includesMesh = (mesh) => {
            return (mesh._noaContainingBlock || mesh._noaIsDynamicContent)
        }

        this.addMesh = (mesh, isStatic, pos, chunk) => {
            if (!isStatic) {
                mesh._noaIsDynamicContent = true
                octree.dynamicContent.push(mesh)
                return
            }
            // octreeBlock-space integer coords of mesh position, and hashed key
            var ci = Math.floor(pos[0] / bs)
            var cj = Math.floor(pos[1] / bs)
            var ck = Math.floor(pos[2] / bs)
            var mapKey = locationHasher(ci, cj, ck)

            // get or create octreeBlock
            var block = octBlocksHash[mapKey]
            if (!block) {
                // lower corner of new octree block position, in global/local
                var gloc = [ci * bs, cj * bs, ck * bs]
                var loc = [0, 0, 0]
                rendering.noa.globalToLocal(gloc, null, loc)
                // make the new octree block and store it
                block = makeOctreeBlock(loc, bs)
                octree.blocks.push(block)
                octBlocksHash[mapKey] = block
                block._noaMapKey = mapKey
            }

            // do the actual adding logic
            block.entries.push(mesh)
            mesh._noaContainingBlock = block

            // rely on octrees for selection, skipping bounds checks
            mesh.alwaysSelectAsActiveMesh = true
        }

        this.removeMesh = (mesh) => {
            if (mesh._noaIsDynamicContent) {
                mesh._noaIsDynamicContent = null
                removeUnorderedListItem(octree.dynamicContent, mesh)
            }
            if (mesh._noaContainingBlock) {
                mesh._noaContainingChunk = null
                var block = mesh._noaContainingBlock
                removeUnorderedListItem(block.entries, mesh)
                if (block.entries.length === 0) {
                    delete octBlocksHash[block._noaMapKey]
                    removeUnorderedListItem(octree.blocks, block)
                }
            }
        }

        /*
         * 
         *          internals
         * 
        */

        var NOP = () => { }
        var bs = blockSize * rendering.noa.world.chunkSize

        var recurseRebaseBlocks = (parent, offset) => {
            parent.blocks.forEach(child => {
                child.minPoint.subtractInPlace(offset)
                child.maxPoint.subtractInPlace(offset)
                child._boundingVectors.forEach(v => v.subtractInPlace(offset))
                if (child.blocks) recurseRebaseBlocks(child, offset)
            })
        }

        var makeOctreeBlock = (minPt, size) => {
            var min = new Vector3(minPt[0], minPt[1], minPt[2])
            var max = new Vector3(minPt[0] + size, minPt[1] + size, minPt[2] + size)
            return new OctreeBlock(min, max, undefined, undefined, undefined, NOP)
        }

    }

}
