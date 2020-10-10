import Engine, { Mesh, Vector } from "../.."
import * as vec3 from "gl-vec3"
import { IComponentType } from "./componentType"

interface IMeshState {
    mesh: Mesh;
    offset: Vector;
}

export function mesh(noa: Engine): IComponentType<IMeshState> {
    return {
        name: 'mesh',
        order: 100,
        state: {
            mesh: null,
            offset: null as any
        },
        onAdd(eid, state) {
            // implicitly assume there's already a position component
            var posDat = noa.ents.getPositionData(eid)
            if (state.mesh) {
                noa.rendering.addMeshToScene(state.mesh, false, posDat.position)
            }
            else {
                throw new Error('Mesh component added without a mesh - probably a bug!')
            }

            if (!state.offset) {
                state.offset = vec3.create() as Vector
            }

            // set mesh to correct position
            var rpos = posDat._renderPosition
            state.mesh.position.copyFromFloats(
                rpos[0] + state.offset[0],
                rpos[1] + state.offset[1],
                rpos[2] + state.offset[2])
        },
        onRemove(eid, state) {
            state.mesh.dispose()
        },
        renderSystem(dt, states) {
            // before render move each mesh to its render position, 
            // set by the physics engine or driving logic
            states.forEach(state => {
                var id = state.__id

                var rpos = noa.ents.getPositionData(id)._renderPosition
                state.mesh.position.copyFromFloats(
                    rpos[0] + state.offset[0],
                    rpos[1] + state.offset[1],
                    rpos[2] + state.offset[2])
            })
        }
    }
}
