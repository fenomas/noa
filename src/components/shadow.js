
import vec3 from 'gl-vec3'

import { Color3 } from '@babylonjs/core/Maths/math.color'
import { CreateDisc } from '@babylonjs/core/Meshes/Builders/discBuilder'
import '@babylonjs/core/Meshes/instancedMesh'


/** @param {import('../index').Engine} noa  */
export default function (noa, distance = 10) {

    var shadowDist = distance

    // create a mesh to re-use for shadows
    var scene = noa.rendering.getScene()
    var disc = CreateDisc('shadow', { radius: 0.75, tessellation: 30 }, scene)
    disc.rotation.x = Math.PI / 2
    var mat = noa.rendering.makeStandardMaterial('shadow_component_mat')
    mat.diffuseColor.set(0, 0, 0)
    mat.ambientColor.set(0, 0, 0)
    mat.alpha = 0.5
    disc.material = mat
    mat.freeze()

    // source mesh needn't be in the scene graph
    noa.rendering.setMeshVisibility(disc, false)


    return {

        name: 'shadow',

        order: 80,

        state: {
            size: 0.5,
            _mesh: null,
        },


        onAdd: function (eid, state) {
            var mesh = disc.createInstance('shadow_instance')
            noa.rendering.addMeshToScene(mesh)
            mesh.setEnabled(false)
            state._mesh = mesh
        },


        onRemove: function (eid, state) {
            state._mesh.dispose()
            state._mesh = null
        },


        system: function shadowSystem(dt, states) {
            var cpos = noa.camera._localGetPosition()
            var dist = shadowDist
            for (var i = 0; i < states.length; i++) {
                var state = states[i]
                var posState = noa.ents.getPositionData(state.__id)
                var physState = noa.ents.getPhysics(state.__id)
                updateShadowHeight(noa, posState, physState, state._mesh, state.size, dist, cpos)
            }
        },


        renderSystem: function (dt, states) {
            // before render adjust shadow x/z to render positions
            for (var i = 0; i < states.length; i++) {
                var state = states[i]
                var rpos = noa.ents.getPositionData(state.__id)._renderPosition
                var spos = state._mesh.position
                spos.x = rpos[0]
                spos.z = rpos[2]
            }
        }




    }
}

var shadowPos = vec3.fromValues(0, 0, 0)
var down = vec3.fromValues(0, -1, 0)

function updateShadowHeight(noa, posDat, physDat, mesh, size, shadowDist, camPos) {

    // local Y ground position - from physics or raycast
    var localY
    if (physDat && physDat.body.resting[1] < 0) {
        localY = posDat._localPosition[1]
    } else {
        var res = noa._localPick(posDat._localPosition, down, shadowDist)
        if (!res) {
            mesh.setEnabled(false)
            return
        }
        localY = res.position[1] - noa.worldOriginOffset[1]
    }

    // round Y pos and offset upwards slightly to avoid z-fighting
    localY = Math.round(localY)
    vec3.copy(shadowPos, posDat._localPosition)
    shadowPos[1] = localY
    var sqdist = vec3.squaredDistance(camPos, shadowPos)
    // offset ~ 0.01 for nearby shadows, up to 0.1 at distance of ~40
    var offset = 0.01 + 0.1 * (sqdist / 1600)
    if (offset > 0.1) offset = 0.1
    mesh.position.y = localY + offset
    // set shadow scale
    var dist = posDat._localPosition[1] - localY
    var scale = size * 0.7 * (1 - dist / shadowDist)
    mesh.scaling.copyFromFloats(scale, scale, scale)
    mesh.setEnabled(true)
}
