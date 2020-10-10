import Engine, { Vector } from "../.."
import { IBaseComponentState, IComponentType } from "./componentType"
import * as vec3 from "gl-vec3"

interface IFollowsEntityState {
    entity: number;
    offset: Vector | null;
    onTargetMissing: (id: number) => void | null;
}

/*
 * Indicates that an entity should be moved to another entity's position each tick,
 * possibly by a fixed offset, and the same for renderPositions each render
 */
export function followsEntity(noa: Engine): IComponentType<IFollowsEntityState> {
    const engine = noa;
    
    function updatePosition(state: IFollowsEntityState & IBaseComponentState) {
        var id = state.__id
        var self = engine.ents.getPositionData(id)
        var other = engine.ents.getPositionData(state.entity)
        if (!other) {
            if (state.onTargetMissing) {
                state.onTargetMissing(id)
            }
            engine.ents.removeComponent(id, engine.ents.names.followsEntity)
        }
        else {
            vec3.add(self._localPosition, other._localPosition, state.offset!)
        }
    }
    
    function updateRenderPosition(state: IFollowsEntityState & IBaseComponentState) {
        var id = state.__id
        var self = engine.ents.getPositionData(id)
        var other = engine.ents.getPositionData(state.entity)
        if (other) {
            vec3.add(self._renderPosition, other._renderPosition, state.offset!)
        }
    }

    return {
        name: 'followsEntity',
        order: 50,
        state: {
            entity: 0 | 0,
            offset: null,
            onTargetMissing: () => {},
        },
        onAdd(eid, state) {
            var off = vec3.create()
            state.offset = (state.offset) ? vec3.copy(off, state.offset!) as Vector : off as Vector
            updatePosition(state)
            updateRenderPosition(state)
        },

        // on tick, copy over regular positions
        system(dt, states) {
            states.forEach(state => updatePosition(state))
        },

        // on render, copy over render positions
        renderSystem(dt, states) {
            states.forEach(state => updateRenderPosition(state))
        }
    }
}
