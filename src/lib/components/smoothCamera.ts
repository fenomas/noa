import Engine from "../.."
import { IComponentType } from "./componentType"

export function smoothCamera(noa: Engine): IComponentType<{ time: number }> {
    return {
        name: 'smooth-camera',
        order: 99,
        state: {
            time: 100.1
        },
        system(dt, states) {
            // remove self after time elapses
            states.forEach(state => {
                state.time -= dt
                if (state.time < 0) noa.ents.removeComponent(state.__id, 'smooth-camera')
            })
        }
    }
}
