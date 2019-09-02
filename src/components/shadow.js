'use strict'

import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { Color3 } from '@babylonjs/core/Maths/math'
var vec3 = require('gl-vec3')


export default function (noa, dist) {

    var shadowDist = dist

    // create a mesh to re-use for shadows
    var scene = noa.rendering.getScene()
    var disc = Mesh.CreateDisc('shadow', 0.75, 30, scene)
    disc.rotation.x = Math.PI / 2
    disc.material = noa.rendering.makeStandardMaterial('shadowMat')
    disc.material.diffuseColor = Color3.Black()
    disc.material.ambientColor = Color3.Black()
    disc.material.alpha = 0.5
    disc.setEnabled(false)

    // source mesh needn't be in the scene graph
    scene.removeMesh(disc)


    return {

        name: 'shadow',

        order: 80,

        state: {
            size: 0.5,
            _mesh: null,
        },


        onAdd: function (eid, state) {
            state._mesh = noa.rendering.makeMeshInstance(disc, false)
        },


        onRemove: function (eid, state) {
            state._mesh.dispose()
        },


        system: function shadowSystem(dt, states) {
            var cpos = noa.camera.getLocalPosition()
            var dist = shadowDist
            states.forEach(state => {
                updateShadowHeight(state.__id, state._mesh, state.size, dist, cpos, noa)
            })
        },


        renderSystem: function (dt, states) {
            // before render adjust shadow x/z to render positions
            states.forEach(state => {
                var rpos = noa.ents.getPositionData(state.__id).renderPosition
                var spos = state._mesh.position
                spos.x = rpos[0]
                spos.z = rpos[2]
            })
        }




    }
}

var shadowPos = vec3.fromValues(0, 0, 0)

function updateShadowHeight(id, mesh, size, shadowDist, camPos, noa) {
    var ents = noa.entities
    var dat = ents.getPositionData(id)
    var loc = dat.localPosition
    var y

    // find Y location, from physics if on ground, otherwise by testing voxels
    if (ents.hasPhysics(id) && ents.getPhysicsBody(id).resting[1] < 0) {
        y = dat.renderPosition[1]
    } else {
        var gloc = []
        noa.localToGlobal(loc, gloc)
        for (var i = 0; i < shadowDist; i++) {
            gloc[1] -= 1
            var solid = noa.world.getBlockSolidity(gloc[0], gloc[1], gloc[2])
            if (solid) break
        }
        if (i >= shadowDist) {
            mesh.setEnabled(false)
            return
        }
        y = Math.floor(loc[1] - i)
    }

    y = Math.round(y) // pick results get slightly countersunk
    // set shadow slightly above ground to avoid z-fighting
    vec3.set(shadowPos, mesh.position.x, y, mesh.position.z)
    var sqdist = vec3.squaredDistance(camPos, shadowPos)
    // offset ~ 0.01 for nearby shadows, up to 0.1 at distance of ~40
    var offset = 0.01 + 0.1 * (sqdist / 1600)
    if (offset > 0.1) offset = 0.1
    mesh.position.y = y + offset
    // set shadow scale
    var dist = loc[1] - y
    var scale = size * 0.7 * (1 - dist / shadowDist)
    mesh.scaling.copyFromFloats(scale, scale, scale)
    mesh.setEnabled(true)
}
