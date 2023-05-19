
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { Octree } from '@babylonjs/core/Culling/Octrees/octree'
import { OctreeBlock } from '@babylonjs/core/Culling/Octrees/octreeBlock'
import { OctreeSceneComponent } from '@babylonjs/core/Culling/Octrees/octreeSceneComponent'

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

/** @internal */
export class SceneOctreeManager {

    /** @internal */
    constructor(rendering, blockSize) {
        var scene = rendering.scene
        scene._addComponent(new OctreeSceneComponent(scene))

        // mesh metadata flags
        var octreeBlock = 'noa_octree_block'
        var inDynamicList = 'noa_in_dynamic_list'
        var inOctreeBlock = 'noa_in_octree_block'

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

        this.addMesh = (mesh, isStatic, pos, chunk) => {
            if (!mesh.metadata) mesh.metadata = {}

            // dynamic content is just rendered from a list on the octree
            if (!isStatic) {
                if (mesh.metadata[inDynamicList]) return
                octree.dynamicContent.push(mesh)
                mesh.metadata[inDynamicList] = true
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
            mesh.metadata[octreeBlock] = block
            mesh.metadata[inOctreeBlock] = true

            // rely on octrees for selection, skipping bounds checks
            mesh.alwaysSelectAsActiveMesh = true
        }



        this.removeMesh = (mesh) => {
            if (!mesh.metadata) return

            if (mesh.metadata[inDynamicList]) {
                removeUnorderedListItem(octree.dynamicContent, mesh)
                mesh.metadata[inDynamicList] = false
            }
            if (mesh.metadata[inOctreeBlock]) {
                var block = mesh.metadata[octreeBlock]
                if (block && block.entries) {
                    removeUnorderedListItem(block.entries, mesh)
                    if (block.entries.length === 0) {
                        delete octBlocksHash[block._noaMapKey]
                        removeUnorderedListItem(octree.blocks, block)
                    }
                }
                mesh.metadata[octreeBlock] = null
                mesh.metadata[inOctreeBlock] = false
            }
        }



        // experimental helper
        this.setMeshVisibility = (mesh, visible = false) => {
            if (mesh.metadata[octreeBlock]) {
                // mesh is static
                if (mesh.metadata[inOctreeBlock] === visible) return
                var block = mesh.metadata[octreeBlock]
                if (block && block.entries) {
                    if (visible) {
                        block.entries.push(mesh)
                    } else {
                        removeUnorderedListItem(block.entries, mesh)
                    }
                }
                mesh.metadata[inOctreeBlock] = visible
            } else {
                // mesh is dynamic
                if (mesh.metadata[inDynamicList] === visible) return
                if (visible) {
                    octree.dynamicContent.push(mesh)
                } else {
                    removeUnorderedListItem(octree.dynamicContent, mesh)
                }
                mesh.metadata[inDynamicList] = visible
            }
        }

        /*
         * 
         *          internals
         * 
        */

        var NOP = () => { }
        var bs = blockSize * rendering.noa.world._chunkSize

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
