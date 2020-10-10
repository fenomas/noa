
export interface IBaseComponentState {
    __id: number;
}

export interface IComponentType<StateType = any> {
    name: string;
    order: number;
    state: StateType;
    onAdd?: (eid: number, state: StateType & IBaseComponentState) => void;
    onRemove?: (eid: number, state: StateType & IBaseComponentState) => void;
    system?: (dt: number, state: (StateType & IBaseComponentState)[]) => void;
    renderSystem?: (dt: number, state: (StateType & IBaseComponentState)[]) => void;
}